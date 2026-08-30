import React, { useState, useEffect } from 'react';
import { RoomInfo, MultiplayerMode, ArenaId, CharacterSkin, ClassId } from '../types';
import { ARENAS } from '../data/arenas';
import { sound } from '../game/audio';
import { networkManager } from '../game/network';

interface MultiplayerLobbyModalProps {
  playerName: string;
  selectedSkin: CharacterSkin;
  selectedClassId: ClassId;
  onClose: () => void;
  onRoomJoined: (room: RoomInfo) => void;
}

export const MultiplayerLobbyModal: React.FC<MultiplayerLobbyModalProps> = ({
  playerName,
  selectedSkin,
  selectedClassId,
  onClose,
  onRoomJoined,
}) => {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(networkManager.isConnected);
  const [serverUrl, setServerUrl] = useState<string>(networkManager.serverUrl || networkManager.getDefaultServerUrl());
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [customRoomCode, setCustomRoomCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create Room State
  const [newRoomName, setNewRoomName] = useState<string>(`Sala de ${playerName}`);
  const [newRoomMode, setNewRoomMode] = useState<MultiplayerMode>('ffa');
  const [newRoomArena, setNewRoomArena] = useState<ArenaId>('arcade_core');

  useEffect(() => {
    // Connect to WebSocket Server if not already connected
    networkManager.connect(serverUrl);

    networkManager.onConnectStatusChange = (status) => {
      setIsConnected(status);
      if (status) setErrorMessage(null);
    };

    networkManager.onRoomListCallback = (roomList) => {
      setRooms(roomList);
    };

    networkManager.onRoomJoinedCallback = (room) => {
      sound.playBigCoin();
      onRoomJoined(room);
    };

    networkManager.onErrorCallback = (msg) => {
      setErrorMessage(msg);
      sound.playSmashKO();
    };

    return () => {
      networkManager.onRoomListCallback = undefined;
      networkManager.onRoomJoinedCallback = undefined;
      networkManager.onErrorCallback = undefined;
      networkManager.onConnectStatusChange = undefined;
    };
  }, [serverUrl, onRoomJoined]);

  const handleRefresh = () => {
    sound.playCoin();
    networkManager.getRooms();
  };

  const handleReconnect = () => {
    sound.playCoin();
    networkManager.disconnect();
    networkManager.connect(serverUrl);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    sound.playButtonSlam();
    networkManager.createRoom(newRoomName, newRoomMode, newRoomArena, {
      name: playerName || 'JUGADOR',
      classId: selectedClassId,
      skinId: selectedSkin.id,
    });
  };

  const handleJoinRoom = (roomId: string) => {
    sound.playButtonSlam();
    networkManager.joinRoom(roomId, {
      name: playerName || 'JUGADOR',
      classId: selectedClassId,
      skinId: selectedSkin.id,
    });
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRoomCode.trim()) return;
    handleJoinRoom(customRoomCode.trim().toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none animate-pixel-fade-in">
      <div className="pixel-box-dark max-w-3xl w-full max-h-[92vh] flex flex-col justify-between p-4 sm:p-6 border-4 border-sky-500 shadow-2xl relative bg-zinc-950/95 overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-pixel-float">🌐</span>
            <div>
              <h2 className="text-base sm:text-xl font-pixel-heading text-yellow-300 pixel-text-stroke">
                LOBBY MULTIJUGADOR ONLINE
              </h2>
              <div className="text-[9px] sm:text-[10px] font-pixel-body text-zinc-400">
                SALAS EN TIEMPO REAL • TODOS VS TODOS • 2 VS 2 • 1 VS 1
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playCoin();
              onClose();
            }}
            className="pixel-btn pixel-box-red px-2.5 py-1 text-xs font-pixel-heading text-white hover:scale-105"
          >
            ✕ CERRAR
          </button>
        </div>

        {/* SERVER STATUS BAR */}
        <div className="my-2 p-2 bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="font-pixel-heading text-[10px] text-zinc-300">
              ESTADO DEL SERVIDOR: <strong className={isConnected ? 'text-green-400' : 'text-red-400'}>{isConnected ? 'EN LÍNEA (CONECTADO)' : 'DESCONECTADO'}</strong>
            </span>
          </div>

          {!isConnected && (
            <button
              onClick={handleReconnect}
              className="pixel-btn pixel-box-gold px-2.5 py-0.5 text-[9px] font-pixel-heading text-black hover:scale-105"
            >
              🔄 RECONECTAR
            </button>
          )}
        </div>

        {/* ERROR BANNER IF ANY */}
        {errorMessage && (
          <div className="mb-2 p-2 bg-red-950/90 border border-red-600 text-red-300 font-pixel-body text-xs text-center animate-bounce">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* MAIN BODY: ROOM LIST OR CREATE MODAL */}
        {!showCreateModal ? (
          <div className="flex-1 flex flex-col min-h-0 my-2">
            {/* ACTION BAR: CREATE ROOM & CODE SEARCH */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <button
                id="btn-open-create-room"
                onClick={() => {
                  sound.playCoin();
                  setShowCreateModal(true);
                }}
                className="pixel-btn pixel-box-gold px-3.5 py-1.5 text-xs font-pixel-heading text-black flex items-center gap-1.5 hover:scale-105"
              >
                <span>➕</span> <span>CREAR NUEVA SALA</span>
              </button>

              <form onSubmit={handleJoinByCode} className="flex items-center gap-1.5">
                <input
                  type="text"
                  maxLength={10}
                  value={customRoomCode}
                  onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase())}
                  placeholder="CÓDIGO DE SALA..."
                  className="bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs font-pixel-heading text-yellow-300 uppercase placeholder-zinc-600 focus:outline-none focus:border-amber-400 w-36"
                />
                <button
                  type="submit"
                  className="pixel-btn pixel-box-blue px-3 py-1 text-xs font-pixel-heading text-white hover:scale-105"
                >
                  UNIRSE
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="pixel-btn pixel-box-dark px-2.5 py-1 text-xs text-zinc-300 hover:text-white"
                  title="Refrescar Lista"
                >
                  🔄
                </button>
              </form>
            </div>

            {/* ROOMS TABLE / LIST */}
            <div className="flex-1 overflow-y-auto border border-zinc-800 bg-zinc-950/80 p-2 space-y-2 max-h-[46vh]">
              {rooms.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-500 font-pixel-body text-xs">
                  <span className="text-3xl mb-2">🕹️</span>
                  <div>No hay salas públicas abiertas en este momento.</div>
                  <div className="text-[10px] text-zinc-600 mt-1">¡Crea una nueva sala o comparte tu código con amigos!</div>
                </div>
              ) : (
                rooms.map((room) => {
                  const arenaDef = ARENAS.find((a) => a.id === room.arenaId) || ARENAS[0];
                  const modeLabel = room.mode === '2v2' ? '🤝 2 VS 2' : room.mode === '1v1' ? '⚔️ 1 VS 1' : '💥 TODOS VS TODOS';
                  const isFull = room.playersCount >= room.maxPlayers;

                  return (
                    <div
                      key={room.id}
                      className="p-2.5 bg-zinc-900/90 border border-zinc-700 flex flex-wrap items-center justify-between gap-3 hover:border-sky-400 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl p-1 bg-black/60 border border-zinc-800">{arenaDef.icon}</div>
                        <div>
                          <div className="font-pixel-heading text-xs sm:text-sm text-yellow-300 flex items-center gap-2">
                            <span>{room.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-zinc-800 border border-zinc-700 text-zinc-300 font-normal">
                              CÓDIGO: {room.id}
                            </span>
                          </div>
                          <div className="text-[9px] font-pixel-body text-zinc-400 flex items-center gap-2 mt-0.5">
                            <span className="text-sky-300 font-bold">{modeLabel}</span>
                            <span>•</span>
                            <span style={{ color: arenaDef.themeColor }}>{arenaDef.name}</span>
                            <span>•</span>
                            <span>Anfitrión: <strong>{room.hostName}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-pixel-heading text-xs text-white">
                            {room.playersCount} / {room.maxPlayers}
                          </div>
                          <div className={`text-[8px] font-pixel-body font-bold ${room.isPlaying ? 'text-amber-400' : isFull ? 'text-red-400' : 'text-green-400'}`}>
                            {room.isPlaying ? 'EN PARTIDA' : isFull ? 'SALA LLENA' : 'EN ESPERA'}
                          </div>
                        </div>

                        <button
                          disabled={isFull || room.isPlaying}
                          onClick={() => handleJoinRoom(room.id)}
                          className={`pixel-btn px-3 py-1.5 text-xs font-pixel-heading ${
                            isFull || room.isPlaying
                              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'
                              : 'pixel-box-green text-black hover:scale-105'
                          }`}
                        >
                          {room.isPlaying ? 'JUGANDO' : isFull ? 'LLENO' : 'ENTRAR'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* CREATE ROOM DIALOG */
          <form onSubmit={handleCreateRoom} className="flex-1 flex flex-col justify-between my-2 p-3 bg-zinc-900/90 border border-zinc-700 space-y-3">
            <div>
              <h3 className="font-pixel-heading text-sm text-yellow-300 mb-2">⚙️ CONFIGURACIÓN DE LA SALA</h3>

              {/* Room Name */}
              <div className="mb-2.5">
                <label className="block text-[9px] font-pixel-body text-zinc-400 uppercase mb-0.5">Nombre de la Sala:</label>
                <input
                  type="text"
                  maxLength={24}
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 px-2.5 py-1 text-xs font-pixel-heading text-yellow-300 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Mode Selection */}
              <div className="mb-2.5">
                <label className="block text-[9px] font-pixel-body text-zinc-400 uppercase mb-1">Modalidad de Juego:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ffa', name: 'TODOS VS TODOS', desc: '4 Jugadores (FFA)', icon: '💥' },
                    { id: '2v2', name: '2 VS 2 (EQUIPOS)', desc: 'Equipo Rojo vs Azul', icon: '🤝' },
                    { id: '1v1', name: '1 VS 1 (DUELO)', desc: '2 Jugadores Máximo', icon: '⚔️' },
                  ].map((m) => {
                    const isSel = newRoomMode === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setNewRoomMode(m.id as MultiplayerMode)}
                        className={`pixel-btn p-2 text-center cursor-pointer border ${
                          isSel ? 'pixel-box-gold text-black scale-105' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="text-base">{m.icon}</div>
                        <div className="font-pixel-heading text-[10px] mt-0.5">{m.name}</div>
                        <div className="font-pixel-body text-[8px] opacity-80">{m.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Arena Selection */}
              <div>
                <label className="block text-[9px] font-pixel-body text-zinc-400 uppercase mb-1">Arena de Batalla:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {ARENAS.map((arena) => {
                    const isSel = newRoomArena === arena.id;
                    return (
                      <div
                        key={arena.id}
                        onClick={() => setNewRoomArena(arena.id)}
                        className={`pixel-btn p-1.5 text-center cursor-pointer border ${
                          isSel ? 'bg-zinc-900 border-2 scale-105' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                        }`}
                        style={{ borderColor: isSel ? arena.themeColor : undefined }}
                      >
                        <div className="text-base">{arena.icon}</div>
                        <div className="font-pixel-heading text-[9px] text-white leading-tight mt-0.5">{arena.name}</div>
                        <div className="font-pixel-body text-[7px] uppercase font-bold mt-0.5" style={{ color: arena.themeColor }}>
                          {arena.subtitle}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  sound.playCoin();
                  setShowCreateModal(false);
                }}
                className="pixel-btn pixel-box-dark px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                CANCELAR
              </button>

              <button
                type="submit"
                className="pixel-btn pixel-box-red px-5 py-1.5 text-xs font-pixel-heading text-yellow-300 hover:scale-105"
              >
                🥊 CREAR Y ENTRAR A LA SALA
              </button>
            </div>
          </form>
        )}

        {/* FOOTER INSTRUCTIONS */}
        <div className="pt-2 border-t border-zinc-800 text-center font-pixel-body text-[8px] text-zinc-500 flex items-center justify-between">
          <span>Tú eres: <strong className="text-yellow-300">{playerName}</strong></span>
          <span>PARTIDAS ONLINE SINCRONIZADAS EN TIEMPO REAL</span>
        </div>
      </div>
    </div>
  );
};
