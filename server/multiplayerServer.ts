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
  rematchVotes: Set<string>;
}

const app = express();

// Robust static dist path resolution for both local and Render
const distPath = fs.existsSync(path.resolve(process.cwd(), 'dist'))
  ? path.resolve(process.cwd(), 'dist')
  : path.resolve(__dirname, '../dist');

console.log(`[Server] Serving static files from: ${distPath}`);

app.use(express.static(distPath));

app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Smash del Boton</title></head>
        <body style="background:#090a14;color:#fef08a;font-family:sans-serif;text-align:center;padding:50px;">
          <h1>🥊 Smash del Boton Server</h1>
          <p>Servidor en línea.</p>
        </body>
      </html>
    `);
  }
});

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
    maxPlayers: room.maxPlayers,
    isPlaying: room.isPlaying,
    playersCount: room.players.size,
    players: playersList,
    rematchVotesCount: room.rematchVotes ? room.rematchVotes.size : 0,
  };
}

function broadcastRoomList() {
  const roomList: any[] = [];
  rooms.forEach((r) => {
    if (r.players.size > 0) {
      roomList.push(getPublicRoomInfo(r));
    }
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

// Global Garbage Collector: Purge empty or abandoned rooms every 5 seconds
setInterval(() => {
  let changed = false;
  rooms.forEach((room, roomId) => {
    // Purge disconnected sockets from room
    room.players.forEach((p, pId) => {
      if (!p.ws || p.ws.readyState !== WebSocket.OPEN) {
        room.players.delete(pId);
        room.rematchVotes.delete(pId);
        changed = true;
      }
    });

    // Delete empty rooms
    if (room.players.size === 0) {
      rooms.delete(roomId);
      changed = true;
    } else if (room.isPlaying && room.players.size === 1) {
      // Abandoned match
      room.isPlaying = false;
      changed = true;
    }
  });

  if (changed) {
    broadcastRoomList();
  }
}, 5000);

wss.on('connection', (ws: WebSocket) => {
  let currentPlayerId: string | null = null;
  let currentRoomId: string | null = null;

  function purgePlayerFromAllRooms(playerId?: string) {
    let wasPurged = false;
    rooms.forEach((r, rId) => {
      if (r.players.has(ws as any) || (playerId && r.players.has(playerId)) || (currentPlayerId && r.players.has(currentPlayerId))) {
        r.players.delete(playerId || currentPlayerId || '');
        r.rematchVotes.delete(playerId || currentPlayerId || '');
        if (r.players.size === 0 || r.hostId === playerId || r.hostId === currentPlayerId) {
          rooms.delete(rId);
        } else {
          // Transfer host
          const nextP = r.players.values().next().value;
          if (nextP) {
            nextP.isHost = true;
            r.hostId = nextP.id;
            r.hostName = nextP.name;
          }
          broadcastToRoom(r, { type: 'ROOM_UPDATE', room: getPublicRoomInfo(r) });
        }
        wasPurged = true;
      }
    });
    return wasPurged;
  }

  function leaveCurrentRoom() {
    if (!currentRoomId || !currentPlayerId) {
      purgePlayerFromAllRooms();
      broadcastRoomList();
      return;
    }
    const room = rooms.get(currentRoomId);
    if (room) {
      room.players.delete(currentPlayerId);
      room.rematchVotes.delete(currentPlayerId);

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
        // Cancel any pending rematch and inform remaining players
        broadcastToRoom(room, {
          type: 'REMATCH_CANCELLED',
          reason: 'Un jugador salió de la sala.',
        });
        broadcastToRoom(room, {
          type: 'ROOM_UPDATE',
          room: getPublicRoomInfo(room),
        });
      }
    }

    currentRoomId = null;
    currentPlayerId = null;
    broadcastRoomList();
  }

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const { type } = data;

      // 1. Get Room List
      if (type === 'GET_ROOMS') {
        const roomList: any[] = [];
        rooms.forEach((r) => {
          if (r.players.size > 0) roomList.push(getPublicRoomInfo(r));
        });
        ws.send(JSON.stringify({ type: 'ROOM_LIST', rooms: roomList }));
      }

      // 2. Create Room (Strict 1 Room per Player)
      else if (type === 'CREATE_ROOM') {
        const { roomName, mode, arenaId, player } = data;

        // Leave & purge any existing room
        leaveCurrentRoom();
        purgePlayerFromAllRooms(player.id);

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
          rematchVotes: new Set(),
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

        // Leave any existing room first
        leaveCurrentRoom();
        purgePlayerFromAllRooms(player.id);

        const room = rooms.get(roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'La sala ya no existe o fue cerrada.' }));
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

        player.team = data.team === 'blue' ? 'blue' : 'red';

        broadcastToRoom(room, {
          type: 'ROOM_UPDATE',
          room: getPublicRoomInfo(room),
        });
      }

      // 6. Start Game (Host only)
      else if (type === 'START_GAME') {
        if (!currentRoomId || !currentPlayerId) return;
        const room = rooms.get(currentRoomId);
        if (!room || room.hostId !== currentPlayerId) return;
        if (room.players.size < 2) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Se necesitan al menos 2 jugadores para iniciar.' }));
          return;
        }

        room.isPlaying = true;
        room.rematchVotes.clear();

        const spawns: Record<string, number> = {};
        let spawnIndex = 0;
        room.players.forEach((p) => {
          spawns[p.id] = spawnIndex % 4;
          spawnIndex++;
        });

        broadcastToRoom(room, {
          type: 'GAME_START',
          room: getPublicRoomInfo(room),
          spawns,
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
        type === 'PLAYER_KO'
      ) {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;

        broadcastToRoom(room, data, type === 'COMBAT_HIT' ? undefined : currentPlayerId || undefined);
      }

      // 9. Match End & Rematch System
      else if (type === 'MATCH_END') {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;

        room.isPlaying = false;
        room.rematchVotes.clear();

        broadcastToRoom(room, data);
        broadcastRoomList();
      }

      // 10. Rematch Request & Agreement (All players must agree)
      else if (type === 'REMATCH_REQUEST') {
        if (!currentRoomId || !currentPlayerId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;

        room.rematchVotes.add(currentPlayerId);

        // Notify room about current votes
        broadcastToRoom(room, {
          type: 'REMATCH_UPDATE',
          votesCount: room.rematchVotes.size,
          totalNeeded: room.players.size,
          agreedPlayerIds: Array.from(room.rematchVotes),
        });

        // If all connected players agree (and at least 2 players exist)
        if (room.rematchVotes.size >= room.players.size && room.players.size >= 2) {
          room.isPlaying = true;
          room.rematchVotes.clear();

          const spawns: Record<string, number> = {};
          let spawnIdx = 0;
          room.players.forEach((p) => {
            spawns[p.id] = spawnIdx % 4;
            spawnIdx++;
          });

          broadcastToRoom(room, {
            type: 'GAME_START',
            room: getPublicRoomInfo(room),
            spawns,
          });

          broadcastRoomList();
        }
      }

      // 11. Rematch Cancel / Exit
      else if (type === 'REMATCH_CANCEL') {
        if (!currentRoomId || !currentPlayerId) return;
        const room = rooms.get(currentRoomId);
        if (room) {
          room.rematchVotes.delete(currentPlayerId);
          broadcastToRoom(room, {
            type: 'REMATCH_CANCELLED',
            reason: 'Un jugador canceló la revancha.',
          });
        }
      }

      // 12. Leave Room
      else if (type === 'LEAVE_ROOM') {
        leaveCurrentRoom();
      }
    } catch (err) {
      console.error('Error processing WS message:', err);
    }
  });

  ws.on('close', () => {
    leaveCurrentRoom();
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Multiplayer] Smash del Boton Server running on http://0.0.0.0:${PORT}`);
});
