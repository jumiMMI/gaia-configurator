import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

export default function Home() {
  const [roomName, setRoomName] = useState("");
  const navigate = useNavigate();

  const goToRoom = () => {
    const name = roomName || `room-${Math.floor(Math.random() * 10000)}`;
    setRoomName(name);
    navigate(`/room/${name}`);
  };

  return (
    <div className="home-container">
      <input
        type="text"
        placeholder="Nom de la room"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        className="room-input"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            goToRoom();
          }
        }}
      />
      <button onClick={goToRoom} className="room-button">
        Créer / Rejoindre une room
      </button>
    </div>
  );
}

