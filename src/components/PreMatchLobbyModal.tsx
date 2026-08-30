import React from 'react';
import { RoomInfo, RoomPlayer } from '../types';
import { PLAYER_CLASSES } from '../data/classes';
import { ARENAS } from '../data/arenas';
import { sound } from '../game/audio';
import { networkManager } from '../game/network';

interface PreMatchLobbyModalProps {
  room: RoomInfo;
  onLeave: () => void;
  onStartGame: () => void;
}

export const PreMatchLobbyModal: React.FC<PreMatchLobbyModalProps> = ({
  room,
  onLeave,
  onStartGame,
}) => {
  const localPlayerId = networkManager.localPlayerId;
  const localPlayer = room.players.find((p) => p.id === localPlayerId);
  const isHost = localPlayer?.isHost ?? false;
  const arenaDef = ARENAS.find((a) => a.id === room.arenaId) || ARENAS[0];
  const modeLabel = room.mode === '2v2' ? '🤝 2 VS 2 (POR EQUIPOS)' : room.mode === '1v1' ? '⚔️ 1 VS 1 (DUELO)' : '💥 TODOS VS TODOS (FFA)';

  const handleToggleReady = () => {
    sound.playCoin();
    networkManager.toggleReady();
  };

  const handleSwitchTeam = (team: 'red' | 'blue') => {
    sound.playCoin();
    networkManager.switchTeam(team);
  };

  const handleStartGame = () => {
    sound.playButtonSlam();
    networkManager.startGame();
  };

  const handleLeaveRoom = () => {
    sound.playCoin();
    networkManager.leaveRoom();
    onLeave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none animate-pixel-fade-in">
      <div className="pixel-box-dark max-w-2xl w-full flex flex-col justify-between p-4 sm:p-6 border-4 border-sky-500 shadow-2xl bg-zinc-950/95">
        {/* LOBBY HEADER */}
        <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏠</span>
              <h2 className="text-sm sm:text-lg font-pixel-heading text-yellow-300 pixel-text-stroke">
                {room.name}
              </h2>
            </div>
            <div className="text-[9px] font-pixel-body text-zinc-400 flex items-center gap-2 mt-0.5">
              <span className="text-sky-300 font-bold">{modeLabel}</span>
              <span>•</span>
              <span style={{ color: arenaDef.themeColor }}>{arenaDef.name}</span>
              <span>•</span>
              <span>CÓDIGO: <strong className="text-white font-mono">{room.id}</strong></span>
            </div>
          </div>

          <button
            onClick={handleLeaveRoom}
            className="pixel-btn pixel-box-red px-2.5 py-1 text-xs font-pixel-heading text-white hover:scale-105"
          >
            SALIR ✕
          </button>
        </div>

        {/* CONNECTED PLAYERS LIST */}
        <div className="my-4">
          <div className="text-[10px] font-pixel-heading text-zinc-400 mb-2 flex items-center justify-between">
            <span>LUCHADORES EN LA SALA ({room.playersCount} / {room.maxPlayers}):</span>
            {room.mode === '2v2' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[8px]">CAMBIAR EQUIPO:</span>
                <button
                  onClick={() => handleSwitchTeam('red')}
                  className={`px-2 py-0.5 text-[8px] font-pixel-heading ${localPlayer?.team === 'red' ? 'bg-red-600 text-white border border-white' : 'bg-zinc-800 text-zinc-400'}`}
                >
                  🔴 ROJO
                </button>
                <button
                  onClick={() => handleSwitchTeam('blue')}
                  className={`px-2 py-0.5 text-[8px] font-pixel-heading ${localPlayer?.team === 'blue' ? 'bg-blue-600 text-white border border-white' : 'bg-zinc-800 text-zinc-400'}`}
                >
                  🔵 AZUL
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {room.players.map((p) => {
              const classDef = PLAYER_CLASSES.find((c) => c.id === p.classId) || PLAYER_CLASSES[0];
              const isMe = p.id === localPlayerId;

              return (
                <div
                  key={p.id}
                  className={`p-2.5 border-2 flex items-center justify-between gap-3 ${
                    p.team === 'red'
                      ? 'bg-red-950/70 border-red-600'
                      : p.team === 'blue'
                      ? 'bg-sky-950/70 border-sky-600'
                      : isMe
                      ? 'bg-zinc-900 border-amber-400'
                      : 'bg-zinc-900/80 border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 pixel-box-sm flex items-center justify-center text-base shrink-0"
                      style={{ backgroundColor: classDef.color }}
                    >
                      {classDef.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-pixel-heading text-xs text-white truncate flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.isHost && <span title="Anfitrión">👑</span>}
                        {isMe && <span className="text-[8px] text-yellow-300 font-normal">(TÚ)</span>}
                      </div>
                      <div className="font-pixel-body text-[8px] text-zinc-400 truncate">
                        {classDef.name} {p.team ? `• Equipo ${p.team === 'red' ? 'Rojo' : 'Azul'}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {p.isReady ? (
                      <span className="text-[8px] font-pixel-heading px-2 py-0.5 bg-green-950 text-green-400 border border-green-600">
                        ✓ LISTO
                      </span>
                    ) : (
                      <span className="text-[8px] font-pixel-heading px-2 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700">
                        ESPERANDO
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          {/* Ready Toggle Button */}
          <button
            onClick={handleToggleReady}
            className={`pixel-btn px-4 py-2 text-xs font-pixel-heading ${
              localPlayer?.isReady
                ? 'pixel-box-dark text-zinc-400 hover:text-white'
                : 'pixel-box-green text-black hover:scale-105 animate-pulse'
            }`}
          >
            {localPlayer?.isReady ? 'CANCELAR LISTO ✕' : '¡ESTOY LISTO! ✓'}
          </button>

          {/* Host Start Button */}
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={room.playersCount < 2}
              className={`pixel-btn px-6 py-2 text-sm font-pixel-heading ${
                room.playersCount >= 2
                  ? 'pixel-box-red text-yellow-300 pixel-text-stroke hover:scale-105 animate-bounce'
                  : 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed'
              }`}
            >
              🥊 ¡INICIAR PARTIDA ONLINE!
            </button>
          ) : (
            <div className="text-[9px] font-pixel-body text-zinc-400 flex items-center gap-1.5">
              <span className="animate-spin">⏳</span> Esperando que el anfitrión inicie la partida...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
