import { createPartyClient } from "@/src/party/client";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";


export default function RoomScreen() {
    const { roomName } = useLocalSearchParams();
    const [messages, setMessages] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const [socket, setSocket] = useState<any>(null);
    const [isHost, setIsHost] = useState(false);

    // Normaliser roomName pour gérer les cas où c'est un tableau ou un objet
    const roomNameString = Array.isArray(roomName) 
        ? roomName[0] 
        : (typeof roomName === 'string' ? roomName : '');

    useEffect(() => {
        if (!roomNameString) return;

        const socket = createPartyClient(roomNameString,"192.168.1.20:1999"); // "10.137.98.7:1999"
        setSocket(socket);

        socket.onerror = (error) => {
            console.error("Erreur WebSocket:", error);
        };

        socket.onclose = (event) => {
            console.log("Connexion fermée:", event.code, event.reason);
        };

        socket.onopen = () => {
            console.log(`Connecté à la room ${roomNameString}`);
        };

        socket.onmessage = (msg) => {
            try {
              const data = JSON.parse(msg.data);
          
              if (data.type === "role") {
                console.log("Je suis host ?", data.isHost);
                console.log("Host de la room =", data.hostId);
                setIsHost(data.isHost);
                return; // Ne pas afficher ce message JSON
              }
              
              if (data.type === "users") {
                // Ne pas afficher le message JSON de la liste des utilisateurs
                return;
              }
            } catch (err) {
              // pas du JSON, message normal - on l'affiche
            }
          
            // Afficher uniquement les messages texte (pas les JSON)
            setMessages((prev) => [...prev, msg.data]);
          };
          

        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, [roomNameString]);

    if (!roomNameString) return <Text>Room invalide</Text>;

    const sendMessage = () => {
        if (!input || !socket) return;
        socket.send(input);
        setInput("");
    };

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <ScrollView style={{ flex: 1, marginBottom: 10 }}>
                {messages.map((msg, i) => (
                    <Text key={i}>{msg}</Text>
                ))}
            </ScrollView>
            <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Tape ton message"
                style={{ borderWidth: 1, padding: 8, marginBottom: 10 }}
            />
            <Button title="Envoyer" onPress={sendMessage} />
        </View>
    );
}
