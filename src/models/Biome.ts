/**
 * Classe Biome
 */
export class Biome {
    nom: string;
    temperature: number;
    humidite: number;
    CO2: number;
    lumiere: number;
    couleur: string;

    constructor(
        nom: string,
        temperature: number,
        humidite: number,
        CO2: number,
        lumiere: number,
        couleur: string
    ) {
        this.nom = nom;
        this.temperature = temperature;
        this.humidite = humidite;
        this.CO2 = CO2;
        this.lumiere = lumiere;
        this.couleur = couleur;
    }
}


export const foret = new Biome('Forêt', 20, 70, 30, 45, '#2d5016');
export const desert = new Biome('Désert', 45, 10, 15, 90, '#d4a574');
export const ocean = new Biome('Océan', 15, 100, 50, 40, '#1e3a8a');
export const prairie = new Biome('Prairie', 25, 50, 25, 70, '#84cc16');


export const allBiomes = [foret, desert, ocean, prairie];

