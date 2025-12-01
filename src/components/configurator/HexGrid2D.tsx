import { useEffect, useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import { Rect, Svg } from "react-native-svg";
import { Biome } from "../../models/Biome";
import {
    calculerDimensionsGrilleFromHexasphere,
    getDefaultHexasphereData,
    GridDimensions,
} from "../../utils/hexasphereUtils";

interface HexGrid2DProps {
    selectedBiome?: Biome;
    onCellPress?: (x: number, y: number, tileIndex: number) => void;
    cellSize?: number;
}

export default function HexGrid2D({
    selectedBiome,
    onCellPress,
    cellSize = 20,
}: HexGrid2DProps) {
    const [grille, setGrille] = useState<(Biome | null)[][]>([]);
    const [dimensions, setDimensions] = useState<GridDimensions | null>(null);
    const [tileMapping, setTileMapping] = useState<Map<number, { x: number; y: number }>>(
        new Map()
    );

    // Initialiser la grille au montage du composant
    useEffect(() => {
        // Récupérer les données hexasphere
        const hexData = getDefaultHexasphereData();

        // Calculer les dimensions de la grille
        const dims = calculerDimensionsGrilleFromHexasphere();
        setDimensions(dims);

        // Initialiser la grille vide
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

    // Fonction pour gérer le tap sur une cellule
    const handleCellPress = (x: number, y: number) => {

        let tileIndex = -1;
        tileMapping.forEach((pos, index) => {
            if (pos.x === x && pos.y === y) {
                tileIndex = index;
            }
        });

        // Si une tuile correspond et qu'un biome est sélectionné
        if (tileIndex >= 0 && selectedBiome) {
            // Mettre à jour la grille
            const newGrille = grille.map((row) => [...row]);
            newGrille[y][x] = selectedBiome;
            setGrille(newGrille);

            // Appeler le callback
            onCellPress?.(x, y, tileIndex);
        }
    };

    if (!dimensions || grille.length === 0) {
        return null;
    }

    // Calculer les dimensions du SVG
    const svgWidth = dimensions.largeur * cellSize;
    const svgHeight = dimensions.hauteur * cellSize;

    // Limiter la largeur à la largeur de l'écran
    const screenWidth = Dimensions.get("window").width - 40; // Padding
    const maxWidth = Math.min(svgWidth, screenWidth);
    const scale = maxWidth / svgWidth;
    const scaledCellSize = cellSize * scale;

    return (
        <View style={styles.container}>
            <View style={styles.gridContainer}>
                <Svg
                    width={maxWidth}
                    height={svgHeight * scale}
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                >
                    {/* Dessiner toutes les cellules */}
                    {grille.map((row, y) =>
                        row.map((biome, x) => {
                            const cellX = x * cellSize;
                            const cellY = y * cellSize;

                            // Vérifier si cette cellule correspond à une tuile
                            const isTile = Array.from(tileMapping.values()).some(
                                (pos) => pos.x === x && pos.y === y
                            );

                            return (
                                <Rect
                                    key={`${x}-${y}`}
                                    x={cellX}
                                    y={cellY}
                                    width={cellSize}
                                    height={cellSize}
                                    fill={biome ? biome.couleur : isTile ? "#f0f0f0" : "#ffffff"}
                                    stroke="#333"
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
                            width: maxWidth,
                            height: svgHeight * scale,
                        },
                    ]}
                    pointerEvents="box-none"
                >
                    {grille.map((row, y) =>
                        row.map((biome, x) => {
                            const cellX = x * scaledCellSize;
                            const cellY = y * scaledCellSize;

                            // Vérifier si cette cellule correspond à une tuile
                            const isTile = Array.from(tileMapping.values()).some(
                                (pos) => pos.x === x && pos.y === y
                            );

                            if (!isTile) return null;

                            return (
                                <TouchableOpacity
                                    key={`touch-${x}-${y}`}
                                    style={{
                                        position: "absolute",
                                        left: cellX,
                                        top: cellY,
                                        width: scaledCellSize,
                                        height: scaledCellSize,
                                    }}
                                    onPress={() => handleCellPress(x, y)}
                                    activeOpacity={0.7}
                                />
                            );
                        })
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 20,
        alignItems: "center",
    },
    gridContainer: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 10,
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

