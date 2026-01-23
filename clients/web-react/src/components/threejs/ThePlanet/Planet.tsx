import { BiomeData, calculerDimensionsGrilleFromHexasphere, DEFAULT_TILE_COUNT, getDefaultHexasphereData } from '@gaia/shared';
import * as THREE from 'three';
import { getModelForBiome } from './biomes/BiomeModels';

const DEFAULT_TILE_COLOR = 0x084495;
const OCEAN_TILE_COLOR = 0x3b82f6;
const VOLCAN_TILE_COLOR = 0x1E0C0D; // #1E0C0DFF
const HEX_RADIUS = 0.5;

/**
 * Génère une couleur aléatoire pour les tuiles
 */
function getRandomTileColor(): number {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    // Convertir en hexadécimal
    return (r << 16) | (g << 8) | b;
}

const placedModels: Map<number, THREE.Object3D> = new Map();
const placedModelsFlat: Map<number, THREE.Object3D> = new Map();
const playerZoneLines: Map<number, THREE.Line> = new Map();

export default function createPlanet(): THREE.Group {
    const hexasphereData = getDefaultHexasphereData();
    const group = new THREE.Group();

    for (let i = 0; i < hexasphereData.hexasphere.tiles.length; i++) {
        const tile = hexasphereData.hexasphere.tiles[i];

        const geometry = createTileGeometry(tile);
        // Initialiser toutes les tuiles avec la couleur océan par défaut
        const material = new THREE.MeshBasicMaterial({
            color: OCEAN_TILE_COLOR,
            side: THREE.DoubleSide,
            // wireframe: true,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.tileIndex = i;

        const center = new THREE.Vector3(
            Number(tile.centerPoint.x),
            Number(tile.centerPoint.y),
            Number(tile.centerPoint.z)
        );

        const boundary0 = new THREE.Vector3(
            Number(tile.boundary[0].x),
            Number(tile.boundary[0].y),
            Number(tile.boundary[0].z)
        );

        mesh.userData.centerPoint = center;
        mesh.userData.hexRadius = center.distanceTo(boundary0);

        // Stocker les boundary points pour le calcul de scale basé sur la longueur moyenne des arêtes
        mesh.userData.boundary = tile.boundary.map((p: { x: string | number; y: string | number; z: string | number }) => ({
            x: Number(p.x),
            y: Number(p.y),
            z: Number(p.z)
        }));

        group.add(mesh);
    }

    return group;
}



// export function animatePlanet(planet: THREE.Group) {
//     planet.rotation.y += 0.001;
// }

export function rotatePlanet(planet: THREE.Group, velocityX: number, velocityY: number): void {
    const rotationSpeed = 0.05;
    planet.rotation.y -= velocityY * rotationSpeed;
    const newRotationX = planet.rotation.x - velocityX * rotationSpeed;
    planet.rotation.x = Math.max(-0.8, Math.min(0.8, newRotationX));
}

// update les biomes
export async function updatePlanetBiomes(planet: THREE.Group, tileBiomes: Record<number, BiomeData>) {
    for (const child of planet.children) {
        if (!(child instanceof THREE.Mesh)) continue;

        const tileIndex = child.userData.tileIndex;
        const biomeData = tileBiomes[tileIndex];
        const center = child.userData.centerPoint;

        if (biomeData) {
            if (biomeData.nom === 'Océan') {
                child.visible = true;
                child.material.color = new THREE.Color(biomeData.couleur);
                child.position.y = 0;
                child.material.depthWrite = true;

                const existing = placedModels.get(tileIndex);
                if (existing) {
                    planet.remove(existing);
                    placedModels.delete(tileIndex);
                }
            } else if (biomeData.nom === 'Volcan') {
                child.visible = true;
                child.material.color.setHex(VOLCAN_TILE_COLOR);
                child.position.y = 0;
                child.material.depthWrite = true;
            } else if (biomeData.nom === 'Glacier') {
                child.visible = true;
                child.material.color = new THREE.Color(biomeData.couleur);
                child.position.y = 0;
                child.material.depthWrite = true;
            } else {
                child.visible = true;
                child.material.color = new THREE.Color(biomeData.couleur);
                child.position.y = 0;
                child.material.depthWrite = true;
            }

            if (biomeData.nom !== 'Océan') {
                const existing = placedModels.get(tileIndex);
                if (existing) {
                    planet.remove(existing);
                    placedModels.delete(tileIndex);
                }

                if (!placedModels.has(tileIndex)) {
                    const rawBoundary = child.userData.boundary;
                    const boundaryPoints = rawBoundary.map((p: { x: number; y: number; z: number }) => new THREE.Vector3(p.x, p.y, p.z));

                    const model = await getModelForBiome(biomeData.nom);

                    if (model) {
                        model.position.copy(center);
                        const normal = center.clone().normalize();
                        model.quaternion.setFromUnitVectors(
                            new THREE.Vector3(0, 1, 0),
                            normal
                        );

                        let totalEdgeLength = 0;
                        for (let i = 0; i < boundaryPoints.length; i++) {
                            const current = boundaryPoints[i];
                            const next = boundaryPoints[(i + 1) % boundaryPoints.length];
                            totalEdgeLength += current.distanceTo(next);
                        }
                        const avgEdgeLength = totalEdgeLength / boundaryPoints.length;

                        const scale = avgEdgeLength * 0.90;
                        model.scale.setScalar(scale);

                        planet.add(model);
                        placedModels.set(tileIndex, model);
                    }
                }
            }
        }
        else {
            child.visible = true;
            child.material.color.setHex(OCEAN_TILE_COLOR);
            child.position.y = 0;
            child.material.depthWrite = true;

            const existing = placedModels.get(tileIndex);
            if (existing) {
                planet.remove(existing);
                placedModels.delete(tileIndex);
            }
        }
    }
}



// Interface pour les zones de joueurs
interface PlayerZoneData {
  playerId: string;
  assignedTiles: number[];
  playerColor: string;
}

export function updatePlayerZoneBorders(
  planet: THREE.Group,
  playerZones: PlayerZoneData[]
): void {

  // Supprimer les anciennes lignes de contour
  playerZoneLines.forEach((line) => {
    planet.remove(line);
    line.geometry.dispose();
    if (line.material instanceof THREE.Material) {
      line.material.dispose();
    }
  });
  playerZoneLines.clear();

  // Si aucune zone, on ne fait rien
  if (!playerZones || playerZones.length === 0) {
    return;
  }

  playerZones.forEach((zone) => {
    const color = new THREE.Color(zone.playerColor);

    zone.assignedTiles.forEach((tileIndex) => {
      const tileMesh = planet.children.find(
        (child) => child instanceof THREE.Mesh && child.userData.tileIndex === tileIndex
      ) as THREE.Mesh | undefined;

      if (!tileMesh || !tileMesh.userData.boundary) {
        return;
      }

      const boundary = tileMesh.userData.boundary as Array<{ x: number; y: number; z: number }>;
      
      const points: number[] = [];
      for (const point of boundary) {
        points.push(point.x, point.y, point.z);
      }
      points.push(boundary[0].x, boundary[0].y, boundary[0].z);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

      const material = new THREE.LineBasicMaterial({
        color: color,
      });

      const line = new THREE.Line(geometry, material);

      planet.add(line);
      playerZoneLines.set(tileIndex, line);
    });
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

/**
 * Crée un hexagone 2D plat
 */
function createHexagonGeometry(radius: number = 0.5): THREE.BufferGeometry {
    const vertices: number[] = [];
    const indices: number[] = [];

    // Centre
    vertices.push(0, 0, 0);

    // Points du périmètre
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        vertices.push(x, 0, z);
    }

    // Créer les triangles
    for (let i = 0; i < 6; i++) {
        indices.push(0, i + 1, ((i + 1) % 6) + 1);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
}

export function createPlanetFlat(): THREE.Group {
    const group = new THREE.Group();
    const dimensions = calculerDimensionsGrilleFromHexasphere();


    const SQRT3 = Math.sqrt(3);
    const hexRadius = HEX_RADIUS;
    const hexWidth = hexRadius * SQRT3;
    const hexHeight = hexRadius * 2;
    const horizSpacing = hexWidth;
    const vertSpacing = hexHeight * 0.75;

    const gridWidth = dimensions.largeur * horizSpacing;
    const gridHeight = dimensions.hauteur * vertSpacing;
    const gridOffsetX = -gridWidth / 2;
    const gridOffsetZ = -gridHeight / 2;

    const material = new THREE.MeshBasicMaterial({
        color: DEFAULT_TILE_COLOR,
        side: THREE.DoubleSide,
        // wireframe: true,
    });

    const hexGeometry = createHexagonGeometry(hexRadius);

    for (let i = 0; i < DEFAULT_TILE_COUNT; i++) {
        const x = i % dimensions.largeur;
        const y = Math.floor(i / dimensions.largeur);

        const offsetX = y % 2 === 1 ? hexWidth / 2 : 0;
        const centerX = x * horizSpacing + hexWidth / 2 + offsetX + gridOffsetX;
        const centerZ = y * vertSpacing + hexRadius + gridOffsetZ;

        const mesh = new THREE.Mesh(hexGeometry.clone(), material.clone());
        mesh.position.set(centerX, 0, centerZ);
        mesh.userData.tileIndex = i;
        mesh.userData.centerPoint = new THREE.Vector3(centerX, 0, centerZ);
        mesh.userData.isFlat = true;


        const avgEdgeLength = hexRadius * 2;
        mesh.userData.avgEdgeLength = avgEdgeLength;

        group.add(mesh);
    }

    return group;
}

/**
 * Met à jour les biomes sur la grille plate
 */
export async function updatePlanetFlatBiomes(planet: THREE.Group, tileBiomes: Record<number, BiomeData>) {
    for (const child of planet.children) {
        if (!(child instanceof THREE.Mesh) || !child.userData.isFlat) continue;

        const tileIndex = child.userData.tileIndex;
        const biomeData = tileBiomes[tileIndex];
        const center = child.userData.centerPoint;

        if (biomeData) {
            if (biomeData.nom === 'Océan') {
                child.visible = true;
                child.material.color.setHex(OCEAN_TILE_COLOR);
                child.position.y = 0;
                child.material.depthWrite = true;

                const existing = placedModelsFlat.get(tileIndex);
                if (existing) {
                    planet.remove(existing);
                    placedModelsFlat.delete(tileIndex);
                }
            } else {
                child.visible = true;
                child.material.color = new THREE.Color(biomeData.couleur);
                child.position.y = 0;
                child.material.depthWrite = true;
            }

            if (biomeData.nom !== 'Océan' && !placedModelsFlat.has(tileIndex)) {
                const model = await getModelForBiome(biomeData.nom);

                if (model) {
                    model.position.copy(center);
                    model.quaternion.identity();

                    const hexRadius = HEX_RADIUS;
                    const modelRadiusInBlender = 0.5;
                    const scale = hexRadius / modelRadiusInBlender;
                    model.scale.setScalar(scale);

                    planet.add(model);
                    placedModelsFlat.set(tileIndex, model);
                }
            }
        } else {
            child.material.color.setHex(DEFAULT_TILE_COLOR);
            child.visible = true;
            child.position.y = 0;
            child.material.depthWrite = true; // Réinitialiser depthWrite

            const modelExistant = placedModelsFlat.get(tileIndex);
            if (modelExistant) {
                planet.remove(modelExistant);
                placedModelsFlat.delete(tileIndex);
            }
        }
    }
}
