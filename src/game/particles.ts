import * as THREE from 'three';

export interface PixelParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  rotSpeed: THREE.Vector3;
  gravity: number;
  scaleDecay: boolean;
}

export interface FloatingText3D {
  mesh: THREE.Sprite;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class ParticleSystem3D {
  private scene: THREE.Scene;
  private particles: PixelParticle[] = [];
  private floatingTexts: FloatingText3D[] = [];
  public enabled: boolean = true;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  // Smash Hit Impact Sparks (Yellow/Red/Cyan chunky pixel cubes)
  public createHitSparks(position: THREE.Vector3, isCritical: boolean = false) {
    if (!this.enabled) return;
    const count = isCritical ? 24 : 12;
    const colors = isCritical ? ['#ef4444', '#f59e0b', '#fbbf24', '#ffffff'] : ['#fbbf24', '#f97316', '#ffffff'];

    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
      const chosenColor = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
      const mat = new THREE.MeshBasicMaterial({ color: chosenColor });
      const mesh = new THREE.Mesh(geo, mat);

      mesh.position.copy(position);
      mesh.position.y += 0.6;

      const speed = isCritical ? 10 + Math.random() * 12 : 5 + Math.random() * 7;
      const angle = Math.random() * Math.PI * 2;
      const elev = (Math.random() - 0.2) * Math.PI * 0.8;

      const velocity = new THREE.Vector3(
        Math.cos(angle) * Math.cos(elev) * speed,
        Math.sin(elev) * speed + 3,
        Math.sin(angle) * Math.cos(elev) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0.45,
        maxLife: 0.45,
        rotSpeed: new THREE.Vector3(Math.random() * 15, Math.random() * 15, Math.random() * 15),
        gravity: 18,
        scaleDecay: true,
      });
    }
  }

  // Steal Coin Burst (Golden pixel coins exploding outward)
  public createCoinBurst(position: THREE.Vector3, count: number = 10) {
    if (!this.enabled) return;
    const goldColor = new THREE.Color('#f59e0b');
    const yellowColor = new THREE.Color('#fef08a');

    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(0.35, 0.35, 0.1);
      const mat = new THREE.MeshLambertMaterial({
        color: Math.random() > 0.3 ? goldColor : yellowColor,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      mesh.position.y += 0.8;
      mesh.position.x += (Math.random() - 0.5) * 0.5;
      mesh.position.z += (Math.random() - 0.5) * 0.5;

      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 7;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        7 + Math.random() * 8,
        Math.sin(angle) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 1.0,
        maxLife: 1.0,
        rotSpeed: new THREE.Vector3(Math.random() * 20, Math.random() * 20, Math.random() * 20),
        gravity: 24,
        scaleDecay: false,
      });
    }
  }

  // KO Smash Blast (Huge ring explosion when player is launched out)
  public createSmashBlast(position: THREE.Vector3) {
    if (!this.enabled) return;
    const count = 40;
    const colors = ['#ef4444', '#f97316', '#eab308', '#ffffff', '#dc2626'];

    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors[Math.floor(Math.random() * colors.length)]),
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);

      const angle = Math.random() * Math.PI * 2;
      const speed = 12 + Math.random() * 16;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        (Math.random() - 0.5) * speed * 0.8,
        Math.sin(angle) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0.8,
        maxLife: 0.8,
        rotSpeed: new THREE.Vector3(Math.random() * 15, Math.random() * 15, Math.random() * 15),
        gravity: 8,
        scaleDecay: true,
      });
    }
  }

  // Ability Particle: Gravity Shockwave
  public createGravityPulse(position: THREE.Vector3) {
    if (!this.enabled) return;
    const count = 30;
    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#10b981') });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      mesh.position.y += 0.5;

      const angle = (i / count) * Math.PI * 2;
      const speed = 14;
      const velocity = new THREE.Vector3(Math.cos(angle) * speed, 0.5, Math.sin(angle) * speed);

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0.5,
        maxLife: 0.5,
        rotSpeed: new THREE.Vector3(0, 5, 0),
        gravity: 0,
        scaleDecay: true,
      });
    }
  }

  // Ability Particle: Mine / Bomb Explosion
  public createExplosion(position: THREE.Vector3) {
    this.createSmashBlast(position);
    this.createFloatingText(position, '¡BOOM!', '#ef4444');
  }

  // Ability Particle: Shadow Warp Smoke
  public createWarpSmoke(position: THREE.Vector3) {
    if (!this.enabled) return;
    for (let i = 0; i < 16; i++) {
      const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#8b5cf6') });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      mesh.position.y += Math.random() * 1.5;

      const angle = Math.random() * Math.PI * 2;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * 3,
        2 + Math.random() * 3,
        Math.sin(angle) * 3
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0.4,
        maxLife: 0.4,
        rotSpeed: new THREE.Vector3(5, 5, 5),
        gravity: 2,
        scaleDecay: true,
      });
    }
  }

  // Item Healing / Buff Sparkles
  public createSparkles(position: THREE.Vector3, colorHex: string = '#ec4899') {
    if (!this.enabled) return;
    for (let i = 0; i < 14; i++) {
      const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex) });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      mesh.position.y += Math.random() * 1.2;
      mesh.position.x += (Math.random() - 0.5) * 0.8;
      mesh.position.z += (Math.random() - 0.5) * 0.8;

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        3 + Math.random() * 4,
        (Math.random() - 0.5) * 2
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0.6,
        maxLife: 0.6,
        rotSpeed: new THREE.Vector3(10, 10, 10),
        gravity: -2,
        scaleDecay: true,
      });
    }
  }

  // 3D Pixel Pop-up Text for Damage %, Coins & Smash alerts
  public createFloatingText(position: THREE.Vector3, text: string, color: string = '#fbbf24') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    // Draw high-contrast backdrop pill
    ctx.fillStyle = 'rgba(9, 10, 20, 0.88)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(8, 8, 496, 80, 12);
    ctx.fill();
    ctx.stroke();

    // Draw pixel text with thick outline
    ctx.font = 'bold 22px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.strokeText(text, 256, 48);

    ctx.fillStyle = color;
    ctx.fillText(text, 256, 48);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(4.2, 0.85, 1);
    sprite.position.copy(position);
    sprite.position.y += 2.0;

    this.scene.add(sprite);
    this.floatingTexts.push({
      mesh: sprite,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.8, 2.8, (Math.random() - 0.5) * 0.8),
      life: 1.2,
      maxLife: 1.2,
    });
  }

  public update(delta: number) {
    // 1. Update Mesh Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mesh.material) {
          if (Array.isArray(p.mesh.material)) {
            p.mesh.material.forEach((m) => m.dispose());
          } else {
            p.mesh.material.dispose();
          }
        }
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y -= p.gravity * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      p.mesh.rotation.x += p.rotSpeed.x * delta;
      p.mesh.rotation.y += p.rotSpeed.y * delta;
      p.mesh.rotation.z += p.rotSpeed.z * delta;

      if (p.scaleDecay) {
        const factor = Math.max(0.01, p.life / p.maxLife);
        p.mesh.scale.setScalar(factor);
      }
    }

    // 2. Update Floating 3D Text Sprites
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.life -= delta;
      if (t.life <= 0) {
        this.scene.remove(t.mesh);
        if (t.mesh instanceof THREE.Sprite) {
          if (t.mesh.material.map) t.mesh.material.map.dispose();
          t.mesh.material.dispose();
        }
        this.floatingTexts.splice(i, 1);
        continue;
      }

      t.mesh.position.addScaledVector(t.velocity, delta);
      t.velocity.y -= 1.2 * delta; // Slower float decay

      const alpha = Math.min(1.0, t.life / (t.maxLife * 0.4));
      t.mesh.material.opacity = alpha;
    }
  }

  public clearAll() {
    this.particles.forEach((p) => {
      this.scene.remove(p.mesh);
      if (p.mesh.geometry) p.mesh.geometry.dispose();
      if (p.mesh.material) {
        if (Array.isArray(p.mesh.material)) {
          p.mesh.material.forEach((m) => m.dispose());
        } else {
          p.mesh.material.dispose();
        }
      }
    });
    this.particles = [];

    this.floatingTexts.forEach((t) => {
      this.scene.remove(t.mesh);
      if (t.mesh instanceof THREE.Sprite) {
        if (t.mesh.material.map) t.mesh.material.map.dispose();
        t.mesh.material.dispose();
      }
    });
    this.floatingTexts = [];
  }
}
