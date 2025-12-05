import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import * as THREE from 'three';
// @ts-ignore
import { BiomeData } from '../../party/messages';
import { updateCameraPosition, useCameraControls } from './controls/CameraControls';
import { loadAllBiomeModels } from './ThePlanet/BiomeModels';
import createPlanet, { animatePlanet, updatePlanetBiomes } from './ThePlanet/Planet';

interface ThreeSceneProps {
    tileBiomes?: Record<number, BiomeData>;
}

export default function ThreeScene({ tileBiomes = {} }: ThreeSceneProps) {
    const planetRef = useRef<THREE.Group | null>(null);
    const containerRef = useRef<View>(null);
    const cameraStateRef = useCameraControls(containerRef);

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
        // scene.background = new THREE.Color(0x101A26);
        scene.background = new THREE.Color(0xffffff);

        const camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 1000);
        updateCameraPosition(camera, cameraStateRef.current);

        const planet = createPlanet();
        planetRef.current = planet;
        scene.add(planet);

        if (Object.keys(tileBiomes).length > 0) {
            updatePlanetBiomes(planet, tileBiomes);
        }

        await loadAllBiomeModels();

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        scene.add(directionalLight);

        const loop = () => {
            requestAnimationFrame(loop);
            updateCameraPosition(camera, cameraStateRef.current);
            animatePlanet(planet);
            renderer.render(scene, camera);
            gl.endFrameEXP();
        };

        loop();
    }

    return (
        <View ref={containerRef} style={{ flex: 1 }}>
            <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />
        </View>
    );
}
