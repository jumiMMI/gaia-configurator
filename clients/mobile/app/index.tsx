import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Home() {
  const router = useRouter();

  const handleJoinGame = () => {
    router.push("/join");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GAIA</Text>
      <TouchableOpacity style={styles.button} onPress={handleJoinGame}>
        <Text style={styles.buttonText}>Rejoindre une partie</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#D9D9D9",
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 60,
  },
  button: {
    backgroundColor: "#333",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
