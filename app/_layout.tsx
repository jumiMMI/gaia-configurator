import "react-native-get-random-values";
import "partysocket/event-target-polyfill";

global.Event = require("event-target-shim").Event;
global.EventTarget = require("event-target-shim").EventTarget;
global.CustomEvent = require("event-target-shim").CustomEvent;

import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
