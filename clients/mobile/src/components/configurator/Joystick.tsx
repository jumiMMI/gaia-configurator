import * as Haptics from "expo-haptics";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { Circle, Defs, RadialGradient, Stop, Svg } from "react-native-svg";
import { runOnJS } from "react-native-worklets";

interface JoystickProps {
    size?: number;
    maxRadius?: number;
    onMove?: (angle: number, distance: number) => void;
}

export default function Joystick({ size = 95, maxRadius, onMove }: JoystickProps) {
    const baseSize = size * 1.15;
    const baseRadius = baseSize / 2;
    const joystickRadius = size / 2;
    const center = baseSize / 2;
    const maxMoveRadius = maxRadius || joystickRadius * 0.6;

    // Positions animées du joystick
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const wasAtEdge = useSharedValue(false);

    const highlightRadius = joystickRadius * 0.35; // Taille du highlight
    const highlightX = joystickRadius * 0.3; // Position X du highlight (vers la gauche)
    const highlightY = joystickRadius * 0.3; // Position Y du highlight (vers le haut)

    // Fonction wrapper pour la vibration haptique au début
    const triggerStartHaptic = () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (error) {
            console.log("Haptic error:", error);
        }
    };

    const triggerEdgeHaptic = () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            console.log("Haptic error:", error);
        }
    };


    const panGesture = Gesture.Pan()
        .onStart(() => {
            wasAtEdge.value = false;
            runOnJS(triggerStartHaptic)();
        })
        .onUpdate((event) => {
            const distance = Math.sqrt(event.translationX ** 2 + event.translationY ** 2);
            const edgeThreshold = maxMoveRadius * 0.95;

            if (distance > maxMoveRadius) {
                const angle = Math.atan2(event.translationY, event.translationX);
                translateX.value = Math.cos(angle) * maxMoveRadius;
                translateY.value = Math.sin(angle) * maxMoveRadius;

                if (!wasAtEdge.value) {
                    runOnJS(triggerEdgeHaptic)();
                    wasAtEdge.value = true;
                }
            } else {
                translateX.value = event.translationX;
                translateY.value = event.translationY;

                if (wasAtEdge.value && distance < edgeThreshold) {
                    wasAtEdge.value = false;
                }
            }

            const currentDistance = Math.sqrt(translateX.value ** 2 + translateY.value ** 2);
            const normalizedDistance = currentDistance / maxMoveRadius; // 0 à 1
            const angle = Math.atan2(translateY.value, translateX.value) * (180 / Math.PI);
            const normalizedAngle = angle < 0 ? angle + 360 : angle; // 0 à 360

            onMove?.(normalizedAngle, normalizedDistance);
        })
        .onEnd(() => {

            translateX.value = withSpring(0, {
                damping: 25,
                stiffness: 300,
            });
            translateY.value = withSpring(0, {
                damping: 25,
                stiffness: 300,
            });

            onMove?.(0, 0);
        });

    const animatedJoystickStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
            ],
        };
    });

    return (
        <View style={styles.container}>
            <GestureDetector gesture={panGesture}>
                <Animated.View style={styles.baseContainer}>

                    <Svg width={baseSize} height={baseSize}>
                        <Defs>
                            <RadialGradient id="baseGradient" cx="50%" cy="50%" r="50%">
                                <Stop offset="0%" stopColor="#3a3a3a" stopOpacity="1" />
                                <Stop offset="100%" stopColor="#1a1a1a" stopOpacity="1" />
                            </RadialGradient>
                        </Defs>
                        <Circle
                            cx={center}
                            cy={center}
                            r={baseRadius}
                            fill="url(#baseGradient)"
                        />
                    </Svg>

                    {/* Joystick animé (bouton) centré sur la base */}
                    <Animated.View style={[styles.joystickContainer, animatedJoystickStyle]}>
                        <Svg width={baseSize} height={baseSize}>
                            <Defs>
                                {/* effet 3D */}
                                <RadialGradient id="joystickGradient" cx="50%" cy="50%" r="50%">
                                    <Stop offset="0%" stopColor="#4a4a4a" stopOpacity="1" />
                                    <Stop offset="60%" stopColor="#2a2a2a" stopOpacity="1" />
                                    <Stop offset="100%" stopColor="#000000" stopOpacity="1" />
                                </RadialGradient>
                                {/* reflet lumineux */}
                                <RadialGradient id="highlightGradient" cx="50%" cy="50%" r="50%">
                                    <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                                    <Stop offset="50%" stopColor="#ffffff" stopOpacity="0.2" />
                                    <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                                </RadialGradient>
                            </Defs>

                            <Circle
                                cx={center}
                                cy={center}
                                r={joystickRadius}
                                fill="url(#joystickGradient)"
                            />

                            <Circle
                                cx={center - highlightX}
                                cy={center - highlightY}
                                r={highlightRadius}
                                fill="url(#highlightGradient)"
                            />
                        </Svg>
                    </Animated.View>
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6, // Pour Android
    },
    baseContainer: {
        position: "relative",
    },
    joystickContainer: {
        position: "absolute",
        top: 0,
        left: 0,
    },
});
