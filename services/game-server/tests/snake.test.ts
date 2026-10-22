import { SnakeEntity } from '../src/engine/Snake';
import { BASE_SPEED, BOOST_SPEED, INITIAL_SNAKE_LENGTH } from '@snakex/shared';

describe('SnakeEntity Physics & Logic', () => {
  it('should initialize with correct default properties', () => {
    const snake = new SnakeEntity('test-1', 'Viper', 0, 0);
    expect(snake.id).toBe('test-1');
    expect(snake.name).toBe('Viper');
    expect(snake.body.length).toBe(INITIAL_SNAKE_LENGTH);
    expect(snake.isAlive).toBe(true);
    expect(snake.speed).toBe(BASE_SPEED);
  });

  it('should move forward when updated', () => {
    const snake = new SnakeEntity('test-1', 'Viper', 0, 0);
    snake.angle = 0; // Direction Est (vers +X)
    snake.targetAngle = 0;

    const initialHeadX = snake.head.x;
    snake.update(0.1); // 100ms
    expect(snake.head.x).toBeGreaterThan(initialHeadX);
  });

  it('should increase speed when boosting', () => {
    const snake = new SnakeEntity('test-1', 'Viper', 0, 0);
    snake.setInput(0, true, 1);
    snake.update(0.05);
    expect(snake.speed).toBe(BOOST_SPEED);
    expect(snake.isBoosting).toBe(true);
  });

  it('should grow when eating orbs', () => {
    const snake = new SnakeEntity('test-1', 'Viper', 0, 0);
    const initialScore = snake.score;
    const initialLength = snake.body.length;

    snake.eatOrb(5);
    expect(snake.score).toBe(initialScore + 5);

    // Mettre à jour plusieurs fois pour consommer la croissance en attente
    snake.update(0.1);
    snake.update(0.1);
    expect(snake.body.length).toBeGreaterThan(initialLength);
  });
});
