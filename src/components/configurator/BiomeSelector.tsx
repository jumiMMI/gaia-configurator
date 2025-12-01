import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Biome, allBiomes } from "../../models/Biome";

interface BiomeSelectorProps {
    selectedBiome?: Biome;
    onBiomeSelect?: (biome: Biome) => void;
}

export default function BiomeSelector({ selectedBiome, onBiomeSelect }: BiomeSelectorProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sélectionner un Biome</Text>
            
            <View style={styles.biomeGrid}>
                {allBiomes.map((biome) => (
                    <TouchableOpacity
                        key={biome.nom}
                        style={[
                            styles.biomeCard,
                            selectedBiome?.nom === biome.nom && styles.biomeCardSelected
                        ]}
                        onPress={() => onBiomeSelect?.(biome)}
                    >
                        <View 
                            style={[
                                styles.colorIndicator,
                                { backgroundColor: biome.couleur }
                            ]}
                        />
                        <Text style={styles.biomeName}>{biome.nom}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {selectedBiome && (
                <View style={styles.detailsContainer}>
                    <Text style={styles.detailsTitle}>Détails du Biome</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Température:</Text>
                        <Text style={styles.detailValue}>{selectedBiome.temperature}°C</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Humidité:</Text>
                        <Text style={styles.detailValue}>{selectedBiome.humidite}%</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>CO₂:</Text>
                        <Text style={styles.detailValue}>{selectedBiome.CO2} ppm</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Lumière:</Text>
                        <Text style={styles.detailValue}>{selectedBiome.lumiere}%</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#fff",
        borderRadius: 10,
        margin: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
        color: "#333",
    },
    biomeGrid: {
        flexDirection: "row",
        // flexWrap: "wrap",
        gap: 10,
        justifyContent: "space-between",
        marginBottom: 20,
    },
    biomeCard: {
        width: "auto",
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "transparent",
    },
    biomeCardSelected: {
        borderColor: "#007AFF",
        backgroundColor: "#e3f2fd",
    },
    colorIndicator: {
        width: 40,
        height: 40,
        borderRadius: 25,
        marginBottom: 8,
        borderWidth: 2,
        borderColor: "#333",
    },
    biomeName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        textTransform: "capitalize",
    },
    detailsContainer: {
        position: "absolute",
        marginTop: 20,
        padding: 15,
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: "#007AFF",
    },
    detailsTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#333",
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: "#666",
        fontWeight: "500",
    },
    detailValue: {
        fontSize: 14,
        color: "#333",
        fontWeight: "600",
    },
});

