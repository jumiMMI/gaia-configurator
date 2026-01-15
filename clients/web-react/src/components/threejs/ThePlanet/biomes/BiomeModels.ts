import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { applyNoiseToGeometry, createGrassInstances, createSubdividedHexagonGeometry } from './PrairieTerrain';

// Stockage en mémoire
const loadedModels: Map<string, THREE.Object3D> = new Map();

// Chemins publics vers les modèles GLB
const modelPaths: Record<string, string> = {
    'Forêt': '/models/foret.glb',
    'Désert': '/models/desert.glb',
    'Volcan': '/models/volcano.glb',
    'Glacier': '/models/glacier.glb',
};

/**
 * charge les modèles en mémoire
 */
export async function loadAllBiomeModels(): Promise<void> {
    const loader = new GLTFLoader();
    
    for (const [biomeName, modelPath] of Object.entries(modelPaths)) {
        // skip si déjà chargé
        if (loadedModels.has(biomeName)) continue;
        
        await new Promise<void>((resolve, reject) => {
            loader.load(modelPath, (gltf: any) => {
                const model = gltf.scene;
                model.scale.set(1, 1, 1);
                loadedModels.set(biomeName, model);
                console.log(`Modèle ${biomeName} chargé`);
                resolve();
            }, undefined, (error: any) => {
                console.error(`Erreur chargement ${biomeName}:`, error);
                reject(error);
            });
        });
    }
}


/**
 * Crée le terrain de prairie avec structure hexagonale subdivisée et relief
 */
async function createPrairieTerrain(
    boundary: THREE.Vector3[] | Array<{ x: number; y: number; z: number }>,
    center: THREE.Vector3,
    isFlat: boolean = false,
    hexRadius: number = 0.5
): Promise<THREE.Group> {
    const group = new THREE.Group();

    // Créer la géométrie hexagonale subdivisée (3 niveaux = ~61 vertices)
    const geometry = createSubdividedHexagonGeometry(
        boundary,
        center,
        3, // subdivisions
        isFlat,
        hexRadius
    );

    // Créer plusieurs collines avec Simplex Noise (variations de tailles et positions)
    applyNoiseToGeometry(
        geometry,
        {
            intensity: 0.5,    // Hauteur maximale des collines
            frequency: 1.2,     // Fréquence pour positionner les collines (plus élevé = plus de collines)
            hillSize: 0.2,     // Taille des collines (0.2 = petites, 0.4 = grandes)
        },
        isFlat,
        center,
        hexRadius
    );

    // Créer le matériau de base (vert prairie)
    const material = new THREE.MeshStandardMaterial({
        color: 0x84cc16, // Couleur prairie
        flatShading: false,
        wireframe: false,
        side: THREE.DoubleSide, // Rendre les deux côtés visibles
    });

    // Créer le mesh du terrain
    const terrain = new THREE.Mesh(geometry, material);
    group.add(terrain);

    // Instancier les herbes sur le terrain
    const grassInstances = await createGrassInstances(geometry, isFlat, center, hexRadius);
    if (grassInstances) {
        group.add(grassInstances);
    }

    return group;
}

export async function getModelForBiome(
    biomeName: string,
    options?: {
        boundary?: THREE.Vector3[] | Array<{ x: number; y: number; z: number }>;
        center?: THREE.Vector3;
        isFlat?: boolean;
        hexRadius?: number;
    }
): Promise<THREE.Object3D | null> {
    // Si c'est une prairie, créer le terrain procédural
    if (biomeName === 'Prairie') {
        if (options && options.boundary && options.center) {
            return await createPrairieTerrain(
                options.boundary,
                options.center,
                options.isFlat ?? false,
                options.hexRadius ?? 0.5
            );
        }
        // Si les options ne sont pas fournies, retourner null
        console.warn('Prairie nécessite des options (boundary, center) pour être créée');
        return null;
    }

    // Pour les autres biomes, utiliser les modèles GLB
    const model = loadedModels.get(biomeName);
    if (!model) {
        return null;
    }
    return model.clone();
}


export function hasModelForBiome(biomeName: string): boolean {
    if (biomeName === 'Prairie') return true;
    return loadedModels.has(biomeName);
}

