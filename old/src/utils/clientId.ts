import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const CLIENT_ID_KEY = "gaia_client_id";

/**
 * Génère un ID unique aléatoire
 */
function generateClientId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}`;
}

/**
 * Récupère ou génère un ID client persistant
 * Utilise AsyncStorage sur mobile et localStorage sur web
 */
export async function getOrCreateClientId(): Promise<string> {
  try {
    if (Platform.OS === "web") {
      // Sur web, utiliser localStorage
      if (typeof window !== "undefined") {
        let clientId = localStorage.getItem(CLIENT_ID_KEY);
        if (!clientId) {
          clientId = generateClientId();
          localStorage.setItem(CLIENT_ID_KEY, clientId);
        }
        return clientId;
      }
    } else {
      // Sur mobile, utiliser AsyncStorage
      let clientId = await AsyncStorage.getItem(CLIENT_ID_KEY);
      if (!clientId) {
        clientId = generateClientId();
        await AsyncStorage.setItem(CLIENT_ID_KEY, clientId);
      }
      return clientId;
    }
  } catch (error) {
    // En cas d'erreur, générer un ID temporaire
    console.warn("Erreur lors de la récupération de l'ID client:", error);
    return generateClientId();
  }
  
  // Fallback
  return generateClientId();
}

