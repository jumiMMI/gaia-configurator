import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { applyNoiseToGeometry, createGrassInstances, createSubdividedHexagonGeometry } from './PrairieTerrain';

const loadedModels: Map<string, THREE.Object3D> = new Map();
const waterMaterials: Map<string, THREE.MeshStandardMaterial[]> = new Map();
const modelPaths: Record<string, string> = {
    'Forêt': '/models/foret.glb',
    'Désert': '/models/desert.glb',
    'Volcan': '/models/volcano.glb',
    'Glacier': '/models/glacier.glb',
};

function findAllMaterials(model: THREE.Object3D): THREE.Material[] {
    const materials: THREE.Material[] = [];
    
    model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
            const materialArray = Array.isArray(child.material) 
                ? child.material 
                : [child.material];
                
            materialArray.forEach(mat => {
                if (!materials.includes(mat)) {
                    materials.push(mat);
                }
            });
        }
    });
    
    return materials;
}

function findMaterialByName(
    model: THREE.Object3D, 
    materialName: string
): THREE.MeshStandardMaterial | null {
    let foundMaterial: THREE.MeshStandardMaterial | null = null;
    
    model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
            const materialArray = Array.isArray(child.material) 
                ? child.material 
                : [child.material];
                
            materialArray.forEach(mat => {
                const matName = mat.name || (mat as any).userData?.name || '';
                
                if (matName.toLowerCase().includes(materialName.toLowerCase())) {
                    if (mat instanceof THREE.MeshStandardMaterial || 
                        mat instanceof THREE.MeshPhysicalMaterial) {
                        foundMaterial = mat as THREE.MeshStandardMaterial;
                    }
                }
            });
        }
    });
    
    return foundMaterial;
}

export async function loadAllBiomeModels(): Promise<void> {
    const loader = new GLTFLoader();
    
    for (const [biomeName, modelPath] of Object.entries(modelPaths)) {
        if (loadedModels.has(biomeName)) continue;
        
        await new Promise<void>((resolve, reject) => {
            loader.load(modelPath, (gltf: any) => {
                const model = gltf.scene;
                model.scale.set(1, 1, 1);
                loadedModels.set(biomeName, model);
                
                if (biomeName === 'Glacier') {
                    
                    const allMaterials = findAllMaterials(model);
                    
                    allMaterials.forEach((mat, index) => {
                        const matName = mat.name || (mat as any).userData?.name || 'Sans nom';
                        const matType = mat.type;
                        
                        if (mat instanceof THREE.MeshStandardMaterial || 
                            mat instanceof THREE.MeshPhysicalMaterial) {
                            const standardMat = mat as THREE.MeshStandardMaterial;
                        }
                    });
                    
                    const waterMaterial = findMaterialByName(model, 'water-glacier');
                    
                    if (waterMaterial) {
                        if (!waterMaterials.has('Glacier')) {
                            waterMaterials.set('Glacier', []);
                        }
                        waterMaterials.get('Glacier')!.push(waterMaterial);
                    } else {
                    }
                }
                
                resolve();
            }, undefined, (error: any) => {
                console.error(`Erreur chargement ${biomeName}:`, error);
                reject(error);
            });
        });
    }
}


async function createPrairieTerrain(
    boundary: THREE.Vector3[] | Array<{ x: number; y: number; z: number }>,
    center: THREE.Vector3,
    isFlat: boolean = false,
    hexRadius: number = 0.5
): Promise<THREE.Group> {
    const group = new THREE.Group();

    const geometry = createSubdividedHexagonGeometry(
        boundary,
        center,
        3,
        isFlat,
        hexRadius
    );

    applyNoiseToGeometry(
        geometry,
        {
            intensity: 0.5,
            frequency: 1.2,
            hillSize: 0.2,
        },
        isFlat,
        center,
        hexRadius
    );

    const material = new THREE.MeshStandardMaterial({
        color: 0x84cc16,
        flatShading: false,
        wireframe: false,
        side: THREE.DoubleSide,
    });

    const terrain = new THREE.Mesh(geometry, material);
    group.add(terrain);

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
    if (biomeName === 'Prairie') {
        if (options && options.boundary && options.center) {
            return await createPrairieTerrain(
                options.boundary,
                options.center,
                options.isFlat ?? false,
                options.hexRadius ?? 0.5
            );
        }
        console.warn('Prairie nécessite des options (boundary, center) pour être créée');
        return null;
    }

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

export function getWaterMaterialsForBiome(biomeName: string): THREE.MeshStandardMaterial[] {
    return waterMaterials.get(biomeName) || [];
}

export function findWaterMaterialsInScene(scene: THREE.Object3D): THREE.MeshPhysicalMaterial[] {
    const materials: THREE.MeshPhysicalMaterial[] = [];
    
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
            const material = Array.isArray(child.material) 
                ? child.material[0] 
                : child.material;
            
            if (material instanceof THREE.MeshPhysicalMaterial) {
                if (material.name === 'water-glacier' && material.normalMap) {
                    if (!materials.includes(material)) {
                        material.normalMap.wrapS = THREE.RepeatWrapping;
                        material.normalMap.wrapT = THREE.RepeatWrapping;
                        materials.push(material);
                    }
                }
            }
        }
    });
    
    return materials;
}

export function findIceGlacierMaterialsInScene(scene: THREE.Object3D): THREE.Material[] {
    const materials: THREE.Material[] = [];
    const processed = new Set<THREE.Material>();
    
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
            const materialArray = Array.isArray(child.material) 
                ? child.material 
                : [child.material];
            
            materialArray.forEach(material => {
                if (!processed.has(material)) {
                    if (material.name && (
                        material.name === 'Material.008' ||
                        (material.name.toLowerCase().includes('glacier') && 
                         material.name !== 'water-glacier' &&
                         !material.name.toLowerCase().includes('water'))
                    )) {
                        if (material instanceof THREE.MeshStandardMaterial || 
                            material instanceof THREE.MeshPhysicalMaterial) {
                            if (!materials.includes(material)) {
                                materials.push(material);
                                processed.add(material);
                            }
                        }
                    }
                }
            });
        }
    });
    
    return materials;
}

const processedEmissiveMaterials = new Set<THREE.Material>();
const processedVolcanoEmissiveMaterials = new Set<THREE.Material>();

export function applyEmissivityToVolcanoMaterials(scene: THREE.Object3D): void {
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
            const materialArray = Array.isArray(child.material) 
                ? child.material 
                : [child.material];
            
            materialArray.forEach(material => {
                if (!processedVolcanoEmissiveMaterials.has(material)) {
                    if (material.name && (
                        material.name.toLowerCase().includes('volcan') ||
                        material.name.toLowerCase().includes('volcano') ||
                        material.name.toLowerCase().includes('lava') ||
                        material.name.toLowerCase().includes('magma')
                    )) {
                        if (material instanceof THREE.MeshStandardMaterial || 
                            material instanceof THREE.MeshPhysicalMaterial) {    
                            material.emissive = new THREE.Color(0xff6600);
                            material.emissiveIntensity = 0.4;
                            processedVolcanoEmissiveMaterials.add(material);
                        }
                    }
                }
            });
        }
    });
}

export function applyEmissivityToGlacierMaterials(scene: THREE.Object3D): void {
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
            const materialArray = Array.isArray(child.material) 
                ? child.material 
                : [child.material];
            
            materialArray.forEach(material => {
                if (!processedEmissiveMaterials.has(material)) {
                    if (material.name && (
                        material.name.toLowerCase().includes('glacier') ||
                        material.name.toLowerCase().includes('ice') ||
                        material.name === 'water-glacier' ||
                        material.name === 'Material.008'
                    )) {
                        if (material instanceof THREE.MeshStandardMaterial || 
                            material instanceof THREE.MeshPhysicalMaterial) {
                            
                            if (material.name === 'water-glacier') {
                                material.emissive = new THREE.Color(0, 0.238, 1);
                                material.emissiveIntensity = 0.96;
                            } else {
                                material.emissive = new THREE.Color(0, 0, 1);
                                material.emissiveIntensity = 0.6;
                                material.color = new THREE.Color(0xC8E6FF);
                            }
                            processedEmissiveMaterials.add(material);
                        }
                    }
                }
            });
        }
    });
}

export function animateWaterMaterials(materials: THREE.MeshPhysicalMaterial[], dt: number): void {
    if (materials.length === 0) return;
    
    materials.forEach((material) => {
        if (material.normalMap) {
            const speedX = 0.035;
            const speedY = 0.028;
            

            material.normalMap.offset.x += speedX * dt;
            material.normalMap.offset.y += speedY * dt;
            

            material.normalMap.offset.x = material.normalMap.offset.x % 1;
            material.normalMap.offset.y = material.normalMap.offset.y % 1;
            

            material.normalMap.needsUpdate = true;
            material.needsUpdate = true;
        }
    });
}

export function findVolcanoMaterialsInScene(scene: THREE.Object3D): THREE.Material[] {
    const materials: THREE.Material[] = [];
    const processed = new Set<THREE.Material>();
    
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
            const materialArray = Array.isArray(child.material) 
                ? child.material 
                : [child.material];
            
            materialArray.forEach(material => {
                if (!processed.has(material)) {
                    if (material.name && (
                        material.name.toLowerCase().includes('volcan') ||
                        material.name.toLowerCase().includes('volcano') ||
                        material.name.toLowerCase().includes('lava') ||
                        material.name.toLowerCase().includes('magma')
                    )) {
                        if (material instanceof THREE.MeshStandardMaterial || 
                            material instanceof THREE.MeshPhysicalMaterial) {
                            if (!materials.includes(material)) {
                                materials.push(material);
                                processed.add(material);
                            }
                        }
                    }
                }
            });
        }
    });
    
    return materials;
}

const volcanoAnimationTimes = new Map<THREE.Material, number>();

export function animateVolcanoEmissivity(materials: THREE.Material[], dt: number): void {
    if (materials.length === 0) return;
    
    materials.forEach(material => {
        if (material instanceof THREE.MeshStandardMaterial || 
            material instanceof THREE.MeshPhysicalMaterial) {
            
            if (!volcanoAnimationTimes.has(material)) {
                const randomOffset = Math.random() * Math.PI * 2;
                volcanoAnimationTimes.set(material, randomOffset);
            }
            
            let animationTime = volcanoAnimationTimes.get(material)!;
            animationTime += dt;
            volcanoAnimationTimes.set(material, animationTime);
            
            const baseIntensity = 0.3;
            const amplitude = 0.9;
            const speed = 1.5;
            
            const pulsation = Math.sin(animationTime * speed) * 0.5 + 0.5;
            
            material.emissiveIntensity = baseIntensity + (amplitude * pulsation);
            material.needsUpdate = true;
        }
    });
}
