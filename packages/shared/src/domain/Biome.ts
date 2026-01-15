/**
 * Classe Biome
 */
export class Biome {
    nom: string;
    couleur: string;
    linkModel: string;
    icon: any | null;

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
        icon: any | null,

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
        this.icon = icon;
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

// Biomes (température, humidité, CO2, lumière, eau, nourriture, énergie, oxygène)
// Les icônes sont définies dans biomeIcons.ts et chargées uniquement côté client
export const foret = new Biome(
    'Forêt', 
    '#2d5016', 
    'assets/biomes/foret/ForetTest.glb',
    null, // Les icônes seront chargées séparément côté client
    -2, +10, -3, -3, +5, +10, 0, +10
);
export const ocean = new Biome(
    'Océan', 
    '#1e3a8a', 
    'assets/biomes/foret/ForetTest.glb',
    null,
    0, +15, -2, -2, +15, +5, +5, +5
);
export const prairie = new Biome(
    'Prairie', 
    '#84cc16', 
    'assets/biomes/foret/ForetTest.glb',
    null,
    +1, +5, -1, +2, +5, +10, 0, +5
);
export const desert = new Biome(
    'Désert', 
    '#d4a574', 
    'assets/biomes/desert.glb',
    null,
    +15, -15, +1, +10, -5, -5, +10, -5
);
export const volcan = new Biome(
    'Volcan', 
    '#8b0000', 
    'assets/models/volcano.glb',
    null,
    +20, -20, +15, +8, -10, -10, +20, -10
);
export const glacier = new Biome(
    'Glacier', 
    '#e0f2fe', 
    'assets/models/glacier.glb',
    null,
    -20, +5, -2, +5, +15, -10, -5, +5
);
export const montagne = new Biome(
    'Montagne', 
    '#6b7280', 
    'assets/models/montagne.glb',
    null,
    -5, 0, 0, 0, 0, 0, 0, 0
);

export const allBiomes = [foret, ocean, prairie, desert, volcan, glacier, montagne];

export const biomeMap = new Map<string, Biome>(
    allBiomes.map(biome => [biome.nom, biome])
);
