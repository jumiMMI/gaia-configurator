import { Connection } from "partykit/server";
import { PLANET_CONFIG } from "../src/config/planetConfig";
import { biomeMap } from "../src/domain/Biome";
import PlanetState from "../src/domain/PlanetState";
import type { BiomeData, SetBiomeMessage, StartGameMessage, SyncStateMessage, TileAssignmentMessage } from "../src/party/messages";

interface User {
  id: string;
  // name: string;
  isHost: boolean;
}

export default class PartyServer {

  private clients: Connection<unknown>[] = [];
  private history: string[] = [];
  private hostId?: string;
  private users: User[] = [];
  private tileBiomes: Record<number, BiomeData> = {};
  private planetState!: PlanetState; 
  private readonly TOTAL_TILES = PLANET_CONFIG.TOTAL_TILES;
  private userTileAssignments: Map<string, number[]> = new Map(); 
  private isGameStarted: boolean = false;

  onConnect(connection: Connection<unknown>, roomName: string) {
   
    if (this.clients.length === 0) {
      this.hostId = connection.id;
      this.planetState = new PlanetState(this.TOTAL_TILES); 
      console.log(`Room créée : ${roomName}, host = ${connection.id}`);
    }

    this.clients.push(connection);

    const newUser: User = {
      id: connection.id,
      isHost: connection.id === this.hostId
    };

    this.users.push(newUser);

    console.log(`Client connecté : ${connection.id} dans ${roomName}`);

    // Envoyer le rôle au client qui vient de se connecter
    connection.send(JSON.stringify({
      type: "role",
      isHost: connection.id === this.hostId,
      hostId: this.hostId,
    }));

    // Notifier tous les clients de la liste mise à jour
    this.clients.forEach(c =>
      c.send(JSON.stringify({
        type: "users",
        users: this.users,
      }))
    );

    // Envoyer l'historique
    this.history.forEach((msg) => connection.send(msg));

    // Envoyer l'état actuel de la planète au nouveau client
    const syncMessage: SyncStateMessage = {
      type: 'SYNC_STATE',
      tileBiomes: this.tileBiomes,
      stats: this.planetState.getFullStats(),  
    };
    connection.send(JSON.stringify(syncMessage));
  }

  onMessage(message: string, sender: Connection<unknown>, roomName: string) {
    try {
      const parsed = JSON.parse(message);
      
      // Gérer le message SET_BIOME
      if (parsed.type === 'SET_BIOME') {
        const setBiomeMsg = parsed as SetBiomeMessage;
        const biomeComplet = biomeMap.get(setBiomeMsg.biome.nom);
        if (!biomeComplet) return;

        // Vérifier que l'utilisateur peut placer un biome sur cette tuile
        if (!this.canUserPlaceOnTile(sender.id, setBiomeMsg.tileIndex)) {
          // Envoyer un message d'erreur au client
          sender.send(JSON.stringify({
            type: 'PLACEMENT_ERROR',
            tileIndex: setBiomeMsg.tileIndex,
            message: 'Cette tuile n\'est pas dans votre zone assignée',
          }));
          return;
        }
        
        // Sauvegarder le biome pour cette tuile
        this.tileBiomes[setBiomeMsg.tileIndex] = setBiomeMsg.biome;
        this.planetState.setBiome(setBiomeMsg.tileIndex, biomeComplet);
        const stats = this.planetState.getFullStats();  
        
        console.log(`Biome mis à jour : tuile ${setBiomeMsg.tileIndex} → ${setBiomeMsg.biome.nom} par ${sender.id}`);
        
        // envoie un message à tous les autres clients
        this.clients.forEach((c) => {
          if (c !== sender) {
            c.send(JSON.stringify({ ...setBiomeMsg, stats }));
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
        
        // Vérifier que seul le host peut démarrer le jeu
        if (sender.id !== this.hostId) {
          console.warn(`Tentative de démarrage du jeu par un non-host: ${sender.id}`);
          return;
        }

        // Vérifier que le jeu n'est pas déjà démarré
        if (this.isGameStarted) {
          console.warn('Le jeu est déjà démarré');
          return;
        }

        // Vérifier qu'il y a au moins un joueur (non-host)
        const players = this.users.filter(user => user.id !== this.hostId);
        if (players.length === 0) {
          console.warn('Aucun joueur dans la room (seul le host est présent)');
          return;
        }

        console.log(`Démarrage du jeu avec ${players.length} joueur(s) (host exclu)`);
        
        this.divideTilesAmongUsers();
        

        this.sendTileAssignments();
        
        this.isGameStarted = true;
        
        // Diffuser START_GAME à tous les clients pour qu'ils démarrent leur timer
        this.clients.forEach((c) => {
          c.send(JSON.stringify({ type: 'START_GAME' }));
        });
        
        return;
      }
    } catch {
      
    }
  }

  onDisconnect(connection: Connection<unknown>, roomName: string) {
    
    this.clients = this.clients.filter((c) => c !== connection);
    this.users = this.users.filter((u) => u.id !== connection.id);
    this.userTileAssignments.delete(connection.id);

    console.log(`Client déconnecté : ${connection.id} de ${roomName}`);
    
    // Notifier les clients restants de la liste mise à jour
    this.clients.forEach(c =>
      c.send(JSON.stringify({
        type: "users",
        users: this.users,
      }))
    );
  
  }

  /**
   * Divise les tuiles disponibles entre tous les joueurs (exclut le host) de manière équitable
   */
  private divideTilesAmongUsers(): void {
    this.userTileAssignments.clear();
    
    // Exclure le host de la division des tuiles
    const players = this.users.filter(user => user.id !== this.hostId);
    const playerCount = players.length;
    
    if (playerCount === 0) {
      console.warn('Aucun joueur pour diviser les tuiles');
      return;
    }

    // Calculer le nombre de tuiles par joueur
    const tilesPerPlayer = Math.floor(this.TOTAL_TILES / playerCount);
    const remainder = this.TOTAL_TILES % playerCount; // Tuiles restantes à distribuer

    console.log(`Division des tuiles: ${tilesPerPlayer} tuiles par joueur, ${remainder} tuiles restantes`);

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

  /**
   * Envoie les assignations de tuiles à chaque joueur (exclut le host)
   */
  private sendTileAssignments(): void {
    // Compter uniquement les joueurs (non-host)
    const players = this.users.filter(user => user.id !== this.hostId);
    const totalUsers = players.length;

    players.forEach((player) => {
      const assignedTiles = this.userTileAssignments.get(player.id) || [];
      
      const assignmentMessage: TileAssignmentMessage = {
        type: 'TILE_ASSIGNMENT',
        assignedTiles,
        totalUsers,
      };

      // Trouver la connexion correspondante
      const clientConnection = this.clients.find(c => c.id === player.id);
      if (clientConnection) {
        // on a envoyé au user son nb de tuiles assignées
        clientConnection.send(JSON.stringify(assignmentMessage));
      }
    });
  }

  /**
   * Vérifie si un utilisateur peut placer un biome sur une tuile donnée
   */
  private canUserPlaceOnTile(userId: string, tileIndex: number): boolean {
    // Le host ne peut jamais placer de biomes
    if (userId === this.hostId) {
      return false;
    }

    // Si le jeu n'a pas commencé, les joueurs peuvent placer partout
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
