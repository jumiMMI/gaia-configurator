import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Biome } from "../models/Biome";
import { usePlanetSync } from "../party/client";
import { getDefaultHexasphereData } from "../utils/hexasphereUtils";
import BiomeSelector from "./configurator/BiomeSelector";
import HexGrid2D from "./configurator/HexGrid2D";

// Nombre total de tuiles sur la planète
const TOTAL_TILES = getDefaultHexasphereData().tileCount;

interface GameMobileProps {
  roomName: string;
}

export default function GameMobile({ roomName }: GameMobileProps) {
  const [selectedBiome, setSelectedBiome] = useState<Biome | undefined>(undefined);
  const [showDetails, setShowDetails] = useState(false);


  const { tileBiomes, sendBiomeUpdate, resetPlanet, isConnected } = usePlanetSync({
    room: roomName,
  });


  const usedTilesCount = Object.keys(tileBiomes).length;
  const allTilesUsed = usedTilesCount >= TOTAL_TILES;

  const handleBiomeSelect = (biome: Biome) => {
    setSelectedBiome(biome);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
  };

  const handleCellPress = (x: number, y: number, tileIndex: number) => {
    console.log(`Cellule pressée: [${x}, ${y}], Tuile index: ${tileIndex}`);
    

    if (selectedBiome) {
      sendBiomeUpdate(tileIndex, {
        nom: selectedBiome.nom,
        couleur: selectedBiome.couleur,
      });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Gaia - Interface Mobile</Text>
      <Text style={styles.subtitle}>Room: {roomName}</Text>
      
      <View style={styles.connectionStatus}>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? '#22c55e' : '#ef4444' }]} />
        <Text style={styles.statusText}>
          {isConnected ? 'Connecté au serveur' : 'Déconnecté'}
        </Text>
      </View>

      <HexGrid2D 
        selectedBiome={selectedBiome}
        onCellPress={handleCellPress}
        cellSize={26}
        tileBiomes={tileBiomes}
      />
      
      <BiomeSelector 
        selectedBiome={selectedBiome}
        onBiomeSelect={handleBiomeSelect}
        showDetails={showDetails}
        onCloseDetails={handleCloseDetails}
      />

      {/* Bouton de reset quand toutes les tuiles sont utilisées */}
      {allTilesUsed && (
        <TouchableOpacity style={styles.resetButton} onPress={resetPlanet}>
          <Text style={styles.resetButtonText}>🔄 Réinitialiser la planète</Text>
        </TouchableOpacity>
      )}
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
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: "#666",
  },
});




