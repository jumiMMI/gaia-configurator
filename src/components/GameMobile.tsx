import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGameTimer } from "../contexts/GameTimerContext";
import { Biome } from "../domain/Biome";
import { usePlanetSync } from "../party/client";
import { getDefaultHexasphereData } from "../utils/hexasphereUtils";
import BiomeSelector from "./configurator/BiomeSelector";
import HexGrid2D from "./configurator/HexGrid2D";
import Joystick from "./configurator/Joystick";

// Nombre total de tuiles sur la planète
const TOTAL_TILES = getDefaultHexasphereData().tileCount;

interface GameMobileProps {
  roomName: string;
}

export default function GameMobile({ roomName }: GameMobileProps) {
  const [selectedBiome, setSelectedBiome] = useState<Biome | undefined>(undefined);
  const [showDetails, setShowDetails] = useState(false);

  const { timeRemaining, isTimerActive, isGameFinished, startGame: startTimer, resetTimer, formatTime } = useGameTimer();

  const {
    tileBiomes,
    sendBiomeUpdate,
    resetPlanet,
    isConnected,
    startGame: startGameServer,
    assignedTiles,
    isHost,
    totalUsers,
  } = usePlanetSync({
    room: roomName,
    canSendUpdate: () => !isGameFinished,
    onPlacementError: (tileIndex, message) => {
      Alert.alert("Placement non autorisé", message);
    },
    onGameStart: () => {
      startTimer();
    },
  });



  const usedTilesCount = Object.keys(tileBiomes).length;
  const allTilesUsed = usedTilesCount >= TOTAL_TILES;

  const handleBiomeSelect = (biome: Biome) => {
    setSelectedBiome(biome);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
  };

  const handleCellPress = (x: number, y: number, tileIndex: number) => {
    console.log(`Cellule pressée: [${x}, ${y}], Tuile index: ${tileIndex}`);

    if (isGameFinished) {
      console.log("Le jeu est terminé, placement de biomes désactivé");
      return;
    }

    if (assignedTiles !== null && !assignedTiles.includes(tileIndex)) {
      Alert.alert("Tuile non assignée", "Cette tuile n'est pas dans votre zone assignée.");
      return;
    }

    if (selectedBiome) {
      sendBiomeUpdate(tileIndex, {
        nom: selectedBiome.nom,
        couleur: selectedBiome.couleur,
      });
    }
  };

  const handleStartGame = () => {
    if (isHost) {
      startGameServer();
    }
  };

  const handleReplay = () => {

    resetPlanet();

    resetTimer();
  };

  return (
    <View style={styles.container}>

      {isGameFinished && (
        <View style={styles.gameFinishedBanner}>
          <Text style={styles.gameFinishedText}>⏱️ Temps écoulé ! Placement de biomes désactivé</Text>
          <TouchableOpacity
            style={styles.replayButton}
            onPress={handleReplay}
          >
            <Text style={styles.replayButtonText}>🔄 Rejouer</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.gameZoneContainer}>
        <View style={styles.gameZone}>
        {/* Timer */}
        <View style={styles.timerContainer}>
          {!isTimerActive && !isGameFinished && (
            <Text style={styles.timerText}>En attente de démarrage...</Text>
          )}
          {isTimerActive && (
            <Text style={styles.timerText}>Temps restant: {formatTime(timeRemaining)}</Text>
          )}
          {isGameFinished && (
            <Text style={styles.timerFinishedText}>Temps écoulé !</Text>
          )}
        </View>

        {/* Zone assignée */}
        {assignedTiles !== null && (
          <View style={styles.assignmentBanner}>
            <Text style={styles.assignmentText}>
              🎯 Zone assignée: {assignedTiles.length} tuiles ({totalUsers} joueurs)
            </Text>
          </View>
        )}

        {/* Grille d'hexagones */}
        <HexGrid2D
          selectedBiome={selectedBiome}
          onCellPress={handleCellPress}
          cellSize={25}
          tileBiomes={tileBiomes}
          disabled={isGameFinished}
          assignedTiles={assignedTiles}
        />
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.bottomContainerInner}>
          <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#22c55e' : '#ef4444' }]} />
            <Text style={styles.statusText}>
              {isConnected ? 'Connecté au serveur' : 'Déconnecté'}
            </Text>
          </View>

          <View style={styles.controlsContainer}>
            <BiomeSelector
              selectedBiome={selectedBiome}
              onBiomeSelect={handleBiomeSelect}
              showDetails={showDetails}
              onCloseDetails={handleCloseDetails}
            />

            <View style={styles.actionRow}>
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.finishButton}>
                  {/* Bouton vide pour l'instant */}
                </TouchableOpacity>
                <Text style={styles.finishButtonText}>terminer</Text>
              </View>

              <Joystick />
            </View>
          </View>
        </View>
      </View>

      {allTilesUsed && (
        <TouchableOpacity onPress={resetPlanet}>
          <Text>🔄 Réinitialiser la planète</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D9D9D9",
    height: "100%",
  },
  gameZoneContainer: {
    backgroundColor: "#fff",
    marginBottom: 12,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    overflow: 'hidden',
    borderColor: "white",
    borderWidth: 2,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  content: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
    color: "#333",
  },
  gridTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
  },
  bottomContainer: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: "#DDDDDD",
    borderTopWidth: 1,
    borderTopColor: "#bcbcbc",
  },
  bottomContainerInner: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    paddingTop: 5,
  },
  controlsContainer: {
    width: "100%",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  buttonContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  finishButton: {
    width: 60,
    height: 25,
    borderRadius: 15,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  finishButtonText: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "600",
    color: "#333",
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    color: "#666",
  },
  gameFinishedBanner: {
    backgroundColor: "#fee2e2",
    borderColor: "#ef4444",
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    alignItems: "center",
  },
  gameFinishedText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ef4444",
  },
  assignmentBanner: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "#3b82f6",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    alignItems: "center",
    width: "90%",
  },
  assignmentText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fafafa",
  },
  replayButton: {
    marginTop: 10,
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  replayButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  gameZone: {
    backgroundColor: "#000",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,

    borderColor: "black",
    borderWidth: 2,
    paddingTop: 50,
    alignItems: "center",
    // Shadow pour iOS
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    // Shadow pour Android
    elevation: 8,
  },
  timerContainer: {
    padding: 12,
    marginBottom: 15,
    alignItems: "center",
    width: "90%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
  timerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fafafa",
  },
  timerFinishedText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff4444",
  },
});




