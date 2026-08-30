import * as THREE from 'three';
import { Character3D } from './characters';
import { World3DArena, Giant3DButton } from './world';
import { PLAYER_CLASSES } from '../data/classes';

export class SmashBotController {
  public character: Character3D;
  private targetCharacter: Character3D | null = null;
  private changeTargetTimer: number = 0;
  private attackDecisionCooldown: number = 0;
  private currentMoveVec: THREE.Vector3 = new THREE.Vector3();
  private wantsJump: boolean = false;
  private wantsPunch: boolean = false;
  private wantsAbility: boolean = false;

  constructor(character: Character3D) {
    this.character = character;
    this.changeTargetTimer = Math.random() * 2;
    this.attackDecisionCooldown = 0.5 + Math.random() * 0.5;
  }

  public updateAI(
    delta: number,
    allCharacters: Character3D[],
    world: World3DArena,
    giantButton: Giant3DButton
  ) {
    if (this.character.stats.isStunned || this.character.stats.isRespawning) {
      this.currentMoveVec.set(0, 0, 0);
      return;
    }

    this.attackDecisionCooldown = Math.max(0, this.attackDecisionCooldown - delta);
    this.changeTargetTimer -= delta;

    // 1. Target Selection
    if (this.changeTargetTimer <= 0 || !this.targetCharacter || this.targetCharacter.stats.isRespawning) {
      this.changeTargetTimer = 2.5 + Math.random() * 2.0;
      const enemies = allCharacters.filter((c) => c !== this.character && !c.stats.isRespawning);
      if (enemies.length > 0) {
        enemies.sort((a, b) => {
          const distA = a.group.position.distanceTo(this.character.group.position);
          const distB = b.group.position.distanceTo(this.character.group.position);
          return distA - distB;
        });
        this.targetCharacter = enemies[0];
      }
    }

    // 2. Stage Recovery Logic (Safe recovery when pushed towards edges)
    const currentPos = this.character.group.position;
    const distFromCenter = Math.sqrt(currentPos.x * currentPos.x + currentPos.z * currentPos.z);

    if (distFromCenter > 13 || currentPos.y < 0) {
      const toCenter = new THREE.Vector3(-currentPos.x, 0, -currentPos.z).normalize();
      this.currentMoveVec.copy(toCenter);
      if (this.character.isGrounded || this.character.velocity.y < -1) {
        this.wantsJump = true;
      }
      return;
    }

    // 3. Crazy Button Contest Priority
    let targetSpecialPos: THREE.Vector3 | null = null;
    if (giantButton.activeCrazyEvent && Math.random() < 0.8) {
      targetSpecialPos = new THREE.Vector3(0, 0.5, 0);
    } else if (world.spawnedItems.length > 0 && Math.random() > 0.5) {
      let closestDist = 10;
      world.spawnedItems.forEach((item) => {
        const itemVec = new THREE.Vector3(item.position.x, item.position.y, item.position.z);
        const dist = itemVec.distanceTo(currentPos);
        if (dist < closestDist) {
          closestDist = dist;
          targetSpecialPos = itemVec;
        }
      });
    }

    // 4. Tactical Combat Movement & Spacing
    if (targetSpecialPos) {
      const dirToSpecial = new THREE.Vector3().subVectors(targetSpecialPos, currentPos);
      dirToSpecial.y = 0;
      this.currentMoveVec.copy(dirToSpecial.normalize());
      if (currentPos.distanceTo(targetSpecialPos) < 2.8 && this.attackDecisionCooldown <= 0) {
        this.wantsPunch = true;
        this.attackDecisionCooldown = 0.5;
      }
    } else if (this.targetCharacter) {
      const targetPos = this.targetCharacter.group.position;
      const distToTarget = targetPos.distanceTo(currentPos);
      const dirToTarget = new THREE.Vector3().subVectors(targetPos, currentPos);
      dirToTarget.y = 0;
      dirToTarget.normalize();

      // Strategic Spacing
      if (distToTarget > 2.6) {
        // Deliberate approach
        this.currentMoveVec.copy(dirToTarget);
      } else if (distToTarget < 1.2) {
        // Back off slightly for spacing
        this.currentMoveVec.copy(dirToTarget).multiplyScalar(-0.4);
      } else {
        // Circle / Side-step pacing
        this.currentMoveVec.set(-dirToTarget.z, 0, dirToTarget.x).multiplyScalar(0.7);
      }

      // Readable attack pacing with deliberate decision intervals
      if (distToTarget <= 2.6 && this.character.stats.attackCooldown <= 0 && this.attackDecisionCooldown <= 0) {
        this.wantsPunch = true;
        this.attackDecisionCooldown = 0.8 + Math.random() * 0.7; // Wait between attacks
      }

      // Class Signature Ability Usage
      if (this.character.stats.abilityCooldown <= 0 && this.attackDecisionCooldown <= 0.3) {
        const classId = this.character.classId;
        if (classId === 'brawler' && distToTarget <= 2.5) {
          this.wantsAbility = true;
          this.attackDecisionCooldown = 1.0;
        } else if (classId === 'shadow_thief' && distToTarget > 4.0 && distToTarget < 12) {
          this.wantsAbility = true;
          this.attackDecisionCooldown = 1.0;
        } else if (classId === 'iron_guardian' && distToTarget <= 2.6) {
          this.wantsAbility = true;
          this.attackDecisionCooldown = 1.0;
        } else if (classId === 'gravity_mage' && distToTarget <= 7.0) {
          this.wantsAbility = true;
          this.attackDecisionCooldown = 1.0;
        } else if (classId === 'trapster' && Math.random() > 0.7) {
          this.wantsAbility = true;
          this.attackDecisionCooldown = 1.0;
        } else if (classId === 'pyro_fiend' && distToTarget <= 6.0) {
          this.wantsAbility = true;
          this.attackDecisionCooldown = 1.0;
        } else if (classId === 'frost_valkyrie' && distToTarget <= 3.5 && !this.character.hasIceCharge) {
          this.wantsAbility = true;
          this.attackDecisionCooldown = 1.0;
        } else if (classId === 'cyber_ninja' && distToTarget > 3.0 && distToTarget < 9.0) {
          this.wantsAbility = true;
          this.attackDecisionCooldown = 1.0;
        }
      }
    } else {
      const toButton = new THREE.Vector3().subVectors(giantButton.group.position, currentPos);
      toButton.y = 0;
      this.currentMoveVec.copy(toButton.normalize());
    }

    // Occasional Jump for platform climbing
    if (Math.random() < 0.015 && this.character.isGrounded) {
      this.wantsJump = true;
    }
  }

  public getInputs() {
    const move = this.currentMoveVec.clone();
    const jump = this.wantsJump;
    const punch = this.wantsPunch;
    const ability = this.wantsAbility;

    // Reset single-frame triggers
    this.wantsJump = false;
    this.wantsPunch = false;
    this.wantsAbility = false;

    return { move, jump, punch, ability };
  }
}
