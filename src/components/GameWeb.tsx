import { StyleSheet, Text, View } from "react-native";
import ThreeScene from "./threejs/ThreeScene";

export default function GameWeb() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gaia - Interface Web</Text>
      <Text style={styles.subtitle}>
        Interface optimisée pour le web (desktop)
      </Text>
      <View style={styles.content}>
        <Text style={styles.text}>
          Ici vous pouvez ajouter votre interface de jeu pour le web.
        </Text>
        <Text style={styles.text}>
          Cette interface peut utiliser des contrôles clavier/souris, un layout
          plus large, etc.
        </Text>
      </View>
      <ThreeScene />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 40,
    backgroundColor: "#f0f0f0",
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 20,
    color: "#666",
    marginBottom: 40,
    textAlign: "center",
  },
  content: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
    color: "#333",
  },
});


