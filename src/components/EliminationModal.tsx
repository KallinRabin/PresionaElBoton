import React from 'react';
import { PlayerStats, KillBanner } from '../types';
import { sound } from '../game/audio';

interface EliminationModalProps {
  killerStats: PlayerStats | null;
  killerBanner: KillBanner | null;
  onSpectate: () => void;
  onExitToMenu: () => void;
  onRematch: () => void;
}

export const EliminationModal: React.FC<EliminationModalProps> = ({
  killerStats,
  killerBanner,
  onSpectate,
  onExitToMenu,
  onRematch,
}) => {
  const killerName = killerStats ? killerStats.name : 'El Vacío / Ring Out';
  const killerIcon = killerBanner ? killerBanner.icon : '💀';
  const bannerTitle = killerBanner ? killerBanner.title : 'Caída al Abismo';
  const bgGradient = killerBanner ? killerBanner.bgGradient : 'from-zinc-900 to-zinc-950';
  const borderColor = killerBanner ? killerBanner.borderColor : '#ef4444';
  const textColor = killerBanner ? killerBanner.textColor : '#fca5a5';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md select-none animate-pixel-fade-in">
      <div
        id="elimination-modal-container"
        className="w-full max-w-lg pixel-box-dark bg-zinc-950 border-4 border-red-600 p-5 sm:p-7 text-white flex flex-col items-center shadow-[0_0_30px_rgba(239,68,68,0.4)]"
      >
        {/* SKULL & ELIMINATION TITLE */}
        <div className="text-5xl sm:text-6xl mb-2 animate-bounce">💀</div>
        <h2 className="text-2xl sm:text-3xl font-pixel-heading text-red-500 pixel-text-stroke text-center tracking-wider mb-1">
          ¡HAS SIDO ELIMINADO!
        </h2>
        <div className="font-pixel-body text-xs text-zinc-400 text-center mb-5">
          Perdiste tus <span className="text-red-400 font-bold">3 vidas (stocks)</span> en la arena
        </div>

        {/* KILL BANNER CARD (Personalized Killer Card) */}
        <div className="w-full mb-6">
          <div className="text-[10px] font-pixel-heading text-zinc-400 mb-1.5 uppercase flex items-center justify-between">
            <span>🚩 ESTANDARTE DEL VENCEDOR:</span>
            {killerBanner?.badgeText && (
              <span
                className="text-[9px] px-1.5 py-0.5 border"
                style={{ borderColor, color: textColor }}
              >
                {killerBanner.badgeText}
              </span>
            )}
          </div>

          <div
            className={`w-full p-4 border-4 rounded-none flex items-center gap-3.5 bg-gradient-to-r ${bgGradient} shadow-lg`}
            style={{ borderColor }}
          >
            <div className="w-14 h-14 bg-black/70 border-2 border-white/20 flex items-center justify-center text-3xl flex-shrink-0">
              {killerIcon}
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="text-[11px] font-pixel-body text-zinc-300">
                TE HA ELIMINADO:
              </div>
              <div
                className="font-pixel-heading text-sm sm:text-base font-bold truncate"
                style={{ color: textColor }}
              >
                {killerName}
              </div>
              <div className="text-[11px] font-pixel-body text-zinc-400 italic truncate mt-0.5">
                "{bannerTitle}"
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS (ESPECTAR O SALIR) */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Spectate Button */}
          <button
            id="btn-elimination-spectate"
            onClick={() => {
              sound.playCoin();
              onSpectate();
            }}
            className="w-full pixel-btn pixel-box-blue bg-sky-600 py-3 font-pixel-heading text-xs sm:text-sm text-white flex items-center justify-center gap-2 hover:scale-[1.02] shadow-[0_0_15px_rgba(2,132,199,0.4)]"
          >
            <span>👀</span>
            <span>ESPECTAR COMBATE EN VIVO</span>
          </button>

          {/* Quick Rematch Button */}
          <button
            id="btn-elimination-rematch"
            onClick={() => {
              sound.playButtonSlam();
              onRematch();
            }}
            className="w-full pixel-btn pixel-box-gold py-2.5 font-pixel-heading text-xs text-black flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            <span>🔄</span>
            <span>REINTENTAR REVANCHA</span>
          </button>

          {/* Exit to Menu Button */}
          <button
            id="btn-elimination-exit"
            onClick={() => {
              sound.playCoin();
              onExitToMenu();
            }}
            className="w-full pixel-btn pixel-box-dark bg-zinc-900 py-2.5 font-pixel-heading text-xs text-zinc-300 flex items-center justify-center gap-2 hover:bg-zinc-800 hover:text-white"
          >
            <span>🚪</span>
            <span>SALIR AL MENÚ PRINCIPAL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
