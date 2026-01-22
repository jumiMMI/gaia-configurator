import { GLView } from "expo-gl";
import { Renderer } from "expo-three";
import React, { useCallback, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import {
    ACESFilmicToneMapping,
    AmbientLight,
    DirectionalLight,
    Scene,
    Vector2,
} from "three";
import { EffectComposer, RenderPass, UnrealBloomPass } from "three-stdlib";
import Sky from "./ciel/Sky";
import Stars from "./ciel/Stars";
import Camera from "./controls/Camera";
import HexGrid from "./HexGrid";

interface HomeScene3DProps {
    style?: object;
    scannerMode?: boolean;
}

export default function HomeScene3D({ style, scannerMode = false }: HomeScene3DProps) {
    const cameraRef = useRef<Camera | null>(null);

    useEffect(() => {
        if (cameraRef.current) {
            cameraRef.current.setMode(scannerMode ? "scanner" : "home");
        }
    }, [scannerMode]);

    const onContextCreate = useCallback(async (gl: any) => {
        const renderer = new Renderer({ gl });
        renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
        renderer.setClearColor(0x000000, 1);
        renderer.toneMapping = ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;

        const scene = new Scene();

        const camera = new Camera(gl.drawingBufferWidth / gl.drawingBufferHeight);
        cameraRef.current = camera;

        const sky = new Sky();
        scene.add(sky);

        const stars = new Stars();
        scene.add(stars);

        const hexGrid = new HexGrid();
        scene.add(hexGrid);

        const ambientLight = new AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        scene.add(directionalLight);

        const composer = new EffectComposer(renderer);

        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        const bloomPass = new UnrealBloomPass(
            new Vector2(gl.drawingBufferWidth, gl.drawingBufferHeight), 0.3, 0.5, 0);
        composer.addPass(bloomPass);

        const animate = () => {
            requestAnimationFrame(animate);

            camera.update();
            hexGrid.update(0.002);

            composer.render();
            gl.endFrameEXP();
        };

        animate();
    }, []);

    return (
        <GLView
            style={[styles.container, style]}
            onContextCreate={onContextCreate}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
