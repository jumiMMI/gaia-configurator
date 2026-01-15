# Gaia Configurator - Web React

Application web React pure (sans Expo) pour le projet Gaia Configurator.

## Installation

```bash
npm install
```

## Configuration

Créez un fichier `.env` à la racine du projet avec :

```
VITE_PARTYKIT_HOST=10.137.101.69:1999
```

Ou copiez le fichier `.env.example` :

```bash
cp .env.example .env
```

## Développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## Build

```bash
npm run build
```

Le build sera dans le dossier `dist/`

## Structure

- `src/pages/` - Pages de l'application (Home, Room, Game, Cinematic)
- `src/components/` - Composants React
  - `threejs/` - Composants Three.js (scène 3D, planète, biomes)
- `src/party/` - Client PartyKit (WebSocket)
- `src/contexts/` - Contextes React (GameTimer)
- `src/utils/` - Utilitaires
- `public/models/` - Assets 3D (fichiers GLB)

## Assets

Les modèles 3D (GLB) doivent être dans `public/models/` :
- `foret.glb`
- `desert.glb`
- `volcano.glb`
- `glacier.glb`
- `herbes.glb`

