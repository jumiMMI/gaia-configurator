/**
 * Classe Biome
 */
export class Biome {
    nom: string;
    couleur: string;
    linkModel: string;

    // Paramètres Environnement
    temperature: number;
    humidite: number;
    CO2: number;
    lumiere: number;

    // Ressources Vie 
    eau: number;
    nourriture: number;
    energie: number;
    oxygene: number;

    constructor(
        nom: string,
        couleur: string,
        linkModel: string,

        // Environnement
        temperature: number,
        humidite: number,
        CO2: number,
        lumiere: number,

        // Ressources
        eau: number,
        nourriture: number,
        energie: number,
        oxygene: number
    ) {
        this.nom = nom;
        this.couleur = couleur;
        this.linkModel = linkModel;
        this.temperature = temperature;
        this.humidite = humidite;
        this.CO2 = CO2;
        this.lumiere = lumiere;
        this.eau = eau;
        this.nourriture = nourriture;
        this.energie = energie;
        this.oxygene = oxygene;
    }
}

// Légende des valeurs :
// ++  = +10  |  +  = +5  |  0 = 0  |  -  = -5  |  --  = -10

//              
export const foret = new Biome('Forêt', '#2d5016', 'assets/biomes/foret/ForetTest.glb', -5, +10, -10, -5, +5, +10, 0, +10);
export const ocean = new Biome('Océan', '#1e3a8a', 'assets/biomes/foret/ForetTest.glb', 0, +15, -5, -5, +15, +5, +5, +5);
export const prairie = new Biome('Prairie', '#84cc16', 'assets/biomes/foret/ForetTest.glb', 0, +5, -5, +5, +5, +10, 0, +5);
export const desert = new Biome('Désert', '#d4a574', 'assets/biomes/foret/ForetTest.glb', +15, -15, 0, +10, -5, -5, +10, -5);

export const allBiomes = [foret, ocean, prairie, desert];

export const biomeMap = new Map<string, Biome>(
    allBiomes.map(biome => [biome.nom, biome])
);
