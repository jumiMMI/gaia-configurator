import { Biome, getDefaultHexasphereData } from "@gaia/shared";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Image, ImageBackground, LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useGameTimer } from "../contexts/GameTimerContext";
import { usePlanetSync } from "../party/client";
import { getPlayerBorderImage, getPlayerColor, getPlayerEndgameImage } from "../utils/playerColors";
import BiomeSelector from "./configurator/BiomeSelector";
import HexGrid2D from "./configurator/HexGrid2D";
import Joystick from "./configurator/Joystick";
import SettingsPlanet from "./configurator/SettingsPlanet";
import GradientButton from "./ui/GradientButton";

// Nombre total de tuiles sur la planète
const TOTAL_TILES = getDefaultHexasphereData().tileCount;

interface GameMobileProps {
  roomName: string;
}

export default function GameMobile({ roomName }: GameMobileProps) {
  const router = useRouter();
  const [selectedBiome, setSelectedBiome] = useState<Biome | undefined>(undefined);
  const [gridMaxWidth, setGridMaxWidth] = useState<number | undefined>(undefined);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [settingsWidth, setSettingsWidth] = useState<number>(0);
  const [isFinishButtonPressed, setIsFinishButtonPressed] = useState(false);
  const [initialGameDuration, setInitialGameDuration] = useState<number>(300);

  const finishButtonTranslateY = useSharedValue(0);
  const gameFinishedBannerHeight = useSharedValue(0);
  const gameFinishedBannerWidth = useSharedValue(7);

  const { timeRemaining, isTimerActive, isGameFinished, startGame: startTimer, resetTimer, formatTime } = useGameTimer();

  const {
    tileBiomes,
    sendBiomeUpdate,
    sendPlanetRotation,
    resetPlanet,
    isConnected,
    startGame: startGameServer,
    assignedTiles,
    playerColor: playerColorFromServer,
    isHost,
    totalUsers,
    users,
    clientId,
  } = usePlanetSync({
    room: roomName,
    canSendUpdate: () => isTimerActive && !isGameFinished,
    onPlacementError: (tileIndex, message) => {
      Alert.alert("Placement non autorisé", message);
    },
    onGameStart: (startTimestamp: number, gameDuration: number) => {
      setInitialGameDuration(gameDuration);
      startTimer(startTimestamp, gameDuration);
    },
  });


  const currentUserIndex = useMemo(() => {
    if (!clientId) return 0;

    const players = users.filter(u => !u.isHost);


    const ourIndex = players.findIndex(u => u.id === clientId);

    return ourIndex >= 0 ? ourIndex : 0;
  }, [users, clientId]);

  const playerBorderImage = useMemo(() => {
    return getPlayerBorderImage(currentUserIndex);
  }, [currentUserIndex]);

  const playerEndgameImage = useMemo(() => {
    return getPlayerEndgameImage(currentUserIndex);
  }, [currentUserIndex]);


  const playerColor = useMemo(() => {
    if (playerColorFromServer) {
      return playerColorFromServer;
    }
    return getPlayerColor(currentUserIndex);
  }, [playerColorFromServer, currentUserIndex]);


  const usedTilesCount = Object.keys(tileBiomes).length;
  const allTilesUsed = usedTilesCount >= TOTAL_TILES;

  const handleBiomeSelect = (biome: Biome) => {
    setSelectedBiome(biome);
  };

  const handleCellPress = (x: number, y: number, tileIndex: number) => {
    if (isGameFinished) {
      return;
    }

    // Vérifier les tuiles assignées uniquement si le jeu est démarré
    if (isTimerActive && assignedTiles !== null && !assignedTiles.includes(tileIndex)) {
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
    setInitialGameDuration(300);
    router.replace("/");
  };

  const handleFinishButtonPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
    }
    setIsFinishButtonPressed(true);
  };

  const handleFinishButtonRelease = () => {
    setIsFinishButtonPressed(false);
  };

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const handleSettingsLayout = (event: LayoutChangeEvent) => {
    setSettingsWidth(event.nativeEvent.layout.width);
  };

  const handleJoystickMove = (angle: number, distance: number) => {
    const angleRad = angle * (Math.PI / 180);
    const velocityX = Math.sin(angleRad) * distance;
    const velocityY = Math.cos(angleRad) * distance;
    sendPlanetRotation(velocityX, velocityY);
  };

  // Calculer la largeur disponible pour la grille
  useEffect(() => {
    if (containerWidth > 0 && settingsWidth > 0) {
      const gap = 12;
      const paddingHorizontal = 15 * 2;
      const availableWidth = containerWidth - settingsWidth - gap - paddingHorizontal;
      setGridMaxWidth(Math.max(0, availableWidth));
    }
  }, [containerWidth, settingsWidth]);

  // Animation du bouton terminer (press)
  useEffect(() => {
    finishButtonTranslateY.value = withTiming(isFinishButtonPressed ? 2 : 0, { duration: 100 });
  }, [isFinishButtonPressed]);

  useEffect(() => {
    if (isGameFinished) {
      gameFinishedBannerHeight.value = withTiming(60, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      }, () => {
        gameFinishedBannerWidth.value = withTiming(240, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
      });
    } else {
      gameFinishedBannerHeight.value = 0;
      gameFinishedBannerWidth.value = 7;
    }
  }, [isGameFinished]);

  const finishButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: finishButtonTranslateY.value }],
  }));

  const gameFinishedBannerAnimatedStyle = useAnimatedStyle(() => ({
    height: gameFinishedBannerHeight.value,
    width: gameFinishedBannerWidth.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.gameZoneContainer}>
        <ImageBackground
          source={playerBorderImage}
          style={styles.gameZone}
          resizeMode="stretch"
        >
          {isGameFinished && (
            <Animated.View style={[styles.gameFinishedBanner, gameFinishedBannerAnimatedStyle]}>
              <Text style={styles.gameFinishedText}>Fin de la partie</Text>
            </Animated.View>
          )}
          {isGameFinished && (
            <Image
              source={playerEndgameImage}
              style={styles.endgameImage}
              resizeMode="contain"
            />
          )}
          {/* Timer */}
          <View style={[styles.timerContainer, { zIndex: 1, position: 'relative' }]}>
            {!isTimerActive && !isGameFinished && (
              <>
                <Text style={styles.timerText}>En attente de démarrage...</Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarFill, { width: '0%' }]} />
                </View>
              </>
            )}
            {isTimerActive && (
              <>
                <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                <View style={styles.progressBarContainer}>
                  <LinearGradient
                    colors={['#e74c3c', '#9b59b6', '#3498db']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${(timeRemaining / initialGameDuration) * 100}%` }]}
                  />
                </View>
              </>
            )}
            {isGameFinished && (
              <>
                <Text style={styles.timerText}>00:00</Text>
                <View style={styles.progressBarContainer}>
                  <LinearGradient
                    colors={['#e74c3c', '#9b59b6', '#3498db']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: '0%' }]}
                  />
                </View>
              </>
            )}
          </View>

          {/* Zone assignée - Afficher uniquement si le jeu est démarré */}
          {/* {assignedTiles !== null && isTimerActive && (
            <View style={styles.assignmentBanner}>
              <Text style={styles.assignmentText}>
                🎯 {assignedTiles.length} tuiles ({totalUsers} joueurs)
              </Text>
            </View>
          )} */}

          {/* Grille d'hexagones et paramètres du biome */}
          <View
            style={styles.gridAndSettingsContainer}
            onLayout={handleContainerLayout}
          >
            <View onLayout={handleSettingsLayout}>
              <SettingsPlanet biome={selectedBiome} />
            </View>
            <HexGrid2D
              selectedBiome={selectedBiome}
              onCellPress={handleCellPress}
              cellSize={26}
              maxVisibleWidth={gridMaxWidth}
              tileBiomes={tileBiomes}
              disabled={isGameFinished}
              assignedTiles={assignedTiles}
            />
          </View>
        </ImageBackground>
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.bottomContainerInner}>
          {/* <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#22c55e' : '#ef4444' }]} />
            <Text style={styles.statusText}>
              {isConnected ? 'Connecté au serveur' : 'Déconnecté'}
            </Text>
          </View> */}

          <View style={styles.dotsContainer}>
            <Image
              source={require("../../assets/2d-icons/dots-remote.png")}
              style={styles.dotImage}
              resizeMode="contain"
            />
            <Image
              source={require("../../assets/2d-icons/dots-remote.png")}
              style={[styles.dotImage, styles.dotImageFlipped]}
              resizeMode="contain"
            />
          </View>

          <View style={styles.controlsContainer}>
            {isGameFinished ? (
              <View style={styles.replayButtonContainer}>
                <GradientButton
                  text="Rejouer"
                  onPress={handleReplay}
                />
              </View>
            ) : (
              <>
                <BiomeSelector
                  selectedBiome={selectedBiome}
                  onBiomeSelect={handleBiomeSelect}
                />

                <View style={styles.actionRow}>
                  <View style={styles.buttonContainer}>
                    <View style={styles.finishButtonShadow} pointerEvents="none" />
                    <TouchableOpacity
                      style={styles.finishButton}
                      onPressIn={handleFinishButtonPress}
                      onPress={handleFinishButtonPress}
                      onPressOut={handleFinishButtonRelease}
                    >
                      <Animated.View style={[styles.finishButtonInner, finishButtonAnimatedStyle]}>
                        
                      </Animated.View>
                    </TouchableOpacity>
                    <Text style={styles.finishButtonText}>terminer</Text>
                  </View>

                  <Joystick onMove={handleJoystickMove} />
                </View>
              </>
            )}
          </View>
        </View>
      </View>
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
    position: "relative",
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
    marginTop: 30,
    position: "relative",
    overflow: "hidden",
    alignSelf: "center",
  },
  finishButtonShadow: {
    position: "absolute",
    width: 64,
    height: 29,
    borderRadius: 15,
    backgroundColor: "#000",
    top: 2,
    left: -2,
    zIndex: 0,
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
    position: "relative",
    zIndex: 1,
  },
  finishButtonInner: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
  },
  finishButtonText: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "600",
    color: "#333",
    position: "relative",
    zIndex: 1,
  },
  connectionStatus: {
    position: "absolute",
    top: 5,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  dotImage: {
    width: 20,
    height: 20,
  },
  dotImageFlipped: {
    transform: [{ scaleX: -1 }],
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
    position: "absolute",
    top: 200,
    left: "50%",
    transform: [{ translateX: "-50%" }],
    backgroundColor: "#5F80A8",
    borderColor: "#A7CCFF",
    borderWidth: 1,
    borderRadius: 7,
    paddingVertical: 19,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    overflow: "hidden",
  },
  gameFinishedText: {
    fontFamily: "Omnium-Bold",
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
  },
  endgameImage: {
    position: "absolute",
    top: 15,
    left: "50%",
    transform: [{ translateX: "-50%" }],
    width: "100%",
    height: "100%",
    zIndex: 5,
    overflow: "hidden",
  },
  assignmentBanner: {
    position: "absolute",
    top: 110,
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderColor: "#3b82f6",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
    width: 150,
  },
  assignmentText: {
    fontSize: 10,
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
    backgroundColor: "transparent",
    position: "relative",
    paddingTop: 20,
    alignItems: "center",
    overflow: "hidden",
  },
  timerContainer: {
    padding: 12,
    marginBottom: 15,
    alignItems: "center",
    width: "100%",
  },
  timerText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fafafa",
    marginBottom: 8,
  },
  timerFinishedText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ff4444",
    marginBottom: 8,
  },
  progressBarContainer: {
    width: "100%",
    height: 15,
    backgroundColor: "#0C0C0C",
    borderWidth: 1,
    borderColor: "#ffffff",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  gridAndSettingsContainer: {
    flexDirection: "row",
    alignItems: "center",
    // justifyContent: "center",
    paddingHorizontal: 15,
    gap: 12,
    width: "100%",
    paddingBottom: 10,
  },
  replayButtonContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
});




