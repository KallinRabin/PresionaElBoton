import { RoomInfo, RoomPlayer, MultiplayerMode, ArenaId, PlayerNetState } from '../types';

export class NetworkManager {
  private ws: WebSocket | null = null;
  public localPlayerId: string = '';
  public currentRoom: RoomInfo | null = null;
  public isConnected: boolean = false;
  public serverUrl: string = '';

  // Callbacks
  public onRoomListCallback?: (rooms: RoomInfo[]) => void;
  public onRoomJoinedCallback?: (room: RoomInfo, localPlayerId: string) => void;
  public onRoomUpdateCallback?: (room: RoomInfo) => void;
  public onGameStartCallback?: (room: RoomInfo, spawns: Record<string, number>) => void;
  public onPeerStateCallback?: (state: PlayerNetState) => void;
  public onCombatHitCallback?: (data: any) => void;
  public onAbilityCastCallback?: (data: any) => void;
  public onButtonPressCallback?: (data: any) => void;
  public onItemPickupCallback?: (data: any) => void;
  public onPlayerKOCallback?: (data: any) => void;
  public onPlayerDisconnectedCallback?: (data: { playerId: string; playerName: string; remainingPlayersCount: number }) => void;
  public onMatchEndCallback?: (data: any) => void;
  public onRematchUpdateCallback?: (data: { votesCount: number; totalNeeded: number; agreedPlayerIds: string[] }) => void;
  public onRematchCancelledCallback?: (data: { reason: string }) => void;
  public onErrorCallback?: (message: string) => void;
  public onConnectStatusChange?: (connected: boolean) => void;

  constructor() {
    this.serverUrl = this.getDefaultServerUrl();
  }

  public getDefaultServerUrl(): string {
    if (typeof window === 'undefined') return 'ws://localhost:3001';
    const hostname = window.location.hostname || 'localhost';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // If running on standard Render/Cloud deployment (ports 80/443), connect to the same host/protocol
    if (window.location.port === '' || window.location.port === '80' || window.location.port === '443') {
      return `${protocol}//${window.location.host}`;
    }
    // Local dev default
    return `${protocol}//${hostname}:3001`;
  }

  public connect(customUrl?: string) {
    if (customUrl) {
      this.serverUrl = customUrl;
    }
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        if (this.onConnectStatusChange) this.onConnectStatusChange(true);
        this.getRooms();
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.currentRoom = null;
        if (this.onConnectStatusChange) this.onConnectStatusChange(false);
      };

      this.ws.onerror = (err) => {
        console.warn('[Multiplayer] WebSocket Error:', err);
        if (this.onErrorCallback) this.onErrorCallback('Error de conexión con el servidor.');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (e) {
          console.error('[Multiplayer] Failed to parse message:', e);
        }
      };
    } catch (err) {
      console.error('[Multiplayer] Connection failed:', err);
      if (this.onErrorCallback) this.onErrorCallback('No se pudo conectar al servidor.');
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.currentRoom = null;
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private handleServerMessage(data: any) {
    switch (data.type) {
      case 'ROOM_LIST':
        if (this.onRoomListCallback) this.onRoomListCallback(data.rooms);
        break;

      case 'ROOM_JOINED':
        this.currentRoom = data.room;
        this.localPlayerId = data.localPlayerId;
        if (this.onRoomJoinedCallback) this.onRoomJoinedCallback(data.room, data.localPlayerId);
        break;

      case 'ROOM_UPDATE':
        this.currentRoom = data.room;
        if (this.onRoomUpdateCallback) this.onRoomUpdateCallback(data.room);
        break;

      case 'GAME_START':
        this.currentRoom = data.room;
        if (this.onGameStartCallback) this.onGameStartCallback(data.room, data.spawns);
        break;

      case 'PEER_STATE':
        if (this.onPeerStateCallback) this.onPeerStateCallback(data.state);
        break;

      case 'COMBAT_HIT':
        if (this.onCombatHitCallback) this.onCombatHitCallback(data);
        break;

      case 'ABILITY_CAST':
        if (this.onAbilityCastCallback) this.onAbilityCastCallback(data);
        break;

      case 'BUTTON_PRESS':
        if (this.onButtonPressCallback) this.onButtonPressCallback(data);
        break;

      case 'ITEM_PICKUP':
        if (this.onItemPickupCallback) this.onItemPickupCallback(data);
        break;

      case 'PLAYER_KO':
        if (this.onPlayerKOCallback) this.onPlayerKOCallback(data);
        break;

      case 'PLAYER_DISCONNECTED':
        if (this.onPlayerDisconnectedCallback) this.onPlayerDisconnectedCallback(data);
        break;

      case 'MATCH_END':
        if (this.onMatchEndCallback) this.onMatchEndCallback(data);
        break;

      case 'REMATCH_UPDATE':
        if (this.onRematchUpdateCallback) {
          this.onRematchUpdateCallback({
            votesCount: data.votesCount,
            totalNeeded: data.totalNeeded,
            agreedPlayerIds: data.agreedPlayerIds,
          });
        }
        break;

      case 'REMATCH_CANCELLED':
        if (this.onRematchCancelledCallback) {
          this.onRematchCancelledCallback({ reason: data.reason });
        }
        break;

      case 'ERROR':
        if (this.onErrorCallback) this.onErrorCallback(data.message);
        break;
    }
  }

  // --- ACTIONS ---

  public getRooms() {
    this.send({ type: 'GET_ROOMS' });
  }

  public createRoom(
    roomName: string,
    mode: MultiplayerMode,
    arenaId: ArenaId,
    player: { name: string; classId: string; skinId: string; bannerId?: string }
  ) {
    this.send({
      type: 'CREATE_ROOM',
      roomName,
      mode,
      arenaId,
      player,
    });
  }

  public joinRoom(roomId: string, player: { name: string; classId: string; skinId: string; bannerId?: string }) {
    this.send({
      type: 'JOIN_ROOM',
      roomId,
      player,
    });
  }

  public toggleReady() {
    this.send({ type: 'TOGGLE_READY' });
  }

  public switchTeam(team: 'red' | 'blue') {
    this.send({ type: 'SWITCH_TEAM', team });
  }

  public startGame() {
    this.send({ type: 'START_GAME' });
  }

  public leaveRoom() {
    this.send({ type: 'LEAVE_ROOM' });
    this.currentRoom = null;
  }

  public requestRematch() {
    this.send({ type: 'REMATCH_REQUEST' });
  }

  public cancelRematch() {
    this.send({ type: 'REMATCH_CANCEL' });
  }

  public sendPlayerState(state: PlayerNetState) {
    this.send({
      type: 'PLAYER_STATE',
      state,
    });
  }

  public sendCombatHit(data: {
    attackerId: string;
    targetId: string;
    damage: number;
    knockback: number;
    isIcePunch?: boolean;
    isHomeRunBat?: boolean;
  }) {
    this.send({
      type: 'COMBAT_HIT',
      ...data,
    });
  }

  public sendAbilityCast(data: {
    playerId: string;
    classId: string;
    position: { x: number; y: number; z: number };
    forward: { x: number; y: number; z: number };
  }) {
    this.send({
      type: 'ABILITY_CAST',
      ...data,
    });
  }

  public sendButtonPress(data: { byPlayerId: string }) {
    this.send({
      type: 'BUTTON_PRESS',
      ...data,
    });
  }

  public sendPlayerKO(data: { victimId: string; killerId: string; killerName: string; victimName: string }) {
    this.send({
      type: 'PLAYER_KO',
      ...data,
    });
  }

  public sendMatchEnd(data: { winnerId: string; winnerName: string; reason: string }) {
    this.send({
      type: 'MATCH_END',
      ...data,
    });
  }
}

export const networkManager = new NetworkManager();
