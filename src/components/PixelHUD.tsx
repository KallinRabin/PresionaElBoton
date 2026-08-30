import React, { useState } from 'react';
import { PlayerStats, GameEvent, ButtonSkin, EliminationEvent, CrazyButtonEvent } from '../types';
import { PLAYER_CLASSES } from '../data/classes';
import { BATTLE_ITEMS } from '../data/items';
import { VirtualJoystick } from './VirtualJoystick';

interface PixelHUDProps {
  playerStats: PlayerStats;
  allStats: PlayerStats[];
  timeLeft: number;
  currentEvent: GameEvent | null;
  crazyEvent?: CrazyButtonEvent | null;
  isTitanActive?: boolean;
  buttonSkin?: ButtonSkin;
  recentKillEvent?: EliminationEvent | null;
  onPunch: () => void;
  onAbility: () => void;
  onJump: () => void;
  onJoystickMove: (vec: { x: number; y: number }) => void;
  onPause: () => void;
  isTouchDevice?: boolean;
}

export const PixelHUD: React.FC<PixelHUDProps> = ({
  playerStats,
  allStats,
  timeLeft,
  currentEvent,
  crazyEvent,
  isTitanActive,
  buttonSkin,
  recentKillEvent,
  onPunch,
  onAbility,
  onJump,
  onJoystickMove,
  onPause,
  isTouchDevice = true,
}) => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const playerClass = PLAYER_CLASSES.find((c) => c.id === playerStats.classId) || PLAYER_CLASSES[0];
  const sortedStats = [...allStats].sort((a, b) => b.coins - a.coins);

  // Smash Damage % styling color gradient
  const getDamageColor = (dmg: number) => {
    if (dmg >= 160) return 'text-red-500 font-extrabold animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]';
    if (dmg >= 120) return 'text-red-400 font-bold drop-shadow-[0_0_6px_rgba(248,113,113,0.7)]';
    if (dmg >= 80) return 'text-orange-400 font-bold';
    if (dmg >= 40) return 'text-yellow-300 font-bold';
    return 'text-yellow-100';
  };

  const activeItemDef = playerStats.activeItem
    ? BATTLE_ITEMS.find((i) => i.type === playerStats.activeItem)
    : null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-2.5 sm:p-4 select-none">
      {/* 1. TOP BAR: Coins, Timer, Event, Rank & Pause */}
      <div className="flex flex-col gap-1.5 w-full max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-2 w-full">
          {/* Coin Bank */}
          <div
            id="hud-coin-counter"
            className="pointer-events-auto pixel-box-gold px-3 sm:px-4 py-1.5 flex items-center gap-2"
          >
            <span className="text-lg sm:text-xl animate-pixel-float">🪙</span>
            <div>
              <div className="text-[8px] sm:text-[9px] font-pixel-body text-amber-950 font-bold">MONEDAS</div>
              <div className="text-sm sm:text-base font-pixel-heading text-black font-bold">
                {playerStats.coins}
              </div>
            </div>
          </div>

          {/* Timer & Match Event */}
          <div className="flex flex-col items-center gap-1">
            <div
              id="hud-timer-box"
              className="pointer-events-auto pixel-box-dark px-3 sm:px-5 py-1 flex items-center gap-2"
              style={{ borderColor: timeLeft <= 15 ? '#ef4444' : '#6366f1' }}
            >
              <span className={`text-xs sm:text-sm ${timeLeft <= 15 ? 'text-red-500 animate-pixel-blink' : 'text-indigo-400'}`}>
                ⏱️
              </span>
              <span
                className={`text-xs sm:text-base font-pixel-heading tracking-wider ${
                  timeLeft <= 15 ? 'text-red-400 animate-pixel-blink' : 'text-white'
                }`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>

            {currentEvent && (
              <div
                id="hud-event-banner"
                className="pixel-box-red px-2 py-0.5 text-center animate-bounce flex items-center gap-1 shadow-lg"
              >
                <span className="text-[10px]">⚡</span>
                <span className="font-pixel-heading text-[8px] sm:text-[9px] text-white uppercase">
                  {currentEvent.title}
                </span>
                <span className="font-pixel-body text-[8px] text-yellow-200 bg-red-950 px-1">
                  {Math.ceil(currentEvent.timeLeft)}s
                </span>
              </div>
            )}
          </div>

          {/* Position & Pause */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div
              id="hud-rank-pill"
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="pointer-events-auto pixel-btn pixel-box-blue px-2.5 sm:px-3 py-1 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="text-xs">🏆</span>
              <div>
                <div className="text-[7px] sm:text-[8px] font-pixel-body text-sky-950 font-bold uppercase">RANGO</div>
                <div className="text-[10px] sm:text-xs font-pixel-heading text-white">#{playerStats.rank}</div>
              </div>
            </div>

            <button
              id="hud-pause-btn"
              onClick={onPause}
              className="pointer-events-auto pixel-btn pixel-box-dark w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-white text-xs sm:text-sm hover:bg-zinc-800"
              title="Pausar"
            >
              ⏸️
            </button>
          </div>
        </div>

        {/* COMPACT TOP FIGHTERS STRIP (Sits at top, NEVER blocking center screen) */}
        <div className="grid grid-cols-4 gap-1 sm:gap-2 w-full pointer-events-none">
          {allStats.map((st) => {
            const isMe = st.isPlayer;
            const dmg = Math.round(st.damagePercent);
            return (
              <div
                key={st.id}
                className={`p-1 sm:p-1.5 flex items-center justify-between rounded border transition-all ${
                  st.isEliminated
                    ? 'bg-red-950/40 border-red-900/60 opacity-60'
                    : isMe
                    ? 'bg-zinc-950/90 border-sky-400 shadow-md ring-1 ring-sky-400/40'
                    : 'bg-zinc-950/75 border-zinc-700/60 opacity-90'
                }`}
              >
                <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 truncate">
                  <div
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-xs shrink-0"
                    style={{ backgroundColor: st.color }}
                  >
                    {st.isEliminated ? '💀' : st.classIcon}
                  </div>
                  <div className="min-w-0 truncate">
                    <div className={`text-[8px] sm:text-[9px] font-pixel-body truncate font-bold ${isMe ? 'text-sky-300' : 'text-zinc-300'}`}>
                      {st.name}
                    </div>
                    <div className="text-[7px] sm:text-[8px] font-pixel-body text-zinc-400 flex items-center gap-0.5">
                      {st.stocks > 0 ? '❤️'.repeat(Math.min(3, st.stocks)) : 'ELIMINADO'}
                    </div>
                  </div>
                </div>

                {/* Smash % & Coins */}
                <div className="text-right pl-1 shrink-0 flex flex-col items-end">
                  <div className={`font-pixel-heading text-xs sm:text-sm ${getDamageColor(dmg)}`}>
                    {st.isEliminated ? 'KO' : `${dmg}%`}
                  </div>
                  <div className="text-[7px] sm:text-[8px] font-pixel-body text-amber-400">
                    🪙 {st.coins}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CRAZY BUTTON EVENT ALERT */}
        {crazyEvent && (
          <div
            id="hud-crazy-button-alert"
            className="self-center pixel-box-red px-3 py-1 flex items-center gap-2 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.8)] border-2 border-yellow-300 pointer-events-none mt-1"
            style={{ backgroundColor: crazyEvent.glowColor || '#ef4444' }}
          >
            <span className="text-base animate-bounce">{crazyEvent.icon}</span>
            <div className="text-left">
              <div className="font-pixel-heading text-[8px] sm:text-[9px] text-black font-extrabold uppercase">
                ⚡ ¡BOTÓN LOCO: {crazyEvent.title}! ⚡ ({Math.ceil(crazyEvent.timeLeft)}s)
              </div>
              <div className="font-pixel-body text-[8px] text-black/80 font-bold">
                {crazyEvent.description}
              </div>
            </div>
          </div>
        )}

        {/* TITAN MODE ACTIVE BUFF ALERT */}
        {isTitanActive && (
          <div className="self-center pixel-box-gold px-3 py-0.5 flex items-center gap-1.5 animate-bounce pointer-events-none mt-0.5 shadow-[0_0_15px_rgba(245,158,11,0.9)]">
            <span className="text-base">👑</span>
            <span className="font-pixel-heading text-[8px] sm:text-[9px] text-black font-extrabold">
              ¡MODO TITÁN GIGANTE ACTIVO! (+EMPUJE +FUERZA +ARMADURA)
            </span>
          </div>
        )}

        {/* ICE CHARGED GLOVE BUFF ALERT */}
        {playerStats.hasIceCharged && (
          <div className="self-center pixel-box-blue px-3 py-0.5 flex items-center gap-1.5 animate-pulse pointer-events-none mt-0.5 shadow-[0_0_15px_rgba(6,182,212,0.9)] border-2 border-cyan-300">
            <span className="text-base animate-bounce">❄️</span>
            <span className="font-pixel-heading text-[8px] sm:text-[9px] text-white font-extrabold">
              ¡PUÑO HELADO CARGADO! EL SIGUIENTE IMPACTO CONGELARÁ 1.0s
            </span>
          </div>
        )}

        {/* ACTIVE ITEM BUFF ALERT */}
        {activeItemDef && (
          <div className="self-center pixel-box-gold px-2.5 py-0.5 flex items-center gap-1.5 animate-bounce pointer-events-none mt-0.5">
            <span className="text-sm">{activeItemDef.icon}</span>
            <span className="font-pixel-heading text-[8px] sm:text-[9px] text-black font-bold">
              ¡{activeItemDef.name.toUpperCase()} ACTIVO! ({Math.ceil(playerStats.itemTimeLeft)}s)
            </span>
          </div>
        )}

        {/* RECENT KILL BANNER OVERLAY NOTIFICATION */}
        {recentKillEvent && (
          <div className="self-center w-full max-w-md animate-pixel-fade-in pointer-events-none mt-1">
            <div
              className={`p-2 border-2 flex items-center justify-between gap-3 bg-gradient-to-r ${recentKillEvent.killerBanner.bgGradient} shadow-[0_0_15px_rgba(0,0,0,0.8)]`}
              style={{ borderColor: recentKillEvent.killerBanner.borderColor }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{recentKillEvent.killerBanner.icon}</span>
                <div>
                  <div className="text-[9px] font-pixel-body text-zinc-300">
                    <span className="font-bold font-pixel-heading" style={{ color: recentKillEvent.killerBanner.textColor }}>
                      {recentKillEvent.killerName}
                    </span>{' '}
                    eliminó a <span className="text-white font-bold">{recentKillEvent.victimName}</span>
                  </div>
                  <div className="text-[8px] font-pixel-body italic text-zinc-400">
                    "{recentKillEvent.killerBanner.title}"
                  </div>
                </div>
              </div>
              <span
                className="text-[8px] font-pixel-heading px-1 py-0.5 border"
                style={{
                  borderColor: recentKillEvent.killerBanner.borderColor,
                  color: recentKillEvent.killerBanner.textColor,
                }}
              >
                {recentKillEvent.killerBanner.badgeText || 'SMASH KO'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. CENTER RETRO 3RD-PERSON CROSSHAIR */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="relative w-8 h-8 flex items-center justify-center opacity-85">
          {/* Outer Crosshair Segments */}
          <div className="absolute w-2 h-0.5 bg-sky-400 -left-2 shadow-[0_0_4px_#38bdf8]" />
          <div className="absolute w-2 h-0.5 bg-sky-400 -right-2 shadow-[0_0_4px_#38bdf8]" />
          <div className="absolute h-2 w-0.5 bg-sky-400 -top-2 shadow-[0_0_4px_#38bdf8]" />
          <div className="absolute h-2 w-0.5 bg-sky-400 -bottom-2 shadow-[0_0_4px_#38bdf8]" />
          {/* Center Target Dot */}
          <div className="w-1.5 h-1.5 bg-yellow-300 rounded-none border border-black shadow-[0_0_6px_#fde047]" />
        </div>
      </div>

      {/* 3. BOTTOM TACTICAL CONTROLS */}
      <div className="flex items-end justify-between gap-3 w-full pointer-events-none z-10">
        {/* LEFT: Touch Joystick / Keyboard & Mouse Look Hint */}
        <div className="pointer-events-auto">
          {isTouchDevice ? (
            <VirtualJoystick onMove={onJoystickMove} />
          ) : (
            <div className="pixel-box-dark p-2 bg-black/80 hidden sm:block border-zinc-700/80 shadow-lg">
              <div className="text-[9px] font-pixel-body text-zinc-300 space-y-1">
                <div className="flex items-center gap-1.5 text-sky-300 font-bold">
                  <span>🖱️</span>
                  <span>Mover Ratón: Girar Cámara / Apuntar</span>
                </div>
                <div><span className="text-yellow-300">[W,A,S,D]</span> Moverse hacia la mira</div>
                <div><span className="text-emerald-400">[ESPACIO]</span> Saltar / Doble Salto Aéreo</div>
                <div><span className="text-red-400">[Click Izq / F]</span> Golpe de Guante (Robo)</div>
                <div><span className="text-purple-400">[E]</span> Habilidad: {playerClass.ability.name}</div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Action & Class Ability Buttons */}
        <div className="pointer-events-auto flex items-end gap-2 sm:gap-3">
          {/* 1. UNIQUE CLASS SIGNATURE ABILITY BUTTON [TECLA E] */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              id="hud-btn-class-ability"
              tabIndex={-1}
              onFocus={(e) => e.currentTarget.blur()}
              onClick={onAbility}
              disabled={playerStats.abilityCooldown > 0 || playerStats.isStunned}
              className={`w-14 h-14 sm:w-16 sm:h-16 pixel-btn pixel-box-purple flex flex-col items-center justify-center relative overflow-hidden ${
                playerStats.abilityCooldown > 0 || playerStats.isStunned ? 'opacity-60 grayscale' : 'hover:scale-105'
              }`}
            >
              <span className="text-xl sm:text-2xl">{playerClass.ability.icon}</span>
              <span className="font-pixel-heading text-[7px] sm:text-[8px] text-white font-bold truncate px-1">
                {playerClass.ability.name.substring(0, 8)}
              </span>

              {/* Cooldown Overlay */}
              {playerStats.abilityCooldown > 0 && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center font-pixel-heading text-xs text-yellow-300">
                  {Math.ceil(playerStats.abilityCooldown)}s
                </div>
              )}
            </button>
            <span className="text-[8px] sm:text-[9px] font-pixel-body text-purple-300 font-bold">[TECLA E]</span>
          </div>

          {/* 2. JUMP BUTTON [ESPACIO] */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              id="hud-btn-jump"
              tabIndex={-1}
              onFocus={(e) => e.currentTarget.blur()}
              onClick={onJump}
              disabled={playerStats.isStunned}
              className="w-13 h-13 sm:w-15 sm:h-15 pixel-btn pixel-box-green p-2 flex flex-col items-center justify-center hover:scale-105"
            >
              <span className="text-lg sm:text-xl">🦘</span>
              <span className="font-pixel-heading text-[8px] text-white font-bold">SALTAR</span>
            </button>
            <span className="text-[8px] sm:text-[9px] font-pixel-body text-emerald-300 font-bold">[ESPACIO]</span>
          </div>

          {/* 3. PRIMARY STEAL GLOVE PUNCH BUTTON [CLICK IZQ / F] with custom button skin */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              id="hud-btn-punch"
              tabIndex={-1}
              onFocus={(e) => e.currentTarget.blur()}
              onClick={onPunch}
              disabled={playerStats.attackCooldown > 0 || playerStats.isStunned}
              className={`w-16 h-16 sm:w-20 sm:h-20 pixel-btn flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                buttonSkin?.hudGlowClass || 'pixel-box-red'
              } ${
                playerStats.attackCooldown > 0 || playerStats.isStunned ? 'opacity-60 grayscale' : 'hover:scale-105 animate-pulse'
              }`}
            >
              <span className="text-2xl sm:text-3xl">🥊</span>
              <span className="font-pixel-heading text-[8px] sm:text-[9px] text-yellow-200 font-bold uppercase">
                GUANTE ROBO
              </span>

              {playerStats.attackCooldown > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-pixel-heading text-xs text-red-300">
                  ...
                </div>
              )}
            </button>
            <span className="text-[8px] sm:text-[9px] font-pixel-body text-red-300 font-bold">[CLICK IZQ / F]</span>
          </div>
        </div>
      </div>
    </div>
  );
};

