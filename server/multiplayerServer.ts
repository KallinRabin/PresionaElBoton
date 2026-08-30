import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

export type MultiplayerMode = 'ffa' | '2v2' | '1v1';
export type PlayerTeam = 'red' | 'blue';

export interface RoomPlayer {
  id: string;
  name: string;
  classId: string;
  skinId: string;
  bannerId?: string;
  team?: PlayerTeam;
  isHost: boolean;
  isReady: boolean;
  ws?: WebSocket;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  mode: MultiplayerMode;
  arenaId: string;
  maxPlayers: number;
  isPlaying: boolean;
  players: Map<string, RoomPlayer>;
}

const app = express();
const distPath = path.join(__dirname, '../dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ status: 'online', game: 'Smash del Boton Server' });
  });
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const rooms = new Map<string, Room>();

function getPublicRoomInfo(room: Room) {
  const playersList: any[] = [];
  room.players.forEach((p) => {
    playersList.push({
      id: p.id,
      name: p.name,
      classId: p.classId,
      skinId: p.skinId,
      bannerId: p.bannerId,
      team: p.team,
      isHost: p.isHost,
      isReady: p.isReady,
    });
  });

  return {
    id: room.id,
    name: room.name,
    hostId: room.hostId,
    hostName: room.hostName,
    mode: room.mode,
    arenaId: room.arenaId,
    playersCount: room.players.size,
    maxPlayers: room.maxPlayers,
    isPlaying: room.isPlaying,
    players: playersList,
  };
}

function broadcastRoomList() {
  const roomList: any[] = [];
  rooms.forEach((r) => {
    roomList.push(getPublicRoomInfo(r));
  });

  const message = JSON.stringify({
    type: 'ROOM_LIST',
    rooms: roomList,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function broadcastToRoom(room: Room, message: any, excludePlayerId?: string) {
  const msgStr = typeof message === 'string' ? message : JSON.stringify(message);
  room.players.forEach((p) => {
    if (p.id !== excludePlayerId && p.ws && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(msgStr);
    }
  });
}

wss.on('connection', (ws: WebSocket) => {
  let currentPlayerId: string | null = null;
  let currentRoomId: string | null = null;

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const { type } = data;

      // 1. Get Room List
      if (type === 'GET_ROOMS') {
        const roomList: any[] = [];
        rooms.forEach((r) => roomList.push(getPublicRoomInfo(r)));
        ws.send(JSON.stringify({ type: 'ROOM_LIST', rooms: roomList }));
      }

      // 2. Create Room
      else if (type === 'CREATE_ROOM') {
        const { roomName, mode, arenaId, player } = data;
        const roomId = 'room_' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const maxPlayers = mode === '1v1' ? 2 : 4;

        const newPlayer: RoomPlayer = {
          id: player.id || 'p_' + Math.random().toString(36).substring(2, 7),
          name: player.name || 'JUGADOR',
          classId: player.classId || 'brawler',
          skinId: player.skinId || 'pixel_knight',
          bannerId: player.bannerId,
          team: mode === '2v2' ? 'red' : undefined,
          isHost: true,
          isReady: true,
          ws,
        };

        const room: Room = {
          id: roomId,
          name: roomName || `Sala de ${newPlayer.name}`,
          hostId: newPlayer.id,
          hostName: newPlayer.name,
          mode: mode || 'ffa',
          arenaId: arenaId || 'arcade_core',
          maxPlayers,
          isPlaying: false,
          players: new Map([[newPlayer.id, newPlayer]]),
        };

        rooms.set(roomId, room);
        currentPlayerId = newPlayer.id;
        currentRoomId = roomId;

        ws.send(
          JSON.stringify({
            type: 'ROOM_JOINED',
            room: getPublicRoomInfo(room),
            localPlayerId: newPlayer.id,
          })
        );

        broadcastRoomList();
      }

      // 3. Join Room
      else if (type === 'JOIN_ROOM') {
        const { roomId, player } = data;
        const room = rooms.get(roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'La sala no existe.' }));
          return;
        }
        if (room.isPlaying) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'La partida ya ha comenzado.' }));
          return;
        }
        if (room.players.size >= room.maxPlayers) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'La sala está llena.' }));
          return;
        }

        // Determine team for 2v2
        let assignedTeam: PlayerTeam | undefined = undefined;
        if (room.mode === '2v2') {
          let redCount = 0;
          let blueCount = 0;
          room.players.forEach((p) => {
            if (p.team === 'red') redCount++;
            if (p.team === 'blue') blueCount++;
          });
          assignedTeam = redCount <= blueCount ? 'red' : 'blue';
        }

        const newPlayer: RoomPlayer = {
          id: player.id || 'p_' + Math.random().toString(36).substring(2, 7),
          name: player.name || 'JUGADOR',
          classId: player.classId || 'brawler',
          skinId: player.skinId || 'pixel_knight',
          bannerId: player.bannerId,
          team: assignedTeam,
          isHost: false,
          isReady: false,
          ws,
        };

        room.players.set(newPlayer.id, newPlayer);
        currentPlayerId = newPlayer.id;
        currentRoomId = roomId;

        ws.send(
          JSON.stringify({
            type: 'ROOM_JOINED',
            room: getPublicRoomInfo(room),
            localPlayerId: newPlayer.id,
          })
        );

        broadcastToRoom(room, {
          type: 'ROOM_UPDATE',
          room: getPublicRoomInfo(room),
        });

        broadcastRoomList();
      }

      // 4. Toggle Ready State
      else if (type === 'TOGGLE_READY') {
        if (!currentRoomId || !currentPlayerId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;
        const player = room.players.get(currentPlayerId);
        if (!player) return;

        player.isReady = !player.isReady;
        broadcastToRoom(room, {
          type: 'ROOM_UPDATE',
          room: getPublicRoomInfo(room),
        });
      }

      // 5. Switch Team (2v2 mode)
      else if (type === 'SWITCH_TEAM') {
        if (!currentRoomId || !currentPlayerId) return;
        const room = rooms.get(currentRoomId);
        if (!room || room.mode !== '2v2') return;
        const player = room.players.get(currentPlayerId);
        if (!player) return;

        const targetTeam: PlayerTeam = data.team;
        let count = 0;
        room.players.forEach((p) => {
          if (p.team === targetTeam) count++;
        });

        if (count < 2) {
          player.team = targetTeam;
          broadcastToRoom(room, {
            type: 'ROOM_UPDATE',
            room: getPublicRoomInfo(room),
          });
        }
      }

      // 6. Start Game (Host only)
      else if (type === 'START_GAME') {
        if (!currentRoomId || !currentPlayerId) return;
        const room = rooms.get(currentRoomId);
        if (!room || room.hostId !== currentPlayerId) return;

        // Check if ready or enough players
        if (room.players.size < (room.mode === '1v1' ? 2 : 2)) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Se necesitan al menos 2 jugadores para iniciar.' }));
          return;
        }

        room.isPlaying = true;

        const spawnIndices: Record<string, number> = {};
        let idx = 0;
        room.players.forEach((p) => {
          spawnIndices[p.id] = idx % 4;
          idx++;
        });

        broadcastToRoom(room, {
          type: 'GAME_START',
          room: getPublicRoomInfo(room),
          spawns: spawnIndices,
        });

        broadcastRoomList();
      }

      // 7. Synchronize Player State (20-30Hz)
      else if (type === 'PLAYER_STATE') {
        if (!currentRoomId || !currentPlayerId) return;
        const room = rooms.get(currentRoomId);
        if (!room || !room.isPlaying) return;

        broadcastToRoom(
          room,
          {
            type: 'PEER_STATE',
            state: data.state,
          },
          currentPlayerId
        );
      }

      // 8. Combat & Action Events Relay
      else if (
        type === 'COMBAT_HIT' ||
        type === 'ABILITY_CAST' ||
        type === 'BUTTON_PRESS' ||
        type === 'ITEM_SPAWN' ||
        type === 'ITEM_PICKUP' ||
        type === 'PLAYER_KO' ||
        type === 'MATCH_END'
      ) {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;

        broadcastToRoom(room, data, type === 'COMBAT_HIT' ? undefined : currentPlayerId || undefined);
      }

      // 9. Leave Room
      else if (type === 'LEAVE_ROOM') {
        leaveCurrentRoom();
      }
    } catch (err) {
      console.error('Error processing WS message:', err);
    }
  });

  function leaveCurrentRoom() {
    if (!currentRoomId || !currentPlayerId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    room.players.delete(currentPlayerId);

    if (room.players.size === 0) {
      rooms.delete(currentRoomId);
    } else {
      // If host left, transfer host to next player
      if (room.hostId === currentPlayerId) {
        const nextPlayer = room.players.values().next().value;
        if (nextPlayer) {
          nextPlayer.isHost = true;
          room.hostId = nextPlayer.id;
          room.hostName = nextPlayer.name;
        }
      }
      broadcastToRoom(room, {
        type: 'ROOM_UPDATE',
        room: getPublicRoomInfo(room),
      });
    }

    currentRoomId = null;
    currentPlayerId = null;
    broadcastRoomList();
  }

  ws.on('close', () => {
    leaveCurrentRoom();
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Multiplayer] Smash del Boton Server running on http://0.0.0.0:${PORT}`);
});
