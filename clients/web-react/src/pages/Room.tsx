import { useParams } from "react-router-dom";
import GameWeb from "../components/GameWeb";
import { GameTimerProvider } from "../contexts/GameTimerContext";

export default function RoomScreen() {
    const { roomName } = useParams<{ roomName: string }>();

    if (!roomName) {
        return <p>Room invalide</p>;
    }

    return (
        <GameTimerProvider>
            <GameWeb roomName={roomName} />
        </GameTimerProvider>
    );
}

