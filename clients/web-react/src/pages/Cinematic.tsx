import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/Cinematic.css";

export default function Cinematic() {
  const navigate = useNavigate();
  const [currentScene, setCurrentScene] = useState(0);

  // test cinematique
  const scenes = [
    "Scène 1: L'histoire commence...",
    "Scène 2: Le héros découvre un nouveau monde...",
    "Scène 3: L'aventure peut commencer !",
  ];

  useEffect(() => {
    if (currentScene < scenes.length - 1) {
      const timer = setTimeout(() => {
        setCurrentScene(currentScene + 1);
      }, 3000); 

      return () => clearTimeout(timer);
    }
  }, [currentScene, scenes.length]);

  const startGame = () => {
    localStorage.setItem("cinematicCompleted", "true");
    navigate("/game");
  };

  const skipCinematic = () => {
    localStorage.setItem("cinematicCompleted", "true");
    navigate("/game");
  };

  return (
    <div className="cinematic-container">
      <div className="cinematic-content">
        <h1 className="scene-text">{scenes[currentScene]}</h1>
        <p className="placeholder-text">
          [Placeholder pour la cinématique]
        </p>
        <p className="progress-text">
          {currentScene + 1} / {scenes.length}
        </p>
      </div>

      <div className="cinematic-controls">
        {currentScene < scenes.length - 1 ? (
          <>
            <button
              onClick={() => setCurrentScene(currentScene + 1)}
              className="cinematic-button"
            >
              Suivant
            </button>
            <button 
              onClick={skipCinematic} 
              className="cinematic-button skip-button"
            >
              Passer la cinématique
            </button>
          </>
        ) : (
          <button onClick={startGame} className="cinematic-button start-button">
            Commencer le jeu
          </button>
        )}
      </div>
    </div>
  );
}

