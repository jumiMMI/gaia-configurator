import "event-target-polyfill";
import ReactDOM from 'react-dom/client';
import App from './App';
import { AssetId } from "./constants/AssetId";
import './index.css';
import ThreeAssetManager from "./managers/ThreeAssetManager";

ThreeAssetManager.addRGBE(AssetId.THREE_HDR_SPACE, "/hdrs/space.hdr");
ThreeAssetManager.addTexture(AssetId.THREE_TEXTURE_MOON_ARM, "/textures/moonARM.jpg");
ThreeAssetManager.addTexture(AssetId.THREE_TEXTURE_MOON_NORMAL, "/textures/moonNormal.jpg");

ThreeAssetManager.beginLoad();

const startApp = () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <App />
  );
}

ThreeAssetManager.onFinishLoad.add(startApp);
