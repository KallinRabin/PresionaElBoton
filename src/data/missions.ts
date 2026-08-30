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
  type:
    | 'press_crazy_button'
    | 'kos'
    | 'coins_earned'
    | 'damage_dealt'
    | 'win_matches'
    | 'play_arena'
    | 'class_play'
    | 'class_win'
    | 'class_ability'
    | 'pick_items'
    | 'break_crates'
    | 'home_runs'
    | 'freeze_enemies'
    | 'reflect_hits';
  classRequired?: string;
  arenaRequired?: string;
}

export const MISSION_TEMPLATES: Omit<DailyMission, 'current' | 'completed' | 'claimed'>[] = [
  // ==========================================
  // 1. BOXEADOR TITÁN (BRAWLER) - 8 MISIONES
  // ==========================================
  {
    id: 'm_brawler_play_1',
    title: 'Poder Titánico',
    description: 'Juega 2 partidas con la clase Boxeador Titán.',
    icon: '🥊',
    target: 2,
    rewardCoins: 90,
    type: 'class_play',
    classRequired: 'brawler',
  },
  {
    id: 'm_brawler_win_1',
    title: 'Campeón de Peso Pesado',
    description: 'Gana 1 partida jugando como Boxeador Titán.',
    icon: '👑',
    target: 1,
    rewardCoins: 130,
    type: 'class_win',
    classRequired: 'brawler',
  },
  {
    id: 'm_brawler_ability_1',
    title: 'Super Gancho Demoledor',
    description: 'Ejecuta el Super Gancho Smash 4 veces en batalla.',
    icon: '💥',
    target: 4,
    rewardCoins: 100,
    type: 'class_ability',
    classRequired: 'brawler',
  },
  {
    id: 'm_brawler_kos_1',
    title: 'KO de Coloso',
    description: 'Consigue 3 KOs jugando con Boxeador Titán.',
    icon: '🥊',
    target: 3,
    rewardCoins: 120,
    type: 'kos',
    classRequired: 'brawler',
  },
  {
    id: 'm_brawler_damage_1',
    title: 'Fuerza Bruta',
    description: 'Inflige 200% de daño con Boxeador Titán.',
    icon: '💢',
    target: 200,
    rewardCoins: 95,
    type: 'damage_dealt',
    classRequired: 'brawler',
  },
  {
    id: 'm_brawler_steals_1',
    title: 'Botín del Titán',
    description: 'Roba 80 monedas con puñetazos de Boxeador Titán.',
    icon: '🪙',
    target: 80,
    rewardCoins: 85,
    type: 'coins_earned',
    classRequired: 'brawler',
  },
  {
    id: 'm_brawler_play_2',
    title: 'Veterano del Ring',
    description: 'Juega 4 partidas con Boxeador Titán.',
    icon: '🥊',
    target: 4,
    rewardCoins: 140,
    type: 'class_play',
    classRequired: 'brawler',
  },
  {
    id: 'm_brawler_win_2',
    title: 'Invicto del Cuadrilátero',
    description: 'Gana 2 partidas jugando como Boxeador Titán.',
    icon: '🏆',
    target: 2,
    rewardCoins: 160,
    type: 'class_win',
    classRequired: 'brawler',
  },

  // ==========================================
  // 2. PÍCARO SOMBRÍO (SHADOW THIEF) - 8 MISIONES
  // ==========================================
  {
    id: 'm_shadow_play_1',
    title: 'El Ladrón Fantasma',
    description: 'Juega 2 partidas con Pícaro Sombrío.',
    icon: '🥷',
    target: 2,
    rewardCoins: 90,
    type: 'class_play',
    classRequired: 'shadow_thief',
  },
  {
    id: 'm_shadow_win_1',
    title: 'Golpe Maestro',
    description: 'Gana 1 partida jugando como Pícaro Sombrío.',
    icon: '💎',
    target: 1,
    rewardCoins: 130,
    type: 'class_win',
    classRequired: 'shadow_thief',
  },
  {
    id: 'm_shadow_ability_1',
    title: 'Emboscada Furtiva',
    description: 'Usa Paso Sombrío para teletransportarte 3 veces.',
    icon: '🌀',
    target: 3,
    rewardCoins: 100,
    type: 'class_ability',
    classRequired: 'shadow_thief',
  },
  {
    id: 'm_shadow_steals_1',
    title: 'Gran Robo de Monedas',
    description: 'Roba 120 monedas jugando con Pícaro Sombrío.',
    icon: '🪙',
    target: 120,
    rewardCoins: 110,
    type: 'coins_earned',
    classRequired: 'shadow_thief',
  },
  {
    id: 'm_shadow_kos_1',
    title: 'Asesino de las Sombras',
    description: 'Consigue 2 KOs por sorpresa con Pícaro Sombrío.',
    icon: '🗡️',
    target: 2,
    rewardCoins: 115,
    type: 'kos',
    classRequired: 'shadow_thief',
  },
  {
    id: 'm_shadow_damage_1',
    title: 'Cortes Sombríos',
    description: 'Inflige 180% de daño con Pícaro Sombrío.',
    icon: '💜',
    target: 180,
    rewardCoins: 90,
    type: 'damage_dealt',
    classRequired: 'shadow_thief',
  },
  {
    id: 'm_shadow_play_2',
    title: 'Maestro del Sigilo',
    description: 'Juega 4 partidas con Pícaro Sombrío.',
    icon: '🥷',
    target: 4,
    rewardCoins: 140,
    type: 'class_play',
    classRequired: 'shadow_thief',
  },
  {
    id: 'm_shadow_win_2',
    title: 'Sombra Inalcanzable',
    description: 'Gana 2 partidas jugando como Pícaro Sombrío.',
    icon: '🏆',
    target: 2,
    rewardCoins: 160,
    type: 'class_win',
    classRequired: 'shadow_thief',
  },

  // ==========================================
  // 3. GUARDIÁN DE HIERRO (IRON GUARDIAN) - 8 MISIONES
  // ==========================================
  {
    id: 'm_guardian_play_1',
    title: 'Muralla de Acero',
    description: 'Juega 2 partidas con Guardián de Hierro.',
    icon: '🛡️',
    target: 2,
    rewardCoins: 90,
    type: 'class_play',
    classRequired: 'iron_guardian',
  },
  {
    id: 'm_guardian_win_1',
    title: 'Victoria Inquebrantable',
    description: 'Gana 1 partida jugando como Guardián de Hierro.',
    icon: '🏰',
    target: 1,
    rewardCoins: 130,
    type: 'class_win',
    classRequired: 'iron_guardian',
  },
  {
    id: 'm_guardian_ability_1',
    title: 'Escudo Reflector en Acción',
    description: 'Activa el Escudo Reflector Total 4 veces.',
    icon: '✨',
    target: 4,
    rewardCoins: 105,
    type: 'class_ability',
    classRequired: 'iron_guardian',
  },
  {
    id: 'm_guardian_reflect_1',
    title: 'Contragolpe de Acero',
    description: 'Devuelve 3 ataques o habilidades con el Escudo Reflector.',
    icon: '🛡️',
    target: 3,
    rewardCoins: 125,
    type: 'reflect_hits',
  },
  {
    id: 'm_guardian_kos_1',
    title: 'Sentencia de Hierro',
    description: 'Consigue 2 KOs con Guardián de Hierro.',
    icon: '⚔️',
    target: 2,
    rewardCoins: 110,
    type: 'kos',
    classRequired: 'iron_guardian',
  },
  {
    id: 'm_guardian_damage_1',
    title: 'Impacto Pesado',
    description: 'Inflige 200% de daño con Guardián de Hierro.',
    icon: '🔨',
    target: 200,
    rewardCoins: 95,
    type: 'damage_dealt',
    classRequired: 'iron_guardian',
  },
  {
    id: 'm_guardian_play_2',
    title: 'Bastión Invencible',
    description: 'Juega 4 partidas con Guardián de Hierro.',
    icon: '🛡️',
    target: 4,
    rewardCoins: 140,
    type: 'class_play',
    classRequired: 'iron_guardian',
  },
  {
    id: 'm_guardian_win_2',
    title: 'Fortaleza Triunfante',
    description: 'Gana 2 partidas jugando como Guardián de Hierro.',
    icon: '🏆',
    target: 2,
    rewardCoins: 160,
    type: 'class_win',
    classRequired: 'iron_guardian',
  },

  // ==========================================
  // 4. MAGO GRAVITATORIO (GRAVITY MAGE) - 8 MISIONES
  // ==========================================
  {
    id: 'm_gravity_play_1',
    title: 'Control Espacial',
    description: 'Juega 2 partidas con Mago Gravitatorio.',
    icon: '🧙',
    target: 2,
    rewardCoins: 90,
    type: 'class_play',
    classRequired: 'gravity_mage',
  },
  {
    id: 'm_gravity_win_1',
    title: 'Supremacía Arcana',
    description: 'Gana 1 partida jugando como Mago Gravitatorio.',
    icon: '🔮',
    target: 1,
    rewardCoins: 130,
    type: 'class_win',
    classRequired: 'gravity_mage',
  },
  {
    id: 'm_gravity_ability_1',
    title: 'Vórtice de 360 Grados',
    description: 'Desata el Pulso Gravitatorio 4 veces.',
    icon: '🌀',
    target: 4,
    rewardCoins: 100,
    type: 'class_ability',
    classRequired: 'gravity_mage',
  },
  {
    id: 'm_gravity_kos_1',
    title: 'Expulsión Cósmica',
    description: 'Consigue 3 KOs con el Mago Gravitatorio.',
    icon: '🌌',
    target: 3,
    rewardCoins: 120,
    type: 'kos',
    classRequired: 'gravity_mage',
  },
  {
    id: 'm_gravity_damage_1',
    title: 'Fuerza Psíquica',
    description: 'Inflige 220% de daño con Mago Gravitatorio.',
    icon: '💫',
    target: 220,
    rewardCoins: 95,
    type: 'damage_dealt',
    classRequired: 'gravity_mage',
  },
  {
    id: 'm_gravity_steals_1',
    title: 'Atracción de Botín',
    description: 'Acumula 90 monedas jugando con Mago Gravitatorio.',
    icon: '🪙',
    target: 90,
    rewardCoins: 85,
    type: 'coins_earned',
    classRequired: 'gravity_mage',
  },
  {
    id: 'm_gravity_play_2',
    title: 'Erudito de la Gravedad',
    description: 'Juega 4 partidas con Mago Gravitatorio.',
    icon: '🧙',
    target: 4,
    rewardCoins: 140,
    type: 'class_play',
    classRequired: 'gravity_mage',
  },
  {
    id: 'm_gravity_win_2',
    title: 'Singularidad Ganadora',
    description: 'Gana 2 partidas jugando como Mago Gravitatorio.',
    icon: '🏆',
    target: 2,
    rewardCoins: 160,
    type: 'class_win',
    classRequired: 'gravity_mage',
  },

  // ==========================================
  // 5. ARTIFICIERO TRAMPERO (TRAPSTER) - 8 MISIONES
  // ==========================================
  {
    id: 'm_trapster_play_1',
    title: 'Estratega de Trampas',
    description: 'Juega 2 partidas con Artificiero Trampero.',
    icon: '💣',
    target: 2,
    rewardCoins: 90,
    type: 'class_play',
    classRequired: 'trapster',
  },
  {
    id: 'm_trapster_win_1',
    title: 'Emboscada Perfecta',
    description: 'Gana 1 partida jugando como Artificiero Trampero.',
    icon: '⚙️',
    target: 1,
    rewardCoins: 130,
    type: 'class_win',
    classRequired: 'trapster',
  },
  {
    id: 'm_trapster_ability_1',
    title: 'Campo Minado',
    description: 'Planta 4 Minas Resorte en el suelo de la arena.',
    icon: '💣',
    target: 4,
    rewardCoins: 100,
    type: 'class_ability',
    classRequired: 'trapster',
  },
  {
    id: 'm_trapster_kos_1',
    title: 'Explosión de KO',
    description: 'Consigue 2 KOs con Artificiero Trampero.',
    icon: '💥',
    target: 2,
    rewardCoins: 115,
    type: 'kos',
    classRequired: 'trapster',
  },
  {
    id: 'm_trapster_damage_1',
    title: 'Pólvora y Caos',
    description: 'Inflige 200% de daño con Artificiero Trampero.',
    icon: '🧨',
    target: 200,
    rewardCoins: 95,
    type: 'damage_dealt',
    classRequired: 'trapster',
  },
  {
    id: 'm_trapster_steals_1',
    title: 'Botín Dinamitado',
    description: 'Roba 85 monedas jugando con Artificiero Trampero.',
    icon: '🪙',
    target: 85,
    rewardCoins: 85,
    type: 'coins_earned',
    classRequired: 'trapster',
  },
  {
    id: 'm_trapster_play_2',
    title: 'Genio de la Demolición',
    description: 'Juega 4 partidas con Artificiero Trampero.',
    icon: '💣',
    target: 4,
    rewardCoins: 140,
    type: 'class_play',
    classRequired: 'trapster',
  },
  {
    id: 'm_trapster_win_2',
    title: 'Victoria Explosiva',
    description: 'Gana 2 partidas jugando como Artificiero Trampero.',
    icon: '🏆',
    target: 2,
    rewardCoins: 160,
    type: 'class_win',
    classRequired: 'trapster',
  },

  // ==========================================
  // 6. PIRO-MAGO ÍGNEO (PYRO FIEND) - 8 MISIONES
  // ==========================================
  {
    id: 'm_pyro_play_1',
    title: 'Poder de las Llamas',
    description: 'Juega 2 partidas con Piro-Mago Ígneo.',
    icon: '🔥',
    target: 2,
    rewardCoins: 90,
    type: 'class_play',
    classRequired: 'pyro_fiend',
  },
  {
    id: 'm_pyro_win_1',
    title: 'Calcinación Total',
    description: 'Gana 1 partida jugando como Piro-Mago Ígneo.',
    icon: '🌋',
    target: 1,
    rewardCoins: 130,
    type: 'class_win',
    classRequired: 'pyro_fiend',
  },
  {
    id: 'm_pyro_ability_1',
    title: 'Llamarada Devastadora',
    description: 'Dispara la Llamarada Infernal 4 veces.',
    icon: '🔥',
    target: 4,
    rewardCoins: 100,
    type: 'class_ability',
    classRequired: 'pyro_fiend',
  },
  {
    id: 'm_pyro_kos_1',
    title: 'Cenizas y KO',
    description: 'Consigue 3 KOs jugando con Piro-Mago Ígneo.',
    icon: '🔥',
    target: 3,
    rewardCoins: 120,
    type: 'kos',
    classRequired: 'pyro_fiend',
  },
  {
    id: 'm_pyro_damage_1',
    title: 'Infierno Ardiente',
    description: 'Inflige 240% de daño con fuego abrasador.',
    icon: '🌋',
    target: 240,
    rewardCoins: 100,
    type: 'damage_dealt',
    classRequired: 'pyro_fiend',
  },
  {
    id: 'm_pyro_steals_1',
    title: 'Monedas de Fuego',
    description: 'Roba 90 monedas jugando con Piro-Mago Ígneo.',
    icon: '🪙',
    target: 90,
    rewardCoins: 85,
    type: 'coins_earned',
    classRequired: 'pyro_fiend',
  },
  {
    id: 'm_pyro_play_2',
    title: 'Fénix del Combate',
    description: 'Juega 4 partidas con Piro-Mago Ígneo.',
    icon: '🔥',
    target: 4,
    rewardCoins: 140,
    type: 'class_play',
    classRequired: 'pyro_fiend',
  },
  {
    id: 'm_pyro_win_2',
    title: 'Llama Suprema',
    description: 'Gana 2 partidas jugando como Piro-Mago Ígneo.',
    icon: '🏆',
    target: 2,
    rewardCoins: 160,
    type: 'class_win',
    classRequired: 'pyro_fiend',
  },

  // ==========================================
  // 7. VALQUIRIA GLACIAL (FROST VALKYRIE) - 8 MISIONES
  // ==========================================
  {
    id: 'm_frost_play_1',
    title: 'Guerrera del Hielo',
    description: 'Juega 2 partidas con Valquiria Glacial.',
    icon: '❄️',
    target: 2,
    rewardCoins: 90,
    type: 'class_play',
    classRequired: 'frost_valkyrie',
  },
  {
    id: 'm_frost_win_1',
    title: 'Reina del Cero Absoluto',
    description: 'Gana 1 partida jugando como Valquiria Glacial.',
    icon: '🧊',
    target: 1,
    rewardCoins: 130,
    type: 'class_win',
    classRequired: 'frost_valkyrie',
  },
  {
    id: 'm_frost_ability_1',
    title: 'Carga de Escarcha',
    description: 'Carga el Puño Helado 4 veces.',
    icon: '❄️',
    target: 4,
    rewardCoins: 100,
    type: 'class_ability',
    classRequired: 'frost_valkyrie',
  },
  {
    id: 'm_frost_freeze_1',
    title: 'Congelación Instantánea',
    description: 'Congela y aturde a rivales 3 veces.',
    icon: '🧊',
    target: 3,
    rewardCoins: 115,
    type: 'freeze_enemies',
  },
  {
    id: 'm_frost_kos_1',
    title: 'Shatter KO',
    description: 'Consigue 2 KOs jugando con Valquiria Glacial.',
    icon: '❄️',
    target: 2,
    rewardCoins: 110,
    type: 'kos',
    classRequired: 'frost_valkyrie',
  },
  {
    id: 'm_frost_damage_1',
    title: 'Impacto Glacial',
    description: 'Inflige 200% de daño con Valquiria Glacial.',
    icon: '🧊',
    target: 200,
    rewardCoins: 95,
    type: 'damage_dealt',
    classRequired: 'frost_valkyrie',
  },
  {
    id: 'm_frost_play_2',
    title: 'Señora de la Nieve',
    description: 'Juega 4 partidas con Valquiria Glacial.',
    icon: '❄️',
    target: 4,
    rewardCoins: 140,
    type: 'class_play',
    classRequired: 'frost_valkyrie',
  },
  {
    id: 'm_frost_win_2',
    title: 'Tormenta Eterna',
    description: 'Gana 2 partidas jugando como Valquiria Glacial.',
    icon: '🏆',
    target: 2,
    rewardCoins: 160,
    type: 'class_win',
    classRequired: 'frost_valkyrie',
  },

  // ==========================================
  // 8. NINJA CYBER-VOLT (CYBER NINJA) - 8 MISIONES
  // ==========================================
  {
    id: 'm_ninja_play_1',
    title: 'Velocidad del Rayo',
    description: 'Juega 2 partidas con Ninja Cyber-Volt.',
    icon: '⚡',
    target: 2,
    rewardCoins: 90,
    type: 'class_play',
    classRequired: 'cyber_ninja',
  },
  {
    id: 'm_ninja_win_1',
    title: 'Corte Relámpago Victorioso',
    description: 'Gana 1 partida jugando como Ninja Cyber-Volt.',
    icon: '🌩️',
    target: 1,
    rewardCoins: 130,
    type: 'class_win',
    classRequired: 'cyber_ninja',
  },
  {
    id: 'm_ninja_ability_1',
    title: 'Dash Electromagnético',
    description: 'Ejecuta el Dash Relámpago 4 veces.',
    icon: '⚡',
    target: 4,
    rewardCoins: 100,
    type: 'class_ability',
    classRequired: 'cyber_ninja',
  },
  {
    id: 'm_ninja_kos_1',
    title: 'KO a la Velocidad de la Luz',
    description: 'Consigue 3 KOs con Ninja Cyber-Volt.',
    icon: '⚡',
    target: 3,
    rewardCoins: 120,
    type: 'kos',
    classRequired: 'cyber_ninja',
  },
  {
    id: 'm_ninja_damage_1',
    title: 'Sobrecarga Eléctrica',
    description: 'Inflige 200% de daño con Ninja Cyber-Volt.',
    icon: '💛',
    target: 200,
    rewardCoins: 95,
    type: 'damage_dealt',
    classRequired: 'cyber_ninja',
  },
  {
    id: 'm_ninja_steals_1',
    title: 'Robo a Mil Por Hora',
    description: 'Roba 100 monedas jugando con Ninja Cyber-Volt.',
    icon: '🪙',
    target: 100,
    rewardCoins: 90,
    type: 'coins_earned',
    classRequired: 'cyber_ninja',
  },
  {
    id: 'm_ninja_play_2',
    title: 'Ciberguerrero Imparable',
    description: 'Juega 4 partidas con Ninja Cyber-Volt.',
    icon: '⚡',
    target: 4,
    rewardCoins: 140,
    type: 'class_play',
    classRequired: 'cyber_ninja',
  },
  {
    id: 'm_ninja_win_2',
    title: 'Rayo Dorado Invicto',
    description: 'Gana 2 partidas jugando como Ninja Cyber-Volt.',
    icon: '🏆',
    target: 2,
    rewardCoins: 160,
    type: 'class_win',
    classRequired: 'cyber_ninja',
  },

  // ==========================================
  // 9. MAPAS & DESAFÍOS DE COMBATE Y OBJETOS
  // ==========================================
  {
    id: 'm_crazy_button_master',
    title: '¡Amo del Botón Loco!',
    description: 'Pulsa el Botón Central durante eventos locos 2 veces.',
    icon: '⚡',
    target: 2,
    rewardCoins: 110,
    type: 'press_crazy_button',
  },
  {
    id: 'm_item_collector',
    title: 'Coleccionista de Power-ups',
    description: 'Recoge 5 objetos de combate en las arenas (Poción, Escudo, Corazón, Bate).',
    icon: '🧪',
    target: 5,
    rewardCoins: 95,
    type: 'pick_items',
  },
  {
    id: 'm_crate_smasher',
    title: 'Destructor de Cajas',
    description: 'Rompe 3 Cajas Sorpresa de madera con tu guante.',
    icon: '📦',
    target: 3,
    rewardCoins: 85,
    type: 'break_crates',
  },
  {
    id: 'm_homerun_hitter',
    title: 'Bateador de Home-Run',
    description: 'Conecta 2 golpes críticos demoledores con el Bate Smash Dorado.',
    icon: '⚾',
    target: 2,
    rewardCoins: 120,
    type: 'home_runs',
  },
  {
    id: 'm_ring_out_master',
    title: 'Rey de las Expulsiones',
    description: 'Consigue 5 KOs expulsando oponentes del ring.',
    icon: '🥊',
    target: 5,
    rewardCoins: 150,
    type: 'kos',
  },
  {
    id: 'm_bounty_master',
    title: 'Cazador de Fortunas',
    description: 'Roba y acumula 200 monedas en partidas.',
    icon: '🪙',
    target: 200,
    rewardCoins: 120,
    type: 'coins_earned',
  },
  {
    id: 'm_volcano_master',
    title: 'Dominio del Magma',
    description: 'Gana 1 partida en la arena Volcán de Magma.',
    icon: '🌋',
    target: 1,
    rewardCoins: 120,
    type: 'win_matches',
    arenaRequired: 'magma_volcano',
  },
  {
    id: 'm_space_brawler',
    title: 'Gladiador Cósmico',
    description: 'Juega 2 partidas en la Estación Cósmica.',
    icon: '🌌',
    target: 2,
    rewardCoins: 100,
    type: 'play_arena',
    arenaRequired: 'cyber_space',
  },
  {
    id: 'm_neon_champion',
    title: 'Rey de Neón',
    description: 'Gana 1 partida en la Ciudad Cyberpunk.',
    icon: '🏙️',
    target: 1,
    rewardCoins: 120,
    type: 'win_matches',
    arenaRequired: 'neon_city',
  },
  {
    id: 'm_temple_survivor',
    title: 'Explorador del Templo',
    description: 'Juega 2 partidas en las Ruinas Antiguas.',
    icon: '🏛️',
    target: 2,
    rewardCoins: 95,
    type: 'play_arena',
    arenaRequired: 'ancient_temple',
  },
];

export function generateDailyMissions(): DailyMission[] {
  // Select 6 diverse daily missions
  const shuffled = [...MISSION_TEMPLATES].sort(() => 0.5 - Math.random());

  // Guarantee distinct types / classes
  const selected: typeof MISSION_TEMPLATES = [];
  const seenTypes = new Set<string>();

  for (const m of shuffled) {
    const key = `${m.type}_${m.classRequired || ''}_${m.arenaRequired || ''}`;
    if (!seenTypes.has(key)) {
      seenTypes.add(key);
      selected.push(m);
      if (selected.length >= 6) break;
    }
  }

  // Fallback if not enough
  while (selected.length < 6 && selected.length < MISSION_TEMPLATES.length) {
    const remaining = MISSION_TEMPLATES.filter((m) => !selected.some((s) => s.id === m.id));
    if (remaining.length === 0) break;
    selected.push(remaining[Math.floor(Math.random() * remaining.length)]);
  }

  return selected.map((m) => ({
    ...m,
    current: 0,
    completed: false,
    claimed: false,
  }));
}
