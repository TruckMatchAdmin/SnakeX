/**
 * Point d'entrée principal du serveur de jeu multijoueur SnakeX
 */

import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Chargement des variables d'environnement (.env.local ou .env)
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config();

import {
  ClientEvent,
  DiedPayload,
  ErrorPayload,
  InitPayload,
  InputPayload,
  JoinPayload,
  PingPayload,
  PongPayload,
  ServerEvent,
  TickPayload,
  TICK_INTERVAL_MS,
  TICK_RATE,
  THEME_COLORS,
} from '@snakex/shared';

import { GameArena } from './engine/GameArena';
import { ClientRateLimiter } from './network/RateLimiter';
import { SupabaseService } from './services/SupabaseService';
import { MetricsCollector } from './metrics/MetricsCollector';
import { filterPlayersForViewer, LEADERBOARD_EVERY_N_TICKS } from './network/interest';

const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  transports: ['websocket'],
  perMessageDeflate: false,
});

const arena = new GameArena();
const supabase = new SupabaseService();
const metrics = new MetricsCollector();

// Stockage des sessions de sockets
interface SessionData {
  rateLimiter: ClientRateLimiter;
  userId?: string;
  playerName: string;
  lastPingTime: number;
}
const socketSessions = new Map<string, SessionData>();

// Écoute de l'événement de mort d'un serpent
arena.onPlayerDied = async ({ player, killer, stats }) => {
  const socket = io.sockets.sockets.get(player.id);
  if (socket) {
    const payload: DiedPayload = {
      killerId: killer?.id,
      killerName: killer?.name,
      stats,
    };
    socket.emit(ServerEvent.DIED, payload);
  }

  // Enregistrement asynchrone des statistiques officielles dans Supabase
  await supabase.recordMatchStats(player.userId, player.name, stats);
};

// Route HTTP de Santé
app.get('/health', (req, res) => {
  const snapshot = metrics.getSnapshot(
    socketSessions.size,
    arena.snakes.size,
    arena.orbManager.count,
    arena.tickCount
  );
  res.json({
    status: 'ok',
    service: 'SnakeX Multiplayer Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    metrics: snapshot,
  });
});

// Route HTTP des Métriques pour le monitoring VPS
app.get('/metrics', (req, res) => {
  const snapshot = metrics.getSnapshot(
    socketSessions.size,
    arena.snakes.size,
    arena.orbManager.count,
    arena.tickCount
  );
  res.json(snapshot);
});

// Route HTTP Classement
app.get('/api/leaderboard', (req, res) => {
  res.json(arena.getLeaderboard());
});

// Gestion des connexions Socket.IO
io.on('connection', (socket: Socket) => {
  const rateLimiter = new ClientRateLimiter();
  socketSessions.set(socket.id, {
    rateLimiter,
    playerName: 'Player',
    lastPingTime: Date.now(),
  });

  // 1. Inscription / Rejoint la partie
  socket.on(ClientEvent.JOIN, async (rawPayload: unknown) => {
    metrics.recordPacketReceived();
    if (!rateLimiter.allowPacket()) return;

    const payload = (rawPayload || {}) as JoinPayload;
    let finalName = ClientRateLimiter.sanitizePlayerName(payload.name);
    let userId: string | undefined = undefined;

    // Vérification du token Supabase Auth si présent
    if (payload.authToken) {
      const verified = await supabase.verifyUserToken(payload.authToken);
      if (verified) {
        userId = verified.id;
        if (verified.username) finalName = verified.username;
      }
    }

    const session = socketSessions.get(socket.id);
    if (session) {
      session.userId = userId;
      session.playerName = finalName;
    }

    // Retirer tout serpent précédent sur ce même socket s'il existe
    arena.removePlayer(socket.id);

    // Créer le serpent dans l'arène
    const snake = arena.addPlayer(
      socket.id,
      finalName,
      THEME_COLORS.PRIMARY_NEON,
      THEME_COLORS.SECONDARY_CYAN,
      userId
    );

    // Envoyer la configuration initiale, l'état complet et les orbes existants
    const initPayload: InitPayload = {
      playerId: socket.id,
      arena: arena.getArenaConfig(),
      tickRate: TICK_RATE,
      player: snake,
      leaderboard: arena.getLeaderboard(),
      orbs: arena.orbManager.getAllOrbs(),
    };
    socket.emit(ServerEvent.INIT, initPayload);

    // Notification broadcast
    io.emit(ServerEvent.NOTIFICATION, {
      type: 'join',
      message: `${finalName} a rejoint l'arène SnakeX !`,
    });
  });

  // 2. Commandes de déplacement (Input)
  socket.on(ClientEvent.INPUT, (rawPayload: unknown) => {
    metrics.recordPacketReceived();
    if (!rateLimiter.allowPacket()) return;

    const payload = (rawPayload || {}) as InputPayload;
    if (ClientRateLimiter.isValidAngle(payload.angle)) {
      arena.handleInput(socket.id, payload.angle, Boolean(payload.boost), payload.seq || 0);
    }
  });

  // 3. Mesure de latence (Ping / Pong)
  socket.on(ClientEvent.PING, (payload: PingPayload) => {
    metrics.recordPacketReceived();
    const serverTime = Date.now();
    if (payload && typeof payload.clientTime === 'number') {
      const rtt = serverTime - payload.clientTime;
      metrics.recordLatency(rtt);
    }
    const pong: PongPayload = {
      clientTime: payload?.clientTime || serverTime,
      serverTime,
    };
    socket.emit(ServerEvent.PONG, pong);
  });

  // 4. Respawn après une mort
  socket.on(ClientEvent.RESPAWN, () => {
    metrics.recordPacketReceived();
    if (!rateLimiter.allowPacket()) return;

    const session = socketSessions.get(socket.id);
    const name = session?.playerName || 'Player';
    const userId = session?.userId;

    arena.removePlayer(socket.id);
    const snake = arena.addPlayer(socket.id, name, THEME_COLORS.PRIMARY_NEON, THEME_COLORS.SECONDARY_CYAN, userId);

    const initPayload: InitPayload = {
      playerId: socket.id,
      arena: arena.getArenaConfig(),
      tickRate: TICK_RATE,
      player: snake,
      leaderboard: arena.getLeaderboard(),
      orbs: arena.orbManager.getAllOrbs(),
    };
    socket.emit(ServerEvent.INIT, initPayload);
  });

  // 5. Déconnexion
  socket.on('disconnect', () => {
    socketSessions.delete(socket.id);
    const removed = arena.removePlayer(socket.id);
    if (removed) {
      io.emit(ServerEvent.NOTIFICATION, {
        type: 'leave',
        message: `${removed.name} a quitté l'arène.`,
      });
    }
  });
});

// Boucle de simulation autoritaire (30 ticks/seconde)
let lastTickStart = Date.now();
const gameLoopInterval = setInterval(() => {
  const start = Date.now();
  try {
    const tickData = arena.tick();
    const includeLeaderboard = tickData.tick % LEADERBOARD_EVERY_N_TICKS === 0;

    for (const [socketId, socket] of io.sockets.sockets) {
      const me = arena.snakes.get(socketId);
      const head = me && me.isAlive ? me.head : undefined;

      const payload: TickPayload = {
        tick: tickData.tick,
        serverTime: tickData.serverTime,
        // Hors partie ou mort : aucun serpent à afficher (écran de mort / accueil)
        players: head
          ? filterPlayersForViewer(tickData.players, socketId, head.x, head.y)
          : [],
        removedPlayerIds: tickData.removedPlayerIds,
        orbsAdded: tickData.orbsAdded,
        orbsRemoved: tickData.orbsRemoved,
        leaderboard: includeLeaderboard ? tickData.leaderboard : undefined,
      };
      socket.volatile.emit(ServerEvent.TICK, payload);
    }
  } catch (err) {
    console.error('[GameLoop Error]:', err);
  }
  const duration = Date.now() - start;
  metrics.recordTickDuration(duration);
}, TICK_INTERVAL_MS);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🐍 Serveur SnakeX démarré avec succès sur le port ${PORT}`);
  console.log(`📡 Simulation autoritaire : ${TICK_RATE} ticks/sec (${TICK_INTERVAL_MS.toFixed(1)}ms/tick)`);
  console.log(`🏥 Health Check : http://localhost:${PORT}/health`);
  console.log(`📊 Métriques    : http://localhost:${PORT}/metrics`);
  console.log(`====================================================`);
});

export { app, server, arena };
