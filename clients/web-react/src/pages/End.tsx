import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

export default function End() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      Fini
    </div>
  );
}

