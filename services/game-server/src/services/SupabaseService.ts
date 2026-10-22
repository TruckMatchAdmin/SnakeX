/**
 * Service d'interaction avec Supabase côté serveur (avec clé service_role sécurisée)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MatchStats } from '@snakex/shared';

export class SupabaseService {
  private client: SupabaseClient | null = null;
  private isConfigured: boolean = false;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      try {
        this.client = createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        this.isConfigured = true;
        console.log('[SupabaseService] Initialisé avec succès (Service Role).');
      } catch (err) {
        console.warn('[SupabaseService] Erreur lors de l\'initialisation Supabase:', err);
      }
    } else {
      console.warn('[SupabaseService] Variables Supabase manquantes (SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY). Les statistiques ne seront pas persistées.');
    }
  }

  /**
   * Vérifie un jeton d'authentification Supabase JWT envoyé par un client
   */
  public async verifyUserToken(token: string): Promise<{ id: string; email?: string; username?: string } | null> {
    if (!this.client || !token) return null;

    try {
      const { data, error } = await this.client.auth.getUser(token);
      if (error || !data.user) {
        return null;
      }

      const user = data.user;
      return {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username,
      };
    } catch (err) {
      console.warn('[SupabaseService] Échec vérification JWT:', err);
      return null;
    }
  }

  /**
   * Enregistre le score et les statistiques d'un match officiel
   */
  public async recordMatchStats(
    userId: string | undefined,
    playerName: string,
    stats: MatchStats,
    serverId: string = 'vps-ovh-1'
  ): Promise<void> {
    if (!this.client) return;

    try {
      // 1. Insertion dans l'historique de matchs
      const { error: matchError } = await this.client.from('match_history').insert({
        user_id: userId || null,
        player_name: playerName,
        score: stats.score,
        length: stats.length,
        kills: stats.kills,
        orbs_eaten: stats.orbsEaten,
        duration_seconds: stats.durationSeconds,
        killer_name: stats.killerName || null,
        server_id: serverId,
      });

      if (matchError) {
        console.warn('[SupabaseService] Erreur lors de l\'enregistrement match_history:', matchError.message);
      }

      // 2. Mise à jour du classement si utilisateur connecté
      if (userId) {
        // Récupérer le score existant
        const { data: currentEntry } = await this.client
          .from('leaderboard')
          .select('best_score, best_length, total_kills, total_matches')
          .eq('user_id', userId)
          .single();

        const currentBest = currentEntry?.best_score || 0;
        const currentBestLength = currentEntry?.best_length || 0;
        const totalKills = (currentEntry?.total_kills || 0) + stats.kills;
        const totalMatches = (currentEntry?.total_matches || 0) + 1;

        const { error: lbError } = await this.client.from('leaderboard').upsert(
          {
            user_id: userId,
            player_name: playerName,
            best_score: Math.max(currentBest, stats.score),
            best_length: Math.max(currentBestLength, stats.length),
            total_kills: totalKills,
            total_matches: totalMatches,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        if (lbError) {
          console.warn('[SupabaseService] Erreur lors de la mise à jour leaderboard:', lbError.message);
        }
      }
    } catch (err) {
      console.warn('[SupabaseService] Erreur inattendue recordMatchStats:', err);
    }
  }
}
