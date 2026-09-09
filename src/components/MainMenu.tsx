import React from 'react';
import { GameMode, CharacterSkin, ClassId, ArenaId } from '../types';
import { PLAYER_CLASSES } from '../data/classes';
import { ARENAS } from '../data/arenas';
import { sound } from '../game/audio';

interface MainMenuProps {
  totalCoins: number;
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
  selectedSkin: CharacterSkin;
  selectedClassId: ClassId;
  selectedMode: GameMode;
  selectedArenaId: ArenaId;
  unclaimedMissionsCount?: number;
  onSelectMode: (mode: GameMode) => void;
  onSelectArena: (arenaId: ArenaId) => void;
  onOpenClassSelect: () => void;
  onStartGame: () => void;
  onOpenShop: () => void;
  onOpenMissions: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
  onOpenMultiplayer: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isMobile?: boolean;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  totalCoins,
  playerName,
  onUpdatePlayerName,
  selectedSkin,
  selectedClassId,
  selectedMode,
  selectedArenaId,
  unclaimedMissionsCount = 0,
  onSelectMode,
  onSelectArena,
  onOpenClassSelect,
  onStartGame,
  onOpenShop,
  onOpenMissions,
  onOpenHowToPlay,
  onOpenSettings,
  onOpenMultiplayer,
  isFullscreen = false,
  onToggleFullscreen,
  isMobile = false,
}) => {
  const currentClass = PLAYER_CLASSES.find((c) => c.id === selectedClassId) || PLAYER_CLASSES[0];

  const getSkinIcon = () => {
    if (selectedSkin.hatType === 'crown') return '👑';
    if (selectedSkin.hatType === 'ninja') return '🥷';
    if (selectedSkin.hatType === 'antenna') return '🤖';
    if (selectedSkin.hatType === 'horns') return '🦖';
    if (selectedSkin.hatType === 'hood') return '🔮';
    if (selectedSkin.hatType === 'pirate') return '🏴‍☠️';
    return currentClass.icon;
  };

  const isStandardSkin = selectedSkin.price === 0;

  const modes: Array<{ id: GameMode; title: string; desc: string; icon: string; tag: string; isFeatured?: boolean }> = [
    {
      id: 'stock_battle',
      title: 'SUPERVIVENCIA',
      desc: '3 Vidas por luchador. El último en pie se corona campeón.',
      icon: '❤️',
      tag: 'VIDAS LIMITADAS',
    },
    {
      id: 'classic',
      title: 'SMASH CLÁSICO',
      desc: '¡Lucha por el Botón Central! Activa eventos de Botón Loco (Titán, Ondas y Rayos).',
      icon: '⚡',
      tag: '🔥 BOTÓN LOCO ACTIVO',
      isFeatured: true,
    },
    {
      id: 'coin_frenzy',
      title: 'CAOS DE OBJETOS',
      desc: '60s frenéticos: cajas sorpresa, bates dorados y bombas continuas.',
      icon: '💣',
      tag: 'OBJETOS EXTRA',
    },
  ];

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-between p-2.5 sm:p-4 bg-gradient-to-b from-[#090a14]/95 via-[#121324]/95 to-[#090a14]/95 overflow-y-auto overflow-x-hidden select-none">
      {/* 1. TOP HEADER BAR */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-2 shrink-0">
        {/* Coin Bank */}
        <div id="menu-coin-balance" className="pixel-box-gold px-3 py-1 flex items-center gap-1.5">
          <span className="text-base sm:text-lg animate-pixel-float">🪙</span>
          <div>
            <div className="text-[8px] font-pixel-body text-amber-950 font-bold leading-none">BANCO</div>
            <div className="text-xs sm:text-sm font-pixel-heading text-black font-bold">{totalCoins}</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Daily Missions Button */}
          <button
            id="menu-btn-missions"
            onClick={() => {
              sound.playCoin();
              onOpenMissions();
            }}
            className="pixel-btn pixel-box-gold px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-pixel-heading text-black flex items-center gap-1 relative hover:scale-105"
          >
            <span>📜</span>
            <span className="hidden sm:inline">MISIONES</span>
            {unclaimedMissionsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[8px] font-pixel-heading px-1 rounded-full animate-bounce border border-white">
                !
              </span>
            )}
          </button>

          <button
            id="menu-btn-guide"
            onClick={() => {
              sound.playCoin();
              onOpenHowToPlay();
            }}
            className="pixel-btn pixel-box-dark px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-pixel-body text-zinc-300 hover:text-white flex items-center gap-1"
          >
            <span>📖</span> <span className="hidden sm:inline">GUÍA</span>
          </button>

          <button
            id="menu-btn-shop"
            onClick={() => {
              sound.playCoin();
              onOpenShop();
            }}
            className="pixel-btn pixel-box-purple px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-pixel-body text-white flex items-center gap-1"
          >
            <span>🛒</span> <span className="hidden sm:inline">TIENDA</span>
          </button>

          {/* Fullscreen Button */}
          {onToggleFullscreen && (
            <button
              id="menu-btn-fullscreen"
              onClick={() => {
                sound.playCoin();
                onToggleFullscreen();
              }}
              className={`pixel-btn px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-pixel-heading flex items-center gap-1 ${
                isFullscreen
                  ? 'pixel-box-green bg-emerald-600 text-white'
                  : 'pixel-box-gold bg-amber-500 text-black animate-pulse'
              }`}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Activar pantalla completa'}
            >
              <span>{isFullscreen ? '🗗' : '⛶'}</span>
              <span className="hidden sm:inline">{isFullscreen ? 'SALIR' : 'PANTALLA'}</span>
            </button>
          )}

          <button
            id="menu-btn-settings"
            onClick={() => {
              sound.playCoin();
              onOpenSettings();
            }}
            className="pixel-btn pixel-box-dark p-1.5 text-xs sm:text-sm text-white hover:bg-zinc-800"
            title="Ajustes"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* MOBILE FULLSCREEN PROMPT BANNER */}
      {isMobile && !isFullscreen && onToggleFullscreen && (
        <div
          id="menu-mobile-fullscreen-banner"
          onClick={() => {
            sound.playCoin();
            onToggleFullscreen();
          }}
          className="w-full max-w-4xl pixel-btn pixel-box-gold bg-amber-500 text-black px-3 py-1.5 flex items-center justify-between gap-2 cursor-pointer shadow-xl animate-pulse shrink-0 my-1"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0 animate-bounce">📱</span>
            <div className="text-left leading-tight truncate">
              <div className="font-pixel-heading text-[8px] sm:text-[9px] font-bold text-amber-950 uppercase">
                PANTALLA COMPLETA
              </div>
              <div className="font-pixel-body text-[8px] sm:text-[9px] text-zinc-900 truncate font-semibold">
                Toca aquí para ocultar barras del navegador y jugar al 100%
              </div>
            </div>
          </div>
          <span className="font-pixel-heading text-[8px] sm:text-[9px] bg-black text-yellow-300 px-2 py-1 border border-yellow-400 shrink-0">
            ACTIVAR ⛶
          </span>
        </div>
      )}

      {/* 2. CENTER CONTENT CONTAINER (Flexible, perfectly scaled) */}
      <div className="flex-1 flex flex-col items-center justify-evenly max-w-3xl w-full py-1">
        {/* Title Banner */}
        <div className="relative">
          <div className="pixel-box-red px-5 sm:px-8 py-2 sm:py-3 transform -rotate-1 shadow-2xl">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-pixel-heading text-yellow-300 pixel-text-stroke tracking-wider">
              SMASH DEL BOTÓN
            </h1>
          </div>
        </div>

        {/* PROFILE ROW: Name Input + Class Preview + Skin Indicator */}
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-2 my-1 max-w-3xl">
          {/* Player Name Customizer (5 cols on md) */}
          <div className="md:col-span-5 pixel-box-dark px-3 py-1.5 bg-zinc-900/90 border-2 border-amber-500 flex items-center gap-2">
            <span className="text-lg shrink-0">👤</span>
            <div className="flex-1 min-w-0">
              <label className="block text-[8px] font-pixel-body text-amber-400 uppercase font-bold leading-tight">
                NOMBRE DEL LUCHADOR:
              </label>
              <input
                id="menu-player-name-input"
                type="text"
                maxLength={14}
                value={playerName}
                onChange={(e) => onUpdatePlayerName(e.target.value)}
                placeholder="TU NOMBRE..."
                className="w-full bg-zinc-950 border border-zinc-700 px-2 py-0.5 text-xs font-pixel-heading text-yellow-300 placeholder-zinc-600 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Active Class Pill (4 cols on md) */}
          <div
            id="menu-class-preview"
            onClick={() => {
              sound.playCoin();
              onOpenClassSelect();
            }}
            className="md:col-span-4 pixel-btn pixel-box-dark px-2.5 py-1.5 flex items-center justify-between gap-1.5 bg-zinc-900/90 border-2 border-sky-400 hover:scale-105 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-7 h-7 pixel-box-sm flex items-center justify-center text-sm shrink-0"
                style={{ backgroundColor: currentClass.color }}
              >
                {currentClass.icon}
              </div>
              <div className="text-left min-w-0">
                <div className="text-[7px] font-pixel-body text-sky-400 font-bold uppercase leading-none">
                  CLASE ELEGIDA
                </div>
                <div className="text-[10px] sm:text-xs font-pixel-heading text-white truncate">
                  {currentClass.name}
                </div>
              </div>
            </div>
            <span className="text-[8px] font-pixel-heading text-sky-300 bg-sky-950 px-1.5 py-0.5 border border-sky-600 shrink-0">
              CAMBIAR ⮞
            </span>
          </div>

          {/* Active Skin Pill (3 cols on md) */}
          <div
            id="menu-skin-preview"
            onClick={() => {
              sound.playCoin();
              onOpenShop();
            }}
            className={`md:col-span-3 pixel-btn pixel-box-dark px-2.5 py-1.5 flex items-center justify-between gap-1.5 bg-zinc-900/90 border-2 hover:scale-105 cursor-pointer ${
              !isStandardSkin ? 'border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'border-zinc-600'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-7 h-7 pixel-box-sm flex items-center justify-center text-sm shrink-0 relative"
                style={{ backgroundColor: selectedSkin.color }}
              >
                <span>{getSkinIcon()}</span>
              </div>
              <div className="text-left min-w-0">
                <div className="text-[7px] font-pixel-body text-amber-400 font-bold uppercase leading-none">
                  SKIN EN USO
                </div>
                <div className="text-[10px] sm:text-xs font-pixel-heading text-yellow-300 truncate">
                  {selectedSkin.name}
                </div>
              </div>
            </div>
            <span className="text-[8px] font-pixel-heading text-amber-300 bg-amber-950 px-1.5 py-0.5 border border-amber-600 shrink-0">
              ARMARIO ➔
            </span>
          </div>
        </div>

        {/* GAME MODES (Classic in the middle) */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2 my-1">
          {modes.map((m) => {
            const isSelected = selectedMode === m.id;
            return (
              <div
                key={m.id}
                onClick={() => {
                  sound.playCoin();
                  onSelectMode(m.id);
                }}
                className={`pixel-btn p-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? m.isFeatured
                      ? 'pixel-box-red bg-red-950 scale-105 border-2 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                      : 'pixel-box-blue bg-sky-950 scale-105 border-2 border-sky-300'
                    : 'pixel-box-dark bg-zinc-900/90 hover:bg-zinc-800 opacity-85'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-base sm:text-lg">{m.icon}</span>
                    <span className={`text-[7px] sm:text-[8px] font-pixel-body px-1 py-0.5 bg-black/70 border ${
                      m.isFeatured ? 'text-yellow-300 border-yellow-500 font-bold' : 'text-sky-300 border-sky-700'
                    }`}>
                      {m.tag}
                    </span>
                  </div>
                  <div className="font-pixel-heading text-[10px] sm:text-xs text-white">
                    {m.title}
                  </div>
                  <div className="font-pixel-body text-[8px] sm:text-[9px] text-zinc-300 leading-tight mt-0.5">
                    {m.desc}
                  </div>
                </div>
                {isSelected && (
                  <div className="mt-1 text-[7px] sm:text-[8px] font-pixel-heading text-yellow-300">
                    ► SELECCIONADO
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* THEMATIC ARENA SELECTOR */}
        <div className="w-full my-1">
          <div className="text-left font-pixel-heading text-[9px] sm:text-[10px] text-zinc-300 mb-1 flex items-center gap-1.5">
            <span>🏟️</span> <span>SELECCIONA LA ARENA DE BATALLA:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {ARENAS.map((arena) => {
              const isSelected = selectedArenaId === arena.id;
              return (
                <div
                  key={arena.id}
                  onClick={() => {
                    sound.playCoin();
                    onSelectArena(arena.id);
                  }}
                  className={`pixel-btn p-1.5 sm:p-2 text-left cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-zinc-900 border-2 scale-105'
                      : 'bg-zinc-950/90 border border-zinc-800 hover:bg-zinc-900/90 hover:border-zinc-700 opacity-80'
                  }`}
                  style={{
                    borderColor: isSelected ? arena.themeColor : undefined,
                    boxShadow: isSelected ? `0 0 10px ${arena.themeColor}55` : undefined,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-base sm:text-lg shrink-0 p-0.5 bg-black/60 border border-zinc-800 flex items-center justify-center">
                      {arena.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-pixel-heading text-[9px] sm:text-[10px] text-white leading-tight">
                        {arena.name}
                      </div>
                      <div
                        className="font-pixel-body text-[7px] sm:text-[8px] uppercase font-bold tracking-wide mt-0.5"
                        style={{ color: arena.themeColor }}
                      >
                        {arena.subtitle}
                      </div>
                    </div>
                  </div>
                  {isSelected ? (
                    <div
                      className="text-[7px] font-pixel-heading px-1 py-0.5 mt-1 text-center font-bold"
                      style={{
                        backgroundColor: `${arena.themeColor}25`,
                        color: arena.themeColor,
                        border: `1px solid ${arena.themeColor}`,
                      }}
                    >
                      ► SELECCIONADA
                    </div>
                  ) : (
                    <div className="text-[7px] font-pixel-body text-zinc-500 mt-0.5 text-center">
                      CLIC PARA ELEGIR
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. DUAL PLAY BUTTONS (SOLO VS BOTS / MULTIJUGADOR ONLINE) */}
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 shrink-0">
          <button
            id="menu-btn-play"
            onClick={() => {
              sound.playButtonSlam();
              onStartGame();
            }}
            className="pixel-btn pixel-box-red py-2 sm:py-2.5 px-4 flex items-center justify-center gap-2 text-xs sm:text-base font-pixel-heading text-yellow-200 pixel-text-stroke shadow-xl hover:scale-105"
          >
            <span>🥊</span>
            <span>JUGAR VS BOTS</span>
          </button>

          <button
            id="menu-btn-multiplayer"
            onClick={() => {
              sound.playBigCoin();
              onOpenMultiplayer();
            }}
            className="pixel-btn pixel-box-blue py-2 sm:py-2.5 px-4 flex items-center justify-center gap-2 text-xs sm:text-base font-pixel-heading text-white pixel-text-stroke shadow-xl hover:scale-105 border-2 border-cyan-300 animate-pulse"
          >
            <span>🌐</span>
            <span>MULTIJUGADOR ONLINE</span>
          </button>
        </div>
      </div>

      {/* 4. BOTTOM CONTAINER */}
      <div className="h-1 shrink-0" />
    </div>
  );
};
