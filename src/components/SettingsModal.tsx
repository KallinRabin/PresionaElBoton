import React from 'react';
import { GameSettings } from '../types';
import { sound } from '../game/audio';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm select-none">
      <div
        id="settings-modal-container"
        className="pixel-box-dark w-full max-w-md bg-zinc-950 p-5 text-white max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b-4 border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚙️</span>
            <h2 className="font-pixel-heading text-sm sm:text-base text-yellow-400">CONFIGURACIÓN</h2>
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

        <div className="space-y-3.5">
          {/* Music Toggle */}
          <div className="flex items-center justify-between p-3 pixel-box-dark bg-zinc-900">
            <div>
              <div className="font-pixel-heading text-xs text-white flex items-center gap-1.5">
                <span>🎵</span> MÚSICA CHIPTUNE
              </div>
              <div className="font-pixel-body text-[10px] text-zinc-400">Banda sonora retro 8-bit</div>
            </div>
            <button
              onClick={() => {
                const next = !settings.musicEnabled;
                onUpdateSettings({ musicEnabled: next });
                sound.setMusicMuted(!next);
              }}
              className={`pixel-btn px-3.5 py-1.5 text-xs font-pixel-heading ${
                settings.musicEnabled ? 'pixel-box-purple bg-purple-600 text-white' : 'pixel-box-dark bg-zinc-800 text-zinc-500'
              }`}
            >
              {settings.musicEnabled ? 'ACTIVADO' : 'MUTED'}
            </button>
          </div>

          {/* Sound FX Toggle */}
          <div className="flex items-center justify-between p-3 pixel-box-dark bg-zinc-900">
            <div>
              <div className="font-pixel-heading text-xs text-white flex items-center gap-1.5">
                <span>🔊</span> EFECTOS DE SONIDO
              </div>
              <div className="font-pixel-body text-[10px] text-zinc-400">Monedas, golpes, saltos y KO</div>
            </div>
            <button
              onClick={() => {
                const next = !settings.soundEnabled;
                onUpdateSettings({ soundEnabled: next });
                sound.setMuted(!next);
                if (next) sound.playCoin();
              }}
              className={`pixel-btn px-3.5 py-1.5 text-xs font-pixel-heading ${
                settings.soundEnabled ? 'pixel-box-green bg-green-600 text-white' : 'pixel-box-dark bg-zinc-800 text-zinc-500'
              }`}
            >
              {settings.soundEnabled ? 'ACTIVADO' : 'MUTED'}
            </button>
          </div>

          {/* Particles & Visual FX Toggle */}
          <div className="flex items-center justify-between p-3 pixel-box-dark bg-zinc-900">
            <div>
              <div className="font-pixel-heading text-xs text-white flex items-center gap-1.5">
                <span>✨</span> PARTÍCULAS Y CHISPAS
              </div>
              <div className="font-pixel-body text-[10px] text-zinc-400">Chispas de impacto, humo y textos 3D</div>
            </div>
            <button
              onClick={() => {
                sound.playCoin();
                const next = settings.particlesEnabled !== false ? false : true;
                onUpdateSettings({ particlesEnabled: next });
              }}
              className={`pixel-btn px-3.5 py-1.5 text-xs font-pixel-heading ${
                settings.particlesEnabled !== false ? 'pixel-box-gold bg-amber-500 text-black' : 'pixel-box-dark bg-zinc-800 text-zinc-500'
              }`}
            >
              {settings.particlesEnabled !== false ? 'ACTIVADO' : 'QUITADO'}
            </button>
          </div>

          {/* CRT Scanline Filter Toggle */}
          <div className="flex items-center justify-between p-3 pixel-box-dark bg-zinc-900">
            <div>
              <div className="font-pixel-heading text-xs text-white flex items-center gap-1.5">
                <span>📺</span> FILTRO CRT ARCADE
              </div>
              <div className="font-pixel-body text-[10px] text-zinc-400">Líneas de pantalla de televisor retro</div>
            </div>
            <button
              onClick={() => {
                sound.playCoin();
                onUpdateSettings({ scanlinesEnabled: !settings.scanlinesEnabled });
              }}
              className={`pixel-btn px-3.5 py-1.5 text-xs font-pixel-heading ${
                settings.scanlinesEnabled ? 'pixel-box-blue bg-sky-600 text-white' : 'pixel-box-dark bg-zinc-800 text-zinc-500'
              }`}
            >
              {settings.scanlinesEnabled ? 'ACTIVADO' : 'QUITADO'}
            </button>
          </div>

          {/* Camera Sensitivity Stepper */}
          <div className="p-3 pixel-box-dark bg-zinc-900">
            <div className="flex items-center justify-between mb-2">
              <div className="font-pixel-heading text-xs text-white flex items-center gap-1.5">
                <span>🎯</span> SENSIBILIDAD DE MIRA
              </div>
              <div className="font-pixel-body text-xs text-yellow-400 font-bold">
                {settings.cameraSensitivity ? `${settings.cameraSensitivity}x` : '1.0x'}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[0.7, 1.0, 1.5].map((sens) => (
                <button
                  key={sens}
                  onClick={() => {
                    sound.playCoin();
                    onUpdateSettings({ cameraSensitivity: sens });
                  }}
                  className={`pixel-btn py-1 text-[10px] font-pixel-heading ${
                    (settings.cameraSensitivity || 1.0) === sens
                      ? 'pixel-box-blue bg-sky-600 text-white'
                      : 'pixel-box-dark bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {sens === 0.7 ? 'LENTA' : sens === 1.0 ? 'NORMAL' : 'RÁPIDA'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={() => {
              sound.playCoin();
              onClose();
            }}
            className="pixel-btn pixel-box-green px-5 py-2 text-xs font-pixel-heading text-white"
          >
            ✓ LISTO
          </button>
        </div>
      </div>
    </div>
  );
};
