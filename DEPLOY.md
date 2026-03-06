# Déploiement sur Render

Ce projet est en **TypeScript** : le build produit le dossier `dist/`. Il faut donc que Render exécute la compilation **et** lance le bon fichier.

## Si le service a été créé à la main (sans Blueprint)

Dans le **Dashboard Render** → ton service → **Settings** → **Build & Deploy** :

| Champ | Valeur à mettre |
|--------|------------------|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

Sans ça, Render fait seulement `npm install` (pas de `dist/`) et lance `node src/server.js`, ce qui provoque l’erreur `Cannot find module '.../src/server.js'`.

**Important :** la **Start Command** doit être exactement `npm start` (et non `node src/server.ts`, `node src/server.js`, `tsx src/server.ts`, etc.). Si tu vois une erreur avec `server.ts` ou `ERR_MODULE_NOT_FOUND` sur `/src/index`, c’est que Render lance le source TypeScript au lieu du JS compilé : remets **Start Command** à `npm start`.

## Si tu utilises un Blueprint (render.yaml)

Le fichier `render.yaml` à la racine du repo définit déjà :

- **Build** : `npm install && npm run build`
- **Start** : `npm start`

Assure-toi que le service est bien déployé via ce Blueprint pour que ces commandes soient prises en compte.
