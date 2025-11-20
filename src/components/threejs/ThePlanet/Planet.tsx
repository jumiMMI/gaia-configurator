import * as THREE from 'three';

export default function createPlanet() {
    const geometry = new THREE.IcosahedronGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    return new THREE.Mesh(geometry, material);
}

export function animatePlanet(planet: THREE.Mesh) {
    planet.rotation.y += 0.05;
}