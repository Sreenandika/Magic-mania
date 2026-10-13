import Phaser from 'phaser';
import { TrackEnvironmentManager } from '../systems/TrackEnvironmentManager';

export class SubwayHero extends Phaser.GameObjects.Container {
  declare public body: Phaser.Physics.Arcade.Body;

  private heroSprite: Phaser.GameObjects.Sprite;
  private shieldAura: Phaser.GameObjects.Sprite;
  public currentLane: number = 1; // 0: Left, 1: Center, 2: Right
  public lives: number = 3;
  public magneticPower: number = 100;
  public maxPower: number = 100;
  public attractionRadius: number = 280;

  // Power-up States
  public hasShield: boolean = false;
  public isSuperMagnet: boolean = false;
  public isTurboBoost: boolean = false;

  private animTimer: number = 0;
  private runFrameIndex: number = 0;
  private isPulseActive: boolean = false;
  private pulseCooldown: number = 0;
  private baseY: number = 580;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.baseY = y;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(1.4); // Prominent human runner in foreground (~20% screen height)
    this.body.setCircle(28, -28, -28);
    this.body.setCollideWorldBounds(true);

    // 1. 3D Shield Aura Graphic
    this.shieldAura = scene.add.sprite(0, 0, 'shield_aura').setVisible(false).setScale(1.2);
    this.add(this.shieldAura);

    // 2. 3D HUMAN RUNNER SPRITE ON FOOT (VIEWED FROM BEHIND - ZERO SKATEBOARD)
    this.heroSprite = scene.add.sprite(0, 0, 'hero_run1');
    this.add(this.heroSprite);

    this.setupInputControls();
  }

  private setupInputControls(): void {
    if (!this.scene.input.keyboard) return;

    const k = this.scene.input.keyboard;

    // Lane Dodgers (Left / Right keys or A / D)
    k.on('keydown-LEFT', () => this.moveLane(-1));
    k.on('keydown-A', () => this.moveLane(-1));
    k.on('keydown-RIGHT', () => this.moveLane(1));
    k.on('keydown-D', () => this.moveLane(1));

    // MAGNETIC REPEL PULSE (SPACEBAR / CLICK TAP)
    k.on('keydown-SPACE', () => this.triggerRepelPulse());

    // Swipe gesture support for mobile/touch responsiveness
    let startX = 0;
    let startY = 0;
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      startX = pointer.x;
      startY = pointer.y;
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const diffX = pointer.x - startX;
      const diffY = pointer.y - startY;

      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) {
          this.moveLane(-1);
        } else {
          this.moveLane(1);
        }
      } else if (pointer.y > 60 && !(this.scene as any).isPaused) {
        this.triggerRepelPulse();
      }
    });
  }

  public moveLane(dir: -1 | 1): void {
    const targetLane = Phaser.Math.Clamp(this.currentLane + dir, 0, 2);
    if (targetLane === this.currentLane) return;

    this.currentLane = targetLane;
    const targetX = TrackEnvironmentManager.LANE_X[this.currentLane];
    const tiltAngle = dir * 0.16;

    // Dynamic lane switch tween with organic body tilt
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      rotation: tiltAngle,
      duration: 120,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this,
          rotation: 0,
          duration: 90,
          ease: 'Quad.easeIn'
        });
      }
    });
  }

  public triggerRepelPulse(): void {
    if (this.pulseCooldown > 0) return;

    this.isPulseActive = true;
    this.pulseCooldown = 700; // 700ms cooldown between pulses
    this.heroSprite.setTexture('hero_pulse');

    // Create expanding shockwave pulse visual ahead down the track
    const shockwave = this.scene.add.sprite(this.x, this.y - 20, 'pulse_shockwave').setDepth(10);
    this.scene.tweens.add({
      targets: shockwave,
      scaleX: 3.5,
      scaleY: 3.5,
      alpha: 0,
      duration: 450,
      ease: 'Quad.easeOut',
      onComplete: () => shockwave.destroy()
    });

    // Notify scene of pulse to destroy/repel nearby hazardous bombs
    this.scene.events.emit('HERO_REPEL_PULSE', { x: this.x, y: this.y, radius: 240 });

    this.scene.time.delayedCall(300, () => {
      this.isPulseActive = false;
    });
  }

  public update(time: number, delta: number): void {
    if (this.pulseCooldown > 0) {
      this.pulseCooldown -= delta;
    }

    // Shield Aura Visibility & Pulse Rotation
    if (this.hasShield) {
      this.shieldAura.setVisible(true);
      this.shieldAura.rotation += 0.03;
    } else {
      this.shieldAura.setVisible(false);
    }

    // 🏃 Organic Running Step Bounce on foot
    const stepBounce = Math.abs(Math.sin(time * 0.014)) * 3.5;
    this.y = this.baseY - stepBounce;

    // 🏃 4-FRAME ON-FOOT HUMAN RUNNER ANIMATION LOOP
    if (!this.isPulseActive) {
      this.animTimer += delta;
      if (this.animTimer > 110) {
        this.animTimer = 0;
        this.runFrameIndex = (this.runFrameIndex + 1) % 4;
        const keys = ['hero_run1', 'hero_run2', 'hero_run3', 'hero_run4'];
        this.heroSprite.setTexture(keys[this.runFrameIndex]);
      }
    }
  }
}
