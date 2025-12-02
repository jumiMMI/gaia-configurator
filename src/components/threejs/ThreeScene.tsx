import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { BiomeData } from '../../party/messages';
import createPlanet, { animatePlanet, updatePlanetBiomes } from './ThePlanet/Planet';

interface ThreeSceneProps {
    tileBiomes?: Record<number, BiomeData>;
}

export default function ThreeScene({ tileBiomes = {} }: ThreeSceneProps) {
    const planetRef = useRef<THREE.Group | null>(null);


    useEffect(() => {
        if (planetRef.current) {
            updatePlanetBiomes(planetRef.current, tileBiomes);
        }
    }, [tileBiomes]);

    async function onContextCreate(gl: any) {
        const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

        const renderer = new Renderer({ gl });
        renderer.setSize(width, height);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050E3C);

        const camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 1000);
        camera.position.z = 5;

        const planet = createPlanet();
        planetRef.current = planet;
        scene.add(planet);

        // Appliquer les biomes initiaux si présents
        if (Object.keys(tileBiomes).length > 0) {
            updatePlanetBiomes(planet, tileBiomes);
        }

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
