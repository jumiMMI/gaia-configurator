import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();

  const handleLaunchGame = () => {
    const roomName = `room-${Math.floor(Math.random() * 10000)}`;
    navigate(`/room/${roomName}`);
  };

  const handleViewLeaderboard = () => {
    console.log("Voir le leaderboard");
  };

  return (
    <div className="home-container">
      <h1 className="home-title">Gaia Project</h1>
      
      <div className="home-buttons-container">
        <button onClick={handleLaunchGame} className="home-button">
          Lancer une partie
        </button>
        <button onClick={handleViewLeaderboard} className="home-button">
          Voir le leaderboard
        </button>
      </div>
    </div>
  );
}

