import React, { useState } from 'react';
import { CharacterSkin, ButtonSkin, KillBanner, ClassId } from '../types';
import { PLAYER_CLASSES } from '../data/classes';
import { resolveEquippedSkin } from '../data/shopItems';
import { sound } from '../game/audio';

interface ShopModalProps {
  totalCoins: number;
  skins: CharacterSkin[];
  buttonSkins: ButtonSkin[];
  banners: KillBanner[];
  selectedSkinId: string;
  selectedButtonSkinId: string;
  selectedBannerId: string;
  selectedClassId?: ClassId;
  onBuySkin: (skinId: string) => void;
  onEquipSkin: (skinId: string) => void;
  onUnequipSkin?: (skinId: string) => void;
  onBuyButtonSkin: (btnId: string) => void;
  onEquipButtonSkin: (btnId: string) => void;
  onUnequipButtonSkin?: (btnId: string) => void;
  onBuyBanner: (bannerId: string) => void;
  onEquipBanner: (bannerId: string) => void;
  onUnequipBanner?: (bannerId: string) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  totalCoins,
  skins,
  buttonSkins,
  banners,
  selectedSkinId,
  selectedButtonSkinId,
  selectedBannerId,
  selectedClassId = 'brawler',
  onBuySkin,
  onEquipSkin,
  onUnequipSkin,
  onBuyButtonSkin,
  onEquipButtonSkin,
  onUnequipButtonSkin,
  onBuyBanner,
  onEquipBanner,
  onUnequipBanner,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'characters' | 'buttons' | 'banners'>('characters');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  const activeSkin = resolveEquippedSkin(selectedSkinId, selectedClassId, skins);
  const activeClassDef = PLAYER_CLASSES.find((c) => c.id === selectedClassId) || PLAYER_CLASSES[0];
  const activeBtn = buttonSkins.find((b) => b.id === selectedButtonSkinId) || buttonSkins[0];
  const activeBanner = banners.find((b) => b.id === selectedBannerId) || banners[0];

  const selectedClass = PLAYER_CLASSES.find((c) => c.id === selectedCharacterId);
  const characterSkins = skins.filter((skin) => {
    if (!selectedCharacterId) return true;
    if (selectedCharacterId === 'special') return !skin.classId;
    return skin.classId === selectedCharacterId;
  });

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm select-none">
      <div
        id="shop-modal-container"
        className="pixel-box-dark w-full max-w-4xl max-h-[94vh] flex flex-col bg-zinc-950 p-3 sm:p-5 text-white overflow-hidden border-4 border-amber-500 shadow-2xl"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b-2 sm:border-b-4 border-zinc-800 pb-2 sm:pb-3 mb-2.5">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl animate-pixel-float">🛒</span>
            <div>
              <h2 className="font-pixel-heading text-sm sm:text-lg text-yellow-400 pixel-text-stroke">
                TIENDA Y ARMERÍA ARCADE
              </h2>
              <div className="font-pixel-body text-[10px] sm:text-xs text-zinc-400">
                Equipa aspectos estándar, skins desbloqueables, pulsadores y banners
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Coins Counter */}
            <div className="pixel-box-gold px-2.5 sm:px-3.5 py-1 sm:py-1.5 flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <span className="text-sm sm:text-base">🪙</span>
              <span className="font-pixel-heading text-xs sm:text-sm text-black font-bold">{totalCoins}</span>
            </div>

            {/* Close Button */}
            <button
              id="shop-btn-close"
              onClick={() => {
                sound.playCoin();
                onClose();
              }}
              className="pixel-btn pixel-box-red px-2.5 sm:px-3 py-1 font-pixel-body text-[10px] sm:text-xs text-white hover:brightness-110"
            >
              [X] SALIR
            </button>
          </div>
        </div>

        {/* ACTIVE EQUIPPED ITEM STATUS BAR */}
        <div className="bg-zinc-900/90 border-2 border-zinc-700 px-3 py-1.5 mb-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[9px] font-pixel-body text-amber-400 font-bold uppercase shrink-0">
              EQUIPAMIENTO ACTUAL:
            </span>
            <div className="flex items-center gap-1.5 bg-black/60 px-2 py-0.5 border border-zinc-700 truncate">
              <span className="text-xs">{activeClassDef.icon}</span>
              <span className="font-pixel-heading text-[10px] text-zinc-300 truncate">{activeClassDef.name}</span>
              <span className="text-zinc-500">|</span>
              <span className="font-pixel-heading text-[10px] text-yellow-300 truncate">
                🎽 {activeSkin.name} {activeSkin.price === 0 ? '(Estándar)' : ''}
              </span>
            </div>
          </div>

          {activeSkin.price > 0 && onUnequipSkin && (
            <button
              onClick={() => {
                sound.playCoin();
                onUnequipSkin(activeSkin.id);
              }}
              className="pixel-btn pixel-box-dark px-2 py-0.5 text-[9px] font-pixel-heading text-amber-300 hover:text-white border border-amber-500/60"
              title="Volver a la skin estándar del personaje"
            >
              DESEQUIPAR SKIN ✕
            </button>
          )}
        </div>

        {/* TABS */}
        <div className="flex items-center gap-2 mb-3 border-b-2 border-zinc-800 pb-2">
          <button
            onClick={() => {
              sound.playCoin();
              setActiveTab('characters');
            }}
            className={`pixel-btn px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-pixel-heading transition-all ${
              activeTab === 'characters'
                ? 'pixel-box-blue bg-sky-600 text-white shadow-[0_0_10px_rgba(2,132,199,0.5)]'
                : 'pixel-box-dark bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            👤 PERSONAJES Y SKINS
          </button>

          <button
            onClick={() => {
              sound.playCoin();
              setActiveTab('buttons');
            }}
            className={`pixel-btn px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-pixel-heading transition-all ${
              activeTab === 'buttons'
                ? 'pixel-box-red bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]'
                : 'pixel-box-dark bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🔘 BOTONES 3D
          </button>

          <button
            onClick={() => {
              sound.playCoin();
              setActiveTab('banners');
            }}
            className={`pixel-btn px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-pixel-heading transition-all ${
              activeTab === 'banners'
                ? 'pixel-box-gold bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                : 'pixel-box-dark bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🚩 ESTANDARTES KO
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {/* TAB 1: CHARACTERS */}
          {activeTab === 'characters' && (
            <div>
              {/* VIEW A: CHARACTER SELECTION HUB */}
              {selectedCharacterId === null ? (
                <div className="space-y-2">
                  <div className="text-[11px] font-pixel-body text-zinc-400 mb-1 flex items-center justify-between">
                    <span>Selecciona un personaje para ver su skin estándar y catálogo de atuendos:</span>
                    <span className="text-yellow-400 text-[10px] font-pixel-heading">
                      ★ Todos tienen skin Estándar gratis
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2.5">
                    {PLAYER_CLASSES.map((cls) => {
                      const classSkins = skins.filter((s) => s.classId === cls.id);
                      const equippedClassSkin = classSkins.find((s) => s.id === activeSkin.id);
                      const isCurrentClass = selectedClassId === cls.id;
                      const unlockedCount = classSkins.filter((s) => s.unlocked).length;

                      return (
                        <div
                          key={cls.id}
                          onClick={() => {
                            sound.playCoin();
                            setSelectedCharacterId(cls.id);
                          }}
                          className={`pixel-box-dark p-3 cursor-pointer flex flex-col justify-between transition-all hover:scale-[1.02] border-2 group relative overflow-hidden`}
                          style={{
                            borderColor: isCurrentClass ? cls.color : '#3f3f46',
                            boxShadow: isCurrentClass ? `0 0 14px ${cls.color}44` : undefined,
                          }}
                        >
                          {/* Background Glow */}
                          <div
                            className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full opacity-10 blur-xl pointer-events-none"
                            style={{ backgroundColor: cls.color }}
                          />

                          <div className="flex items-center gap-2.5 mb-2">
                            <div
                              className="w-11 h-11 pixel-box-sm flex items-center justify-center text-2xl shrink-0 shadow-inner"
                              style={{ backgroundColor: cls.color }}
                            >
                              <span className="drop-shadow-md">{cls.icon}</span>
                            </div>
                            <div className="truncate">
                              <div className="font-pixel-heading text-xs text-white truncate group-hover:text-yellow-300">
                                {cls.name}
                              </div>
                              <div className="font-pixel-body text-[9px] text-zinc-400 truncate">
                                {cls.title}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-[10px] font-pixel-body">
                            <span className="text-zinc-400">
                              {unlockedCount}/{classSkins.length} Skins
                            </span>
                            {isCurrentClass && equippedClassSkin ? (
                              <span className="text-sky-400 font-pixel-heading text-[9px] font-bold">
                                ✓ EN USO ({equippedClassSkin.name})
                              </span>
                            ) : (
                              <span className="text-yellow-400 font-pixel-heading text-[9px] group-hover:translate-x-0.5 transition-transform">
                                VER SKINS ➔
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* SPECIALS CARD */}
                    <div
                      onClick={() => {
                        sound.playCoin();
                        setSelectedCharacterId('special');
                      }}
                      className="pixel-box-dark p-3 cursor-pointer flex flex-col justify-between transition-all hover:scale-[1.02] border-2 border-amber-500/60 bg-amber-950/20 group"
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-11 h-11 pixel-box-gold flex items-center justify-center text-2xl shrink-0">
                          <span>👑</span>
                        </div>
                        <div className="truncate">
                          <div className="font-pixel-heading text-xs text-yellow-300 truncate group-hover:text-white">
                            Skins Especiales
                          </div>
                          <div className="font-pixel-body text-[9px] text-amber-200/80 truncate">
                            UNIVERSALES & SUPREMAS
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-amber-800/40 text-[10px] font-pixel-body">
                        <span className="text-zinc-400">
                          {skins.filter((s) => !s.classId).length} Skins
                        </span>
                        {!activeSkin.classId ? (
                          <span className="text-yellow-300 font-pixel-heading text-[9px] font-bold">
                            ✓ EN USO ({activeSkin.name})
                          </span>
                        ) : (
                          <span className="text-yellow-400 font-pixel-heading text-[9px] group-hover:translate-x-0.5 transition-transform">
                            VER SKINS ➔
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* VIEW B: CHARACTER WARDROBE / SKIN SHOWCASE */
                <div className="space-y-3">
                  {/* TOP NAVIGATION BAR */}
                  <div className="flex items-center justify-between bg-zinc-900/90 p-2.5 border-2 border-zinc-800">
                    <button
                      onClick={() => {
                        sound.playCoin();
                        setSelectedCharacterId(null);
                      }}
                      className="pixel-btn pixel-box-dark px-3 py-1 text-[10px] sm:text-xs font-pixel-heading text-yellow-400 flex items-center gap-1 hover:brightness-125"
                    >
                      <span>←</span> VOLVER A PERSONAJES
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {selectedClass ? selectedClass.icon : '👑'}
                      </span>
                      <div className="text-left">
                        <span
                          className="font-pixel-heading text-xs sm:text-sm font-bold"
                          style={{ color: selectedClass?.color || '#fbbf24' }}
                        >
                          {selectedClass ? selectedClass.name.toUpperCase() : 'SKINS ESPECIALES'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SKINS LIST FOR THIS CHARACTER */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {characterSkins.map((skin) => {
                      const isEquipped = activeSkin.id === skin.id;
                      const canAfford = totalCoins >= skin.price;
                      const isStandard = skin.price === 0;

                      const getIcon = () => {
                        if (selectedClass) return selectedClass.icon;
                        if (skin.hatType === 'crown') return '👑';
                        if (skin.hatType === 'ninja') return '🥷';
                        if (skin.hatType === 'antenna') return '🤖';
                        if (skin.hatType === 'horns') return '🦖';
                        if (skin.hatType === 'hood') return '🔮';
                        if (skin.hatType === 'pirate') return '🏴‍☠️';
                        return '⚔️';
                      };

                      return (
                        <div
                          key={skin.id}
                          className={`pixel-box-dark p-3 flex flex-col justify-between transition-all ${
                            isEquipped
                              ? 'border-4 border-sky-400 bg-sky-950/40 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                              : 'bg-zinc-900/90 hover:bg-zinc-900'
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <div
                              className="w-14 h-14 pixel-box-sm flex items-center justify-center text-2xl shrink-0 relative shadow-inner"
                              style={{ backgroundColor: skin.color }}
                            >
                              <span className="drop-shadow-md">{getIcon()}</span>
                              <div
                                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-none border border-black"
                                style={{ backgroundColor: skin.detailColor }}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-pixel-heading text-xs text-white">
                                  {skin.name}
                                </span>
                                {isStandard ? (
                                  <span className="text-[8px] font-pixel-heading px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-600">
                                    ESTÁNDAR
                                  </span>
                                ) : skin.hatType !== 'none' ? (
                                  <span className="text-[8px] font-pixel-body px-1 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-700">
                                    3D: {skin.hatType.toUpperCase()}
                                  </span>
                                ) : null}
                              </div>
                              <div className="font-pixel-body text-[10px] text-zinc-400 mt-1 leading-tight">
                                {skin.description}
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-[9px] font-pixel-body text-cyan-300">
                                <span className="px-1.5 py-0.5 bg-cyan-950/60 border border-cyan-800/50">
                                  Vel: +{Math.round((skin.speedMultiplier - 1) * 100)}%
                                </span>
                                <span className="px-1.5 py-0.5 bg-cyan-950/60 border border-cyan-800/50">
                                  Placaje: x{skin.dashPowerMultiplier}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                            {skin.unlocked ? (
                              isEquipped ? (
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-pixel-heading text-xs text-sky-400 flex items-center gap-1 font-bold">
                                    <span>✓</span> {isStandard ? 'ESTÁNDAR EN USO' : 'EQUIPADO'}
                                  </span>
                                  {!isStandard && onUnequipSkin && (
                                    <button
                                      onClick={() => {
                                        sound.playCoin();
                                        onUnequipSkin(skin.id);
                                      }}
                                      className="pixel-btn pixel-box-red px-2.5 py-1 text-[10px] font-pixel-heading text-white hover:brightness-110"
                                      title="Desequipar y volver a la skin estándar"
                                    >
                                      DESEQUIPAR
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    sound.playCoin();
                                    onEquipSkin(skin.id);
                                  }}
                                  className={`pixel-btn px-3 py-1 text-xs font-pixel-heading text-white hover:brightness-110 ${
                                    isStandard ? 'pixel-box-green bg-emerald-600' : 'pixel-box-blue'
                                  }`}
                                >
                                  {isStandard ? 'USAR ESTÁNDAR' : 'EQUIPAR'}
                                </button>
                              )
                            ) : (
                              <button
                                onClick={() => {
                                  if (canAfford) {
                                    sound.playBigCoin();
                                    onBuySkin(skin.id);
                                  }
                                }}
                                disabled={!canAfford}
                                className={`pixel-btn pixel-box-gold px-3 py-1 text-xs font-pixel-heading flex items-center gap-1.5 ${
                                  !canAfford
                                    ? 'opacity-50 grayscale cursor-not-allowed'
                                    : 'text-black hover:brightness-110'
                                }`}
                              >
                                <span>DESBLOQUEAR</span>
                                <span>🪙 {skin.price}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BUTTONS */}
          {activeTab === 'buttons' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {buttonSkins.map((btn) => {
                const isEquipped = selectedButtonSkinId === btn.id;
                const canAfford = totalCoins >= btn.price;
                const isDefaultBtn = btn.id === 'button_classic_red';

                return (
                  <div
                    key={btn.id}
                    className={`pixel-box-dark p-3.5 flex flex-col justify-between transition-all ${
                      isEquipped
                        ? 'border-4 border-red-500 bg-red-950/40 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                        : 'bg-zinc-900/80 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div
                        className="w-14 h-14 pixel-box-sm rounded-none flex items-center justify-center text-xl flex-shrink-0 shadow-inner"
                        style={{ backgroundColor: btn.capColor }}
                      >
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white/50 shadow-md"
                          style={{ backgroundColor: btn.accentColor || '#ffffff' }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-pixel-heading text-xs text-white">{btn.name}</div>
                        <div className="font-pixel-body text-[11px] text-zinc-400 mt-1 leading-tight">
                          {btn.description}
                        </div>
                        <div className="mt-2 text-[10px] font-pixel-body text-zinc-400 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 inline-block" style={{ backgroundColor: btn.capColor }} />
                            Cap
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 inline-block" style={{ backgroundColor: btn.baseColor }} />
                            Base
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between">
                      {btn.unlocked ? (
                        isEquipped ? (
                          <div className="flex items-center justify-between w-full">
                            <span className="font-pixel-heading text-xs text-red-400 flex items-center gap-1">
                              <span>✓</span> ACTIVO EN ARENA
                            </span>
                            {!isDefaultBtn && onUnequipButtonSkin && (
                              <button
                                onClick={() => {
                                  sound.playCoin();
                                  onUnequipButtonSkin(btn.id);
                                }}
                                className="pixel-btn pixel-box-dark px-2.5 py-1 text-[10px] font-pixel-heading text-zinc-300 hover:text-white"
                              >
                                RESTABLECER
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              sound.playCoin();
                              onEquipButtonSkin(btn.id);
                            }}
                            className="pixel-btn pixel-box-red px-3.5 py-1 text-xs font-pixel-heading text-white hover:brightness-110"
                          >
                            ACTIVAR
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => {
                            if (canAfford) {
                              sound.playBigCoin();
                              onBuyButtonSkin(btn.id);
                            }
                          }}
                          disabled={!canAfford}
                          className={`pixel-btn pixel-box-gold px-3 py-1.5 text-xs font-pixel-heading flex items-center gap-1.5 ${
                            !canAfford ? 'opacity-50 grayscale cursor-not-allowed' : 'text-black hover:brightness-110'
                          }`}
                        >
                          <span>DESBLOQUEAR</span>
                          <span>🪙 {btn.price}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: KILL BANNERS */}
          {activeTab === 'banners' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {banners.map((banner) => {
                const isEquipped = selectedBannerId === banner.id;
                const canAfford = totalCoins >= banner.price;
                const isDefaultBanner = banner.id === 'banner_roba_monedas';

                return (
                  <div
                    key={banner.id}
                    className={`pixel-box-dark p-3.5 flex flex-col justify-between transition-all ${
                      isEquipped
                        ? 'border-4 border-amber-400 bg-amber-950/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'bg-zinc-900/80 hover:bg-zinc-900'
                    }`}
                  >
                    {/* Visual Preview Card of the Kill Banner */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-pixel-heading text-xs text-white">{banner.name}</span>
                        <span
                          className="text-[9px] font-pixel-body px-1.5 py-0.5 border"
                          style={{ borderColor: banner.borderColor, color: banner.textColor }}
                        >
                          {banner.badgeText || 'BANNER'}
                        </span>
                      </div>

                      {/* Mock in-game render of the kill banner */}
                      <div
                        className={`w-full p-2.5 border-2 flex items-center gap-3 bg-gradient-to-r ${banner.bgGradient}`}
                        style={{ borderColor: banner.borderColor }}
                      >
                        <div className="w-9 h-9 bg-black/60 border border-white/20 flex items-center justify-center text-xl flex-shrink-0">
                          {banner.icon}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-[10px] font-pixel-body text-zinc-300 uppercase tracking-wide">
                            ELIMINADO POR:
                          </div>
                          <div className="font-pixel-heading text-xs truncate" style={{ color: banner.textColor }}>
                            {banner.title}
                          </div>
                        </div>
                      </div>

                      <div className="font-pixel-body text-[11px] text-zinc-400 mt-2">
                        {banner.description}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between">
                      {banner.unlocked ? (
                        isEquipped ? (
                          <div className="flex items-center justify-between w-full">
                            <span className="font-pixel-heading text-xs text-amber-400 flex items-center gap-1">
                              <span>✓</span> EQUIPADO
                            </span>
                            {!isDefaultBanner && onUnequipBanner && (
                              <button
                                onClick={() => {
                                  sound.playCoin();
                                  onUnequipBanner(banner.id);
                                }}
                                className="pixel-btn pixel-box-dark px-2.5 py-1 text-[10px] font-pixel-heading text-zinc-300 hover:text-white"
                              >
                                RESTABLECER
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              sound.playCoin();
                              onEquipBanner(banner.id);
                            }}
                            className="pixel-btn pixel-box-gold px-3.5 py-1 text-xs font-pixel-heading text-black hover:brightness-110"
                          >
                            EQUIPAR
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => {
                            if (canAfford) {
                              sound.playBigCoin();
                              onBuyBanner(banner.id);
                            }
                          }}
                          disabled={!canAfford}
                          className={`pixel-btn pixel-box-gold px-3 py-1.5 text-xs font-pixel-heading flex items-center gap-1.5 ${
                            !canAfford ? 'opacity-50 grayscale cursor-not-allowed' : 'text-black hover:brightness-110'
                          }`}
                        >
                          <span>DESBLOQUEAR</span>
                          <span>🪙 {banner.price}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

