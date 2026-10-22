/**
 * Collecteur de métriques temps réel pour SnakeX (Mémoire, CPU, Latence, Ticks)
 * Utilisé pour valider la performance du VPS OVH (2 vCores / 4 Go RAM)
 */

import { ServerMetrics } from '@snakex/shared';

export class MetricsCollector {
  private latencies: number[] = [];
  private lastCpuUsage: NodeJS.CpuUsage = process.cpuUsage();
  private lastCpuTime: number = Date.now();
  private cpuPercent: number = 0;
  private tickDurations: number[] = [];
  private startTime: number = Date.now();
  private packetsReceivedCount: number = 0;
  private packetsLastSecond: number = 0;

  constructor() {
    // Calcul de la charge CPU toutes les 2 secondes
    setInterval(() => {
      const currentUsage = process.cpuUsage(this.lastCpuUsage);
      const currentTime = Date.now();
      const timeDiffMs = (currentTime - this.lastCpuTime) || 1;

      // Total microsecondes passées en CPU
      const totalMicros = currentUsage.user + currentUsage.system;
      // Pourcentage par rapport au temps écoulé (en microsecondes)
      this.cpuPercent = Number(((totalMicros / (timeDiffMs * 1000)) * 100).toFixed(1));

      this.lastCpuUsage = process.cpuUsage();
      this.lastCpuTime = currentTime;

      this.packetsLastSecond = this.packetsReceivedCount;
      this.packetsReceivedCount = 0;
    }, 2000);
  }

  public recordPacketReceived(): void {
    this.packetsReceivedCount++;
  }

  public recordTickDuration(durationMs: number): void {
    this.tickDurations.push(durationMs);
    if (this.tickDurations.length > 100) {
      this.tickDurations.shift();
    }
  }

  public recordLatency(latencyMs: number): void {
    this.latencies.push(latencyMs);
    if (this.latencies.length > 500) {
      this.latencies.shift();
    }
  }

  public getLatencyStats(): { median: number; p95: number } {
    if (this.latencies.length === 0) return { median: 0, p95: 0 };

    const sorted = [...this.latencies].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length * 0.5)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;

    return {
      median: Number(median.toFixed(1)),
      p95: Number(p95.toFixed(1)),
    };
  }

  public getSnapshot(connectedPlayers: number, activeSnakes: number, orbsCount: number, currentTick: number): ServerMetrics {
    const mem = process.memoryUsage();
    const lat = this.getLatencyStats();

    const avgTickDuration = this.tickDurations.length > 0
      ? this.tickDurations.reduce((a, b) => a + b, 0) / this.tickDurations.length
      : 0;

    return {
      connectedPlayers,
      activeSnakes,
      orbsCount,
      currentTick,
      tickDurationMs: Number(avgTickDuration.toFixed(2)),
      cpuPercent: this.cpuPercent,
      memoryUsageMb: Number((mem.rss / 1024 / 1024).toFixed(1)),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      latencyMedianMs: lat.median,
      latencyP95Ms: lat.p95,
      packetsPerSecond: this.packetsLastSecond / 2,
    };
  }
}
