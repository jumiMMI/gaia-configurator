import { createPartyClient } from "../party/client";
import { useState } from "react";
import "../styles/CreateRoom.css";

export default function CreateRoom() {
  const [roomName, setRoomName] = useState("");

  const createRoom = () => {
    const name = roomName || `room-${Math.floor(Math.random() * 10000)}`;
    setRoomName(name);

    // host
    const socket = createPartyClient(name, "10.137.98.7:1999"); 

    socket.onopen = () => {
      alert(`Room créée ! Nom de la room : ${name}`);
    };

    socket.onmessage = (msg) => {
      console.log(msg.data);
    };
  };

  return (
    <div className="create-room-container">
      <input
        type="text"
        placeholder="Nom de la room (optionnel)"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        className="create-room-input"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            createRoom();
          }
        }}
      />
      <button onClick={createRoom} className="create-room-button">
        Créer une session
      </button>
      {roomName && (
        <p className="create-room-share">
          Partage ce nom avec tes amis : {roomName}
        </p>
      )}
    </div>
  );
}

