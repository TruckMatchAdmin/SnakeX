/**
 * Client Supabase pour SnakeX (Authentification & Lecture Publique des Classements)
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase pour l'application mobile
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://azxwqcdnwkolodxwsqoq.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6eHdxY2Rud2tvbG9keHdzcW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODYwMTQsImV4cCI6MjEwNjk2MjAxNH0.kTD3kbIXPHUtADkuWPzKCYHSCNc3Wh33TtLVwMjbbC8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  best_score: number;
  total_kills: number;
  total_matches: number;
}

export async function fetchGlobalLeaderboard(limit: number = 20) {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('id, user_id, player_name, best_score, best_length, total_kills, total_matches')
      .order('best_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[Supabase] Erreur fetchGlobalLeaderboard:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('[Supabase] Exception fetchGlobalLeaderboard:', err);
    return [];
  }
}
