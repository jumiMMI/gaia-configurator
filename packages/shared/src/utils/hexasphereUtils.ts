import Hexasphere from 'hexasphere.js';

export const DEFAULT_HEXASPHERE_CONFIG = {
    radius: 2,
    subDivisions: 3,
    tileWidth: 1,
} as const;

export function calculateTileCount(subDivisions: number): number {
    return 10 * subDivisions * subDivisions + 2;
}

/**
 * Nombre de tuiles avec la configuration par défaut
 */
export const DEFAULT_TILE_COUNT = calculateTileCount(DEFAULT_HEXASPHERE_CONFIG.subDivisions);

/**
 * Interface pour les données hexasphere générées
 */
export interface HexasphereData {
    hexasphere: Hexasphere;
    tileCount: number;
    radius: number;
    subDivisions: number;
    tileWidth: number;
}

export interface HexasphereConfig {
    radius?: number;
    subDivisions?: number;
    tileWidth?: number;
}


export function createHexasphereData(config?: HexasphereConfig): HexasphereData {
    const radius = config?.radius ?? DEFAULT_HEXASPHERE_CONFIG.radius;
    const subDivisions = config?.subDivisions ?? DEFAULT_HEXASPHERE_CONFIG.subDivisions;
    const tileWidth = config?.tileWidth ?? DEFAULT_HEXASPHERE_CONFIG.tileWidth;

    const hexasphere = new Hexasphere(radius, subDivisions, tileWidth);

    return {
        hexasphere,
        tileCount: hexasphere.tiles.length,
        radius,
        subDivisions,
        tileWidth,
    };
}

/**
 * Récupère les données hexasphere avec la configuration par défaut
 * Utile pour avoir les mêmes données partout dans l'application
 */
export function getDefaultHexasphereData(): HexasphereData {
    return createHexasphereData();
}

/**
 * Vérifie si deux configurations hexasphere sont identiques
 */
export function areConfigsEqual(
    config1: HexasphereConfig,
    config2: HexasphereConfig
): boolean {
    const getValue = (config: HexasphereConfig, key: keyof HexasphereConfig) => 
        config[key] ?? DEFAULT_HEXASPHERE_CONFIG[key];
    
    return (
        getValue(config1, 'radius') === getValue(config2, 'radius') &&
        getValue(config1, 'subDivisions') === getValue(config2, 'subDivisions') &&
        getValue(config1, 'tileWidth') === getValue(config2, 'tileWidth')
    );
}

/**
 * Dimensions de la grille 2D (compatible avec la classe Planet)
 */
export interface GridDimensions {
    largeur: number; 
    hauteur: number; 
    totalCells: number;
    emptyCells: number; // (totalCells - tileCount)
}


export function calculerDimensionsGrille(
    nombreTuiles: number,
    ratio: number = 1.0
): GridDimensions {
    if (nombreTuiles <= 0) {
        return {
            largeur: 1,
            hauteur: 1,
            totalCells: 1,
            emptyCells: 1,
        };
    }

    // Calcul initial : grille la plus proche d'un carré
    const sqrt = Math.sqrt(nombreTuiles);
    let largeur = Math.ceil(sqrt);
    let hauteur = Math.ceil(nombreTuiles / largeur);

    // Ajuster selon le ratio souhaité (si différent de 1.0)
    if (ratio !== 1.0) {
        hauteur = Math.ceil(Math.sqrt(nombreTuiles / ratio));
        largeur = Math.ceil(nombreTuiles / hauteur);
    }

    // Optimisation : tester quelques combinaisons autour de la valeur calculée
    // pour trouver celle qui minimise le nombre de cellules vides
    let meilleureLargeur = largeur;
    let meilleureHauteur = hauteur;
    let minVides = largeur * hauteur - nombreTuiles;

    // Tester ±2 colonnes pour trouver la meilleure combinaison
    for (let testLargeur = Math.max(1, largeur - 2); testLargeur <= largeur + 2; testLargeur++) {
        const testHauteur = Math.ceil(nombreTuiles / testLargeur);
        const testVides = testLargeur * testHauteur - nombreTuiles;
        
        if (testVides < minVides) {
            minVides = testVides;
            meilleureLargeur = testLargeur;
            meilleureHauteur = testHauteur;
        }
    }

    const totalCells = meilleureLargeur * meilleureHauteur;
    const emptyCells = totalCells - nombreTuiles;

    return {
        largeur: meilleureLargeur,
        hauteur: meilleureHauteur,
        totalCells,
        emptyCells,
    };
}


export function calculerDimensionsGrilleFromHexasphere(
    ratio: number = 1.0
): GridDimensions {
    const hexData = getDefaultHexasphereData();
    return calculerDimensionsGrille(hexData.tileCount, ratio);
}

