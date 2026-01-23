import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameTimer } from "../contexts/GameTimerContext";
import { usePlanetSync } from "../party/client";
import "../styles/GameWeb.css";
import ThreeScene from "./threejs/ThreeScene";

interface GameWebProps {
  roomName: string;
}

export default function GameWeb({ roomName }: GameWebProps) {
  const navigate = useNavigate();
  const [showEndPopup, setShowEndPopup] = useState(false);
  const { timeRemaining, isTimerActive, isGameFinished, startGame: startTimer, resetTimer, finishGame, formatTime } = useGameTimer();

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
    readyPlayers,
    allPlayersReady,
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
    finishGame();
    setShowEndPopup(true);
  };

  // Afficher la popup après 5 secondes quand le jeu est terminé
  useEffect(() => {
    if (isGameFinished) {
      const timer = setTimeout(() => {
        setShowEndPopup(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isGameFinished]);

  // Calculer le pourcentage de progression du timer
  const timerProgress = ((300 - timeRemaining) / 300) * 100;

  // Date futuriste
  const futureDate = "MER 15.03.3037";

  return (
    <div className="game-web-container">
      {/* Header centré */}
      <div className="game-web-header-center">
        <h1 className="game-web-main-title">GAIA PROJECT</h1>
        <p className="game-web-subtitle">
          {!isTimerActive && !isGameFinished && "En attente de démarrage..."}
          {isTimerActive && "Terraformation en cours..."}
          {isGameFinished && "Terraformation terminée"}
        </p>
      </div>

      {/* Date en haut à droite */}
      <div className="game-web-date">
        <span className="game-web-date-icon">▼</span>
        <span className="game-web-date-text">{futureDate}</span>
      </div>

      {/* Panneau Données Biométriques à gauche */}
      <div className="game-web-biometric-panel">
        <h2 className="game-web-panel-title">DONNÉES<br />BIOMÉTRIQUES</h2>
        <div className="game-web-biometric-stats">
          <div className="game-web-stat-row">
            <span className="game-web-stat-icon">💧</span>
            <div className="game-web-stat-bar">
              <div
                className="game-web-stat-fill"
                style={{ '--cursor-position': `${stats?.environment.humidite || 0}%` } as React.CSSProperties}
              />
            </div>
            <span className="game-web-stat-label">Hum</span>
          </div>

          <div className="game-web-stat-row">
            <span className="game-web-stat-icon">⚡</span>
            <div className="game-web-stat-bar">
              <div
                className="game-web-stat-fill"
                style={{ '--cursor-position': `${stats?.resourceScore.energie || 0}%` } as React.CSSProperties}
              />
            </div>
            <span className="game-web-stat-label">NRJ</span>
          </div>

          <div className="game-web-stat-row">
            <span className="game-web-stat-icon">☀️</span>
            <div className="game-web-stat-bar">
              <div
                className="game-web-stat-fill"
                style={{ '--cursor-position': `${(stats?.environment.lumiere || 0) / 10}%` } as React.CSSProperties}
              />
            </div>
            <span className="game-web-stat-label">Lum</span>
          </div>

          <div className="game-web-stat-row">
            <span className="game-web-stat-icon">O₂</span>
            <div className="game-web-stat-bar">
              <div
                className="game-web-stat-fill"
                style={{ '--cursor-position': `${stats?.resourceScore.oxygene || 0}%` } as React.CSSProperties}
              />
            </div>
            <span className="game-web-stat-label">O₂</span>
          </div>

          <div className="game-web-stat-row">
            <span className="game-web-stat-icon">☁️</span>
            <div className="game-web-stat-bar">
              <div
                className="game-web-stat-fill"
                style={{ '--cursor-position': `${Math.min((stats?.environment.CO2 || 0) / 10, 100)}%` } as React.CSSProperties}
              />
            </div>
            <span className="game-web-stat-label">CO₂</span>
          </div>

          <div className="game-web-stat-row">
            <span className="game-web-stat-icon">🌡️</span>
            <div className="game-web-stat-bar">
              <div
                className="game-web-stat-fill"
                style={{ '--cursor-position': `${Math.min(Math.max((stats?.environment.temperature || 0) + 50, 0), 100)}%` } as React.CSSProperties}
              />
            </div>
            <span className="game-web-stat-label">°C</span>
          </div>

          <div className="game-web-stat-row">
            <span className="game-web-stat-icon">🍎</span>
            <div className="game-web-stat-bar">
              <div
                className="game-web-stat-fill"
                style={{ '--cursor-position': `${stats?.resourceScore.nourriture || 0}%` } as React.CSSProperties}
              />
            </div>
            <span className="game-web-stat-label">Alim</span>
          </div>
        </div>
      </div>

      {/* Panneau Temps à droite */}
      <div className="game-web-time-panel">
        <h2 className="game-web-panel-title">TEMPS</h2>
        <div className="game-web-timer-large">{formatTime(timeRemaining)}</div>
        <div className="game-web-progress-bar">
          <div
            className="game-web-progress-fill"
            style={{ width: `${timerProgress}%` }}
          />
        </div>
      </div>

      {/* Bouton Terraformation terminée / Jouer */}
      <div className="game-web-action-button-container">
        {!isTimerActive && !isGameFinished && (
          <button
            className="game-web-action-button"
            onClick={handleStartGame}
            disabled={!roleReceived || !isConnected || !allPlayersReady}
          >
            {!roleReceived || !isConnected 
              ? "EN ATTENTE..." 
              : !allPlayersReady 
                ? `EN ATTENTE DE ${totalUsers - readyPlayers.length} JOUEUR(S)...`
                : "DÉMARRER LA TERRAFORMATION"}
          </button>
        )}
        {(isTimerActive || isGameFinished) && (
          <button
            className="game-web-action-button finished"
            onClick={handleReplay}
          >
            RETOUR AU MENU
          </button>
        )}
      </div>

      {/* Timeline en bas */}
      <div className="game-web-timeline">
        <div className="game-web-timeline-bar">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className={`game-web-timeline-tick ${i % 5 === 0 ? 'major' : ''} ${i < (60 - timeRemaining / 5) ? 'active' : ''}`}
            />
          ))}
          <div className="game-web-timeline-marker" style={{ left: `${timerProgress}%` }}>
            <div className="game-web-timeline-marker-triangle">▲</div>
          </div>
        </div>
      </div>

      {/* Scène 3D en arrière-plan */}
      <div className="game-web-content">
        <ThreeScene
          tileBiomes={tileBiomes}
          playerZones={playerZones}
          onPlanetRotationRef={planetRotationHandlerRef}
        />
      </div>

      {/* Popup de fin */}
      {showEndPopup && (
        <div className="game-web-end-overlay">
          <div className="game-web-end-popup">
            <h1 className="game-web-end-title">TERRAFORMATION RÉUSSIE</h1>
            <p className="game-web-end-score">Score : {stats?.environmentScore.global || 0}/100</p>

            <p className="game-web-end-description">
              Les biomes sont parfaitement répartis et interconnectés. La planète atteint un niveau de richesse écologique optimal : diversité élevée, ressources abondantes, climat régulier.
            </p>

            <div className="game-web-end-stats">
              <div className="game-web-end-stat">
                <span className="game-web-end-stat-icon">⚡</span>
                <span className="game-web-end-stat-text">NRJ : {stats?.resourceScore.energie || 0}/100</span>
              </div>
              <div className="game-web-end-stat">
                <span className="game-web-end-stat-icon">☁️</span>
                <span className="game-web-end-stat-text">CO₂ : {Math.min((stats?.environment.CO2 || 0) / 10, 100).toFixed(0)}/100</span>
              </div>
              <div className="game-web-end-stat">
                <span className="game-web-end-stat-icon">☀️</span>
                <span className="game-web-end-stat-text">Lum : {((stats?.environment.lumiere || 0) / 10).toFixed(0)}/100</span>
              </div>
              <div className="game-web-end-stat">
                <span className="game-web-end-stat-icon">O₂</span>
                <span className="game-web-end-stat-text">O₂ : {stats?.resourceScore.oxygene || 0}/100</span>
              </div>
              <div className="game-web-end-stat">
                <span className="game-web-end-stat-icon">💧</span>
                <span className="game-web-end-stat-text">Hum : {stats?.environment.humidite.toFixed(0) || 0}/100</span>
              </div>
              <div className="game-web-end-stat">
                <span className="game-web-end-stat-icon">🌡️</span>
                <span className="game-web-end-stat-text">T : {Math.min(Math.max((stats?.environment.temperature || 0) + 50, 0), 100).toFixed(0)}/100</span>
              </div>
              <div className="game-web-end-stat game-web-end-stat-full">
                <span className="game-web-end-stat-icon">🍎</span>
                <span className="game-web-end-stat-text">Bouffe : {stats?.resourceScore.nourriture || 0}/100</span>
              </div>
            </div>

            <button
              className="game-web-end-button"
              onClick={() => navigate('/leaderboard')}
            >
              VOIR LE LEADERBOARD
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

