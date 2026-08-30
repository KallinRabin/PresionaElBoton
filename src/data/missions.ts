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

export const MISSION_TEMPLATES: Omit<DailyMission, 'current' | 'completed' | 'claimed'>[] = [
  {
    id: 'm_crazy_button_1',
    title: '¡Amo del Botón Loco!',
    description: 'Presiona el Botón Loco durante eventos de Smash Clásico 2 veces.',
    icon: '⚡',
    target: 2,
    rewardCoins: 100,
    type: 'press_crazy_button',
  },
  {
    id: 'm_ring_out_kos',
    title: 'Rey del Cuadrilátero',
    description: 'Consigue 3 KOs expulsando rivales del ring.',
    icon: '🥊',
    target: 3,
    rewardCoins: 120,
    type: 'kos',
  },
  {
    id: 'm_bounty_hunter',
    title: 'Cazador de Botines',
    description: 'Roba y acumula 120 monedas en partidas.',
    icon: '🪙',
    target: 120,
    rewardCoins: 80,
    type: 'coins_earned',
  },
  {
    id: 'm_damage_dealer',
    title: 'Furia Destructiva',
    description: 'Inflige 250% de daño acumulado a los oponentes.',
    icon: '💥',
    target: 250,
    rewardCoins: 90,
    type: 'damage_dealt',
  },
  {
    id: 'm_volcano_master',
    title: 'Dominio del Magma',
    description: 'Juega y gana 1 partida en la arena Volcán de Magma.',
    icon: '🌋',
    target: 1,
    rewardCoins: 110,
    type: 'win_matches',
    arenaRequired: 'magma_volcano',
  },
  {
    id: 'm_space_brawler',
    title: 'Gladiador Cósmico',
    description: 'Juega 2 partidas en la Estación Cósmica.',
    icon: '🌌',
    target: 2,
    rewardCoins: 85,
    type: 'play_arena',
    arenaRequired: 'cyber_space',
  },
];

export function generateDailyMissions(): DailyMission[] {
  // Pick 3 diverse missions for the day
  const shuffled = [...MISSION_TEMPLATES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3).map((m) => ({
    ...m,
    current: 0,
    completed: false,
    claimed: false,
  }));
}
