import "partysocket/event-target-polyfill";
import "react-native-get-random-values";

global.Event = require("event-target-shim").Event;
global.EventTarget = require("event-target-shim").EventTarget;
global.CustomEvent = require("event-target-shim").CustomEvent;

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Omnium-Bold": require("../src/fonts/fonnts.com-Omnium_Bold.otf"),
    "Omnium-ExtraBold": require("../src/fonts/fonnts.com-Omnium_ExtraBold.otf"),
    "Omnium-Light": require("../src/fonts/fonnts.com-Omnium_Light.otf"),
    "Digital-Desolation": require("../../../packages/shared/src/fonts/title/Digital-Desolation.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://use.typekit.net/aah7rto.css";
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack 
        screenOptions={{ headerShown: false }}
        initialRouteName="index"
      />
    </GestureHandlerRootView>
  );
}
