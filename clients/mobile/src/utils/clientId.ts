import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const CLIENT_ID_KEY = "gaia_client_id";

function generateClientId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}`;
}

export async function getOrCreateClientId(): Promise<string> {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        let clientId = localStorage.getItem(CLIENT_ID_KEY);
        if (!clientId) {
          clientId = generateClientId();
          localStorage.setItem(CLIENT_ID_KEY, clientId);
        }
        return clientId;
      }
    } else {
      let clientId = await AsyncStorage.getItem(CLIENT_ID_KEY);
      if (!clientId) {
        clientId = generateClientId();
        await AsyncStorage.setItem(CLIENT_ID_KEY, clientId);
      }
      return clientId;
    }
  } catch (error) {
    console.warn("Erreur lors de la récupération de l'ID client:", error);
    return generateClientId();
  }
  
  return generateClientId();
}

