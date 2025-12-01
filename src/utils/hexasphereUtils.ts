import Hexasphere from 'hexasphere.js';

/**
 * Paramètres par défaut pour la génération de l'hexasphere
 * Ces valeurs doivent correspondre à celles utilisées dans Planet.tsx
 */
export const DEFAULT_HEXASPHERE_CONFIG = {
    radius: 2,
    subDivisions: 3,
    tileWidth: 0.95,
} as const;

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

/**
 * Configuration personnalisable pour l'hexasphere
 */
export interface HexasphereConfig {
    radius?: number;
    subDivisions?: number;
    tileWidth?: number;
}

/**
 * Génère les données hexasphere avec les paramètres spécifiés
 * Utilise les valeurs par défaut si non spécifiées
 * 
 * @param config - Configuration optionnelle pour l'hexasphere
 * @returns Les données hexasphere avec toutes les tuiles
 */
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
    largeur: number;  // Nombre de colonnes (cols)
    hauteur: number; // Nombre de lignes (rows)
    totalCells: number; // largeur × hauteur
    emptyCells: number; // Nombre de cellules vides (totalCells - tileCount)
}

/**
 * Calcule les dimensions optimales d'une grille 2D pour un nombre donné de tuiles
 * Basé sur le concept de la classe Planet avec largeur × hauteur
 * 
 * @param nombreTuiles - Nombre total de tuiles à placer dans la grille
 * @param ratio - Ratio largeur/hauteur souhaité (par défaut 1.0 = carré)
 * @returns Les dimensions de la grille (largeur, hauteur, totalCells, emptyCells)
 */
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

    // Méthode 1 : Calcul simple basé sur la racine carrée
    const sqrt = Math.sqrt(nombreTuiles);
    let largeur = Math.ceil(sqrt);
    let hauteur = Math.ceil(nombreTuiles / largeur);

    // Méthode 2 : Ajuster selon le ratio souhaité
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

/**
 * Calcule les dimensions de la grille à partir des données hexasphere
 * Utilise la configuration par défaut
 * 
 * @param ratio - Ratio largeur/hauteur souhaité (par défaut 1.0)
 * @returns Les dimensions de la grille
 */
export function calculerDimensionsGrilleFromHexasphere(
    ratio: number = 1.0
): GridDimensions {
    const hexData = getDefaultHexasphereData();
    return calculerDimensionsGrille(hexData.tileCount, ratio);
}

/**
 * Calcule les dimensions avec un nombre de colonnes fixe
 * Utile pour forcer une largeur spécifique
 * 
 * @param nombreTuiles - Nombre total de tuiles
 * @param largeurFixe - Nombre de colonnes fixe
 * @returns Les dimensions de la grille
 */
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

/**
 * Calcule les dimensions avec un nombre de lignes fixe
 * Utile pour forcer une hauteur spécifique
 * 
 * @param nombreTuiles - Nombre total de tuiles
 * @param hauteurFixe - Nombre de lignes fixe
 * @returns Les dimensions de la grille
 */
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

