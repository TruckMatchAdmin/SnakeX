/**
 * Hook de connexion multijoueur Socket.IO et synchronisation temps réel
 */

import { useState, useEffect, useRef, useCallback } from 'react';
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

// URL par défaut du serveur de jeu OVH VPS
const DEFAULT_SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://152.228.137.4:3001';

export interface UseGameSocketReturn {
  isConnected: boolean;
  myPlayerId: string | null;
  arenaConfig: ArenaConfig | null;
  players: TickPayload['players'];
  orbs: Orb[];
  leaderboard: LeaderboardEntry[];
  deathStats: DiedPayload | null;
  latencyMs: number;
  serverNotification: string | null;
  joinGame: (name: string, authToken?: string) => void;
  sendInput: (angle: number, boost: boolean) => void;
  respawn: () => void;
  reconnect: () => void;
}

export function useGameSocket(serverUrl: string = DEFAULT_SERVER_URL): UseGameSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [arenaConfig, setArenaConfig] = useState<ArenaConfig | null>(null);
  const [players, setPlayers] = useState<TickPayload['players']>([]);
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [deathStats, setDeathStats] = useState<DiedPayload | null>(null);
  const [latencyMs, setLatencyMs] = useState(0);
  const [serverNotification, setServerNotification] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const orbsMapRef = useRef<Map<string, Orb>>(new Map());
  const inputSeqRef = useRef(0);

  // Initialisation du socket
  useEffect(() => {
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
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
      setDeathStats(null);
    });

    socket.on(ServerEvent.TICK, (tick: TickPayload) => {
      // 1. Mise à jour des joueurs
      setPlayers(tick.players);

      // 2. Mise à jour incrémentale des orbes
      const orbsMap = orbsMapRef.current;
      for (const added of tick.orbsAdded) {
        orbsMap.set(added.id, added);
      }
      for (const removedId of tick.orbsRemoved) {
        orbsMap.delete(removedId);
      }
      setOrbs(Array.from(orbsMap.values()));
    });

    socket.on(ServerEvent.LEADERBOARD, (lb: LeaderboardEntry[]) => {
      setLeaderboard(lb);
    });

    socket.on(ServerEvent.DIED, (payload: DiedPayload) => {
      setDeathStats(payload);
    });

    socket.on(ServerEvent.PONG, (pong: { clientTime: number }) => {
      if (pong && pong.clientTime) {
        setLatencyMs(Date.now() - pong.clientTime);
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
      orbsMapRef.current.clear();
      setOrbs([]);
      socketRef.current.emit(ClientEvent.JOIN, { name, authToken });
    }
  }, []);

  const sendInput = useCallback((angle: number, boost: boolean) => {
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

  const reconnect = useCallback(() => {
    socketRef.current?.connect();
  }, []);

  return {
    isConnected,
    myPlayerId,
    arenaConfig,
    players,
    orbs,
    leaderboard,
    deathStats,
    latencyMs,
    serverNotification,
    joinGame,
    sendInput,
    respawn,
    reconnect,
  };
}
