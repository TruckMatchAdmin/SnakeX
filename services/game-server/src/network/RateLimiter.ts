/**
 * Protection contre les abus réseau, le spam d'inputs et les attaques par déni de service
 */

import { MAX_COMMANDS_PER_SECOND, MAX_NAME_LENGTH } from '@snakex/shared';

export class ClientRateLimiter {
  private packets: number[] = [];
  private readonly maxPerSecond: number;

  constructor(maxPerSecond: number = MAX_COMMANDS_PER_SECOND) {
    this.maxPerSecond = maxPerSecond;
  }

  public allowPacket(): boolean {
    const now = Date.now();
    // Conserver seulement les paquets de la dernière seconde
    this.packets = this.packets.filter((t) => now - t < 1000);

    if (this.packets.length >= this.maxPerSecond) {
      return false; // Débit dépassé
    }

    this.packets.push(now);
    return true;
  }

  public static sanitizePlayerName(rawName: unknown): string {
    if (typeof rawName !== 'string') return 'Snake_Guest';
    const trimmed = rawName.trim().replace(/[^\w\s\-_À-ÿ]/gi, '');
    if (!trimmed) return 'Snake_Guest';
    return trimmed.slice(0, MAX_NAME_LENGTH);
  }

  public static isValidAngle(angle: unknown): boolean {
    return typeof angle === 'number' && !isNaN(angle) && isFinite(angle);
  }
}
