import { useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from "react-native-reanimated";
import { Biome, allBiomes } from "../../models/Biome";

interface BiomeSelectorProps {
    selectedBiome?: Biome;
    onBiomeSelect?: (biome: Biome) => void;
    showDetails?: boolean;
    onCloseDetails?: () => void;
}

export default function BiomeSelector({ 
    selectedBiome, 
    onBiomeSelect,
    showDetails = false,
    onCloseDetails,
}: BiomeSelectorProps) {
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (showDetails && selectedBiome) {
            opacity.value = withTiming(1, { duration: 200 });
        } else {
            opacity.value = withTiming(0, { duration: 150 });
        }
    }, [showDetails, selectedBiome]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: opacity.value * 0.5,
    }));

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

            {/* Modal avec overlay pour fermer les détails */}
            <Modal
                visible={showDetails && !!selectedBiome}
                transparent
                animationType="none"
                onRequestClose={onCloseDetails}
            >
                <Pressable style={styles.modalOverlay} onPress={onCloseDetails}>
                    <Animated.View style={[styles.overlayBackground, overlayStyle]} />
                </Pressable>
                
                <View style={styles.modalContent}>
                    <Animated.View style={[styles.detailsContainer, animatedStyle]}>
                        <View style={[styles.detailsHeader, { backgroundColor: selectedBiome?.couleur }]}>
                            <Text style={styles.detailsTitle}>{selectedBiome?.nom}</Text>
                        </View>
                        <View style={styles.detailsBody}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Température:</Text>
                                <Text style={styles.detailValue}>{selectedBiome?.temperature}°C</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Humidité:</Text>
                                <Text style={styles.detailValue}>{selectedBiome?.humidite}%</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>CO₂:</Text>
                                <Text style={styles.detailValue}>{selectedBiome?.CO2} ppm</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Lumière:</Text>
                                <Text style={styles.detailValue}>{selectedBiome?.lumiere}%</Text>
                            </View>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
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
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    overlayBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#000",
    },
    modalContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "box-none",
    },
    detailsContainer: {
        width: "80%",
        maxWidth: 300,
        backgroundColor: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    detailsHeader: {
        padding: 20,
        alignItems: "center",
    },
    detailsTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#fff",
        textTransform: "capitalize",
        textShadowColor: "rgba(0,0,0,0.3)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    detailsBody: {
        padding: 20,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    detailLabel: {
        fontSize: 15,
        color: "#666",
        fontWeight: "500",
    },
    detailValue: {
        fontSize: 15,
        color: "#333",
        fontWeight: "700",
    },
});

