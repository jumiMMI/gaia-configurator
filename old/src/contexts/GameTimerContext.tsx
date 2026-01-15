import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface GameTimerContextType {
  timeRemaining: number;
  isTimerActive: boolean;
  isGameFinished: boolean;
  startGame: () => void;
  resetTimer: () => void;
  formatTime: (seconds: number) => string;
}

const GameTimerContext = createContext<GameTimerContextType | undefined>(undefined);

export function GameTimerProvider({ children }: { children: ReactNode }) {
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);

  // Formatage du temps (MM:SS)
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Gérer le countdown du timer
  useEffect(() => {
    if (isTimerActive && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerActive(false);
            setIsGameFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isTimerActive, timeRemaining]);

  const startGame = () => {
    setIsTimerActive(true);
    setIsGameFinished(false);
    setTimeRemaining(300);
  };

  const resetTimer = () => {
    setIsTimerActive(false);
    setIsGameFinished(false);
    setTimeRemaining(300);
  };

  return (
    <GameTimerContext.Provider
      value={{
        timeRemaining,
        isTimerActive,
        isGameFinished,
        startGame,
        resetTimer,
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

