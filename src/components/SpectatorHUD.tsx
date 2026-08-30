import React from 'react';
import { PlayerStats } from '../types';
import { sound } from '../game/audio';

interface SpectatorHUDProps {
  spectatedStats: PlayerStats | null;
  aliveCount: number;
  onCycleTarget: (direction: 1 | -1) => void;
  onExitToMenu: () => void;
}

export const SpectatorHUD: React.FC<SpectatorHUDProps> = ({
  spectatedStats,
  aliveCount,
  onCycleTarget,
  onExitToMenu,
}) => {
  return (
    <div className="fixed inset-x-0 bottom-6 z-20 flex flex-col items-center justify-center pointer-events-none select-none px-4">
      {/* SPECTATOR BANNER BAR */}
      <div className="pixel-box-dark bg-zinc-950/95 border-2 border-sky-500 p-3 flex flex-col sm:flex-row items-center gap-4 pointer-events-auto shadow-[0_0_20px_rgba(56,189,248,0.4)]">
        {/* Badge & Mode Title */}
        <div className="flex items-center gap-2">
          <span className="animate-pulse text-lg">🎥</span>
          <div>
            <div className="font-pixel-heading text-xs text-sky-400">MODO ESPECTADOR</div>
            <div className="font-pixel-body text-[10px] text-zinc-400">
              Luchadores con vida: <span className="text-yellow-400 font-bold">{aliveCount}</span>
            </div>
          </div>
        </div>

        {/* Current Spectated Fighter Details */}
        {spectatedStats && (
          <div className="flex items-center gap-3 px-3 py-1.5 bg-black/60 border border-zinc-800">
            <span className="text-xl">{spectatedStats.classIcon}</span>
            <div>
              <div className="font-pixel-heading text-xs text-white truncate max-w-[120px]">
                {spectatedStats.name}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-pixel-body">
                <span className="text-red-400">💥 {Math.round(spectatedStats.damagePercent)}%</span>
                <span className="text-yellow-400">🪙 {spectatedStats.coins}</span>
                <span className="text-emerald-400">❤️ {spectatedStats.stocks}</span>
              </div>
            </div>
          </div>
        )}

        {/* Target Switch Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playCoin();
              onCycleTarget(-1);
            }}
            className="pixel-btn pixel-box-dark bg-zinc-900 px-3 py-1.5 text-xs font-pixel-heading text-sky-300 hover:bg-zinc-800"
          >
            ◄ ANTERIOR
          </button>

          <button
            onClick={() => {
              sound.playCoin();
              onCycleTarget(1);
            }}
            className="pixel-btn pixel-box-dark bg-zinc-900 px-3 py-1.5 text-xs font-pixel-heading text-sky-300 hover:bg-zinc-800"
          >
            SIGUIENTE ►
          </button>

          {/* Exit Button */}
          <button
            onClick={() => {
              sound.playCoin();
              onExitToMenu();
            }}
            className="pixel-btn pixel-box-red px-3 py-1.5 text-xs font-pixel-heading text-white hover:brightness-110"
          >
            🚪 SALIR
          </button>
        </div>
      </div>
    </div>
  );
};
