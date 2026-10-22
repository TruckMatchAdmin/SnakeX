/**
 * Moteur d'arène autoritaire SnakeX
 * Exécute la simulation physique, les règles de jeu, les collisions et l'état réseau
 */

import {
  ARENA_RADIUS,
  ARENA_WIDTH,
  ARENA_HEIGHT,
  ArenaConfig,
  LeaderboardEntry,
  MatchStats,
  Orb,
  SnakePlayer,
  TICK_INTERVAL_MS,
  TICK_RATE,
} from '@snakex/shared';
import { SnakeEntity } from './Snake';
import { OrbManager } from './OrbManager';
import { SpatialHashGrid } from './SpatialHash';
import { Vector2D } from './Vector';

export interface DeathEvent {
  player: SnakeEntity;
  killer?: SnakeEntity;
  stats: MatchStats;
}

export class GameArena {
  public snakes: Map<string, SnakeEntity> = new Map();
  public orbManager: OrbManager;
  public spatialGrid: SpatialHashGrid;
  public tickCount: number = 0;
  public lastTickTime: number = Date.now();
  public onPlayerDied?: (death: DeathEvent) => void;

  private removedPlayerIds: string[] = [];

  constructor() {
    this.orbManager = new OrbManager();
    this.spatialGrid = new SpatialHashGrid(80);
  }

  public getArenaConfig(): ArenaConfig {
    return {
      radius: ARENA_RADIUS,
      width: ARENA_WIDTH,
      height: ARENA_HEIGHT,
    };
  }

  public addPlayer(
    id: string,
    name: string,
    skinColor: string = '#00FF66',
    secondaryColor: string = '#00E5FF',
    userId?: string
  ): SnakeEntity {
    // Position de spawn sécurisée (angle aléatoire dans un rayon modéré du centre)
    const spawnAngle = Math.random() * 2 * Math.PI;
    const spawnDist = Math.random() * (ARENA_RADIUS * 0.65);
    const startX = Math.cos(spawnAngle) * spawnDist;
    const startY = Math.sin(spawnAngle) * spawnDist;

    const snake = new SnakeEntity(id, name, startX, startY, skinColor, secondaryColor, userId);
    this.snakes.set(id, snake);
    return snake;
  }

  public removePlayer(id: string): SnakeEntity | undefined {
    const snake = this.snakes.get(id);
    if (snake) {
      this.snakes.delete(id);
      this.removedPlayerIds.push(id);
    }
    return snake;
  }

  public handleInput(id: string, angle: number, boost: boolean, seq: number): void {
    const snake = this.snakes.get(id);
    if (snake && snake.isAlive) {
      snake.setInput(angle, boost, seq);
    }
  }

  public tick(): {
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
    leaderboard: LeaderboardEntry[];
  } {
    const now = Date.now();
    const dtSeconds = Math.min(0.1, (now - this.lastTickTime) / 1000 || (1 / TICK_RATE));
    this.lastTickTime = now;
    this.tickCount++;

    // 1. Mise à jour des déplacements de chaque serpent
    for (const snake of this.snakes.values()) {
      if (snake.isAlive) {
        const { droppedOrb } = snake.update(dtSeconds);
        if (droppedOrb && snake.body.length > 2) {
          const tail = snake.body[snake.body.length - 1];
          this.orbManager.spawnDropOrb(tail.x, tail.y, 1, snake.color);
        }
      }
    }

    // 2. Mise à jour de la grille spatiale
    this.spatialGrid.clear();

    // Insérer les segments de chaque serpent dans la grille spatiale
    for (const snake of this.snakes.values()) {
      if (!snake.isAlive) continue;

      // Tête
      this.spatialGrid.insert({
        id: snake.id,
        x: snake.head.x,
        y: snake.head.y,
        radius: snake.radius,
        type: 'snake_head',
        ownerId: snake.id,
        segmentIndex: 0,
      });

      // Segments du corps (en sautant les premiers pour éviter auto-collision immédiate)
      for (let i = 3; i < snake.body.length; i++) {
        const seg = snake.body[i];
        this.spatialGrid.insert({
          id: snake.id,
          x: seg.x,
          y: seg.y,
          radius: snake.radius * 0.9,
          type: 'snake_segment',
          ownerId: snake.id,
          segmentIndex: i,
        });
      }
    }

    // Insérer les orbes dans la grille spatiale
    for (const orb of this.orbManager.getAllOrbs()) {
      this.spatialGrid.insert({
        id: orb.id,
        x: orb.x,
        y: orb.y,
        radius: orb.radius,
        type: 'orb',
        data: orb,
      });
    }

    // 3. Détection des collisions & orbes
    const deadSnakes: Array<{ victim: SnakeEntity; killer?: SnakeEntity }> = [];

    for (const snake of this.snakes.values()) {
      if (!snake.isAlive) continue;

      const head = snake.head;

      // A. Collision avec la limite de l'arène circulaire
      const distFromCenter = Math.sqrt(head.x * head.x + head.y * head.y);
      if (distFromCenter + snake.radius >= ARENA_RADIUS) {
        deadSnakes.push({ victim: snake });
        continue;
      }

      // B. Requête spatiale autour de la tête
      const nearbyItems = this.spatialGrid.queryRange(head.x, head.y, snake.radius + 20);

      for (const item of nearbyItems) {
        // Collecte d'orbes
        if (item.type === 'orb') {
          const orb = item.data as Orb;
          if (orb) {
            const dx = head.x - orb.x;
            const dy = head.y - orb.y;
            const collisionDist = snake.radius + orb.radius;
            if (dx * dx + dy * dy <= collisionDist * collisionDist) {
              this.orbManager.removeOrb(orb.id);
              snake.eatOrb(orb.value);
            }
          }
        }

        // Collision tête contre corps d'un serpent adverse (ou son propre corps arrière)
        else if (item.type === 'snake_segment') {
          // Si corps adverse OU son propre corps après le 6e segment
          if (item.ownerId !== snake.id || (item.segmentIndex && item.segmentIndex > 6)) {
            const dx = head.x - item.x;
            const dy = head.y - item.y;
            const collisionDist = snake.radius + item.radius;

            if (dx * dx + dy * dy <= collisionDist * collisionDist * 0.8) {
              const killer = item.ownerId ? this.snakes.get(item.ownerId) : undefined;
              deadSnakes.push({ victim: snake, killer });
              break;
            }
          }
        }
      }
    }

    // 4. Traitement des morts
    for (const { victim, killer } of deadSnakes) {
      if (!victim.isAlive) continue; // Évite double traitement
      victim.isAlive = false;

      if (killer && killer.id !== victim.id) {
        killer.kills++;
        killer.score += 50; // Bonus pour élimination
      }

      // Dépôt d'orbes tout au long du corps du serpent mort
      const dropStep = Math.max(1, Math.floor(victim.body.length / 30));
      for (let i = 0; i < victim.body.length; i += dropStep) {
        const seg = victim.body[i];
        const orbValue = Math.min(10, Math.max(2, Math.floor(victim.score / 20)));
        // Légère dispersion pour créer un champ d'orbes esthétique
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetY = (Math.random() - 0.5) * 20;
        this.orbManager.spawnDropOrb(seg.x + offsetX, seg.y + offsetY, orbValue, victim.color);
      }

      const durationSeconds = Math.round((Date.now() - victim.matchStartTime) / 1000);
      const stats: MatchStats = {
        score: victim.score,
        length: victim.length,
        kills: victim.kills,
        orbsEaten: victim.orbsEaten,
        durationSeconds,
        killerName: killer?.name,
      };

      if (this.onPlayerDied) {
        this.onPlayerDied({ player: victim, killer, stats });
      }
    }

    // 5. Mise à jour des orbes (respawn régulier)
    this.orbManager.update();

    // 6. Construction du classement en direct
    const leaderboard = this.getLeaderboard();

    // 7. Préparation de la charge réseau delta
    const deltaOrbs = this.orbManager.getDeltaAndFlush();
    const removedPlayers = [...this.removedPlayerIds];
    this.removedPlayerIds = [];

    const activePlayersPayload = Array.from(this.snakes.values())
      .filter((s) => s.isAlive)
      .map((s) => ({
        id: s.id,
        body: s.body.map((b) => ({ x: Math.round(b.x), y: Math.round(b.y) })),
        angle: Number(s.angle.toFixed(3)),
        speed: s.speed,
        isBoosting: s.isBoosting,
        score: s.score,
        radius: s.radius,
        isAlive: s.isAlive,
      }));

    return {
      tick: this.tickCount,
      serverTime: now,
      players: activePlayersPayload,
      removedPlayerIds: removedPlayers,
      orbsAdded: deltaOrbs.added,
      orbsRemoved: deltaOrbs.removed,
      leaderboard,
    };
  }

  public getLeaderboard(): LeaderboardEntry[] {
    const list = Array.from(this.snakes.values())
      .filter((s) => s.isAlive)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((s, index) => ({
        id: s.id,
        name: s.name,
        score: s.score,
        kills: s.kills,
        rank: index + 1,
      }));
    return list;
  }
}
