import { PlanetStatsData } from "../party/messages";
import { Biome } from "./Biome";


// ÉTAT INITIAL DE LA PLANÈTE 
const INITIAL_STATE = {
    temperature: 20,
    humidite: 20,
    CO2: 2,
    lumiere: 50,
};


// PLAGES IDÉALES POUR L'ENVIRONNEMENT
const IDEAL_RANGES = {
    temperature: { min: 15, max: 25 },
    humidite: { min: 40, max: 70 },
    CO2: { min: 20, max: 45 },
    lumiere: { min: 40, max: 70 },
};


// SEUILS MINIMUMS POUR LES RESSOURCES
const RESOURCE_MINIMUMS = {
    eau: 30,
    nourriture: 30,
    energie: 20,
    oxygene: 40,
};


// INTERFACES
export interface EnvironmentStats {
    temperature: number;
    humidite: number;
    CO2: number;
    lumiere: number;
}

export interface ResourceStats {
    eau: number;
    nourriture: number;
    energie: number;
    oxygene: number;
}

export interface EnvironmentScore {
    temperature: number; 
    humidite: number;     
    CO2: number;          
    lumiere: number;      
    global: number;       // moy
}

export interface ResourceScore {
    eau: number;          
    nourriture: number;   
    energie: number;      
    oxygene: number;      
    global: number;       
}

export interface PlanetViability {
    environmentScore: EnvironmentScore;
    resourceScore: ResourceScore;
    isEnvironmentViable: boolean;
    isResourceViable: boolean;
    isViable: boolean;  // Les deux conditions remplies
}

// CLASSE PlanetState

export default class PlanetState {
    tileBiomes: Map<number, Biome>;
    totalTiles: number;

    constructor(totalTiles: number) {
        this.tileBiomes = new Map<number, Biome>();
        this.totalTiles = totalTiles;
    }

    setBiome(tileIndex: number, biome: Biome): void {
        this.tileBiomes.set(tileIndex, biome);
    }

    removeBiome(tileIndex: number): void {
        this.tileBiomes.delete(tileIndex);
    }

    getBiomeCount(): number {
        return this.tileBiomes.size;
    }


    // CALCUL DES STATISTIQUES ENVIRONNEMENT

    /**
     * Formule : État initial + (Σ contributions / nombre total tuiles)
     */
    getEnvironmentStats(): EnvironmentStats {
        let totalTemp = 0;
        let totalHumidite = 0;
        let totalCO2 = 0;
        let totalLumiere = 0;

        this.tileBiomes.forEach((biome) => {
            totalTemp += biome.temperature;
            totalHumidite += biome.humidite;
            totalCO2 += biome.CO2;
            totalLumiere += biome.lumiere;
        });

        // Calculer la contribution moyenne puis l'ajouter à l'état initial
        const divisor = this.totalTiles > 0 ? this.totalTiles : 1;

        return {
            temperature: INITIAL_STATE.temperature + (totalTemp / divisor),
            humidite: INITIAL_STATE.humidite + (totalHumidite / divisor),
            CO2: INITIAL_STATE.CO2 + (totalCO2 / divisor),
            lumiere: INITIAL_STATE.lumiere + (totalLumiere / divisor),
        };
    }


    // CALCUL DES STATISTIQUES RESSOURCES

    getResourceStats(): ResourceStats {
        let totalEau = 0;
        let totalNourriture = 0;
        let totalEnergie = 0;
        let totalOxygene = 0;

        this.tileBiomes.forEach((biome) => {
            totalEau += biome.eau;
            totalNourriture += biome.nourriture;
            totalEnergie += biome.energie;
            totalOxygene += biome.oxygene;
        });

        // Les ressources sont la somme totale (pas de division)
        // Plus tu places de biomes productifs, plus tu as de ressources
        return {
            eau: Math.max(0, totalEau),
            nourriture: Math.max(0, totalNourriture),
            energie: Math.max(0, totalEnergie),
            oxygene: Math.max(0, totalOxygene),
        };
    }

    // CALCUL DES SCORES

    /**
     * Score environnement : 100 si dans la plage idéale, décroît sinon
     */
    getEnvironmentScore(): EnvironmentScore {
        const stats = this.getEnvironmentStats();

        const calculateScore = (value: number, range: { min: number; max: number }): number => {
            if (value >= range.min && value <= range.max) {
                return 100;
            }
            const distance = value < range.min
                ? range.min - value
                : value - range.max;
            return Math.max(0, 100 - distance * 5);
        };

        const tempScore = calculateScore(stats.temperature, IDEAL_RANGES.temperature);
        const humiditeScore = calculateScore(stats.humidite, IDEAL_RANGES.humidite);
        const co2Score = calculateScore(stats.CO2, IDEAL_RANGES.CO2);
        const lumiereScore = calculateScore(stats.lumiere, IDEAL_RANGES.lumiere);

        return {
            temperature: Math.round(tempScore),
            humidite: Math.round(humiditeScore),
            CO2: Math.round(co2Score),
            lumiere: Math.round(lumiereScore),
            global: Math.round((tempScore + humiditeScore + co2Score + lumiereScore) / 4),
        };
    }

    /**
     * Score ressources : 100 si >= seuil minimum, proportionnel sinon
     */
    getResourceScore(): ResourceScore {
        const stats = this.getResourceStats();

        const calculateScore = (value: number, minimum: number): number => {
            if (value >= minimum) {
                return 100;
            }
            // Score proportionnel (ex: 15/30 = 50%)
            return Math.round((value / minimum) * 100);
        };

        const eauScore = calculateScore(stats.eau, RESOURCE_MINIMUMS.eau);
        const nourritureScore = calculateScore(stats.nourriture, RESOURCE_MINIMUMS.nourriture);
        const energieScore = calculateScore(stats.energie, RESOURCE_MINIMUMS.energie);
        const oxygeneScore = calculateScore(stats.oxygene, RESOURCE_MINIMUMS.oxygene);

        return {
            eau: eauScore,
            nourriture: nourritureScore,
            energie: energieScore,
            oxygene: oxygeneScore,
            global: Math.round((eauScore + nourritureScore + energieScore + oxygeneScore) / 4),
        };
    }


    // VIABILITÉ DE LA PLANÈTE

    /**
     * Vérifie si la planète peut accueillir la vie humaine
     * Condition : Environnement OK (score >= 75) ET Ressources OK (toutes >= minimum)
     */
    getViability(): PlanetViability {
        const environmentScore = this.getEnvironmentScore();
        const resourceScore = this.getResourceScore();

        const isEnvironmentViable = environmentScore.global >= 75;
        const isResourceViable = resourceScore.global >= 100;

        return {
            environmentScore,
            resourceScore,
            isEnvironmentViable,
            isResourceViable,
            isViable: isEnvironmentViable && isResourceViable,
        };
    }

    getFullStats(): PlanetStatsData {
        return {
            environment: this.getEnvironmentStats(),
            resources: this.getResourceStats(),
            environmentScore: this.getEnvironmentScore(),
            resourceScore: this.getResourceScore(),
            isEnvironmentViable: this.getViability().isEnvironmentViable,
            isResourceViable: this.getViability().isResourceViable,
            isViable: this.getViability().isViable,
        };
    }
    
    //Raccourci pour vérifier rapidement si la planète est viable

    isViable(): boolean {
        return this.getViability().isViable;
    }
}
