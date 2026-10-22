/**
 * Définitions de types fondamentales pour SnakeX (Partagées Client & Serveur)
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface SnakeSegment extends Point2D {}

export interface SnakePlayer {
  id: string;
  userId?: string; // ID Supabase si connecté
  name: string;
  color: string;
  secondaryColor: string;
  body: SnakeSegment[];
  angle: number; // Angle actuel en radians (0 = est, PI/2 = sud)
  targetAngle: number; // Angle désiré par le joueur
  speed: number;
  isBoosting: boolean;
  score: number;
  length: number;
  kills: number;
  isAlive: boolean;
  radius: number;
  lastInputSeq: number;
}

export interface Orb extends Point2D {
  id: string;
  value: number; // Valeur nutritionnelle (croissance & score)
  radius: number;
  color: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  kills: number;
  rank: number;
}

export interface ArenaConfig {
  radius: number;
  width: number;
  height: number;
}

export interface ServerMetrics {
  connectedPlayers: number;
  activeSnakes: number;
  orbsCount: number;
  currentTick: number;
  tickDurationMs: number;
  cpuPercent: number;
  memoryUsageMb: number;
  uptimeSeconds: number;
  latencyMedianMs: number;
  latencyP95Ms: number;
  packetsPerSecond: number;
}

export interface MatchStats {
  score: number;
  length: number;
  kills: number;
  orbsEaten: number;
  durationSeconds: number;
  killerName?: string;
}
