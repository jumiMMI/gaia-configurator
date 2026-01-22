import { useLocalSearchParams, useRouter } from "expo-router";
import GameMobile from "../src/components/GameMobile";
import { GameTimerProvider } from "../src/contexts/GameTimerContext";

export default function Game() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomName: string }>();
  
  const roomName = params.roomName;

  if (!roomName) {
    router.replace("/");
    return null;
  }

  return (
    <GameTimerProvider>
      <GameMobile roomName={roomName} />
    </GameTimerProvider>
  );
}


