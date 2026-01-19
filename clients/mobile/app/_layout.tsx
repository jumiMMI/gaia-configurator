import "partysocket/event-target-polyfill";
import "react-native-get-random-values";

global.Event = require("event-target-shim").Event;
global.EventTarget = require("event-target-shim").EventTarget;
global.CustomEvent = require("event-target-shim").CustomEvent;

import { Stack } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  useEffect(() => {
    // Charger la font pour le web
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack 
        screenOptions={{ headerShown: false }}
        initialRouteName="index"
      />
    </GestureHandlerRootView>
  );
}
