import * as THREE from 'three';
import { BiomeData } from '../../../party/messages';
import { getDefaultHexasphereData } from '../../../utils/hexasphereUtils';


const DEFAULT_TILE_COLOR = 0xffffff;

export default function createPlanet(): THREE.Group {
    const hexasphereData = getDefaultHexasphereData();
    const group = new THREE.Group();
    
    // Créer un mesh par tuile pour pouvoir les colorer individuellement
    for (let i = 0; i < hexasphereData.hexasphere.tiles.length; i++) {
        const tile = hexasphereData.hexasphere.tiles[i];
        const geometry = createTileGeometry(tile);
        const material = new THREE.MeshBasicMaterial({ 
            color: DEFAULT_TILE_COLOR,
            side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.tileIndex = i;
        group.add(mesh);
    }
    
    return group;
}

export function animatePlanet(planet: THREE.Group) {
    planet.rotation.y += 0.001;
}

// Met à jour les couleurs des tuiles selon les biomes
export function updatePlanetBiomes(planet: THREE.Group, tileBiomes: Record<number, BiomeData>) {
    planet.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
            const tileIndex = child.userData.tileIndex;
            const biome = tileBiomes[tileIndex];
            
            if (biome) {
                // Convertir la couleur hex string en nombre
                const color = new THREE.Color(biome.couleur);
                (child.material as THREE.MeshBasicMaterial).color = color;
            } else {
                // Remettre la couleur par défaut
                (child.material as THREE.MeshBasicMaterial).color.setHex(DEFAULT_TILE_COLOR);
            }
        }
    });
}

// Crée la géométrie d'une seule tuile
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
    
    // Créer les triangles (fan depuis le centre)
    for (let j = 0; j < tile.boundary.length; j++) {
        indices.push(
            0, // centre
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