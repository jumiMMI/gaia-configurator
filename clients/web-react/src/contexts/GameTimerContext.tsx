import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface GameTimerContextType {
  timeRemaining: number;
  isTimerActive: boolean;
  isGameFinished: boolean;
  startGame: (startTimestamp?: number, gameDuration?: number) => void;
  resetTimer: () => void;
  finishGame: () => void;
  formatTime: (seconds: number) => string;
}

const GameTimerContext = createContext<GameTimerContextType | undefined>(undefined);

export function GameTimerProvider({ children }: { children: ReactNode }) {
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [gameStartTimestamp, setGameStartTimestamp] = useState<number | null>(null);
  const [gameDuration, setGameDuration] = useState(300);

  // Formatage du temps (MM:SS)
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculer le temps restant à partir du timestamp
  const calculateTimeRemaining = (startTs: number, duration: number): number => {
    const now = Date.now();
    const elapsed = Math.floor((now - startTs) / 1000); // Temps écoulé en secondes
    const remaining = duration - elapsed;
    return Math.max(0, remaining);
  };

  // Gérer le countdown du timer
  useEffect(() => {
    if (isTimerActive && gameStartTimestamp) {
      // Calculer le temps restant initial
      const initialRemaining = calculateTimeRemaining(gameStartTimestamp, gameDuration);
      setTimeRemaining(initialRemaining);

      const interval = setInterval(() => {
        const remaining = calculateTimeRemaining(gameStartTimestamp, gameDuration);
        if (remaining <= 0) {
          setIsTimerActive(false);
          setIsGameFinished(true);
          setTimeRemaining(0);
        } else {
          setTimeRemaining(remaining);
        }
      }, 100); // Vérifier toutes les 100ms pour plus de précision

      return () => clearInterval(interval);
    }
  }, [isTimerActive, gameStartTimestamp, gameDuration]);

  const startGame = (startTimestamp?: number, duration: number = 300) => {
    setIsGameFinished(false);
    setGameDuration(duration);

    if (startTimestamp) {
      // Utiliser le timestamp du serveur pour synchronisation
      setGameStartTimestamp(startTimestamp);
      const remaining = calculateTimeRemaining(startTimestamp, duration);
      setTimeRemaining(remaining);
      setIsTimerActive(true);
    } else {
      // Mode local (fallback)
      setGameStartTimestamp(Date.now());
      setTimeRemaining(duration);
      setIsTimerActive(true);
    }
  };

  const resetTimer = () => {
    setIsTimerActive(false);
    setIsGameFinished(false);
    setTimeRemaining(300);
    setGameStartTimestamp(null);
    setGameDuration(300);
  };

  const finishGame = () => {
    setIsTimerActive(false);
    setIsGameFinished(true);
    setTimeRemaining(0);
  };

  return (
    <GameTimerContext.Provider
      value={{
        timeRemaining,
        isTimerActive,
        isGameFinished,
        startGame,
        resetTimer,
        finishGame,
        formatTime,
      }}
    >
      {children}
    </GameTimerContext.Provider>
  );
}

export function useGameTimer() {
  const context = useContext(GameTimerContext);
  if (context === undefined) {
    throw new Error("useGameTimer doit être utilisé dans un GameTimerProvider");
  }
  return context;
}

