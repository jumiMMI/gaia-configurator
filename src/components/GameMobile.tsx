import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { Biome } from "../models/Biome";
import BiomeSelector from "./configurator/BiomeSelector";
import HexGrid2D from "./configurator/HexGrid2D";

export default function GameMobile() {
  const [selectedBiome, setSelectedBiome] = useState<Biome | undefined>(undefined);

  const handleCellPress = (x: number, y: number, tileIndex: number) => {
    console.log(`Cellule pressée: [${x}, ${y}], Tuile index: ${tileIndex}`);
    // Ici vous pourrez ajouter d'autres logiques (sauvegarder, synchroniser avec 3D, etc.)
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Gaia - Interface Mobile</Text>
      <Text style={styles.subtitle}>Configurez votre planète</Text>
      
      <BiomeSelector 
        selectedBiome={selectedBiome}
        onBiomeSelect={setSelectedBiome}
      />

      <Text style={styles.gridTitle}>Grille de la Planète</Text>
      <HexGrid2D 
        selectedBiome={selectedBiome}
        onCellPress={handleCellPress}
        cellSize={15}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
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
});




