# 🗄️ Intégration Supabase — SnakeX

> **Projet Supabase :** `azxwqcdnwkolodxwsqoq`  
> **Tableau de Bord :** [https://supabase.com/dashboard/project/azxwqcdnwkolodxwsqoq](https://supabase.com/dashboard/project/azxwqcdnwkolodxwsqoq)  
> **API URL :** `https://azxwqcdnwkolodxwsqoq.supabase.co`  

---

## 1. Rôle de Supabase dans SnakeX

Supabase est utilisé pour :
1. **L'authentification des joueurs :** Gestion des comptes (Email / Mot de passe, sessions JWT persistantes).
2. **Les profils joueurs :** Pseudonymes uniques, skins équipés, historiques.
3. **L'historique des parties (`match_history`) :** Stockage certifié par le serveur de chaque partie achevée.
4. **Le classement général (`leaderboard`) :** Meilleurs scores, ratio d'éliminations, nombre de parties.

---

## 2. Déploiement du Schéma SQL

La migration officielle se trouve dans :  
[`supabase/migrations/20261022000000_init_snakex_schema.sql`](file:///c:/Users/Gabin/Desktop/SnakeX/supabase/migrations/20261022000000_init_snakex_schema.sql)

### Procédure d'application en 1 minute :
1. Rendez-vous dans le [Tableau de bord Supabase SQL Editor](https://supabase.com/dashboard/project/azxwqcdnwkolodxwsqoq/sql).
2. Créez une nouvelle requête (*New Query*).
3. Copiez l'intégralité du contenu de `supabase/migrations/20261022000000_init_snakex_schema.sql`.
4. Cliquez sur **Run**.
5. Les tables `profiles`, `match_history`, `leaderboard` et les politiques RLS sont immédiatement créées et actives.

---

## 3. Sécurité & Row Level Security (RLS)

- **Politique de lecture (`SELECT`) :** Ouverte à tous les utilisateurs (anonymes et authentifiés) pour afficher les profils et le classement mondial dans l'application mobile.
- **Politique d'écriture (`INSERT` / `UPDATE`) :**
  - Les utilisateurs ne peuvent modifier que leur propre profil (`auth.uid() = id`).
  - **CRITIQUE :** Aucun client ne peut insérer directement dans `match_history` ou modifier ses points dans `leaderboard`. Seul le serveur autoritaire SnakeX via la clé secrète `service_role` possède ce droit.
  - La clé `service_role` ne doit **JAMAIS** être présente dans l'application mobile ou sur un dépôt public.
