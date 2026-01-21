import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import GameWeb from "../components/GameWeb";
import { GameTimerProvider, useGameTimer } from "../contexts/GameTimerContext";
import { usePlanetSync } from "../party/client";
import "../styles/Room.css";

function RoomContent({ roomName, onGameStart }: { roomName: string; onGameStart: () => void }) {
    const { startGame: startTimer } = useGameTimer();
    const [teamName, setTeamName] = useState("");
    
    const { totalUsers, isConnected, users, isHost, startGame } = usePlanetSync({
        room: roomName,
        onGameStart: () => {
            // Démarrer le timer et afficher le jeu
            startTimer();
            onGameStart();
        },
    });

    const mobileParticipantsCount = users.filter(user => !user.isHost).length;
    const qrCodeValue = roomName;

    return (
        <div className="room-container">
            <div className="room-content">
                <div className="room-content-top">
                    <div className="qr-code-container">
                        <QRCodeSVG value={qrCodeValue} size={256} />
                    </div>

                    <div className="right-section">
                        <div className="wrapper-right">
                            <div className="team-name-container">
                                <label htmlFor="teamName" className="team-name-label">
                                    Nom de l'équipe : 
                                </label>
                                <input
                                    id="teamName"
                                    type="text"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    className="team-name-input"
                                />
                            </div>

                            <div className="participants-container">
                                <span className="participants-label">Nombre de participants :</span>
                                <span className="participants-count">
                                    {isConnected ? mobileParticipantsCount : "..."}
                                </span>
                                <span> / 4</span>
                            </div>
                        </div>
                    </div>
                </div>

                {isHost && (
                    <button 
                        className="start-button"
                        onClick={startGame}
                        disabled={!isConnected}
                    >
                        Démarrer
                    </button>
                )}
            </div>
        </div>
    );
}

export default function RoomScreen() {
    const { roomName } = useParams<{ roomName: string }>();
    const [showGame, setShowGame] = useState(false);

    if (!roomName) {
        return <p>Room invalide</p>;
    }

    if (showGame) {
        return (
            <GameTimerProvider>
                <GameWeb roomName={roomName} />
            </GameTimerProvider>
        );
    }    return (
        <GameTimerProvider>
            <RoomContent roomName={roomName} onGameStart={() => setShowGame(true)} />
        </GameTimerProvider>
    );
}