import { Button, StyleSheet, Text, View } from "react-native";
import { useGameTimer } from "../contexts/GameTimerContext";
import { usePlanetSync } from "../party/client";
import PlanetStats from "./threejs/ThePlanet/PlanetStats";
import ThreeScene from "./threejs/ThreeScene";

interface GameWebProps {
  roomName: string;
}

export default function GameWeb({ roomName }: GameWebProps) {
  const { timeRemaining, isTimerActive, isGameFinished, startGame: startTimer, resetTimer, formatTime } = useGameTimer();

  const { 
    tileBiomes, 
    isConnected, 
    stats,
    startGame: startGameServer,
    isHost,
    assignedTiles,
    totalUsers,
    resetPlanet,
  } = usePlanetSync({
    room: roomName,
    onGameStart: () => {
      // Déclencher le timer quand le message START_GAME est reçu du serveur
      startTimer();
    },
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Room: {roomName}</Text>
        <View style={styles.headerRight}>
          <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#22c55e' : '#ef4444' }]} />
            <Text style={styles.statusText}>
              {isConnected ? 'Connecté' : 'Déconnecté'}
            </Text>
          </View>
          
          {/* Timer et bouton Jouer */}
          <View style={styles.timerContainer}>
            {!isTimerActive && !isGameFinished && (
              <Button title="Jouer à Gaia" onPress={handleStartGame} />
            )}
            {isTimerActive && (
              <View style={styles.timerDisplay}>
                <Text style={styles.timerText}>Temps restant: {formatTime(timeRemaining)}</Text>
              </View>
            )}
            {isGameFinished && (
              <View style={styles.gameFinished}>
                <Text style={styles.finishedText}>Temps écoulé !</Text>
                <Button title="Rejouer" onPress={handleReplay} />
              </View>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.content}>
        <ThreeScene tileBiomes={tileBiomes} />
        <View style={styles.statsPanel}>
          <PlanetStats stats={stats} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  timerContainer: {
    marginLeft: 20,
  },
  timerDisplay: {
    padding: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
  },
  timerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  gameFinished: {
    alignItems: "center",
    gap: 10,
  },
  finishedText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ef4444",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: "#666",
  },
  content: {
    flex: 1,
    flexDirection: "row",
  },
  statsPanel: {
    position: "absolute",
    top: 10,
    right: 10,
  },
});
