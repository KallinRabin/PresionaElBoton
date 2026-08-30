import React from 'react';
import { DailyMission } from '../types';
import { sound } from '../game/audio';

interface MissionsModalProps {
  missions: DailyMission[];
  onClaimReward: (missionId: string) => void;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  missions,
  onClaimReward,
  onClose,
}) => {
  const completedCount = missions.filter((m) => m.completed).length;
  const unclaimedCount = missions.filter((m) => m.completed && !m.claimed).length;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm select-none">
      <div
        id="missions-modal-container"
        className="pixel-box-dark w-full max-w-lg bg-zinc-950 p-5 text-white max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">📜</span>
            <div>
              <h2 className="font-pixel-heading text-sm sm:text-base text-yellow-400">TABLÓN DE MISIONES DIARIAS</h2>
              <div className="font-pixel-body text-xs text-zinc-400">
                Completa objetivos diarios para ganar monedas arcade
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playCoin();
              onClose();
            }}
            className="pixel-btn pixel-box-red px-2.5 py-1 font-pixel-body text-xs text-white"
          >
            [X]
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between p-2.5 mb-3 pixel-box-dark bg-zinc-900 text-xs font-pixel-body">
          <div className="text-zinc-300">
            Progreso: <span className="font-pixel-heading text-sky-400">{completedCount} / {missions.length}</span>
          </div>
          {unclaimedCount > 0 && (
            <div className="text-yellow-300 animate-pulse font-bold">
              ¡{unclaimedCount} recompensa(s) lista(s) para reclamar!
            </div>
          )}
        </div>

        {/* Mission List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {missions.map((mission) => {
            const isReadyToClaim = mission.completed && !mission.claimed;
            const progressPercent = Math.min(100, Math.round((mission.current / mission.target) * 100));

            return (
              <div
                key={mission.id}
                className={`p-3.5 pixel-box-dark flex flex-col justify-between transition-all ${
                  mission.claimed
                    ? 'bg-zinc-900/50 opacity-60 border-zinc-800'
                    : isReadyToClaim
                    ? 'bg-amber-950/40 border-2 border-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'bg-zinc-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{mission.icon}</span>
                    <div>
                      <div className="font-pixel-heading text-xs text-white flex items-center gap-2">
                        <span>{mission.title}</span>
                        {mission.claimed && (
                          <span className="text-[8px] font-pixel-body px-1.5 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700">
                            RECLAMADA ✓
                          </span>
                        )}
                      </div>
                      <div className="font-pixel-body text-[11px] text-zinc-400 mt-1">
                        {mission.description}
                      </div>
                    </div>
                  </div>

                  <div className="pixel-box-gold px-2.5 py-1 text-xs font-pixel-heading text-black shrink-0 flex items-center gap-1">
                    <span>🪙</span> +{mission.rewardCoins}
                  </div>
                </div>

                {/* Progress Bar & Claim Button */}
                <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-[9px] font-pixel-body text-zinc-400 mb-1">
                      <span>Progreso</span>
                      <span>{mission.current} / {mission.target}</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 border border-zinc-700 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          mission.completed ? 'bg-green-500' : 'bg-sky-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {isReadyToClaim ? (
                    <button
                      onClick={() => {
                        sound.playBigCoin();
                        onClaimReward(mission.id);
                      }}
                      className="pixel-btn pixel-box-gold px-3.5 py-1.5 text-xs font-pixel-heading text-black hover:scale-105 animate-bounce shrink-0"
                    >
                      ¡RECLAMAR!
                    </button>
                  ) : mission.claimed ? (
                    <span className="text-[10px] font-pixel-heading text-green-400 shrink-0">
                      COMPLETADA
                    </span>
                  ) : (
                    <span className="text-[10px] font-pixel-body text-zinc-500 shrink-0">
                      EN CURSO...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={() => {
              sound.playCoin();
              onClose();
            }}
            className="pixel-btn pixel-box-blue px-5 py-2 text-xs font-pixel-heading text-white"
          >
            VOLVER
          </button>
        </div>
      </div>
    </div>
  );
};
