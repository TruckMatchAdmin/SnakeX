/**
 * Script de test de charge et benchmark SnakeX
 * Simule 10, 25 puis 50 joueurs connectés via Socket.IO
 * Mesure en conditions réelles : Latence médiane, p95, CPU, RAM, Ticks/s
 */

import { io, Socket } from 'socket.io-client';
import { ClientEvent, ServerEvent } from '@snakex/shared';

const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3001';

interface TestStageResult {
  clientCount: number;
  durationSeconds: number;
  packetsSent: number;
  packetsReceived: number;
  latencyMedianMs: number;
  latencyP95Ms: number;
  serverMetrics?: any;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runStage(clientCount: number, durationSeconds: number): Promise<TestStageResult> {
  console.log(`\n======================================================`);
  console.log(`🚀 Démarrage du test de charge : ${clientCount} joueurs simulés pendant ${durationSeconds}s`);
  console.log(`======================================================`);

  const sockets: Socket[] = [];
  const latencies: number[] = [];
  let packetsSent = 0;
  let packetsReceived = 0;

  // 1. Connexion progressive des clients
  for (let i = 0; i < clientCount; i++) {
    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      forceNew: true,
    });

    socket.on('connect', () => {
      socket.emit(ClientEvent.JOIN, {
        name: `Bot_${i + 1}`,
      });
    });

    socket.on(ServerEvent.TICK, () => {
      packetsReceived++;
    });

    socket.on(ServerEvent.PONG, (data: any) => {
      if (data && data.clientTime) {
        const rtt = Date.now() - data.clientTime;
        latencies.push(rtt);
      }
    });

    sockets.push(socket);
    // Échelonner les connexions pour éviter un spike artificiel
    await sleep(25);
  }

  // 2. Boucle d'envoi d'inputs et de pings pour chaque bot
  const startTime = Date.now();
  const endTime = startTime + durationSeconds * 1000;

  const botInterval = setInterval(() => {
    const now = Date.now();
    for (let i = 0; i < sockets.length; i++) {
      const socket = sockets[i];
      if (socket.connected) {
        // Mouvement circulaire / sinusoïdal simulé
        const angle = (now / 1000 + i * 0.5) % (Math.PI * 2) - Math.PI;
        socket.emit(ClientEvent.INPUT, {
          angle,
          boost: i % 4 === 0, // 25% des bots activent le boost
          seq: Math.floor(now / 100),
        });
        packetsSent++;

        // Envoi de ping toutes les 500ms
        if (Math.random() < 0.2) {
          socket.emit(ClientEvent.PING, { clientTime: now });
        }
      }
    }
  }, 50); // 20 paquets input/seconde par client

  while (Date.now() < endTime) {
    await sleep(500);
  }

  clearInterval(botInterval);

  // 3. Récupérer les métriques du serveur via HTTP
  let serverMetrics: any = null;
  try {
    const fetch = globalThis.fetch;
    const res = await fetch(`${SERVER_URL}/metrics`);
    if (res.ok) {
      serverMetrics = await res.json();
    }
  } catch (err) {
    console.warn('Impossible de récupérer /metrics:', err);
  }

  // 4. Déconnexion propre de tous les clients
  for (const s of sockets) {
    s.disconnect();
  }

  // Calcul latences
  const sorted = [...latencies].sort((a, b) => a - b);
  const median = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.5)] : 0;
  const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0;

  console.log(`\n📊 RÉSULTATS POUR ${clientCount} JOUEURS :`);
  console.log(`   - Paquets envoyés : ${packetsSent}`);
  console.log(`   - Paquets reçus   : ${packetsReceived}`);
  console.log(`   - Latence Médiane : ${median} ms`);
  console.log(`   - Latence p95     : ${p95} ms`);
  if (serverMetrics) {
    console.log(`   - CPU Serveur     : ${serverMetrics.cpuPercent}%`);
    console.log(`   - RAM Serveur     : ${serverMetrics.memoryUsageMb} Mo`);
    console.log(`   - Durée Tick      : ${serverMetrics.tickDurationMs} ms (Cible < 33.3ms)`);
  }

  return {
    clientCount,
    durationSeconds,
    packetsSent,
    packetsReceived,
    latencyMedianMs: median,
    latencyP95Ms: p95,
    serverMetrics,
  };
}

export async function runFullBenchmark(): Promise<TestStageResult[]> {
  console.log('🏁 Démarrage de la suite complète de tests de charge SnakeX (10, 25, 50 joueurs)...');
  const results: TestStageResult[] = [];

  // 10 Joueurs
  results.push(await runStage(10, 8));
  await sleep(2000);

  // 25 Joueurs
  results.push(await runStage(25, 10));
  await sleep(2000);

  // 50 Joueurs
  results.push(await runStage(50, 12));

  return results;
}

if (require.main === module) {
  runFullBenchmark()
    .then((res) => {
      console.log('\n✅ Tous les paliers de test de charge sont terminés avec succès.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Échec du benchmark :', err);
      process.exit(1);
    });
}
