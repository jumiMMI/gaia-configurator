import { useCallback, useRef } from "react";
import { useGameTimer } from "../contexts/GameTimerContext";
import { usePlanetSync } from "../party/client";
import "../styles/GameWeb.css";
import PlanetStats from "./threejs/ThePlanet/PlanetStats";
import ThreeScene from "./threejs/ThreeScene";

interface GameWebProps {
  roomName: string;
}

export default function GameWeb({ roomName }: GameWebProps) {
  const { timeRemaining, isTimerActive, isGameFinished, startGame: startTimer, resetTimer, formatTime } = useGameTimer();

  // Ref pour stocker le handler de rotation de ThreeScene
  const planetRotationHandlerRef = useRef<((velocityX: number, velocityY: number) => void) | null>(null);

  const handlePlanetRotation = useCallback((velocityX: number, velocityY: number) => {
    if (planetRotationHandlerRef.current) {
      planetRotationHandlerRef.current(velocityX, velocityY);
    }
  }, []);

  const { 
    tileBiomes, 
    isConnected, 
    stats,
    sendBiomeUpdate,
    startGame: startGameServer,
    isHost,
    roleReceived,
    playerZones,
    totalUsers,
    resetPlanet,
  } = usePlanetSync({
    room: roomName,
    canSendUpdate: () => isTimerActive && !isGameFinished,
    onGameStart: (startTimestamp: number, gameDuration: number) => {
      // Déclencher le timer quand le message START_GAME est reçu du serveur
      startTimer(startTimestamp, gameDuration);
    },
    onPlanetRotation: handlePlanetRotation,
  });

  const handleStartGame = () => {
    if (isHost) {
      startGameServer();
      // Le timer sera déclenché via le callback onGameStart quand le serveur diffusera START_GAME
    }
  };

  const handleReplay = () => {
    resetPlanet();
    resetTimer();
  };


  return (
    <div className="game-web-container">
      <div className="game-web-header">
        <h1 className="game-web-title">Room: {roomName}</h1>
        <div className="game-web-header-right">
          <div className="game-web-connection-status">
            <div 
              className={`game-web-status-dot ${isConnected ? 'connected' : 'disconnected'}`}
            />
            <span className="game-web-status-text">
              {isConnected ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>
          
          {/* Timer et bouton Jouer */}
          <div className="game-web-timer-container">
            {!isTimerActive && !isGameFinished && (
              <button 
                className="game-web-button"
                onClick={handleStartGame}
                disabled={!roleReceived || !isConnected}
              >
                {roleReceived ? "Jouer à Gaia" : "En attente du rôle..."}
              </button>
            )}
            {isTimerActive && (
              <div className="game-web-timer-display">
                <span className="game-web-timer-text">Temps restant: {formatTime(timeRemaining)}</span>
              </div>
            )}
            {isGameFinished && (
              <div className="game-web-finished">
                <span className="game-web-finished-text">Temps écoulé !</span>
                <button className="game-web-button" onClick={handleReplay}>Rejouer</button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="game-web-content">
        <ThreeScene 
          tileBiomes={tileBiomes} 
          playerZones={playerZones}
          onPlanetRotationRef={planetRotationHandlerRef} 
        />
        <div className="game-web-stats-panel">
          <PlanetStats stats={stats} />
        </div>
      </div>
    </div>
  );
}

