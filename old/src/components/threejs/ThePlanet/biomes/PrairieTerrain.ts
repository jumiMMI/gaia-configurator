import { Asset } from "expo-asset";
import { Platform } from "react-native";
import { createNoise2D } from 'simplex-noise';
import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// @ts-ignore
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';


export function createSubdividedHexagonGeometry(
    boundary: THREE.Vector3[] | Array<{ x: number; y: number; z: number }>,
    center: THREE.Vector3,
    subdivisions: number = 3,
    isFlat: boolean = false,
    hexRadius: number = 0.5
): THREE.BufferGeometry {
    // Convertir les boundary points en Vector3 si nécessaire
    const boundaryPoints: THREE.Vector3[] = boundary.map(p => {
        if (p instanceof THREE.Vector3) {
            return p.clone();
        }
        return new THREE.Vector3(p.x, p.y, p.z);
    });

    // Pour la version plate, créer un hexagone régulier centré à l'origine
    // (le groupe sera positionné après)
    if (isFlat) {
        const flatBoundary: THREE.Vector3[] = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            const x = hexRadius * Math.cos(angle);
            const z = hexRadius * Math.sin(angle);
            flatBoundary.push(new THREE.Vector3(x, 0, z));
        }
        // Pour la version plate, créer l'hexagone centré à l'origine
        const origin = new THREE.Vector3(0, 0, 0);
        return createSubdividedHexagonFromPoints(flatBoundary, origin, subdivisions, true);
    }

    // Pour la version sphérique, utiliser les boundary points fournis
    return createSubdividedHexagonFromPoints(boundaryPoints, center.clone(), subdivisions, false);
}

/**
 * Crée la géométrie subdivisée à partir des points du périmètre
 */
function createSubdividedHexagonFromPoints(
    boundaryPoints: THREE.Vector3[],
    center: THREE.Vector3,
    subdivisions: number,
    isFlat: boolean = false
): THREE.BufferGeometry {
    const vertices: THREE.Vector3[] = [];
    const indices: number[] = [];
    const vertexMap = new Map<string, number>();

    // Fonction pour obtenir ou créer un vertex
    function getVertexIndex(v: THREE.Vector3): number {
        const key = `${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}`;
        if (vertexMap.has(key)) {
            return vertexMap.get(key)!;
        }
        const index = vertices.length;
        vertices.push(v.clone());
        vertexMap.set(key, index);
        return index;
    }

    // Fonction pour subdiviser un triangle
    function subdivideTriangle(
        v0: THREE.Vector3,
        v1: THREE.Vector3,
        v2: THREE.Vector3,
        level: number
    ): void {
        if (level === 0) {
            // Niveau final : créer le triangle
            // Ordre inversé pour que les faces pointent vers le haut (règle de la main droite)
            const i0 = getVertexIndex(v0);
            const i1 = getVertexIndex(v1);
            const i2 = getVertexIndex(v2);
            indices.push(i0, i2, i1); // Ordre inversé pour orientation correcte
            return;
        }

        // Calculer les points médians (sans normalisation - terrain plat)
        const m01 = v0.clone().add(v1).multiplyScalar(0.5);
        const m12 = v1.clone().add(v2).multiplyScalar(0.5);
        const m20 = v2.clone().add(v0).multiplyScalar(0.5);

        // Subdiviser en 4 triangles
        subdivideTriangle(v0, m01, m20, level - 1);
        subdivideTriangle(m01, v1, m12, level - 1);
        subdivideTriangle(m20, m12, v2, level - 1);
        subdivideTriangle(m01, m12, m20, level - 1);
    }

    // Créer les triangles initiaux depuis le centre vers chaque paire de boundary points
    const numBoundaryPoints = boundaryPoints.length;
    for (let i = 0; i < numBoundaryPoints; i++) {
        const nextIndex = (i + 1) % numBoundaryPoints;
        subdivideTriangle(
            center,
            boundaryPoints[i],
            boundaryPoints[nextIndex],
            subdivisions
        );
    }

    // Créer la BufferGeometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(vertices.length * 3);
    
    for (let i = 0; i < vertices.length; i++) {
        positions[i * 3] = vertices[i].x;
        positions[i * 3 + 1] = vertices[i].y;
        positions[i * 3 + 2] = vertices[i].z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
}


export function applyNoiseToGeometry(
    geometry: THREE.BufferGeometry,
    options: {
        intensity?: number;      // Amplitude du relief (défaut: 0.15)
        frequency?: number;       // Fréquence pour positionner les collines (défaut: 0.8)
        hillSize?: number;        // Taille des collines (défaut: 0.3)
        seed?: number;           // Seed pour le noise (optionnel)
    },
    isFlat: boolean,
    center: THREE.Vector3,
    hexRadius: number
): void {
    const {
        intensity = 0.15,
        frequency = 0.8,         // Fréquence pour positionner les collines
        hillSize = 0.3,          // Rayon d'influence des collines (normalisé 0-1)
        seed
    } = options;

    // Créer l'instance SimplexNoise
    const noise2D = seed !== undefined 
        ? createNoise2D(() => seed) 
        : createNoise2D();

    // Récupérer l'attribut position
    const positions = geometry.getAttribute('position');
    if (!positions) return;

    const vertices = positions.array as Float32Array;
    const vertexCount = positions.count;

    // Parcourir tous les vertices
    for (let i = 0; i < vertexCount; i++) {
        const idx = i * 3;
        const x = vertices[idx];
        const y = vertices[idx + 1];
        const z = vertices[idx + 2];

        // Calculer la distance depuis le centre
        let distanceFromCenter: number;
        if (isFlat) {
            distanceFromCenter = Math.sqrt(x * x + z * z);
        } else {
            const vertexPos = new THREE.Vector3(x, y, z);
            distanceFromCenter = vertexPos.distanceTo(center);
        }

        const maxRadius = hexRadius;
        const normalizedDistance = distanceFromCenter / maxRadius;

        // Ne pas modifier les vertices des bords
        if (normalizedDistance >= 0.95) {
            continue;
        }

        // Utiliser le Simplex Noise pour créer plusieurs collines avec variations
        // Le noise détermine la "force" de la colline à cette position
        const noiseValue = noise2D(x * frequency, z * frequency);
        
        // Normaliser entre 0 et 1
        let hillStrength = (noiseValue + 1) * 0.5;
        
        // Appliquer une courbe pour créer des pics de collines plus marqués
        // Plus la valeur est élevée, plus on crée une colline
        hillStrength = Math.pow(hillStrength, 2.5);
        
        // Seulement créer une colline si le noise est assez élevé
        // Cela crée des zones avec collines et des zones plates
        if (hillStrength < 0.4) {
            continue; // Zone plate, pas de colline
        }

        // Pour chaque position avec une colline, calculer sa forme
        // Utiliser plusieurs "samples" de noise autour pour créer une colline locale
        const sampleRadius = hexRadius * hillSize; // Rayon d'échantillonnage
        const numSamples = 8; // Nombre de samples autour du vertex
        
        let maxHillStrength = hillStrength;
        let hillCenterX = x;
        let hillCenterZ = z;
        
        // Trouver le point local maximum (centre de la colline)
        for (let s = 0; s < numSamples; s++) {
            const angle = (s / numSamples) * Math.PI * 2;
            const sampleX = x + Math.cos(angle) * sampleRadius * 0.3;
            const sampleZ = z + Math.sin(angle) * sampleRadius * 0.3;
            const sampleNoise = noise2D(sampleX * frequency, sampleZ * frequency);
            const sampleStrength = Math.pow((sampleNoise + 1) * 0.5, 2.5);
            
            if (sampleStrength > maxHillStrength) {
                maxHillStrength = sampleStrength;
                hillCenterX = sampleX;
                hillCenterZ = sampleZ;
            }
        }
        
        // Distance depuis le centre de cette colline
        const distToHillCenter = Math.sqrt(
            (x - hillCenterX) * (x - hillCenterX) + 
            (z - hillCenterZ) * (z - hillCenterZ)
        );
        
        // Rayon d'influence de la colline
        const hillRadius = hexRadius * hillSize;
        
        // Calculer l'influence de la colline (forme de colline basée sur la distance)
        const distNormalized = Math.min(distToHillCenter / hillRadius, 1.0);
        const hillInfluence = 1.0 - distNormalized; // 1.0 au centre, 0.0 au bord
        const hillCurve = Math.pow(hillInfluence, 2.0); // Courbe quadratique pour colline douce
        
        // Hauteur de la colline (force du noise × forme de la colline)
        const hillHeight = maxHillStrength * hillCurve;
        
        // Protection des bords (fade out progressif)
        const borderFade = normalizedDistance > 0.75 
            ? 1.0 - ((normalizedDistance - 0.75) / 0.2) 
            : 1.0;
        
        // Calculer l'offset de hauteur final
        const heightOffset = hillHeight * intensity * borderFade;

        // Appliquer la hauteur modifiée
        vertices[idx + 1] = y + heightOffset;
    }

    // Mettre à jour la géométrie
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
}

/**
 * Charge le modèle d'herbe depuis les assets
 */
let grassModelCache: THREE.Object3D | null = null;

/**
 * Vide le cache du modèle d'herbe (utile après modification du fichier)
 */
export function clearGrassModelCache(): void {
    grassModelCache = null;
    console.log('Cache du modèle herbe vidé');
}

async function loadGrassModel(forceReload: boolean = false): Promise<THREE.Object3D | null> {
    if (Platform.OS !== 'web') return null;
    
    // Toujours vider le cache pour forcer le rechargement du nouveau fichier
    grassModelCache = null;
    
    try {
        const grassAsset = require('../../../../../assets/models/herbes.glb');
        console.log('Chargement du modèle herbes.glb...');
        const asset = Asset.fromModule(grassAsset);
        await asset.downloadAsync();
        
        const loader = new GLTFLoader();
        return new Promise<THREE.Object3D | null>((resolve, reject) => {
            // Ajouter un timestamp pour forcer le rechargement et éviter le cache navigateur
            const url = asset.uri + '?t=' + Date.now();
            console.log('Chargement depuis:', url);
            loader.load(url, (gltf: any) => {
                const model = gltf.scene;
                model.scale.set(1, 1, 1);
                grassModelCache = model;
                console.log('Modèle herbes.glb chargé avec succès');
                resolve(model.clone());
            }, undefined, (error: any) => {
                console.error('Erreur chargement herbes:', error);
                reject(error);
            });
        });
    } catch (error) {
        console.error('Erreur lors du chargement du modèle herbes.glb:', error);
        return null;
    }
}


export async function createGrassInstances(
    terrainGeometry: THREE.BufferGeometry,
    isFlat: boolean,
    center: THREE.Vector3,
    hexRadius: number
): Promise<THREE.InstancedMesh | null> {
    // Charger le modèle d'herbe (toujours forcer le rechargement)
    const grassModel = await loadGrassModel(true);
    if (!grassModel) {
        console.warn('Impossible de charger le modèle herbe');
        return null;
    }

    // Récupérer TOUTES les géométries du modèle d'herbe (plusieurs groupes d'herbes)
    const geometries: THREE.BufferGeometry[] = [];
    grassModel.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
            // Cloner la géométrie pour éviter de modifier l'originale
            const clonedGeometry = child.geometry.clone();
            // Appliquer la transformation du mesh à la géométrie
            clonedGeometry.applyMatrix4(child.matrixWorld);
            geometries.push(clonedGeometry);
        }
    });

    if (geometries.length === 0) {
        console.warn('Aucune géométrie trouvée dans le modèle herbes');
        return null;
    }

    // Combiner toutes les géométries en une seule
    const grassGeometry = mergeGeometries(geometries);
    console.log(`Modèle herbes: ${geometries.length} géométries combinées`);

    // Récupérer les positions et normales du terrain
    const positions = terrainGeometry.getAttribute('position');
    if (!positions) return null;

    const terrainVertices = positions.array as Float32Array;
    const vertexCount = positions.count;
    
    // Récupérer les normales du terrain (pour orienter les herbes selon les courbures)
    const normals = terrainGeometry.getAttribute('normal');
    if (!normals) {
        console.warn('Pas de normales trouvées dans la géométrie du terrain');
        return null;
    }

    // Calculer le nombre d'instances (une herbe tous les X vertices, éviter les bords)
    const grassDensity = 0.7; // 70% des vertices auront de l'herbe (beaucoup plus dense)
    const maxInstances = Math.floor(vertexCount * grassDensity);
    const instanceCount = Math.min(maxInstances, 5000); // Limiter à 2000 instances max

    // Créer l'InstancedMesh
    const instancedMesh = new THREE.InstancedMesh(
        grassGeometry,
        new THREE.MeshStandardMaterial({ color: 0x4a7c3f }), // Vert herbe
        instanceCount
    );

    const dummy = new THREE.Object3D();
    let instanceIndex = 0;

    // Parcourir les vertices du terrain pour placer l'herbe
    for (let i = 0; i < vertexCount && instanceIndex < instanceCount; i++) {
        const idx = i * 3;
        const x = terrainVertices[idx];
        const y = terrainVertices[idx + 1];
        const z = terrainVertices[idx + 2];

        // Calculer la distance depuis le centre
        let distanceFromCenter: number;
        if (isFlat) {
            distanceFromCenter = Math.sqrt(x * x + z * z);
        } else {
            const vertexPos = new THREE.Vector3(x, y, z);
            distanceFromCenter = vertexPos.distanceTo(center);
        }

        const normalizedDistance = distanceFromCenter / hexRadius;

        // Éviter les bords (ne pas placer d'herbe trop près des bords)
        if (normalizedDistance > 0.9) {
            continue;
        }


        const normalX = normals.array[idx];
        const normalY = normals.array[idx + 1];
        const normalZ = normals.array[idx + 2];
        const terrainNormal = new THREE.Vector3(normalX, normalY, normalZ).normalize();

        const isPeak = terrainNormal.y >1.0;
        if (isPeak) {
            continue; // Skip seulement les sommets très pointus
        }

        // Probabilité aléatoire pour placer l'herbe (densité)
        if (Math.random() > grassDensity) {
            continue;
        }

        // Position de l'herbe (sur le terrain)
        dummy.position.set(x, y, z);

        // La normale a déjà été récupérée et vérifiée plus haut

        // Orienter l'herbe selon la normale du terrain (suivre les courbures/collines)
        dummy.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0), // Direction "haut" de l'herbe
            terrainNormal // Direction de la normale du terrain (suivre la pente)
        );

        // Appliquer une rotation aléatoire autour de la normale pour variété
        const randomRotationY = Math.random() * Math.PI * 2;
        const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(
            terrainNormal,
            randomRotationY
        );
        dummy.quaternion.multiply(rotationQuaternion);

        // Scale aléatoire pour variété (légèrement moins que 1.5-1.7 : 1.3 à 1.5)
        const baseScale = 1.3; // Scale un peu moins que 1.5
        const variation = 0.2; // Petite variation
        const scale = baseScale + Math.random() * variation;
        dummy.scale.setScalar(scale);

        dummy.updateMatrix();
        instancedMesh.setMatrixAt(instanceIndex, dummy.matrix);
        instanceIndex++;
    }

    // Ajuster le nombre d'instances si nécessaire
    if (instanceIndex < instanceCount) {
        instancedMesh.count = instanceIndex;
    }

    instancedMesh.instanceMatrix.needsUpdate = true;

    return instancedMesh;
}

/**
 * Fonction utilitaire pour tester la création de la géométrie
 * Retourne des statistiques sur la géométrie créée
 */
export function getGeometryStats(geometry: THREE.BufferGeometry): {
    vertexCount: number;
    triangleCount: number;
} {
    const position = geometry.getAttribute('position');
    const index = geometry.getIndex();
    
    return {
        vertexCount: position ? position.count : 0,
        triangleCount: index ? index.count / 3 : 0,
    };
}

