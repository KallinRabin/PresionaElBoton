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

    const itemGroup = new THREE.Group();

    if (itemDef.type === 'crate') {
      const crateGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const crateMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
      const crateMesh = new THREE.Mesh(crateGeo, crateMat);
      crateMesh.position.y = 0.6;
      crateMesh.castShadow = true;
      itemGroup.add(crateMesh);
    } else if (itemDef.type === 'bat') {
      const batGeo = new THREE.CylinderGeometry(0.18, 0.08, 1.6, 8);
      const batMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
      const batMesh = new THREE.Mesh(batGeo, batMat);
      batMesh.position.y = 0.8;
      batMesh.rotation.z = Math.PI / 4;
      batMesh.castShadow = true;
      itemGroup.add(batMesh);
    } else if (itemDef.type === 'bomb') {
      const bombGeo = new THREE.SphereGeometry(0.5, 8, 8);
      const bombMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
      const bombMesh = new THREE.Mesh(bombGeo, bombMat);
      bombMesh.position.y = 0.6;
      bombMesh.castShadow = true;
      itemGroup.add(bombMesh);
    } else if (itemDef.type === 'heart') {
      const heartGeo = new THREE.BoxGeometry(0.8, 0.8, 0.4);
      const heartMat = new THREE.MeshLambertMaterial({ color: 0xec4899 });
      const heartMesh = new THREE.Mesh(heartGeo, heartMat);
      heartMesh.position.y = 0.6;
      itemGroup.add(heartMesh);
    } else if (itemDef.type === 'magnet') {
      const magGeo = new THREE.TorusGeometry(0.5, 0.15, 6, 12, Math.PI);
      const magMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
      const magMesh = new THREE.Mesh(magGeo, magMat);
      magMesh.position.y = 0.6;
      itemGroup.add(magMesh);
    } else {
      const gloveGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
      const gloveMat = new THREE.MeshLambertMaterial({ color: 0x8b5cf6 });
      const gloveMesh = new THREE.Mesh(gloveGeo, gloveMat);
      gloveMesh.position.y = 0.6;
      itemGroup.add(gloveMesh);
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
}
