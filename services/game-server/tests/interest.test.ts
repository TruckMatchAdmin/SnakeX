import { filterPlayersForViewer, isSnakeNearby, VIEW_RADIUS } from '../src/network/interest';

const mk = (id: string, x: number, y: number, len = 10) => ({
  id,
  body: Array.from({ length: len }, (_, i) => ({ x: x + i * 12, y })),
  angle: 0,
  speed: 180,
  isBoosting: false,
  score: 0,
  radius: 14,
  isAlive: true,
});

describe('Interest management', () => {
  it('garde le serpent proche et écarte le lointain', () => {
    const me = mk('me', 0, 0);
    const near = mk('near', 500, 0);
    const far = mk('far', VIEW_RADIUS + 800, 0);
    const res = filterPlayersForViewer([me, near, far], 'me', 0, 0);
    expect(res.map((p) => p.id).sort()).toEqual(['me', 'near']);
  });

  it('garde un long serpent dont seule la queue est dans la vue', () => {
    const long = mk('long', VIEW_RADIUS + 500, 0, 120);
    // la queue (x ≈ 2000 + 119*12) est loin, mais la tête à 2000 est aussi loin ; on recentre
    const longReversed = { ...long, body: [...long.body].reverse() };
    expect(isSnakeNearby(longReversed, VIEW_RADIUS + 400, 0)).toBe(true);
  });

  it('inclut toujours le joueur lui-même', () => {
    const me = mk('me', 5000, 5000);
    expect(filterPlayersForViewer([me], 'me', 0, 0).length).toBe(1);
  });
});
