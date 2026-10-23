/**
 * Hook de connexion multijoueur Socket.IO et synchronisation temps réel
 */

import { useState, useEffect, useRef, useCallback, MutableRefObject } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ArenaConfig,
  ClientEvent,
  DiedPayload,
  InitPayload,
  InputPayload,
  LeaderboardEntry,
  Orb,
  ServerEvent,
  TickPayload,
} from '@snakex/shared';
import type { LocalInput } from '../utils/prediction';

// URL par défaut du serveur de jeu OVH VPS (Reverse proxy Nginx port 80)
const DEFAULT_SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://152.228.137.4';

export type PlayersSnapshot = TickPayload['players'];

export interface TimedSnapshot {
  /** Heure de réception locale (ms) — évite toute dérive d'horloge serveur/client */
  t: number;
  players: PlayersSnapshot;
}

// Nombre max de snapshots conservés pour l'interpolation
const MAX_SNAPSHOTS = 8;
// Fréquence max de mise à jour du state React (HUD, radar) en ms
const UI_UPDATE_INTERVAL_MS = 100;

export interface UseGameSocketReturn {
  isConnected: boolean;
  myPlayerId: string | null;
  arenaConfig: ArenaConfig | null;
  /** Buffer de snapshots lu à 60 FPS par le rendu (sans re-render React) */
  snapshotsRef: MutableRefObject<TimedSnapshot[]>;
  /** Dernière entrée envoyée (angle visé + boost), pour la prédiction locale */
  inputRef: MutableRefObject<LocalInput>;
  /** Latence aller-retour courante (ms), sans re-render */
  latencyRef: MutableRefObject<number>;
  /** Orbes courants (mutés en place, sans re-render React) */
  orbsMapRef: MutableRefObject<Map<string, Orb>>;
  /** Version throttlée (~10 Hz) pour HUD / radar */
  players: TickPayload['players'];
  leaderboard: LeaderboardEntry[];
  deathStats: DiedPayload | null;
  latencyMs: number;
  serverNotification: string | null;
  joinGame: (name: string, authToken?: string) => void;
  sendInput: (angle: number, boost: boolean) => void;
  respawn: () => void;
  resetDeath: () => void;
  reconnect: () => void;
}

export function useGameSocket(serverUrl: string = DEFAULT_SERVER_URL): UseGameSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [arenaConfig, setArenaConfig] = useState<ArenaConfig | null>(null);
  const [players, setPlayers] = useState<TickPayload['players']>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [deathStats, setDeathStats] = useState<DiedPayload | null>(null);
  const [latencyMs, setLatencyMs] = useState(0);
  const [serverNotification, setServerNotification] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const orbsMapRef = useRef<Map<string, Orb>>(new Map());
  const snapshotsRef = useRef<TimedSnapshot[]>([]);
  const lastUiUpdateRef = useRef(0);
  const inputSeqRef = useRef(0);
  const inputRef = useRef<LocalInput>({ angle: null, boost: false });
  const latencyRef = useRef(0);

  // Initialisation du socket
  useEffect(() => {
    const socket = io(serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[SnakeX Socket] Connecté au serveur :', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[SnakeX Socket] Déconnecté :', reason);
      setIsConnected(false);
    });

    socket.on(ServerEvent.INIT, (data: InitPayload) => {
      setMyPlayerId(data.playerId);
      setArenaConfig(data.arena);
      setLeaderboard(data.leaderboard);
      if (data.orbs && data.orbs.length > 0) {
        orbsMapRef.current.clear();
        for (const orb of data.orbs) {
          orbsMapRef.current.set(orb.id, orb);
        }
      }
      // Nouveau serpent : on repart d'un buffer propre (évite d'interpoler depuis l'ancienne position)
      snapshotsRef.current = [];
      inputRef.current = { angle: null, boost: false };
      setDeathStats(null);
    });

    socket.on(ServerEvent.TICK, (tick: TickPayload) => {
      const now = Date.now();

      // 1. Buffer de snapshots pour l'interpolation (aucun re-render React)
      const buf = snapshotsRef.current;
      buf.push({ t: now, players: tick.players });
      if (buf.length > MAX_SNAPSHOTS) buf.shift();

      // 2. State React throttlé (HUD / radar / score)
      if (now - lastUiUpdateRef.current >= UI_UPDATE_INTERVAL_MS) {
        lastUiUpdateRef.current = now;
        setPlayers(tick.players);
        if (tick.leaderboard) setLeaderboard(tick.leaderboard);
      }

      // 3. Orbes : mutation en place, lue directement par le rendu
      const orbsMap = orbsMapRef.current;
      if (tick.orbsAdded) {
        for (const added of tick.orbsAdded) orbsMap.set(added.id, added);
      }
      if (tick.orbsRemoved) {
        for (const removedId of tick.orbsRemoved) orbsMap.delete(removedId);
      }
    });

    socket.on(ServerEvent.LEADERBOARD, (lb: LeaderboardEntry[]) => {
      setLeaderboard(lb);
    });

    socket.on(ServerEvent.DIED, (payload: DiedPayload) => {
      setDeathStats(payload);
    });

    socket.on(ServerEvent.PONG, (pong: { clientTime: number }) => {
      if (pong && pong.clientTime) {
        const rtt = Date.now() - pong.clientTime;
        latencyRef.current = rtt;
        setLatencyMs(rtt);
      }
    });

    socket.on(ServerEvent.NOTIFICATION, (notif: { message: string }) => {
      setServerNotification(notif.message);
      setTimeout(() => setServerNotification(null), 3500);
    });

    // Mesure périodique de latence
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit(ClientEvent.PING, { clientTime: Date.now() });
      }
    }, 2000);

    return () => {
      clearInterval(pingInterval);
      socket.disconnect();
    };
  }, [serverUrl]);

  const joinGame = useCallback((name: string, authToken?: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(ClientEvent.JOIN, { name, authToken });
    }
  }, []);

  const sendInput = useCallback((angle: number, boost: boolean) => {
    // L'entrée est mémorisée même hors connexion : la prédiction réagit immédiatement
    inputRef.current = { angle, boost };
    if (socketRef.current?.connected) {
      inputSeqRef.current++;
      const payload: InputPayload = {
        angle,
        boost,
        seq: inputSeqRef.current,
      };
      socketRef.current.emit(ClientEvent.INPUT, payload);
    }
  }, []);

  const respawn = useCallback(() => {
    if (socketRef.current?.connected) {
      setDeathStats(null);
      socketRef.current.emit(ClientEvent.RESPAWN);
    }
  }, []);

  const resetDeath = useCallback(() => {
    setDeathStats(null);
  }, []);

  const reconnect = useCallback(() => {
    socketRef.current?.connect();
  }, []);

  return {
    isConnected,
    myPlayerId,
    arenaConfig,
    snapshotsRef,
    inputRef,
    latencyRef,
    orbsMapRef,
    players,
    leaderboard,
    deathStats,
    latencyMs,
    serverNotification,
    joinGame,
    sendInput,
    respawn,
    resetDeath,
    reconnect,
  };
}
