import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React from 'react';
import * as THREE from 'three';
import createPlanet, { animatePlanet } from './ThePlanet/Planet';

export default function ThreeScene() {

    async function onContextCreate(gl) {
        const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

        const renderer = new Renderer({ gl });
        renderer.setSize(width, height);

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 1000);
        camera.position.z = 5;

        const planet = createPlanet();
        scene.add(planet);

        const loop = () => {
            requestAnimationFrame(loop);

            animatePlanet(planet);


            renderer.render(scene, camera);
            gl.endFrameEXP();
        };

        loop();
    }

    return <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />;
}
