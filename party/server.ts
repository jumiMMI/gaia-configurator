import { Connection } from "partykit/server";
import { PLANET_CONFIG } from "../src/config/planetConfig";
import { biomeMap } from "../src/models/Biome";
import PlanetState from "../src/models/PlanetState";
import type { BiomeData, SetBiomeMessage, SyncStateMessage } from "../src/party/messages";

interface User {
  id: string;
  // name: string;
  isHost: boolean;
}

// function generateName() {

// }

export default class PartyServer {

  private clients: Connection<unknown>[] = [];
  private history: string[] = [];
  private hostId?: string;
  private users: User[] = [];
  private tileBiomes: Record<number, BiomeData> = {};
  private planetState!: PlanetState; 
  private readonly TOTAL_TILES = PLANET_CONFIG.TOTAL_TILES;

  onConnect(connection: Connection<unknown>, roomName: string) {
   
    if (this.clients.length === 0) {
      this.hostId = connection.id;
      this.planetState = new PlanetState(this.TOTAL_TILES); 
      console.log(`Room créée : ${roomName}, host = ${connection.id}`);
    }

    this.clients.push(connection);

    const newUser: User = {
      id: connection.id,
      // name: generateName(),
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

    // // Message de bienvenue avec le nom d'utilisateur
    // const welcomeMessage = `${newUser.name} a rejoint la room !`;
    // connection.send(welcomeMessage);
    
    // // Notifier les autres clients qu'un nouvel utilisateur a rejoint
    // this.clients.forEach(c => {
    //   if (c !== connection) {
    //     c.send(welcomeMessage);
    //   }
    // });

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
        
        // Sauvegarder le biome pour cette tuile
        this.tileBiomes[setBiomeMsg.tileIndex] = setBiomeMsg.biome;
        this.planetState.setBiome(setBiomeMsg.tileIndex, biomeComplet);
        const stats = this.planetState.getFullStats();  
        
        console.log(`Biome mis à jour : tuile ${setBiomeMsg.tileIndex} → ${setBiomeMsg.biome.nom}`);
        
        // Broadcaster à tous les autres clients
        this.clients.forEach((c) => {
          if (c !== sender) {
            c.send(JSON.stringify({ ...setBiomeMsg, stats }));
          }
        });
        return;
      }

      // Gérer le message RESET_PLANET
      if (parsed.type === 'RESET_PLANET') {
        // Réinitialiser tous les biomes
        this.tileBiomes = {};
        this.planetState = new PlanetState(this.TOTAL_TILES);
        const stats = this.planetState.getFullStats();  
        console.log(`Planète réinitialisée !`);
        
        // Broadcaster à tous les clients (y compris l'expéditeur pour confirmation)
        this.clients.forEach((c) => {
          c.send(JSON.stringify({ type: 'RESET_PLANET', stats }));
        });
        return;
      }
    } catch {
      
    }
  }

  onDisconnect(connection: Connection<unknown>, roomName: string) {
    // Trouver le nom de l'utilisateur qui se déconnecte
    const disconnectedUser = this.users.find(u => u.id === connection.id);
    // const disconnectedUserName = disconnectedUser?.name || connection.id;
    
    this.clients = this.clients.filter((c) => c !== connection);
    this.users = this.users.filter((u) => u.id !== connection.id);

    console.log(`Client déconnecté : ${connection.id} de ${roomName}`);
    
    // Notifier les clients restants de la liste mise à jour
    this.clients.forEach(c =>
      c.send(JSON.stringify({
        type: "users",
        users: this.users,
      }))
    );
    
    // // Notifier les autres clients de la déconnexion
    // if (this.clients.length > 0) {
    //   const disconnectMessage = `${disconnectedUserName} a quitté la room.`;
    //   this.clients.forEach(c => c.send(disconnectMessage));
    // }
  }
}
