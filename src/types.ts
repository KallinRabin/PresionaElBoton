export type GameMode = 'classic' | 'stock_battle' | 'coin_frenzy';

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover';

export type ClassId =
  | 'brawler'
  | 'shadow_thief'
  | 'iron_guardian'
  | 'gravity_mage'
  | 'trapster'
  | 'pyro_fiend'
  | 'frost_valkyrie'
  | 'cyber_ninja';

export interface ClassAbility {
  id: string;
  name: string;
  description: string;
  cooldown: number; // in seconds
  icon: string;
  color: string;
}

export interface PlayerClass {
  id: ClassId;
  name: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  accentColor: string;
  // Tactical Stats
  weight: number; // Knockback resistance (1.0 = normal, 1.4 = heavy tank, 0.8 = light)
  speed: number; // Movement speed
  punchPower: number; // Base damage & knockback scale
  stealPower: number; // Coins stolen per glove punch
  ability: ClassAbility;
}

export type ItemType = 'bat' | 'bomb' | 'heart' | 'potion' | 'giant_glove' | 'crate' | 'shield';

export interface BattleItemDef {
  type: ItemType;
  name: string;
  description: string;
  icon: string;
  color: string;
  duration?: number; // active duration in seconds if buff
}

export interface SpawnedItem {
  id: string;
  type: ItemType;
  position: { x: number; y: number; z: number };
  mesh: any; // THREE.Group or THREE.Mesh
  collected: boolean;
  spawnTime: number;
}

export interface CharacterSkin {
  id: string;
  name: string;
  price: number;
  unlocked: boolean;
  color: string;
  headColor: string;
  bodyColor: string;
  detailColor: string;
  hatType: 'none' | 'crown' | 'helmet' | 'ninja' | 'horns' | 'antenna' | 'cap' | 'hood' | 'pirate';
  description: string;
  speedMultiplier: number;
  dashPowerMultiplier: number;
}

export interface ButtonSkin {
  id: string;
  name: string;
  price: number;
  unlocked: boolean;
  capColor: string;
  baseColor: string;
  accentColor: string;
  hudGlowClass: string;
  description: string;
}

export interface KillBanner {
  id: string;
  name: string;
  title: string;
  price: number;
  unlocked: boolean;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  icon: string;
  badgeText: string;
  description: string;
}

export interface EliminationEvent {
  id: string;
  victimName: string;
  victimClassIcon: string;
  killerName: string;
  killerClassIcon: string;
  killerBanner: KillBanner;
  isPlayerVictim: boolean;
  isPlayerKiller: boolean;
  timestamp: number;
}

export interface BattleNotification {
  id: string;
  icon: string;
  text: string;
  detail?: string;
  color: string;
  timestamp: number;
}

export interface TrailEffect {
  id: string;
  name: string;
  price: number;
  unlocked: boolean;
  color: string;
  particleType: 'pixel_smoke' | 'pixel_fire' | 'pixel_sparkle' | 'pixel_electric' | 'pixel_rainbow';
  description: string;
}

export interface PlayerStats {
  id: string;
  name: string;
  isPlayer: boolean;
  classId: ClassId;
  className: string;
  classIcon: string;
  coins: number;
  rank: number;
  
  // Smash Mechanics
  damagePercent: number; // Starts at 0%, goes up with hits
  stocks: number; // Lives in stock battle or KO counter
  kosDone: number;
  kosSuffered: number;
  totalDamageDealt: number;
  stealsDone: number;
  stealsSuffered: number;
  buttonPresses: number;
  isEliminated: boolean;
  killerName?: string;
  killerBanner?: KillBanner;

  // States & Cooldowns
  isAttacking: boolean;
  attackCooldown: number;
  abilityCooldown: number;
  abilityMaxCooldown: number;
  abilityActiveTime: number;
  hasReflectShield: boolean;
  hasGiantGlove: boolean;
  hasMagnet?: boolean;
  hasSpeedBoost?: boolean;
  hasInvincibleShield?: boolean;
  hasIceCharged?: boolean;
  activeItem: ItemType | null;
  itemTimeLeft: number;
  isStunned: boolean;
  stunTimeLeft: number;
  isRespawning: boolean;
  color: string;
  skinId: string;
  bannerId?: string;
}

export interface GameEvent {
  title: string;
  description: string;
  duration: number; // in seconds
  timeLeft: number;
  type: 'item_shower' | 'double_damage' | 'mega_coins' | 'super_button' | 'none';
}

export interface MatchResult {
  winnerName: string;
  isPlayerWinner: boolean;
  playerRank: number;
  playerCoins: number;
  coinsEarned: number;
  playerKOs: number;
  playerDamageDealt: number;
  totalPresses: number;
  totalSteals: number;
  leaderboard: Array<{
    name: string;
    coins: number;
    kos: number;
    damagePercent: number;
    isPlayer: boolean;
    classIcon: string;
  }>;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  scanlinesEnabled: boolean;
  particlesEnabled: boolean;
  cameraSensitivity: number;
  pixelResolutionScale: number; // 1 = standard, 0.65 = ultra retro
}

export type ArenaId = 'arcade_core' | 'magma_volcano' | 'cyber_space' | 'void_citadel';

export type CrazyButtonType = 'titan_mode' | 'shockwave_blast' | 'coin_jackpot' | 'thunder_strike';

export interface CrazyButtonEvent {
  type: CrazyButtonType;
  title: string;
  description: string;
  icon: string;
  capColor: string;
  glowColor: string;
  duration: number; // in seconds
  timeLeft: number;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  rewardCoins: number;
  completed: boolean;
  claimed: boolean;
  type: 'press_crazy_button' | 'kos' | 'coins_earned' | 'damage_dealt' | 'win_matches' | 'play_arena';
  arenaRequired?: string;
}

// MULTIPLAYER ROOM TYPES
export type MultiplayerMode = 'ffa' | '2v2' | '1v1';
export type PlayerTeam = 'red' | 'blue';

export interface RoomPlayer {
  id: string;
  name: string;
  classId: ClassId;
  skinId: string;
  bannerId?: string;
  team?: PlayerTeam;
  isHost: boolean;
  isReady: boolean;
  ping?: number;
}

export interface RoomInfo {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  mode: MultiplayerMode;
  arenaId: ArenaId;
  playersCount: number;
  maxPlayers: number;
  isPlaying: boolean;
  players: RoomPlayer[];
}

export interface PlayerNetState {
  id: string;
  x: number;
  y: number;
  z: number;
  facing: number;
  vx: number;
  vy: number;
  vz: number;
  isGrounded: boolean;
  isPunching: boolean;
  punchType: 'normal' | 'titan' | 'bat';
  hasIceCharge?: boolean;
  isFrozen?: boolean;
  damagePercent: number;
  stocks: number;
  coins: number;
  isTitan?: boolean;
  hasShield?: boolean;
}
