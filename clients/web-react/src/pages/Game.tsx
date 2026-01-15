import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import GameWeb from "../components/GameWeb";
import { GameTimerProvider } from "../contexts/GameTimerContext";
import "../styles/Game.css";

export default function Game() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkCinematic = () => {
      try {
        const completed = localStorage.getItem("cinematicCompleted");
        if (completed !== "true") {
          navigate("/cinematic", { replace: true });
        } else {
          setIsAuthorized(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification:", error);
        navigate("/cinematic", { replace: true });
      }
    };

    checkCinematic();
  }, [navigate]);

  // loader
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p className="loading-text">Chargement...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }
  
  return (
    <GameTimerProvider>
      <GameWeb />
    </GameTimerProvider>
  );
}

