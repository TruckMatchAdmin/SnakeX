/**
 * Gestion d'intérêt (interest management) : chaque client ne reçoit que les serpents
 * proches de sa vue, au lieu de l'état complet de l'arène (bande passante O(N²) → ~O(N)).
 */

import { TickPayload } from '@snakex/shared';

type NetPlayer = TickPayload['players'][0];

// Rayon (unités monde) autour de la tête du joueur. La vue la plus large (dézoom 0.4 sur un
// écran paysage ~900 px) couvre ~1150 unités du centre : la marge évite tout "pop-in".
export const VIEW_RADIUS = 1500;

// Le classement n'est envoyé qu'un tick sur N (changements lents)
export const LEADERBOARD_EVERY_N_TICKS = 10;

/** Vrai si au moins un segment du serpent est dans le rayon de vue (échantillonné 1/3) */
export function isSnakeNearby(
  player: NetPlayer,
  viewX: number,
  viewY: number,
  radius: number = VIEW_RADIUS
): boolean {
  const r2 = radius * radius;
  const body = player.body;
  for (let i = 0; i < body.length; i += 3) {
    const dx = body[i].x - viewX;
    const dy = body[i].y - viewY;
    if (dx * dx + dy * dy <= r2) return true;
  }
  const tail = body[body.length - 1];
  if (tail) {
    const dx = tail.x - viewX;
    const dy = tail.y - viewY;
    if (dx * dx + dy * dy <= r2) return true;
  }
  return false;
}

/** Filtre les joueurs visibles depuis la tête (viewX, viewY) du joueur `viewerId` */
export function filterPlayersForViewer(
  players: NetPlayer[],
  viewerId: string,
  viewX: number,
  viewY: number,
  radius: number = VIEW_RADIUS
): NetPlayer[] {
  return players.filter((p) => p.id === viewerId || isSnakeNearby(p, viewX, viewY, radius));
}
