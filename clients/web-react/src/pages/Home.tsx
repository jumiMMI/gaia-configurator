import Space from "@/components/threejs/ThePlanet/Space";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import "../styles/Home.css";
import { generateRoomCode } from "../utils/roomCode";

export default function Home() {
  const navigate = useNavigate();
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
      console.log("rendering")
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

  const handleLaunchGame = () => {
    const roomName = generateRoomCode();
    navigate(`/room/${roomName}`);
  };

  const handleViewLeaderboard = () => {
    navigate('/leaderboard');
  };

  return (
    <div className="home-container">
      {/* Scène Three.js en arrière-plan */}
      <canvas ref={canvasRef} className="home-canvas" />

      {/* Contenu principal */}
      <div className="home-content">
        <div className="home-panel">
          {/* Coins décoratifs */}
          <div className="home-corner home-corner-top-left"></div>
          <div className="home-corner home-corner-top-right"></div>
          <div className="home-corner home-corner-bottom-left"></div>
          <div className="home-corner home-corner-bottom-right"></div>

          <h1 className="home-title">GAIA PROJECT</h1>

          <div className="home-buttons">
            <button onClick={handleLaunchGame} className="home-button">
              LANCER UNE PARTIE
            </button>
            <button onClick={handleViewLeaderboard} className="home-button">
              VOIR LE LEADERBOARD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

