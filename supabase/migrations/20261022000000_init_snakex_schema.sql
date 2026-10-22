-- ==============================================================================
-- SnakeX — Migration SQL Initiale (Supabase PostgreSQL)
-- ==============================================================================

-- 1. Table des Profils Joueurs (liée à auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  selected_skin TEXT DEFAULT 'neon_viper',
  total_matches INT DEFAULT 0,
  best_score INT DEFAULT 0,
  total_kills INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour recherche rapide de pseudonyme
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 2. Table des Sessions de Jeu & Historique de Matchs
CREATE TABLE IF NOT EXISTS public.match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  length INT NOT NULL DEFAULT 0,
  kills INT NOT NULL DEFAULT 0,
  orbs_eaten INT NOT NULL DEFAULT 0,
  duration_seconds INT NOT NULL DEFAULT 0,
  killer_name TEXT,
  server_id TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour requêtes sur les meilleurs scores
CREATE INDEX IF NOT EXISTS idx_match_history_score ON public.match_history(score DESC);
CREATE INDEX IF NOT EXISTS idx_match_history_user ON public.match_history(user_id);

-- 3. Table du Classement Général (Leaderboard Global)
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  best_score INT DEFAULT 0,
  best_length INT DEFAULT 0,
  total_kills INT DEFAULT 0,
  total_matches INT DEFAULT 0,
  rank INT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_best_score ON public.leaderboard(best_score DESC);

-- ==============================================================================
-- 4. Sécurité & Politiques RLS (Row Level Security)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Profiles : Tout le monde (anon + auth) peut lire les profils publics
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

-- Profiles : Seul l'utilisateur propriétaire peut modifier son profil
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Leaderboard : Lecture ouverte à tous
CREATE POLICY "Leaderboard viewable by everyone" 
  ON public.leaderboard FOR SELECT 
  USING (true);

-- Match History : Les utilisateurs peuvent voir leur propre historique
CREATE POLICY "Users can read own match history" 
  ON public.match_history FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

-- CRITIQUE : Seul le serveur autoritaire (via service_role_key) peut insérer des scores officiels
-- Les requêtes avec le rôle 'service_role' outrepassent automatiquement la RLS dans Supabase.
-- Aucun INSERT direct n'est autorisé pour les utilisateurs anonymes ou authentifiés sur match_history et leaderboard.

-- ==============================================================================
-- 5. Trigger d'auto-création de profil lors de l'inscription Supabase Auth
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'Snake_' || SUBSTRING(new.id::text, 1, 6)),
    new.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.leaderboard (user_id, player_name, best_score, best_length, total_kills, total_matches)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'Snake_' || SUBSTRING(new.id::text, 1, 6)),
    0, 0, 0, 0
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
