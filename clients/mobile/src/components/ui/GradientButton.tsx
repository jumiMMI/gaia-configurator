import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface GradientButtonProps {
  text: string;
  onPress: () => void;
  textOpacity?: number;
}

export default function GradientButton({ text, onPress, textOpacity }: GradientButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <LinearGradient
      colors={["#0A0B10", "#0B1428"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.buttonZone}
    >
      <View style={styles.buttonWrapper}>
        <View style={[styles.buttonShadow, { top: isPressed ? 2 : -1 }]} />
        <TouchableOpacity
          onPress={onPress}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          activeOpacity={1}
          style={styles.buttonTouchable}
        >
          <LinearGradient
            colors={["#191C1C", "#252A2D"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.button}
          >
            <Text style={[styles.buttonText, { opacity: isPressed ? 0.5 : (textOpacity ?? 1) }]}>
              {text}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  buttonZone: {
    paddingHorizontal: 11,
    paddingVertical: 11,
    borderRadius: 62,
    alignItems: "center",
    
  },
  buttonWrapper: {
    position: "relative",
    alignSelf: "stretch",
  },
  buttonShadow: {
    position: "absolute",
    top: -1,
    right: -2.1,
    borderRadius: 25.5,
    backgroundColor: "#4B5053",
    width: "100%",
    height: "100%",
  },
  buttonTouchable: {
    position: "relative",
  },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 27,
    minWidth: 210,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Omnium-Light",
    textTransform: "uppercase",
    textAlign: "center",
  },
});
