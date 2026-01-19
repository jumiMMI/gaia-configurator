import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export default function JoinGame() {
  const [roomName, setRoomName] = useState("");
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {

    const scannedRoomName = data.trim();
    if (scannedRoomName) {
      router.push({
        pathname: "/waiting/[roomName]",
        params: { roomName: scannedRoomName },
      } as any);
    }
  };

  const handleSubmit = () => {
    const name = roomName.trim();
    if (name) {
      router.push({
        pathname: "/waiting/[roomName]",
        params: { roomName: name },
      } as any);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.instructionText}>Autorisation caméra requise</Text>
        <Text style={styles.message}>Veuillez autoriser l'accès à la caméra pour scanner le QR code</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.instructionText}>
        Rendez-vous sur le site gaiaproject.fr sur ordinateur puis scanner le QR code de votre partie.
      </Text>
      
      {/* Zone de scan QR code */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
      </View>

      {/* Container pour le champ de texte */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Écrivez votre code</Text>
        <TextInput
          placeholder="Nom de la room"
          value={roomName}
          onChangeText={setRoomName}
          onSubmitEditing={handleSubmit}
          style={styles.input}
          autoCapitalize="none"
          returnKeyType="go"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D9D9D9",
    padding: 20,
  },
  instructionText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 20,
    lineHeight: 20,
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  cameraContainer: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  inputContainer: {
    width: "100%",
  },
  inputLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    padding: 15,
    width: "100%",
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 16,
  },
});
