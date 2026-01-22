import { PLANET_CONFIG } from "@gaia/shared/config/planetConfig";
import { biomeMap } from "@gaia/shared/domain/Biome";
import PlanetState from "@gaia/shared/domain/PlanetState";
import type { AllTileAssignmentsMessage, BiomeData, PlayerZone, RotatePlanetMessage, SetBiomeMessage, StartGameMessage, SyncStateMessage, TileAssignmentMessage } from "@gaia/shared/party/messages";
import { Connection } from "partykit/server";

interface User {
  id: string; // ID persistant du client (clientId)
  connectionId: string; // ID de la connexion WebSocket (temporaire)
  // name: string;
  isHost: boolean;
  clientType?: 'web' | 'mobile'; // Type de client (web ou mobile)
}

export default class PartyServer {

  private clients: Connection<unknown>[] = [];
  private history: string[] = [];
  private hostId?: string; // ID persistant du host
  private users: User[] = [];
  private tileBiomes: Record<number, BiomeData> = {};
  private planetState!: PlanetState;
  private readonly TOTAL_TILES = PLANET_CONFIG.TOTAL_TILES;
  private userTileAssignments: Map<string, number[]> = new Map(); // Clé = clientId (persistant)
  private isGameStarted: boolean = false;
  private gameStartTimestamp: number | null = null; // Timestamp de début du jeu
  private gameDuration: number = 300;
  private clientTypes: Map<string, 'web' | 'mobile'> = new Map(); // Clé = connectionId
  private clientIdMap: Map<string, string> = new Map(); // Map connectionId -> clientId
  private connectionIdMap: Map<string, string> = new Map(); // Map clientId -> connectionId (pour trouver la connexion active)

  onConnect(connection: Connection<unknown>, roomName: string) {
    this.clients.push(connection);

    if (this.clients.length === 1) {
      this.planetState = new PlanetState(this.TOTAL_TILES);
      const oceanBiome = biomeMap.get('Océan');
      if (oceanBiome) {
        for (let i = 0; i < this.TOTAL_TILES; i++) {
          this.planetState.setBiome(i, oceanBiome);
          this.tileBiomes[i] = {
            nom: oceanBiome.nom,
            couleur: oceanBiome.couleur,
          };
        }
      }
    }

    // L'ID client persistant sera reçu via CLIENT_INFO
    // Pour l'instant, on attend ce message avant de créer/utiliser l'utilisateur
  }

  onMessage(message: string, sender: Connection<unknown>, roomName: string) {
    try {
      const parsed = JSON.parse(message);

      if (parsed.type === 'CLIENT_INFO') {
        const clientInfo = parsed as { clientType: 'web' | 'mobile'; clientId: string };
        const clientType = clientInfo.clientType;
        const clientId = clientInfo.clientId; // ID persistant

        // Associer connection.id (temporaire) à clientId (persistant)
        this.clientIdMap.set(sender.id, clientId);
        this.connectionIdMap.set(clientId, sender.id);
        this.clientTypes.set(sender.id, clientType);

        // Chercher un utilisateur existant avec le même clientId (reconnexion)
        let user = this.users.find(u => u.id === clientId);

        if (user) {
          // Reconnexion : mettre à jour l'ID de connexion
          user.connectionId = sender.id;
          user.clientType = clientType;
        } else {
          // Nouvel utilisateur : le créer
          user = {
            id: clientId, // ID persistant
            connectionId: sender.id, // ID de connexion actuelle
            isHost: false,
            clientType: clientType,
          };
          this.users.push(user);
        }

        // Si c'est un client web, il devient toujours host (remplace l'ancien si nécessaire)
        if (clientType === 'web') {
          const existingWebHost = this.users.find(u => u.isHost && u.clientType === 'web' && u.id !== clientId);
          const wasHostChanged = !this.hostId || this.hostId !== clientId;

          // Retirer le statut host de l'ancien host (s'il existe et est différent du nouveau)
          if (existingWebHost) {
            existingWebHost.isHost = false;
          }

          // Retirer aussi le statut host si c'est un client mobile
          const oldHost = this.users.find(u => u.isHost && u.id !== clientId);
          if (oldHost && oldHost.clientType !== 'web') {
            oldHost.isHost = false;
          }

          this.hostId = clientId; // Utiliser l'ID persistant
          user.isHost = true;

          // Notifier tous les clients du changement de host SEULEMENT si le host a changé
          if (wasHostChanged) {
            this.clients.forEach(c => {
              const cClientId = this.clientIdMap.get(c.id);
              const isHost = cClientId === clientId;
              c.send(JSON.stringify({
                type: "role",
                isHost: isHost,
                hostId: this.hostId,
              }));
            });
          }

          // Notifier tous les clients de la liste mise à jour
          this.clients.forEach(c =>
            c.send(JSON.stringify({
              type: "users",
              users: this.users.map(u => ({ id: u.id, name: '', isHost: u.isHost })),
            }))
          );
        }

        // Envoyer le rôle au client qui vient de se connecter
        sender.send(JSON.stringify({
          type: "role",
          isHost: user.isHost,
          hostId: this.hostId,
        }));

        // Notifier tous les clients de la liste mise à jour (seulement si ce n'est pas un client web, car déjà fait ci-dessus)
        if (clientType !== 'web') {
          this.clients.forEach(c =>
            c.send(JSON.stringify({
              type: "users",
              users: this.users.map(u => ({ id: u.id, name: '', isHost: u.isHost })),
            }))
          );
        }

        // Envoyer l'historique
        this.history.forEach((msg) => sender.send(msg));

        // Envoyer l'état actuel de la planète au nouveau client
        const syncMessage: SyncStateMessage = {
          type: 'SYNC_STATE',
          tileBiomes: this.tileBiomes,
          stats: this.planetState.getFullStats(),
        };
        sender.send(JSON.stringify(syncMessage));

        // Si le jeu est déjà démarré, envoyer START_GAME et les assignments au nouveau client
        if (this.isGameStarted && this.gameStartTimestamp) {
          sender.send(JSON.stringify({ 
            type: 'START_GAME',
            startTimestamp: this.gameStartTimestamp,
            gameDuration: this.gameDuration,
          }));
          
          // Envoyer les assignments de tuiles au client qui se reconnecte
          if (clientType === 'web' && user.isHost) {
            // Pour le host web, envoyer toutes les zones de tous les joueurs
            this.sendAllTileAssignmentsToHost(sender);
          } else if (clientType === 'mobile') {
            // Pour les clients mobiles, envoyer leur propre assignment
            this.sendTileAssignmentToPlayer(sender, clientId);
          }
        }

        return;
      }

      // Gérer le message SET_BIOME
      if (parsed.type === 'SET_BIOME') {
        const setBiomeMsg = parsed as SetBiomeMessage;
        const biomeComplet = biomeMap.get(setBiomeMsg.biome.nom);
        if (!biomeComplet) return;

        // Obtenir l'ID client persistant depuis l'ID de connexion
        const clientId = this.clientIdMap.get(sender.id);
        if (!clientId) return; // Client non identifié

        // Vérifier que l'utilisateur peut placer un biome sur cette tuile
        if (!this.canUserPlaceOnTile(clientId, setBiomeMsg.tileIndex)) {

          sender.send(JSON.stringify({
            type: 'PLACEMENT_ERROR',
            tileIndex: setBiomeMsg.tileIndex,
            message: 'Cette tuile n\'est pas dans votre zone assignée',
          }));
          return;
        }


        this.tileBiomes[setBiomeMsg.tileIndex] = setBiomeMsg.biome;
        this.planetState.setBiome(setBiomeMsg.tileIndex, biomeComplet);
        const stats = this.planetState.getFullStats();


        // envoie un message à tous les autres clients
        this.clients.forEach((c) => {
          if (c !== sender) {
            c.send(JSON.stringify({ ...setBiomeMsg, stats }));
          }
        });
        return;
      }

      // ROTATE_PLANET
      if (parsed.type === 'ROTATE_PLANET') {
        const rotateMsg = parsed as RotatePlanetMessage;

        this.clients.forEach((c) => {
          const clientType = this.clientTypes.get(c.id);
          if (clientType === 'web' && c !== sender) {
            c.send(JSON.stringify(rotateMsg));
          }
        });
        return;
      }

      // Gérer le message RESET_PLANET
      if (parsed.type === 'RESET_PLANET') {
        this.tileBiomes = {};
        this.planetState = new PlanetState(this.TOTAL_TILES);
        this.userTileAssignments.clear();
        this.isGameStarted = false;
        const stats = this.planetState.getFullStats();

        this.clients.forEach((c) => {
          c.send(JSON.stringify({ type: 'RESET_PLANET', stats }));
        });
        return;
      }

      // Gérer le message START_GAME
      if (parsed.type === 'START_GAME') {
        const startGameMsg = parsed as StartGameMessage;

        // Obtenir l'ID client persistant depuis l'ID de connexion
        const clientId = this.clientIdMap.get(sender.id);
        if (!clientId) {
          return; // Client non identifié
        }

        // Vérifier que seul le host peut démarrer le jeu
        if (clientId !== this.hostId) {
          return;
        }

        // Vérifier que le jeu n'est pas déjà démarré
        if (this.isGameStarted) {
          return;
        }

        // Vérifier qu'il y a au moins un joueur (non-host)
        const players = this.users.filter(user => user.id !== this.hostId && user.connectionId);
        if (players.length === 0) {
          return;
        }

        this.divideTilesAmongUsers();
        this.sendTileAssignments();
        this.isGameStarted = true;
        this.gameStartTimestamp = Date.now();

        this.clients.forEach((c) => {
          c.send(JSON.stringify({ 
            type: 'START_GAME',
            startTimestamp: this.gameStartTimestamp!,
            gameDuration: this.gameDuration,
          }));
        });

        return;
      }
    } catch {

    }
  }

  onDisconnect(connection: Connection<unknown>, roomName: string) {
    const clientId = this.clientIdMap.get(connection.id);

    this.clients = this.clients.filter((c) => c !== connection);
    this.clientTypes.delete(connection.id);
    this.clientIdMap.delete(connection.id);

    if (clientId) {
      // Mettre à jour l'utilisateur : retirer seulement l'ID de connexion, garder l'utilisateur
      const user = this.users.find(u => u.id === clientId);
      if (user) {
        // Si c'est la connexion active, la retirer
        if (user.connectionId === connection.id) {
          // Vérifier s'il y a une autre connexion pour ce clientId (reconnexion en cours)
          const activeConnectionId = this.connectionIdMap.get(clientId);
          if (activeConnectionId && activeConnectionId !== connection.id) {
            // Il y a déjà une nouvelle connexion, mettre à jour
            user.connectionId = activeConnectionId;
          } else {
            // Pas de nouvelle connexion, retirer l'utilisateur
            this.users = this.users.filter((u) => u.id !== clientId);
            this.userTileAssignments.delete(clientId);
            this.connectionIdMap.delete(clientId);
          }
        }
      }
    }

    // réinitialiser la room
    if (this.clients.length === 0) {
      this.isGameStarted = false;
      this.tileBiomes = {};
      this.planetState = new PlanetState(this.TOTAL_TILES);
      this.userTileAssignments.clear();
      this.users = [];
      this.hostId = undefined;
      this.history = [];
      this.clientTypes.clear();
      this.clientIdMap.clear();
      this.connectionIdMap.clear();
      return;
    }

    // Si le host s'est déconnecté, désigner un nouveau host (priorité au web)
    if (clientId && clientId === this.hostId) {
      const webClients = this.users.filter(u => u.clientType === 'web' && u.connectionId);

      if (webClients.length > 0) {
        this.hostId = webClients[0].id;
        webClients[0].isHost = true;
      } else if (this.users.filter(u => u.connectionId).length > 0) {
        const firstUser = this.users.find(u => u.connectionId);
        if (firstUser) {
          this.hostId = firstUser.id;
          firstUser.isHost = true;
        }
      }

      // Notifier tous les clients du nouveau host
      this.clients.forEach(c => {
        const cClientId = this.clientIdMap.get(c.id);
        const isHost = cClientId === this.hostId;
        c.send(JSON.stringify({
          type: "role",
          isHost: isHost,
          hostId: this.hostId,
        }));
      });
    }

    // Notifier les clients restants de la liste mise à jour
    this.clients.forEach(c =>
      c.send(JSON.stringify({
        type: "users",
        users: this.users.filter(u => u.connectionId).map(u => ({ id: u.id, name: '', isHost: u.isHost })),
      }))
    );

  }

  /**
   * Divise les tuiles disponibles entre tous les joueurs (exclut le host) de manière équitable
   */
  private divideTilesAmongUsers(): void {
    this.userTileAssignments.clear();

    // Exclure le host de la division des tuiles et ne garder que ceux avec une connexion active
    const players = this.users.filter(user => user.id !== this.hostId && user.connectionId);
    const playerCount = players.length;

    if (playerCount === 0) {
      return;
    }

    // Calculer le nombre de tuiles par joueur
    const tilesPerPlayer = Math.floor(this.TOTAL_TILES / playerCount);
    const remainder = this.TOTAL_TILES % playerCount; // Tuiles restantes à distribuer


    // Créer un tableau de tous les indices de tuiles (0 à TOTAL_TILES - 1)
    const allTileIndices: number[] = [];
    for (let i = 0; i < this.TOTAL_TILES; i++) {
      allTileIndices.push(i);
    }

    // Diviser les tuiles entre les joueurs de manière séquentielle
    let currentTileIndex = 0;

    players.forEach((player, index) => {
      // Les premiers joueurs reçoivent une tuile supplémentaire s'il y a un reste
      const tilesForThisPlayer = tilesPerPlayer + (index < remainder ? 1 : 0);
      const playerTiles: number[] = [];

      for (let i = 0; i < tilesForThisPlayer; i++) {
        if (currentTileIndex < this.TOTAL_TILES) {
          playerTiles.push(currentTileIndex);
          currentTileIndex++;
        }
      }

      this.userTileAssignments.set(player.id, playerTiles);
    });
  }

  private sendTileAssignments(): void {
    // nb de joueurs (non-host) qui ont une connexion active
    const players = this.users.filter(user => user.id !== this.hostId && user.connectionId);
    const totalUsers = players.length;

    // Couleurs pour les joueurs (même ordre que côté mobile)
    const PLAYER_COLORS = [
      '#FFD700', // Jaune pour joueur 1
      '#FF6B6B', // Rouge/rose pour joueur 2
      '#4ECDC4', // Turquoise pour joueur 3
      '#95E1D3', // Vert menthe pour joueur 4
    ];

    // Construire la liste de toutes les zones pour le host web
    const allPlayerZones: PlayerZone[] = [];

    players.forEach((player, playerIndex) => {
      const assignedTiles = this.userTileAssignments.get(player.id) || [];
      const playerColor = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];

      // Ajouter à la liste des zones pour le broadcast au host
      allPlayerZones.push({
        playerId: player.id,
        assignedTiles,
        playerColor,
      });

      const assignmentMessage: TileAssignmentMessage = {
        type: 'TILE_ASSIGNMENT',
        assignedTiles,
        totalUsers,
        playerColor,
      };

      // Trouver la connexion correspondante via connectionId
      const clientConnection = this.clients.find(c => c.id === player.connectionId);
      if (clientConnection) {
        // envoie au user son nb de tuiles assignées
        clientConnection.send(JSON.stringify(assignmentMessage));
      }
    });

    // Envoyer ALL_TILE_ASSIGNMENTS au host web
    if (this.hostId) {
      const hostUser = this.users.find(u => u.id === this.hostId);
      if (hostUser && hostUser.connectionId) {
        const hostConnection = this.clients.find(c => c.id === hostUser.connectionId);
        if (hostConnection) {
          const allAssignmentsMessage: AllTileAssignmentsMessage = {
            type: 'ALL_TILE_ASSIGNMENTS',
            playerZones: allPlayerZones,
            totalUsers,
          };
          hostConnection.send(JSON.stringify(allAssignmentsMessage));
        } else {
        }
      } else {
      }
    } else {
      console.log('[SERVER] No hostId set');
    }
  }

  /**
   * Envoie ALL_TILE_ASSIGNMENTS au host web
   */
  private sendAllTileAssignmentsToHost(connection: Connection<unknown>): void {
    const players = this.users.filter(user => user.id !== this.hostId && user.connectionId);
    const totalUsers = players.length;

    const PLAYER_COLORS = [
      '#FFD700',
      '#FF6B6B',
      '#4ECDC4',
      '#95E1D3',
    ];

    const allPlayerZones: PlayerZone[] = players.map((player, index) => ({
      playerId: player.id,
      assignedTiles: this.userTileAssignments.get(player.id) || [],
      playerColor: PLAYER_COLORS[index % PLAYER_COLORS.length],
    }));

    const message: AllTileAssignmentsMessage = {
      type: 'ALL_TILE_ASSIGNMENTS',
      playerZones: allPlayerZones,
      totalUsers,
    };

    connection.send(JSON.stringify(message));
  }

  /**
   * Envoie TILE_ASSIGNMENT à un joueur spécifique
   */
  private sendTileAssignmentToPlayer(connection: Connection<unknown>, playerId: string): void {
    const players = this.users.filter(user => user.id !== this.hostId && user.connectionId);
    const playerIndex = players.findIndex(p => p.id === playerId);
    
    if (playerIndex === -1) return;

    const PLAYER_COLORS = [
      '#FFD700',
      '#FF6B6B',
      '#4ECDC4',
      '#95E1D3',
    ];

    const assignedTiles = this.userTileAssignments.get(playerId) || [];
    const playerColor = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];

    const message: TileAssignmentMessage = {
      type: 'TILE_ASSIGNMENT',
      assignedTiles,
      totalUsers: players.length,
      playerColor,
    };

    connection.send(JSON.stringify(message));
  }

  /**
   * Vérifie si un utilisateur peut placer un biome sur une tuile donnée
   */
  private canUserPlaceOnTile(userId: string, tileIndex: number): boolean {
    // Le host ne peut jamais placer de biomes
    if (userId === this.hostId) {
      return false;
    }

    if (!this.isGameStarted) {
      return true;
    }

    const assignedTiles = this.userTileAssignments.get(userId);
    if (!assignedTiles) {
      return false;
    }

    return assignedTiles.includes(tileIndex);
  }
}
