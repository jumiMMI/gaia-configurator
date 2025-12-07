import * as THREE from 'three';
import { BiomeData } from '../../../party/messages';
import { getDefaultHexasphereData } from '../../../utils/hexasphereUtils';
import { getModelForBiome } from './BiomeModels';

const DEFAULT_TILE_COLOR = 0x084495;

const placedModels: Map<number, THREE.Object3D> = new Map();

export default function createPlanet(): THREE.Group {
    const hexasphereData = getDefaultHexasphereData();
    const group = new THREE.Group();

    // Créer un mesh par tuile
    for (let i = 0; i < hexasphereData.hexasphere.tiles.length; i++) {
        const tile = hexasphereData.hexasphere.tiles[i];
        const geometry = createTileGeometry(tile);
        const material = new THREE.MeshBasicMaterial({
            color: DEFAULT_TILE_COLOR,
            side: THREE.DoubleSide,
            // wireframe: true,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.tileIndex = i;
        const centerVec = new THREE.Vector3(
            Number(tile.centerPoint.x),
            Number(tile.centerPoint.y),
            Number(tile.centerPoint.z)
        );

        const boundaryVec = new THREE.Vector3(
            Number(tile.boundary[0].x),
            Number(tile.boundary[0].y),
            Number(tile.boundary[0].z)
        );

        const boundary1 = new THREE.Vector3(
            Number(tile.boundary[1].x),
            Number(tile.boundary[1].y),
            Number(tile.boundary[1].z)
        );
        
        // Stocker dans userData
        mesh.userData.boundary0 = { x: boundaryVec.x, y: boundaryVec.y, z: boundaryVec.z };
        mesh.userData.boundary1 = { x: boundary1.x, y: boundary1.y, z: boundary1.z };
        mesh.userData.sideCount = tile.boundary.length;
        mesh.userData.isPentagon = tile.boundary.length === 5;

        mesh.userData.hexRadius = centerVec.distanceTo(boundaryVec);
        mesh.userData.centerPoint = {
            x: centerVec.x,
            y: centerVec.y,
            z: centerVec.z
        };
        group.add(mesh);
    }

    return group;
}

export function animatePlanet(planet: THREE.Group) {
    planet.rotation.y += 0.001;
}

// update les biomes
export function updatePlanetBiomes(planet: THREE.Group, tileBiomes: Record<number, BiomeData>) {
    planet.children.forEach((child) => {
        if (!(child instanceof THREE.Mesh)) return;

        const tileIndex = child.userData.tileIndex;
        const biomeData = tileBiomes[tileIndex];
        const centerPoint = child.userData.centerPoint;

        if (biomeData) {
            const color = new THREE.Color(biomeData.couleur);
            (child.material as THREE.MeshBasicMaterial).color = color;

            if (!placedModels.has(tileIndex)) {
                
                const model = getModelForBiome(biomeData.nom);
                const b0 = child.userData.boundary0;
                const b1 = child.userData.boundary1;
                if (model && centerPoint && b0 && b1) {
                    // Positionner au centre de la tuile
                    model.position.set(centerPoint.x, centerPoint.y, centerPoint.z);
                    const up = new THREE.Vector3(0, 1, 0);
                    const normal = new THREE.Vector3(centerPoint.x, centerPoint.y, centerPoint.z).normalize();
                    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
                    model.quaternion.copy(quaternion);

                    const box = new THREE.Box3().setFromObject(model);
                    const modelSize = new THREE.Vector3();
                    box.getSize(modelSize);

                    const hexDiameter = child.userData.hexRadius * 2;
                    const modelDiameter = Math.max(modelSize.x, modelSize.y, modelSize.z);
                    const scale = (hexDiameter / modelDiameter) * (2 / Math.sqrt(3));
                    model.scale.setScalar(scale);

                    // Calculer la direction du côté de l'hexagone (b0 → b1)
                    const edgeDirection = new THREE.Vector3(b1.x - b0.x, b1.y - b0.y, b1.z - b0.z);
                    // Projeter sur le plan tangent
                    const dot = edgeDirection.dot(normal);
                    edgeDirection.sub(normal.clone().multiplyScalar(dot));
                    edgeDirection.normalize();
                    
                    const modelAxisX = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
                    
                    const angleCorrection = Math.atan2(
                        edgeDirection.clone().cross(modelAxisX).dot(normal),
                        edgeDirection.dot(modelAxisX)
                    );
                    
                    // offset pour l'orientation
                    const offsetDegrees = 30; 
                    const offset = THREE.MathUtils.degToRad(offsetDegrees);
                    
                    // appliquer la rotation de correction autour de la normale
                    const quaternionCorrection = new THREE.Quaternion().setFromAxisAngle(normal, -angleCorrection + offset);
                    model.quaternion.premultiply(quaternionCorrection);


                    planet.add(model);
                    placedModels.set(tileIndex, model);
                }
            }
        } else {

            (child.material as THREE.MeshBasicMaterial).color.setHex(DEFAULT_TILE_COLOR);

            // supp modele
            const existingModel = placedModels.get(tileIndex);
            if (existingModel) {
                planet.remove(existingModel);
                placedModels.delete(tileIndex);
            }
        }
    });
}


function createTileGeometry(tile: any): THREE.BufferGeometry {
    const vertices: number[] = [];
    const indices: number[] = [];

    // Ajouter le centre
    const centerX = Number(tile.centerPoint.x);
    const centerY = Number(tile.centerPoint.y);
    const centerZ = Number(tile.centerPoint.z);
    vertices.push(centerX, centerY, centerZ);

    // Ajouter les points du boundary
    for (let j = 0; j < tile.boundary.length; j++) {
        const bp = tile.boundary[j];
        vertices.push(Number(bp.x), Number(bp.y), Number(bp.z));
    }

    // Créer les triangles
    for (let j = 0; j < tile.boundary.length; j++) {
        indices.push(
            0,
            j + 1,
            ((j + 1) % tile.boundary.length) + 1
        );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
}

