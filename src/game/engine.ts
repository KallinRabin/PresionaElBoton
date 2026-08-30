import * as THREE from 'three';
import {
  GameMode,
  PlayerStats,
  MatchResult,
  GameEvent,
  ClassId,
  ItemType,
  SpawnedItem,
  CharacterSkin,
  ButtonSkin,
  KillBanner,
  TrailEffect,
  EliminationEvent,
  ArenaId,
  CrazyButtonEvent,
  RoomInfo,
  PlayerNetState,
} from '../types';
import { PLAYER_CLASSES } from '../data/classes';
import { INITIAL_SKINS, INITIAL_BANNERS } from '../data/shopItems';
import { ARENAS } from '../data/arenas';
import { Character3D } from './characters';
import { World3DArena, Giant3DButton } from './world';
import { SmashBotController } from './botAI';
import { ParticleSystem3D } from './particles';
import { sound } from './audio';
import { networkManager } from './network';

export class GameEngine3D {
  private canvas: HTMLCanvasElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particleSystem: ParticleSystem3D;
  private world: World3DArena;
  private giantButton: Giant3DButton;

  // Characters & Entities
  public player: Character3D | null = null;
  private bots: SmashBotController[] = [];
  public allCharacters: Character3D[] = [];
  private plantedMines: Array<{ id: string; position: THREE.Vector3; mesh: THREE.Mesh; owner: Character3D }> = [];

  // Multiplayer Network State
  public isMultiplayer: boolean = false;
  public currentRoomInfo: RoomInfo | null = null;
  public remoteCharacters: Map<string, Character3D> = new Map();
  private netSyncTimer: number = 0;

  // Match State
  private mode: GameMode = 'classic';
  private matchTimeLeft: number = 90;
  private isMatchRunning: boolean = false;
  private isPaused: boolean = false;
  private currentEvent: GameEvent | null = null;
  private itemSpawnTimer: number = 8;
  private nextEventTimer: number = 22;
  private leaderboardTimer: number = 0;

  // Crazy Button State
  private crazyButtonTimer: number = 20;
  public currentCrazyEvent: CrazyButtonEvent | null = null;

  // Cosmetics & Profile
  public playerBanner: KillBanner = INITIAL_BANNERS[0];
  public botBanners: KillBanner[] = [];

  // Spectator System
  public isSpectating: boolean = false;
  public spectateTargetIndex: number = 0;

  // Camera Mouse Look & 3rd Person Control
  public cameraYaw: number = 0;
  public cameraPitch: number = 0.15;
  public isPointerLocked: boolean = false;
  private isMouseDownForDrag: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  // Jump Reliability & Coyote / Air Jump
  private playerCoyoteTime: number = 0;
  private playerAirJumps: number = 1;

  // Input State
  private keysPressed: { [key: string]: boolean } = {};
  private joystickVector: { x: number; y: number } = { x: 0, y: 0 };

  // Callbacks
  public onStatsUpdate: ((playerStats: PlayerStats, allStats: PlayerStats[]) => void) | null = null;
  public onTimeUpdate: ((timeLeft: number) => void) | null = null;
  public onEventUpdate: ((event: GameEvent | null) => void) | null = null;
  public onCrazyButtonUpdate: ((event: CrazyButtonEvent | null) => void) | null = null;
  public onCrazyButtonPressed: ((isPlayer: boolean, event: CrazyButtonEvent) => void) | null = null;
  public onMatchEnd: ((result: MatchResult) => void) | null = null;
  public onPlayerEliminated: ((killerStats: PlayerStats | null, killerBanner: KillBanner | null) => void) | null = null;
  public onKillElimination: ((event: EliminationEvent) => void) | null = null;
  public onSpectateTargetChange: ((targetStats: PlayerStats) => void) | null = null;
  public onPauseRequested: (() => void) | null = null;
  public cameraSensitivityMultiplier: number = 1.0;

  // Animation Frame & Clock
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();

    // 1. Three.js Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0c0d19');
    this.scene.fog = new THREE.FogExp2('#0c0d19', 0.015);

    // 2. Locked 3D Third-Person Perspective Camera
    this.camera = new THREE.PerspectiveCamera(
      54,
      window.innerWidth / window.innerHeight,
      0.1,
      250
    );
    this.camera.position.set(0, 7.5, 14);
    this.camera.lookAt(0, 1.2, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    // 4. Arena Lights
    this.setupLighting();

    // 5. Particles, Arena & Central Giant Button
    this.particleSystem = new ParticleSystem3D(this.scene);
    this.world = new World3DArena(this.scene, this.particleSystem);
    this.giantButton = new Giant3DButton(this.scene, this.particleSystem);

    this.bindInputs();
    this.loop();
  }

  private setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    dirLight.position.set(14, 25, 12);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.camera.left = -22;
    dirLight.shadow.camera.right = 22;
    dirLight.shadow.camera.top = 22;
    dirLight.shadow.camera.bottom = -22;
    this.scene.add(dirLight);

    const cyanRim = new THREE.PointLight(0x38bdf8, 1.2, 35);
    cyanRim.position.set(-16, 6, -10);
    this.scene.add(cyanRim);

    const goldRim = new THREE.PointLight(0xf59e0b, 1.2, 35);
    goldRim.position.set(16, 6, 10);
    this.scene.add(goldRim);
  }

  private bindInputs() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
    window.addEventListener('contextmenu', this.handleContextMenu);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
  }

  private handleResize = () => {
    if (!this.canvas) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  private handlePointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keysPressed[e.key.toLowerCase()] = true;
    if (e.code) this.keysPressed[e.code.toLowerCase()] = true;

    // Escape = Pause / Exit Game Menu
    if (e.key === 'Escape' || e.code === 'Escape') {
      if (this.onPauseRequested) {
        this.onPauseRequested();
      }
      return;
    }

    // Space = SALTO PURO (Strictly Jump, with preventDefault to avoid scrolling or button click triggers)
    if (e.code === 'Space') {
      e.preventDefault();
      this.triggerPlayerJump();
      return;
    }

    // Key E = Class Unique Signature Ability ONLY (no mouse click activation)
    if (e.key.toLowerCase() === 'e') {
      this.triggerPlayerAbility();
    }

    // Key F or J = Alternative Punch Key
    if (e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'j') {
      this.triggerPlayerPunch();
    }
  };

  public requestPointerLock() {
    try {
      if (this.canvas && document.pointerLockElement !== this.canvas) {
        const promise = this.canvas.requestPointerLock?.();
        if (promise && typeof (promise as any).catch === 'function') {
          (promise as any).catch(() => {});
        }
      }
    } catch (e) {
      // Ignored
    }
  }

  public exitPointerLock() {
    try {
      if (typeof document !== 'undefined' && document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    } catch (e) {
      // Ignored
    }
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      this.exitPointerLock();
    }
  }

  public getPaused(): boolean {
    return this.isPaused;
  }

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysPressed[e.key.toLowerCase()] = false;
    if (e.code) this.keysPressed[e.code.toLowerCase()] = false;
  };

  private handleMouseDown = (e: MouseEvent) => {
    // Request pointer lock when clicking inside active match
    if (this.isMatchRunning && !this.isPaused && document.pointerLockElement !== this.canvas) {
      this.requestPointerLock();
    }

    // Left Click: Steal Glove Punch
    if (e.button === 0) {
      this.triggerPlayerPunch();
    } else if (e.button === 2) {
      // Right click is strictly for camera dragging and NEVER triggers ability or attack
      e.preventDefault();
      e.stopPropagation();
    }

    this.isMouseDownForDrag = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  };

  private handleMouseUp = () => {
    this.isMouseDownForDrag = false;
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isMatchRunning || this.isPaused) return;

    if (this.isPointerLocked) {
      // Pointer Lock FPS/Action Camera Orbit
      const sensitivity = 0.0032 * this.cameraSensitivityMultiplier;
      this.cameraYaw -= e.movementX * sensitivity;
      this.cameraPitch = Math.max(-0.25, Math.min(0.65, this.cameraPitch + e.movementY * sensitivity));
    } else if (this.isMouseDownForDrag) {
      // Fallback Mouse Drag Orbit
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      const sensitivity = 0.005 * this.cameraSensitivityMultiplier;
      this.cameraYaw -= dx * sensitivity;
      this.cameraPitch = Math.max(-0.25, Math.min(0.65, this.cameraPitch + dy * sensitivity));
    }
  };

  // Start a new Smash match (Offline vs Bots OR Online Multiplayer)
  public startMatch(
    mode: GameMode,
    playerSkin: CharacterSkin,
    playerClassId: ClassId,
    buttonSkin?: ButtonSkin,
    playerBanner?: KillBanner,
    trailEffect?: TrailEffect,
    arenaId: ArenaId = 'arcade_core',
    playerName: string = 'JUGADOR',
    isMultiplayer: boolean = false,
    roomInfo?: RoomInfo,
    spawns?: Record<string, number>
  ) {
    this.mode = mode;
    this.matchTimeLeft = mode === 'coin_frenzy' ? 60 : 90;
    this.isMatchRunning = true;
    this.isPaused = false;
    this.isSpectating = false;
    this.spectateTargetIndex = 0;
    this.currentEvent = null;
    this.currentCrazyEvent = null;
    this.itemSpawnTimer = 6;
    this.nextEventTimer = 20;
    this.crazyButtonTimer = 16 + Math.random() * 6;
    this.isMultiplayer = isMultiplayer;
    this.currentRoomInfo = roomInfo || null;

    // 1. Build Thematic Arena
    const chosenArena = ARENAS.find((a) => a.id === arenaId) || ARENAS[0];
    this.world.destroy(this.scene);
    this.world = new World3DArena(this.scene, this.particleSystem, chosenArena);
    this.scene.background = new THREE.Color(chosenArena.skyColor);
    this.scene.fog = new THREE.FogExp2(chosenArena.skyColor, 0.015);

    if (playerBanner) {
      this.playerBanner = playerBanner;
    }

    this.giantButton.setCrazyEvent(null);
    if (buttonSkin) {
      this.giantButton.applyButtonSkin(buttonSkin.capColor, buttonSkin.baseColor);
    }

    // Clear previous entities
    this.allCharacters.forEach((c) => c.destroy(this.scene));
    this.allCharacters = [];
    this.bots = [];
    this.remoteCharacters.clear();
    this.plantedMines.forEach((m) => this.scene.remove(m.mesh));
    this.plantedMines = [];
    this.particleSystem.clearAll();

    if (isMultiplayer && roomInfo) {
      // MULTIPLAYER MATCH: Setup local player + remote peers
      const localId = networkManager.localPlayerId;
      const localRoomP = roomInfo.players.find((p) => p.id === localId);
      const finalName = (localRoomP?.name || playerName || 'JUGADOR').toUpperCase();
      const localTeam = localRoomP?.team;

      this.player = new Character3D(
        true,
        playerSkin,
        playerClassId,
        finalName,
        this.particleSystem,
        localId,
        localTeam
      );
      const localSpawn = spawns && spawns[localId] !== undefined ? spawns[localId] : 0;
      this.player.group.position.copy(this.world.spawnPads[localSpawn % this.world.spawnPads.length]);
      this.scene.add(this.player.group);
      this.allCharacters.push(this.player);

      roomInfo.players.forEach((p) => {
        if (p.id === localId) return;

        const pSkin = INITIAL_SKINS.find((s) => s.id === p.skinId) || INITIAL_SKINS[0];
        const pClass = (p.classId as ClassId) || 'brawler';
        const remoteChar = new Character3D(
          false,
          pSkin,
          pClass,
          p.name.toUpperCase(),
          this.particleSystem,
          p.id,
          p.team
        );
        const spawnIdx = spawns && spawns[p.id] !== undefined ? spawns[p.id] : 1;
        remoteChar.group.position.copy(this.world.spawnPads[spawnIdx % this.world.spawnPads.length]);
        this.scene.add(remoteChar.group);
        this.allCharacters.push(remoteChar);
        this.remoteCharacters.set(p.id, remoteChar);
      });

      this.setupNetworkHandlers();
    } else {
      // SOLO OFFLINE MATCH: Create Player + 3 Bots
      const finalPlayerName = playerName.trim() ? playerName.trim().toUpperCase() : 'JUGADOR';
      this.player = new Character3D(true, playerSkin, playerClassId, finalPlayerName, this.particleSystem);
      this.player.group.position.copy(this.world.spawnPads[0]);
      this.scene.add(this.player.group);
      this.allCharacters.push(this.player);

      const botClasses: ClassId[] = [
        'brawler',
        'shadow_thief',
        'gravity_mage',
        'iron_guardian',
        'trapster',
        'pyro_fiend',
        'frost_valkyrie',
        'cyber_ninja',
      ].filter((c) => c !== playerClassId) as ClassId[];

      const botNames = ['Titán Bot', 'Sombra X', 'Mago Vórtice', 'Paladín 9000', 'Piro Bot', 'Valquiria X', 'Cyber Ninja'];
      const availableSkins = INITIAL_SKINS.filter((s) => s.id !== playerSkin.id);
      this.botBanners = INITIAL_BANNERS.slice(1);

      for (let i = 0; i < 3; i++) {
        const chosenClass = botClasses[i % botClasses.length];
        const botSkin = availableSkins[i % availableSkins.length] || INITIAL_SKINS[0];

        const botChar = new Character3D(
          false,
          botSkin,
          chosenClass,
          botNames[i],
          this.particleSystem
        );
        botChar.group.position.copy(this.world.spawnPads[(i + 1) % this.world.spawnPads.length]);
        this.scene.add(botChar.group);
        this.allCharacters.push(botChar);

        const botController = new SmashBotController(botChar);
        this.bots.push(botController);
      }
    }

    // Spawn 2 initial items
    this.world.spawnItem(this.scene);
    this.world.spawnItem(this.scene);

    sound.startBGM();
    this.updateLeaderboard(0.2);
  }

  private setupNetworkHandlers() {
    networkManager.onPeerStateCallback = (state: PlayerNetState) => {
      const remoteChar = this.remoteCharacters.get(state.id);
      if (!remoteChar || remoteChar.stats.isEliminated) return;

      remoteChar.group.position.set(state.x, state.y, state.z);
      remoteChar.facingAngle = state.facing;
      remoteChar.velocity.set(state.vx, state.vy, state.vz);
      remoteChar.isGrounded = state.isGrounded;
      remoteChar.stats.damagePercent = state.damagePercent;
      remoteChar.stats.stocks = state.stocks;
      remoteChar.stats.coins = state.coins;

      if (state.isPunching && !remoteChar.isPunching) {
        remoteChar.triggerPunch(state.punchType || 'normal');
        sound.playSmashPunch(remoteChar.stats.hasGiantGlove);
      }

      remoteChar.hasIceCharge = !!state.hasIceCharge;
      if (state.isFrozen && !remoteChar.isFrozen) {
        remoteChar.applyFreeze(1.0);
      }
    };

    networkManager.onCombatHitCallback = (data) => {
      if (data.targetId === networkManager.localPlayerId && this.player) {
        const attacker = this.allCharacters.find((c) => c.networkId === data.attackerId) || this.allCharacters[0];
        if (attacker) {
          this.player.receiveHit(attacker, data.damage, data.knockback, data.isIcePunch || data.isHomeRunBat);
          if (data.isIcePunch) {
            this.player.applyFreeze(1.0);
          }
        }
      }
    };

    networkManager.onAbilityCastCallback = (data) => {
      const remoteChar = this.remoteCharacters.get(data.playerId);
      if (remoteChar) {
        this.executeClassAbility(remoteChar);
      }
    };

    networkManager.onButtonPressCallback = (data) => {
      const char = this.allCharacters.find((c) => c.networkId === data.byPlayerId);
      if (char) {
        this.giantButton.press(char.group.position);
      }
    };

    networkManager.onPlayerKOCallback = (data) => {
      const banner = INITIAL_BANNERS[0];
      if (this.onKillElimination) {
        this.onKillElimination({
          id: 'ko_' + Date.now(),
          killerName: data.killerName,
          victimName: data.victimName,
          killerClassIcon: '🥊',
          victimClassIcon: '💀',
          killerBanner: banner,
          isPlayerKiller: data.killerId === networkManager.localPlayerId,
          isPlayerVictim: data.victimId === networkManager.localPlayerId,
          timestamp: Date.now(),
        });
      }
    };

    // Request pointer lock when battle arena starts
    this.requestPointerLock();
  }

  // Spectator mode handling
  public setSpectating(spectate: boolean) {
    this.isSpectating = spectate;
    this.spectateTargetIndex = 0;
    if (spectate && typeof document !== 'undefined' && document.pointerLockElement) {
      document.exitPointerLock?.();
    }
    const target = this.getSpectatedCharacter();
    if (target && this.onSpectateTargetChange) {
      this.onSpectateTargetChange({ ...target.stats });
    }
  }

  public cycleSpectateTarget(direction: 1 | -1) {
    const survivors = this.allCharacters.filter((c) => !c.stats.isEliminated);
    if (survivors.length === 0) return;
    this.spectateTargetIndex = (this.spectateTargetIndex + direction + survivors.length) % survivors.length;
    const target = this.getSpectatedCharacter();
    if (target && this.onSpectateTargetChange) {
      this.onSpectateTargetChange({ ...target.stats });
    }
  }

  public getSpectatedCharacter(): Character3D | null {
    const survivors = this.allCharacters.filter((c) => !c.stats.isEliminated);
    if (survivors.length === 0) return null;
    return survivors[this.spectateTargetIndex % survivors.length];
  }

  // --- PLAYER ACTIONS ---

  public triggerPlayerPunch() {
    if (!this.player || !this.isMatchRunning || this.isPaused) return;
    if (this.player.stats.attackCooldown > 0 || this.player.stats.isStunned) return;

    sound.playSmashPunch(this.player.stats.hasGiantGlove || this.player.stats.activeItem === 'bat');
    this.player.triggerPunch(this.player.stats.activeItem === 'bat' ? 'bat' : 'normal');

    // Execute punch hitbox check
    this.executePunchHitbox(this.player);
  }

  public triggerPlayerAbility() {
    if (!this.player || !this.isMatchRunning || this.isPaused) return;
    if (this.player.stats.abilityCooldown > 0 || this.player.stats.isStunned) return;

    this.executeClassAbility(this.player);
  }

  public triggerPlayerJump() {
    if (!this.player || !this.isMatchRunning || this.isPaused) return;
    if (this.player.stats.isStunned) return;

    if (this.player.isGrounded || this.playerCoyoteTime > 0) {
      this.player.velocity.y = 8.6;
      this.player.isGrounded = false;
      this.playerCoyoteTime = 0;
      this.playerAirJumps = 1;
      sound.playJump();
    } else if (this.playerAirJumps > 0) {
      // Double jump / Air recovery jump
      this.player.velocity.y = 7.8;
      this.playerAirJumps = 0;
      this.particleSystem.createSparkles(this.player.group.position, '#38bdf8');
      sound.playJump();
    }
  }

  public setJoystickMove(vec: { x: number; y: number }) {
    this.joystickVector = vec;
  }

  public setParticleEffectsEnabled(enabled: boolean) {
    if (this.particleSystem) {
      this.particleSystem.enabled = enabled;
    }
  }

  public setCameraSensitivity(multiplier: number) {
    this.cameraSensitivityMultiplier = Math.max(0.2, Math.min(3.0, multiplier));
  }

  // --- HITBOX & SMASH COMBAT LOGIC ---

  private executePunchHitbox(attacker: Character3D, isAbility: boolean = false, powerMult: number = 1.0) {
    if (attacker.stats.isEliminated) return;
    const attackerPos = attacker.group.position;
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), attacker.facingAngle);
    const reach = (attacker.stats.hasGiantGlove ? 3.6 : 2.6) * (attacker.stats.activeItem === 'bat' ? 1.3 : 1.0);

    // 1. Check hitting other fighters
    this.allCharacters.forEach((target) => {
      if (target === attacker || target.stats.isRespawning || target.stats.isEliminated) return;

      // In 2v2 mode: No friendly fire between teammates!
      if (attacker.team && target.team && attacker.team === target.team) return;

      const toTarget = new THREE.Vector3().subVectors(target.group.position, attackerPos);
      const dist = toTarget.length();

      if (dist <= reach) {
        // Forward cone check
        const dot = forward.dot(toTarget.clone().normalize());
        if (dot > 0.2 || dist < 1.3) {
          const isIcePunch = attacker.hasIceCharge;
          const isHomeRunBat = attacker.stats.activeItem === 'bat';
          const baseDamage = (isHomeRunBat ? 20 : isIcePunch ? 22 : isAbility ? 18 : 11) * powerMult;
          const baseKnockback = (isHomeRunBat ? 15 : isIcePunch ? 14 : isAbility ? 12 : 7.5) * powerMult;

          if (isHomeRunBat) {
            sound.playHomeRunBat();
          }

          target.receiveHit(attacker, baseDamage, baseKnockback, isHomeRunBat || isIcePunch || isAbility);

          if (isIcePunch) {
            sound.playSmashKO();
            target.applyFreeze(1.0);
            attacker.hasIceCharge = false;
            attacker.stats.hasIceCharged = false;
          }

          if (this.isMultiplayer && attacker === this.player) {
            networkManager.sendCombatHit({
              attackerId: networkManager.localPlayerId,
              targetId: target.networkId || target.stats.id,
              damage: baseDamage,
              knockback: baseKnockback,
              isIcePunch,
              isHomeRunBat,
            });
          }
        }
      }
    });

    // 2. Check hitting Arena Giant Central Button
    const distToButton = attackerPos.distanceTo(this.giantButton.group.position);
    if (distToButton < 3.2) {
      const { success, crazyEvent } = this.giantButton.press(attackerPos);
      if (success) {
        attacker.stats.coins += 25;
        attacker.stats.buttonPresses++;
        // Drop bonus item
        this.world.spawnItem(this.scene);

        if (this.isMultiplayer && attacker === this.player) {
          networkManager.sendButtonPress({ byPlayerId: networkManager.localPlayerId });
        }

        if (crazyEvent) {
          this.executeCrazyButtonPower(attacker, crazyEvent);
        }
      }
    }

    // 3. Check hitting wooden crates
    this.world.spawnedItems.forEach((item) => {
      if (item.type === 'crate' && !item.collected) {
        const itemPos = new THREE.Vector3(item.position.x, item.position.y, item.position.z);
        if (attackerPos.distanceTo(itemPos) < reach) {
          item.collected = true;
          this.world.removeItem(this.scene, item.id);
          this.particleSystem.createExplosion(itemPos);
          this.particleSystem.createCoinBurst(itemPos, 15);
          attacker.stats.coins += 20;
          sound.playCoin();
          // Spawn another item from crate
          this.world.spawnItem(this.scene);
        }
      }
    });
  }

  private executeCrazyButtonPower(presser: Character3D, event: CrazyButtonEvent) {
    if (event.type === 'titan_mode') {
      presser.setTitanMode(9.0);
      sound.playVictory();
      this.particleSystem.createSmashBlast(presser.group.position);
      this.particleSystem.createFloatingText(presser.group.position, '¡MODO TITÁN!', '#f59e0b');
    } else if (event.type === 'shockwave_blast') {
      presser.stats.coins += 40;
      sound.playHomeRunBat();
      this.particleSystem.createSmashBlast(this.giantButton.group.position);
      this.particleSystem.createFloatingText(this.giantButton.group.position, '¡ONDA EXPULSORA!', '#f97316');
      // Launch all opponents
      this.allCharacters.forEach((other) => {
        if (other !== presser && !other.stats.isEliminated) {
          other.receiveHit(presser, 25, 22, true);
        }
      });
    } else if (event.type === 'coin_jackpot') {
      presser.stats.coins += 60;
      sound.playBigCoin();
      this.particleSystem.createCoinBurst(this.giantButton.group.position, 35);
      this.particleSystem.createFloatingText(this.giantButton.group.position, '+60 🪙 JACKPOT', '#fde047');
      this.world.spawnItem(this.scene);
      this.world.spawnItem(this.scene);
    } else if (event.type === 'thunder_strike') {
      sound.playSmashKO();
      this.particleSystem.createFloatingText(this.giantButton.group.position, '¡TORMENTA!', '#06b6d4');
      this.allCharacters.forEach((other) => {
        if (other !== presser && !other.stats.isEliminated) {
          other.stats.isStunned = true;
          other.stats.stunTimeLeft = 1.2;
          this.particleSystem.createSparkles(other.group.position, '#06b6d4');
          this.particleSystem.createFloatingText(other.group.position, '¡ELECTROCUTADO!', '#06b6d4');
          other.receiveHit(presser, 15, 12, true);
        }
      });
    }

    if (this.onCrazyButtonPressed) {
      this.onCrazyButtonPressed(presser.isPlayer, event);
    }
  }

  // --- CLASS SIGNATURE ABILITY EXECUTION ---

  private executeClassAbility(character: Character3D) {
    const classDef = PLAYER_CLASSES.find((c) => c.id === character.classId) || PLAYER_CLASSES[0];
    character.stats.abilityCooldown = classDef.ability.cooldown;

    const classId = character.classId;
    const charPos = character.group.position;

    if (classId === 'brawler') {
      // TITAN UPPER: Heavy charged punch with super armor
      sound.playSmashPunch(true);
      character.triggerPunch('titan');
      this.particleSystem.createHitSparks(charPos, true);
      this.executePunchHitbox(character, true, 1.8);
    } else if (classId === 'shadow_thief') {
      // SHADOW WARP: Teleport behind nearest enemy or forward 8m
      sound.playWarp();
      this.particleSystem.createWarpSmoke(charPos);

      let targetEnemy: Character3D | null = null;
      let closestDist = 16;
      this.allCharacters.forEach((c) => {
        if (c !== character && !c.stats.isRespawning) {
          const d = c.group.position.distanceTo(charPos);
          if (d < closestDist) {
            closestDist = d;
            targetEnemy = c;
          }
        }
      });

      if (targetEnemy) {
        const enemy = targetEnemy as Character3D;
        const behindVec = new THREE.Vector3(0, 0, -1.6).applyAxisAngle(new THREE.Vector3(0, 1, 0), enemy.facingAngle);
        character.group.position.copy(enemy.group.position).add(behindVec);
        character.facingAngle = enemy.facingAngle;
      } else {
        const forward = new THREE.Vector3(0, 0, 7).applyAxisAngle(new THREE.Vector3(0, 1, 0), character.facingAngle);
        character.group.position.add(forward);
      }

      this.particleSystem.createWarpSmoke(character.group.position);
      character.triggerPunch('normal');
      this.executePunchHitbox(character, true, 1.4);
    } else if (classId === 'iron_guardian') {
      // REFLECT COUNTER: 1.8s reflect shield
      sound.playParryClang();
      character.stats.hasReflectShield = true;
      character.stats.abilityActiveTime = 1.8;
      this.particleSystem.createSparkles(charPos, '#38bdf8');
      this.particleSystem.createFloatingText(charPos, '¡ESCUDO PARADA!', '#38bdf8');
    } else if (classId === 'gravity_mage') {
      // GRAVITY WAVE: 360 blast
      sound.playGravityPulse();
      this.particleSystem.createGravityPulse(charPos);
      this.particleSystem.createFloatingText(charPos, '¡VÓRTICE!', '#10b981');

      this.allCharacters.forEach((target) => {
        if (target !== character && !target.stats.isRespawning) {
          const dist = target.group.position.distanceTo(charPos);
          if (dist <= 10.0) {
            target.receiveHit(character, 16, 16, true);
          }
        }
      });
    } else if (classId === 'trapster') {
      // SPRING MINE: Place explosive spring trap on ground
      sound.playCoin();
      const mineGeo = new THREE.CylinderGeometry(0.6, 0.7, 0.2, 8);
      const mineMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
      const mineMesh = new THREE.Mesh(mineGeo, mineMat);
      mineMesh.position.copy(charPos);
      mineMesh.position.y = 0.1;
      this.scene.add(mineMesh);

      this.plantedMines.push({
        id: `mine_${Date.now()}`,
        position: charPos.clone(),
        mesh: mineMesh,
        owner: character,
      });

      this.particleSystem.createFloatingText(charPos, '¡MINA COLOCADA!', '#d97706');
    } else if (classId === 'pyro_fiend') {
      // INFERNO BLAST: Cone of devastating fire & sparks
      sound.playSmashPunch(true);
      const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), character.facingAngle);
      for (let i = 0; i < 5; i++) {
        const firePos = charPos.clone().add(forward.clone().multiplyScalar(1.5 + i * 1.2));
        this.particleSystem.createHitSparks(firePos, true);
        this.particleSystem.createSparkles(firePos, '#ea580c');
      }
      this.particleSystem.createFloatingText(charPos, '¡LLAMARADA INFERNAL!', '#ea580c');

      this.allCharacters.forEach((target) => {
        if (target !== character && !target.stats.isRespawning) {
          const toTarget = target.group.position.clone().sub(charPos);
          const dist = toTarget.length();
          if (dist <= 8.5) {
            const dot = forward.dot(toTarget.normalize());
            if (dot > 0.3) {
              target.receiveHit(character, 24, 18, true);
            }
          }
        }
      });
    } else if (classId === 'frost_valkyrie') {
      // ICE CHARGED PUNCH: Charges glove with ice for the next strike!
      sound.playSmashKO();
      character.hasIceCharge = true;
      character.stats.hasIceCharged = true;
      this.particleSystem.createSparkles(charPos, '#06b6d4');
      this.particleSystem.createSparkles(charPos, '#a5f3fc');
      this.particleSystem.createFloatingText(charPos, '¡PUÑO HELADO CARGADO!', '#06b6d4');
    } else if (classId === 'cyber_ninja') {
      // THUNDER DASH: Slices forward instantly through opponents
      sound.playWarp();
      sound.playHomeRunBat();
      const dashDist = 8.5;
      const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), character.facingAngle);
      const startPos = charPos.clone();
      const endPos = charPos.clone().add(forward.clone().multiplyScalar(dashDist));

      // Check stage bounds to avoid dashing out of platform
      if (Math.abs(endPos.x) < 20 && Math.abs(endPos.z) < 14) {
        character.group.position.copy(endPos);
      } else {
        character.group.position.add(forward.clone().multiplyScalar(dashDist * 0.5));
      }

      this.particleSystem.createSparkles(startPos, '#eab308');
      this.particleSystem.createSparkles(character.group.position, '#fef08a');
      this.particleSystem.createFloatingText(character.group.position, '¡CORTE RELÁMPAGO!', '#eab308');

      // Hit enemies near the dash line
      this.allCharacters.forEach((target) => {
        if (target !== character && !target.stats.isRespawning) {
          const distToStart = target.group.position.distanceTo(startPos);
          const distToEnd = target.group.position.distanceTo(character.group.position);
          if (distToStart < 9.0 || distToEnd < 3.5) {
            target.receiveHit(character, 20, 18, true);
          }
        }
      });
    }
  }

  // --- GAME TICK & UPDATE LOOP ---

  private loop = () => {
    this.animationFrameId = requestAnimationFrame(this.loop);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.isMatchRunning && !this.isPaused) {
      // 1. Update Match Timers
      this.matchTimeLeft = Math.max(0, this.matchTimeLeft - delta);
      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.matchTimeLeft);
      }

      if (this.matchTimeLeft <= 0) {
        this.endMatch();
        return;
      }

      // 2. Item Spawn Timer
      this.itemSpawnTimer -= delta;
      if (this.itemSpawnTimer <= 0) {
        this.itemSpawnTimer = 12 + Math.random() * 8;
        this.world.spawnItem(this.scene);
      }

      // 3. Random Match Event Timer
      this.nextEventTimer -= delta;
      if (this.nextEventTimer <= 0) {
        this.triggerRandomEvent();
      }

      if (this.currentEvent) {
        this.currentEvent.timeLeft -= delta;
        if (this.currentEvent.timeLeft <= 0) {
          this.currentEvent = null;
          if (this.onEventUpdate) this.onEventUpdate(null);
        }
      }

      // 4. Crazy Button Timer (Periodic Super Button Events in Classic Mode)
      if (this.mode === 'classic') {
        if (!this.currentCrazyEvent) {
          this.crazyButtonTimer -= delta;
          if (this.crazyButtonTimer <= 0) {
            this.triggerCrazyButtonEvent();
          }
        } else {
          this.currentCrazyEvent.timeLeft -= delta;
          if (this.currentCrazyEvent.timeLeft <= 0) {
            this.currentCrazyEvent = null;
            this.giantButton.setCrazyEvent(null);
            if (this.onCrazyButtonUpdate) this.onCrazyButtonUpdate(null);
            this.crazyButtonTimer = 22 + Math.random() * 8;
          }
        }
      }

      // 5. Update Fighters, AI & Physics
      this.updatePlayerMovement(delta);
      if (!this.isMultiplayer) {
        this.updateBots(delta);
      } else if (this.player) {
        // Network Sync to Room (30Hz)
        this.netSyncTimer += delta;
        if (this.netSyncTimer >= 0.033) {
          this.netSyncTimer = 0;
          networkManager.sendPlayerState({
            id: networkManager.localPlayerId,
            x: this.player.group.position.x,
            y: this.player.group.position.y,
            z: this.player.group.position.z,
            facing: this.player.facingAngle,
            vx: this.player.velocity.x,
            vy: this.player.velocity.y,
            vz: this.player.velocity.z,
            isGrounded: this.player.isGrounded,
            isPunching: this.player.isPunching,
            punchType: this.player.punchType,
            hasIceCharge: this.player.hasIceCharge,
            isFrozen: this.player.isFrozen,
            damagePercent: this.player.stats.damagePercent,
            stocks: this.player.stats.stocks,
            coins: this.player.stats.coins,
            isTitan: this.player.isTitan,
            hasShield: this.player.stats.hasReflectShield,
          });
        }
      }
      this.updateCharacters(delta);
      this.updatePlantedMines();
      this.updateItemPickups();
      this.updateLeaderboard(delta);
    }

    // 6. Update World & Particles
    this.world.update(delta);
    this.giantButton.update(delta);
    this.particleSystem.update(delta);

    // 7. Update Locked Camera
    this.updateLockedCamera(delta);

    // 8. Render Scene
    this.renderer.render(this.scene, this.camera);
  };

  private triggerCrazyButtonEvent() {
    const events: CrazyButtonEvent[] = [
      {
        type: 'titan_mode',
        title: 'MODO TITÁN',
        description: '¡Pulsa el botón para convertirte en un Titán Gigante!',
        icon: '👑',
        capColor: '#f59e0b',
        glowColor: '#fbbf24',
        duration: 15,
        timeLeft: 15,
      },
      {
        type: 'shockwave_blast',
        title: 'ONDA NUCLEAR',
        description: '¡Pulsa para desatar una onda expansiva masiva!',
        icon: '💥',
        capColor: '#ea580c',
        glowColor: '#f97316',
        duration: 15,
        timeLeft: 15,
      },
      {
        type: 'coin_jackpot',
        title: 'JACKPOT DORADO',
        description: '¡Lluvia de monedas y botín masivo para el que lo pulse!',
        icon: '🪙',
        capColor: '#eab308',
        glowColor: '#fde047',
        duration: 15,
        timeLeft: 15,
      },
      {
        type: 'thunder_strike',
        title: 'TORMENTA DE RAYOS',
        description: '¡Electrocuta y aturde a todos los rivales!',
        icon: '⚡',
        capColor: '#06b6d4',
        glowColor: '#38bdf8',
        duration: 15,
        timeLeft: 15,
      },
    ];

    const chosen = events[Math.floor(Math.random() * events.length)];
    this.currentCrazyEvent = chosen;
    this.giantButton.setCrazyEvent(chosen);
    if (this.onCrazyButtonUpdate) this.onCrazyButtonUpdate(chosen);
    sound.playBigCoin();
  }

  // --- TACTICAL PLAYER MOVEMENT (Camera-Relative TPS Controls) ---

  private updatePlayerMovement(delta: number) {
    if (!this.player || this.player.stats.isEliminated || this.player.stats.isStunned || this.player.stats.isRespawning) return;

    let moveForward = 0; // W / S (Z axis in camera space)
    let moveStrafe = 0; // A / D (X axis in camera space)

    if (this.keysPressed['w'] || this.keysPressed['arrowup']) moveForward += 1;
    if (this.keysPressed['s'] || this.keysPressed['arrowdown']) moveForward -= 1;
    if (this.keysPressed['a'] || this.keysPressed['arrowleft']) moveStrafe -= 1;
    if (this.keysPressed['d'] || this.keysPressed['arrowright']) moveStrafe += 1;

    // Touch Joystick Input
    if (this.joystickVector.x !== 0 || this.joystickVector.y !== 0) {
      moveStrafe += this.joystickVector.x;
      moveForward -= this.joystickVector.y;
    }

    const inputLen = Math.sqrt(moveForward * moveForward + moveStrafe * moveStrafe);
    const classDef = PLAYER_CLASSES.find((c) => c.id === this.player!.classId) || PLAYER_CLASSES[0];
    const targetSpeed = classDef.speed;

    if (inputLen > 0.05) {
      const normForward = moveForward / Math.max(1, inputLen);
      const normStrafe = moveStrafe / Math.max(1, inputLen);

      // Camera forward vector in X-Z plane (yaw rotation)
      // Camera forward is: -sin(yaw), -cos(yaw)
      // Camera right is: cos(yaw), -sin(yaw)
      const forwardX = -Math.sin(this.cameraYaw);
      const forwardZ = -Math.cos(this.cameraYaw);
      const rightX = Math.cos(this.cameraYaw);
      const rightZ = -Math.sin(this.cameraYaw);

      const targetMoveX = (forwardX * normForward + rightX * normStrafe) * targetSpeed;
      const targetMoveZ = (forwardZ * normForward + rightZ * normStrafe) * targetSpeed;

      // Paced acceleration & character facing
      this.player.velocity.x += (targetMoveX - this.player.velocity.x) * 7.5 * delta;
      this.player.velocity.z += (targetMoveZ - this.player.velocity.z) * 7.5 * delta;

      this.player.facingAngle = Math.atan2(targetMoveX, targetMoveZ);
    } else {
      // Deliberate friction deceleration
      this.player.velocity.x += (0 - this.player.velocity.x) * 8.5 * delta;
      this.player.velocity.z += (0 - this.player.velocity.z) * 8.5 * delta;
    }
  }

  // --- SMASH BOTS UPDATE ---

  private updateBots(delta: number) {
    this.bots.forEach((bot) => {
      const char = bot.character;
      if (char.stats.isEliminated) return;

      bot.updateAI(delta, this.allCharacters, this.world, this.giantButton);
      const inputs = bot.getInputs();

      if (!char.stats.isStunned && !char.stats.isRespawning) {
        const classDef = PLAYER_CLASSES.find((c) => c.id === char.classId) || PLAYER_CLASSES[0];
        const botSpeed = classDef.speed * 0.85;

        if (inputs.move.lengthSq() > 0.05) {
          char.velocity.x += (inputs.move.x * botSpeed - char.velocity.x) * 5.5 * delta;
          char.velocity.z += (inputs.move.z * botSpeed - char.velocity.z) * 5.5 * delta;
          char.facingAngle = Math.atan2(inputs.move.x, inputs.move.z);
        } else {
          char.velocity.x += (0 - char.velocity.x) * 7.5 * delta;
          char.velocity.z += (0 - char.velocity.z) * 7.5 * delta;
        }

        if (inputs.jump && char.isGrounded) {
          char.velocity.y = 8.2;
          char.isGrounded = false;
        }

        if (inputs.punch && char.stats.attackCooldown <= 0) {
          char.triggerPunch(char.stats.activeItem === 'bat' ? 'bat' : 'normal');
          sound.playSmashPunch(char.stats.hasGiantGlove);
          this.executePunchHitbox(char);
        }

        if (inputs.ability && char.stats.abilityCooldown <= 0) {
          this.executeClassAbility(char);
        }
      }
    });
  }

  // --- CHARACTER PHYSICS & BLAST ZONE KO ---

  private updateCharacters(delta: number) {
    this.allCharacters.forEach((char) => {
      if (char.stats.isEliminated) return;

      // 1. Gravity & Vertical Movement (Floaty, readable jumps)
      char.velocity.y -= 16.5 * delta;
      char.group.position.x += char.velocity.x * delta;
      char.group.position.y += char.velocity.y * delta;
      char.group.position.z += char.velocity.z * delta;

      // 2. Stage Platform Collisions (Main stage + Elevated platforms)
      const p = char.group.position;
      let onPlatform = false;

      // Main stage platform: Y = 0, X in [-23.2, 23.2], Z in [-16.2, 16.2]
      if (p.x >= -23.2 && p.x <= 23.2 && p.z >= -16.2 && p.z <= 16.2 && p.y <= 0.1 && p.y >= -1.6) {
        if (char.velocity.y <= 0) {
          p.y = 0;
          char.velocity.y = 0;
          char.isGrounded = true;
          onPlatform = true;
        }
      }

      // Left Platform: Y = 3.6, X in [-18.0, -9.0], Z in [-2.8, 2.8]
      if (p.x >= -18.0 && p.x <= -9.0 && p.z >= -2.8 && p.z <= 2.8 && p.y <= 3.7 && p.y >= 2.6) {
        if (char.velocity.y <= 0) {
          p.y = 3.6;
          char.velocity.y = 0;
          char.isGrounded = true;
          onPlatform = true;
        }
      }

      // Right Platform: Y = 3.6, X in [9.0, 18.0], Z in [-2.8, 2.8]
      if (p.x >= 9.0 && p.x <= 18.0 && p.z >= -2.8 && p.z <= 2.8 && p.y <= 3.7 && p.y >= 2.6) {
        if (char.velocity.y <= 0) {
          p.y = 3.6;
          char.velocity.y = 0;
          char.isGrounded = true;
          onPlatform = true;
        }
      }

      // Top Center Platform: Y = 6.4, X in [-5.2, 5.2], Z in [-2.8, 2.8]
      if (p.x >= -5.2 && p.x <= 5.2 && p.z >= -2.8 && p.z <= 2.8 && p.y <= 6.5 && p.y >= 5.4) {
        if (char.velocity.y <= 0) {
          p.y = 6.4;
          char.velocity.y = 0;
          char.isGrounded = true;
          onPlatform = true;
        }
      }

      if (!onPlatform) {
        char.isGrounded = false;
      }

      if (char === this.player) {
        if (char.isGrounded) {
          this.playerCoyoteTime = 0.2;
          this.playerAirJumps = 1;
        } else {
          this.playerCoyoteTime = Math.max(0, this.playerCoyoteTime - delta);
        }
      }

      // Ability active timers (e.g. Iron Guardian shield)
      if (char.stats.hasReflectShield) {
        char.stats.abilityActiveTime -= delta;
        if (char.stats.abilityActiveTime <= 0) {
          char.stats.hasReflectShield = false;
        }
      }

      // Magnet Aura pulling loose coins
      if (char.stats.hasMagnet) {
        this.particleSystem.createSparkles(char.group.position, '#3b82f6');
        this.allCharacters.forEach((other) => {
          if (other !== char && !other.stats.isRespawning && !other.stats.isEliminated) {
            const dist = other.group.position.distanceTo(char.group.position);
            if (dist < 6.0 && other.stats.coins > 0 && Math.random() < 0.08) {
              other.stats.coins -= 1;
              char.stats.coins += 1;
              this.particleSystem.createCoinBurst(other.group.position, 1);
            }
          }
        });
      }

      // 3. BLAST ZONE SMASH KO CHECK (Expanded Arena Ring Out)
      const distFromCenter = Math.sqrt(p.x * p.x + p.z * p.z);
      if (p.y < -10.0 || distFromCenter > 38.0) {
        if (char.stats.isEliminated || char.stats.isRespawning) return;

        // Decrease stock
        char.stats.stocks = Math.max(0, char.stats.stocks - 1);
        char.stats.kosSuffered++;
        char.stats.damagePercent = 0;

        // Play appropriate sound & effects
        if (char.isPlayer && char.stats.stocks <= 0) {
          sound.playPlayerDeath();
        } else {
          sound.playSmashKO();
        }

        this.particleSystem.createSmashBlast(p);
        this.particleSystem.createFloatingText(p, '¡RING OUT! ¡KO!', '#ef4444');

        // Identify Killer
        const killer =
          char.lastAttacker && Date.now() - char.lastHitTime < 10000 ? char.lastAttacker : null;
        let killerBanner: KillBanner = INITIAL_BANNERS[0];

        if (killer && !killer.stats.isEliminated) {
          killer.stats.kosDone++;
          killer.stats.coins += 35;
          this.particleSystem.createCoinBurst(killer.group.position, 8);
          this.particleSystem.createFloatingText(killer.group.position, '+35 🪙 (KO)', '#f59e0b');

          if (killer.isPlayer) {
            killerBanner = this.playerBanner;
          } else {
            const botIdx = this.allCharacters.indexOf(killer);
            killerBanner = this.botBanners[(botIdx + 1) % this.botBanners.length] || INITIAL_BANNERS[1];
          }
        }

        // Fire elimination event banner notification
        if (this.onKillElimination) {
          this.onKillElimination({
            id: `ko_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            victimName: char.stats.name,
            victimClassIcon: char.stats.classIcon,
            killerName: killer ? killer.stats.name : 'El Vacío',
            killerClassIcon: killer ? killer.stats.classIcon : '💀',
            killerBanner,
            isPlayerVictim: char.isPlayer,
            isPlayerKiller: killer ? killer.isPlayer : false,
            timestamp: Date.now(),
          });
        }

        char.lastAttacker = null;

        // Check for permanent elimination (0 stocks remaining)
        if (char.stats.stocks <= 0) {
          char.stats.isEliminated = true;
          char.stats.killerName = killer ? killer.stats.name : 'El Vacío';
          char.stats.killerBanner = killerBanner;
          char.group.position.set(0, -999, 0);
          this.scene.remove(char.group);

          if (char.isPlayer) {
            if (typeof document !== 'undefined' && document.pointerLockElement) {
              document.exitPointerLock?.();
            }
            if (this.onPlayerEliminated) {
              this.onPlayerEliminated(killer ? { ...killer.stats } : null, killerBanner);
            }
          }

          // Check if match is finished (only 1 or 0 alive characters remaining)
          const survivors = this.allCharacters.filter((c) => !c.stats.isEliminated);
          if (survivors.length <= 1) {
            this.endMatch();
            return;
          }
        } else {
          // Respawn in safe spawn pad
          const spawnPad = this.world.spawnPads[Math.floor(Math.random() * this.world.spawnPads.length)];
          char.respawn(spawnPad);
        }
      }

      char.update(delta);
    });
  }

  // --- ITEM PICKUP SYSTEM ---

  private updateItemPickups() {
    this.world.spawnedItems.forEach((item) => {
      if (item.collected) return;
      const itemPos = new THREE.Vector3(item.position.x, item.position.y, item.position.z);

      this.allCharacters.forEach((char) => {
        if (char.stats.isRespawning || char.stats.isEliminated) return;
        const dist = char.group.position.distanceTo(itemPos);

        if (dist < 1.8) {
          // Collect item
          item.collected = true;
          this.world.removeItem(this.scene, item.id);
          sound.playItemPickup();
          this.particleSystem.createSparkles(itemPos, '#38bdf8');

          char.stats.activeItem = item.type;
          char.stats.itemTimeLeft = 10;

          if (item.type === 'heart') {
            sound.playDamageHeal();
            char.stats.damagePercent = Math.max(0, char.stats.damagePercent - 60);
            this.particleSystem.createFloatingText(char.group.position, '-60% DAÑO', '#ec4899');
          } else if (item.type === 'bat') {
            this.particleSystem.createFloatingText(char.group.position, '¡BATE SMASH!', '#f59e0b');
          } else if (item.type === 'giant_glove') {
            char.stats.hasGiantGlove = true;
            this.particleSystem.createFloatingText(char.group.position, '¡GUANTELETE!', '#8b5cf6');
          } else if (item.type === 'magnet') {
            char.stats.hasMagnet = true;
            this.particleSystem.createFloatingText(char.group.position, '¡SUPER IMÁN!', '#3b82f6');
          } else if (item.type === 'bomb') {
            // Explode bomb in area
            this.particleSystem.createExplosion(itemPos);
            this.allCharacters.forEach((c) => {
              if (c !== char && c.group.position.distanceTo(itemPos) < 6) {
                c.receiveHit(char, 20, 20, true);
              }
            });
          }
        }
      });
    });
  }

  // --- MINES TRIGGER CHECK ---

  private updatePlantedMines() {
    for (let i = this.plantedMines.length - 1; i >= 0; i--) {
      const mine = this.plantedMines[i];
      let exploded = false;

      this.allCharacters.forEach((c) => {
        if (c !== mine.owner && !c.stats.isRespawning && !c.stats.isEliminated) {
          const dist = c.group.position.distanceTo(mine.position);
          if (dist < 1.8) {
            exploded = true;
            c.receiveHit(mine.owner, 22, 20, true);
          }
        }
      });

      if (exploded) {
        sound.playSmashKO();
        this.particleSystem.createExplosion(mine.position);
        this.scene.remove(mine.mesh);
        this.plantedMines.splice(i, 1);
      }
    }
  }

  // --- THIRD-PERSON MOUSE-CONTROLLED CAMERA WITH CROSSHAIR SYSTEM ---

  private updateLockedCamera(delta: number) {
    let focusPos: THREE.Vector3 | null = null;

    if (this.isSpectating) {
      const spectated = this.getSpectatedCharacter();
      if (spectated) {
        focusPos = spectated.group.position;
      }
    } else if (this.player && !this.player.stats.isEliminated) {
      focusPos = this.player.group.position;
    }

    if (!focusPos) {
      // Menu or spectator fallback ambient framing
      const firstAlive = this.allCharacters.find((c) => !c.stats.isEliminated);
      if (firstAlive) {
        focusPos = firstAlive.group.position;
      } else {
        this.camera.position.set(0, 8.5, 18);
        this.camera.lookAt(0, 1.2, 0);
        return;
      }
    }

    // Dynamic 3D Third-Person Camera with full mouse orbit & crosshair aiming
    const camDist = 9.2;
    const camHeight = 3.6;

    const cosPitch = Math.cos(this.cameraPitch);
    const sinPitch = Math.sin(this.cameraPitch);
    const sinYaw = Math.sin(this.cameraYaw);
    const cosYaw = Math.cos(this.cameraYaw);

    // Camera offset behind the character based on yaw and pitch
    const offsetX = sinYaw * cosPitch * camDist;
    const offsetZ = cosYaw * cosPitch * camDist;
    const offsetY = camHeight + sinPitch * camDist;

    const targetPos = new THREE.Vector3(
      focusPos.x + offsetX,
      focusPos.y + offsetY,
      focusPos.z + offsetZ
    );

    this.camera.position.lerp(targetPos, 8.5 * delta);

    // Look target directly ahead through the crosshair
    const lookTarget = new THREE.Vector3(
      focusPos.x - sinYaw * 4.0,
      focusPos.y + 1.4 - sinPitch * 3.0,
      focusPos.z - cosYaw * 4.0
    );
    this.camera.lookAt(lookTarget);
  }

  // --- RANDOM MATCH EVENTS ---

  private triggerRandomEvent() {
    const events: GameEvent[] = [
      {
        title: '¡LLUVIA DE OBJETOS!',
        description: 'Múltiples objetos y cajas sorpresa caen en la arena.',
        duration: 12,
        timeLeft: 12,
        type: 'item_shower',
      },
      {
        title: '¡DAÑO CRÍTICO x2!',
        description: 'Todos los golpes causan el doble de empuje Smash.',
        duration: 14,
        timeLeft: 14,
        type: 'double_damage',
      },
      {
        title: '¡BOTÍN DESATADO!',
        description: 'El botón gigante y los golpes sueltan monedas triples.',
        duration: 12,
        timeLeft: 12,
        type: 'mega_coins',
      },
    ];

    this.currentEvent = events[Math.floor(Math.random() * events.length)];
    this.nextEventTimer = 25 + Math.random() * 15;

    if (this.currentEvent.type === 'item_shower') {
      this.world.spawnItem(this.scene);
      this.world.spawnItem(this.scene);
      this.world.spawnItem(this.scene);
    }

    sound.playButtonSlam();
    if (this.onEventUpdate) {
      this.onEventUpdate(this.currentEvent);
    }
  }

  // --- LEADERBOARD & STATS SYNC ---

  private updateLeaderboard(delta: number) {
    this.leaderboardTimer += delta;
    if (this.leaderboardTimer < 0.1) return;
    this.leaderboardTimer = 0;

    const sorted = [...this.allCharacters].sort((a, b) => b.stats.coins - a.stats.coins);
    sorted.forEach((char, index) => {
      char.stats.rank = index + 1;
    });

    if (this.onStatsUpdate && this.player) {
      this.onStatsUpdate(
        { ...this.player.stats },
        this.allCharacters.map((c) => ({ ...c.stats }))
      );
    }
  }

  // --- MATCH END ---

  private endMatch() {
    this.isMatchRunning = false;
    if (typeof document !== 'undefined' && document.pointerLockElement) {
      document.exitPointerLock?.();
    }
    const sorted = [...this.allCharacters].sort((a, b) => b.stats.coins - a.stats.coins);
    const winner = sorted[0];
    const isPlayerWinner = this.player ? winner === this.player : false;

    if (isPlayerWinner) sound.playVictory();
    else sound.playDefeat();

    if (this.onMatchEnd && this.player) {
      this.onMatchEnd({
        winnerName: winner ? winner.stats.name : 'Jugador',
        isPlayerWinner,
        playerRank: this.player.stats.rank,
        playerCoins: this.player.stats.coins,
        coinsEarned: Math.max(10, Math.floor(this.player.stats.coins * 0.5)),
        playerKOs: this.player.stats.kosDone,
        playerDamageDealt: Math.round(this.player.stats.totalDamageDealt),
        totalPresses: this.player.stats.buttonPresses,
        totalSteals: this.player.stats.stealsDone,
        leaderboard: sorted.map((c) => ({
          name: c.stats.name,
          coins: c.stats.coins,
          kos: c.stats.kosDone,
          damagePercent: Math.round(c.stats.damagePercent),
          isPlayer: c.isPlayer,
          classIcon: c.stats.classIcon,
        })),
      });
    }
  }

  public destroy() {
    if (typeof document !== 'undefined' && document.pointerLockElement) {
      document.exitPointerLock?.();
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    window.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);

    this.particleSystem.clearAll();
    this.world.destroy(this.scene);
    this.allCharacters.forEach((c) => c.destroy(this.scene));
    this.plantedMines.forEach((m) => this.scene.remove(m.mesh));
    this.plantedMines = [];
    this.allCharacters = [];
    this.bots = [];
    this.player = null;

    sound.stopBGM();
    this.renderer.dispose();
  }
}
