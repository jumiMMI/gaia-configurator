import { StyleSheet, View } from "react-native";
import ThreeScene from "./threejs/ThreeScene";

export default function GameWeb() {
  return (
    <View style={styles.container}>
      <ThreeScene />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    alignSelf: "center",
    width: "100%",
  },
});


