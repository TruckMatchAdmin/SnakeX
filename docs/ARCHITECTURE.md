# 🏛️ Architecture Technique — SnakeX

> **Slogan :** *Grow. Fight. Dominate.*  
> **Auteur :** SnakeX Development Team  
> **Cible :** Mobile Android (prioritaire) & iOS | Serveur OVH VPS-1 (2 vCores, 4 Go RAM)  

---

## 1. Vue d'Ensemble du Système

SnakeX repose sur une **architecture client-serveur autoritaire temps réel** conçue pour éliminer toute triche, garantir une équité parfaite et délivrer une expérience multijoueur fluide à 60 FPS sur smartphones :

```mermaid
graph TD
    subgraph Client Mobile
        Mobile["Application Expo React Native (Android / iOS)"]
        Touch["Contrôleur Tactile / Joystick Virtuel"]
        Canvas["GameCanvas 2D Réactif (Portrait / Paysage)"]
        SocketC["Client Socket.IO (Interpolation & Pings)"]
        SupaAuth["Supabase Auth (Connexion / Profils)"]
    end

    subgraph VPS OVH (Ubuntu 26.04)
        Nginx["Nginx Reverse Proxy (Port 80/443 + WSS)"]
        PM2["PM2 Process Manager"]
        GameServer["Serveur de Jeu Autoritaire Node.js (Port 3001)"]
        Engine["Moteur Physique & SpatialHash (30 ticks/s)"]
        RateLimiter["Rate Limiter & Validation Stricte"]
        Metrics["Collecteur de Métriques (CPU, RAM, Latence)"]
    end

    subgraph Supabase Cloud
        Postgres["PostgreSQL avec RLS Active"]
        AuthService["GoTrue Auth (Email & JWT)"]
        LeaderboardTable["Table leaderboard (Scores Officiels)"]
    end

    Mobile --> Touch
    Mobile --> Canvas
    SocketC <-->|WebSocket bidirectionnel| Nginx
    Nginx --> GameServer
    GameServer --> Engine
    GameServer --> RateLimiter
    GameServer --> Metrics
    GameServer -->|Service Role Key sécurisée| Postgres
    SupaAuth <-->|JWT / Anon Key| AuthService
```

---

## 2. Structure Monorepo

```
SnakeX/
├── apps/
│   └── mobile/                # Application mobile Expo React Native
│       ├── assets/            # Icônes, splash et logo officiel SnakeX
│       ├── src/
│       │   ├── components/    # GameCanvas, HUD, TouchController, DeathModal, AuthModal
│       │   ├── hooks/         # useOrientation, useGameSocket
│       │   ├── services/      # supabaseClient
│       │   └── theme/         # Palette néon (#00FF66, #00E5FF, #050811)
│       ├── app.json           # Configuration orientation "default" + Android package
│       └── App.tsx            # Point d'entrée mobile réactif
├── services/
│   └── game-server/           # Serveur Node.js & Socket.IO
│       ├── src/
│       │   ├── engine/        # Vector2D, SpatialHashGrid, SnakeEntity, OrbManager, GameArena
│       │   ├── network/       # RateLimiter & Sanitization
│       │   ├── services/      # SupabaseService (persistance vérifiée)
│       │   ├── metrics/       # MetricsCollector (CPU, RAM, P95)
│       │   └── index.ts       # Express & Socket.IO
│       ├── tests/             # Tests unitaires Jest (moteur, collisions, sécurité)
│       └── load-test/         # Benchmark 10, 25, 50 bots
├── packages/
│   └── shared/                # Types, constantes d'équilibrage et protocoles réseau
│       ├── src/
│       │   ├── constants.ts   # Dimensions, vitesses, ticks, couleurs
│       │   ├── types.ts       # SnakePlayer, Orb, Point2D, LeaderboardEntry
│       │   └── protocol.ts    # Événements Client/Serveur Socket.IO
├── supabase/
│   └── migrations/            # Schémas SQL et politiques RLS versionnées
├── scripts/                   # Scripts de déploiement et utilitaires
└── docs/                      # Documentation technique complète
```

---

## 3. Moteur Autoritaire & Optimisations VPS

Sur un VPS avec 2 vCores et 4 Go de RAM, la simulation naïve O(N²) de collisions entre des dizaines de serpents et des milliers d'orbes saturerait le CPU. SnakeX met en œuvre les optimisations suivantes :

1. **Grille de Hachage Spatial (`SpatialHashGrid`) :** Partitionnement de l'espace en cellules de 80px. La détection de collisions s'exécute en temps quasi-constant O(1) par élément.
2. **Fréquence de Simulation Contrôlée (`TICK_RATE = 30`) :** 30 calculs physiques par seconde (intervalle de 33.33ms), idéal pour la réactivité sans gaspiller de cycles CPU.
3. **Mises à Jour Réseau Delta :** Le serveur n'émet pas l'intégralité des milliers d'orbes à chaque tick, mais uniquement les ajouts et suppressions incrémentales (`orbsAdded`, `orbsRemoved`).
4. **Calcul CPU et RTT en continu :** L'endpoint `/metrics` expose en temps réel la charge CPU, la mémoire RSS, la latence médiane et le 95e percentile.

---

## 4. Sécurité & Modèle de Données

- **Aucun calcul de score côté client :** Le client ne fait qu'émettre un angle de direction et l'état du boost.
- **Rate Limiting Stricte :** Maximum de 40 commandes/seconde par socket. Rejet immédiat de tout flux malveillant.
- **Row Level Security (RLS) Supabase :** Seul le serveur autoritaire dispose de la clé `service_role` pour insérer des scores et mettre à jour le classement général. L'application mobile n'embarque que la clé publique anonyme.
