import { Biome } from "@gaia/shared";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
//settings
import Co2Icon from "../../../assets/2d-icons/settings/co2.svg";
import EnergieIcon from "../../../assets/2d-icons/settings/energie.svg";
import HumiditeIcon from "../../../assets/2d-icons/settings/humidite.svg";
import LumiereIcon from "../../../assets/2d-icons/settings/lumiere.svg";
import NourritureIcon from "../../../assets/2d-icons/settings/nourriture.svg";
import OxygeneIcon from "../../../assets/2d-icons/settings/oxygene.svg";
import TemperatureIcon from "../../../assets/2d-icons/settings/temperature.svg";
//variantes
import OneBarIcon from "../../../assets/2d-icons/settings/variantes/1bar.svg";
import TwoBarsIcon from "../../../assets/2d-icons/settings/variantes/2bars.svg";
import EqualIcon from "../../../assets/2d-icons/settings/variantes/equal.svg";

interface SettingsPlanetProps {
    biome?: Biome;
}

interface SettingItem {
    label: string;
    value: number;
    icon: React.ComponentType<any>;
}

type ValueIndicator = {
    icon: React.ComponentType<any>;
    rotation: number; // Rotation en degrés (0 = vers le bas, 180 = vers le haut)
};

export default function SettingsPlanet({ biome }: SettingsPlanetProps) {
    // Toujours afficher les settings, même sans biome sélectionné
    const isBiomeSelected = !!biome;

    // Animations d'opacité
    const containerOpacity = useSharedValue(0.4);
    const indicatorOpacity = useSharedValue(0);

    // Animer l'opacité du container et des indicateurs
    useEffect(() => {
        containerOpacity.value = withTiming(isBiomeSelected ? 1.0 : 0.4, { duration: 300 });
        indicatorOpacity.value = withTiming(isBiomeSelected ? 1.0 : 0, { duration: 300 });
    }, [isBiomeSelected]);

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    const indicatorAnimatedStyle = useAnimatedStyle(() => ({
        opacity: indicatorOpacity.value,
    }));

    // Liste des settings avec leurs icônes (valeurs par défaut à 0 si pas de biome)
    const settings: SettingItem[] = [
        { label: "Température", value: biome?.temperature ?? 0, icon: TemperatureIcon },
        { label: "Humidité", value: biome?.humidite ?? 0, icon: HumiditeIcon },
        { label: "Lumière", value: biome?.lumiere ?? 0, icon: LumiereIcon },
        { label: "CO2", value: biome?.CO2 ?? 0, icon: Co2Icon },
        { label: "Énergie", value: biome?.energie ?? 0, icon: EnergieIcon },
        { label: "Nourriture", value: biome?.nourriture ?? 0, icon: NourritureIcon },
        { label: "Oxygène", value: biome?.oxygene ?? 0, icon: OxygeneIcon },
    ];

    /**
     * Convertit une valeur numérique en icône selon la légende :
     * ++ = +10 → 2 bars vers le haut
     * + = +5 → 1 bar vers le haut
     * 0 = 0 → signe égal
     * - = -5 → 1 bar vers le bas
     * -- = -10 → 2 bars vers le bas
     */
    const getValueIndicator = (value: number): ValueIndicator => {
        if (value >= 10) {
            // ++ = +10 ou plus → 2 bars vers le haut
            return { icon: TwoBarsIcon, rotation: 180 };
        } else if (value > 0) {
            // + = entre 0 et 10 → 1 bar vers le haut
            return { icon: OneBarIcon, rotation: 180 };
        } else if (value === 0) {
            // 0 = 0 → signe égal
            return { icon: EqualIcon, rotation: 0 };
        } else if (value > -10) {
            // - = entre -10 et 0 → 1 bar vers le bas
            return { icon: OneBarIcon, rotation: 0 };
        } else {
            // -- = -10 ou moins → 2 bars vers le bas
            return { icon: TwoBarsIcon, rotation: 0 };
        }
    };

    return (
        <Animated.View style={[styles.container, containerAnimatedStyle]}>
            {settings.map((setting, index) => {
                const ParamIcon = setting.icon;
                const valueIndicator = getValueIndicator(setting.value);
                const IndicatorIcon = valueIndicator.icon;
                const hasNoImpact = setting.value === 0;
                const rowOpacity = hasNoImpact ? 0.4 : 1.0;

                return (
                    <View key={index} style={[styles.settingRow, { opacity: rowOpacity }]}>
                        <View style={styles.iconContainer}>
                            <ParamIcon width={24} height={24} />
                        </View>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{setting.label}</Text>
                            {/* Variantes en absolute à droite du paramètre */}
                            <Animated.View style={[styles.indicatorContainer, indicatorAnimatedStyle]}>
                                <View
                                    style={[
                                        styles.indicatorWrapper,
                                        { transform: [{ rotate: `${valueIndicator.rotation}deg` }] },
                                    ]}
                                >
                                    <IndicatorIcon width={12} height={12} />
                                </View>
                            </Animated.View>
                        </View>
                    </View>
                );
            })}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderWidth: 2,
        borderColor: "#ffffff",
        padding: 10,
        paddingTop: 12,
        paddingBottom: 12,
        // backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    settingRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    iconContainer: {
        marginRight: 12,
        width: 24,
        height: 24,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    labelContainer: {
        flex: 1,
        position: "relative",
    },
    label: {
        fontSize: 14,
        color: "#ffffff",
        fontWeight: "500",
    },
    indicatorContainer: {
        position: "absolute",
        right: -3,
        top: "10%",
        marginTop: -6,
        width: 16,
        height: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    indicatorWrapper: {
        width: 12,
        height: 12,
        justifyContent: "center",
        alignItems: "center",
    },
});

