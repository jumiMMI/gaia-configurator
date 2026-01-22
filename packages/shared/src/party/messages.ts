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

// Message pour démarrer le jeu (envoyé par le host)
export interface StartGameMessage {
    type: 'START_GAME';
    startTimestamp: number; // Timestamp Unix en millisecondes du début du jeu
    gameDuration: number; // Durée du jeu en secondes (par défaut 300)
}

// Message d'assignation de tuiles (envoyé par le serveur à chaque client)
export interface TileAssignmentMessage {
    type: 'TILE_ASSIGNMENT';
    assignedTiles: number[]; // Liste des indices de tuiles assignées à ce client
    totalUsers: number; // Nombre total d'utilisateurs dans la room
    playerColor: string; 
}

export interface PlayerZone {
    playerId: string;
    assignedTiles: number[];
    playerColor: string;
}

export interface AllTileAssignmentsMessage {
    type: 'ALL_TILE_ASSIGNMENTS';
    playerZones: PlayerZone[];
    totalUsers: number;
}

// Message d'erreur de placement (envoyé par le serveur si placement non autorisé)
export interface PlacementErrorMessage {
    type: 'PLACEMENT_ERROR';
    tileIndex: number;
    message: string;
}

// Message d'information client (envoyé par le client à la connexion)
export interface ClientInfoMessage {
    type: 'CLIENT_INFO';
    clientType: 'web' | 'mobile';
    clientId: string; // ID persistant du client
}

// rotation planete
export interface RotatePlanetMessage {
    type: 'ROTATE_PLANET';
    velocityX: number; // Tilt vertical (haut/bas)
    velocityY: number; // Rotation horizontale (gauche/droite)
}

// tous les messages
export type PartyMessage =
    | SetBiomeMessage
    | SyncStateMessage
    | ResetPlanetMessage
    | RoleMessage
    | UsersMessage
    | StartGameMessage
    | TileAssignmentMessage
    | AllTileAssignmentsMessage
    | PlacementErrorMessage
    | ClientInfoMessage
    | RotatePlanetMessage;

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

export function isStartGameMessage(msg: unknown): msg is StartGameMessage {
    return typeof msg === 'object' && msg !== null && (msg as StartGameMessage).type === 'START_GAME';
}

export function isTileAssignmentMessage(msg: unknown): msg is TileAssignmentMessage {
    return typeof msg === 'object' && msg !== null && (msg as TileAssignmentMessage).type === 'TILE_ASSIGNMENT';
}

export function isAllTileAssignmentsMessage(msg: unknown): msg is AllTileAssignmentsMessage {
    return typeof msg === 'object' && msg !== null && (msg as AllTileAssignmentsMessage).type === 'ALL_TILE_ASSIGNMENTS';
}

export function isPlacementErrorMessage(msg: unknown): msg is PlacementErrorMessage {
    return typeof msg === 'object' && msg !== null && (msg as PlacementErrorMessage).type === 'PLACEMENT_ERROR';
}

export function isRotatePlanetMessage(msg: unknown): msg is RotatePlanetMessage {
    return typeof msg === 'object' && msg !== null && (msg as RotatePlanetMessage).type === 'ROTATE_PLANET';
}
