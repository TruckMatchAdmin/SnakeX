# 💻 Guide de Développement Local — SnakeX

Ce guide détaille les étapes pour installer, lancer et tester SnakeX localement sur Windows, macOS ou Linux.

---

## 1. Prérequis Système

- **Node.js :** v20.x ou v24.x LTS
- **npm :** v10+ ou v11+
- **Git :** v2.40+
- **Application Expo Go :** Téléchargeable gratuitement sur le Google Play Store pour tester instantanément sur smartphone Android.

---

## 2. Installation Rapide

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/TruckMatchAdmin/SnakeX.git
   cd SnakeX
   ```

2. Installer l'ensemble des dépendances du monorepo :
   ```bash
   npm install
   ```

3. Configurer l'environnement local :
   ```bash
   cp .env.example .env.local
   ```
   Renseignez votre IP locale dans `EXPO_PUBLIC_SERVER_URL` (ex: `http://192.168.1.50:3001`) si vous testez avec un téléphone réel sur le même réseau Wi-Fi.

4. Compiler les définitions partagées :
   ```bash
   npm run build:shared
   ```

---

## 3. Lancer le Serveur de Jeu

```bash
npm run dev:server
```
Le serveur démarre avec rechargement à chaud (Hot Reloading via `tsx`) :
- Endpoint de santé : `http://localhost:3001/health`
- Métriques temps réel : `http://localhost:3001/metrics`
- Classement en direct : `http://localhost:3001/api/leaderboard`

---

## 4. Lancer l'Application Mobile

Dans un second terminal :
```bash
cd apps/mobile
npm run start
```
- Appuyez sur **`a`** pour ouvrir un émulateur Android (si configuré).
- Ou scannez simplement le **QR Code** affiché dans le terminal avec l'application **Expo Go** sur votre smartphone Android.

---

## 5. Exécuter les Tests & Benchmarks

- **Tests unitaires (Moteur physique, collisions, sécurité) :**
  ```bash
  npm run test
  ```

- **Test de charge (10, 25 et 50 bots simulés) :**
  ```bash
  npm run load-test
  ```
