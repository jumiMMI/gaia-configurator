import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import GameMobile from "../../src/components/GameMobile";
import { GameTimerProvider } from "../../src/contexts/GameTimerContext";

export default function RoomScreen() {
    const { roomName } = useLocalSearchParams();

    const roomNameString = Array.isArray(roomName) 
        ? roomName[0] 
        : (typeof roomName === 'string' ? roomName : '');

    if (!roomNameString) return <Text>Room invalide</Text>;

    return (
        <GameTimerProvider>
            <GameMobile roomName={roomNameString} />
        </GameTimerProvider>
    );
}
