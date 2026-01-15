import { createPartyClient } from "@/src/party/client";
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

export default function CreateRoom() {
  const [roomName, setRoomName] = useState("");

  const createRoom = () => {
    const name = roomName || `room-${Math.floor(Math.random() * 10000)}`;
    setRoomName(name);

    // host
    const socket = createPartyClient(name, "10.137.98.7:1999"); 

    socket.onopen = () => {
      Alert.alert("Room créée !", `Nom de la room : ${name}`);
    };

    socket.onmessage = (msg) => {
      console.log(msg.data);
    };
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <TextInput
        placeholder="Nom de la room (optionnel)"
        value={roomName}
        onChangeText={setRoomName}
        style={{ borderWidth: 1, padding: 10, width: "100%", marginBottom: 20 }}
      />
      <Button title="Créer une session" onPress={createRoom} />
      {roomName ? <Text style={{ marginTop: 20 }}>Partage ce nom avec tes amis : {roomName}</Text> : null}
    </View>
  );
}
