import { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import * as THREE from 'three';

export interface CameraState {
    theta: number;
    phi: number;
    radius: number;      
    
    isDragging: boolean;
    lastMouseX: number;
    lastMouseY: number;
    
    sensitivity: number;

    velocityTheta: number;
    velocityPhi: number;
    friction: number;
}

function createCameraState(): CameraState {
    return {
        theta: 0,
        phi: Math.PI / 2,
        radius: 5,
        isDragging: false,
        lastMouseX: 0,
        lastMouseY: 0,
        sensitivity: 0.005,
        velocityTheta: 0,
        velocityPhi: 0,
        friction: 0.95,
    };
}

function handleMouseDown(state: CameraState, x: number, y: number): void {
    state.isDragging = true;
    state.lastMouseX = x;
    state.lastMouseY = y;
}

function handleMouseUp(state: CameraState): void {
    state.isDragging = false;
}

function handleMouseMove(state: CameraState, x: number, y: number): void {
    if (!state.isDragging) return;

    const deltaX = x - state.lastMouseX;
    const deltaY = y - state.lastMouseY;

    state.theta += deltaX * state.sensitivity;  
    state.phi -= deltaY * state.sensitivity; 

    state.phi = Math.max(0.1, Math.min(Math.PI - 0.1, state.phi));

    state.velocityTheta = deltaX * state.sensitivity;
    state.velocityPhi = deltaY * state.sensitivity;

    state.lastMouseX = x;
    state.lastMouseY = y;
}

export function updateCameraPosition(camera: THREE.Camera, state: CameraState): void {
    if (!state.isDragging) {
        // Continuer le mouvement avec la vélocité stockée
        state.theta += state.velocityTheta;
        state.phi += state.velocityPhi;
        
        // Limiter phi (ne pas dépasser les pôles)
        state.phi = Math.max(0.1, Math.min(Math.PI - 0.1, state.phi));
        

        state.velocityTheta *= state.friction;
        state.velocityPhi *= state.friction;
        
        // Si vélocité trop faible, arrêter complètement
        if (Math.abs(state.velocityTheta) < 0.0001) state.velocityTheta = 0;
        if (Math.abs(state.velocityPhi) < 0.0001) state.velocityPhi = 0;
    }
    
    camera.position.x = state.radius * Math.sin(state.phi) * Math.cos(state.theta);
    camera.position.y = state.radius * Math.cos(state.phi);
    camera.position.z = state.radius * Math.sin(state.phi) * Math.sin(state.theta);

    camera.lookAt(0, 0, 0);
}

/**
 * Hook qui gère les contrôles de caméra orbitale
 * 
 */
export function useCameraControls(containerRef: React.RefObject<View | null>) {
    const stateRef = useRef<CameraState>(createCameraState());

    useEffect(() => {
        if (Platform.OS !== 'web' || !containerRef.current) return;

        const container = containerRef.current as unknown as HTMLDivElement;
        const state = stateRef.current;

        const onMouseDown = (e: MouseEvent) => handleMouseDown(state, e.clientX, e.clientY);
        const onMouseMove = (e: MouseEvent) => handleMouseMove(state, e.clientX, e.clientY);
        const onMouseUp = () => handleMouseUp(state);

        container.addEventListener('mousedown', onMouseDown);
        container.addEventListener('mousemove', onMouseMove);
        container.addEventListener('mouseup', onMouseUp);
        container.addEventListener('mouseleave', onMouseUp);

        return () => {
            container.removeEventListener('mousedown', onMouseDown);
            container.removeEventListener('mousemove', onMouseMove);
            container.removeEventListener('mouseup', onMouseUp);
            container.removeEventListener('mouseleave', onMouseUp);
        };
    }, [containerRef]);

    return stateRef;
}
