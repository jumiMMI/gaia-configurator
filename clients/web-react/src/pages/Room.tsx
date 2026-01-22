import Space from "@/components/threejs/ThePlanet/Space";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import * as THREE from "three";
import GameWeb from "../components/GameWeb";
import { GameTimerProvider, useGameTimer } from "../contexts/GameTimerContext";
import { usePlanetSync } from "../party/client";
import "../styles/Room.css";

function RoomContent({ roomName, onGameStart }: { roomName: string; onGameStart: () => void }) {
    const { startGame: startTimer } = useGameTimer();
    const [teamName, setTeamName] = useState("");
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Configuration de la scène Three.js
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        camera.position.z = 5;

        // Créer des étoiles
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            sizeAttenuation: true,
        });

        const starsVertices = [];
        for (let i = 0; i < 2000; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            starsVertices.push(x, y, z);
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const space = new Space();
        scene.add(space);

        // Animation
        let currentTime = performance.now();
        let tick = 0;
        const animate = () => {
            tick = requestAnimationFrame(animate);
            const newTime = performance.now();
            const deltaTime = (newTime - currentTime) / 1000;
            currentTime = newTime;

            space.update(deltaTime);
            renderer.render(scene, camera);
        };
        animate();

        // Gestion du redimensionnement
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            starsGeometry.dispose();
            starsMaterial.dispose();
            cancelAnimationFrame(tick);
        };
    }, []);

    const { totalUsers, isConnected, users, isHost, startGame } = usePlanetSync({
        room: roomName,
        onGameStart: () => {
            // Démarrer le timer et afficher le jeu
            startTimer();
            onGameStart();
        },
    });

    const mobileParticipantsCount = users.filter(user => !user.isHost).length;
    const qrCodeValue = roomName;

    return (
        <div className="room-container">
            {/* Canvas Three.js en arrière-plan */}
            <canvas ref={canvasRef} className="room-canvas" />

            {/* Contenu principal */}
            <div className="room-content-wrapper">
                <div className="room-panel">
                    {/* Coins décoratifs */}
                    <div className="room-corner room-corner-top-left"></div>
                    <div className="room-corner room-corner-top-right"></div>
                    <div className="room-corner room-corner-bottom-left"></div>
                    <div className="room-corner room-corner-bottom-right"></div>

                    {/* Zone interne avec fond spatial */}
                    <div className="room-inner-panel">
                        <div className="room-content">
                            {/* QR Code à gauche */}
                            <div className="room-qr-section">
                                <div className="room-qr-wrapper">
                                    <QRCodeSVG
                                        value={qrCodeValue}
                                        size={200}
                                        bgColor="#ffffff"
                                        fgColor="#000000"
                                        level="H"
                                    />
                                </div>
                            </div>

                            {/* Informations à droite */}
                            <div className="room-info-section">
                                <div className="room-info-wrapper">
                                    <div className="room-team-input-container">
                                        <label className="room-team-label">NOM DE L'ÉQUIPE :</label>
                                        <input
                                            type="text"
                                            value={teamName}
                                            onChange={(e) => setTeamName(e.target.value)}
                                            className="room-team-input"
                                            placeholder="................................."
                                        />
                                    </div>
                                    <div className="room-participants-info">
                                        <span className="room-participants-icon">▼</span>
                                        <span className="room-participants-text">
                                            Nombre de participants — {isConnected ? mobileParticipantsCount : "..."}/4
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bouton Démarrer */}
                        {isHost && (
                            <button
                                className="room-start-button"
                                onClick={startGame}
                                disabled={!isConnected}
                            >
                                DÉMARRER
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RoomScreen() {
    const { roomName } = useParams<{ roomName: string }>();
    const [showGame, setShowGame] = useState(false);

    if (!roomName) {
        return <p>Room invalide</p>;
    }

    if (showGame) {
        return (
            <GameTimerProvider>
                <GameWeb roomName={roomName} />
            </GameTimerProvider>
        );
    } return (
        <GameTimerProvider>
            <RoomContent roomName={roomName} onGameStart={() => setShowGame(true)} />
        </GameTimerProvider>
    );
}