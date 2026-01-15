# Gaia Configurator - Monorepo

Structure monorepo pour le projet Gaia Configurator avec séparation des clients (mobile/web) et de l'API.

## Structure

```
gaia-configurator/
├── packages/
│   └── shared/          # Code partagé entre tous les projets
│       ├── package.json
│       └── src/
│           ├── domain/      # Biome, PlanetState
│           ├── party/       # messages.ts
│           ├── utils/       # hexasphereUtils.ts
│           ├── config/      # planetConfig.ts
│           └── types/       # hexasphere.d.ts
│
├── clients/
│   ├── mobile/          # Application mobile (React Native/Expo)
│   │   ├── package.json
│   │   ├── app/         # Routes Expo Router
│   │   └── src/
│   │       ├── components/
│   │       ├── contexts/
│   │       ├── party/   # client.ts (spécifique au client)
│   │       └── utils/   # clientId.ts (spécifique au client)
│   │
│   └── web/             # Application web (React/Expo Web)
│       ├── package.json
│       ├── app/         # Routes Expo Router
│       └── src/
│           ├── components/
│           ├── contexts/
│           ├── party/   # client.ts (spécifique au client)
│           └── utils/  # clientId.ts (spécifique au client)
│
└── api/                 # Serveur PartyKit
    ├── package.json
    └── party/
        └── server.ts
```

## Installation

À la racine du projet :

```bash
npm install
```

Cela installera toutes les dépendances pour tous les workspaces.

## Utilisation

### Démarrer l'application mobile

```bash
npm run start:mobile
# ou
cd clients/mobile && npm start
```

### Démarrer l'application web

```bash
npm run start:web
# ou
cd clients/web && npm start
```

### Démarrer l'API (serveur PartyKit)

```bash
npm run dev:api
# ou
cd api && npm run dev
```

## Imports

### Depuis `@gaia/shared`

Tous les fichiers partagés peuvent être importés depuis `@gaia/shared` :

```typescript
import { Biome, PlanetState, BiomeData, getDefaultHexasphereData } from "@gaia/shared";
```

### Chemins relatifs

Pour les fichiers spécifiques à chaque client, utilisez les chemins relatifs :

```typescript
// Dans clients/mobile/src/components/GameMobile.tsx
import { usePlanetSync } from "../party/client";
import { biomeIcons } from "../domain/biomeIcons";
```

## Workspaces

Le projet utilise npm workspaces pour gérer les dépendances :

- `packages/shared` : Code partagé (Biome, PlanetState, messages, utils)
- `clients/mobile` : Application mobile
- `clients/web` : Application web
- `api` : Serveur PartyKit

Chaque workspace a son propre `package.json` avec ses dépendances spécifiques.
