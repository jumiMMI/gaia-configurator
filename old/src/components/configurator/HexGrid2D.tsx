import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { clamp, useAnimatedStyle, useSharedValue, withDecay } from "react-native-reanimated";
import { Polygon, Svg } from "react-native-svg";
import { allBiomes, Biome } from "../../domain/Biome";
import { BiomeData } from "../../party/messages";
import {
    calculerDimensionsGrilleFromHexasphere,
    getDefaultHexasphereData,
    GridDimensions,
} from "../../utils/hexasphereUtils";


const SQRT3 = Math.sqrt(3);

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

interface HexGrid2DProps {
    selectedBiome?: Biome;
    onCellPress?: (x: number, y: number, tileIndex: number) => void;
    cellSize?: number;
    maxVisibleHeight?: number;
    tileBiomes?: Record<number, BiomeData>;
    disabled?: boolean;
    assignedTiles?: number[] | null;
}

export default function HexGrid2D({
    selectedBiome,
    onCellPress,
    cellSize = 18,
    maxVisibleHeight = 260,
    tileBiomes = {},
    disabled = false,
    assignedTiles = null,
}: HexGrid2DProps) {

    const [grille, setGrille] = useState<(Biome | null)[][]>([]);
    const [dimensions, setDimensions] = useState<GridDimensions | null>(null);
    const [tileMapping, setTileMapping] = useState<Map<number, { x: number; y: number }>>(
        new Map()
    );
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const PADDING_HORIZONTAL = 10;

    const handleLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setContainerSize({ width, height });
    };

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const offsetX = useSharedValue(0);
    const offsetY = useSharedValue(0);
    
    const minX = useSharedValue(0);
    const minY = useSharedValue(0);

    const panGesture = Gesture.Pan()
        .minDistance(10) 
        .onStart(() => {
            
            offsetX.value = translateX.value;
            offsetY.value = translateY.value;
        })
        .onUpdate((event) => {
            
            translateX.value = clamp(offsetX.value + event.translationX, minX.value, 0);
            translateY.value = clamp(offsetY.value + event.translationY, minY.value, 0);
        })
        .onEnd((event) => {
            
            translateX.value = withDecay({ 
                velocity: event.velocityX,
                clamp: [minX.value, 0]
            });
            translateY.value = withDecay({ 
                velocity: event.velocityY,
                clamp: [minY.value, 0]
            });
        });


    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
        ],
    }));

    useEffect(() => {

        const hexData = getDefaultHexasphereData();


        const dims = calculerDimensionsGrilleFromHexasphere();
        setDimensions(dims);


        const nouvelleGrille: (Biome | null)[][] = [];
        const mapping = new Map<number, { x: number; y: number }>();

        for (let y = 0; y < dims.hauteur; y++) {
            nouvelleGrille[y] = [];
            for (let x = 0; x < dims.largeur; x++) {
                nouvelleGrille[y][x] = null;
            }
        }

        // mapping tuile index → position grille [x, y]
        for (let i = 0; i < hexData.tileCount; i++) {
            const x = i % dims.largeur;
            const y = Math.floor(i / dims.largeur);
            mapping.set(i, { x, y });
        }

        setGrille(nouvelleGrille);
        setTileMapping(mapping);
    }, []);


    useEffect(() => {
        if (tileMapping.size === 0) return;

        // Si tileBiomes est vide, réinitialiser toute la grille
        if (Object.keys(tileBiomes).length === 0) {
            setGrille((prevGrille) => {
                return prevGrille.map((row) => row.map(() => null));
            });
            return;
        }

        setGrille((prevGrille) => {
            const newGrille = prevGrille.map((row) => [...row]);
            
            // Pour chaque biome reçu du serveur
            Object.entries(tileBiomes).forEach(([indexStr, biomeData]) => {
                const tileIndex = parseInt(indexStr, 10);
                const pos = tileMapping.get(tileIndex);
                
                if (pos) {
                    // Trouver le biome complet correspondant à la couleur
                    const biome = allBiomes.find(b => b.couleur === biomeData.couleur);
                    if (biome) {
                        newGrille[pos.y][pos.x] = biome;
                    }
                }
            });
            
            return newGrille;
        });
    }, [tileBiomes, tileMapping]);

    // Map inversée pour trouver rapidement tileIndex depuis (x, y)
    const positionToTileIndex = useMemo(() => {
        const map = new Map<string, number>();
        tileMapping.forEach((pos, index) => {
            map.set(`${pos.x},${pos.y}`, index);
        });
        return map;
    }, [tileMapping]);

    // Calculs de dimensions avec useMemo
    const hexDimensions = useMemo(() => {
        if (!dimensions) return null;

        const hexRadius = cellSize;
        const hexWidth = hexRadius * SQRT3;
        const hexHeight = hexRadius * 2;
        const horizSpacing = hexWidth;
        const vertSpacing = hexHeight * 0.75;
        const svgWidth = (dimensions.largeur) * horizSpacing + hexWidth / 2;
        const svgHeight = (dimensions.hauteur - 1) * vertSpacing + hexHeight;
        const visibleWidth = containerSize.width > 0 ? containerSize.width - (PADDING_HORIZONTAL * 2) : svgWidth;
        const visibleHeight = containerSize.height > 0 ? containerSize.height : maxVisibleHeight;
        const scrollableX = Math.max(0, svgWidth - visibleWidth);
        const scrollableY = Math.max(0, svgHeight - visibleHeight);

        return {
            hexRadius,
            hexWidth,
            hexHeight,
            horizSpacing,
            vertSpacing,
            svgWidth,
            svgHeight,
            visibleWidth,
            visibleHeight,
            scrollableX,
            scrollableY,
        };
    }, [dimensions, containerSize.width, containerSize.height, cellSize, maxVisibleHeight]);

    useEffect(() => {
        if (!hexDimensions) return;
        
        minX.value = -hexDimensions.scrollableX;
        minY.value = -hexDimensions.scrollableY;
    }, [hexDimensions]);

    const handleCellPress = useCallback((x: number, y: number) => {
        if (disabled) {
            return;
        }

        const tileIndex = positionToTileIndex.get(`${x},${y}`) ?? -1;

        if (assignedTiles !== null && tileIndex >= 0 && !assignedTiles.includes(tileIndex)) {
            return;
        }
        
        if (tileIndex >= 0 && selectedBiome) {
            const newGrille = grille.map((row) => [...row]);
            newGrille[y][x] = selectedBiome;
            setGrille(newGrille);
            onCellPress?.(x, y, tileIndex);
        }
    }, [disabled, positionToTileIndex, assignedTiles, selectedBiome, grille, onCellPress]);

    if (!dimensions || grille.length === 0 || !hexDimensions) {
        return null;
    }

    const { hexRadius, hexWidth, horizSpacing, vertSpacing, svgWidth, svgHeight } = hexDimensions;

    const emptyGesture = Gesture.Pan().enabled(false);
    
    return (
        <View style={styles.container}>
            <GestureDetector gesture={disabled ? emptyGesture : panGesture}>
                <View 
                    style={[
                        styles.gridContainer, 
                        { maxHeight: maxVisibleHeight, overflow: 'hidden' }
                    ]}
                    onLayout={handleLayout}
                >
                    <Animated.View style={animatedStyle}>
                        <Svg
                            width={svgWidth}
                            height={svgHeight}
                        >
                    
                    {grille.map((row, y) =>
                        row.map((biome, x) => {
                            const offsetX = y % 2 === 1 ? hexWidth / 2 : 0;
                            const centerX = x * horizSpacing + hexWidth / 2 + offsetX;
                            const centerY = y * vertSpacing + hexRadius;

                            const tileIndex = positionToTileIndex.get(`${x},${y}`) ?? -1;
                            const isTile = tileIndex >= 0;
                            const isAssigned = assignedTiles === null || (tileIndex >= 0 && assignedTiles.includes(tileIndex));
                            const isAvailable = isTile && isAssigned;

                            let fillColor = "#1a1a1a";
                            if (biome) {
                                fillColor = biome.couleur;
                            } else if (isTile) {
                                fillColor = isAssigned ? "#2a2a2a" : "#1a1a1a";
                            }

                            return (
                                <Polygon
                                    key={`${x}-${y}`}
                                    points={getHexagonPoints(centerX, centerY, hexRadius)}
                                    fill={fillColor}
                                    stroke="#fafafa"
                                    strokeWidth={1}
                                    opacity={isAvailable ? 1 : 0.5}
                                />
                            );
                        })
                    )}
                </Svg>

                <View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            width: svgWidth,
                            height: svgHeight,
                        },
                    ]}
                    pointerEvents="box-none"
                >
                    {grille.map((row, y) =>
                        row.map((biome, x) => {
                            const tileIndex = positionToTileIndex.get(`${x},${y}`) ?? -1;
                            if (tileIndex < 0) return null;

                            const offsetX = y % 2 === 1 ? hexWidth / 2 : 0;
                            const centerX = x * horizSpacing + hexWidth / 2 + offsetX;
                            const centerY = y * vertSpacing + hexRadius;

                            const isAssigned = assignedTiles === null || assignedTiles.includes(tileIndex);
                            const isDisabled = disabled || !isAssigned;
                            const touchSize = hexRadius * 1.5;

                            return (
                                <TouchableOpacity
                                    key={`touch-${x}-${y}`}
                                    style={{
                                        position: "absolute",
                                        left: centerX - touchSize / 2,
                                        top: centerY - touchSize / 2,
                                        width: touchSize,
                                        height: touchSize,
                                        borderRadius: touchSize / 2,
                                        opacity: isDisabled ? 0.3 : 1,
                                    }}
                                    onPress={() => handleCellPress(x, y)}
                                    activeOpacity={isDisabled ? 1 : 0.7}
                                    disabled={isDisabled}
                                />
                            );
                        })
                    )}
                        </View>
                    </Animated.View>
                </View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
    },
    gridContainer: {
        width: "100%",
    },
});

