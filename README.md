# 🐍 SnakeX — Grow. Fight. Dominate.

[![License](https://img.shields.io/badge/license-UNLICENSED-green.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-brightgreen.svg)](https://nodejs.org/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2051-black.svg)](https://expo.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-010101.svg)](https://socket.io/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Postgres-3ECF8E.svg)](https://supabase.com/)

---

<p align="center">
  <img src="apps/mobile/assets/logo.png" width="320" alt="SnakeX Official Logo" />
</p>

<p align="center">
  <strong>SnakeX</strong> est un véritable jeu d'arène multijoueur temps réel sur mobile (Android & iOS).<br />
  Pilotez votre serpent, absorbez des orbes d'énergie luminescentes, encerclez vos adversaires et devenez le prédateur dominant du classement mondial !
</p>

---

## 🎮 Caractéristiques Principales

- **Simulation Autoritaire Temps Réel :** Le serveur gère la physique, les déplacements, la croissance, les orbes et les collisions à **30 ticks/seconde**. Zéro triche possible côté client.
- **Grille de Hachage Spatial (`SpatialHashGrid`) :** Détection de collisions ultra-performante en temps quasi-constant, testée et validée à **50 joueurs simultanés** sur un VPS 2 vCores / 4 Go RAM.
- **Contrôles Tactiles Ergonomiques :** Joystick virtuel flottant et bouton de boost haute réactivité spécialement calibrés pour smartphones.
- **Support Portrait et Paysage Dynamique :** Pivotez librement votre smartphone en plein milieu d'une partie sans aucune interruption, reconnexion ni perte de progression.
- **Comptes & Classements Mondiaux (Supabase) :** Authentification sécurisée par JWT, profils personnalisés, sauvegarde certifiée par le serveur des records et classements globaux avec Row Level Security (RLS).
- **Architecture Monorepo Propre :** Code partagé (`packages/shared`), serveur de jeu (`services/game-server`), application mobile (`apps/mobile`).

---

## 🌐 Endpoints de Production (VPS OVH)

| Service | URL Publique | Description |
|---|---|---|
| **Health Check** | [http://152.228.137.4/health](http://152.228.137.4/health) | État de santé, uptime, joueurs connectés |
| **Métriques Temps Réel** | [http://152.228.137.4/metrics](http://152.228.137.4/metrics) | CPU, RAM, durée de tick (ms), latence p95 |
| **Page Téléchargement APK** | [http://152.228.137.4/downloads/](http://152.228.137.4/downloads/) | Téléchargement direct de l'APK Android et hash SHA-256 |
| **Serveur WebSocket** | `ws://152.228.137.4` (Port 80 / 3001) | Flux multijoueur Socket.IO |

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
git clone https://github.com/TruckMatchAdmin/SnakeX.git
cd SnakeX
npm install
npm run build:shared
```

### 2. Lancer le serveur localement
```bash
npm run dev:server
```
Le serveur écoute sur `http://localhost:3001`.

### 3. Lancer l'application mobile Expo
```bash
cd apps/mobile
npm run start
```
Scannez le QR Code avec **Expo Go** sur votre smartphone Android.

### 4. Lancer les tests unitaires et de charge
```bash
# Tests unitaires Jest (collisions, mouvements, sécurité)
npm run test

# Test de charge simulant 10, 25 et 50 joueurs simultanés
npm run load-test
```

---

## 📁 Structure du Dépôt

```
SnakeX/
├── apps/
│   └── mobile/                # Application Expo React Native (Android / iOS)
│       ├── assets/            # Logo officiel, icônes, splash
│       ├── src/               # Canvas SVG, HUD, Contrôles, Modals, Supabase Client
│       └── app.json           # Configuration orientation "default" & Android package
├── services/
│   └── game-server/           # Serveur Node.js & Socket.IO autoritaire
│       ├── src/               # SpatialHashGrid, SnakeEntity, GameArena, Metrics
│       ├── tests/             # Tests unitaires Jest
│       └── load-test/         # Benchmark de charge 10, 25, 50 bots
├── packages/
│   └── shared/                # Types TypeScript, constantes et protocole partagés
├── supabase/
│   └── migrations/            # Schéma PostgreSQL versionné avec politiques RLS
├── scripts/
│   ├── deploy-vps.ps1         # Déploiement automatisé sur le VPS OVH
│   └── snakex-nginx.conf      # Configuration reverse proxy Nginx WebSocket
├── docs/                      # Documentation technique approfondie
│   ├── ARCHITECTURE.md        # Architecture détaillée et diagrammes
│   ├── LOCAL_DEVELOPMENT.md   # Guide de développement local
│   ├── SUPABASE.md            # Guide de migration et sécurité Supabase
│   ├── DEPLOYMENT_OVH.md      # Procédure de déploiement et seuils d'alerte
│   ├── ANDROID_BUILD.md       # Compilation et distribution de l'APK Android
│   └── TROUBLESHOOTING.md     # Résolution des incidents fréquents
├── PROGRESS.md                # Journal de bord et suivi d'avancement
└── TEST_REPORT.md             # Rapport des tests unitaires et benchmarks réels
```

---

## 🛠️ Documentation Détaillée

- 🏛️ [Architecture Technique](file:///c:/Users/Gabin/Desktop/SnakeX/docs/ARCHITECTURE.md)
- 💻 [Développement Local](file:///c:/Users/Gabin/Desktop/SnakeX/docs/LOCAL_DEVELOPMENT.md)
- 🗄️ [Intégration & Sécurité Supabase](file:///c:/Users/Gabin/Desktop/SnakeX/docs/SUPABASE.md)
- 🚀 [Déploiement VPS OVH](file:///c:/Users/Gabin/Desktop/SnakeX/docs/DEPLOYMENT_OVH.md)
- 📱 [Compilation APK Android](file:///c:/Users/Gabin/Desktop/SnakeX/docs/ANDROID_BUILD.md)
- 🧪 [Rapport de Tests & Benchmarks](file:///c:/Users/Gabin/Desktop/SnakeX/TEST_REPORT.md)
- 🛠️ [Guide de Dépannage](file:///c:/Users/Gabin/Desktop/SnakeX/docs/TROUBLESHOOTING.md)

---

## 👥 Crédits & Licence
Développé pour SnakeX & Studio IziGab.  
Tous droits réservés.
