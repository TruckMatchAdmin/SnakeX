/**
 * Utilitaires mathématiques 2D optimisés pour la simulation de SnakeX
 */

import { Point2D } from '@snakex/shared';

export class Vector2D implements Point2D {
  constructor(public x: number = 0, public y: number = 0) {}

  static distance(a: Point2D, b: Point2D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static distanceSq(a: Point2D, b: Point2D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  static angle(from: Point2D, to: Point2D): number {
    return Math.atan2(to.y - from.y, to.x - from.x);
  }

  /**
   * Normalise un angle en radians dans l'intervalle [-PI, PI]
   */
  static normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }

  /**
   * Calcule la plus courte différence angulaire entre deux angles
   */
  static angleDiff(a: number, b: number): number {
    let diff = (b - a) % (2 * Math.PI);
    if (diff < -Math.PI) diff += 2 * Math.PI;
    if (diff > Math.PI) diff -= 2 * Math.PI;
    return diff;
  }

  /**
   * Fait pivoter un angle actuel vers un angle cible à une vitesse maximale donnée
   */
  static rotateTowards(current: number, target: number, maxStep: number): number {
    const diff = Vector2D.angleDiff(current, target);
    if (Math.abs(diff) <= maxStep) {
      return target;
    }
    return Vector2D.normalizeAngle(current + Math.sign(diff) * maxStep);
  }
}
