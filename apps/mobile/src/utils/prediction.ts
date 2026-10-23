/**
 * Prédiction locale du serpent du joueur (client-side prediction + réconciliation douce)
 *
 * Le serpent local est simulé avec les MÊMES règles que le serveur (rotation limitée,
 * vitesse, chaîne de segments) et réagit immédiatement aux entrées tactiles, sans attendre
 * l'aller-retour réseau. Sa position est ensuite recalée en douceur vers l'état serveur
 * extrapolé, ce qui évite toute correction brutale visible.
 */

import { BASE_SPEED, BOOST_SPEED, SEGMENT_DISTANCE, TURN_SPEED, TickPayload } from '@snakex/shared';

type Player = TickPayload['players'][0];

export interface LocalInput {
  /** Angle visé (null tant que le joueur n'a pas touché l'écran) */
  angle: number | null;
  boost: boolean;
}

// Au-delà de cette erreur (px monde) on se recale instantanément (respawn, lag spike)
const SNAP_DISTANCE = 220;
// Gain de correction par frame à 60 Hz (0 = aucune correction, 1 = collé au serveur)
const CORRECTION_GAIN = 0.12;
const MAX_DT = 0.1;

function normalize(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function rotateTowards(current: number, target: number, maxStep: number): number {
  const d = normalize(target - current);
  if (Math.abs(d) <= maxStep) return target;
  return normalize(current + Math.sign(d) * maxStep);
}

export class LocalPredictor {
  private body: Array<{ x: number; y: number }> = [];
  private angle = 0;
  private lastTime = 0;
  private playerId: string | null = null;

  reset(): void {
    this.body = [];
    this.playerId = null;
    this.lastTime = 0;
  }

  /**
   * @param server    dernier état serveur reçu pour le joueur local
   * @param ageMs     ancienneté de cet état (ms depuis sa réception)
   * @param rttMs     latence aller-retour estimée (ms)
   */
  update(now: number, input: LocalInput, server: Player, ageMs: number, rttMs: number): Player {
    const sBody = server.body;
    if (sBody.length === 0) return server;

    // (Ré)initialisation : nouveau serpent ou premier appel
    if (this.playerId !== server.id || this.body.length === 0) {
      this.playerId = server.id;
      this.body = sBody.map((b) => ({ x: b.x, y: b.y }));
      this.angle = server.angle;
      this.lastTime = now;
    }

    const dt = Math.min(MAX_DT, Math.max(0, (now - this.lastTime) / 1000));
    this.lastTime = now;

    // 1. Rotation vers l'angle visé
    const target = input.angle ?? server.angle;
    this.angle = rotateTowards(this.angle, target, TURN_SPEED * dt);

    // 2. Déplacement de la tête
    const boosting = input.boost && this.body.length > 5;
    const speed = boosting ? BOOST_SPEED : BASE_SPEED;
    const head = this.body[0];
    head.x += Math.cos(this.angle) * speed * dt;
    head.y += Math.sin(this.angle) * speed * dt;

    // 3. Réconciliation : état serveur extrapolé jusqu'à "maintenant" (+ demi aller-retour)
    const lead = (ageMs + rttMs / 2) / 1000;
    const sh = sBody[0];
    const sSpeed = server.speed || BASE_SPEED;
    const targetX = sh.x + Math.cos(server.angle) * sSpeed * lead;
    const targetY = sh.y + Math.sin(server.angle) * sSpeed * lead;
    const ex = targetX - head.x;
    const ey = targetY - head.y;
    const err = Math.hypot(ex, ey);
    if (err > SNAP_DISTANCE) {
      head.x = targetX;
      head.y = targetY;
      this.angle = server.angle;
    } else {
      const g = Math.min(1, CORRECTION_GAIN * (dt / (1 / 60)));
      head.x += ex * g;
      head.y += ey * g;
    }

    // 4. Chaîne de segments (même règle que le serveur) avec longueur alignée sur le serveur
    const len = sBody.length;
    while (this.body.length < len) {
      const t = this.body[this.body.length - 1];
      this.body.push({ x: t.x, y: t.y });
    }
    if (this.body.length > len) this.body.length = len;

    for (let i = 1; i < this.body.length; i++) {
      const leader = this.body[i - 1];
      const f = this.body[i];
      const dx = f.x - leader.x;
      const dy = f.y - leader.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.0001) {
        const r = SEGMENT_DISTANCE / dist;
        f.x = leader.x + dx * r;
        f.y = leader.y + dy * r;
      }
    }

    return {
      ...server,
      body: this.body.map((b) => ({ x: b.x, y: b.y })),
      angle: this.angle,
      isBoosting: boosting,
    };
  }
}
