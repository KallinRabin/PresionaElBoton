import React from 'react';
import { ClassId, PlayerClass } from '../types';
import { PLAYER_CLASSES } from '../data/classes';
import { sound } from '../game/audio';

interface ClassSelectModalProps {
  selectedClassId: ClassId;
  onSelectClass: (classId: ClassId) => void;
  onClose: () => void;
}

export const ClassSelectModal: React.FC<ClassSelectModalProps> = ({
  selectedClassId,
  onSelectClass,
  onClose,
}) => {
  const currentClass = PLAYER_CLASSES.find((c) => c.id === selectedClassId) || PLAYER_CLASSES[0];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm select-none">
      <div
        id="class-select-modal"
        className="w-full max-w-4xl pixel-box-dark bg-zinc-950 p-4 sm:p-6 flex flex-col max-h-[92vh] overflow-y-auto border-4 border-sky-500 shadow-2xl"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3 mb-4">
          <div>
            <h2 className="font-pixel-heading text-lg sm:text-2xl text-yellow-300 pixel-text-stroke flex items-center gap-2">
              <span>🥋</span> SELECCIONA TU CLASE
            </h2>
            <p className="font-pixel-body text-xs text-zinc-400 mt-1">
              Cada clase tiene estadísticas únicas y <span className="text-sky-400 font-bold">1 SOLA HABILIDAD TÁCTICA</span>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="pixel-btn pixel-box-red px-3 py-1.5 font-pixel-heading text-xs text-white"
          >
            [X]
          </button>
        </div>

        {/* 8 CLASSES GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          {PLAYER_CLASSES.map((cls) => {
            const isSelected = cls.id === selectedClassId;
            return (
              <div
                key={cls.id}
                onClick={() => {
                  sound.playCoin();
                  onSelectClass(cls.id);
                }}
                className={`pixel-btn p-2.5 flex flex-col items-center text-center cursor-pointer transition-all ${
                  isSelected
                    ? 'pixel-box-gold bg-zinc-900 scale-105 border-2 border-yellow-400'
                    : 'pixel-box-dark bg-zinc-900/80 hover:bg-zinc-800 opacity-85'
                }`}
                style={{
                  borderColor: isSelected ? '#fbbf24' : cls.color,
                }}
              >
                <div
                  className="w-10 h-10 pixel-box-sm flex items-center justify-center text-xl mb-1.5"
                  style={{ backgroundColor: cls.color }}
                >
                  {cls.icon}
                </div>
                <div className="font-pixel-heading text-xs text-white mb-0.5">
                  {cls.name}
                </div>
                <div className="font-pixel-body text-[8px] text-zinc-400">
                  {cls.title}
                </div>
                {isSelected && (
                  <span className="mt-1.5 text-[8px] font-pixel-heading text-yellow-300 bg-black/60 px-1.5 py-0.5 border border-yellow-500">
                    ► ELEGIDA
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* SELECTED CLASS DETAILED OVERVIEW & SIGNATURE ABILITY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pixel-box-dark p-4 bg-zinc-900/90 border-2 border-zinc-700 mb-4">
          {/* Left: Class Stats */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{currentClass.icon}</span>
              <div>
                <div className="font-pixel-heading text-sm sm:text-base text-yellow-300">
                  {currentClass.name}
                </div>
                <div className="font-pixel-body text-[10px] text-zinc-400">
                  {currentClass.description}
                </div>
              </div>
            </div>

            {/* Tactical Stat Bars */}
            <div className="space-y-2 mt-3 font-pixel-body text-xs">
              <div>
                <div className="flex justify-between text-[10px] text-zinc-300 mb-0.5">
                  <span>PESO / RESISTENCIA AL EMPUJE</span>
                  <span className="font-bold text-sky-400">{(currentClass.weight * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-950 border border-zinc-700">
                  <div
                    className="h-full bg-sky-500"
                    style={{ width: `${Math.min(100, (currentClass.weight / 1.7) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-zinc-300 mb-0.5">
                  <span>VELOCIDAD DE MOVIMIENTO</span>
                  <span className="font-bold text-emerald-400">{currentClass.speed.toFixed(1)} m/s</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-950 border border-zinc-700">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${Math.min(100, (currentClass.speed / 12) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-zinc-300 mb-0.5">
                  <span>FUERZA DEL GUANTE SMASH</span>
                  <span className="font-bold text-red-400">x{currentClass.punchPower.toFixed(2)}</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-950 border border-zinc-700">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${Math.min(100, (currentClass.punchPower / 1.5) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-zinc-300 mb-0.5">
                  <span>ROBO DE MONEDAS POR IMPACTO</span>
                  <span className="font-bold text-yellow-400">+{currentClass.stealPower} 🪙</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-950 border border-zinc-700">
                  <div
                    className="h-full bg-yellow-500"
                    style={{ width: `${Math.min(100, (currentClass.stealPower / 25) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: The Single Unique Signature Ability */}
          <div className="pixel-box-blue p-3.5 bg-sky-950/70 flex flex-col justify-between border-2 border-sky-400">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-pixel-heading text-sky-300 bg-black/60 px-2 py-1">
                  ★ HABILIDAD TÁCTICA ÚNICA ★
                </span>
                <span className="text-[10px] font-pixel-body text-yellow-300">
                  RECARGA: {currentClass.ability.cooldown}s
                </span>
              </div>

              <div className="flex items-center gap-2.5 my-2">
                <div className="w-10 h-10 pixel-box-sm bg-indigo-600 flex items-center justify-center text-xl">
                  {currentClass.ability.icon}
                </div>
                <div>
                  <div className="font-pixel-heading text-xs sm:text-sm text-yellow-300">
                    {currentClass.ability.name}
                  </div>
                  <div className="text-[10px] font-pixel-body text-sky-200">
                    ACTIVACIÓN: [TECLA E] o [BOTÓN EN PANTALLA]
                  </div>
                </div>
              </div>

              <p className="font-pixel-body text-xs text-zinc-200 mt-2 leading-relaxed">
                {currentClass.ability.description}
              </p>
            </div>

            <div className="mt-3 text-[10px] font-pixel-body text-zinc-400 border-t border-sky-800/60 pt-2">
              💡 <span className="text-white font-bold">Consejo:</span> Golpea primero con el Guante de Robo para aumentar el % del rival antes de lanzar tu habilidad.
            </div>
          </div>
        </div>

        {/* CONFIRM BUTTON */}
        <button
          onClick={() => {
            sound.playCoin();
            onClose();
          }}
          className="w-full pixel-btn pixel-box-gold py-3.5 text-base font-pixel-heading text-black font-bold flex items-center justify-center gap-2 hover:scale-[1.02]"
        >
          <span>✓</span>
          <span>CONFIRMAR Y JUGAR COMO {currentClass.name.toUpperCase()}</span>
        </button>
      </div>
    </div>
  );
};
