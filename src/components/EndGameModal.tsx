import React from 'react';
import { MatchResult } from '../types';
import { sound } from '../game/audio';

interface EndGameModalProps {
  result: MatchResult;
  isMultiplayer?: boolean;
  rematchVotesCount?: number;
  rematchTotalNeeded?: number;
  hasRequestedRematch?: boolean;
  rematchNotice?: string | null;
  onRequestRematch?: () => void;
  onRematch: () => void;
  onGoToMenu: () => void;
  onOpenShop: () => void;
}

export const EndGameModal: React.FC<EndGameModalProps> = ({
  result,
  isMultiplayer = false,
  rematchVotesCount = 0,
  rematchTotalNeeded = 2,
  hasRequestedRematch = false,
  rematchNotice,
  onRequestRematch,
  onRematch,
  onGoToMenu,
  onOpenShop,
}) => {
  const isVictory = result.playerRank === 1;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm select-none">
      <div
        id="endgame-modal-container"
        className={`w-full max-w-xl flex flex-col p-4 sm:p-6 text-white animate-pixel-float border-4 ${
          isVictory
            ? 'pixel-box-gold bg-amber-950/95 border-yellow-400'
            : 'pixel-box-dark bg-zinc-950/95 border-zinc-700'
        }`}
      >
        {/* BANNER HEADER */}
        <div className="text-center mb-4">
          <div className="text-4xl sm:text-5xl mb-1.5">
            {isVictory ? '👑' : result.playerRank <= 2 ? '🥈' : '💥'}
          </div>
          <h2
            className={`text-2xl sm:text-3xl font-pixel-heading pixel-text-stroke tracking-wider ${
              isVictory ? 'text-yellow-300' : 'text-red-400'
            }`}
          >
            {isVictory ? '¡CAMPEÓN SMASH!' : 'FIN DE PARTIDA'}
          </h2>
          <div className="font-pixel-body text-xs text-zinc-300 mt-0.5">
            {isVictory
              ? '¡Has dominado la arena con tu Guante de Robo!'
              : `Has finalizado en el puesto #${result.playerRank}`}
          </div>
        </div>

        {/* STATS HIGHLIGHTS (Position, Coins, KOs, Damage Dealt) */}
        <div className="grid grid-cols-4 gap-2 mb-4 text-center">
          {/* Position */}
          <div className="pixel-box-dark p-2 bg-black/70">
            <div className="text-[8px] font-pixel-body text-zinc-400">PUESTO</div>
            <div className={`text-base sm:text-lg font-pixel-heading ${isVictory ? 'text-yellow-400' : 'text-white'}`}>
              #{result.playerRank}
            </div>
          </div>

          {/* Coins Earned */}
          <div className="pixel-box-gold p-2">
            <div className="text-[8px] font-pixel-body text-amber-950 font-bold">GANANCIA</div>
            <div className="text-base sm:text-lg font-pixel-heading text-black font-bold">
              +{result.coinsEarned} 🪙
            </div>
          </div>

          {/* KOs */}
          <div className="pixel-box-dark p-2 bg-black/70">
            <div className="text-[8px] font-pixel-body text-zinc-400">KOs SMASH</div>
            <div className="text-base sm:text-lg font-pixel-heading text-red-400">
              {result.playerKOs} 💀
            </div>
          </div>

          {/* Steals */}
          <div className="pixel-box-dark p-2 bg-black/70">
            <div className="text-[8px] font-pixel-body text-zinc-400">ROBOS</div>
            <div className="text-base sm:text-lg font-pixel-heading text-sky-400">
              {result.totalSteals} 💥
            </div>
          </div>
        </div>

        {/* PODIUM LEADERBOARD TABLE */}
        <div className="pixel-box-dark p-3 bg-black/70 mb-4">
          <div className="text-xs font-pixel-heading text-yellow-400 mb-2 border-b border-zinc-700 pb-1 flex justify-between">
            <span>RESULTADOS DE LA ARENA</span>
            <span className="text-[10px] text-zinc-400 font-pixel-body">DAÑO % / MONEDAS</span>
          </div>
          <div className="space-y-1.5">
            {result.leaderboard.map((row, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-1.5 text-xs font-pixel-body ${
                  row.isPlayer
                    ? 'bg-sky-950/90 border-2 border-sky-400 text-sky-200'
                    : idx === 0
                    ? 'bg-amber-950/40 text-yellow-200'
                    : 'text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-bold w-4">{idx === 0 ? '👑' : `#${idx + 1}`}</span>
                  <span>{row.classIcon}</span>
                  <span className="truncate">{row.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-red-300">{row.damagePercent}%</span>
                  <span className="font-pixel-heading text-[11px] text-yellow-400">
                    🪙 {row.coins}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* REMATCH NOTICE / VOTES BANNER */}
        {isMultiplayer && (
          <div className="mb-3 p-2 bg-zinc-900 border border-zinc-700 text-center font-pixel-body text-xs">
            {rematchNotice ? (
              <span className="text-red-400 font-bold">⚠️ {rematchNotice}</span>
            ) : hasRequestedRematch ? (
              <span className="text-yellow-300 animate-pulse">
                ⏳ ESPERANDO QUE TODOS LOS JUGADORES ACEPTEN ({rematchVotesCount}/{rematchTotalNeeded})
              </span>
            ) : (
              <span className="text-zinc-300">
                ¿Listos para otra ronda? Pulsa <strong>SOLICITAR REVANCHA</strong> (requiere acuerdo mutuo).
              </span>
            )}
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {isMultiplayer ? (
            <button
              id="endgame-btn-rematch"
              onClick={() => {
                if (!hasRequestedRematch && onRequestRematch) {
                  sound.playButtonSlam();
                  onRequestRematch();
                }
              }}
              disabled={hasRequestedRematch}
              className={`w-full sm:flex-1 pixel-btn py-3 text-xs sm:text-sm font-pixel-heading flex items-center justify-center gap-2 ${
                hasRequestedRematch
                  ? 'pixel-box-dark text-yellow-300 border-amber-400 animate-pulse cursor-not-allowed'
                  : 'pixel-box-red text-yellow-200 hover:scale-[1.02]'
              }`}
            >
              <span>⚔️</span>
              <span>
                {hasRequestedRematch
                  ? `REVANCHA SOLICITADA (${rematchVotesCount}/${rematchTotalNeeded})`
                  : 'SOLICITAR REVANCHA'}
              </span>
            </button>
          ) : (
            <button
              id="endgame-btn-rematch"
              onClick={() => {
                sound.playButtonSlam();
                onRematch();
              }}
              className="w-full sm:flex-1 pixel-btn pixel-box-red py-3 text-sm font-pixel-heading text-yellow-200 flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <span>▶</span>
              <span>OTRA BATALLA</span>
            </button>
          )}

          <button
            id="endgame-btn-shop"
            onClick={() => {
              sound.playCoin();
              onOpenShop();
            }}
            className="w-full sm:w-auto pixel-btn pixel-box-purple py-3 px-4 text-xs font-pixel-heading text-white"
          >
            🛒 TIENDA
          </button>

          <button
            id="endgame-btn-menu"
            onClick={() => {
              sound.playCoin();
              onGoToMenu();
            }}
            className="w-full sm:w-auto pixel-btn pixel-box-dark py-3 px-4 text-xs font-pixel-body text-zinc-300 hover:text-white"
          >
            MENÚ
          </button>
        </div>
      </div>
    </div>
  );
};
