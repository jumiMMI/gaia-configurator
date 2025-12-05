/**
 * Types de messages pour la synchronisation PartyKit
 */

export interface PlanetStatsData {
    environment: {
        temperature: number;
        humidite: number;
        CO2: number;
        lumiere: number;
    };
    resources: {
        eau: number;
        nourriture: number;
        energie: number;
        oxygene: number;
    };

    environmentScore: {
        temperature: number;
        humidite: number;
        CO2: number;
        lumiere: number;
        global: number;
    };
    resourceScore: {
        eau: number;
        nourriture: number;
        energie: number;
        oxygene: number;
        global: number;
    };

    //viabilité
    isEnvironmentViable: boolean;
    isResourceViable: boolean;
    isViable: boolean;
}

// biomeData
export interface BiomeData {
    nom: string;
    couleur: string;
}

// envoie un message si biome sur une tuile
export interface SetBiomeMessage {
    type: 'SET_BIOME';
    tileIndex: number;
    biome: BiomeData;
    stats?: PlanetStatsData;
}

// Message synchronise l'etat
export interface SyncStateMessage {
    type: 'SYNC_STATE';
    tileBiomes: Record<number, BiomeData>; // { [tileIndex]: BiomeData }
    stats: PlanetStatsData;
}

// message pour réinitialiser la planète
export interface ResetPlanetMessage {
    type: 'RESET_PLANET';
    stats?: PlanetStatsData;
}

// Message de rôle
export interface RoleMessage {
    type: 'role';
    isHost: boolean;
    hostId: string;
}

// Message de liste d'utilisateurs
export interface UsersMessage {
    type: 'users';
    users: Array<{
        id: string;
        name: string;
        isHost: boolean;
    }>;
}

// tous les messages
export type PartyMessage =
    | SetBiomeMessage
    | SyncStateMessage
    | ResetPlanetMessage
    | RoleMessage
    | UsersMessage;

// Type guard pour vérifier le type de message
export function isSetBiomeMessage(msg: unknown): msg is SetBiomeMessage {
    return typeof msg === 'object' && msg !== null && (msg as SetBiomeMessage).type === 'SET_BIOME';
}

export function isSyncStateMessage(msg: unknown): msg is SyncStateMessage {
    return typeof msg === 'object' && msg !== null && (msg as SyncStateMessage).type === 'SYNC_STATE';
}

export function isResetPlanetMessage(msg: unknown): msg is ResetPlanetMessage {
    return typeof msg === 'object' && msg !== null && (msg as ResetPlanetMessage).type === 'RESET_PLANET';
}

