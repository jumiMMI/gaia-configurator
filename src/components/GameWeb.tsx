import { StyleSheet, Text, View } from "react-native";
import { usePlanetSync } from "../party/client";
import PlanetStats from "./PlanetStats";
import ThreeScene from "./threejs/ThreeScene";

interface GameWebProps {
  roomName: string;
}

export default function GameWeb({ roomName }: GameWebProps) {

  const { tileBiomes, isConnected, stats } = usePlanetSync({
    room: roomName,
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Room: {roomName}</Text>
        <View style={styles.connectionStatus}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#22c55e' : '#ef4444' }]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Connecté' : 'Déconnecté'}
          </Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <ThreeScene tileBiomes={tileBiomes} />
        <View style={styles.statsPanel}>
          <PlanetStats stats={stats} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
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
  content: {
    flex: 1,
    flexDirection: "row",
  },
  statsPanel: {
    position: "absolute",
    top: 10,
    right: 10,
  },
});
