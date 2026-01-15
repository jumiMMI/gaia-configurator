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
import { getOrCreateClientId } from "../utils/clientId";

export function createPartyClient(room: string, host: string) {
  return new PartySocket({
    host,
    room,
  });
}

// Configuration PartyKit
const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST || "10.137.101.69:1999";

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
  roleReceived: boolean; // Indique si le rôle a été reçu du serveur
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
  const [roleReceived, setRoleReceived] = useState(false); // Indique si le rôle a été reçu
  const [users, setUsers] = useState<Array<{ id: string; name: string; isHost: boolean }>>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const socketRef = useRef<PartySocket | null>(null);
  const clientIdRef = useRef<string | null>(null);
  const roleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roleReceivedRef = useRef<boolean>(false);
  
  // Stocker les callbacks dans des refs pour éviter les reconnexions
  const onBiomeUpdateRef = useRef(onBiomeUpdate);
  const onPlacementErrorRef = useRef(onPlacementError);
  const onGameStartRef = useRef(onGameStart);
  
  // Mettre à jour les refs quand les callbacks changent
  useEffect(() => {
    onBiomeUpdateRef.current = onBiomeUpdate;
    onPlacementErrorRef.current = onPlacementError;
    onGameStartRef.current = onGameStart;
  }, [onBiomeUpdate, onPlacementError, onGameStart]);

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
      // Sur web-react, on est toujours web
      const clientType = 'web';
      
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

      // Timeout pour détecter si le rôle n'arrive pas après 2 secondes
      roleTimeoutRef.current = setTimeout(() => {
        if (!roleReceivedRef.current) {
          // Sur web-react, on est toujours web, donc on devient host par défaut
          setIsHost(true);
          setRoleReceived(true);
          roleReceivedRef.current = true;
        }
      }, 2000);
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
          onBiomeUpdateRef.current?.(data.tileIndex, data.biome);
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
          
          // Si le hostId dans le message correspond à notre clientId, on est le host
          // Sinon, on ignore le message (il est destiné à un autre client ou il y a une erreur)
          const isMeHost = roleMsg.hostId === clientIdRef.current;
          
          if (isMeHost) {
            setIsHost(true);
            setRoleReceived(true);
            roleReceivedRef.current = true;
          } else if (roleMsg.hostId && clientIdRef.current) {
            // Le hostId est différent, donc on n'est pas le host
            setIsHost(false);
            // On ne met pas roleReceived à true ici car ce message pourrait être destiné à un autre client
          }
          
          // Annuler le timeout si le rôle arrive et qu'on a un hostId valide
          if (roleTimeoutRef.current && roleMsg.hostId) {
            clearTimeout(roleTimeoutRef.current);
            roleTimeoutRef.current = null;
          }
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
          onPlacementErrorRef.current?.(data.tileIndex, data.message);
          return;
        }

        // Réception du signal de démarrage du jeu
        if (isStartGameMessage(data)) {
          onGameStartRef.current?.();
          return;
        }
      } catch {
        // Message non-JSON
      }
    };

    // Cleanup 
    return () => {
      mounted = false;
      if (roleTimeoutRef.current) {
        clearTimeout(roleTimeoutRef.current);
        roleTimeoutRef.current = null;
      }
      // Ne fermer la socket que si elle existe et n'est pas déjà fermée
      if (socketRef.current) {
        // Vérifier l'état avant de fermer pour éviter les erreurs
        if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
          socketRef.current.close();
        }
        socketRef.current = null;
      }
      setRoleReceived(false); // Réinitialiser pour la prochaine connexion
      roleReceivedRef.current = false;
    };
  }, [room]); // Retirer les callbacks des dépendances pour éviter les reconnexions multiples

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

    setTileBiomes((prev) => ({
      ...prev,
      [tileIndex]: biome,
    }));
  }, [canSendUpdate]);


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
    resetPlanet,
    startGame,
    isConnected,
    stats: planetStats,
    assignedTiles,
    isHost,
    roleReceived,
    users,
    totalUsers,
  };
}

