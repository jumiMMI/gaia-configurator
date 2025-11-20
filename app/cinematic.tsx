import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";


export default function Cinematic() {
  const router = useRouter();
  const [currentScene, setCurrentScene] = useState(0);

  // Scènes de la cinématique (placeholder pour l'instant)
  const scenes = [
    "Scène 1: L'histoire commence...",
    "Scène 2: Le héros découvre un nouveau monde...",
    "Scène 3: L'aventure peut commencer !",
  ];

  useEffect(() => {
    // Auto-avancement des scènes (optionnel)
    // Vous pouvez retirer cela si vous voulez un contrôle manuel
    if (currentScene < scenes.length - 1) {
      const timer = setTimeout(() => {
        setCurrentScene(currentScene + 1);
      }, 3000); // Change de scène toutes les 3 secondes

      return () => clearTimeout(timer);
    }
  }, [currentScene]);

  const startGame = async () => {
    // Marquer que la cinématique est terminée
    await AsyncStorage.setItem("cinematicCompleted", "true");
    // Rediriger vers le jeu
    router.push("/game" as any);
  };

  const skipCinematic = async () => {
    // Même chose si on passe la cinématique
    await AsyncStorage.setItem("cinematicCompleted", "true");
    router.push("/game" as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.cinematicContainer}>
        <Text style={styles.sceneText}>{scenes[currentScene]}</Text>
        <Text style={styles.placeholderText}>
          [Placeholder pour la cinématique]
        </Text>
        <Text style={styles.progressText}>
          {currentScene + 1} / {scenes.length}
        </Text>
      </View>

      <View style={styles.controls}>
        {currentScene < scenes.length - 1 ? (
          <>
            <Button
              title="Suivant"
              onPress={() => setCurrentScene(currentScene + 1)}
            />
            <View style={{ marginTop: 10 }}>
              <Button title="Passer la cinématique" onPress={skipCinematic} />
            </View>
          </>
        ) : (
          <Button title="Commencer le jeu" onPress={startGame} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  cinematicContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  sceneText: {
    fontSize: 24,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    marginTop: 20,
  },
  controls: {
    padding: 20,
    width: "100%",
  },
});

