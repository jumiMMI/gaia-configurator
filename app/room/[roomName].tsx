import GameMobile from "@/src/components/GameMobile";
import GameWeb from "@/src/components/GameWeb";
import { useLocalSearchParams } from "expo-router";
import { Platform, Text } from "react-native";

export default function RoomScreen() {
    const { roomName } = useLocalSearchParams();

    // Normaliser roomName pour gérer les cas où c'est un tableau ou un objet
    const roomNameString = Array.isArray(roomName) 
        ? roomName[0] 
        : (typeof roomName === 'string' ? roomName : '');

    if (!roomNameString) return <Text>Room invalide</Text>;

    // Afficher l'interface appropriée selon la plateforme
    if (Platform.OS === 'web') {
        return <GameWeb roomName={roomNameString} />;
    }

    return <GameMobile roomName={roomNameString} />;
}
