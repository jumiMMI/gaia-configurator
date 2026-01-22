import { useEffect, useRef } from 'react';
// @ts-ignore
import { BiomeData } from '@gaia/shared';
import { AmbientLight, DirectionalLight, EquirectangularRefractionMapping, Group, LinearSRGBColorSpace, PerspectiveCamera, Scene, Texture, WebGLRenderer } from 'three';
import { OrbitControls, RGBELoader } from 'three/examples/jsm/Addons.js';
import { updateCameraPosition, useCameraControls } from './controls/CameraControls';
import { animateVolcanoEmissivity, animateWaterMaterials, applyEmissivityToGlacierMaterials, applyEmissivityToVolcanoMaterials, findVolcanoMaterialsInScene, findWaterMaterialsInScene, loadAllBiomeModels } from './ThePlanet/biomes/BiomeModels';
import createPlanet, { rotatePlanet, updatePlanetBiomes, updatePlayerZoneBorders } from './ThePlanet/Planet';
import Sky from './ThePlanet/Sky';
import Stars from './ThePlanet/Stars';

interface PlayerZoneData {
    playerId: string;
    assignedTiles: number[];
    playerColor: string;
}

interface ThreeSceneProps {
    tileBiomes?: Record<number, BiomeData>;
    playerZones?: PlayerZoneData[] | null;
    onPlanetRotationRef?: React.MutableRefObject<((velocityX: number, velocityY: number) => void) | null>;
}

export default function ThreeScene({ tileBiomes = {}, playerZones = null, onPlanetRotationRef }: ThreeSceneProps) {
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
            updatePlanetBiomes(planetRef.current, tileBiomes).catch(console.error);
        }
    }, [tileBiomes]);

    // Mettre à jour les contours des zones de tous les joueurs
    useEffect(() => {
        if (planetRef.current && playerZones && playerZones.length > 0) {
            updatePlayerZoneBorders(planetRef.current, playerZones);
        }
    }, [playerZones]);

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

        let planet: Group;
        try {
            planet = createPlanet();
            planetRef.current = planet;
            scene.add(planet);
        } catch (error) {
            console.error('Erreur lors de la création de la planète:', error);
            return;
        }

        camera.position.set(0, 0, 5);
        const controls = new OrbitControls(camera, containerRef.current!);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        camera.lookAt(0, 0, 0);

        const init = async () => {
            await loadAllBiomeModels();

            if (Object.keys(tileBiomes).length > 0) {
                await updatePlanetBiomes(planet, tileBiomes);
            }

            const ambientLight = new AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);

            const directionalLight = new DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 10, 5);
            scene.add(directionalLight);

            let lastTime = performance.now();

            if (onPlanetRotationRef) {
                const applyRotation = (velocityX: number, velocityY: number) => {
                    if (!planetRef.current) return;
                    rotatePlanet(planetRef.current, velocityX, velocityY);
                };

                onPlanetRotationRef.current = applyRotation;
            }

            const loop = () => {
                if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
                const currentTime = performance.now();
                const dt = (currentTime - lastTime) / 1000;
                lastTime = currentTime;
                controls.update();

                // Animer les matériaux d'eau du biome Glacier
                if (planetRef.current) {
                    applyEmissivityToGlacierMaterials(planetRef.current);
                    applyEmissivityToVolcanoMaterials(planetRef.current);
                    
                    const waterMaterials = findWaterMaterialsInScene(planetRef.current);
                    if (waterMaterials.length > 0) {
                        animateWaterMaterials(waterMaterials, dt);
                    }
                    
                    const volcanoMaterials = findVolcanoMaterialsInScene(planetRef.current);
                    if (volcanoMaterials.length > 0) {
                        animateVolcanoEmissivity(volcanoMaterials, dt);
                    }
                }

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
            
            if (onPlanetRotationRef) {
                onPlanetRotationRef.current = null;
            }
        };
    }, [onPlanetRotationRef]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block' }}
            />
        </div>
    );
}

