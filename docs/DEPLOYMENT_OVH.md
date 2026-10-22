# 🚀 Déploiement Production sur VPS OVH — SnakeX

> **Hôte VPS :** `152.228.137.4` (`vps-0af3084b.vps.ovh.net`)  
> **Système :** Ubuntu 26.04 LTS (2 vCores, 4 Go RAM, 40 Go SSD)  
> **Répertoire dédié :** `/var/www/snakex`  
> **Port interne :** `3001`  

---

## 1. Respect des Contraintes d'Infrastructure

- **Isolement strict :** Les autres services et sites hébergés sur le VPS (`repaflix.fr`, `truckmatch.fr`, `virallive.fr`) ne doivent pas être altérés.
- **Aucune base locale :** Pas d'instance PostgreSQL lourde déployée sur le VPS ; la persistance repose exclusivement sur Supabase.
- **Utilisateur dédié :** L'application tourne sous l'utilisateur non-root `ubuntu`.

---

## 2. Déploiement Rapide Automatisé

Un script PowerShell dédié est fourni pour déployer en une seule commande depuis Windows :

```powershell
.\scripts\deploy-vps.ps1
```

Ce script :
1. Compile `@snakex/shared` et `@snakex/game-server`.
2. Synchronise les fichiers compilés vers `/var/www/snakex` via SCP.
3. Installe les dépendances de production sur le serveur Ubuntu.
4. Démarre ou recharge le processus PM2 `snakex-server`.
5. Valide la réponse de l'endpoint `/health`.

---

## 3. Configuration Nginx & WebSocket Reverse Proxy

Pour router le trafic public vers le serveur de jeu avec support complet des WebSockets :

Fichier : `/etc/nginx/sites-available/snakex.conf`
```nginx
server {
    listen 80;
    server_name vps-0af3084b.vps.ovh.net; # ou votre sous-domaine snakex

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;

        # En-têtes indispensables pour Socket.IO et WebSocket
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;

        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts adaptés aux connexions multijoueur maintenues
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Activation sécurisée :
```bash
sudo ln -s /etc/nginx/sites-available/snakex.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 4. Gestion PM2 & Redémarrage Automatique

```bash
cd /var/www/snakex
pm2 start dist/index.js --name "snakex-server" --time
pm2 save
pm2 startup
```

---

## 5. Seuils d'Alerte & Critères de Redimensionnement VPS

Le serveur actuel (2 vCores / 4 Go RAM) est dimensionné pour supporter 10 à 50 joueurs simultanés.

| Métrique | Seuil Normal (OK) | Seuil Alerte (Attention) | Critère de Migration (Passage à 4 vCores / 8 Go) |
|---|---|---|---|
| **CPU Global** | < 45% | 70% pendant 5 min | > 85% continu sur les 2 cœurs |
| **Mémoire RSS Node.js** | < 180 Mo | > 350 Mo | > 800 Mo (risque de swap/OOM) |
| **Durée de Tick** | < 8 ms (Cible: 33.3ms) | > 20 ms | > 30 ms (dégradation du framerate serveur) |
| **Latence p95** | < 60 ms | > 120 ms | > 200 ms (goulot d'étranglement réseau/CPU) |
