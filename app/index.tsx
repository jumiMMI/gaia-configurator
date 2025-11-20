import { useRouter } from "expo-router";
import { useState } from "react";
import { Button, TextInput, View } from "react-native";


export default function Home() {
  const [roomName, setRoomName] = useState("");
  const router = useRouter();

  const goToRoom = () => {
    const name = roomName || `room-${Math.floor(Math.random() * 10000)}`;
    setRoomName(name);
    router.push(`/room/${name}`);
  };

  const goToGaia = () => {
    router.push("/gaia");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <TextInput
        placeholder="Nom de la room"
        value={roomName}
        onChangeText={setRoomName}
        style={{ borderWidth: 1, padding: 10, width: "100%", marginBottom: 20 }}
      />
      <Button title="Créer / Rejoindre une room" onPress={goToRoom} />
      <View style={{ marginTop: 20 }}>
        <Button title="Jouer à Gaia" onPress={goToGaia} />
      </View>
    </View>
  );
}
