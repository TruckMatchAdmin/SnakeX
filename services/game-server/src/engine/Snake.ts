/**
 * Modèle physique et logique du serpent SnakeX
 */

import {
  BASE_SPEED,
  BOOST_SPEED,
  INITIAL_SNAKE_LENGTH,
  MAX_SNAKE_RADIUS,
  SEGMENT_DISTANCE,
  SNAKE_RADIUS_BASE,
  SnakePlayer,
  SnakeSegment,
  TURN_SPEED,
} from '@snakex/shared';
import { Vector2D } from './Vector';

export class SnakeEntity implements SnakePlayer {
  public id: string;
  public userId?: string;
  public name: string;
  public color: string;
  public secondaryColor: string;
  public body: SnakeSegment[] = [];
  public angle: number = 0;
  public targetAngle: number = 0;
  public speed: number = BASE_SPEED;
  public isBoosting: boolean = false;
  public score: number = 0;
  public length: number = INITIAL_SNAKE_LENGTH;
  public kills: number = 0;
  public isAlive: boolean = true;
  public radius: number = SNAKE_RADIUS_BASE;
  public lastInputSeq: number = 0;
  public orbsEaten: number = 0;
  public matchStartTime: number = Date.now();

  private pendingGrowth: number = 0;
  private boostDrainAccumulator: number = 0;

  constructor(
    id: string,
    name: string,
    startX: number,
    startY: number,
    color: string = '#00FF66',
    secondaryColor: string = '#00E5FF',
    userId?: string
  ) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.secondaryColor = secondaryColor;
    this.userId = userId;

    // Angle de départ aléatoire
    this.angle = (Math.random() * 2 - 1) * Math.PI;
    this.targetAngle = this.angle;

    // Initialisation du corps
    this.body = [];
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      this.body.push({
        x: startX - Math.cos(this.angle) * i * SEGMENT_DISTANCE,
        y: startY - Math.sin(this.angle) * i * SEGMENT_DISTANCE,
      });
    }
  }

  public get head(): SnakeSegment {
    return this.body[0];
  }

  public setInput(targetAngle: number, boost: boolean, seq: number): void {
    if (!this.isAlive) return;
    this.targetAngle = Vector2D.normalizeAngle(targetAngle);
    // Le boost n'est utilisable que si le serpent a une longueur suffisante
    this.isBoosting = boost && this.body.length > 5;
    this.lastInputSeq = seq;
  }

  public update(dtSeconds: number): { droppedOrb: boolean } {
    if (!this.isAlive || this.body.length === 0) return { droppedOrb: false };

    // 1. Rotation fluide vers l'angle cible
    const maxRotStep = TURN_SPEED * dtSeconds;
    this.angle = Vector2D.rotateTowards(this.angle, this.targetAngle, maxRotStep);

    // 2. Vitesse et gestion du boost
    let droppedOrb = false;
    if (this.isBoosting && this.body.length > 5) {
      this.speed = BOOST_SPEED;
      this.boostDrainAccumulator += dtSeconds;
      if (this.boostDrainAccumulator >= 0.25) { // Dépense de masse progressive
        this.boostDrainAccumulator = 0;
        if (this.score > 0) this.score = Math.max(0, this.score - 1);
        if (this.body.length > INITIAL_SNAKE_LENGTH && Math.random() < 0.4) {
          this.body.pop();
          this.length = this.body.length;
          droppedOrb = true;
        }
      }
    } else {
      this.speed = BASE_SPEED;
    }

    // 3. Déplacement de la tête
    const moveDist = this.speed * dtSeconds;
    const newHeadX = this.head.x + Math.cos(this.angle) * moveDist;
    const newHeadY = this.head.y + Math.sin(this.angle) * moveDist;

    // 4. Mise à jour de la position de la chaîne de segments
    const newBody: SnakeSegment[] = [{ x: newHeadX, y: newHeadY }];

    for (let i = 0; i < this.body.length - 1; i++) {
      const leader = newBody[i];
      const follower = this.body[i + 1];

      const dx = follower.x - leader.x;
      const dy = follower.y - leader.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.0001) {
        // Maintenir la distance exacte SEGMENT_DISTANCE entre segments
        const ratio = SEGMENT_DISTANCE / dist;
        newBody.push({
          x: leader.x + dx * ratio,
          y: leader.y + dy * ratio,
        });
      } else {
        newBody.push({ x: follower.x, y: follower.y });
      }
    }

    // Gestion de la croissance différée
    if (this.pendingGrowth > 0) {
      const tail = newBody[newBody.length - 1];
      newBody.push({ x: tail.x, y: tail.y });
      this.pendingGrowth--;
      this.length = newBody.length;
    }

    this.body = newBody;

    // Mise à jour du rayon en fonction du score
    this.radius = Math.min(
      MAX_SNAKE_RADIUS,
      SNAKE_RADIUS_BASE + Math.floor(Math.sqrt(this.score) * 0.4)
    );

    return { droppedOrb };
  }

  public eatOrb(value: number): void {
    this.score += value;
    this.orbsEaten++;
    this.pendingGrowth += Math.max(1, Math.floor(value / 2));
  }
}
