import { StyleSheet, View } from "react-native";
import { Circle, Svg } from "react-native-svg";

interface JoystickProps {
    size?: number;
}

export default function Joystick({ size = 115 }: JoystickProps) {
    const radius = size / 2;

    return (
        <View style={styles.container}>
            <Svg width={size} height={size}>
                <Circle
                    cx={radius}
                    cy={radius}
                    r={radius}
                    fill="#000"
                />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
    },
});

