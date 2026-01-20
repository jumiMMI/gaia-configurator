import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Cinematic from './pages/Cinematic';
import Game from './pages/Game';
import Home from './pages/Home';
import Room from './pages/Room';

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

