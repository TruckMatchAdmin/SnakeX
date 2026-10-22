/**
 * Grille de hachage spatial 2D optimisée pour la détection de collisions ultra-rapide
 * Crucial pour maintenir 60+ FPS côté serveur avec 10 à 50 joueurs sur un VPS 2 vCores.
 */

import { Point2D } from '@snakex/shared';

export interface SpatialItem {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: 'snake_segment' | 'snake_head' | 'orb';
  ownerId?: string;
  segmentIndex?: number;
  data?: any;
}

export class SpatialHashGrid {
  private cellSize: number;
  private grid: Map<string, SpatialItem[]> = new Map();

  constructor(cellSize: number = 64) {
    this.cellSize = cellSize;
  }

  private getKey(cx: number, cy: number): string {
    return `${cx}:${cy}`;
  }

  public clear(): void {
    this.grid.clear();
  }

  public insert(item: SpatialItem): void {
    const minCx = Math.floor((item.x - item.radius) / this.cellSize);
    const maxCx = Math.floor((item.x + item.radius) / this.cellSize);
    const minCy = Math.floor((item.y - item.radius) / this.cellSize);
    const maxCy = Math.floor((item.y + item.radius) / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = this.getKey(cx, cy);
        let cell = this.grid.get(key);
        if (!cell) {
          cell = [];
          this.grid.set(key, cell);
        }
        cell.push(item);
      }
    }
  }

  /**
   * Récupère tous les éléments proches d'un point dans un rayon donné (sans doublons)
   */
  public queryRange(x: number, y: number, radius: number): SpatialItem[] {
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);

    const foundIds = new Set<string>();
    const results: SpatialItem[] = [];

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.grid.get(this.getKey(cx, cy));
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            const item = cell[i];
            const uniqueKey = `${item.type}_${item.id}_${item.segmentIndex ?? 0}`;
            if (!foundIds.has(uniqueKey)) {
              foundIds.add(uniqueKey);
              // Vérification distance euclidienne
              const dx = item.x - x;
              const dy = item.y - y;
              const combinedRadius = radius + item.radius;
              if (dx * dx + dy * dy <= combinedRadius * combinedRadius) {
                results.push(item);
              }
            }
          }
        }
      }
    }

    return results;
  }
}
