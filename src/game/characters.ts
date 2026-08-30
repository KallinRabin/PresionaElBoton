import * as THREE from 'three';
import { CharacterSkin, PlayerStats, ClassId, ItemType } from '../types';
import { PLAYER_CLASSES } from '../data/classes';
import { ParticleSystem3D } from './particles';
import { sound } from './audio';

export class Character3D {
  public group: THREE.Group;
  public isPlayer: boolean;
  public skin: CharacterSkin;
  public classId: ClassId;
  public stats: PlayerStats;

  // Visual Meshes
  private headMesh!: THREE.Mesh;
  private bodyMesh!: THREE.Mesh;
  private leftArmMesh!: THREE.Mesh;
  private rightArmMesh!: THREE.Mesh;
  private leftLegMesh!: THREE.Mesh;
  private rightLegMesh!: THREE.Mesh;
  private hatMesh: THREE.Group | null = null;
  private gloveMesh!: THREE.Group;
  private batMesh!: THREE.Mesh;
  private reflectShieldMesh!: THREE.Mesh;
  private iceBlockMesh!: THREE.Group;
  private nameplateSprite!: THREE.Sprite;
  private groundRingMesh!: THREE.Mesh;
  private overheadMarkerMesh!: THREE.Mesh;

  // Combat Attacker Tracking
  public lastAttacker: Character3D | null = null;
  public lastHitTime: number = 0;

  // Physics & Movement
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public isGrounded: boolean = false;
  public facingAngle: number = 0;
  public respawnTimer: number = 0;
  public invulnerableTimer: number = 0;

  // Attack & Glove Animation
  public punchAnimProgress: number = 0; // 0 to 1
  public isPunching: boolean = false;
  public punchType: 'normal' | 'titan' | 'bat' = 'normal';

  // Super Titan Mode
  public isTitan: boolean = false;
  public titanTimeLeft: number = 0;

  // Ice Charged Glove (Frost Valkyrie)
  public hasIceCharge: boolean = false;
  public isFrozen: boolean = false;
  public freezeTimer: number = 0;

  // Multiplayer Network & Team
  public networkId?: string;
  public team?: 'red' | 'blue';

  // Animation Timers
  private walkCycle: number = 0;
  private particles: ParticleSystem3D;

  constructor(
    isPlayer: boolean,
    skin: CharacterSkin,
    classId: ClassId,
    name: string,
    particles: ParticleSystem3D,
    networkId?: string,
    team?: 'red' | 'blue'
  ) {
    this.isPlayer = isPlayer;
    this.skin = skin;
    this.classId = classId;
    this.particles = particles;
    this.networkId = networkId;
    this.team = team;
    this.group = new THREE.Group();

    const selectedClass = PLAYER_CLASSES.find((c) => c.id === classId) || PLAYER_CLASSES[0];

    // Initial Stats
    this.stats = {
      id: isPlayer ? 'player' : `bot_${Math.random().toString(36).substring(2, 7)}`,
      name,
      isPlayer,
      classId,
      className: selectedClass.name,
      classIcon: selectedClass.icon,
      coins: 50,
      rank: 1,
      damagePercent: 0,
      stocks: 3,
      kosDone: 0,
      kosSuffered: 0,
      totalDamageDealt: 0,
      stealsDone: 0,
      stealsSuffered: 0,
      buttonPresses: 0,
      isEliminated: false,
      isAttacking: false,
      attackCooldown: 0,
      abilityCooldown: 0,
      abilityMaxCooldown: selectedClass.ability.cooldown,
      abilityActiveTime: 0,
      hasReflectShield: false,
      hasGiantGlove: false,
      hasSpeedBoost: false,
      hasInvincibleShield: false,
      activeItem: null,
      itemTimeLeft: 0,
      isStunned: false,
      stunTimeLeft: 0,
      isRespawning: false,
      color: selectedClass.color,
      skinId: skin.id,
    };

    this.buildMesh();
    this.buildHat();
    this.buildGlove();
    this.buildBat();
    this.buildReflectShield();
    this.buildIceBlock();
    this.buildNameplate();
    this.buildIndicators();
  }

  // 3D Pixel Voxel Hat & Cosmetics
  private buildHat() {
    if (this.skin.hatType === 'none') return;

    this.hatMesh = new THREE.Group();
    const hatType = this.skin.hatType;
    const detailColor = new THREE.Color(this.skin.detailColor);
    const goldColor = new THREE.Color(0xf59e0b);
    const redColor = new THREE.Color(0xef4444);

    if (hatType === 'crown') {
      // Golden Royal Crown with Gems
      const crownMat = new THREE.MeshLambertMaterial({ color: goldColor });
      const gemMat = new THREE.MeshLambertMaterial({ color: redColor });

      const baseGeo = new THREE.BoxGeometry(0.74, 0.12, 0.74);
      const base = new THREE.Mesh(baseGeo, crownMat);
      base.position.y = 0.38;
      this.hatMesh.add(base);

      // 4 Corner points + 1 center point
      const pointGeo = new THREE.BoxGeometry(0.12, 0.22, 0.12);
      const offsets = [
        [-0.28, 0.5, -0.28],
        [0.28, 0.5, -0.28],
        [-0.28, 0.5, 0.28],
        [0.28, 0.5, 0.28],
        [0, 0.54, 0.32],
      ];
      offsets.forEach(([x, y, z]) => {
        const pt = new THREE.Mesh(pointGeo, crownMat);
        pt.position.set(x, y, z);
        this.hatMesh.add(pt);
      });

      // Central ruby gem
      const gemGeo = new THREE.BoxGeometry(0.1, 0.1, 0.08);
      const gem = new THREE.Mesh(gemGeo, gemMat);
      gem.position.set(0, 0.42, 0.38);
      this.hatMesh.add(gem);
    } else if (hatType === 'ninja') {
      // Ninja Headband with tails
      const bandMat = new THREE.MeshLambertMaterial({ color: redColor });
      const bandGeo = new THREE.BoxGeometry(0.76, 0.16, 0.76);
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.y = 0.15;
      this.hatMesh.add(band);

      // Trailing ribbon tails
      const tailGeo = new THREE.BoxGeometry(0.1, 0.35, 0.05);
      const tail1 = new THREE.Mesh(tailGeo, bandMat);
      tail1.position.set(-0.1, 0.05, -0.42);
      tail1.rotation.x = -0.25;
      const tail2 = new THREE.Mesh(tailGeo, bandMat);
      tail2.position.set(0.1, 0.0, -0.44);
      tail2.rotation.x = -0.35;
      this.hatMesh.add(tail1, tail2);
    } else if (hatType === 'antenna') {
      // Cyber Bot Antenna
      const antMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(0x06b6d4) });
      const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6);
      const stem = new THREE.Mesh(stemGeo, antMat);
      stem.position.y = 0.55;
      const bulbGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.y = 0.75;
      this.hatMesh.add(stem, bulb);
    } else if (hatType === 'horns') {
      // Rex Retro Dragon Horns
      const hornMat = new THREE.MeshLambertMaterial({ color: detailColor });
      const hornGeo = new THREE.ConeGeometry(0.12, 0.38, 4);
      const hornL = new THREE.Mesh(hornGeo, hornMat);
      hornL.position.set(-0.25, 0.48, 0.05);
      hornL.rotation.z = -0.3;
      hornL.rotation.x = -0.2;
      const hornR = new THREE.Mesh(hornGeo, hornMat);
      hornR.position.set(0.25, 0.48, 0.05);
      hornR.rotation.z = 0.3;
      hornR.rotation.x = -0.2;
      this.hatMesh.add(hornL, hornR);
    } else if (hatType === 'helmet') {
      // Knight Helmet Crest
      const helmMat = new THREE.MeshLambertMaterial({ color: detailColor });
      const crestGeo = new THREE.BoxGeometry(0.14, 0.3, 0.72);
      const crest = new THREE.Mesh(crestGeo, helmMat);
      crest.position.y = 0.46;
      this.hatMesh.add(crest);
    } else if (hatType === 'hood') {
      // Shadow Shroud Hood
      const hoodMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(0x1e1b4b) });
      const hoodTop = new THREE.BoxGeometry(0.78, 0.2, 0.78);
      const hoodMesh = new THREE.Mesh(hoodTop, hoodMat);
      hoodMesh.position.y = 0.42;
      this.hatMesh.add(hoodMesh);
    } else if (hatType === 'pirate') {
      // Pirate Tricorn Hat
      const hatMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(0x18181b) });
      const brimGeo = new THREE.BoxGeometry(0.9, 0.1, 0.9);
      const brim = new THREE.Mesh(brimGeo, hatMat);
      brim.position.y = 0.38;
      const crownGeo = new THREE.BoxGeometry(0.65, 0.25, 0.65);
      const crown = new THREE.Mesh(crownGeo, hatMat);
      crown.position.y = 0.52;
      const skullGeo = new THREE.BoxGeometry(0.12, 0.12, 0.05);
      const skullMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const skull = new THREE.Mesh(skullGeo, skullMat);
      skull.position.set(0, 0.45, 0.46);
      this.hatMesh.add(brim, crown, skull);
    } else if (hatType === 'cap') {
      // Retro Baseball Cap
      const capMat = new THREE.MeshLambertMaterial({ color: detailColor });
      const topGeo = new THREE.BoxGeometry(0.74, 0.2, 0.74);
      const top = new THREE.Mesh(topGeo, capMat);
      top.position.y = 0.4;
      const visorGeo = new THREE.BoxGeometry(0.6, 0.06, 0.3);
      const visor = new THREE.Mesh(visorGeo, capMat);
      visor.position.set(0, 0.34, 0.48);
      this.hatMesh.add(top, visor);
    }

    this.headMesh.add(this.hatMesh);
  }

  // Visual Identification Indicators for 3rd Person view
  private buildIndicators() {
    if (this.isPlayer) {
      // 1. Glowing ground ring under player's feet
      const ringGeo = new THREE.RingGeometry(0.85, 1.05, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      this.groundRingMesh = new THREE.Mesh(ringGeo, ringMat);
      this.groundRingMesh.rotation.x = Math.PI / 2;
      this.groundRingMesh.position.y = 0.05;
      this.group.add(this.groundRingMesh);

      // 2. Overhead marker arrow (Voxel cone/pyramid pointing down at player)
      const arrowGeo = new THREE.ConeGeometry(0.35, 0.45, 4);
      const arrowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      this.overheadMarkerMesh = new THREE.Mesh(arrowGeo, arrowMat);
      this.overheadMarkerMesh.rotation.x = Math.PI; // pointing down
      this.overheadMarkerMesh.position.y = 2.7;
      this.group.add(this.overheadMarkerMesh);
    } else {
      // Subtle enemy target ring
      const ringGeo = new THREE.RingGeometry(0.65, 0.8, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      });
      this.groundRingMesh = new THREE.Mesh(ringGeo, ringMat);
      this.groundRingMesh.rotation.x = Math.PI / 2;
      this.groundRingMesh.position.y = 0.04;
      this.group.add(this.groundRingMesh);

      // Invisible placeholder
      const dummyGeo = new THREE.BufferGeometry();
      this.overheadMarkerMesh = new THREE.Mesh(dummyGeo);
    }
  }

  private buildMesh() {
    const mainColor = new THREE.Color(this.stats.color);
    const headColor = new THREE.Color(this.skin.headColor);
    const bodyColor = new THREE.Color(this.skin.bodyColor);
    const detailColor = new THREE.Color(this.skin.detailColor);

    // Chunky pixel voxel materials
    const headMat = new THREE.MeshLambertMaterial({ color: headColor });
    const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    const limbMat = new THREE.MeshLambertMaterial({ color: mainColor });
    const darkMat = new THREE.MeshLambertMaterial({ color: detailColor });

    // 1. Head (Voxel Cube)
    const headGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    this.headMesh = new THREE.Mesh(headGeo, headMat);
    this.headMesh.position.y = 1.45;
    this.headMesh.castShadow = true;

    // Face features (Eyes)
    const eyeGeo = new THREE.BoxGeometry(0.12, 0.12, 0.05);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.18, 0.05, 0.36);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.18, 0.05, 0.36);
    this.headMesh.add(eyeL, eyeR);

    // 2. Torso (Chunky Body)
    const bodyGeo = new THREE.BoxGeometry(0.75, 0.8, 0.45);
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = 0.75;
    this.bodyMesh.castShadow = true;

    // 3. Left Arm
    const armGeo = new THREE.BoxGeometry(0.24, 0.65, 0.24);
    this.leftArmMesh = new THREE.Mesh(armGeo, limbMat);
    this.leftArmMesh.position.set(-0.52, 0.75, 0);
    this.leftArmMesh.castShadow = true;

    // 4. Right Arm (Carries the Steal Glove)
    this.rightArmMesh = new THREE.Mesh(armGeo, limbMat);
    this.rightArmMesh.position.set(0.52, 0.75, 0);
    this.rightArmMesh.castShadow = true;

    // 5. Legs
    const legGeo = new THREE.BoxGeometry(0.26, 0.55, 0.26);
    this.leftLegMesh = new THREE.Mesh(legGeo, darkMat);
    this.leftLegMesh.position.set(-0.2, 0.28, 0);
    this.leftLegMesh.castShadow = true;

    this.rightLegMesh = new THREE.Mesh(legGeo, darkMat);
    this.rightLegMesh.position.set(0.2, 0.28, 0);
    this.rightLegMesh.castShadow = true;

    this.group.add(
      this.headMesh,
      this.bodyMesh,
      this.leftArmMesh,
      this.rightArmMesh,
      this.leftLegMesh,
      this.rightLegMesh
    );
  }

  // Build the 3D Pixel Steal Glove attached to right fist
  private buildGlove() {
    this.gloveMesh = new THREE.Group();

    // Main Glove boxing cap
    const gloveCapGeo = new THREE.BoxGeometry(0.48, 0.48, 0.55);
    const gloveMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(this.stats.color) });
    const gloveCap = new THREE.Mesh(gloveCapGeo, gloveMat);
    gloveCap.position.set(0, -0.2, 0.15);
    gloveCap.castShadow = true;

    // Golden Coin Thief Icon on back of glove
    const emblemGeo = new THREE.BoxGeometry(0.2, 0.2, 0.08);
    const emblemMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
    const emblem = new THREE.Mesh(emblemGeo, emblemMat);
    emblem.position.set(0, 0, 0.3);
    gloveCap.add(emblem);

    this.gloveMesh.add(gloveCap);
    this.gloveMesh.position.set(0, -0.3, 0);
    this.rightArmMesh.add(this.gloveMesh);
  }

  // Build Golden Home-Run Bat
  private buildBat() {
    const batGeo = new THREE.CylinderGeometry(0.12, 0.05, 1.2, 6);
    const batMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
    this.batMesh = new THREE.Mesh(batGeo, batMat);
    this.batMesh.rotation.x = Math.PI / 3;
    this.batMesh.position.set(0.1, -0.2, 0.4);
    this.batMesh.visible = false;
    this.rightArmMesh.add(this.batMesh);
  }

  // Build Reflect Shield Barrier
  private buildReflectShield() {
    const shieldGeo = new THREE.SphereGeometry(1.2, 8, 8);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      wireframe: true,
    });
    this.reflectShieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.reflectShieldMesh.position.y = 0.9;
    this.reflectShieldMesh.visible = false;
    this.group.add(this.reflectShieldMesh);
  }

  // 3D Translucent Frozen Ice Block Container
  private buildIceBlock() {
    this.iceBlockMesh = new THREE.Group();

    // 1. Outer Translucent Ice Block Box
    const iceGeo = new THREE.BoxGeometry(1.5, 2.2, 1.5);
    const iceMat = new THREE.MeshLambertMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.72,
    });
    const mainIce = new THREE.Mesh(iceGeo, iceMat);
    mainIce.position.y = 1.0;
    this.iceBlockMesh.add(mainIce);

    // 2. Cyan Glacial Edge Crystal Borders
    const edgeGeo = new THREE.BoxGeometry(1.56, 0.08, 1.56);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const topEdge = new THREE.Mesh(edgeGeo, edgeMat);
    topEdge.position.y = 2.05;
    const botEdge = new THREE.Mesh(edgeGeo, edgeMat);
    botEdge.position.y = -0.05;
    this.iceBlockMesh.add(topEdge, botEdge);

    // 3. Floating Ice Crystal Shards
    const shardGeo = new THREE.OctahedronGeometry(0.3, 0);
    const shardMat = new THREE.MeshBasicMaterial({ color: 0xa5f3fc });
    const shard1 = new THREE.Mesh(shardGeo, shardMat);
    shard1.position.set(-0.8, 1.4, 0.5);
    const shard2 = new THREE.Mesh(shardGeo, shardMat);
    shard2.position.set(0.8, 0.7, -0.5);
    this.iceBlockMesh.add(shard1, shard2);

    this.iceBlockMesh.visible = false;
    this.group.add(this.iceBlockMesh);
  }

  // Dynamic 3D Billboard Nameplate with Damage % and Stock Hearts
  private buildNameplate() {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 44;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      this.drawNameplateCanvas(ctx);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    this.nameplateSprite = new THREE.Sprite(spriteMat);
    this.nameplateSprite.scale.set(1.6, 0.44, 1);
    this.nameplateSprite.position.y = 2.1;
    this.group.add(this.nameplateSprite);
  }

  public updateNameplate() {
    if (!this.nameplateSprite.material.map) return;
    const canvas = this.nameplateSprite.material.map.image as HTMLCanvasElement;
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 160, 44);
    this.drawNameplateCanvas(ctx);
    this.nameplateSprite.material.map.needsUpdate = true;
  }

  private drawNameplateCanvas(ctx: CanvasRenderingContext2D) {
    // 1. Subtle Dark Pixel Backdrop with Team Color Support
    const teamBorder = this.team === 'red' ? '#ef4444' : this.team === 'blue' ? '#3b82f6' : this.isPlayer ? '#38bdf8' : 'rgba(113, 113, 122, 0.6)';
    ctx.fillStyle = this.team === 'red' ? 'rgba(40, 10, 10, 0.85)' : this.team === 'blue' ? 'rgba(10, 20, 40, 0.85)' : this.isPlayer ? 'rgba(8, 20, 36, 0.82)' : 'rgba(12, 12, 18, 0.75)';
    ctx.fillRect(0, 0, 160, 44);
    ctx.strokeStyle = teamBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 158, 42);

    // 2. Name & Class Icon
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = this.team === 'red' ? '#fca5a5' : this.team === 'blue' ? '#93c5fd' : this.isPlayer ? '#38bdf8' : '#e4e4e7';
    const teamTag = this.team === 'red' ? '🔴 ' : this.team === 'blue' ? '🔵 ' : '';
    ctx.fillText(`${teamTag}${this.stats.classIcon} ${this.stats.name.substring(0, 9)}`, 6, 6);

    // 3. Smash Damage %
    const dmg = Math.round(this.stats.damagePercent);
    let dmgColor = '#fef08a';
    if (dmg >= 160) {
      dmgColor = '#ef4444';
    } else if (dmg >= 120) {
      dmgColor = '#f87171';
    } else if (dmg >= 80) {
      dmgColor = '#fb923c';
    } else if (dmg >= 40) {
      dmgColor = '#facc15';
    }

    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = dmgColor;
    ctx.textAlign = 'left';
    ctx.fillText(`${dmg}%`, 6, 24);

    // 4. Stock Lives
    let stockStr = '';
    for (let i = 0; i < Math.max(0, this.stats.stocks); i++) stockStr += '❤️';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(stockStr || 'KO', 154, 26);
  }

  // Trigger Steal Glove Punch
  public triggerPunch(type: 'normal' | 'titan' | 'bat' = 'normal') {
    if (this.isPunching || this.stats.isStunned || this.stats.isRespawning) return;
    this.isPunching = true;
    this.punchType = type;
    this.punchAnimProgress = 0;
    this.stats.isAttacking = true;
    this.stats.attackCooldown = type === 'titan' ? 0.85 : 0.55;
  }

  public setTitanMode(duration: number = 8) {
    this.titanTimeLeft = duration;
    this.isTitan = true;
    this.invulnerableTimer = 1.0;
    this.particles.createSparkles(this.group.position, '#f59e0b');
    this.particles.createFloatingText(this.group.position, '¡MODO TITÁN!', '#fbbf24');
  }

  public applyFreeze(duration: number = 1.0) {
    this.isFrozen = true;
    this.freezeTimer = duration;
    this.stats.isStunned = true;
    this.stats.stunTimeLeft = duration;
    this.iceBlockMesh.visible = true;
    this.velocity.set(0, 0, 0);
    this.particles.createSparkles(this.group.position, '#06b6d4');
    this.particles.createSparkles(this.group.position, '#a5f3fc');
    this.particles.createFloatingText(this.group.position, '¡CONGELADO 1.0s!', '#06b6d4');
  }

  public update(delta: number) {
    // 1. Cooldowns & Timers
    if (this.stats.attackCooldown > 0) {
      this.stats.attackCooldown = Math.max(0, this.stats.attackCooldown - delta);
    }
    if (this.stats.abilityCooldown > 0) {
      this.stats.abilityCooldown = Math.max(0, this.stats.abilityCooldown - delta);
    }
    if (this.stats.stunTimeLeft > 0) {
      this.stats.stunTimeLeft = Math.max(0, this.stats.stunTimeLeft - delta);
      if (this.stats.stunTimeLeft === 0) {
        this.stats.isStunned = false;
      }
    }
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - delta);
      this.group.visible = Math.floor(this.invulnerableTimer * 10) % 2 === 0;
    } else {
      this.group.visible = true;
    }

    // Active Item Timer
    if (this.stats.itemTimeLeft > 0) {
      this.stats.itemTimeLeft = Math.max(0, this.stats.itemTimeLeft - delta);
      if (this.stats.itemTimeLeft === 0) {
        this.stats.activeItem = null;
        this.stats.hasGiantGlove = false;
        this.stats.hasMagnet = false;
        this.stats.hasSpeedBoost = false;
        this.stats.hasInvincibleShield = false;
        this.batMesh.visible = false;
      }
    }

    // Reflect Shield visual
    this.reflectShieldMesh.visible = this.stats.hasReflectShield;
    if (this.stats.hasReflectShield) {
      this.reflectShieldMesh.rotation.y += 4 * delta;
    }

    // Super Titan Transformation Scaling
    if (this.titanTimeLeft > 0) {
      this.titanTimeLeft = Math.max(0, this.titanTimeLeft - delta);
      this.isTitan = true;
      const targetScale = 1.75;
      const cur = this.group.scale.x;
      this.group.scale.setScalar(cur + (targetScale - cur) * Math.min(1.0, 10 * delta));
      if (Math.random() < 0.25) {
        this.particles.createSparkles(this.group.position, '#f59e0b');
      }
    } else {
      this.isTitan = false;
      const targetScale = 1.0;
      const cur = this.group.scale.x;
      if (cur > 1.01) {
        this.group.scale.setScalar(cur + (targetScale - cur) * Math.min(1.0, 8 * delta));
      } else {
        this.group.scale.setScalar(1.0);
      }
    }

    // Giant Glove scale & Ice Charge aura
    if (this.stats.hasGiantGlove || this.isTitan) {
      this.gloveMesh.scale.setScalar(this.isTitan ? 2.4 : 2.0);
    } else if (this.hasIceCharge) {
      this.gloveMesh.scale.setScalar(1.25);
    } else {
      this.gloveMesh.scale.setScalar(1.0);
    }

    if (this.hasIceCharge && Math.random() < 0.35) {
      const gloveWorldPos = new THREE.Vector3();
      this.gloveMesh.getWorldPosition(gloveWorldPos);
      this.particles.createSparkles(gloveWorldPos, '#06b6d4');
    }

    // 2. Punch Animation (Paced and readable)
    if (this.isPunching) {
      this.punchAnimProgress += delta * (this.punchType === 'titan' ? 2.5 : 3.8);
      if (this.punchAnimProgress >= 1.0) {
        this.isPunching = false;
        this.punchAnimProgress = 0;
        this.stats.isAttacking = false;
        this.rightArmMesh.position.set(0.52, 0.75, 0);
        this.rightArmMesh.rotation.set(0, 0, 0);
      } else {
        // Forward extension & recovery arc
        const progress = this.punchAnimProgress;
        const forwardReach = Math.sin(progress * Math.PI) * (this.punchType === 'titan' ? 1.3 : 0.85);
        this.rightArmMesh.position.z = forwardReach;
        this.rightArmMesh.position.y = 0.75 + Math.sin(progress * Math.PI) * 0.25;
        this.rightArmMesh.rotation.x = -Math.sin(progress * Math.PI) * 1.0;
      }
    }

    // Ice Block Visual & Shatter Effect (Strictly for Frost Valkyrie Frozen State)
    if (this.isFrozen && this.freezeTimer > 0) {
      this.freezeTimer = Math.max(0, this.freezeTimer - delta);
      this.stats.isStunned = true;
      this.stats.stunTimeLeft = this.freezeTimer;
      this.iceBlockMesh.visible = true;
      this.velocity.x = 0;
      this.velocity.z = 0;
      if (Math.random() < 0.3) {
        this.particles.createSparkles(this.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)), '#a5f3fc');
      }
      if (this.freezeTimer <= 0) {
        this.isFrozen = false;
        this.stats.isStunned = false;
        this.iceBlockMesh.visible = false;
        this.particles.createSparkles(this.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)), '#38bdf8');
        this.particles.createHitSparks(this.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)), true);
        sound.playHomeRunBat();
      }
    } else if (!this.isFrozen) {
      if (this.iceBlockMesh.visible) {
        this.iceBlockMesh.visible = false;
      }
    }

    // 3. Strategic Slower Movement & Walk Cycle (Locked if frozen)
    const horizSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    if (horizSpeed > 0.2 && this.isGrounded && !this.isPunching && !this.isFrozen) {
      this.walkCycle += delta * horizSpeed * 3.2;
      const legSwing = Math.sin(this.walkCycle) * 0.4;
      this.leftLegMesh.rotation.x = legSwing;
      this.rightLegMesh.rotation.x = -legSwing;
      this.leftArmMesh.rotation.x = -legSwing * 0.5;
      this.headMesh.position.y = 1.45 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.05;
    } else if (!this.isPunching) {
      this.leftLegMesh.rotation.x = 0;
      this.rightLegMesh.rotation.x = 0;
      this.leftArmMesh.rotation.x = 0;
      this.headMesh.position.y = 1.45;
    }

    // Rotation facing
    this.group.rotation.y = this.facingAngle;

    // Animate visual indicators
    if (this.groundRingMesh) {
      this.groundRingMesh.rotation.z += 1.5 * delta;
    }
    if (this.isPlayer && this.overheadMarkerMesh) {
      this.overheadMarkerMesh.position.y = 2.6 + Math.sin(Date.now() * 0.006) * 0.12;
      this.overheadMarkerMesh.rotation.y += 2.0 * delta;
    }

    // Update billboard
    this.updateNameplate();
  }

  // Receive Smash Hit: increase damage %, calculate knockback
  public receiveHit(
    attacker: Character3D,
    baseDamage: number,
    baseKnockback: number,
    isCritical: boolean = false
  ) {
    if (this.invulnerableTimer > 0 || this.stats.isRespawning) return;

    // Check Energy Shield (Power-up Item)
    if (this.stats.activeItem === 'shield' || this.stats.hasInvincibleShield) {
      this.particles.createHitSparks(this.group.position, true);
      this.particles.createSparkles(this.group.position, '#06b6d4');
      this.particles.createFloatingText(this.group.position, '¡ESCUDO BLOQUEÓ!', '#06b6d4');
      return;
    }

    // Check Reflect Shield (Iron Guardian)
    if (this.stats.hasReflectShield) {
      this.particles.createHitSparks(this.group.position, true);
      this.particles.createFloatingText(this.group.position, '¡REFLEJADO!', '#38bdf8');
      // Reflect back to attacker
      const reflectDir = new THREE.Vector3()
        .subVectors(attacker.group.position, this.group.position)
        .normalize();
      attacker.receiveHit(this, baseDamage * 0.5, baseKnockback * 1.4, true);
      return;
    }

    // Factor in Titan mode for attacker & defender
    const finalDamage = baseDamage * (attacker.isTitan ? 1.6 : 1.0) * (this.isTitan ? 0.45 : 1.0);
    const finalBaseKnockback = baseKnockback * (attacker.isTitan ? 1.5 : 1.0);

    // Add Damage %
    this.lastAttacker = attacker;
    this.lastHitTime = Date.now();
    this.stats.damagePercent += finalDamage;
    attacker.stats.totalDamageDealt += finalDamage;

    // Steal Coins
    const attackerClass = PLAYER_CLASSES.find((c) => c.id === attacker.classId) || PLAYER_CLASSES[0];
    let coinsToSteal = Math.min(this.stats.coins, Math.floor(attackerClass.stealPower * (isCritical ? 1.6 : 1.0) * (attacker.isTitan ? 1.5 : 1.0)));
    if (this.stats.coins > 0 && coinsToSteal > 0) {
      this.stats.coins -= coinsToSteal;
      attacker.stats.coins += coinsToSteal;
      this.stats.stealsSuffered++;
      attacker.stats.stealsDone++;
      this.particles.createCoinBurst(this.group.position, Math.min(12, coinsToSteal));
      this.particles.createFloatingText(
        this.group.position,
        `-${coinsToSteal} 🪙`,
        '#ef4444'
      );
      this.particles.createFloatingText(
        attacker.group.position,
        `+${coinsToSteal} 🪙`,
        '#f59e0b'
      );
    }

    const classDef = PLAYER_CLASSES.find((c) => c.id === this.classId) || PLAYER_CLASSES[0];
    const weight = classDef.weight * (this.isTitan ? 2.8 : 1.0);
    const p = this.stats.damagePercent;

    // Enhanced progressive Smash Knockback Scaling:
    // Low % (0-40%)   -> Light push and flinch
    // Mid % (50-90%)  -> Noticeable launch, rewarding combos
    // High % (100%+)  -> Heavy high-velocity launch with thrilling KO danger
    const totalKnockback =
      (((finalBaseKnockback * 0.65) + (p * 0.12) + Math.pow(p / 100, 1.65) * 6.8) *
        (isCritical ? 1.3 : 1.0)) /
      weight;

    // Calculate launch vector
    const launchDir = new THREE.Vector3()
      .subVectors(this.group.position, attacker.group.position)
      .normalize();
    launchDir.y = 0;
    if (launchDir.lengthSq() < 0.01) launchDir.set(0, 0, 1);
    launchDir.normalize();

    this.velocity.x = launchDir.x * totalKnockback;
    this.velocity.z = launchDir.z * totalKnockback;
    
    // Dynamic vertical launch arc scaling with %
    const verticalLaunch = Math.min(10.5, 2.5 + (p * 0.04) + Math.pow(p / 100, 1.4) * 3.8);
    this.velocity.y = verticalLaunch;
    this.isGrounded = false;

    // Stun & Color Feedback based strictly on % (only if not in Valkyrie deep freeze)
    let damageColor = '#fef08a';
    if (!this.isFrozen) {
      if (p >= 150) {
        damageColor = '#ef4444';
        this.stats.stunTimeLeft = Math.min(0.45, 0.22 + (p / 250) * 0.15);
        this.particles.createSmashBlast(this.group.position);
      } else if (p >= 90) {
        damageColor = '#f87171';
        this.stats.stunTimeLeft = Math.min(0.35, 0.18 + (p / 250) * 0.12);
        this.particles.createHitSparks(this.group.position, true);
      } else if (p >= 40) {
        damageColor = '#fb923c';
        this.stats.stunTimeLeft = 0.2;
        this.particles.createHitSparks(this.group.position, false);
      } else {
        damageColor = '#facc15';
        this.stats.stunTimeLeft = 0.12;
        this.particles.createHitSparks(this.group.position, false);
      }
      this.stats.isStunned = true;
    }

    this.particles.createFloatingText(
      this.group.position,
      `+${Math.round(baseDamage)}%`,
      damageColor
    );
  }

  public respawn(spawnPos: THREE.Vector3) {
    this.stats.damagePercent = 0; // Reset damage % on KO
    this.velocity.set(0, 0, 0);
    this.group.position.copy(spawnPos);
    this.group.position.y += 8;
    this.invulnerableTimer = 2.5; // Brief respawn invincibility
    this.isFrozen = false;
    this.freezeTimer = 0;
    if (this.iceBlockMesh) this.iceBlockMesh.visible = false;
    this.stats.isStunned = false;
    this.stats.stunTimeLeft = 0;
    this.stats.activeItem = null;
    this.batMesh.visible = false;
    this.stats.hasGiantGlove = false;
    this.stats.hasMagnet = false;
  }

  public destroy(scene: THREE.Scene) {
    scene.remove(this.group);
  }
}
