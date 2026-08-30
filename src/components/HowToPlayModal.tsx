import React from 'react';
import { sound } from '../game/audio';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  const steps = [
    {
      icon: '🥊',
      title: 'EL GUANTE DE ROBO & DAÑO %',
      desc: 'Golpea a tus rivales con el guante para robarles monedas en cada impacto. Cada golpe incrementa su porcentaje de daño Smash (0% a 300%+).',
    },
    {
      icon: '💥',
      title: 'FÍSICA SMASH & RING OUT (KO)',
      desc: 'A mayor porcentaje de daño acumulado, ¡más lejos saldrá despedido el rival al recibir un golpe! Si es expulsado de la plataforma flotante, sufrirá un KO y perderá vidas.',
    },
    {
      icon: '🥋',
      title: 'SISTEMA DE CLASES (1 HABILIDAD ÚNICA)',
      desc: 'Escoge tu clase antes de pelear: Boxeador Titán (Super Gancho), Pícaro Sombrío (Paso Fantasma), Guardián (Parry Reflectante), Mago (Pulso Gravitatorio) o Trampero (Minas). Úsala con [E].',
    },
    {
      icon: '📦',
      title: 'OBJETOS ÚTILES DE BATALLA',
      desc: 'Recoge objetos que caen en las plataformas: Bate Smash Dorado (Home-Run brutal), Bombas explosivas, Corazones curativos (-60% daño), Super Imán y Cajas de madera con botín.',
    },
    {
      icon: '🎥',
      title: 'CÁMARA BLOQUEADA TÁCTICA',
      desc: 'La cámara en 3ª persona está fijada en ángulo cenital isométrico para que nunca pierdas el control de la acción, el espaciado y los bordes del escenario.',
    },
  ];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm select-none">
      <div
        id="howtoplay-modal-container"
        className="pixel-box-dark w-full max-w-2xl max-h-[92vh] flex flex-col bg-zinc-950 p-4 sm:p-6 text-white overflow-hidden border-4 border-yellow-500 shadow-2xl"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <div>
              <h2 className="font-pixel-heading text-sm sm:text-lg text-yellow-400">GUÍA SMASH ARENA</h2>
              <div className="font-pixel-body text-xs text-zinc-400">Mecánicas de combate, clases y objetos</div>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playCoin();
              onClose();
            }}
            className="pixel-btn pixel-box-red px-3 py-1 font-pixel-heading text-xs text-white"
          >
            [X]
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
          {steps.map((step, idx) => (
            <div key={idx} className="pixel-box-dark p-3 bg-zinc-900/80 flex items-start gap-3">
              <div className="w-10 h-10 pixel-box-sm bg-zinc-800 flex items-center justify-center text-xl flex-shrink-0">
                {step.icon}
              </div>
              <div>
                <div className="font-pixel-heading text-xs text-sky-400 mb-0.5">{step.title}</div>
                <div className="font-pixel-body text-[11px] text-zinc-300 leading-relaxed">{step.desc}</div>
              </div>
            </div>
          ))}

          {/* CONTROLS RECAP */}
          <div className="pixel-box-blue p-3 bg-sky-950/80 mt-3">
            <div className="font-pixel-heading text-xs text-sky-200 mb-1.5">🎮 CONTROLES TÁCTICOS</div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-pixel-body text-zinc-200">
              <div>• WASD / Flechas: Desplazamiento</div>
              <div>• ESPACIO / Click: Guante de Robo</div>
              <div>• E: Habilidad Única de Clase</div>
              <div>• W / ESPACIO: Salto & Recuperación</div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={() => {
              sound.playCoin();
              onClose();
            }}
            className="pixel-btn pixel-box-gold px-6 py-2 text-xs font-pixel-heading text-black font-bold"
          >
            ¡ENTENDIDO, A PELEAR!
          </button>
        </div>
      </div>
    </div>
  );
};
