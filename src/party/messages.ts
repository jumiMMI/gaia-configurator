/**
 * Types de messages pour la synchronisation PartyKit
 * 
 */

// Structure simplifiée du biome pour le transport
export interface BiomeData {
    nom: string;
    couleur: string;
}

// Message envoyé quand un biome est appliqué sur une tuile
export interface SetBiomeMessage {
    type: 'SET_BIOME';
    tileIndex: number;
    biome: BiomeData;
}

// Message envoyé aux nouveaux clients pour synchroniser l'état
export interface SyncStateMessage {
    type: 'SYNC_STATE';
    tileBiomes: Record<number, BiomeData>; // { [tileIndex]: BiomeData }
}

// Message pour réinitialiser la planète
export interface ResetPlanetMessage {
    type: 'RESET_PLANET';
}

// Message de rôle (existant)
export interface RoleMessage {
    type: 'role';
    isHost: boolean;
    hostId: string;
}

// Message de liste d'utilisateurs (existant)
export interface UsersMessage {
    type: 'users';
    users: Array<{
        id: string;
        name: string;
        isHost: boolean;
    }>;
}

// Union de tous les types de messages
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

