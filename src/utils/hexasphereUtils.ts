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


    const sqrt = Math.sqrt(nombreTuiles);
    let largeur = Math.ceil(sqrt);
    let hauteur = Math.ceil(nombreTuiles / largeur);

    // Ajuster selon le ratio souhaité
    if (ratio !== 1.0) {
        hauteur = Math.ceil(Math.sqrt(nombreTuiles / ratio));
        largeur = Math.ceil(nombreTuiles / hauteur);
    }

    // Méthode 3 : Optimiser pour minimiser les cellules vides
    // Tester quelques combinaisons autour de la valeur calculée
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

export function calculerDimensionsGrilleLargeurFixe(
    nombreTuiles: number,
    largeurFixe: number
): GridDimensions {
    if (largeurFixe <= 0) {
        return calculerDimensionsGrille(nombreTuiles);
    }

    const hauteur = Math.ceil(nombreTuiles / largeurFixe);
    const totalCells = largeurFixe * hauteur;
    const emptyCells = totalCells - nombreTuiles;

    return {
        largeur: largeurFixe,
        hauteur,
        totalCells,
        emptyCells,
    };
}


export function calculerDimensionsGrilleHauteurFixe(
    nombreTuiles: number,
    hauteurFixe: number
): GridDimensions {
    if (hauteurFixe <= 0) {
        return calculerDimensionsGrille(nombreTuiles);
    }

    const largeur = Math.ceil(nombreTuiles / hauteurFixe);
    const totalCells = largeur * hauteurFixe;
    const emptyCells = totalCells - nombreTuiles;

    return {
        largeur,
        hauteur: hauteurFixe,
        totalCells,
        emptyCells,
    };
}

