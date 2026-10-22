# 🧪 Rapport de Tests & Benchmarks de Charge — SnakeX

> **Projet :** SnakeX (Serveur de Jeu Multijoueur & Application Mobile)  
> **Date d'exécution :** 2026-10-22  
> **Environnement de test :** Node.js v24.16.0 / Jest 29.7.0 / Tsx 4.7.2  
> **Cible de dimensionnement VPS :** OVH VPS-1 (2 vCores, 4 Go RAM, 40 Go SSD)  

---

## 1. Résultats des Tests Unitaires (Jest)

Tous les tests unitaires ont été exécutés avec succès.

```text
PASS tests/ratelimiter.test.ts
  ClientRateLimiter & Input Sanitization
    √ should sanitize dangerous or invalid characters in player names (9 ms)
    √ should validate angles properly (1 ms)
    √ should block excessive packets within a 1-second window (2 ms)

PASS tests/arena.test.ts
  GameArena Simulation & Rules
    √ should add and remove players properly (35 ms)
    √ should generate active ticks and leaderboard (10 ms)
    √ should kill snake if it leaves arena bounds (6 ms)
    √ should trigger death and orb drop when head hits another snake body (7 ms)

PASS tests/snake.test.ts
  SnakeEntity Physics & Logic
    √ should initialize with correct default properties (1 ms)
    √ should move forward when updated (1 ms)
    √ should increase speed when boosting (1 ms)
    √ should grow when eating orbs (1 ms)

Test Suites: 3 passed, 3 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        4.493 s
```

---

## 2. Résultats Mesurés du Test de Charge Réel (10, 25 et 50 Joueurs)

Le test de charge simule des clients réels connectés via WebSocket, émettant des commandes de pilotage angulaire (20 paquets/sec), demandant des pings périodiques, avec 25% des joueurs en boost actif.

| Métrique Mesurée | Palier 1 : 10 Joueurs | Palier 2 : 25 Joueurs | Palier 3 : 50 Joueurs | Budget / Seuil Max |
|---|---|---|---|---|
| **Durée du test** | 8 secondes | 10 secondes | 12 secondes | - |
| **Paquets envoyés (Clients)** | 1 440 | 4 625 | 10 050 | - |
| **Paquets reçus (Ticks)** | 2 024 | 6 892 | 16 115 | - |
| **Latence Médiane (RTT)** | **3.0 ms** | **5.0 ms** | **10.0 ms** | < 50 ms |
| **Latence 95e percentile (p95)** | **25.0 ms** | **14.0 ms** | **30.0 ms** | < 100 ms |
| **Charge CPU Serveur** | **6.2 %** | **13.2 %** | **12.4 %** | < 70 % |
| **Mémoire RAM (RSS)** | **152.0 Mo** | **232.3 Mo** | **236.4 Mo** | < 1 500 Mo |
| **Durée d'un Tick Moteur** | **3.36 ms** | **2.82 ms** | **4.03 ms** | **< 33.33 ms (30 ticks/s)** |
| **Perte de paquets / Crash** | **0 %** | **0 %** | **0 %** | 0 % |

---

## 3. Résultats Mesurés en Conditions Réelles sur le VPS OVH (Internet Public)

Un benchmark grandeur nature a été lancé depuis Windows 11 vers l'adresse IP publique du serveur de jeu (`http://152.228.137.4` via reverse proxy Nginx) :

| Métrique Serveur VPS OVH | Palier 1 : 10 Joueurs | Palier 2 : 25 Joueurs | Palier 3 : 50 Joueurs | Capacité VPS (2 vCores / 4 Go) |
|---|---|---|---|---|
| **Charge CPU Serveur OVH** | **11.1 %** | **18.8 %** | **24.3 %** | 100% max (2 vCores) |
| **Mémoire RAM consommée** | **108.2 Mo** | **107.6 Mo** | **113.4 Mo** | 4 000 Mo disponibles |
| **Durée moyenne d'un Tick** | **1.53 ms** | **2.65 ms** | **2.16 ms** | **< 33.33 ms (Budget respecté à 93%)** |
| **Latence Réseau Internet RTT** | **29.0 ms (Médiane)** | - | - | Très fluide (< 50ms) |

### Analyse de Performance :
- **Budget de Tick :** À 50 joueurs simultanés sur le VPS, le calcul physique d'un tick ne prend que **2.16 ms**, ce qui représente seulement **6.5% du budget disponible (33.33 ms)** à 30 ticks/sec. Le serveur conserve **93.5% de temps libre**.
- **Empreinte Mémoire :** La mémoire sur le VPS se stabilise à **113 Mo**, soit moins de **3% de la RAM disponible (4 Go)** du VPS OVH.
- **Grille Spatiale :** La structure `SpatialHashGrid` permet d'éviter l'explosion quadratique O(N²) des calculs de collision.

---

## 4. Critères d'Alerte et Déclenchement de Mise à Niveau VPS

Sur la configuration initiale OVH (2 vCores, 4 Go RAM) :
1. **Capacité validée :** Le serveur supporte **50 joueurs simultanés sans aucune dégradation** du framerate serveur (30 ticks/sec maintenus avec durée < 3 ms).
2. **Capacité estimée maximale sur 2 vCores :** Environ **120 à 150 joueurs simultanés** par instance Node.js.
3. **Quand passer à 4 vCores et 8 Go de RAM ?**
   - Si le nombre de joueurs simultanés dépasse **80 joueurs par salle** ou si plusieurs salles sont ouvertes simultanément (multi-room PM2 cluster).
   - Si la durée moyenne du tick dépasse **20 ms** de manière continue.
   - Si la charge CPU dépasse **70%** pendant plus de 5 minutes consécutives.
   - Si la mémoire Node.js dépasse **500 Mo** (signe d'accumulation ou de saturation du cache).
