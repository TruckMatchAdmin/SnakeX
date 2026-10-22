import { ClientRateLimiter } from '../src/network/RateLimiter';

describe('ClientRateLimiter & Input Sanitization', () => {
  it('should sanitize dangerous or invalid characters in player names', () => {
    expect(ClientRateLimiter.sanitizePlayerName('   <script>alert(1)</script>   ')).toBe('scriptalert1scri');
    expect(ClientRateLimiter.sanitizePlayerName('Player_123')).toBe('Player_123');
    expect(ClientRateLimiter.sanitizePlayerName('')).toBe('Snake_Guest');
    expect(ClientRateLimiter.sanitizePlayerName(null)).toBe('Snake_Guest');
    expect(ClientRateLimiter.sanitizePlayerName('A'.repeat(50)).length).toBeLessThanOrEqual(16);
  });

  it('should validate angles properly', () => {
    expect(ClientRateLimiter.isValidAngle(0)).toBe(true);
    expect(ClientRateLimiter.isValidAngle(Math.PI)).toBe(true);
    expect(ClientRateLimiter.isValidAngle(NaN)).toBe(false);
    expect(ClientRateLimiter.isValidAngle(Infinity)).toBe(false);
    expect(ClientRateLimiter.isValidAngle('not-a-number')).toBe(false);
  });

  it('should block excessive packets within a 1-second window', () => {
    const limiter = new ClientRateLimiter(5);
    for (let i = 0; i < 5; i++) {
      expect(limiter.allowPacket()).toBe(true);
    }
    // Le 6ème paquet dans la même seconde doit être rejeté
    expect(limiter.allowPacket()).toBe(false);
  });
});
