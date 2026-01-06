import { useEffect } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from "react-native-reanimated";
import { Defs, LinearGradient, Polygon, Rect, Stop, Svg } from "react-native-svg";
import { Biome, allBiomes } from "../../domain/Biome";

interface BiomeSelectorProps {
    selectedBiome?: Biome;
    onBiomeSelect?: (biome: Biome) => void;
    showDetails?: boolean;
    onCloseDetails?: () => void;
}

// Fonction pour générer les points d'un hexagone
function getHexagonPoints(cx: number, cy: number, radius: number): string {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const px = cx + radius * Math.cos(angle);
        const py = cy + radius * Math.sin(angle);
        points.push(`${px},${py}`);
    }
    return points.join(" ");
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

    const HEX_RADIUS = 32;
    const HEX_SIZE = HEX_RADIUS * 2;
    const VERTICAL_SPACING = 115;
    const HORIZONTAL_SPACING = 70;
    const VERTICAL_OFFSET = VERTICAL_SPACING * 0.375; 

    // Organiser les biomes par colonne
    const column0 = [allBiomes[0], allBiomes[3]];
    const column1 = [allBiomes[1], allBiomes[4], allBiomes[6]];
    const column2 = [allBiomes[2], allBiomes[5]]; 

    const renderHexagon = (biome: Biome, key: string, isLast: boolean = false) => {
        const centerX = HEX_RADIUS;
        const centerY = HEX_RADIUS;
        const marginBottom = isLast ? 0 : VERTICAL_SPACING * 0.75 - HEX_SIZE;

        return (
            <TouchableOpacity
                key={key}
                onPress={() => onBiomeSelect?.(biome)}
                style={[styles.hexagonContainer, { marginBottom }]}
            >
                <Svg width={HEX_SIZE} height={HEX_SIZE}>
                    <Defs>
                        <LinearGradient id="hexGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <Stop offset="0%" stopColor="#f5f5f5" stopOpacity="1" />
                            <Stop offset="100%" stopColor="#e0e0e0" stopOpacity="1" />
                        </LinearGradient>
                    </Defs>
                    <Polygon
                        points={getHexagonPoints(centerX, centerY, HEX_RADIUS)}
                        fill="url(#hexGradient)"
                        stroke="#333"
                        strokeWidth={2}
                    />
                </Svg>
                {biome.icon && (
                    <View style={styles.iconContainer}>
                        <Image
                            source={biome.icon}
                            style={styles.icon}
                            resizeMode="contain"
                        />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.biomeGridWrapper}>
                {/* Cercle d'ombre (derrière) */}
                <View style={styles.shadowCircle}>
                    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
                        <Defs>
                            <LinearGradient id="shadowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <Stop offset="0%" stopColor="#d0d0d0" stopOpacity="0.6" />
                                <Stop offset="100%" stopColor="#b0b0b0" stopOpacity="0.6" />
                            </LinearGradient>
                        </Defs>
                        <Rect width="100" height="100" fill="url(#shadowGradient)" />
                    </Svg>
                </View>
                {/* Cercle principal (devant) */}
                <View style={styles.biomeGridContainer}>
                    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
                        <Defs>
                            <LinearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <Stop offset="0%" stopColor="#efefef" stopOpacity="1" />
                                <Stop offset="100%" stopColor="#f3f3f3" stopOpacity="1" />
                        </LinearGradient>
                    </Defs>
                    <Rect width="100" height="100" fill="url(#bgGradient)" />
                </Svg>
                <View style={styles.biomeGrid}>
                {/* Colonne 0 (gauche) */}
                <View style={[styles.column, { marginTop: VERTICAL_OFFSET, marginRight: HORIZONTAL_SPACING - HEX_SIZE }]}>
                    {column0.map((biome, index) => 
                        renderHexagon(biome, `col0-${index}-${biome.nom}`, index === column0.length - 1)
                    )}
                </View>

                {/* Colonne 1 (milieu) */}
                <View style={[styles.column, { marginRight: HORIZONTAL_SPACING - HEX_SIZE }]}>
                    {column1.map((biome, index) => 
                        renderHexagon(biome, `col1-${index}-${biome.nom}`, index === column1.length - 1)
                    )}
                </View>

                {/* Colonne 2 (droite) */}
                <View style={[styles.column, { marginTop: VERTICAL_OFFSET }]}>
                    {column2.map((biome, index) => 
                        renderHexagon(biome, `col2-${index}-${biome.nom}`, index === column2.length - 1)
                    )}
                </View>
                </View>
            </View>
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
        marginTop: 10,
        marginLeft: 10,

        width: "100%",
    },
    biomeGridWrapper: {
        width: "73%",
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shadowCircle: {
        position: 'absolute',
        width: "112%",
        aspectRatio: 1,
        borderRadius: 200,
        overflow: 'hidden',
        zIndex: 0,
    },
    biomeGridContainer: {
        width: "100%",
        aspectRatio: 1,
        borderRadius: 200,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
    },
    biomeGrid: {
        position: 'relative',
        flexDirection: 'row',
        justifyContent: 'center',
        paddingBottom: 10,
        paddingTop: 10,
        paddingLeft: 0,
        paddingRight: 0,
    },
    column: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    hexagonContainer: {
        width: 65,
        height: 65,
        position: "relative",
    },
    iconContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
    },
    icon: {
        // Utiliser la taille native de l'icône, pas de redimensionnement
    },
    colorIndicator: {
        width: 40,
        height: 40,
        borderRadius: 25,
        marginBottom: 8,
        borderWidth: 2,
        borderColor: "#333",
        maxWidth: "100%",
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

