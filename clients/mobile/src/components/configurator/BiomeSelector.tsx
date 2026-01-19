import { Biome, allBiomes } from "@gaia/shared";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import { Defs, LinearGradient, Polygon, RadialGradient, Rect, Stop, Svg } from "react-native-svg";
import { biomeIcons } from "../../domain/biomeIcons";

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

interface BiomeSelectorProps {
    selectedBiome?: Biome;
    onBiomeSelect?: (biome: Biome) => void;
}

interface AnimatedHexagonProps {
    biome: Biome;
    isPressed: boolean;
    onPress: () => void;
    onPressIn: () => void;
    onPressOut: () => void;
    marginBottom: number;
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

const HEX_RADIUS = 32;
const HEX_SIZE = HEX_RADIUS * 2;

function AnimatedHexagon({
    biome,
    isPressed,
    onPress,
    onPressIn,
    onPressOut,
    marginBottom
}: AnimatedHexagonProps) {
    const strokeWidth = useSharedValue(2);

    useEffect(() => {
        strokeWidth.value = withTiming(isPressed ? 1 : 2, { duration: 150 });
    }, [isPressed]);

    const animatedProps = useAnimatedProps(() => {
        return {
            strokeWidth: strokeWidth.value,
        };
    });

    const centerX = HEX_RADIUS;
    const centerY = HEX_RADIUS;

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            activeOpacity={1}
            style={[styles.hexagonContainer, { marginBottom }]}
        >
            <Svg width={HEX_SIZE} height={HEX_SIZE} style={styles.hexagonSvg}>
                <Defs>
                    <RadialGradient id={`hexShadowGradient-${biome.nom}`} cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor="#000000" stopOpacity="0.15" />
                        <Stop offset="70%" stopColor="#000000" stopOpacity="0.08" />
                        <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
                    </RadialGradient>
                    <LinearGradient id={`hexGradient-${biome.nom}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor="#f5f5f5" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#e0e0e0" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                {/* Gradient radial en arrière-plan pour l'effet d'ombre */}
                <AnimatedPolygon
                    points={getHexagonPoints(centerX, centerY, HEX_RADIUS + 2)}
                    fill={`url(#hexShadowGradient-${biome.nom})`}
                />
                <AnimatedPolygon
                    points={getHexagonPoints(centerX, centerY, HEX_RADIUS)}
                    fill={`url(#hexGradient-${biome.nom})`}
                    stroke="#333"
                    animatedProps={animatedProps}
                />
            </Svg>
            {biomeIcons[biome.nom] && (
                <View style={styles.iconContainer}>
                    {(() => {
                        const IconComponent = biomeIcons[biome.nom];
                        if (typeof IconComponent === 'function') {
                            return <IconComponent width={24} height={24} />;
                        }
                        return null;
                    })()}
                </View>
            )}
        </TouchableOpacity>
    );
}

export default function BiomeSelector({
    selectedBiome,
    onBiomeSelect,
}: BiomeSelectorProps) {
    const [pressedBiome, setPressedBiome] = useState<Biome | null>(null);

    const handleBiomePress = (biome: Biome) => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {

        }
        onBiomeSelect?.(biome);
    };

    const handlePressIn = (biome: Biome) => {
        setPressedBiome(biome);
    };

    const handlePressOut = () => {
        setPressedBiome(null);
    };

    const VERTICAL_SPACING = 115;
    const HORIZONTAL_SPACING = 70;
    const VERTICAL_OFFSET = VERTICAL_SPACING * 0.375;

    const column0 = [allBiomes[0], allBiomes[3]];
    const column1 = [allBiomes[1], allBiomes[4], allBiomes[6]];
    const column2 = [allBiomes[2], allBiomes[5]];

    const renderHexagon = (biome: Biome, key: string, isLast: boolean = false) => {
        const marginBottom = isLast ? 0 : VERTICAL_SPACING * 0.75 - HEX_SIZE;
        const isPressed = pressedBiome?.nom === biome.nom;

        return (
            <AnimatedHexagon
                key={key}
                biome={biome}
                isPressed={isPressed}
                onPress={() => handleBiomePress(biome)}
                onPressIn={() => handlePressIn(biome)}
                onPressOut={handlePressOut}
                marginBottom={marginBottom}
            />
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.biomeGridWrapper}>
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
                        <View style={[styles.column, { marginTop: VERTICAL_OFFSET, marginRight: HORIZONTAL_SPACING - HEX_SIZE }]}>
                            {column0.map((biome, index) =>
                                renderHexagon(biome, `col0-${index}-${biome.nom}`, index === column0.length - 1)
                            )}
                        </View>


                        <View style={[styles.column, { marginRight: HORIZONTAL_SPACING - HEX_SIZE }]}>
                            {column1.map((biome, index) =>
                                renderHexagon(biome, `col1-${index}-${biome.nom}`, index === column1.length - 1)
                            )}
                        </View>


                        <View style={[styles.column, { marginTop: VERTICAL_OFFSET }]}>
                            {column2.map((biome, index) =>
                                renderHexagon(biome, `col2-${index}-${biome.nom}`, index === column2.length - 1)
                            )}
                        </View>
                    </View>
                </View>
            </View>
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
        shadowColor: "#000",
        shadowOffset: {
            width: 20,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 1,
        elevation: 8,
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
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 1,
        elevation: 5,
    },
    hexagonSvg: {
        // Assure que le SVG respecte les ombres du container
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
});

