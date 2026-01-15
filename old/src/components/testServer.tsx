import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, ScrollView } from "react-native";
import { createPartyClient } from "@/src/party/client";

export default function MultiChat() {
    const [messages, setMessages] = useState<string[]>([]);
    const [input, setInput] = useState("");

    useEffect(() => {
        const socket = createPartyClient("main-room", "10.137.98.7:1999");

        socket.onopen = () => {
            console.log("Connecté au serveur !");
        };

        socket.onmessage = (msg) => {
            setMessages((prev) => [...prev, msg.data]);
        };

        return () => socket.close();
    }, []);

    const sendMessage = () => {
        if (input) {
            // Envoie le message au serveur
            const socket = createPartyClient("main-room", "10.137.98.7:1999");
            socket.send(input);
            setInput("");
        }
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
