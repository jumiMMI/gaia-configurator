import { useEffect, useRef } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { BiomeData } from '@gaia/shared';
import { updateCameraPosition, useCameraControls } from './controls/CameraControls';
import { loadAllBiomeModels } from './ThePlanet/biomes/BiomeModels';
import { createPlanetFlat, updatePlanetFlatBiomes } from './ThePlanet/Planet';

interface ThreeSceneProps {
    tileBiomes?: Record<number, BiomeData>;
}

export default function ThreeScene({ tileBiomes = {} }: ThreeSceneProps) {
    const planetRef = useRef<THREE.Group | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cameraStateRef = useCameraControls(containerRef);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        if (planetRef.current) {
            updatePlanetFlatBiomes(planetRef.current, tileBiomes).catch(console.error);
        }
    }, [tileBiomes]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setSize(width, height, false);
        rendererRef.current = renderer;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x101A26);
        // scene.background = new THREE.Color(0xffffff);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000);
        updateCameraPosition(camera, cameraStateRef.current);
        cameraRef.current = camera;

        // Grille hexagonale plate (2D)
        let planet: THREE.Group;
        try {
            planet = createPlanetFlat();
            planetRef.current = planet;
            scene.add(planet);
        } catch (error) {
            console.error('Erreur lors de la création de la planète:', error);
            return; // Arrêter l'initialisation si la création échoue
        }
        
        // Ajuster la caméra pour voir la grille plate de dessus
        camera.position.set(0, 10, 0);
        camera.lookAt(0, 0, 0);

        // Fonction d'initialisation asynchrone
        const init = async () => {
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
                if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
                
                updateCameraPosition(cameraRef.current, cameraStateRef.current);
                // animatePlanet(planet);
                rendererRef.current.render(sceneRef.current, cameraRef.current);
                animationFrameRef.current = requestAnimationFrame(loop);
            };

            loop();
        };

        init();

        // Gérer le redimensionnement
        const handleResize = () => {
            if (!canvas || !cameraRef.current || !rendererRef.current) return;
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(width, height, false);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (rendererRef.current) {
                rendererRef.current.dispose();
            }
        };
    }, []);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
            <canvas 
                ref={canvasRef} 
                style={{ width: '100%', height: '100%', display: 'block' }} 
            />
        </div>
    );
}

