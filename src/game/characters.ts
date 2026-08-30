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
  public overheadMarkerMesh!: THREE.Mesh;
  public groundRingMesh!: THREE.Mesh;
  public groundShadowMesh!: THREE.Mesh;
  public batMesh!: THREE.Mesh;
  private headMesh!: THREE.Mesh;
  private bodyMesh!: THREE.Mesh;
  private leftArmMesh!: THREE.Mesh;
  private rightArmMesh!: THREE.Mesh;
  private leftLegMesh!: THREE.Mesh;
  private rightLegMesh!: THREE.Mesh;
  private hatMesh: THREE.Group | null = null;
  private gloveMesh!: THREE.Group;
  private reflectShieldMesh!: THREE.Mesh;
  private nameplateSprite!: THREE.Sprite;

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

  // UI / HUD Event Notifications
  public onStealEvent?: (isRobber: boolean, amount: number, otherName: string) => void;
  public onShieldBreakEvent?: () => void;
  public onReflectEvent?: (otherName: string, isReflector: boolean) => void;

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
      coins: 0,
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
    const hatType = this.skin.hatType;
    if (this.stats.classId === 'shadow_thief' && (hatType === 'hood' || hatType === 'ninja')) return;
    if (this.stats.classId === 'iron_guardian' && hatType === 'helmet') return;

    this.hatMesh = new THREE.Group();
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

      // 3. Universal Drop Blob Shadow under feet onto ground
      const shadowGeo = new THREE.CircleGeometry(0.55, 16);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      });
      this.groundShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      this.groundShadowMesh.rotation.x = -Math.PI / 2;
      this.groundShadowMesh.position.y = 0.02;
      this.group.add(this.groundShadowMesh);

      // Invisible placeholder
      const dummyGeo = new THREE.BufferGeometry();
      this.overheadMarkerMesh = new THREE.Mesh(dummyGeo);
    }
  }

  private buildMesh() {
    if (this.stats.classId === 'shadow_thief') {
      this.buildShadowThiefMesh();
    } else if (this.stats.classId === 'iron_guardian') {
      this.buildIronGuardianMesh();
    } else if (this.stats.classId === 'gravity_mage') {
      this.buildGravityMageMesh();
    } else if (this.stats.classId === 'trapster') {
      this.buildTrapsterMesh();
    } else {
      this.buildBrawlerMesh();
    }
  }

  // =========================================================================
  // 4. MAGO GRAVITATORIO (GRAVITY MAGE - REFERENCE 4: Cosmic Hood, Singularity Staff, Orbiting Rocks & Beard)
  // =========================================================================
  private buildGravityMageMesh() {
    const cosmicCloak = new THREE.Color(this.skin.bodyColor || '#2e1065'); // Deep midnight violet nebula
    const robeColor = new THREE.Color('#1e1b4b'); // Deep cosmic indigo
    const skinToneColor = new THREE.Color('#e2b997');
    const beardColor = new THREE.Color('#cbd5e1'); // Silver grey beard
    const woodColor = new THREE.Color('#3f1d0b'); // Ancient staff wood
    const vortexColor = new THREE.Color('#7c3aed'); // Glowing cosmic singularity
    const goldColor = new THREE.Color('#fbbf24');
    const potionColor = new THREE.Color('#c084fc');
    const rockColor = new THREE.Color('#64748b');

    const cloakMat = new THREE.MeshLambertMaterial({ color: cosmicCloak });
    const robeMat = new THREE.MeshLambertMaterial({ color: robeColor });
    const skinMat = new THREE.MeshLambertMaterial({ color: skinToneColor });
    const beardMat = new THREE.MeshLambertMaterial({ color: beardColor });
    const woodMat = new THREE.MeshLambertMaterial({ color: woodColor });
    const vortexMat = new THREE.MeshBasicMaterial({ color: vortexColor });
    const blackHoleMat = new THREE.MeshBasicMaterial({ color: 0x05020a });
    const starEyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const goldMat = new THREE.MeshLambertMaterial({ color: goldColor });
    const potionMat = new THREE.MeshLambertMaterial({ color: potionColor });
    const rockMat = new THREE.MeshLambertMaterial({ color: rockColor });
    const leatherMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.8 });

    // --- HEAD: Cosmic Nebula Hood + Beard + Glowing Mystic Eyes ---
    this.headMesh = new THREE.Group();
    this.headMesh.position.y = 1.45;

    const headBase = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.58), skinMat);

    // Hood Covering Head
    const hoodTop = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.22, 0.7), cloakMat);
    hoodTop.position.set(0, 0.24, -0.02);
    const hoodPeak = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.28), cloakMat);
    hoodPeak.position.set(0, 0.35, -0.16);
    const hoodBack = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.55, 0.2), cloakMat);
    hoodBack.position.set(0, 0.02, -0.27);
    const hoodSideL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.62), cloakMat);
    hoodSideL.position.set(-0.3, 0.02, 0.02);
    const hoodSideR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.62), cloakMat);
    hoodSideR.position.set(0.3, 0.02, 0.02);

    // Trimmed Silver-Grey Beard & Mustache
    const beardGeo = new THREE.BoxGeometry(0.52, 0.32, 0.16);
    const beard = new THREE.Mesh(beardGeo, beardMat);
    beard.position.set(0, -0.16, 0.25);
    const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.06), beardMat);
    mustache.position.set(0, -0.06, 0.32);

    // Glowing Starry Cyan Mystic Eyes
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.04), starEyeMat);
    eyeL.position.set(-0.14, 0.06, 0.29);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.04), starEyeMat);
    eyeR.position.set(0.14, 0.06, 0.29);

    this.headMesh.add(headBase, hoodTop, hoodPeak, hoodBack, hoodSideL, hoodSideR, beard, mustache, eyeL, eyeR);

    // --- TORSO: Robe, Cosmic Nebula Mantle, Belt, Potion Vial & Gold Key ---
    this.bodyMesh = new THREE.Group();
    this.bodyMesh.position.y = 0.78;

    const robe = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.52, 0.42), robeMat);
    robe.position.set(0, 0.12, 0);

    // Leather Belt & Metal Buckle
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.44), leatherMat);
    belt.position.set(0, -0.16, 0);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.04), goldMat);
    buckle.position.set(0, -0.16, 0.23);

    // Purple Potion Vial on Hip
    const potGroup = new THREE.Group();
    potGroup.position.set(0.24, -0.24, 0.22);
    const potG = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.1), glassMat);
    const potL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.08), potionMat);
    potGroup.add(potG, potL);

    // Golden Skeleton Key on Hip
    const keyGroup = new THREE.Group();
    keyGroup.position.set(-0.14, -0.25, 0.22);
    const keyS = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.04), goldMat);
    keyGroup.add(keyS);

    // Flowing Cosmic Galaxy Cloak draped over shoulders & back
    const cosmicCloakBack = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.0, 0.14), cloakMat);
    cosmicCloakBack.position.set(0, -0.15, -0.25);
    const cloakShoulderL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.44), cloakMat);
    cloakShoulderL.position.set(-0.38, 0.26, -0.02);
    const cloakShoulderR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.44), cloakMat);
    cloakShoulderR.position.set(0.38, 0.26, -0.02);

    // Tattered wizard robe hem
    const robeHem = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.28, 0.44), robeMat);
    robeHem.position.set(0, -0.34, 0);

    this.bodyMesh.add(robe, belt, buckle, potGroup, keyGroup, cosmicCloakBack, cloakShoulderL, cloakShoulderR, robeHem);

    // --- ARMS: Singularity Staff (Right) & Telekinetic Orbiting Meteorites (Left) ---
    const armGeo = new THREE.BoxGeometry(0.2, 0.36, 0.2);

    // RIGHT ARM + Ancient Singularity Staff
    this.rightArmMesh = new THREE.Group();
    this.rightArmMesh.position.set(0.48, 0.88, 0);
    const rightArm = new THREE.Mesh(armGeo, robeMat);
    rightArm.position.set(0, -0.14, 0);

    const staffGroup = this.createSingularityStaff(woodMat, vortexMat, blackHoleMat, rockMat);
    staffGroup.position.set(0.15, -0.35, 0.2);
    this.rightArmMesh.add(rightArm, staffGroup);

    // LEFT ARM + Telekinetic Floating Orbiting Rocks
    this.leftArmMesh = new THREE.Group();
    this.leftArmMesh.position.set(-0.48, 0.88, 0.05);
    const leftArm = new THREE.Mesh(armGeo, robeMat);
    leftArm.position.set(0, -0.14, 0);
    const handL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.18), skinMat);
    handL.position.set(0, -0.36, 0.08);

    // Levitating Orbiting Meteorite Rocks above hand
    const rock1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08, 0), rockMat);
    rock1.position.set(0.02, 0.16, 0.12);
    const rock2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.06, 0), rockMat);
    rock2.position.set(-0.12, 0.22, 0.06);
    const rock3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.07, 0), rockMat);
    rock3.position.set(0.1, 0.26, -0.04);
    handL.add(rock1, rock2, rock3);

    this.leftArmMesh.add(leftArm, handL);

    // --- LEGS & WIZARD BOOTS ---
    const legGeo = new THREE.BoxGeometry(0.22, 0.26, 0.22);
    const bootGeo = new THREE.BoxGeometry(0.26, 0.32, 0.32);

    this.leftLegMesh = new THREE.Group();
    this.leftLegMesh.position.set(-0.18, 0.44, 0);
    const legL = new THREE.Mesh(legGeo, robeMat);
    legL.position.set(0, -0.1, 0);
    const bootL = new THREE.Mesh(bootGeo, leatherMat);
    bootL.position.set(0, -0.32, 0.03);
    this.leftLegMesh.add(legL, bootL);

    this.rightLegMesh = new THREE.Group();
    this.rightLegMesh.position.set(0.18, 0.44, 0);
    const legR = new THREE.Mesh(legGeo, robeMat);
    legR.position.set(0, -0.1, 0);
    const bootR = new THREE.Mesh(bootGeo, leatherMat);
    bootR.position.set(0, -0.32, 0.03);
    this.rightLegMesh.add(legR, bootR);

    this.group.add(this.headMesh, this.bodyMesh, this.leftArmMesh, this.rightArmMesh, this.leftLegMesh, this.rightLegMesh);
  }

  // =========================================================================
  // 5. ARTIFICIERO TRAMPERO (TRAPSTER - REFERENCE 5: Slicked Grey Hair/Beard, Studded Mantle, Detonator T-Plunger & Mines)
  // =========================================================================
  private buildTrapsterMesh() {
    const trenchColor = new THREE.Color(this.skin.bodyColor || '#1b321c'); // Dark military olive trenchcoat
    const leatherColor = new THREE.Color('#452613'); // Studded leather mantle
    const hairColor = new THREE.Color('#94a3b8'); // Silver-grey slicked hair
    const skinToneColor = new THREE.Color('#e0b188');
    const goldColor = new THREE.Color('#fbbf24');
    const brassColor = new THREE.Color('#d97706');
    const steelColor = new THREE.Color('#475569');

    const trenchMat = new THREE.MeshLambertMaterial({ color: trenchColor });
    const leatherMat = new THREE.MeshLambertMaterial({ color: leatherColor });
    const hairMat = new THREE.MeshLambertMaterial({ color: hairColor });
    const skinMat = new THREE.MeshLambertMaterial({ color: skinToneColor });
    const goldMat = new THREE.MeshLambertMaterial({ color: goldColor });
    const brassMat = new THREE.MeshLambertMaterial({ color: brassColor });
    const steelMat = new THREE.MeshLambertMaterial({ color: steelColor });
    const ledRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const ledGreenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });

    // --- HEAD: Slicked-Back Grey Hair + Defined Grey Beard & Mustache ---
    this.headMesh = new THREE.Group();
    this.headMesh.position.y = 1.46;

    const headBase = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.6), skinMat);

    // Slicked Hair Cap
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.2, 0.68), hairMat);
    hairTop.position.set(0, 0.24, -0.02);
    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.4, 0.16), hairMat);
    hairBack.position.set(0, 0.06, -0.27);
    const hairSidesL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.46), hairMat);
    hairSidesL.position.set(-0.29, 0.1, -0.04);
    const hairSidesR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.46), hairMat);
    hairSidesR.position.set(0.29, 0.1, -0.04);

    // Trimmed Demolitionist Beard & Mustache
    const beard = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.26, 0.16), hairMat);
    beard.position.set(0, -0.16, 0.25);
    const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.08), hairMat);
    mustache.position.set(0, -0.06, 0.32);

    // Eyes
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.04), new THREE.MeshBasicMaterial({ color: 0x18181b }));
    eyeL.position.set(-0.15, 0.04, 0.31);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.04), new THREE.MeshBasicMaterial({ color: 0x18181b }));
    eyeR.position.set(0.15, 0.04, 0.31);

    this.headMesh.add(headBase, hairTop, hairBack, hairSidesL, hairSidesR, beard, mustache, eyeL, eyeR);

    // --- TORSO: Trenchcoat, Studded Leather Mantle, Gold Chain, Detonator & Key ---
    this.bodyMesh = new THREE.Group();
    this.bodyMesh.position.y = 0.78;

    const coat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.52, 0.44), trenchMat);
    coat.position.set(0, 0.14, 0);

    // Studded Brown Leather Shoulder Mantle / Pauldrons with Gold Rivets
    const mantleL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.46), leatherMat);
    mantleL.position.set(-0.42, 0.28, 0);
    const rivet1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.48), goldMat);
    rivet1.position.set(-0.42, 0.3, 0);

    const mantleR = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.46), leatherMat);
    mantleR.position.set(0.42, 0.28, 0);
    const rivet2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.48), goldMat);
    rivet2.position.set(0.42, 0.3, 0);

    // Gold Chain Clasp at collar
    const collarChain = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.06), goldMat);
    collarChain.position.set(0, 0.32, 0.24);

    // Cross-body Ammo Strap
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.54, 0.46), leatherMat);
    strap.rotation.z = -0.38;
    strap.position.set(0, 0.14, 0.01);

    // Heavy Utility Belt
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.46), leatherMat);
    belt.position.set(0, -0.16, 0);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.04), brassMat);
    buckle.position.set(0, -0.16, 0.24);

    // Electronic Clockwork Detonator Device with LED Lights on hip
    const detonatorDevice = new THREE.Group();
    detonatorDevice.position.set(0.24, -0.22, 0.24);
    const deviceBody = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.08), steelMat);
    const ledR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), ledRedMat);
    ledR.position.set(-0.03, 0.04, 0.05);
    const ledG = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), ledGreenMat);
    ledG.position.set(0.03, 0.04, 0.05);
    detonatorDevice.add(deviceBody, ledR, ledG);

    // Dangling Gold Skeleton Key & Ammo Pouch on hip
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.1), leatherMat);
    pouch.position.set(-0.25, -0.22, 0.22);
    const keyS = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.04), goldMat);
    keyS.position.set(-0.12, -0.24, 0.23);

    // Flowing Tattered Demolition Cloak
    const cloak = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.98, 0.14), trenchMat);
    cloak.position.set(0, -0.14, -0.26);

    // Trenchcoat Jagged Lower Hem
    const hem = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.26, 0.46), trenchMat);
    hem.position.set(0, -0.34, 0);

    this.bodyMesh.add(coat, mantleL, rivet1, mantleR, rivet2, collarChain, strap, belt, buckle, detonatorDevice, pouch, keyS, cloak, hem);

    // --- ARMS: Classic T-Bar Dynamite Detonator Box (Left) & Land Mine (Right) ---
    const armGeo = new THREE.BoxGeometry(0.22, 0.36, 0.22);

    // LEFT ARM + Wooden/Brass T-Bar Plunger Detonator Box
    this.leftArmMesh = new THREE.Group();
    this.leftArmMesh.position.set(-0.5, 0.88, 0.05);
    const leftArm = new THREE.Mesh(armGeo, trenchMat);
    leftArm.position.set(0, -0.14, 0);
    const gauntletL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.26), leatherMat);
    gauntletL.position.set(0, -0.3, 0);

    const plungerBox = this.createTBarPlungerMesh(leatherMat, brassMat);
    plungerBox.position.set(-0.02, -0.38, 0.22);
    this.leftArmMesh.add(leftArm, gauntletL, plungerBox);

    // RIGHT ARM + Demolition Mine Throw Arm
    this.rightArmMesh = new THREE.Group();
    this.rightArmMesh.position.set(0.5, 0.88, 0);
    const rightArm = new THREE.Mesh(armGeo, trenchMat);
    rightArm.position.set(0, -0.14, 0);
    const gauntletR = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.26), leatherMat);
    gauntletR.position.set(0, -0.3, 0);

    const mineHand = this.createProximityMineMesh(steelMat, brassMat, ledRedMat, ledGreenMat);
    mineHand.position.set(0.04, -0.42, 0.16);
    this.rightArmMesh.add(rightArm, gauntletR, mineHand);

    // --- LEGS: Dark Combat Pants & Strapped Engineer Boots ---
    const legGeo = new THREE.BoxGeometry(0.22, 0.26, 0.22);
    const bootGeo = new THREE.BoxGeometry(0.26, 0.32, 0.32);

    this.leftLegMesh = new THREE.Group();
    this.leftLegMesh.position.set(-0.18, 0.44, 0);
    const legL = new THREE.Mesh(legGeo, new THREE.MeshLambertMaterial({ color: 0x1e293b }));
    legL.position.set(0, -0.1, 0);
    const bootL = new THREE.Mesh(bootGeo, leatherMat);
    bootL.position.set(0, -0.32, 0.03);
    this.leftLegMesh.add(legL, bootL);

    this.rightLegMesh = new THREE.Group();
    this.rightLegMesh.position.set(0.18, 0.44, 0);
    const legR = new THREE.Mesh(legGeo, new THREE.MeshLambertMaterial({ color: 0x1e293b }));
    legR.position.set(0, -0.1, 0);
    const bootR = new THREE.Mesh(bootGeo, leatherMat);
    bootR.position.set(0, -0.32, 0.03);
    this.rightLegMesh.add(legR, bootR);

    this.group.add(this.headMesh, this.bodyMesh, this.leftArmMesh, this.rightArmMesh, this.leftLegMesh, this.rightLegMesh);
  }

  // Helper to build Gravity Mage Singularity Staff
  private createSingularityStaff(woodMat: THREE.Material, vortexMat: THREE.Material, blackHoleMat: THREE.Material, rockMat: THREE.Material): THREE.Group {
    const group = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.45, 6), woodMat);
    shaft.position.y = 0.2;

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 6, 12), woodMat);
    ring.position.y = 0.95;

    const singularityCore = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), blackHoleMat);
    singularityCore.position.y = 0.95;

    const vortexRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 6, 12), vortexMat);
    vortexRing.position.y = 0.95;
    vortexRing.rotation.x = Math.PI / 4;

    const miniRock1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.04, 0), rockMat);
    miniRock1.position.set(0.24, 1.05, 0.08);
    const miniRock2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.04, 0), rockMat);
    miniRock2.position.set(-0.22, 0.88, -0.06);

    group.add(shaft, ring, singularityCore, vortexRing, miniRock1, miniRock2);
    return group;
  }

  // Helper to build Classic T-Bar Dynamite Detonator Box
  private createTBarPlungerMesh(woodMat: THREE.Material, brassMat: THREE.Material): THREE.Group {
    const group = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.16), woodMat);
    const brassTrim = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.18), brassMat);
    brassTrim.position.y = -0.1;

    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6), brassMat);
    rod.position.y = 0.18;

    const tBar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.06), brassMat);
    tBar.position.y = 0.28;

    group.add(box, brassTrim, rod, tBar);
    return group;
  }

  // Helper to build Proximity Land Mine
  private createProximityMineMesh(steelMat: THREE.Material, brassMat: THREE.Material, ledRMat: THREE.Material, ledGMat: THREE.Material): THREE.Group {
    const group = new THREE.Group();
    const mineBody = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.08, 8), steelMat);
    const centerPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.09, 8), brassMat);

    const led1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), ledRMat);
    led1.position.set(-0.06, 0.05, 0.04);
    const led2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), ledGMat);
    led2.position.set(0.06, 0.05, 0.04);

    group.add(mineBody, centerPlate, led1, led2);
    return group;
  }

  // =========================================================================
  // 1. PÍCARO SOMBRÍO (SHADOW THIEF - REFERENCE 1: Hooded Cloak, Mask, Potions & Daggers)
  // =========================================================================
  private buildShadowThiefMesh() {
    const cloakColor = new THREE.Color(this.skin.bodyColor || '#242e26'); // Dark charcoal / forest green
    const tunicColor = new THREE.Color('#2e3d30');
    const leatherColor = new THREE.Color('#3b2212');
    const maskColor = new THREE.Color('#6b655b'); // Cloth face mask
    const steelColor = new THREE.Color('#cbd5e1');
    const goldColor = new THREE.Color('#fbbf24');
    const potionColor = new THREE.Color('#c084fc'); // Purple elixir

    const cloakMat = new THREE.MeshLambertMaterial({ color: cloakColor });
    const tunicMat = new THREE.MeshLambertMaterial({ color: tunicColor });
    const leatherMat = new THREE.MeshLambertMaterial({ color: leatherColor });
    const maskMat = new THREE.MeshLambertMaterial({ color: maskColor });
    const steelMat = new THREE.MeshLambertMaterial({ color: steelColor });
    const goldMat = new THREE.MeshLambertMaterial({ color: goldColor });
    const shadowFaceMat = new THREE.MeshBasicMaterial({ color: 0x090c0a });
    const eyeGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const potionMat = new THREE.MeshLambertMaterial({ color: potionColor });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.8 });

    // --- HEAD: Hooded Cowl + Shadow Face + Face Mask ---
    this.headMesh = new THREE.Group();
    this.headMesh.position.y = 1.45;

    // Shadow Face Base
    const faceBase = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.58, 0.58), shadowFaceMat);
    this.headMesh.add(faceBase);

    // Hood Top Peak & Sides
    const hoodTop = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.2, 0.72), cloakMat);
    hoodTop.position.set(0, 0.25, -0.02);
    const hoodPeak = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.28), cloakMat);
    hoodPeak.position.set(0, 0.36, -0.16);
    const hoodBack = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.55, 0.2), cloakMat);
    hoodBack.position.set(0, 0.02, -0.27);
    const hoodSideL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.65), cloakMat);
    hoodSideL.position.set(-0.3, 0.02, 0.02);
    const hoodSideR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.65), cloakMat);
    hoodSideR.position.set(0.3, 0.02, 0.02);
    const hoodBrow = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.1, 0.24), cloakMat);
    hoodBrow.position.set(0, 0.24, 0.26);

    // Lower Cloth Face Mask
    const faceMask = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.24, 0.14), maskMat);
    faceMask.position.set(0, -0.12, 0.26);

    // Glowing Eyes under the hood shadow
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.04), eyeGlowMat);
    eyeL.position.set(-0.14, 0.06, 0.28);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.04), eyeGlowMat);
    eyeR.position.set(0.14, 0.06, 0.28);

    this.headMesh.add(hoodTop, hoodPeak, hoodBack, hoodSideL, hoodSideR, hoodBrow, faceMask, eyeL, eyeR);

    // --- TORSO: Dark Tunic, Ragged Hooded Cloak, Belt with Potion & Key ---
    this.bodyMesh = new THREE.Group();
    this.bodyMesh.position.y = 0.78;

    // Tunic Torso
    const tunic = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.5, 0.4), tunicMat);
    tunic.position.set(0, 0.12, 0);

    // Leather Chest Bandolier Cross-Strap
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.52, 0.44), leatherMat);
    strap.rotation.z = -0.4;
    strap.position.set(0, 0.12, 0.01);

    // Leather Belt & Buckle
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.1, 0.42), leatherMat);
    belt.position.set(0, -0.15, 0);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.04), steelMat);
    buckle.position.set(0, -0.15, 0.22);

    // Potion Bottle Vial (Purple Elixir) on belt
    const potionGroup = new THREE.Group();
    potionGroup.position.set(-0.24, -0.22, 0.2);
    const potGlass = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.1), glassMat);
    const potLiquid = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.08), potionMat);
    potLiquid.position.y = -0.02;
    const potCork = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.06), leatherMat);
    potCork.position.y = 0.09;
    potionGroup.add(potGlass, potLiquid, potCork);

    // Golden Skeleton Key on belt
    const keyGroup = new THREE.Group();
    keyGroup.position.set(0.14, -0.24, 0.2);
    const keyRing = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.03), goldMat);
    const keyShaft = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.03), goldMat);
    keyShaft.position.y = -0.09;
    const keyTeeth = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.03), goldMat);
    keyTeeth.position.set(0.03, -0.12, 0);
    keyGroup.add(keyRing, keyShaft, keyTeeth);

    // Flowing Jagged Cape over Back & Shoulders
    const capeBack = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.95, 0.14), cloakMat);
    capeBack.position.set(0, -0.15, -0.24);
    const capeShoulderL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.44), cloakMat);
    capeShoulderL.position.set(-0.38, 0.28, -0.02);
    const capeShoulderR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.44), cloakMat);
    capeShoulderR.position.set(0.38, 0.28, -0.02);

    // Ragged Tunic Hem Cuts
    const tunicHem = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.26, 0.42), tunicMat);
    tunicHem.position.set(0, -0.32, 0);

    this.bodyMesh.add(tunic, strap, belt, buckle, potionGroup, keyGroup, capeBack, capeShoulderL, capeShoulderR, tunicHem);

    // --- ARMS: Leather Bracers & Dual Rogue Daggers ---
    const armGeo = new THREE.BoxGeometry(0.2, 0.36, 0.2);

    // Left Arm + Dagger 1
    this.leftArmMesh = new THREE.Group();
    this.leftArmMesh.position.set(-0.48, 0.88, 0.05);
    const leftArm = new THREE.Mesh(armGeo, tunicMat);
    leftArm.position.set(0, -0.14, 0);
    const bracerL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.24), leatherMat);
    bracerL.position.set(0, -0.32, 0);

    // Rogue Dagger Left
    const daggerL = this.createDaggerMesh(steelMat, leatherMat);
    daggerL.position.set(0, -0.42, 0.14);
    daggerL.rotation.x = 0.3;
    this.leftArmMesh.add(leftArm, bracerL, daggerL);

    // Right Arm + Offense Blade
    this.rightArmMesh = new THREE.Group();
    this.rightArmMesh.position.set(0.48, 0.88, 0);
    const rightArm = new THREE.Mesh(armGeo, tunicMat);
    rightArm.position.set(0, -0.14, 0);
    const bracerR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.24), leatherMat);
    bracerR.position.set(0, -0.32, 0);
    this.rightArmMesh.add(rightArm, bracerR);

    // --- LEGS: Dark Pants & Cuffed Leather Rogue Boots ---
    const legGeo = new THREE.BoxGeometry(0.22, 0.26, 0.22);
    const bootGeo = new THREE.BoxGeometry(0.26, 0.32, 0.32);
    const bootCuffGeo = new THREE.BoxGeometry(0.29, 0.1, 0.3);

    this.leftLegMesh = new THREE.Group();
    this.leftLegMesh.position.set(-0.18, 0.44, 0);
    const legL = new THREE.Mesh(legGeo, tunicMat);
    legL.position.set(0, -0.1, 0);
    const bootL = new THREE.Mesh(bootGeo, leatherMat);
    bootL.position.set(0, -0.32, 0.03);
    const cuffL = new THREE.Mesh(bootCuffGeo, leatherMat);
    cuffL.position.set(0, -0.18, 0.02);
    this.leftLegMesh.add(legL, bootL, cuffL);

    this.rightLegMesh = new THREE.Group();
    this.rightLegMesh.position.set(0.18, 0.44, 0);
    const legR = new THREE.Mesh(legGeo, tunicMat);
    legR.position.set(0, -0.1, 0);
    const bootR = new THREE.Mesh(bootGeo, leatherMat);
    bootR.position.set(0, -0.32, 0.03);
    const cuffR = new THREE.Mesh(bootCuffGeo, leatherMat);
    cuffR.position.set(0, -0.18, 0.02);
    this.rightLegMesh.add(legR, bootR, cuffR);

    this.group.add(this.headMesh, this.bodyMesh, this.leftArmMesh, this.rightArmMesh, this.leftLegMesh, this.rightLegMesh);
  }

  // =========================================================================
  // 2. GUARDIÁN DE HIERRO (IRON GUARDIAN - REFERENCE 2: Full Steel Armor, Helm, Crest, Tower Shield & War Mace)
  // =========================================================================
  private buildIronGuardianMesh() {
    const armorColor = new THREE.Color(this.skin.bodyColor || '#475569'); // Slate Steel Plate
    const darkArmorColor = new THREE.Color('#334155');
    const clothColor = new THREE.Color('#1e293b'); // Navy Blue Cloak / Scarf
    const crestCyan = new THREE.Color('#38bdf8'); // Glowing Cyan Shield Crest
    const goldColor = new THREE.Color('#fbbf24');
    const leatherColor = new THREE.Color('#3f2817');
    const potionColor = new THREE.Color('#c084fc');

    const plateMat = new THREE.MeshLambertMaterial({ color: armorColor });
    const darkPlateMat = new THREE.MeshLambertMaterial({ color: darkArmorColor });
    const clothMat = new THREE.MeshLambertMaterial({ color: clothColor });
    const cyanMat = new THREE.MeshBasicMaterial({ color: crestCyan });
    const goldMat = new THREE.MeshLambertMaterial({ color: goldColor });
    const leatherMat = new THREE.MeshLambertMaterial({ color: leatherColor });
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
    const potionMat = new THREE.MeshLambertMaterial({ color: potionColor });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.8 });

    // --- HEAD: Closed Iron Great Helm + Visor + Navy Blue Scarf ---
    this.headMesh = new THREE.Group();
    this.headMesh.position.y = 1.48;

    // Helm Dome & Sides
    const helm = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.66, 0.66), plateMat);
    const helmRidge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.72, 0.7), darkPlateMat);
    helmRidge.position.set(0, 0.04, 0);

    // Visor Slit (Dark eye recess)
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.06), visorMat);
    visor.position.set(0, 0.04, 0.32);

    // Navy Blue Cloth Scarf Wrap under helmet
    const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 0.72), clothMat);
    scarf.position.set(0, -0.28, 0);

    this.headMesh.add(helm, helmRidge, visor, scarf);

    // --- TORSO: Steel Breastplate with Cyan Shield Crest, Pauldrons, Belt & Cloak ---
    this.bodyMesh = new THREE.Group();
    this.bodyMesh.position.y = 0.8;

    // Heavy Cuirass (Breastplate)
    const breastplate = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.52, 0.46), plateMat);
    breastplate.position.set(0, 0.14, 0);

    // Glowing Cyan Shield Crest on Chest
    const crestGroup = new THREE.Group();
    crestGroup.position.set(0, 0.18, 0.24);
    const crestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.04), darkPlateMat);
    const crestEmblem = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.05), cyanMat);
    crestGroup.add(crestPlate, crestEmblem);

    // Rounded Riveted Shoulder Pauldrons
    const pauldronL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 0.48), plateMat);
    pauldronL.position.set(-0.46, 0.32, 0);
    const rivetL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.5), goldMat);
    rivetL.position.set(-0.46, 0.34, 0);

    const pauldronR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 0.48), plateMat);
    pauldronR.position.set(0.46, 0.32, 0);
    const rivetR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.5), goldMat);
    rivetR.position.set(0.46, 0.34, 0);

    // Steel Plated Belt with Buckle
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.12, 0.48), darkPlateMat);
    belt.position.set(0, -0.16, 0);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.06), goldMat);
    buckle.position.set(0, -0.16, 0.25);

    // Potion Vial & Gold Key on belt
    const potGroup = new THREE.Group();
    potGroup.position.set(-0.26, -0.24, 0.24);
    const potG = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.1), glassMat);
    const potL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.08), potionMat);
    potGroup.add(potG, potL);

    const keyG = new THREE.Group();
    keyG.position.set(0.24, -0.24, 0.24);
    const keyS = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.04), goldMat);
    keyG.add(keyS);

    // Tattered Battle Cloak draping behind armor
    const cloak = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.05, 0.14), clothMat);
    cloak.position.set(0, -0.18, -0.28);

    // Armored Tassets / Faulds
    const tassets = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.24, 0.46), plateMat);
    tassets.position.set(0, -0.32, 0);

    this.bodyMesh.add(breastplate, crestGroup, pauldronL, rivetL, pauldronR, rivetR, belt, buckle, potGroup, keyG, cloak, tassets);

    // --- ARMS: Steel Tower / Kite Shield (Left) & Spiked War Mace (Right) ---
    const armGeo = new THREE.BoxGeometry(0.22, 0.38, 0.22);

    // Left Arm + Steel Kite Shield with Cyan Emblem
    this.leftArmMesh = new THREE.Group();
    this.leftArmMesh.position.set(-0.52, 0.9, 0);
    const leftArm = new THREE.Mesh(armGeo, plateMat);
    leftArm.position.set(0, -0.14, 0);

    // Kite Shield
    const shieldGroup = this.createKiteShieldMesh(plateMat, darkPlateMat, cyanMat);
    shieldGroup.position.set(-0.16, -0.26, 0.25);
    shieldGroup.rotation.y = 0.3;
    this.leftArmMesh.add(leftArm, shieldGroup);

    // Right Arm (Weapon / Mace Arm)
    this.rightArmMesh = new THREE.Group();
    this.rightArmMesh.position.set(0.52, 0.9, 0);
    const rightArm = new THREE.Mesh(armGeo, plateMat);
    rightArm.position.set(0, -0.14, 0);

    // Spiked War Mace
    const maceGroup = this.createWarMaceMesh(darkPlateMat, plateMat);
    maceGroup.position.set(0.05, -0.35, 0.2);
    maceGroup.rotation.x = Math.PI / 4;
    this.rightArmMesh.add(rightArm, maceGroup);

    // --- LEGS: Plate Greaves & Armored Steel Sabatons ---
    const legGeo = new THREE.BoxGeometry(0.24, 0.28, 0.24);
    const bootGeo = new THREE.BoxGeometry(0.26, 0.34, 0.36);

    this.leftLegMesh = new THREE.Group();
    this.leftLegMesh.position.set(-0.2, 0.44, 0);
    const legL = new THREE.Mesh(legGeo, plateMat);
    legL.position.set(0, -0.1, 0);
    const bootL = new THREE.Mesh(bootGeo, darkPlateMat);
    bootL.position.set(0, -0.32, 0.04);
    this.leftLegMesh.add(legL, bootL);

    this.rightLegMesh = new THREE.Group();
    this.rightLegMesh.position.set(0.2, 0.44, 0);
    const legR = new THREE.Mesh(legGeo, plateMat);
    legR.position.set(0, -0.1, 0);
    const bootR = new THREE.Mesh(bootGeo, darkPlateMat);
    bootR.position.set(0, -0.32, 0.04);
    this.rightLegMesh.add(legR, bootR);

    this.group.add(this.headMesh, this.bodyMesh, this.leftArmMesh, this.rightArmMesh, this.leftLegMesh, this.rightLegMesh);
  }

  // =========================================================================
  // 3. BOXEADOR TITÁN (BRAWLER - REFERENCE 3: Proportioned Boxer with Hair, Shorts & Dual Gloves)
  // =========================================================================
  private buildBrawlerMesh() {
    const fighterColor = new THREE.Color(this.stats.color);
    const skinToneColor = new THREE.Color('#e8b188');
    const hairColor = new THREE.Color(this.skin.headColor || '#452613');
    const shortsColor = new THREE.Color(this.skin.bodyColor || this.stats.color);
    const whiteColor = new THREE.Color('#ffffff');
    const bootsColor = new THREE.Color('#18181b');

    const skinMat = new THREE.MeshLambertMaterial({ color: skinToneColor });
    const hairMat = new THREE.MeshLambertMaterial({ color: hairColor });
    const shortsMat = new THREE.MeshLambertMaterial({ color: shortsColor });
    const whiteMat = new THREE.MeshLambertMaterial({ color: whiteColor });
    const bootsMat = new THREE.MeshLambertMaterial({ color: bootsColor });
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Head
    const headGeo = new THREE.BoxGeometry(0.64, 0.64, 0.62);
    this.headMesh = new THREE.Mesh(headGeo, skinMat);
    this.headMesh.position.y = 1.46;
    this.headMesh.castShadow = true;

    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.22, 0.66), hairMat);
    hairTop.position.set(0, 0.24, -0.01);
    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.38, 0.16), hairMat);
    hairBack.position.set(0, 0.08, -0.26);
    const hairSideL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.44), hairMat);
    hairSideL.position.set(-0.3, 0.1, -0.05);
    const hairSideR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.44), hairMat);
    hairSideR.position.set(0.3, 0.1, -0.05);
    const hairFringe = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.12), hairMat);
    hairFringe.position.set(0, 0.24, 0.28);
    this.headMesh.add(hairTop, hairBack, hairSideL, hairSideR, hairFringe);

    // Face
    const eyeWL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.04), eyeWhiteMat);
    eyeWL.position.set(-0.16, 0.02, 0.32);
    const eyePL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), eyePupilMat);
    eyePL.position.set(-0.15, 0.02, 0.33);

    const eyeWR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.04), eyeWhiteMat);
    eyeWR.position.set(0.16, 0.02, 0.32);
    const eyePR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), eyePupilMat);
    eyePR.position.set(0.15, 0.02, 0.33);

    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), skinMat);
    nose.position.set(0, -0.06, 0.34);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: 0x854d0e }));
    mouth.position.set(0, -0.18, 0.32);
    const earL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.12), skinMat);
    earL.position.set(-0.34, 0, 0.02);
    const earR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.12), skinMat);
    earR.position.set(0.34, 0, 0.02);
    this.headMesh.add(eyeWL, eyePL, eyeWR, eyePR, nose, mouth, earL, earR);

    // Torso
    this.bodyMesh = new THREE.Group();
    this.bodyMesh.position.y = 0.78;
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.44, 0.4), skinMat);
    chest.position.set(0, 0.16, 0);
    const peckL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.05), skinMat);
    peckL.position.set(-0.16, 0.2, 0.2);
    const peckR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.05), skinMat);
    peckR.position.set(0.16, 0.2, 0.2);
    const abs = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.04), new THREE.MeshLambertMaterial({ color: new THREE.Color('#d4976c') }));
    abs.position.set(0, -0.04, 0.19);
    const waistband = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.42), whiteMat);
    waistband.position.set(0, -0.16, 0);

    const shortsPelvis = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.22, 0.4), shortsMat);
    shortsPelvis.position.set(0, -0.3, 0);
    const shortLegL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.38), shortsMat);
    shortLegL.position.set(-0.18, -0.44, 0);
    const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.39), whiteMat);
    stripeL.position.set(-0.14, 0, 0);
    shortLegL.add(stripeL);

    const shortLegR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.38), shortsMat);
    shortLegR.position.set(0.18, -0.44, 0);
    const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.39), whiteMat);
    stripeR.position.set(0.14, 0, 0);
    shortLegR.add(stripeR);

    this.bodyMesh.add(chest, peckL, peckR, abs, waistband, shortsPelvis, shortLegL, shortLegR);

    // Arms
    const armUpperGeo = new THREE.BoxGeometry(0.22, 0.38, 0.22);
    const armForeGeo = new THREE.BoxGeometry(0.2, 0.32, 0.2);

    this.leftArmMesh = new THREE.Group();
    this.leftArmMesh.position.set(-0.48, 0.88, 0.05);
    const leftUpper = new THREE.Mesh(armUpperGeo, skinMat);
    leftUpper.position.set(0, -0.14, 0);
    const leftFore = new THREE.Mesh(armForeGeo, skinMat);
    leftFore.position.set(0.04, -0.36, 0.12);
    leftFore.rotation.x = -0.45;
    const leftGloveGroup = this.createGloveMesh(fighterColor, false);
    leftGloveGroup.position.set(0.05, -0.22, 0.15);
    leftFore.add(leftGloveGroup);
    this.leftArmMesh.add(leftUpper, leftFore);

    this.rightArmMesh = new THREE.Group();
    this.rightArmMesh.position.set(0.48, 0.88, 0);
    const rightUpper = new THREE.Mesh(armUpperGeo, skinMat);
    rightUpper.position.set(0, -0.14, 0);
    const rightFore = new THREE.Mesh(armForeGeo, skinMat);
    rightFore.position.set(-0.02, -0.36, 0.08);
    this.rightArmMesh.add(rightUpper, rightFore);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.22, 0.28, 0.22);
    const bootGeo = new THREE.BoxGeometry(0.24, 0.24, 0.32);
    const soleGeo = new THREE.BoxGeometry(0.25, 0.06, 0.34);
    const laceGeo = new THREE.BoxGeometry(0.25, 0.06, 0.24);

    this.leftLegMesh = new THREE.Group();
    this.leftLegMesh.position.set(-0.18, 0.44, 0);
    const thighL = new THREE.Mesh(legGeo, skinMat);
    thighL.position.set(0, -0.1, 0);
    const bootL = new THREE.Mesh(bootGeo, bootsMat);
    bootL.position.set(0, -0.32, 0.03);
    const soleL = new THREE.Mesh(soleGeo, whiteMat);
    soleL.position.set(0, -0.12, 0.01);
    const laceL = new THREE.Mesh(laceGeo, whiteMat);
    laceL.position.set(0, 0.08, 0.01);
    bootL.add(soleL, laceL);
    this.leftLegMesh.add(thighL, bootL);

    this.rightLegMesh = new THREE.Group();
    this.rightLegMesh.position.set(0.18, 0.44, 0);
    const thighR = new THREE.Mesh(legGeo, skinMat);
    thighR.position.set(0, -0.1, 0);
    const bootR = new THREE.Mesh(bootGeo, bootsMat);
    bootR.position.set(0, -0.32, 0.03);
    const soleR = new THREE.Mesh(soleGeo, whiteMat);
    soleR.position.set(0, -0.12, 0.01);
    const laceR = new THREE.Mesh(laceGeo, whiteMat);
    laceR.position.set(0, 0.08, 0.01);
    bootR.add(soleR, laceR);
    this.rightLegMesh.add(thighR, bootR);

    this.group.add(this.headMesh, this.bodyMesh, this.leftArmMesh, this.rightArmMesh, this.leftLegMesh, this.rightLegMesh);
  }

  // Helper to build Rogue Dagger
  private createDaggerMesh(steelMat: THREE.Material, leatherMat: THREE.Material): THREE.Group {
    const group = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.48, 0.08), steelMat);
    blade.position.y = -0.2;
    const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.1), leatherMat);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.06), leatherMat);
    grip.position.y = 0.1;
    const pommel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.08), steelMat);
    pommel.position.y = 0.18;
    group.add(blade, hilt, grip, pommel);
    return group;
  }

  // Helper to build Knight Kite Shield
  private createKiteShieldMesh(plateMat: THREE.Material, darkPlateMat: THREE.Material, cyanMat: THREE.Material): THREE.Group {
    const group = new THREE.Group();
    const shieldBody = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 0.55), plateMat);
    const shieldRim = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.88, 0.58), darkPlateMat);
    const shieldCrest = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.28), cyanMat);
    shieldCrest.position.set(-0.01, 0.05, 0);
    group.add(shieldRim, shieldBody, shieldCrest);
    return group;
  }

  // Helper to build Heavy Spiked War Mace
  private createWarMaceMesh(shaftMat: THREE.Material, headMat: THREE.Material): THREE.Group {
    const group = new THREE.Group();
    const haft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.85, 6), shaftMat);
    haft.position.y = 0.1;
    const maceHead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), headMat);
    maceHead.position.y = 0.48;
    const spike1 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.08), headMat);
    spike1.position.y = 0.48;
    const spike2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.36), headMat);
    spike2.position.y = 0.48;
    group.add(haft, maceHead, spike1, spike2);
    return group;
  }

  // Helper to build a curved, authentic pixel boxing glove with wrist strap
  private createGloveMesh(gloveColor: THREE.Color, withEmblem: boolean = true): THREE.Group {
    const group = new THREE.Group();
    const gloveMat = new THREE.MeshLambertMaterial({ color: gloveColor });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

    const capGeo = new THREE.BoxGeometry(0.42, 0.42, 0.48);
    const cap = new THREE.Mesh(capGeo, gloveMat);
    cap.position.set(0, 0, 0.08);
    cap.castShadow = true;

    const thumbGeo = new THREE.BoxGeometry(0.16, 0.22, 0.22);
    const thumb = new THREE.Mesh(thumbGeo, gloveMat);
    thumb.position.set(0.18, -0.05, 0.06);

    const strapGeo = new THREE.BoxGeometry(0.44, 0.1, 0.44);
    const strap = new THREE.Mesh(strapGeo, whiteMat);
    strap.position.set(0, 0.2, 0);

    group.add(cap, thumb, strap);

    if (withEmblem) {
      const emblemGeo = new THREE.BoxGeometry(0.18, 0.18, 0.06);
      const emblemMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
      const emblem = new THREE.Mesh(emblemGeo, emblemMat);
      emblem.position.set(0, 0, 0.25);
      cap.add(emblem);
    }

    return group;
  }

  // Build the 3D Pixel Steal Glove attached to right fist
  private buildGlove() {
    this.gloveMesh = this.createGloveMesh(new THREE.Color(this.stats.color), true);
    this.gloveMesh.position.set(0, -0.55, 0.12);
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
        this.rightArmMesh.position.set(0.48, 0.88, 0);
        this.rightArmMesh.rotation.set(0, 0, 0);
      } else {
        // Forward extension & recovery arc
        const progress = this.punchAnimProgress;
        const forwardReach = Math.sin(progress * Math.PI) * (this.punchType === 'titan' ? 1.3 : 0.85);
        this.rightArmMesh.position.z = forwardReach;
        this.rightArmMesh.position.y = 0.88 + Math.sin(progress * Math.PI) * 0.25;
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
    if (this.groundShadowMesh) {
      const height = Math.max(0, this.group.position.y);
      const scale = Math.max(0.3, 1.0 - height * 0.07);
      this.groundShadowMesh.scale.set(scale, scale, scale);
      (this.groundShadowMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0.08, 0.38 - height * 0.025);
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

    // Check Energy Shield (Power-up Item: 1-Hit Absorption Shield)
    if (this.stats.activeItem === 'shield' || this.stats.hasInvincibleShield) {
      this.stats.activeItem = null;
      this.stats.hasInvincibleShield = false;
      this.stats.itemTimeLeft = 0;
      this.invulnerableTimer = 0.35; // Brief i-frames
      this.particles.createHitSparks(this.group.position, true);
      this.particles.createSparkles(this.group.position, '#06b6d4');
      if (this.onShieldBreakEvent) this.onShieldBreakEvent();
      sound.playSmashPunch(false);
      return;
    }

    // Check Reflect Shield (Iron Guardian - Auto-Reflect rival abilities & attacks back to caster)
    if (this.stats.hasReflectShield) {
      this.particles.createHitSparks(this.group.position, true);
      this.particles.createSparkles(this.group.position, '#38bdf8');
      sound.playParryClang();

      // Reverse ice freeze state if attacker struck with ice punch
      if (attacker.hasIceCharge) {
        attacker.applyFreeze(1.2);
        attacker.hasIceCharge = false;
        attacker.stats.hasIceCharged = false;
      }

      if (this.onReflectEvent) {
        this.onReflectEvent(attacker.stats.name, true);
      }
      if (attacker.onReflectEvent) {
        attacker.onReflectEvent(this.stats.name, false);
      }

      // Reflect full damage & amplified knockback back onto attacker
      attacker.receiveHit(this, baseDamage * 1.0, baseKnockback * 1.6, true);
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

      if (attacker.onStealEvent) {
        attacker.onStealEvent(true, coinsToSteal, this.stats.name);
      }
      if (this.onStealEvent) {
        this.onStealEvent(false, coinsToSteal, attacker.stats.name);
      }
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
