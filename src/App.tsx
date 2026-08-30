/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine3D } from './game/engine';
import {
  GameState,
  GameMode,
  CharacterSkin,
  ButtonSkin,
  TrailEffect,
  KillBanner,
  PlayerStats,
  GameEvent,
  MatchResult,
  GameSettings,
  ClassId,
  EliminationEvent,
  BattleNotification,
  ArenaId,
  CrazyButtonEvent,
  DailyMission,
} from './types';
import {
  INITIAL_SKINS,
  INITIAL_BUTTON_SKINS,
  INITIAL_TRAILS,
  INITIAL_BANNERS,
} from './data/shopItems';
import { generateDailyMissions } from './data/missions';
import { PixelHUD } from './components/PixelHUD';
import { MainMenu } from './components/MainMenu';
import { ClassSelectModal } from './components/ClassSelectModal';
import { ShopModal } from './components/ShopModal';
import { MissionsModal } from './components/MissionsModal';
import { EndGameModal } from './components/EndGameModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { SettingsModal } from './components/SettingsModal';
import { PauseModal } from './components/PauseModal';
import { EliminationModal } from './components/EliminationModal';
import { SpectatorHUD } from './components/SpectatorHUD';
import { MultiplayerLobbyModal } from './components/MultiplayerLobbyModal';
import { PreMatchLobbyModal } from './components/PreMatchLobbyModal';
import { sound } from './game/audio';
import { networkManager } from './game/network';
import { RoomInfo } from './types';

const STORAGE_KEY_COINS = 'roba_boton_coins';
const STORAGE_KEY_SKINS = 'roba_boton_skins';
const STORAGE_KEY_EQUIPPED_SKIN = 'roba_boton_equipped_skin';
const STORAGE_KEY_CLASS = 'roba_boton_class';
const STORAGE_KEY_BUTTONS = 'roba_boton_buttons';
const STORAGE_KEY_EQUIPPED_BUTTON = 'roba_boton_equipped_btn';
const STORAGE_KEY_TRAILS = 'roba_boton_trails';
const STORAGE_KEY_EQUIPPED_TRAIL = 'roba_boton_equipped_trail';
const STORAGE_KEY_BANNERS = 'roba_boton_banners';
const STORAGE_KEY_EQUIPPED_BANNER = 'roba_boton_equipped_banner';
const STORAGE_KEY_SETTINGS = 'roba_boton_settings';
const STORAGE_KEY_ARENA = 'roba_boton_equipped_arena';
const STORAGE_KEY_MISSIONS = 'roba_boton_daily_missions';
const STORAGE_KEY_MISSIONS_DATE = 'roba_boton_missions_date';
const STORAGE_KEY_PLAYER_NAME = 'roba_boton_player_name';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine3D | null>(null);
  const handlePauseRef = useRef<() => void>(() => {});

  // Player Name State
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_PLAYER_NAME) || 'LUCHADOR';
  });

  // Persistence States
  const [totalCoins, setTotalCoins] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COINS);
    return saved ? parseInt(saved, 10) : 60;
  });

  const [skins, setSkins] = useState<CharacterSkin[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SKINS);
    if (!saved) return INITIAL_SKINS;
    try {
      const parsed: CharacterSkin[] = JSON.parse(saved);
      return INITIAL_SKINS.map((initSkin) => {
        const found = parsed.find((p) => p.id === initSkin.id);
        return found ? { ...initSkin, unlocked: found.unlocked || initSkin.unlocked } : initSkin;
      });
    } catch {
      return INITIAL_SKINS;
    }
  });

  const [selectedSkinId, setSelectedSkinId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_EQUIPPED_SKIN) || 'pixel_knight';
  });

  const [selectedClassId, setSelectedClassId] = useState<ClassId>(() => {
    return (localStorage.getItem(STORAGE_KEY_CLASS) as ClassId) || 'brawler';
  });

  const [buttonSkins, setButtonSkins] = useState<ButtonSkin[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BUTTONS);
    return saved ? JSON.parse(saved) : INITIAL_BUTTON_SKINS;
  });

  const [selectedButtonSkinId, setSelectedButtonSkinId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_EQUIPPED_BUTTON) || 'button_classic_red';
  });

  const [trailEffects, setTrailEffects] = useState<TrailEffect[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TRAILS);
    return saved ? JSON.parse(saved) : INITIAL_TRAILS;
  });

  const [selectedTrailId, setSelectedTrailId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_EQUIPPED_TRAIL) || 'trail_smoke';
  });

  const [banners, setBanners] = useState<KillBanner[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BANNERS);
    return saved ? JSON.parse(saved) : INITIAL_BANNERS;
  });

  const [selectedBannerId, setSelectedBannerId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_EQUIPPED_BANNER) || 'banner_skull_glory';
  });

  const [selectedArenaId, setSelectedArenaId] = useState<ArenaId>(() => {
    return (localStorage.getItem(STORAGE_KEY_ARENA) as ArenaId) || 'arcade_core';
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return saved
      ? JSON.parse(saved)
      : {
          soundEnabled: true,
          musicEnabled: true,
          scanlinesEnabled: true,
          particlesEnabled: true,
          cameraSensitivity: 1.0,
          pixelResolutionScale: 1.0,
        };
  });

  // Daily Missions State
  const [missions, setMissions] = useState<DailyMission[]>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const savedDate = localStorage.getItem(STORAGE_KEY_MISSIONS_DATE);
    const savedMissions = localStorage.getItem(STORAGE_KEY_MISSIONS);
    if (savedDate === today && savedMissions) {
      try {
        return JSON.parse(savedMissions);
      } catch (e) {
        // fallback
      }
    }
    const newMissions = generateDailyMissions();
    localStorage.setItem(STORAGE_KEY_MISSIONS_DATE, today);
    localStorage.setItem(STORAGE_KEY_MISSIONS, JSON.stringify(newMissions));
    return newMissions;
  });

  // Game UI States
  const [gameState, setGameState] = useState<GameState>('menu');
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  // Active match live data
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [allStats, setAllStats] = useState<PlayerStats[]>([]);
  const [matchTimeLeft, setMatchTimeLeft] = useState<number>(90);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [crazyButtonEvent, setCrazyButtonEvent] = useState<CrazyButtonEvent | null>(null);
  const [recentKillEvent, setRecentKillEvent] = useState<EliminationEvent | null>(null);
  const [battleNotifications, setBattleNotifications] = useState<BattleNotification[]>([]);

  // Elimination & Spectator States
  const [isEliminatedModalOpen, setIsEliminatedModalOpen] = useState(false);
  const [killerStats, setKillerStats] = useState<PlayerStats | null>(null);
  const [killerBanner, setKillerBanner] = useState<KillBanner | null>(null);
  const [isSpectating, setIsSpectating] = useState(false);

  // Modals
  const [isClassSelectOpen, setIsClassSelectOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMultiplayerLobbyOpen, setIsMultiplayerLobbyOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState<RoomInfo | null>(null);

  // Multiplayer Rematch States
  const [rematchVotesCount, setRematchVotesCount] = useState<number>(0);
  const [rematchTotalNeeded, setRematchTotalNeeded] = useState<number>(2);
  const [hasRequestedRematch, setHasRequestedRematch] = useState<boolean>(false);
  const [rematchNotice, setRematchNotice] = useState<string | null>(null);

  // Check touch device support
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Sync persistence to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COINS, totalCoins.toString());
  }, [totalCoins]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SKINS, JSON.stringify(skins));
  }, [skins]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EQUIPPED_SKIN, selectedSkinId);
  }, [selectedSkinId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CLASS, selectedClassId);
  }, [selectedClassId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BUTTONS, JSON.stringify(buttonSkins));
  }, [buttonSkins]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EQUIPPED_BUTTON, selectedButtonSkinId);
  }, [selectedButtonSkinId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TRAILS, JSON.stringify(trailEffects));
  }, [trailEffects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EQUIPPED_TRAIL, selectedTrailId);
  }, [selectedTrailId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BANNERS, JSON.stringify(banners));
  }, [banners]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EQUIPPED_BANNER, selectedBannerId);
  }, [selectedBannerId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ARENA, selectedArenaId);
  }, [selectedArenaId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    sound.setSoundEnabled(settings.soundEnabled);
    sound.setMusicEnabled(settings.musicEnabled);
    if (engineRef.current) {
      engineRef.current.setParticleEffectsEnabled(settings.particlesEnabled !== false);
      engineRef.current.setCameraSensitivity(settings.cameraSensitivity || 1.0);
    }
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MISSIONS, JSON.stringify(missions));
  }, [missions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PLAYER_NAME, playerName);
  }, [playerName]);

  // Synchronize dynamic BGM with game screens
  useEffect(() => {
    if (settings.musicEnabled) {
      if (gameState === 'menu' || gameState === 'gameover') {
        sound.startMenuBGM();
      } else if (gameState === 'playing') {
        sound.startBattleBGM();
      }
    } else {
      sound.stopBGM();
    }
  }, [gameState, settings.musicEnabled]);

  // Release Pointer Lock immediately when exiting match or opening any UI modal
  useEffect(() => {
    if (
      gameState !== 'playing' ||
      isSpectating ||
      isEliminatedModalOpen ||
      isSettingsOpen ||
      isShopOpen ||
      isMissionsOpen ||
      isClassSelectOpen ||
      isHowToPlayOpen
    ) {
      if (typeof document !== 'undefined' && document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    }
  }, [
    gameState,
    isSpectating,
    isEliminatedModalOpen,
    isSettingsOpen,
    isShopOpen,
    isMissionsOpen,
    isClassSelectOpen,
    isHowToPlayOpen,
  ]);

  // Helper to progress Daily Missions
  const updateMissionProgress = useCallback(
    (type: string, amount: number, options?: { arenaReq?: string; classReq?: string }) => {
      setMissions((prev) =>
        prev.map((m) => {
          if (m.type === type) {
            if (m.arenaRequired && m.arenaRequired !== options?.arenaReq) return m;
            if (m.classRequired && m.classRequired !== options?.classReq) return m;
            const nextVal = Math.min(m.target, m.current + amount);
            return {
              ...m,
              current: nextVal,
              completed: nextVal >= m.target,
            };
          }
          return m;
        })
      );
    },
    []
  );

  // Initialize 3D Game Engine on Mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine3D(canvasRef.current);
    engineRef.current = engine;
    engine.setParticleEffectsEnabled(settings.particlesEnabled !== false);
    engine.setCameraSensitivity(settings.cameraSensitivity || 1.0);

    // Connect Engine Callbacks
    engine.onStatsUpdate = (playerStat, allStatList) => {
      setPlayerStats(playerStat);
      setAllStats(allStatList);
    };

    engine.onTimeUpdate = (timeLeft) => {
      setMatchTimeLeft(timeLeft);
    };

    engine.onEventUpdate = (event) => {
      setCurrentEvent(event);
    };

    engine.onCrazyButtonUpdate = (event) => {
      setCrazyButtonEvent(event);
    };

    engine.onCrazyButtonPressed = (isPlayer, event) => {
      if (isPlayer) {
        updateMissionProgress('press_crazy_button', 1);
      }
    };

    engine.onPlayerFeat = (featType, amount = 1) => {
      updateMissionProgress(featType, amount, {
        arenaReq: selectedArenaId,
        classReq: selectedClassId,
      });
    };

    engine.onKillElimination = (event) => {
      setRecentKillEvent(event);
      setTimeout(() => {
        setRecentKillEvent((current) => (current?.timestamp === event.timestamp ? null : current));
      }, 3500);
    };

    engine.onBattleNotification = (notif) => {
      setBattleNotifications((prev) => [notif, ...prev.slice(0, 3)]);
      setTimeout(() => {
        setBattleNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      }, 3800);
    };

    engine.onPlayerEliminated = (killer, banner) => {
      setKillerStats(killer);
      setKillerBanner(banner);
      setIsEliminatedModalOpen(true);
    };

    engine.onPointerLockExit = () => {
      handlePauseRef.current();
    };

    engine.onMatchEnd = (result) => {
      setIsEliminatedModalOpen(false);
      setIsSpectating(false);
      setMatchResult(result);
      const shopCoins = Math.max(0, Math.floor(result.coinsEarned * 0.15));
      setTotalCoins((prev) => prev + shopCoins);
      setGameState('gameover');

      // Update Missions
      updateMissionProgress('class_play', 1, { classReq: selectedClassId });
      if (result.isPlayerWinner) {
        updateMissionProgress('class_win', 1, { classReq: selectedClassId, arenaReq: selectedArenaId });
        updateMissionProgress('win_matches', 1, { arenaReq: selectedArenaId });
      }
      updateMissionProgress('kos', result.playerKOs, { classReq: selectedClassId });
      updateMissionProgress('coins_earned', result.playerCoins, { classReq: selectedClassId });
      updateMissionProgress('damage_dealt', result.playerDamageDealt, { classReq: selectedClassId });
      updateMissionProgress('play_arena', 1, { arenaReq: selectedArenaId });
    };

    return () => {
      engine.destroy();
    };
  }, [selectedArenaId, selectedClassId, updateMissionProgress]);

  // Start Game Handler
  const handleStartGame = useCallback(() => {
    if (!engineRef.current) return;

    setIsEliminatedModalOpen(false);
    setIsSpectating(false);
    setKillerStats(null);
    setKillerBanner(null);
    setCrazyButtonEvent(null);

    engineRef.current.setParticleEffectsEnabled(settings.particlesEnabled !== false);
    engineRef.current.setCameraSensitivity(settings.cameraSensitivity || 1.0);

    const equippedSkin = skins.find((s) => s.id === selectedSkinId) || skins[0];
    const equippedButton = buttonSkins.find((b) => b.id === selectedButtonSkinId) || buttonSkins[0];
    const equippedBanner = banners.find((b) => b.id === selectedBannerId) || banners[0];
    const equippedTrail = trailEffects.find((t) => t.id === selectedTrailId) || trailEffects[0];

    engineRef.current.startMatch(
      selectedMode,
      equippedSkin,
      selectedClassId,
      equippedButton,
      equippedBanner,
      equippedTrail,
      selectedArenaId,
      playerName
    );
    engineRef.current.requestPointerLock();
    setGameState('playing');
  }, [
    selectedMode,
    selectedSkinId,
    selectedClassId,
    selectedButtonSkinId,
    selectedTrailId,
    selectedBannerId,
    selectedArenaId,
    playerName,
    skins,
    buttonSkins,
    banners,
    trailEffects,
    settings.particlesEnabled,
    settings.cameraSensitivity,
  ]);

  // Start Multiplayer Game Handler
  const handleStartMultiplayerGame = useCallback(
    (room: RoomInfo, spawns: Record<string, number>) => {
      if (!engineRef.current) return;

      setIsEliminatedModalOpen(false);
      setIsSpectating(false);
      setKillerStats(null);
      setKillerBanner(null);
      setCrazyButtonEvent(null);
      setIsMultiplayerLobbyOpen(false);
      setActiveRoom(null);

      // Reset Rematch States
      setHasRequestedRematch(false);
      setRematchVotesCount(0);
      setRematchNotice(null);

      engineRef.current.setParticleEffectsEnabled(settings.particlesEnabled !== false);
      engineRef.current.setCameraSensitivity(settings.cameraSensitivity || 1.0);

      const equippedSkin = skins.find((s) => s.id === selectedSkinId) || skins[0];
      const equippedButton = buttonSkins.find((b) => b.id === selectedButtonSkinId) || buttonSkins[0];
      const equippedBanner = banners.find((b) => b.id === selectedBannerId) || banners[0];
      const equippedTrail = trailEffects.find((t) => t.id === selectedTrailId) || trailEffects[0];

      const gameMode: GameMode =
        room.mode === '2v2' ? 'stock_battle' : room.mode === '1v1' ? 'stock_battle' : 'classic';

      engineRef.current.startMatch(
        gameMode,
        equippedSkin,
        selectedClassId,
        equippedButton,
        equippedBanner,
        equippedTrail,
        room.arenaId,
        playerName,
        true,
        room,
        spawns
      );
      engineRef.current.requestPointerLock();
      setGameState('playing');
    },
    [
      selectedSkinId,
      selectedClassId,
      selectedButtonSkinId,
      selectedTrailId,
      selectedBannerId,
      playerName,
      skins,
      buttonSkins,
      banners,
      trailEffects,
      settings.particlesEnabled,
      settings.cameraSensitivity,
    ]
  );

  // Network Room and Match Listeners
  useEffect(() => {
    networkManager.onRoomUpdateCallback = (room) => {
      setActiveRoom(room);
    };

    networkManager.onGameStartCallback = (room, spawns) => {
      handleStartMultiplayerGame(room, spawns);
    };

    networkManager.onRematchUpdateCallback = (data) => {
      setRematchVotesCount(data.votesCount);
      setRematchTotalNeeded(data.totalNeeded);
      setHasRequestedRematch(data.agreedPlayerIds.includes(networkManager.localPlayerId));
      setRematchNotice(null);
    };

    networkManager.onRematchCancelledCallback = (data) => {
      setRematchNotice(data.reason);
      setHasRequestedRematch(false);
      setRematchVotesCount(0);
    };
  }, [handleStartMultiplayerGame]);

  // Pause / Resume
  const handlePause = useCallback(() => {
    if (engineRef.current && gameState === 'playing' && !isEliminatedModalOpen) {
      engineRef.current.setPaused(true);
      setGameState('paused');
    }
  }, [gameState, isEliminatedModalOpen]);

  handlePauseRef.current = handlePause;

  const handleResume = useCallback(() => {
    if (engineRef.current && gameState === 'paused') {
      engineRef.current.setPaused(false);
      setGameState('playing');
      engineRef.current.requestPointerLock();
      setTimeout(() => {
        engineRef.current?.requestPointerLock();
      }, 50);
    }
  }, [gameState]);

  // Global ESC Key Listener for Pause / Exit Menu and Modal navigation
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();

        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isShopOpen) {
          setIsShopOpen(false);
        } else if (isMissionsOpen) {
          setIsMissionsOpen(false);
        } else if (isClassSelectOpen) {
          setIsClassSelectOpen(false);
        } else if (isHowToPlayOpen) {
          setIsHowToPlayOpen(false);
        } else if (isMultiplayerLobbyOpen) {
          setIsMultiplayerLobbyOpen(false);
        } else if (gameState === 'playing') {
          handlePause();
        } else if (gameState === 'paused') {
          handleResume();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [
    isSettingsOpen,
    isShopOpen,
    isMissionsOpen,
    isClassSelectOpen,
    isHowToPlayOpen,
    isMultiplayerLobbyOpen,
    gameState,
    handlePause,
    handleResume,
  ]);

  const handleGoToMenu = useCallback(() => {
    if (engineRef.current) {
      if (engineRef.current.isMultiplayer) {
        networkManager.cancelRematch();
        networkManager.leaveRoom();
      }
      engineRef.current.setPaused(true);
      engineRef.current.setSpectating(false);
    }
    if (settings.musicEnabled) {
      sound.startMenuBGM();
    } else {
      sound.stopBGM();
    }
    setIsEliminatedModalOpen(false);
    setIsSpectating(false);
    setHasRequestedRematch(false);
    setRematchVotesCount(0);
    setRematchNotice(null);
    setGameState('menu');
  }, [settings.musicEnabled]);

  // Spectate mode trigger
  const handleEnterSpectate = useCallback(() => {
    setIsEliminatedModalOpen(false);
    setIsSpectating(true);
    if (engineRef.current) {
      engineRef.current.setSpectating(true);
    }
  }, []);

  // Shop Handlers
  const handleBuySkin = (skinId: string) => {
    const target = skins.find((s) => s.id === skinId);
    if (!target || target.unlocked || totalCoins < target.price) return;

    setTotalCoins((prev) => prev - target.price);
    setSkins((prev) =>
      prev.map((s) => (s.id === skinId ? { ...s, unlocked: true } : s))
    );
  };

  const handleEquipSkin = (skinId: string) => {
    setSelectedSkinId(skinId);
  };

  const handleBuyButtonSkin = (btnId: string) => {
    const target = buttonSkins.find((b) => b.id === btnId);
    if (!target || target.unlocked || totalCoins < target.price) return;

    setTotalCoins((prev) => prev - target.price);
    setButtonSkins((prev) =>
      prev.map((b) => (b.id === btnId ? { ...b, unlocked: true } : b))
    );
  };

  const handleEquipButtonSkin = (btnId: string) => {
    setSelectedButtonSkinId(btnId);
  };

  const handleBuyBanner = (bannerId: string) => {
    const target = banners.find((b) => b.id === bannerId);
    if (!target || target.unlocked || totalCoins < target.price) return;

    setTotalCoins((prev) => prev - target.price);
    setBanners((prev) =>
      prev.map((b) => (b.id === bannerId ? { ...b, unlocked: true } : b))
    );
  };

  const handleEquipBanner = (bannerId: string) => {
    setSelectedBannerId(bannerId);
  };

  // Claim Daily Mission Reward
  const handleClaimReward = (missionId: string) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id === missionId && m.completed && !m.claimed) {
          setTotalCoins((c) => c + m.rewardCoins);
          return { ...m, claimed: true };
        }
        return m;
      })
    );
  };

  const currentSkin = skins.find((s) => s.id === selectedSkinId) || skins[0];
  const currentButtonSkin = buttonSkins.find((b) => b.id === selectedButtonSkinId) || buttonSkins[0];
  const unclaimedMissionsCount = missions.filter((m) => m.completed && !m.claimed).length;

  const spectatedChar = allStats.find(
    (c) => c.id === engineRef.current?.allCharacters[engineRef.current?.spectateTargetIndex]?.stats.id
  );
  const aliveSurvivorsCount = allStats.filter((c) => !c.isEliminated).length;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-pixel-body select-none">
      {/* 1. THREE.JS 3D CANVAS VIEWPORT */}
      <canvas
        ref={canvasRef}
        onClick={() => {
          if (gameState === 'playing') {
            engineRef.current?.requestPointerLock();
          }
        }}
        className="w-full h-full block cursor-crosshair focus:outline-none"
      />

      {/* CRT SCANLINES & RETRO VIGNETTE OVERLAY */}
      {settings.scanlinesEnabled && <div className="scanlines" />}

      {/* 2. MAIN RETRO MENU SCREEN */}
      {gameState === 'menu' && (
        <MainMenu
          totalCoins={totalCoins}
          playerName={playerName}
          onUpdatePlayerName={(name) => setPlayerName(name)}
          selectedSkin={currentSkin}
          selectedClassId={selectedClassId}
          selectedMode={selectedMode}
          selectedArenaId={selectedArenaId}
          unclaimedMissionsCount={unclaimedMissionsCount}
          onSelectMode={(mode) => setSelectedMode(mode)}
          onSelectArena={(arenaId) => setSelectedArenaId(arenaId)}
          onOpenClassSelect={() => setIsClassSelectOpen(true)}
          onStartGame={handleStartGame}
          onOpenShop={() => setIsShopOpen(true)}
          onOpenMissions={() => setIsMissionsOpen(true)}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenMultiplayer={() => setIsMultiplayerLobbyOpen(true)}
        />
      )}

      {/* CLASS SELECTION MODAL */}
      {isClassSelectOpen && (
        <ClassSelectModal
          selectedClassId={selectedClassId}
          onSelectClass={(id) => setSelectedClassId(id)}
          onClose={() => setIsClassSelectOpen(false)}
        />
      )}

      {/* 3. IN-GAME RETRO PIXEL HUD */}
      {gameState === 'playing' && !isSpectating && playerStats && (
        <PixelHUD
          playerStats={playerStats}
          allStats={allStats}
          timeLeft={matchTimeLeft}
          currentEvent={currentEvent}
          crazyEvent={crazyButtonEvent}
          isTitanActive={engineRef.current?.player?.isTitan}
          buttonSkin={currentButtonSkin}
          recentKillEvent={recentKillEvent}
          battleNotifications={battleNotifications}
          onPunch={() => engineRef.current?.playerPunch()}
          onAbility={() => engineRef.current?.playerAbility()}
          onJump={() => engineRef.current?.playerJump()}
          onJoystickMove={(vec) => engineRef.current?.setJoystickMove(vec)}
          onPause={handlePause}
          isTouchDevice={isTouchDevice}
        />
      )}

      {/* 4. SPECTATOR HUD (When player is eliminated and watching survivors) */}
      {gameState === 'playing' && isSpectating && (
        <>
          <PixelHUD
            playerStats={playerStats || allStats[0]}
            allStats={allStats}
            timeLeft={matchTimeLeft}
            currentEvent={currentEvent}
            crazyEvent={crazyButtonEvent}
            isTitanActive={false}
            buttonSkin={currentButtonSkin}
            recentKillEvent={recentKillEvent}
            battleNotifications={battleNotifications}
            onPunch={() => {}}
            onAbility={() => {}}
            onJump={() => {}}
            onJoystickMove={() => {}}
            onPause={handlePause}
            isTouchDevice={false}
          />
          <SpectatorHUD
            spectatedStats={spectatedChar ? spectatedChar.stats : null}
            aliveCount={aliveSurvivorsCount}
            onCycleTarget={(dir) => engineRef.current?.cycleSpectateTarget(dir)}
            onExitToMenu={handleGoToMenu}
          />
        </>
      )}

      {/* 5. PLAYER 0 STOCKS ELIMINATION MODAL */}
      {isEliminatedModalOpen && (
        <EliminationModal
          killerStats={killerStats}
          killerBanner={killerBanner}
          onSpectate={handleEnterSpectate}
          onExitToMenu={handleGoToMenu}
          onRematch={handleStartGame}
        />
      )}

      {/* 6. PAUSE MODAL */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleStartGame}
          onGoToMenu={handleGoToMenu}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* 7. END GAME MODAL */}
      {gameState === 'gameover' && matchResult && (
        <EndGameModal
          result={matchResult}
          isMultiplayer={engineRef.current?.isMultiplayer || false}
          rematchVotesCount={rematchVotesCount}
          rematchTotalNeeded={rematchTotalNeeded}
          hasRequestedRematch={hasRequestedRematch}
          rematchNotice={rematchNotice}
          onRequestRematch={() => networkManager.requestRematch()}
          onRematch={handleStartGame}
          onGoToMenu={handleGoToMenu}
          onOpenShop={() => setIsShopOpen(true)}
        />
      )}

      {/* 8. SHOP MODAL (Skins, 3D Buttons, Kill Banners) */}
      {isShopOpen && (
        <ShopModal
          totalCoins={totalCoins}
          skins={skins}
          buttonSkins={buttonSkins}
          banners={banners}
          selectedSkinId={selectedSkinId}
          selectedButtonSkinId={selectedButtonSkinId}
          selectedBannerId={selectedBannerId}
          onBuySkin={handleBuySkin}
          onEquipSkin={handleEquipSkin}
          onBuyButtonSkin={handleBuyButtonSkin}
          onEquipButtonSkin={handleEquipButtonSkin}
          onBuyBanner={handleBuyBanner}
          onEquipBanner={handleEquipBanner}
          onClose={() => setIsShopOpen(false)}
        />
      )}

      {/* 9. DAILY MISSIONS MODAL */}
      {isMissionsOpen && (
        <MissionsModal
          missions={missions}
          onClaimReward={handleClaimReward}
          onClose={() => setIsMissionsOpen(false)}
        />
      )}

      {/* 10. HOW TO PLAY MODAL */}
      {isHowToPlayOpen && (
        <HowToPlayModal onClose={() => setIsHowToPlayOpen(false)} />
      )}

      {/* 11. SETTINGS MODAL */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* 12. MULTIPLAYER ROOMS LOBBY MODAL */}
      {isMultiplayerLobbyOpen && !activeRoom && (
        <MultiplayerLobbyModal
          playerName={playerName}
          selectedSkin={currentSkin}
          selectedClassId={selectedClassId}
          onClose={() => setIsMultiplayerLobbyOpen(false)}
          onRoomJoined={(room) => setActiveRoom(room)}
        />
      )}

      {/* 13. PRE-MATCH WAITING ROOM LOBBY */}
      {activeRoom && (
        <PreMatchLobbyModal
          room={activeRoom}
          onLeave={() => setActiveRoom(null)}
          onStartGame={() => {}}
        />
      )}
    </div>
  );
}
