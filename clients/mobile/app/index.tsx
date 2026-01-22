import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import HomeScene3D from "../src/components/three/HomeScene3D";
import GradientButton from "../src/components/ui/GradientButton";
import { usePlanetSync } from "../src/party/client";

export default function Home() {
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);

  const { isConnected, totalUsers } = usePlanetSync({
    room: hasScanned ? roomName : "",
    canSendUpdate: () => false,
    onGameStart: (startTimestamp: number, gameDuration: number) => {
      // Naviguer vers la page de jeu quand le host démarre
      // Le timer sera démarré dans GameMobile avec le timestamp
      if (hasScanned && roomName) {
        router.replace({
          pathname: "/game",
          params: { roomName },
        } as any);
      }
    },
  });

  // Animations
  const titleTranslateY = useSharedValue(0);
  const scannerOpacity = useSharedValue(0);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const scannerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: scannerOpacity.value,
  }));

  useEffect(() => {
    if (hasScanned && isConnected) {
    }
  }, [hasScanned, isConnected]);

  useEffect(() => {
    if (showScanner) {
      titleTranslateY.value = withTiming(-190, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
      
      setTimeout(() => {
        scannerOpacity.value = withTiming(1, {
          duration: 400,
          easing: Easing.out(Easing.cubic),
        });
      }, 600);
    } else {
      scannerOpacity.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
      
      setTimeout(() => {
        titleTranslateY.value = withTiming(0, {
          duration: 600,
          easing: Easing.out(Easing.cubic),
        });
      }, 100);
    }
  }, [showScanner]);

  useEffect(() => {
    if (showScanner && permission && !permission.granted) {
      requestPermission();
    }
  }, [showScanner, permission]);

  const handleJoinGame = () => {
    setShowScanner(true);
  };

  const handleBack = () => {
    setShowScanner(false);
    setRoomName("");
    setHasScanned(false);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (hasScanned) return;

    const scannedRoomName = data.trim().toUpperCase();
    if (scannedRoomName) {
      setHasScanned(true);
      setRoomName(scannedRoomName);

    }
  };

  const handleSubmit = () => {
    if (hasScanned) return;

    const name = roomName.trim().toUpperCase();
    if (name) {
      setHasScanned(true);
      setRoomName(name);

    }
  };

  const handleReady = () => {
    if (hasScanned && isConnected) {
      router.replace({
        pathname: "/game",
        params: { roomName },
      } as any);
    }
  };

  // Écran du scanner QR
  if (showScanner) {
    if (!permission) {
      return <View style={styles.container}><HomeScene3D style={StyleSheet.absoluteFill} scannerMode={showScanner} /></View>;
    }

    if (!permission.granted) {
      return (
        <View style={styles.container}>
          <HomeScene3D style={StyleSheet.absoluteFill} scannerMode={showScanner} />
          <View style={styles.scannerContent}>
            <Text style={styles.permissionText}>Autorisation caméra requise</Text>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <HomeScene3D style={StyleSheet.absoluteFill} scannerMode={showScanner} />

        <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
          <Text style={styles.titleGaia}>GAIA</Text>
          <Text style={styles.titleProject}>PROJECT</Text>
        </Animated.View>

        <TouchableOpacity style={styles.backButtonAbsolute} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>

        <Animated.View style={[styles.scannerContent, scannerAnimatedStyle]}>

          <Text style={styles.instructionText}>
            Rendez-vous sur le site <Text style={styles.linkText}>gaiaproject.fr</Text> avec ton ordinateur, puis scanne le QR code de la partie.
            </Text>

          <LinearGradient
            colors={["#0A0B10", "#0B1428"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.cameraZone}
          >
            <LinearGradient
              colors={["rgba(155, 155, 255, 1)", "rgba(39, 39, 255, 0.3)"]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.cameraContainer}
            >
              <View style={styles.cameraInner}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  onBarcodeScanned={handleBarCodeScanned}
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                />
                {hasScanned && (
                  <View style={styles.checkmarkContainer}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </LinearGradient>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Ou entre le code manuellement</Text>
            <TextInput
              placeholder="Code (ex: A3B9K2)"
              value={roomName}
              onChangeText={(text) => setRoomName(text.toUpperCase())}
              onSubmitEditing={handleSubmit}
              style={styles.input}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="go"
              placeholderTextColor="#999"
              editable={!hasScanned}
            />
          </View>

          <View style={styles.readyButtonContainer}>
            <GradientButton
              text="Prêt"
              onPress={handleReady}
              textOpacity={isConnected ? 1 : 0.5}
            />
          </View>
        </Animated.View>
      </View>
    );
  }

  // Écran d'accueil
  return (
    <View style={styles.container}>
      <HomeScene3D style={StyleSheet.absoluteFill} scannerMode={showScanner} />

      <View style={styles.content}>
        <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
          <Text style={styles.titleGaia}>GAIA</Text>
          <Text style={styles.titleProject}>PROJECT</Text>
        </Animated.View>
        <View style={styles.joinButton}>
          <GradientButton text="Rejoindre une partie" onPress={handleJoinGame} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    position: "absolute",
    top: -100,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  titleGaia: {
    fontSize: 56,
    fontFamily: "Digital-Desolation",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  titleProject: {
    fontSize: 24,
    fontFamily: "Digital-Desolation",
    color: "#fff",
    letterSpacing: 10,
    marginTop: -5,
    paddingLeft: 10,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  joinButton: {
    marginTop: 110,
  },
  // Scanner styles
  scannerContent: {
    flex: 1,
    padding: 20,
    paddingTop: 20,
    marginTop: 240,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonAbsolute: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 20,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Omnium-Bold",
  },
  instructionText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Omnium-Bold",
  },
  permissionText: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    marginTop: 100,
    fontFamily: "Omnium-Bold",
  },
  cameraZone: {
    paddingHorizontal: 11,
    paddingVertical: 11,
    borderRadius: 12,
    marginBottom: 30,
    overflow: "hidden",
  },
  cameraContainer: {
    width: "100%",
    height: 280,
    borderRadius: 12,
    padding: 5,
    overflow: "hidden",
  },
  cameraInner: {
    flex: 1,
    borderRadius: 7,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
  },
  inputContainer: {
    width: "100%",
  },
  inputLabel: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 8,
    fontFamily: "Omnium-Bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    padding: 15,
    width: "100%",
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    fontSize: 16,
    color: "#fff",
    fontFamily: "Omnium-Bold",
  },
  checkmarkContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
  },
  checkmark: {
    fontSize: 80,
    color: "#4ade80",
    fontWeight: "bold",
  },
  readyButtonContainer: {
    width: "100%",
    marginTop: 30,
    alignItems: "center",
  },
  linkText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Omnium-Bold",
    textDecorationLine: "underline",
    lineHeight: 1000,
  },
});
