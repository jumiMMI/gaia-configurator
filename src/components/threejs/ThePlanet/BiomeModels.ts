import { Asset } from "expo-asset";
import { Platform } from "react-native";
import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Stockage en mémoire
const loadedModels: Map<string, THREE.Object3D> = new Map();

const modelAssets: Record<string, any> = {
    'Forêt': require('../../../../assets/models/ForetTest.glb'),
    'Océan': require('../../../../assets/models/ForetTest.glb'),
    'Prairie': require('../../../../assets/models/ForetTest.glb'),
    'Désert': require('../../../../assets/models/DesertTest.glb'),
};

/**
 * charge les modèles en mémoire
 */
export async function loadAllBiomeModels(): Promise<void> {
    if (Platform.OS !== 'web') return;
    
    const loader = new GLTFLoader();
    
    for (const [biomeName, assetModule] of Object.entries(modelAssets)) {
        // skip si déjà chargé
        if (loadedModels.has(biomeName)) continue;
        
        const asset = Asset.fromModule(assetModule);
        await asset.downloadAsync();
        
        await new Promise<void>((resolve, reject) => {
            loader.load(asset.uri, (gltf: any) => {
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


export function getModelForBiome(biomeName: string): THREE.Object3D | null {
    const model = loadedModels.get(biomeName);
    if (!model) return null;
    return model.clone();
}


export function hasModelForBiome(biomeName: string): boolean {
    return loadedModels.has(biomeName);
}
