import { BattleItemDef } from '../types';

export const BATTLE_ITEMS: BattleItemDef[] = [
  {
    type: 'heart',
    name: 'Corazón Pixel',
    description: 'Restaura -70% de daño acumulado, devolviéndote a zona segura y salvándote de un KO.',
    icon: '❤️',
    color: '#ef4444',
  },
  {
    type: 'potion',
    name: 'Poción Mágica',
    description: '¡Super Aumento de Velocidad! Otorga +65% de rapidez, agilidad y estela mágica púrpura por 10s.',
    icon: '🧪',
    color: '#c026d3',
    duration: 10,
  },
  {
    type: 'shield',
    name: 'Escudo de Energía',
    description: 'Barrera holográfica invulnerable por 7s. Absorbe todo el daño rival y anula el retroceso.',
    icon: '🛡️',
    color: '#06b6d4',
    duration: 7,
  },
  {
    type: 'bat',
    name: 'Bate Smash Dorado',
    description: 'Golpea con potencia de Home-Run. Provoca un empuje crítico demoledor en rivales con alto daño.',
    icon: '⚾',
    color: '#f59e0b',
    duration: 10,
  },
  {
    type: 'bomb',
    name: 'Bomba Retro Pixel',
    description: 'Artefacto explosivo con mecha. Detona al contacto provocando una explosión expansiva devastadora.',
    icon: '💣',
    color: '#dc2626',
  },
  {
    type: 'giant_glove',
    name: 'Guantelete Titán',
    description: 'Tu Guante de Robo aumenta a tamaño colosal durante 10s, duplicando el alcance y la fuerza de empuje.',
    icon: '🥊',
    color: '#8b5cf6',
    duration: 10,
  },
  {
    type: 'crate',
    name: 'Caja Sorpresa Pixel',
    description: 'Caja de madera con botín misterioso. Golpéala con el guante para abrirla y liberar power-ups.',
    icon: '📦',
    color: '#b45309',
  },
];
