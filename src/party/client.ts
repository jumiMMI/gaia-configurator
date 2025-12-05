import PartySocket from "partysocket";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BiomeData,
  PlanetStatsData,
  ResetPlanetMessage,
  SetBiomeMessage,
  isResetPlanetMessage,
  isSetBiomeMessage,
  isSyncStateMessage
} from "./messages";

export function createPartyClient(room: string, host: string) {
  return new PartySocket({
    host,
    room,
  });
}

// Configuration PartyKit
const PARTYKIT_HOST = process.env.EXPO_PUBLIC_PARTYKIT_HOST || "10.137.96.222:1999";

interface UsePlanetSyncOptions {
  room: string;
  onBiomeUpdate?: (tileIndex: number, biome: BiomeData) => void;
}

interface UsePlanetSyncReturn {
  tileBiomes: Record<number, BiomeData>;
  sendBiomeUpdate: (tileIndex: number, biome: BiomeData) => void;
  resetPlanet: () => void;
  isConnected: boolean;
  stats: PlanetStatsData | null;
}

/**
 * Hook pour synchroniser l'état de la planète via PartyKit
 */
export function usePlanetSync({ room, onBiomeUpdate }: UsePlanetSyncOptions): UsePlanetSyncReturn {
  const [tileBiomes, setTileBiomes] = useState<Record<number, BiomeData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [planetStats, setPlanetStats] = useState<PlanetStatsData | null>(null);
  const socketRef = useRef<PartySocket | null>(null);

  useEffect(() => {
    // Créer la connexion WebSocket
    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room,
    });

    socketRef.current = socket;

    socket.onopen = () => {
      console.log(`[PartyKit] Connecté à la room: ${room}`);
      setIsConnected(true);
    };

    socket.onclose = () => {
      console.log(`[PartyKit] Déconnecté de la room: ${room}`);
      setIsConnected(false);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Réception de l'état complet (à la connexion)
        if (isSyncStateMessage(data)) {
          console.log(`[PartyKit] SYNC_STATE reçu:`, Object.keys(data.tileBiomes).length, "tuiles");
          setTileBiomes(data.tileBiomes);
          if (data.stats) {
            setPlanetStats(data.stats);
          }
          return;
        }

        // Réception d'une mise à jour de biome
        if (isSetBiomeMessage(data)) {
          console.log(`[PartyKit] SET_BIOME reçu: tuile ${data.tileIndex} → ${data.biome.nom}`);
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
          console.log(`[PartyKit] RESET_PLANET reçu`);
          setTileBiomes({});
          if (data.stats) {
            setPlanetStats(data.stats);
          }
          return;
        }
      } catch {
        // Message non-JSON
      }
    };

    // Cleanup à la déconnexion
    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [room, onBiomeUpdate]);

  // Fonction pour envoyer une mise à jour de biome
  const sendBiomeUpdate = useCallback((tileIndex: number, biome: BiomeData) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn("[PartyKit] Impossible d'envoyer: non connecté");
      return;
    }

    const message: SetBiomeMessage = {
      type: 'SET_BIOME',
      tileIndex,
      biome,
    };

    socketRef.current.send(JSON.stringify(message));
    console.log(`[PartyKit] SET_BIOME envoyé: tuile ${tileIndex} → ${biome.nom}`);

    // Mettre à jour l'état local immédiatement
    setTileBiomes((prev) => ({
      ...prev,
      [tileIndex]: biome,
    }));
  }, []);

  // Fonction pour réinitialiser la planète
  const resetPlanet = useCallback(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn("[PartyKit] Impossible d'envoyer: non connecté");
      return;
    }

    const message: ResetPlanetMessage = {
      type: 'RESET_PLANET',
    };

    socketRef.current.send(JSON.stringify(message));
    console.log(`[PartyKit] RESET_PLANET envoyé`);
  }, []);

  return {
    tileBiomes,
    sendBiomeUpdate,
    resetPlanet,
    isConnected,
    stats: planetStats,
  };
}
