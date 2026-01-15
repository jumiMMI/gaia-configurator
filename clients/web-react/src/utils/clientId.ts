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
 * Utilise localStorage (web uniquement)
 */
export async function getOrCreateClientId(): Promise<string> {
  try {
    if (typeof window === "undefined") {
      return generateClientId();
    }
    
    let clientId = localStorage.getItem(CLIENT_ID_KEY);
    if (!clientId) {
      clientId = generateClientId();
      localStorage.setItem(CLIENT_ID_KEY, clientId);
    }
    return clientId;
  } catch (error) {
    // En cas d'erreur, générer un ID temporaire
    console.warn("Erreur lors de la récupération de l'ID client:", error);
    return generateClientId();
  }
}

