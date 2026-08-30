import * as THREE from 'three';
import { ItemType, SpawnedItem, CrazyButtonEvent } from '../types';
import { BATTLE_ITEMS } from '../data/items';
import { ArenaDef, ARENAS } from '../data/arenas';
import { ParticleSystem3D } from './particles';
import { sound } from './audio';

export class Giant3DButton {
  public group: THREE.Group;
  public capMesh: THREE.Mesh;
  public baseMesh: THREE.Mesh;
  public auraRingMesh: THREE.Mesh;
  public isPressed: boolean = false;
  public pressCooldown: number = 0;
  public activeCrazyEvent: CrazyButtonEvent | null = null;
  private particles: ParticleSystem3D;
  private initialY: number = 0.8;
  private defaultCapColor: string = '#ef4444';
  private defaultBaseColor: string = '#1f2937';
  private animTime: number = 0;

  constructor(scene: THREE.Scene, particles: ParticleSystem3D) {
    this.particles = particles;
    this.group = new THREE.Group();

    // 1. Heavy Metal/Pixel Base Pedestal
    const baseGeo = new THREE.CylinderGeometry(2.4, 2.8, 0.6, 16);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x1f2937 });
    this.baseMesh = new THREE.Mesh(baseGeo, baseMat);
    this.baseMesh.position.y = 0.3;
    this.baseMesh.receiveShadow = true;
    this.group.add(this.baseMesh);

    // Glowing rim
    const rimGeo = new THREE.TorusGeometry(2.35, 0.08, 8, 24);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.58;
    this.group.add(rim);

    // 2. Giant Button Cap
    const capGeo = new THREE.CylinderGeometry(2.0, 2.0, 0.7, 16);
    const capMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });
    this.capMesh = new THREE.Mesh(capGeo, capMat);
    this.capMesh.position.y = this.initialY;
    this.capMesh.castShadow = true;
    this.capMesh.receiveShadow = true;
    this.group.add(this.capMesh);

    // 3. Crazy Button Pulsing Aura Ring
    const auraGeo = new THREE.TorusGeometry(2.6, 0.15, 8, 24);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0,
    });
    this.auraRingMesh = new THREE.Mesh(auraGeo, auraMat);
    this.auraRingMesh.rotation.x = Math.PI / 2;
    this.auraRingMesh.position.y = 0.9;
    this.group.add(this.auraRingMesh);

    this.group.position.set(0, 0, 0);
    scene.add(this.group);
  }

  public applyButtonSkin(capColor: string, baseColor: string) {
    this.defaultCapColor = capColor;
    this.defaultBaseColor = baseColor;
    if (!this.activeCrazyEvent) {
      (this.capMesh.material as THREE.MeshLambertMaterial).color.set(capColor);
      (this.baseMesh.material as THREE.MeshLambertMaterial).color.set(baseColor);
    }
  }

  public setCrazyEvent(event: CrazyButtonEvent | null) {
    this.activeCrazyEvent = event;
    if (event) {
      (this.capMesh.material as THREE.MeshLambertMaterial).color.set(event.capColor);
      (this.auraRingMesh.material as THREE.MeshBasicMaterial).color.set(event.glowColor);
      (this.auraRingMesh.material as THREE.MeshBasicMaterial).opacity = 0.85;
      this.particles.createSparkles(this.group.position, event.glowColor);
      this.particles.createFloatingText(
        new THREE.Vector3(0, 2.2, 0),
        `¡${event.title.toUpperCase()}!`,
        event.glowColor
      );
    } else {
      (this.capMesh.material as THREE.MeshLambertMaterial).color.set(this.defaultCapColor);
      (this.baseMesh.material as THREE.MeshLambertMaterial).color.set(this.defaultBaseColor);
      (this.auraRingMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      this.capMesh.scale.set(1, 1, 1);
    }
  }

  public press(presserPos: THREE.Vector3): { success: boolean; crazyEvent: CrazyButtonEvent | null } {
    if (this.pressCooldown > 0) return { success: false, crazyEvent: null };
    this.isPressed = true;
    this.pressCooldown = 1.8;
    this.capMesh.position.y = this.initialY - 0.45;

    const triggeredCrazyEvent = this.activeCrazyEvent;
    sound.playButtonSlam();

    if (triggeredCrazyEvent) {
      this.particles.createSmashBlast(this.group.position);
      this.particles.createFloatingText(
        new THREE.Vector3(0, 2.0, 0),
        `¡${triggeredCrazyEvent.title.toUpperCase()} ACTIVADO!`,
        triggeredCrazyEvent.glowColor
      );
      this.setCrazyEvent(null);
    } else {
      this.particles.createHitSparks(this.group.position, true);
      this.particles.createCoinBurst(this.group.position, 20);
      this.particles.createFloatingText(this.group.position, '¡BOTÓN SMASH!', '#fbbf24');
    }

    return { success: true, crazyEvent: triggeredCrazyEvent };
  }

  public update(delta: number) {
    this.animTime += delta;
    if (this.pressCooldown > 0) {
      this.pressCooldown = Math.max(0, this.pressCooldown - delta);
      if (this.pressCooldown <= 0) {
        this.isPressed = false;
      }
    }

    const targetY = this.isPressed ? this.initialY - 0.45 : this.initialY;
    this.capMesh.position.y += (targetY - this.capMesh.position.y) * 12 * delta;

    // Crazy event pulsating animation
    if (this.activeCrazyEvent) {
      const pulse = 1.0 + Math.sin(this.animTime * 8) * 0.12;
      this.capMesh.scale.set(pulse, 1.0, pulse);
      this.auraRingMesh.rotation.z += 3 * delta;
      this.auraRingMesh.scale.setScalar(1.0 + Math.sin(this.animTime * 6) * 0.15);
      if (Math.random() < 0.2) {
        this.particles.createSparkles(this.group.position, this.activeCrazyEvent.glowColor);
      }
    }
  }
}

export class World3DArena {
  public group: THREE.Group;
  public spawnPads: THREE.Vector3[] = [];
  public itemSpawners: THREE.Vector3[] = [];
  public spawnedItems: SpawnedItem[] = [];
  public arenaDef: ArenaDef;
  private particles: ParticleSystem3D;
  private starFieldMesh?: THREE.Points;

  constructor(scene: THREE.Scene, particles: ParticleSystem3D, arenaDef: ArenaDef = ARENAS[0]) {
    this.particles = particles;
    this.arenaDef = arenaDef;
    this.group = new THREE.Group();

    this.buildFloatingStage();
    this.buildSubPlatforms();
    this.buildItemSpawnPads();
    this.buildAtmosphere();

    scene.add(this.group);
  }

  // 1. Floating Main Smash Stage with Arena Themes
  private buildFloatingStage() {
    const isVolcano = this.arenaDef.id === 'magma_volcano';
    const isSpace = this.arenaDef.id === 'cyber_space';
    const isVoid = this.arenaDef.id === 'void_citadel';

    // Main Upper Stage Platform
    const stageGeo = new THREE.BoxGeometry(46, 3.0, 32);
    const stageMat = new THREE.MeshLambertMaterial({ color: this.arenaDef.groundColor });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.position.y = -1.5;
    stageMesh.receiveShadow = true;
    this.group.add(stageMesh);

    // Floor Surface
    const topFloorGeo = new THREE.BoxGeometry(45.4, 0.1, 31.4);
    const floorColor = isVolcano ? 0x2d1212 : isSpace ? 0x1e1b4b : isVoid ? 0x2e1065 : 0x3f3f46;
    const topFloorMat = new THREE.MeshLambertMaterial({ color: floorColor });
    const topFloor = new THREE.Mesh(topFloorGeo, topFloorMat);
    topFloor.position.y = 0.05;
    topFloor.receiveShadow = true;
    this.group.add(topFloor);

    // Hazard Striped / Glowing Edge Borders
    const edgeBorderGeoX = new THREE.BoxGeometry(46.2, 0.3, 0.6);
    const edgeBorderGeoZ = new THREE.BoxGeometry(0.6, 0.3, 32.2);
    const edgeMat = new THREE.MeshBasicMaterial({ color: this.arenaDef.rimColor });

    const borderNorth = new THREE.Mesh(edgeBorderGeoX, edgeMat);
    borderNorth.position.set(0, 0.1, -16);
    const borderSouth = new THREE.Mesh(edgeBorderGeoX, edgeMat);
    borderSouth.position.set(0, 0.1, 16);
    const borderWest = new THREE.Mesh(edgeBorderGeoZ, edgeMat);
    borderWest.position.set(-23, 0.1, 0);
    const borderEast = new THREE.Mesh(edgeBorderGeoZ, edgeMat);
    borderEast.position.set(23, 0.1, 0);

    this.group.add(borderNorth, borderSouth, borderWest, borderEast);

    // Underside Platform Base
    const underGeo = new THREE.ConeGeometry(16, 12, 8);
    const underMat = new THREE.MeshLambertMaterial({ color: 0x09090b });
    const underMesh = new THREE.Mesh(underGeo, underMat);
    underMesh.rotation.x = Math.PI;
    underMesh.position.y = -9.0;
    this.group.add(underMesh);

    // Thematic Outer Decorative Elements
    if (isVolcano) {
      // Magma river glowing ring
      const lavaRingGeo = new THREE.TorusGeometry(26, 1.2, 8, 32);
      const lavaRingMat = new THREE.MeshBasicMaterial({ color: 0xff3b00 });
      const lavaRing = new THREE.Mesh(lavaRingGeo, lavaRingMat);
      lavaRing.rotation.x = Math.PI / 2;
      lavaRing.position.y = -1.2;
      this.group.add(lavaRing);
    } else if (isVoid) {
      // Floating Void Crystals
      for (let i = 0; i < 6; i++) {
        const crystalGeo = new THREE.OctahedronGeometry(1.2, 0);
        const crystalMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        const angle = (i / 6) * Math.PI * 2;
        crystal.position.set(Math.cos(angle) * 25, 2 + Math.sin(i) * 2, Math.sin(angle) * 18);
        this.group.add(crystal);
      }
    }
  }

  // 2. Elevated Smash Sub-Platforms (Left, Right, Top)
  private buildSubPlatforms() {
    const platGeo = new THREE.BoxGeometry(8.5, 0.6, 5.0);
    const platMat = new THREE.MeshLambertMaterial({ color: this.arenaDef.groundColor });

    // Left Platform
    const leftPlat = new THREE.Mesh(platGeo, platMat);
    leftPlat.position.set(-13.5, 3.6, 0);
    leftPlat.receiveShadow = true;

    // Right Platform
    const rightPlat = new THREE.Mesh(platGeo, platMat);
    rightPlat.position.set(13.5, 3.6, 0);
    rightPlat.receiveShadow = true;

    // Top Center Platform
    const topPlat = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.6, 5.0), platMat);
    topPlat.position.set(0, 6.4, 0);
    topPlat.receiveShadow = true;

    this.group.add(leftPlat, rightPlat, topPlat);

    // Spawn Positions
    this.spawnPads = [
      new THREE.Vector3(-12, 0.5, 6),
      new THREE.Vector3(12, 0.5, 6),
      new THREE.Vector3(-12, 0.5, -6),
      new THREE.Vector3(12, 0.5, -6),
    ];
  }

  // 3. Item Spawn Pedestals
  private buildItemSpawnPads() {
    this.itemSpawners = [
      new THREE.Vector3(-13.5, 3.9, 0), // Left Platform
      new THREE.Vector3(13.5, 3.9, 0),  // Right Platform
      new THREE.Vector3(0, 6.7, 0),     // Top Platform
      new THREE.Vector3(-10, 0.2, -9),  // NW
      new THREE.Vector3(10, 0.2, 9),    // SE
      new THREE.Vector3(-10, 0.2, 9),   // SW
      new THREE.Vector3(10, 0.2, -9),   // NE
    ];

    this.itemSpawners.forEach((pos) => {
      const padGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.15, 8);
      const padMat = new THREE.MeshBasicMaterial({ color: this.arenaDef.themeColor });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.copy(pos);
      pad.position.y -= 0.05;
      this.group.add(pad);
    });
  }

  // 4. Background Atmosphere & Starfield
  private buildAtmosphere() {
    // Outer Danger Blast Ring
    const ringGeo = new THREE.TorusGeometry(38, 0.25, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.arenaDef.rimColor,
      transparent: true,
      opacity: 0.4,
    });
    const blastRing = new THREE.Mesh(ringGeo, ringMat);
    blastRing.rotation.x = Math.PI / 2;
    blastRing.position.y = -2;
    this.group.add(blastRing);

    // Cosmic Space Stars / Embers
    if (this.arenaDef.id === 'cyber_space' || this.arenaDef.id === 'void_citadel') {
      const starGeo = new THREE.BufferGeometry();
      const starCount = 300;
      const positions = new Float32Array(starCount * 3);

      for (let i = 0; i < starCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 160;
        positions[i + 1] = (Math.random() - 0.5) * 80;
        positions[i + 2] = (Math.random() - 0.5) * 160;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const starMat = new THREE.PointsMaterial({
        color: this.arenaDef.id === 'cyber_space' ? 0x38bdf8 : 0xd946ef,
        size: 0.8,
      });
      this.starFieldMesh = new THREE.Points(starGeo, starMat);
      this.group.add(this.starFieldMesh);
    }
  }

  // Spawn Battle Item
  public spawnItem(scene: THREE.Scene, type?: ItemType): SpawnedItem | null {
    if (this.spawnedItems.length >= 5) return null;

    const availablePads = this.itemSpawners.filter((pad) => {
      return !this.spawnedItems.some(
        (it) => it.position.x === pad.x && it.position.z === pad.z
      );
    });

    if (availablePads.length === 0) return null;
    const chosenPad = availablePads[Math.floor(Math.random() * availablePads.length)];

    const itemDef = type
      ? BATTLE_ITEMS.find((b) => b.type === type) || BATTLE_ITEMS[0]
      : BATTLE_ITEMS[Math.floor(Math.random() * BATTLE_ITEMS.length)];

    let itemGroup: THREE.Group;

    if (itemDef.type === 'heart') {
      itemGroup = this.buildPixelHeart();
    } else if (itemDef.type === 'potion') {
      itemGroup = this.buildPixelPotion();
    } else if (itemDef.type === 'shield') {
      itemGroup = this.buildPixelShield();
    } else if (itemDef.type === 'bat') {
      itemGroup = this.buildPixelBat();
    } else if (itemDef.type === 'bomb') {
      itemGroup = this.buildPixelBomb();
    } else if (itemDef.type === 'crate') {
      itemGroup = this.buildPixelCrate();
    } else {
      itemGroup = this.buildPixelGlove();
    }

    itemGroup.position.copy(chosenPad);
    scene.add(itemGroup);

    const spawned: SpawnedItem = {
      id: `item_${Math.random().toString(36).substring(2, 7)}`,
      type: itemDef.type,
      position: { x: chosenPad.x, y: chosenPad.y, z: chosenPad.z },
      mesh: itemGroup,
      collected: false,
      spawnTime: Date.now(),
    };

    this.spawnedItems.push(spawned);
    this.particles.createSparkles(chosenPad, itemDef.color);
    return spawned;
  }

  public removeItem(scene: THREE.Scene, id: string) {
    const idx = this.spawnedItems.findIndex((it) => it.id === id);
    if (idx >= 0) {
      const item = this.spawnedItems[idx];
      scene.remove(item.mesh);
      this.spawnedItems.splice(idx, 1);
    }
  }

  public update(delta: number) {
    // Rotate background stars if present
    if (this.starFieldMesh) {
      this.starFieldMesh.rotation.y += 0.05 * delta;
    }

    // Float & Rotate Spawned Battle Items
    this.spawnedItems.forEach((item, index) => {
      if (!item.mesh) return;
      item.mesh.rotation.y += 2.0 * delta;
      item.mesh.position.y = item.position.y + Math.sin(Date.now() * 0.004 + index) * 0.15;
    });
  }

  public destroy(scene: THREE.Scene) {
    this.spawnedItems.forEach((item) => {
      scene.remove(item.mesh);
    });
    this.spawnedItems = [];
    scene.remove(this.group);
  }

  // --- 3D PIXEL RETRO ITEM BUILDERS ---

  // 1. Pixel Art Heart (Exact match to reference: 3D sculpted pixel voxel heart with black outline, red core & white/pink highlight)
  private buildPixelHeart(): THREE.Group {
    const group = new THREE.Group();
    const pixelSize = 0.12;
    const depth = 0.28;

    const redMat = new THREE.MeshLambertMaterial({ color: 0xef4444, emissive: 0x500000 });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pinkMat = new THREE.MeshLambertMaterial({ color: 0xfca5a5 });

    // 10x9 Pixel Heart Matrix matching reference image
    const heartMap = [
      '..BB..BB..',
      '.BWWBBBRB.',
      'BWWRRRRRRB',
      'BPRRRRRRRB',
      'BRRRRRRRRB',
      '.BRRRRRRB.',
      '..BRRRRB..',
      '...BRRB...',
      '....BB....',
    ];

    const boxGeo = new THREE.BoxGeometry(pixelSize, pixelSize, depth);

    for (let row = 0; row < heartMap.length; row++) {
      const line = heartMap[row];
      for (let col = 0; col < line.length; col++) {
        const ch = line[col];
        if (ch === '.') continue;

        let mat = redMat;
        if (ch === 'B') mat = darkMat;
        else if (ch === 'W') mat = whiteMat;
        else if (ch === 'P') mat = pinkMat;

        const voxel = new THREE.Mesh(boxGeo, mat);
        voxel.position.set(
          (col - 4.5) * pixelSize,
          (8 - row) * pixelSize + 0.35,
          0
        );
        voxel.castShadow = true;
        group.add(voxel);
      }
    }

    // Glow aura ring
    const ringGeo = new THREE.TorusGeometry(0.65, 0.04, 6, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.8;
    group.add(ring);

    return group;
  }

  // 2. Pixel Magic Potion Flask (Exact match to reference: Glass flask with purple elixir, silver collar, cork stopper & pixel outline)
  private buildPixelPotion(): THREE.Group {
    const group = new THREE.Group();
    const pixelSize = 0.11;
    const depth = 0.28;

    const darkMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
    const corkMat = new THREE.MeshLambertMaterial({ color: 0x92400e });
    const silverMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x818cf8, transparent: true, opacity: 0.85 });
    const purpleMat = new THREE.MeshLambertMaterial({ color: 0xa855f7, emissive: 0x3b0764 });
    const highlightMat = new THREE.MeshBasicMaterial({ color: 0xf0abfc });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // 10x12 Pixel Potion Matrix matching reference image
    const potionMap = [
      '....CC....',
      '....CC....',
      '...BSSB...',
      '...BGGB...',
      '..BBGGBB..',
      '.BGGPPGGB.',
      'BGWPPPPPGB',
      'BGWPHPPPGB',
      'BGPPPHPPGB',
      'BGPPPPPPGB',
      '.BGPPPPGB.',
      '..BBBBBB..',
    ];

    const boxGeo = new THREE.BoxGeometry(pixelSize, pixelSize, depth);

    for (let row = 0; row < potionMap.length; row++) {
      const line = potionMap[row];
      for (let col = 0; col < line.length; col++) {
        const ch = line[col];
        if (ch === '.') continue;

        let mat = purpleMat;
        if (ch === 'B') mat = darkMat;
        else if (ch === 'C') mat = corkMat;
        else if (ch === 'S') mat = silverMat;
        else if (ch === 'G') mat = glassMat;
        else if (ch === 'W') mat = whiteMat;
        else if (ch === 'H') mat = highlightMat;

        const voxel = new THREE.Mesh(boxGeo, mat);
        voxel.position.set(
          (col - 4.5) * pixelSize,
          (11 - row) * pixelSize + 0.25,
          0
        );
        voxel.castShadow = true;
        group.add(voxel);
      }
    }

    // Glowing magic particle ring
    const ringGeo = new THREE.TorusGeometry(0.6, 0.035, 6, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xc026d3, transparent: true, opacity: 0.65 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.8;
    group.add(ring);

    return group;
  }

  // 3. Pixel Energy Shield (Holographic Hex Shield)
  private buildPixelShield(): THREE.Group {
    const group = new THREE.Group();
    const pixelSize = 0.12;
    const depth = 0.26;

    const darkMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    const cyanMat = new THREE.MeshLambertMaterial({ color: 0x06b6d4, emissive: 0x083344 });
    const lightCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const shieldMap = [
      '..BBBBBB..',
      '.BCCCCLLB.',
      'BCLLLLLLCB',
      'BCLLWWLLCB',
      'BCLLWWLLCB',
      'BCCLLLLCCB',
      '.BCCLLCCB.',
      '..BCCCCB..',
      '...BCCB...',
      '....BB....',
    ];

    const boxGeo = new THREE.BoxGeometry(pixelSize, pixelSize, depth);

    for (let row = 0; row < shieldMap.length; row++) {
      const line = shieldMap[row];
      for (let col = 0; col < line.length; col++) {
        const ch = line[col];
        if (ch === '.') continue;

        let mat = cyanMat;
        if (ch === 'B') mat = darkMat;
        else if (ch === 'L') mat = lightCyanMat;
        else if (ch === 'W') mat = whiteMat;

        const voxel = new THREE.Mesh(boxGeo, mat);
        voxel.position.set(
          (col - 4.5) * pixelSize,
          (9 - row) * pixelSize + 0.35,
          0
        );
        voxel.castShadow = true;
        group.add(voxel);
      }
    }

    const ringGeo = new THREE.TorusGeometry(0.68, 0.04, 6, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.85;
    group.add(ring);

    return group;
  }

  // 4. Pixel Golden Smash Bat
  private buildPixelBat(): THREE.Group {
    const group = new THREE.Group();
    const pixelSize = 0.11;
    const depth = 0.28;

    const goldMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b, emissive: 0x451a03 });
    const lightGoldMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    const redWrapMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x18181b });

    const batMap = [
      '.......BB.',
      '......BGLB',
      '.....BGGGB',
      '....BGGGB.',
      '...BGGGB..',
      '..BGGGB...',
      '.BRRGB....',
      '.BRRB.....',
      'BKKKB.....',
      '.BBB......',
    ];

    const boxGeo = new THREE.BoxGeometry(pixelSize, pixelSize, depth);

    for (let row = 0; row < batMap.length; row++) {
      const line = batMap[row];
      for (let col = 0; col < line.length; col++) {
        const ch = line[col];
        if (ch === '.') continue;

        let mat = goldMat;
        if (ch === 'B') mat = darkMat;
        else if (ch === 'L') mat = lightGoldMat;
        else if (ch === 'G') mat = goldMat;
        else if (ch === 'R') mat = redWrapMat;
        else if (ch === 'K') mat = darkMat;

        const voxel = new THREE.Mesh(boxGeo, mat);
        voxel.position.set(
          (col - 4.5) * pixelSize,
          (9 - row) * pixelSize + 0.35,
          0
        );
        voxel.castShadow = true;
        group.add(voxel);
      }
    }

    const ringGeo = new THREE.TorusGeometry(0.65, 0.04, 6, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.65 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.8;
    group.add(ring);

    return group;
  }

  // 5. Pixel Retro Bomb
  private buildPixelBomb(): THREE.Group {
    const group = new THREE.Group();
    const pixelSize = 0.12;
    const depth = 0.28;

    const blackMat = new THREE.MeshLambertMaterial({ color: 0x27272a });
    const darkBorder = new THREE.MeshLambertMaterial({ color: 0x09090b });
    const brassMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const bombMap = [
      '......SS..',
      '.....BB...',
      '....CC....',
      '..BBBBBB..',
      '.BKKKKKKB.',
      'BKKWKKKKKB',
      'BKKWKKKKKB',
      'BKKKKKKKKB',
      '.BKKKKKKB.',
      '..BBBBBB..',
    ];

    const boxGeo = new THREE.BoxGeometry(pixelSize, pixelSize, depth);

    for (let row = 0; row < bombMap.length; row++) {
      const line = bombMap[row];
      for (let col = 0; col < line.length; col++) {
        const ch = line[col];
        if (ch === '.') continue;

        let mat = blackMat;
        if (ch === 'B') mat = darkBorder;
        else if (ch === 'C') mat = brassMat;
        else if (ch === 'S') mat = sparkMat;
        else if (ch === 'W') mat = whiteMat;

        const voxel = new THREE.Mesh(boxGeo, mat);
        voxel.position.set(
          (col - 4.5) * pixelSize,
          (9 - row) * pixelSize + 0.35,
          0
        );
        voxel.castShadow = true;
        group.add(voxel);
      }
    }

    const ringGeo = new THREE.TorusGeometry(0.65, 0.04, 6, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.65 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.8;
    group.add(ring);

    return group;
  }

  // 6. Pixel Titan Power Glove
  private buildPixelGlove(): THREE.Group {
    const group = new THREE.Group();
    const pixelSize = 0.12;
    const depth = 0.28;

    const purpleMat = new THREE.MeshLambertMaterial({ color: 0x8b5cf6, emissive: 0x2e1065 });
    const goldMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
    const cyanMat = new THREE.MeshLambertMaterial({ color: 0x06b6d4 });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x18181b });

    const gloveMap = [
      '..BBBBBB..',
      '.BGGGGGBB.',
      'BGGGGGGGGB',
      'BKKGGGGGGB',
      'BKKGGGGGGB',
      '.BGGGGGGB.',
      '..BCCCCB..',
      '..BCCCCB..',
      '..BBBBBB..',
    ];

    const boxGeo = new THREE.BoxGeometry(pixelSize, pixelSize, depth);

    for (let row = 0; row < gloveMap.length; row++) {
      const line = gloveMap[row];
      for (let col = 0; col < line.length; col++) {
        const ch = line[col];
        if (ch === '.') continue;

        let mat = purpleMat;
        if (ch === 'B') mat = darkMat;
        else if (ch === 'K') mat = goldMat;
        else if (ch === 'C') mat = cyanMat;
        else if (ch === 'G') mat = purpleMat;

        const voxel = new THREE.Mesh(boxGeo, mat);
        voxel.position.set(
          (col - 4.5) * pixelSize,
          (8 - row) * pixelSize + 0.35,
          0
        );
        voxel.castShadow = true;
        group.add(voxel);
      }
    }

    const ringGeo = new THREE.TorusGeometry(0.65, 0.04, 6, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.65 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.8;
    group.add(ring);

    return group;
  }

  // 7. Pixel Surprise Crate
  private buildPixelCrate(): THREE.Group {
    const group = new THREE.Group();

    // Chunky Wood Crate Block
    const crateGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const crateMat = new THREE.MeshLambertMaterial({ color: 0xb45309 });
    const crateMesh = new THREE.Mesh(crateGeo, crateMat);
    crateMesh.position.y = 0.6;
    crateMesh.castShadow = true;
    group.add(crateMesh);

    // Dark Iron Pixel Edges
    const borderMat = new THREE.MeshLambertMaterial({ color: 0x27272a });

    // Corner brackets
    const bracketGeo = new THREE.BoxGeometry(0.35, 0.35, 1.22);
    const b1 = new THREE.Mesh(bracketGeo, borderMat);
    b1.position.set(-0.45, 0.45 + 0.6 - 0.45, 0);
    const b2 = new THREE.Mesh(bracketGeo, borderMat);
    b2.position.set(0.45, 0.45 + 0.6 - 0.45, 0);
    group.add(b1, b2);

    // Glowing Question Mark '?' pixel badge
    const qMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const qGeo = new THREE.BoxGeometry(0.18, 0.18, 1.24);
    const qMesh = new THREE.Mesh(qGeo, qMat);
    qMesh.position.set(0, 0.65, 0);
    group.add(qMesh);

    return group;
  }
}
