import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Room from './pages/Room';
import Game from './pages/Game';
import Cinematic from './pages/Cinematic';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomName" element={<Room />} />
        <Route path="/game" element={<Game />} />
        <Route path="/cinematic" element={<Cinematic />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

