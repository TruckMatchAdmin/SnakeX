/**
 * Paramètres centralisés d'équilibrage et de dimensions du jeu SnakeX
 */

// Dimensions de l'arène de jeu (arène circulaire ou rectangulaire bornée)
export const ARENA_RADIUS = 2000;
export const ARENA_WIDTH = ARENA_RADIUS * 2;
export const ARENA_HEIGHT = ARENA_RADIUS * 2;

// Fréquence réseau et physique (30 ticks/s = 33.33ms par tick)
export const TICK_RATE = 30;
export const TICK_INTERVAL_MS = 1000 / TICK_RATE;

// Vitesses du serpent (pixels par seconde)
export const BASE_SPEED = 180;
export const BOOST_SPEED = 320;
export const TURN_SPEED = Math.PI * 2.2; // Vitesse de rotation max (radians/s)

// Caractéristiques du serpent
export const INITIAL_SNAKE_LENGTH = 15;
export const SEGMENT_DISTANCE = 12; // Distance entre deux segments consécutifs
export const SNAKE_RADIUS_BASE = 14;
export const MAX_SNAKE_RADIUS = 32;

// Orbes d'énergie
export const MIN_ORBS_COUNT = 600;
export const MAX_ORBS_COUNT = 1500;
export const ORB_BASE_RADIUS = 6;
export const ORB_RESPAWN_RATE_PER_TICK = 3;

// Couleurs thématiques SnakeX
export const THEME_COLORS = {
  BACKGROUND: '#050811',
  GRID: '#0B1528',
  PRIMARY_NEON: '#00FF66',
  SECONDARY_CYAN: '#00E5FF',
  ACCENT_PINK: '#FF0077',
  ACCENT_GOLD: '#FFD700',
  ACCENT_PURPLE: '#9D4EDD',
  ACCENT_ORANGE: '#FF6B35',
  DANGER: '#FF2A42',
  TEXT_LIGHT: '#FFFFFF',
  TEXT_MUTED: '#7E91B0',
};

export const SNAKE_SKINS = [
  { id: 'neon_viper', name: 'Neon Viper', primary: '#00FF66', secondary: '#00E5FF' },
  { id: 'cyber_x', name: 'Cyber X', primary: '#00E5FF', secondary: '#9D4EDD' },
  { id: 'plasma_strike', name: 'Plasma Strike', primary: '#FF0077', secondary: '#FFD700' },
  { id: 'inferno', name: 'Inferno', primary: '#FF5400', secondary: '#FF2A42' },
  { id: 'void_ghost', name: 'Void Ghost', primary: '#9D4EDD', secondary: '#00FF66' },
];

// Limites de sécurité réseau
export const MAX_NAME_LENGTH = 16;
export const MAX_COMMANDS_PER_SECOND = 40;
export const MAX_PACKET_SIZE_BYTES = 4096;
export const SESSION_INACTIVITY_TIMEOUT_MS = 30000;
