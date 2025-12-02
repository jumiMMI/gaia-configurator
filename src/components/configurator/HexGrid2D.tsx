import { useEffect, useState } from "react";
import { LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { clamp, useAnimatedStyle, useSharedValue, withDecay } from "react-native-reanimated";
import { Polygon, Svg } from "react-native-svg";
import { allBiomes, Biome } from "../../models/Biome";
import { BiomeData } from "../../party/messages";
import {
    calculerDimensionsGrilleFromHexasphere,
    getDefaultHexasphereData,
    GridDimensions,
} from "../../utils/hexasphereUtils";


const SQRT3 = Math.sqrt(3);

/**
 * 
 * @param cx 
 * @param cy
 * @param radius -
 * @returns
 */
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
}

export default function HexGrid2D({
    selectedBiome,
    onCellPress,
    cellSize = 20,
    maxVisibleHeight = 300,
    tileBiomes = {},
}: HexGrid2DProps) {
    const [grille, setGrille] = useState<(Biome | null)[][]>([]);
    const [dimensions, setDimensions] = useState<GridDimensions | null>(null);
    const [tileMapping, setTileMapping] = useState<Map<number, { x: number; y: number }>>(
        new Map()
    );
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

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

    // Style animé pour appliquer le déplacement
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

        // Créer le mapping tuile index → position grille [x, y]
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

    const handleCellPress = (x: number, y: number) => {

        let tileIndex = -1;
        tileMapping.forEach((pos, index) => {
            if (pos.x === x && pos.y === y) {
                tileIndex = index;
            }
        });

        
        if (tileIndex >= 0 && selectedBiome) {
            
            const newGrille = grille.map((row) => [...row]);
            newGrille[y][x] = selectedBiome;
            setGrille(newGrille);

            
            onCellPress?.(x, y, tileIndex);
        }
    };

    if (!dimensions || grille.length === 0) {
        return null;
    }


    const hexRadius = cellSize;
    const hexWidth = hexRadius * SQRT3;
    const hexHeight = hexRadius * 2;      
    

    const horizSpacing = hexWidth;           
    const vertSpacing = hexHeight * 0.75;    

    
    const svgWidth = (dimensions.largeur) * horizSpacing + hexWidth / 2;
    const svgHeight = (dimensions.hauteur - 1) * vertSpacing + hexHeight;


    const visibleWidth = containerSize.width > 0 ? containerSize.width : svgWidth;
    const visibleHeight = containerSize.height > 0 ? containerSize.height : maxVisibleHeight;
    

    const scrollableX = Math.max(0, svgWidth - visibleWidth);
    const scrollableY = Math.max(0, svgHeight - visibleHeight);
    

    minX.value = -scrollableX;
    minY.value = -scrollableY;

    return (
        <View style={styles.container}>
            <GestureDetector gesture={panGesture}>
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
                    {/* Dessiner tous les hexagones */}
                    {grille.map((row, y) =>
                        row.map((biome, x) => {
                            
                            const offsetX = y % 2 === 1 ? hexWidth / 2 : 0;
                            const centerX = x * horizSpacing + hexWidth / 2 + offsetX;
                            const centerY = y * vertSpacing + hexRadius;

                            
                            const isTile = Array.from(tileMapping.values()).some(
                                (pos) => pos.x === x && pos.y === y
                            );

                            return (
                                <Polygon
                                    key={`${x}-${y}`}
                                    points={getHexagonPoints(centerX, centerY, hexRadius)}
                                    fill={biome ? biome.couleur : isTile ? "#e8e8e8" : "#ffffff"}
                                    stroke="#555"
                                    strokeWidth={1}
                                />
                            );
                        })
                    )}
                </Svg>
                {/* Overlay transparent pour gérer les touches */}
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
                            
                            const offsetX = y % 2 === 1 ? hexWidth / 2 : 0;
                            const centerX = x * horizSpacing + hexWidth / 2 + offsetX;
                            const centerY = y * vertSpacing + hexRadius;

                            // Vérifier si cette cellule correspond à une tuile
                            const isTile = Array.from(tileMapping.values()).some(
                                (pos) => pos.x === x && pos.y === y
                            );

                            if (!isTile) return null;

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
                                    }}
                                    onPress={() => handleCellPress(x, y)}
                                    activeOpacity={0.7}
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
        marginVertical: 20,
        alignItems: "center",
    },
    gridContainer: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 15,
        width: "100%",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
});

