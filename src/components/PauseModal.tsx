import React from 'react';
import { sound } from '../game/audio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onGoToMenu: () => void;
  onOpenSettings: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onGoToMenu,
  onOpenSettings,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none">
      <div
        id="pause-modal-container"
        className="pixel-box-dark w-full max-w-sm bg-zinc-950 p-6 text-white text-center animate-pixel-float"
      >
        <div className="text-3xl mb-2">⏸️</div>
        <h2 className="text-2xl font-pixel-heading text-yellow-400 mb-6 pixel-text-stroke">
          PAUSA
        </h2>

        <div className="space-y-3">
          <button
            id="pause-btn-resume"
            onClick={() => {
              sound.playCoin();
              onResume();
            }}
            className="w-full pixel-btn pixel-box-green py-3 text-xs sm:text-sm font-pixel-heading text-white"
          >
            ▶ CONTINUAR
          </button>
          <button
            id="pause-btn-restart"
            onClick={() => {
              sound.playButtonSlam();
              onRestart();
            }}
            className="w-full pixel-btn pixel-box-red py-3 text-xs sm:text-sm font-pixel-heading text-white"
          >
            🔄 REINICIAR PARTIDA
          </button>
          <button
            id="pause-btn-settings"
            onClick={() => {
              sound.playCoin();
              onOpenSettings();
            }}
            className="w-full pixel-btn pixel-box-blue py-3 text-xs sm:text-sm font-pixel-heading text-white"
          >
            ⚙️ AJUSTES
          </button>
          <button
            id="pause-btn-menu"
            onClick={() => {
              sound.playCoin();
              onGoToMenu();
            }}
            className="w-full pixel-btn pixel-box-dark py-3 text-xs sm:text-sm font-pixel-body text-zinc-400 hover:text-white"
          >
            SALIR AL MENÚ
          </button>
        </div>
      </div>
    </div>
  );
};
