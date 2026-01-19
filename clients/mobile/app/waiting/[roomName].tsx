import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { usePlanetSync } from "../../src/party/client";

export default function WaitingScreen() {
    const { roomName } = useLocalSearchParams();
    const router = useRouter();
    const [teamName, setTeamName] = useState("");
    const [blinkOpacity] = useState(new Animated.Value(1));

    const roomNameString = Array.isArray(roomName) 
        ? roomName[0] 
        : (typeof roomName === 'string' ? roomName : '');

    const { users, isConnected, isHost, startGame } = usePlanetSync({
        room: roomNameString || "",
        onGameStart: () => {
            router.replace(`/room/${roomNameString}`);
        },
    });

    // Animation de clignotement
    useEffect(() => {
        const blinkAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(blinkOpacity, {
                    toValue: 0.3,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(blinkOpacity, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        blinkAnimation.start();
        return () => blinkAnimation.stop();
    }, []);

    // Compter uniquement les participants mobiles (exclure l'host)
    const mobileParticipantsCount = users.filter(user => !user.isHost).length;

    if (!roomNameString) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Room invalide</Text>
            </View>
        );
    }

    const handleStartGame = () => {
        router.replace(`/room/${roomNameString}`);
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.welcomeText}>
                    Team '{teamName || "..."}', prêt à terraformer ?
                </Text>
                <Text style={styles.waitingText}>
                    Veuillez patienter que tous les terraformateurs soient dans la session
                </Text>

                <Animated.Text style={[styles.blinkingText, { opacity: blinkOpacity }]}>
                    En attente...
                </Animated.Text>

                <View style={styles.participantsInfo}>
                    <Text style={styles.participantsText}>
                        Nombre de joueurs : {isConnected ? mobileParticipantsCount : "..."}
                    </Text>
                </View>

                <TouchableOpacity 
                    style={styles.startButton} 
                    onPress={handleStartGame}
                >
                    <Text style={styles.startButtonText}>Lancer la partie</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#D9D9D9",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    content: {
        width: "100%",
        maxWidth: 400,
        alignItems: "center",
        gap: 24,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
        marginBottom: 8,
    },
    waitingText: {
        fontSize: 16,
        color: "#333",
        textAlign: "center",
        lineHeight: 24,
    },
    blinkingText: {
        fontSize: 18,
        color: "#333",
        fontWeight: "600",
        marginTop: 8,
    },
    participantsInfo: {
        marginTop: 16,
    },
    participantsText: {
        fontSize: 16,
        color: "#333",
        fontWeight: "500",
    },
    startButton: {
        backgroundColor: "#333",
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 8,
        marginTop: 24,
    },
    startButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    errorText: {
        fontSize: 16,
        color: "#ef4444",
        textAlign: "center",
    },
});
