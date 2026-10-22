import { GameArena } from '../src/engine/GameArena';
import { ARENA_RADIUS } from '@snakex/shared';

describe('GameArena Simulation & Rules', () => {
  let arena: GameArena;

  beforeEach(() => {
    arena = new GameArena();
  });

  it('should add and remove players properly', () => {
    const player = arena.addPlayer('p1', 'AlphaSnake');
    expect(arena.snakes.has('p1')).toBe(true);
    expect(player.name).toBe('AlphaSnake');

    arena.removePlayer('p1');
    expect(arena.snakes.has('p1')).toBe(false);
  });

  it('should generate active ticks and leaderboard', () => {
    arena.addPlayer('p1', 'Player1');
    arena.addPlayer('p2', 'Player2');

    const tickResult = arena.tick();
    expect(tickResult.tick).toBe(1);
    expect(tickResult.players.length).toBe(2);
    expect(tickResult.leaderboard.length).toBe(2);
  });

  it('should kill snake if it leaves arena bounds', () => {
    let diedEventFired = false;
    arena.onPlayerDied = (event) => {
      if (event.player.id === 'p1') {
        diedEventFired = true;
      }
    };

    const snake = arena.addPlayer('p1', 'BoundaryTester');
    // Forcer la position de la tête en dehors du rayon d'arène
    snake.body[0].x = ARENA_RADIUS + 50;
    snake.body[0].y = 0;

    arena.tick();
    expect(snake.isAlive).toBe(false);
    expect(diedEventFired).toBe(true);
  });

  it('should trigger death and orb drop when head hits another snake body', () => {
    const victim = arena.addPlayer('victim', 'Victim');
    const killer = arena.addPlayer('killer', 'Killer');

    // Placer les segments du tueur
    killer.body = [
      { x: 100, y: 100 },
      { x: 100, y: 112 },
      { x: 100, y: 124 },
      { x: 100, y: 136 },
      { x: 100, y: 148 },
    ];

    // Placer la tête de la victime directement sur le segment 4 du tueur
    victim.body[0] = { x: 100, y: 136 };

    let diedCalled = false;
    arena.onPlayerDied = ({ player, killer: k }) => {
      if (player.id === 'victim') {
        diedCalled = true;
        expect(k?.id).toBe('killer');
      }
    };

    arena.tick();
    expect(victim.isAlive).toBe(false);
    expect(diedCalled).toBe(true);
  });
});
