import "partysocket/event-target-polyfill";
import "react-native-get-random-values";

global.Event = require("event-target-shim").Event;
global.EventTarget = require("event-target-shim").EventTarget;
global.CustomEvent = require("event-target-shim").CustomEvent;

import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
