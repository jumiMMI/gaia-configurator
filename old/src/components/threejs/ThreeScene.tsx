import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import * as THREE from 'three';
// @ts-ignore
import { BiomeData } from '../../party/messages';
import { updateCameraPosition, useCameraControls } from './controls/CameraControls';
import { loadAllBiomeModels } from './ThePlanet/biomes/BiomeModels';
import { createPlanetFlat, updatePlanetFlatBiomes } from './ThePlanet/Planet';

interface ThreeSceneProps {
    tileBiomes?: Record<number, BiomeData>;
}

export default function ThreeScene({ tileBiomes = {} }: ThreeSceneProps) {
    const planetRef = useRef<THREE.Group | null>(null);
    const containerRef = useRef<View>(null);
    const cameraStateRef = useCameraControls(containerRef);

    useEffect(() => {
        if (planetRef.current) {
            updatePlanetFlatBiomes(planetRef.current, tileBiomes).catch(console.error);
        }
    }, [tileBiomes]);


    async function onContextCreate(gl: any) {
        const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

        const renderer = new Renderer({ gl });
        renderer.setSize(width, height);

        const scene = new THREE.Scene();
        // scene.background = new THREE.Color(0x101A26);
        scene.background = new THREE.Color(0xffffff);

        const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000);
        updateCameraPosition(camera, cameraStateRef.current);

        // Grille hexagonale plate (2D)
        const planet = createPlanetFlat();
        planetRef.current = planet;
        scene.add(planet);
        
        // Ajuster la caméra pour voir la grille plate de dessus
        camera.position.set(0, 10, 0);
        camera.lookAt(0, 0, 0);

        // Charger les modèles AVANT de mettre à jour les biomes
        await loadAllBiomeModels();

        // Maintenant mettre à jour les biomes après le chargement des modèles
        if (Object.keys(tileBiomes).length > 0) {
            await updatePlanetFlatBiomes(planet, tileBiomes);
        }

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        scene.add(directionalLight);

        const loop = () => {
            requestAnimationFrame(loop);
            updateCameraPosition(camera, cameraStateRef.current);
            // animatePlanet(planet);
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
