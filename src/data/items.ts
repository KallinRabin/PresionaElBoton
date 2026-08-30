import { BattleItemDef } from '../types';

export const BATTLE_ITEMS: BattleItemDef[] = [
  {
    type: 'bat',
    name: 'Bate Smash Dorado',
    description: 'Golpea con potencia de Home-Run. Provoca un empuje crítico demoledor en rivales con alto % de daño.',
    icon: '⚾',
    color: '#f59e0b',
    duration: 10,
  },
  {
    type: 'bomb',
    name: 'Bomba Retro',
    description: 'Artefacto explosivo. Detona al contacto provocando una explosión expansiva que expulsa a los rivales.',
    icon: '💣',
    color: '#ef4444',
  },
  {
    type: 'heart',
    name: 'Corazón Curativo',
    description: 'Restaura -60% de tu porcentaje de daño acumulado, devolviéndote a zona segura.',
    icon: '❤️',
    color: '#ec4899',
  },
  {
    type: 'magnet',
    name: 'Super Imán de Monedas',
    description: 'Genera un campo electromagnético durante 8s que atrae monedas y drena el dinero de rivales cercanos.',
    icon: '🧲',
    color: '#3b82f6',
    duration: 8,
  },
  {
    type: 'giant_glove',
    name: 'Guantelete Titán',
    description: 'Tu Guante de Robo aumenta a tamaño colosal durante 9s, duplicando el alcance y la fuerza de empuje.',
    icon: '🥊',
    color: '#8b5cf6',
    duration: 9,
  },
  {
    type: 'crate',
    name: 'Caja Sorpresa',
    description: 'Caja de madera pixelada. Golpéala con el guante para abrirla y liberar objetos y montones de monedas.',
    icon: '📦',
    color: '#b45309',
  },
];
