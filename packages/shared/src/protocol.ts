/**
 * Protocole réseau Socket.IO pour SnakeX
 */

import { ArenaConfig, LeaderboardEntry, MatchStats, Orb, SnakePlayer } from './types';

// Événements émis par le Client vers le Serveur
export enum ClientEvent {
  JOIN = 'client:join',
  INPUT = 'client:input',
  PING = 'client:ping',
  RESPAWN = 'client:respawn',
}

// Événements émis par le Serveur vers le Client
export enum ServerEvent {
  INIT = 'server:init',
  TICK = 'server:tick',
  DIED = 'server:died',
  PONG = 'server:pong',
  LEADERBOARD = 'server:leaderboard',
  NOTIFICATION = 'server:notification',
  ERROR = 'server:error',
}

// Payloads Client -> Server
export interface JoinPayload {
  name: string;
  authToken?: string; // Jeton Supabase JWT
  skinId?: string;
  clientVersion?: string;
}

export interface InputPayload {
  angle: number; // Angle désiré [-PI, PI]
  boost: boolean;
  seq: number; // Numéro de séquence pour rapprochement/prédiction client
}

export interface PingPayload {
  clientTime: number;
}

// Payloads Server -> Client
export interface InitPayload {
  playerId: string;
  arena: ArenaConfig;
  tickRate: number;
  player: SnakePlayer;
  leaderboard: LeaderboardEntry[];
}

export interface TickPayload {
  tick: number;
  serverTime: number;
  players: Array<{
    id: string;
    body: Array<{ x: number; y: number }>;
    angle: number;
    speed: number;
    isBoosting: boolean;
    score: number;
    radius: number;
    isAlive: boolean;
  }>;
  removedPlayerIds: string[];
  orbsAdded: Orb[];
  orbsRemoved: string[];
}

export interface DiedPayload {
  killerId?: string;
  killerName?: string;
  stats: MatchStats;
}

export interface PongPayload {
  clientTime: number;
  serverTime: number;
}

export interface NotificationPayload {
  type: 'kill' | 'join' | 'leave' | 'info';
  message: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
}
