export type ArenaId = 'arcade_core' | 'magma_volcano' | 'cyber_space' | 'void_citadel';

export interface ArenaDef {
  id: ArenaId;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  themeColor: string;
  accentColor: string;
  skyColor: number;
  groundColor: number;
  rimColor: number;
  lavaHazard?: boolean;
  lowGravity?: boolean;
}

export const ARENAS: ArenaDef[] = [
  {
    id: 'arcade_core',
    name: 'Coliseo Arcade',
    subtitle: 'Estándar Competitivo',
    description: 'Plataforma flotante clásica con bordes de advertencia y neón arcade.',
    icon: '🕹️',
    themeColor: '#38bdf8',
    accentColor: '#0284c7',
    skyColor: 0x0c0d19,
    groundColor: 0x27272a,
    rimColor: 0xf59e0b,
  },
  {
    id: 'magma_volcano',
    name: 'Volcán de Magma',
    subtitle: 'Riesgo Térmico y Furia',
    description: 'Roca volcánica con borde ardiente incandescente y partículas de brasas.',
    icon: '🌋',
    themeColor: '#f97316',
    accentColor: '#dc2626',
    skyColor: 0x1c0606,
    groundColor: 0x1f1414,
    rimColor: 0xff4500,
    lavaHazard: true,
  },
  {
    id: 'cyber_space',
    name: 'Estación Cósmica',
    subtitle: 'Baja Gravedad y Saltos Altos',
    description: 'Plataforma orbital con gravedad reducida y saltos aéreos extendidos.',
    icon: '🌌',
    themeColor: '#c084fc',
    accentColor: '#8b5cf6',
    skyColor: 0x050515,
    groundColor: 0x181829,
    rimColor: 0x06b6d4,
    lowGravity: true,
  },
  {
    id: 'void_citadel',
    name: 'Ciudadela del Vacío',
    subtitle: 'Energía Arcana Púrpura',
    description: 'Ruinas místicas flotantes imbuidas con cristales de energía oscura.',
    icon: '🔮',
    themeColor: '#ec4899',
    accentColor: '#a855f7',
    skyColor: 0x12081f,
    groundColor: 0x1e102e,
    rimColor: 0xd946ef,
  },
];
