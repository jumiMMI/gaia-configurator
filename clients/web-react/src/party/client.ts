import {
  BiomeData,
  isAllTileAssignmentsMessage,
  isPlacementErrorMessage,
  isResetPlanetMessage,
  isRotatePlanetMessage,
  isSetBiomeMessage,
  isStartGameMessage,
  isSyncStateMessage,
  isTileAssignmentMessage,
  PlanetStatsData,
  PlayerZone,
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
const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST || "10.137.97.63:1999";

interface UsePlanetSyncOptions {
  room: string;
  onBiomeUpdate?: (tileIndex: number, biome: BiomeData) => void;
  canSendUpdate?: () => boolean; 
  onPlacementError?: (tileIndex: number, message: string) => void;
  onGameStart?: (startTimestamp: number, gameDuration: number) => void; // Callback (message START_GAME)
  onPlanetRotation?: (velocityX: number, velocityY: number) => void; // Callback (message ROTATE_PLANET)
}

interface UsePlanetSyncReturn {
  tileBiomes: Record<number, BiomeData>;
  sendBiomeUpdate: (tileIndex: number, biome: BiomeData) => void;
  resetPlanet: () => void;
  startGame: () => void; 
  isConnected: boolean;
  stats: PlanetStatsData | null;
  assignedTiles: number[] | null; 
  playerColor: string | null;
  playerZones: PlayerZone[] | null; // Toutes les zones de tous les joueurs (pour le host)
  isHost: boolean;
  roleReceived: boolean; // Indique si le rôle a été reçu du serveur
  users: Array<{ id: string; name: string; isHost: boolean }>; 
  totalUsers: number;
}

/**
 * Hook pour synchroniser l'état de la planète via PartyKit
 */
export function usePlanetSync({ room, onBiomeUpdate, canSendUpdate, onPlacementError, onGameStart, onPlanetRotation }: UsePlanetSyncOptions): UsePlanetSyncReturn {
  const [tileBiomes, setTileBiomes] = useState<Record<number, BiomeData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [planetStats, setPlanetStats] = useState<PlanetStatsData | null>(null);
  const [assignedTiles, setAssignedTiles] = useState<number[] | null>(null);
  const [playerColor, setPlayerColor] = useState<string | null>(null);
  const [playerZones, setPlayerZones] = useState<PlayerZone[] | null>(null);
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
  const onPlanetRotationRef = useRef(onPlanetRotation);
  
  // Mettre à jour les refs quand les callbacks changent
  useEffect(() => {
    onBiomeUpdateRef.current = onBiomeUpdate;
    onPlacementErrorRef.current = onPlacementError;
    onGameStartRef.current = onGameStart;
    onPlanetRotationRef.current = onPlanetRotation;
  }, [onBiomeUpdate, onPlacementError, onGameStart, onPlanetRotation]);

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
      
      if (!clientIdRef.current) {
        clientIdRef.current = await getOrCreateClientId();
      }
      
      const clientType = 'web';
      
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
        
        // DEBUG: Log tous les messages reçus
        console.log('[CLIENT WEB] Message received, type:', data.type);

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
          setPlayerColor(null);
          setPlayerZones(null);
          if (data.stats) {
            setPlanetStats(data.stats);
          }
          return;
        }

        // Réception d'un message de rotation de la planète
        if (isRotatePlanetMessage(data)) {
          const rotateMsg = data as RotatePlanetMessage;
          onPlanetRotationRef.current?.(rotateMsg.velocityX, rotateMsg.velocityY);
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

        // Réception de l'assignation de tuiles (pour les joueurs mobiles)
        if (isTileAssignmentMessage(data)) {
          setAssignedTiles(data.assignedTiles);
          setTotalUsers(data.totalUsers);
          setPlayerColor(data.playerColor);
          return;
        }

        // Réception de toutes les zones de tous les joueurs (pour le host web)
        if (isAllTileAssignmentsMessage(data)) {
          setPlayerZones(data.playerZones);
          setTotalUsers(data.totalUsers);
          return;
        }

        // une erreur de placement
        if (isPlacementErrorMessage(data)) {
          onPlacementErrorRef.current?.(data.tileIndex, data.message);
          return;
        }

        // start game
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
      if (roleTimeoutRef.current) {
        clearTimeout(roleTimeoutRef.current);
        roleTimeoutRef.current = null;
      }
      
      if (socketRef.current) {
        
        if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
          socketRef.current.close();
        }
        socketRef.current = null;
      }
      setRoleReceived(false); 
      roleReceivedRef.current = false;
    };
  }, [room]); 

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
    playerColor,
    playerZones,
    isHost,
    roleReceived,
    users,
    totalUsers,
  };
}

