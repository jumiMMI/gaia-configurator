/**
 * Classe Biome
 */
export class Biome {
    nom: string;
    couleur: string;
    linkModel: string;
    icon: any;

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
        icon: any,

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
export const foret = new Biome(
    'Forêt', 
    '#2d5016', 
    'assets/biomes/foret/ForetTest.glb',
    require('../../assets/2d-icons/Forest.png'),
    -2, +10, -3, -3, +5, +10, 0, +10
);
export const ocean = new Biome(
    'Océan', 
    '#1e3a8a', 
    'assets/biomes/foret/ForetTest.glb',
    require('../../assets/2d-icons/ocean.png'),
    0, +15, -2, -2, +15, +5, +5, +5
);
export const prairie = new Biome(
    'Prairie', 
    '#84cc16', 
    'assets/biomes/foret/ForetTest.glb',
    require('../../assets/2d-icons/Field.png'),
    +1, +5, -1, +2, +5, +10, 0, +5
);
export const desert = new Biome(
    'Désert', 
    '#d4a574', 
    'assets/biomes/desert.glb',
    require('../../assets/2d-icons/Grand Canyon.png'),
    +15, -15, +1, +10, -5, -5, +10, -5
);
export const volcan = new Biome(
    'Volcan', 
    '#8b0000', 
    'assets/models/volcano.glb',
    require('../../assets/2d-icons/Volcano.png'),
    +20, -20, +15, +8, -10, -10, +20, -10
);
export const glacier = new Biome(
    'Glacier', 
    '#e0f2fe', 
    'assets/models/glacier.glb',
    require('../../assets/2d-icons/Iceberg.png'),
    -20, +5, -2, +5, +15, -10, -5, +5
);
export const montagne = new Biome(
    'Montagne', 
    '#6b7280', 
    'assets/models/montagne.glb',
    require('../../assets/2d-icons/Mountain.png'),
    -5, 0, 0, 0, 0, 0, 0, 0
);

export const allBiomes = [foret, ocean, prairie, desert, volcan, glacier, montagne];

export const biomeMap = new Map<string, Biome>(
    allBiomes.map(biome => [biome.nom, biome])
);
