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
  RotatePlanetMessage,
  SetBiomeMessage,
  StartGameMessage,
  UsersMessage
} from "@gaia/shared";
import PartySocket from "partysocket";
import { useCallback, useEffect, useRef, useState } from "react";
import { getOrCreateClientId } from "../utils/clientId";

export function createPartyClient(room: string, host: string) {
  return new PartySocket({
    host,
    room,
  });
}

// Configuration PartyKit
const PARTYKIT_HOST = process.env.EXPO_PUBLIC_PARTYKIT_HOST || "10.137.97.42:1999";
// const PARTYKIT_HOST = process.env.EXPO_PUBLIC_PARTYKIT_HOST || "127.0.0.1:1999";

interface UsePlanetSyncOptions {
  room: string;
  onBiomeUpdate?: (tileIndex: number, biome: BiomeData) => void;
  canSendUpdate?: () => boolean;
  onPlacementError?: (tileIndex: number, message: string) => void;
  onGameStart?: (startTimestamp: number, gameDuration: number) => void; // Callback (message START_GAME)
}

interface UsePlanetSyncReturn {
  tileBiomes: Record<number, BiomeData>;
  sendBiomeUpdate: (tileIndex: number, biome: BiomeData) => void;
  sendPlanetRotation: (velocityX: number, velocityY: number) => void;
  resetPlanet: () => void;
  startGame: () => void;
  isConnected: boolean;
  stats: PlanetStatsData | null;
  assignedTiles: number[] | null;
  playerColor: string | null; // Couleur du joueur reçue du serveur
  isHost: boolean;
  users: Array<{ id: string; name: string; isHost: boolean }>;
  totalUsers: number;
  clientId: string | null;
}

/**
 * Hook pour synchroniser l'état de la planète via PartyKit
 */
export function usePlanetSync({ room, onBiomeUpdate, canSendUpdate, onPlacementError, onGameStart }: UsePlanetSyncOptions): UsePlanetSyncReturn {
  const [tileBiomes, setTileBiomes] = useState<Record<number, BiomeData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [planetStats, setPlanetStats] = useState<PlanetStatsData | null>(null);
  const [assignedTiles, setAssignedTiles] = useState<number[] | null>(null);
  const [playerColor, setPlayerColor] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string; isHost: boolean }>>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const socketRef = useRef<PartySocket | null>(null);
  const clientIdRef = useRef<string | null>(null);

  const onBiomeUpdateRef = useRef(onBiomeUpdate);
  const onPlacementErrorRef = useRef(onPlacementError);
  const onGameStartRef = useRef(onGameStart);

  useEffect(() => {
    onBiomeUpdateRef.current = onBiomeUpdate;
    onPlacementErrorRef.current = onPlacementError;
    onGameStartRef.current = onGameStart;
  }, [onBiomeUpdate, onPlacementError, onGameStart]);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    if (!room) {
      return;
    }

    let mounted = true;

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

      if (!clientIdRef.current) {
        clientIdRef.current = await getOrCreateClientId();
      }

      const clientType = 'mobile';

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

        // Réception de l'état complet
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
          onBiomeUpdateRef.current?.(data.tileIndex, data.biome);
          return;
        }

        // Réception d'un reset de la planète
        if (isResetPlanetMessage(data)) {
          setTileBiomes({});
          setAssignedTiles(null);
          setPlayerColor(null);
          if (data.stats) {
            setPlanetStats(data.stats);
          }
          return;
        }

        // Réception du rôle (host ou non)
        if (data.type === 'role') {
          const roleMsg = data as RoleMessage;
          setIsHost((prevIsHost) => {
            if (prevIsHost !== roleMsg.isHost) {
              return roleMsg.isHost;
            }
            return prevIsHost;
          });
          return;
        }

        // Réception de la liste des utilisateurs
        if (data.type === 'users') {
          const usersMsg = data as UsersMessage;
          // Éviter les mises à jour inutiles si les utilisateurs n'ont pas changé
          setUsers((prevUsers) => {
            const prevUsersStr = JSON.stringify(prevUsers.map(u => ({ id: u.id, isHost: u.isHost })));
            const newUsersStr = JSON.stringify(usersMsg.users.map(u => ({ id: u.id, isHost: u.isHost })));
            if (prevUsersStr !== newUsersStr) {
              return usersMsg.users;
            }
            return prevUsers; // Pas de changement, garder la référence précédente
          });
          setTotalUsers((prevTotal) => {
            if (prevTotal !== usersMsg.users.length) {
              return usersMsg.users.length;
            }
            return prevTotal;
          });
          return;
        }

        // Réception de l'assignation de tuiles
        if (isTileAssignmentMessage(data)) {
          setAssignedTiles(data.assignedTiles);
          setTotalUsers(data.totalUsers);
          setPlayerColor(data.playerColor);
          return;
        }

        // Réception d'une erreur de placement
        if (isPlacementErrorMessage(data)) {
          console.warn(`[PartyKit] Erreur de placement: ${data.message} (tuile ${data.tileIndex})`);
          onPlacementErrorRef.current?.(data.tileIndex, data.message);
          return;
        }

        // Réception du signal de démarrage du jeu
        if (isStartGameMessage(data)) {
          const startGameMsg = data as StartGameMessage;
          onGameStartRef.current?.(startGameMsg.startTimestamp, startGameMsg.gameDuration);
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
  }, [room]); // Retirer les callbacks des dépendances pour éviter les reconnexions

  const sendBiomeUpdate = useCallback((tileIndex: number, biome: BiomeData) => {
    if (canSendUpdate && !canSendUpdate()) {
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

  const sendPlanetRotation = useCallback((velocityX: number, velocityY: number) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: RotatePlanetMessage = {
      type: 'ROTATE_PLANET',
      velocityX,
      velocityY,
    };

    socketRef.current.send(JSON.stringify(message));
  }, []);


  const resetPlanet = useCallback(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
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
    sendPlanetRotation,
    resetPlanet,
    startGame,
    isConnected,
    stats: planetStats,
    assignedTiles,
    playerColor,
    isHost,
    users,
    totalUsers,
    clientId: clientIdRef.current,
  };
}
