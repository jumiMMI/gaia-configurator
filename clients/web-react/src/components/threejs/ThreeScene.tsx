import { useEffect, useRef } from 'react';
// @ts-ignore
import { BiomeData } from '@gaia/shared';
import { AmbientLight, DirectionalLight, EquirectangularRefractionMapping, Group, LinearSRGBColorSpace, PerspectiveCamera, Scene, Texture, WebGLRenderer } from 'three';
import { OrbitControls, RGBELoader } from 'three/examples/jsm/Addons.js';
import { updateCameraPosition, useCameraControls } from './controls/CameraControls';
import { loadAllBiomeModels } from './ThePlanet/biomes/BiomeModels';
import { createPlanetFlat, updatePlanetFlatBiomes } from './ThePlanet/Planet';
import Sky from './ThePlanet/Sky';
import Stars from './ThePlanet/Stars';

interface ThreeSceneProps {
    tileBiomes?: Record<number, BiomeData>;
}

export default function ThreeScene({ tileBiomes = {} }: ThreeSceneProps) {
    const planetRef = useRef<Group | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cameraStateRef = useCameraControls(containerRef);
    const rendererRef = useRef<WebGLRenderer | null>(null);
    const sceneRef = useRef<Scene | null>(null);
    const cameraRef = useRef<PerspectiveCamera | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const rgbeLoader = new RGBELoader();

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

        const renderer = new WebGLRenderer({ canvas, antialias: true });
        renderer.setSize(width, height, false);
        rendererRef.current = renderer;

        const scene = new Scene();
        // scene.background = new Color(0x101A26);
        // scene.background = new Color(0xffffff);
        sceneRef.current = scene;
        const sky = new Sky();
        const stars = new Stars();
        scene.add(sky);
        scene.add(stars);

        const environmentMap = {
            intensity: 3,
            texture: null as Texture | null,
        }

        rgbeLoader.load('/hdrs/space.hdr', (dataTexture) => {
            dataTexture.mapping = EquirectangularRefractionMapping;
            dataTexture.colorSpace = LinearSRGBColorSpace;
            environmentMap.texture = dataTexture;
            environmentMap.texture!.needsUpdate = true;
            scene.environment = environmentMap.texture;
            scene.environmentIntensity = environmentMap.intensity!;
        });

        const camera = new PerspectiveCamera(60, width / height, 0.01, 1000);
        updateCameraPosition(camera, cameraStateRef.current);
        cameraRef.current = camera;

        // Grille hexagonale plate (2D)
        let planet: Group;
        try {
            planet = createPlanetFlat();
            planetRef.current = planet;
            scene.add(planet);
        } catch (error) {
            console.error('Erreur lors de la création de la planète:', error);
            return; // Arrêter l'initialisation si la création échoue
        }

        // Ajuster la caméra pour voir la grille plate de dessus
        camera.position.set(0, 3, 8);
        const controls = new OrbitControls(camera, containerRef.current!);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        camera.lookAt(0, 0, 0);

        // Fonction d'initialisation asynchrone
        const init = async () => {
            // Charger les modèles AVANT de mettre à jour les biomes
            await loadAllBiomeModels();

            // Maintenant mettre à jour les biomes après le chargement des modèles
            if (Object.keys(tileBiomes).length > 0) {
                await updatePlanetFlatBiomes(planet, tileBiomes);
            }

            const ambientLight = new AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);

            const directionalLight = new DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 10, 5);
            scene.add(directionalLight);

            let lastTime = performance.now();

            const loop = () => {
                if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
                const currentTime = performance.now();
                const dt = (currentTime - lastTime) / 1000;
                lastTime = currentTime;
                controls.update();

                rendererRef.current.render(sceneRef.current, cameraRef.current);
                animationFrameRef.current = requestAnimationFrame(loop);
                stars.update(dt);
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

