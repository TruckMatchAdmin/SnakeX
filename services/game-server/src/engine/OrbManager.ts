/**
 * Gestionnaire des orbes d'énergie pour SnakeX
 */

import {
  ARENA_RADIUS,
  MAX_ORBS_COUNT,
  MIN_ORBS_COUNT,
  ORB_BASE_RADIUS,
  ORB_RESPAWN_RATE_PER_TICK,
  Orb,
  THEME_COLORS,
} from '@snakex/shared';

const ORB_PALETTE = [
  THEME_COLORS.PRIMARY_NEON,
  THEME_COLORS.SECONDARY_CYAN,
  THEME_COLORS.ACCENT_PINK,
  THEME_COLORS.ACCENT_GOLD,
  THEME_COLORS.ACCENT_PURPLE,
  THEME_COLORS.ACCENT_ORANGE,
];

export class OrbManager {
  private orbs: Map<string, Orb> = new Map();
  private addedOrbs: Orb[] = [];
  private removedOrbIds: string[] = [];
  private orbCounter: number = 0;

  constructor(initialCount: number = MIN_ORBS_COUNT) {
    this.populate(initialCount);
  }

  private generateRandomOrb(value: number = 1, fixedX?: number, fixedY?: number, fixedColor?: string): Orb {
    this.orbCounter++;
    const id = `orb_${this.orbCounter}_${Date.now() % 100000}`;

    let x = fixedX;
    let y = fixedY;

    if (x === undefined || y === undefined) {
      // Distribution uniforme dans l'arène circulaire
      const angle = Math.random() * 2 * Math.PI;
      const dist = Math.sqrt(Math.random()) * (ARENA_RADIUS - 60);
      x = Math.cos(angle) * dist;
      y = Math.sin(angle) * dist;
    }

    const color = fixedColor || ORB_PALETTE[Math.floor(Math.random() * ORB_PALETTE.length)];
    const radius = Math.min(18, ORB_BASE_RADIUS + Math.floor(Math.sqrt(value) * 1.5));

    return {
      id,
      x,
      y,
      value,
      radius,
      color,
    };
  }

  public populate(count: number): void {
    for (let i = 0; i < count; i++) {
      const orb = this.generateRandomOrb(Math.random() < 0.15 ? 3 : 1);
      this.orbs.set(orb.id, orb);
      this.addedOrbs.push(orb);
    }
  }

  public spawnDropOrb(x: number, y: number, value: number, color?: string): Orb {
    const orb = this.generateRandomOrb(value, x, y, color);
    this.orbs.set(orb.id, orb);
    this.addedOrbs.push(orb);
    return orb;
  }

  public removeOrb(id: string): Orb | undefined {
    const orb = this.orbs.get(id);
    if (orb) {
      this.orbs.delete(id);
      this.removedOrbIds.push(id);
    }
    return orb;
  }

  public update(): void {
    // Respawn progressif d'orbes si en-dessous du seuil minimum
    if (this.orbs.size < MIN_ORBS_COUNT) {
      const toSpawn = Math.min(ORB_RESPAWN_RATE_PER_TICK, MIN_ORBS_COUNT - this.orbs.size);
      for (let i = 0; i < toSpawn; i++) {
        const orb = this.generateRandomOrb(Math.random() < 0.1 ? 3 : 1);
        this.orbs.set(orb.id, orb);
        this.addedOrbs.push(orb);
      }
    }
  }

  public getDeltaAndFlush(): { added: Orb[]; removed: string[] } {
    const delta = {
      added: [...this.addedOrbs],
      removed: [...this.removedOrbIds],
    };
    this.addedOrbs = [];
    this.removedOrbIds = [];
    return delta;
  }

  public getAllOrbs(): Orb[] {
    return Array.from(this.orbs.values());
  }

  public get count(): number {
    return this.orbs.size;
  }
}
