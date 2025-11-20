import { StyleSheet, Text, View } from "react-native";

export default function GameMobile() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gaia - Interface Mobile</Text>
      <Text style={styles.subtitle}>
        Interface optimisée pour mobile (tactile)
      </Text>
      <View style={styles.content}>
        <Text style={styles.text}>
          Ici vous pouvez ajouter votre interface de jeu pour mobile.
        </Text>
        <Text style={styles.text}>
          Cette interface peut utiliser des gestes tactiles, un layout compact,
          etc.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
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
});




