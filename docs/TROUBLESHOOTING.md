# 🛠️ Dépannage & Résolution des Problèmes — SnakeX

Ce guide recense les diagnostics et solutions pour les pannes courantes.

---

## 1. Problèmes de Connexion au Serveur (Socket.IO / WebSocket)

### Symptôme : Le badge affiche *"Connexion au VPS en cours..."* ou reste rouge.
- **Cause 1 : Port 3001 bloqué ou non démarré.**
  - Vérification sur le VPS :
    ```bash
    pm2 status
    curl http://localhost:3001/health
    ```
  - Si le processus est arrêté : `pm2 restart snakex-server`
- **Cause 2 : Nginx ne relaie pas les WebSockets.**
  - Vérifiez la présence des en-têtes dans la configuration Nginx :
    ```nginx
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    ```
- **Cause 3 : Adresse IP du serveur incorrecte dans l'application mobile.**
  - Vérifiez la variable `EXPO_PUBLIC_SERVER_URL` dans `.env.local` ou dans `useGameSocket.ts`.

---

## 2. Erreurs Supabase

### Symptôme : Erreur 404 sur les tables `profiles` ou `leaderboard`.
- **Cause :** Les tables n'ont pas encore été créées dans la base de données.
- **Solution :** Ouvrez le [Tableau de bord Supabase SQL Editor](https://supabase.com/dashboard/project/azxwqcdnwkolodxwsqoq/sql), collez et exécutez le script [`supabase/migrations/20261022000000_init_snakex_schema.sql`](file:///c:/Users/Gabin/Desktop/SnakeX/supabase/migrations/20261022000000_init_snakex_schema.sql).

### Symptôme : Erreur RLS *"new row violates row-level security policy"*.
- **Cause :** Tentative d'insertion directe depuis le client mobile avec la clé anonyme sur une table protégée.
- **Solution :** Seul le serveur Node.js via `SUPABASE_SERVICE_ROLE_KEY` est autorisé à insérer les statistiques de match et à modifier les scores du classement général.

---

## 3. Rotation d'Écran sur Android

### Symptôme : L'écran ne pivote pas en paysage.
- **Vérification :** Assurez-vous que l'option *"Rotation automatique"* est activée dans les paramètres rapides d'Android.
- **Configuration :** SnakeX utilise `orientation: "default"` dans `app.json` et le hook `useOrientation()` qui recalcule le canvas en temps réel sans déconnecter le joueur.

---

## 4. Diagnostics et Journaux sur le VPS

```bash
# Voir les logs en direct du serveur de jeu
pm2 logs snakex-server --lines 100

# Vérifier l'utilisation CPU et RAM en direct
pm2 monit

# Consulter l'état de santé HTTP
curl -s http://localhost:3001/metrics | jq .
```
