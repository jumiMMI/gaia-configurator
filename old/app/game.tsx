import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import GameMobile from "../src/components/GameMobile";
import GameWeb from "../src/components/GameWeb";
import { GameTimerProvider } from "../src/contexts/GameTimerContext";

export default function Game() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkCinematic = async () => {
      try {
        const completed = await AsyncStorage.getItem("cinematicCompleted");
        if (completed !== "true") {
          router.replace("/cinematic");
        } else {
          setIsAuthorized(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification:", error);
        router.replace("/cinematic");
      }
    };

    checkCinematic();
  }, []);

  // loader
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  const isWeb = Platform.OS === "web";
  
  return (
    <GameTimerProvider>
      {isWeb ? <GameWeb /> : <GameMobile />}
    </GameTimerProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});

