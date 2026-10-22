/**
 * Test d'intégration réel : direction, mort, réapparition, puis re-direction.
 * Usage : TEST_SERVER_URL=http://152.228.137.4 npx tsx services/game-server/load-test/steerTest.ts
 */
import { io } from 'socket.io-client';
import { ClientEvent, ServerEvent } from '@snakex/shared';

const URL = process.env.TEST_SERVER_URL || 'http://localhost:3001';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const socket = io(URL, { transports: ['websocket'], forceNew: true });
  let myId: string | null = null;
  let lastAngle: number | null = null;
  let aliveInTick = false;
  let died = false;
  let initCount = 0;

  socket.on(ServerEvent.INIT, (d: any) => {
    myId = d.playerId;
    initCount++;
  });
  socket.on(ServerEvent.DIED, () => {
    died = true;
  });
  socket.on(ServerEvent.TICK, (t: any) => {
    const me = t.players.find((p: any) => p.id === myId);
    aliveInTick = !!me;
    if (me) lastAngle = me.angle;
  });

  await new Promise<void>((res) => socket.on('connect', () => res()));
  socket.emit(ClientEvent.JOIN, { name: 'SteerTest' });
  await sleep(800);

  const steerTo = async (target: number, label: string) => {
    for (let i = 0; i < 40; i++) {
      socket.emit(ClientEvent.INPUT, { angle: target, boost: false, seq: i + 1 });
      await sleep(25);
    }
    await sleep(300);
    const ok = lastAngle !== null && Math.abs(lastAngle - target) < 0.15;
    console.log(`${label}: angle=${lastAngle?.toFixed(3)} cible=${target} => ${ok ? 'OK' : 'ECHEC'}`);
  };

  await steerTo(1.5, '1) Direction initiale');

  // Foncer en ligne droite en boost jusqu'au bord de l'arène pour mourir
  console.log('2) Je fonce vers le bord de l\'arène pour mourir...');
  const t0 = Date.now();
  while (!died && Date.now() - t0 < 40000) {
    socket.emit(ClientEvent.INPUT, { angle: 1.5, boost: true, seq: 999 });
    await sleep(50);
  }
  console.log(`   mort reçue (server:died): ${died} après ${((Date.now() - t0) / 1000).toFixed(1)} s`);

  const before = initCount;
  socket.emit(ClientEvent.RESPAWN);
  await sleep(1000);
  console.log(`3) Respawn: INIT reçu=${initCount > before}, serpent vivant dans les ticks=${aliveInTick}`);

  await steerTo(-1.0, '4) Direction après respawn');

  socket.disconnect();
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
