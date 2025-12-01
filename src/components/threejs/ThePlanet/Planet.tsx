import * as THREE from 'three';
import { getDefaultHexasphereData } from '../../../utils/hexasphereUtils';


export default function createPlanet() {
    const hexasphereData = getDefaultHexasphereData();
    const geometry = hexasphereToThreeGeometry(hexasphereData.hexasphere);

    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00});
    return new THREE.Mesh(geometry, material);
}

export function animatePlanet(planet: THREE.Mesh) {
    planet.rotation.y += 0.005;
}

function hexasphereToThreeGeometry(hexasphere: any): THREE.BufferGeometry {
    const vertices: number[] = [];
    const indices: number[] = [];
    const vertexMap = new Map<string, number>();
    let vertexIndex = 0;
    
    // Parcourir toutes les tuiles
    for (let i = 0; i < hexasphere.tiles.length; i++) {
        const tile = hexasphere.tiles[i];
        

        const centerIdx = getOrCreateVertex(
            tile.centerPoint.x,
            tile.centerPoint.y,
            tile.centerPoint.z,
            vertices,
            vertexMap,
            vertexIndex
        );
        if (centerIdx === vertexIndex) vertexIndex++;
        
        // Créer les triangles (fan triangulation)
        const boundaryIndices: number[] = [];
        for (let j = 0; j < tile.boundary.length; j++) {
            const boundaryPoint = tile.boundary[j];
            const boundaryIdx = getOrCreateVertex(
                boundaryPoint.x,
                boundaryPoint.y,
                boundaryPoint.z,
                vertices,
                vertexMap,
                vertexIndex
            );
            if (boundaryIdx === vertexIndex) vertexIndex++;
            boundaryIndices.push(boundaryIdx);
        }
        
        // Créer les triangles
        for (let j = 0; j < boundaryIndices.length; j++) {
            indices.push(
                centerIdx,
                boundaryIndices[j],
                boundaryIndices[(j + 1) % boundaryIndices.length]
            );
        }
    }
    
    // Créer la géométrie Three.js
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
}

function getOrCreateVertex(
    x: number | string, 
    y: number | string, 
    z: number | string,
    vertices: number[],
    vertexMap: Map<string, number>,
    currentIndex: number
): number {

    const numX = Number(x);
    const numY = Number(y);
    const numZ = Number(z);
    
    const key = `${numX.toFixed(6)}_${numY.toFixed(6)}_${numZ.toFixed(6)}`;
    if (vertexMap.has(key)) {
        return vertexMap.get(key)!;
    }
    
    vertices.push(numX, numY, numZ);
    vertexMap.set(key, currentIndex);
    return currentIndex;
}