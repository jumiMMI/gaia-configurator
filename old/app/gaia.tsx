import { useRouter } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

export default function GaiaGame() {
  const router = useRouter();

  const startGame = () => {
    // Commencer par la cinématique
    router.push("/cinematic");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gaia</Text>
      <Text style={styles.subtitle}>Bienvenue dans votre aventure !</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Commencer le jeu" onPress={startGame} />
      </View>
      
      {/* Le contenu du jeu réel sera ajouté ici plus tard */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 40,
  },
  buttonContainer: {
    marginTop: 20,
    width: "100%",
    maxWidth: 300,
  },
});

