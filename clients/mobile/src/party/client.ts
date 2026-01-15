import {
  BiomeData,
  isPlacementErrorMessage,
  isResetPlanetMessage,
  isSetBiomeMessage,
  isStartGameMessage,
  isSyncStateMessage,
  isTileAssignmentMessage,
  PlanetStatsData,
  ResetPlanetMessage,
  RoleMessage,
  SetBiomeMessage,
  StartGameMessage,
  UsersMessage
} from "@gaia/shared";
import PartySocket from "partysocket";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { getOrCreateClientId } from "../utils/clientId";

export function createPartyClient(room: string, host: string) {
  return new PartySocket({
    host,
    room,
  });
}

// Configuration PartyKit
const PARTYKIT_HOST = process.env.EXPO_PUBLIC_PARTYKIT_HOST || "10.137.97.63:1999";

interface UsePlanetSyncOptions {
  room: string;
  onBiomeUpdate?: (tileIndex: number, biome: BiomeData) => void;
  canSendUpdate?: () => boolean; 
  onPlacementError?: (tileIndex: number, message: string) => void;
  onGameStart?: () => void; // Callback (message START_GAME)
}

interface UsePlanetSyncReturn {
  tileBiomes: Record<number, BiomeData>;
  sendBiomeUpdate: (tileIndex: number, biome: BiomeData) => void;
  resetPlanet: () => void;
  startGame: () => void; 
  isConnected: boolean;
  stats: PlanetStatsData | null;
  assignedTiles: number[] | null; 
  isHost: boolean;
  users: Array<{ id: string; name: string; isHost: boolean }>; 
  totalUsers: number;
}

/**
 * Hook pour synchroniser l'état de la planète via PartyKit
 */
export function usePlanetSync({ room, onBiomeUpdate, canSendUpdate, onPlacementError, onGameStart }: UsePlanetSyncOptions): UsePlanetSyncReturn {
  const [tileBiomes, setTileBiomes] = useState<Record<number, BiomeData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [planetStats, setPlanetStats] = useState<PlanetStatsData | null>(null);
  const [assignedTiles, setAssignedTiles] = useState<number[] | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string; isHost: boolean }>>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const socketRef = useRef<PartySocket | null>(null);
  const clientIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    // Récupérer ou créer l'ID client persistant
    const initClientId = async () => {
      const clientId = await getOrCreateClientId();
      if (mounted) {
        clientIdRef.current = clientId;
      }
    };
    initClientId();

    // connexion WebSocket
    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room,
    });

    socketRef.current = socket;

    socket.onopen = async () => {
      setIsConnected(true);
      
      // S'assurer qu'on a l'ID client
      if (!clientIdRef.current) {
        clientIdRef.current = await getOrCreateClientId();
      }
      
      // Envoyer le type de client (web ou mobile) au serveur avec l'ID persistant
      const isWeb = Platform.OS === 'web' || typeof window !== 'undefined';
      const clientType = isWeb ? 'web' : 'mobile';
      
      // Attendre un court délai pour s'assurer que la connexion est bien établie
      setTimeout(() => {
        const message = JSON.stringify({
          type: 'CLIENT_INFO',
          clientType: clientType,
          clientId: clientIdRef.current,
        });
        if (socket.readyState === WebSocket.OPEN && clientIdRef.current) {
          socket.send(message);
        }
      }, 100);
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Réception de l'état complet (à la connexion)
        if (isSyncStateMessage(data)) {
          setTileBiomes(data.tileBiomes);
          if (data.stats) {
            setPlanetStats(data.stats);
          }
          return;
        }

        // Réception d'une mise à jour de biome
        if (isSetBiomeMessage(data)) {
          setTileBiomes((prev) => ({
            ...prev,
            [data.tileIndex]: data.biome,
          }));
          if (data.stats) {
            setPlanetStats(data.stats);
          }
          onBiomeUpdate?.(data.tileIndex, data.biome);
          return;
        }

        // Réception d'un reset de la planète
        if (isResetPlanetMessage(data)) {
          setTileBiomes({});
          setAssignedTiles(null);
          if (data.stats) {
            setPlanetStats(data.stats);
          }
          return;
        }

        // Réception du rôle (host ou non)
        if (data.type === 'role') {
          const roleMsg = data as RoleMessage;
          setIsHost(roleMsg.isHost);
          return;
        }

        // Réception de la liste des utilisateurs
        if (data.type === 'users') {
          const usersMsg = data as UsersMessage;
          setUsers(usersMsg.users);
          setTotalUsers(usersMsg.users.length);
          return;
        }

        // Réception de l'assignation de tuiles
        if (isTileAssignmentMessage(data)) {
          setAssignedTiles(data.assignedTiles);
          setTotalUsers(data.totalUsers);
          return;
        }

        // Réception d'une erreur de placement
        if (isPlacementErrorMessage(data)) {
          console.warn(`[PartyKit] Erreur de placement: ${data.message} (tuile ${data.tileIndex})`);
          onPlacementError?.(data.tileIndex, data.message);
          return;
        }

        // Réception du signal de démarrage du jeu
        if (isStartGameMessage(data)) {
          onGameStart?.();
          return;
        }
      } catch {
        // Message non-JSON
      }
    };

    // Cleanup 
    return () => {
      mounted = false;
      socket.close();
      socketRef.current = null;
    };
  }, [room, onBiomeUpdate, onPlacementError, onGameStart]);

  const sendBiomeUpdate = useCallback((tileIndex: number, biome: BiomeData) => {
    if (canSendUpdate && !canSendUpdate()) {
      // console.warn("[PartyKit] Placement de biomes désactivé (jeu terminé)");
      return;
    }

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: SetBiomeMessage = {
      type: 'SET_BIOME',
      tileIndex,
      biome,
    };

    socketRef.current.send(JSON.stringify(message));
    // console.log(`[PartyKit] SET_BIOME envoyé: tuile ${tileIndex} → ${biome.nom}`);

    setTileBiomes((prev) => ({
      ...prev,
      [tileIndex]: biome,
    }));
  }, [canSendUpdate]);


  const resetPlanet = useCallback(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      // console.warn("[PartyKit] Impossible d'envoyer: non connecté");
      return;
    }

    const message: ResetPlanetMessage = {
      type: 'RESET_PLANET',
    };

    socketRef.current.send(JSON.stringify(message));

  }, []);

  const startGame = useCallback(() => {
    if (!isHost) {
      return;
    }

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: StartGameMessage = {
      type: 'START_GAME',
    };

    socketRef.current.send(JSON.stringify(message));
  }, [isHost]);

  return {
    tileBiomes,
    sendBiomeUpdate,
    resetPlanet,
    startGame,
    isConnected,
    stats: planetStats,
    assignedTiles,
    isHost,
    users,
    totalUsers,
  };
}
