import Phaser from 'phaser';
import { SubwayHero } from '../entities/SubwayHero';
import { TrackEnvironmentManager } from '../systems/TrackEnvironmentManager';
import { StorageManager } from '../../storage/localStorage';
import { EnvironmentManager, EnvironmentInfo } from '../systems/EnvironmentManager';
import { AudioManager } from '../systems/AudioManager';

interface MovingObject extends Phaser.GameObjects.Sprite {
  body: Phaser.Physics.Arcade.Body;
  objectCategory: 'coin' | 'crystal' | 'obstacle' | 'bomb' | 'powerup';
  powerType?: 'shield' | 'magnet' | 'boost';
  lane: number;
}

export class GameScene extends Phaser.Scene {
  // ═══════════════════════════════════════════════════════
  // 🎮  DIFFICULTY CONFIGURATION  — tune all values here
  // ═══════════════════════════════════════════════════════
  private static readonly DIFFICULTY_CONFIG = {
    /** Base run speed at Level 1 (pixels/sec before speedScale) */
    BASE_SPEED: 220,
    /** Additional speed added per level beyond Level 1 */
    SPEED_INCREASE_PER_LEVEL: 28,
    /** Hard cap: speed can never exceed BASE_SPEED × this multiplier */
    MAX_SPEED_MULTIPLIER: 3.0,
    /** Global speed scale applied to effective speed (keep < 1 for playability) */
    SPEED_SCALE: 0.72,
    /** Base spawn interval in ms at Level 1 */
    BASE_SPAWN_DELAY: 1500,
    /** Minimum spawn interval (ms) — prevents impossible overlap */
    MIN_SPAWN_DELAY: 550,
  };
  // ═══════════════════════════════════════════════════════

  private hero!: SubwayHero;
  private trackManager!: TrackEnvironmentManager;
  private objectsGroup!: Phaser.Physics.Arcade.Group;
  private beamGraphics!: Phaser.GameObjects.Graphics;
  private envInfo!: EnvironmentInfo;

  private score: number = 0;
  private coinsCollected: number = 0;
  private requiredCoins: number = 15;
  private combo: number = 1;
  private levelId: number = 1;
  private runDistance: number = 0;
  private targetDistance: number = 1000; // Finish line distance
  private runSpeed: number = 220;
  private speedScale: number = 0.72;
  private levelStartTime: number = 0;

  private scoreText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;
  private distanceProgressBar!: Phaser.GameObjects.Graphics;
  private distancePercentText!: Phaser.GameObjects.Text;
  private powerBarGraphics!: Phaser.GameObjects.Graphics;
  private livesContainer!: Phaser.GameObjects.Container;
  private rejectPromptText!: Phaser.GameObjects.Text;

  // Pause & Menu State Controls
  private isPaused: boolean = false;
  private pauseContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('GameScene');
  }

  /** Calculate the run speed for a given level from the centralized config. */
  private static getLevelSpeed(level: number): number {
    const cfg = GameScene.DIFFICULTY_CONFIG;
    const uncapped = cfg.BASE_SPEED + (level - 1) * cfg.SPEED_INCREASE_PER_LEVEL;
    return Math.min(uncapped, cfg.BASE_SPEED * cfg.MAX_SPEED_MULTIPLIER);
  }

  /** Calculate the spawn interval (ms) for a given level. */
  private static getLevelSpawnDelay(level: number): number {
    const cfg = GameScene.DIFFICULTY_CONFIG;
    const speedRatio = GameScene.getLevelSpeed(level) / cfg.BASE_SPEED;
    return Math.max(cfg.MIN_SPAWN_DELAY, Math.floor(cfg.BASE_SPAWN_DELAY / speedRatio));
  }

  init(data: { levelId?: number }): void {
    this.levelId = data.levelId || 1;
    this.score = 0;
    this.coinsCollected = 0;
    this.combo = 1;
    this.runDistance = 0;
    this.targetDistance = 10000 + this.levelId * 1500;
    this.runSpeed = GameScene.getLevelSpeed(this.levelId);
    this.speedScale = GameScene.DIFFICULTY_CONFIG.SPEED_SCALE;
    this.requiredCoins = Math.min(40, 15 + Math.floor(this.levelId * 1.2));
    this.levelStartTime = Date.now();
    this.isPaused = false;
    this.pauseContainer = null;
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.envInfo = EnvironmentManager.getEnvironmentInfo(this.levelId);

    // 1. Start Loopable Background Music cleanly
    AudioManager.getInstance().playBGM();
    this.events.once('shutdown', () => AudioManager.getInstance().stopBGM());

    // 2. 3-Lane Track Scrolling Manager
    this.trackManager = new TrackEnvironmentManager(this, this.levelId);

    // 3. Physics & Graphics Layers
    this.beamGraphics = this.add.graphics();
    this.objectsGroup = this.physics.add.group();

    // 4. Create Subway Hero Runner (Positioned at bottom-center of third-person track)
    this.hero = new SubwayHero(this, TrackEnvironmentManager.LANE_X[1], 590);

    // Collision setup
    this.physics.add.overlap(
      this.hero,
      this.objectsGroup,
      (hero, obj) => this.handleHeroObjectCollision(hero as SubwayHero, obj as MovingObject),
      undefined,
      this
    );

    // Listen for Magnetic Repel Pulse event from Hero
    this.events.on('HERO_REPEL_PULSE', (data: { x: number; y: number; radius: number }) => {
      this.handleRepelPulse(data.x, data.y, data.radius);
    });

    // 5. Polished Runner HUD & Navigation Controls
    this.setupHUD();

    // 6. Spawn Item Streams & Obstacles
    this.time.addEvent({
      delay: GameScene.getLevelSpawnDelay(this.levelId),
      callback: () => {
        if (!this.isPaused) {
          this.spawnTrackObject();
        }
      },
      loop: true
    });
  }

  private setupHUD(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // ═══════════════════════════════════════════════════════
    // 🔘 TOP-LEFT: MODERN SQUARE DARK GLASS PAUSE & SOUND BUTTONS (Exact Match to Target)
    // ═══════════════════════════════════════════════════════
    const pauseBtn = this.add.rectangle(45, 45, 44, 44, 0x0f172a, 0.95)
      .setStrokeStyle(2, 0x38bdf8, 0.9)
      .setInteractive({ useHandCursor: true })
      .setDepth(50);

    const pauseIcon = this.add.text(45, 45, '⏸', {
      fontFamily: 'Orbitron',
      fontSize: '20px',
      color: '#00f0ff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(51);

    pauseBtn.on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
      if (event) event.stopPropagation();
      this.togglePause();
    });

    pauseIcon.on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
      if (event) event.stopPropagation();
      this.togglePause();
    });

    // Sound Mute Toggle Button next to Pause
    const audioMgr = AudioManager.getInstance();
    const soundBtnBg = this.add.rectangle(105, 45, 44, 44, 0x0f172a, 0.95)
      .setStrokeStyle(2, 0x38bdf8, 0.9)
      .setInteractive({ useHandCursor: true })
      .setDepth(50);

    const soundBtnText = this.add.text(105, 45, audioMgr.isSoundMuted() ? '🔇' : '🔊', {
      fontFamily: 'Orbitron',
      fontSize: '18px',
      color: '#00f0ff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(51);

    soundBtnBg.on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
      if (event) event.stopPropagation();
      const muted = audioMgr.toggleMute();
      soundBtnText.setText(muted ? '🔇' : '🔊');
    });

    // ═══════════════════════════════════════════════════════
    // 📊 TOP-RIGHT: SCORE, MULTIPLIER & COINS BADGES (Exact Match to Target)
    // ═══════════════════════════════════════════════════════
    const trY = 42;

    // Multiplier Badge 'x1'
    const multBg = this.add.rectangle(width - 170, trY, 44, 38, 0x0f172a, 0.95)
      .setStrokeStyle(1.5, 0xf59e0b, 0.85)
      .setDepth(50);
    this.add.text(width - 170, trY, 'x1', {
      fontFamily: 'Orbitron',
      fontSize: '16px',
      color: '#f59e0b'
    }).setOrigin(0.5).setDepth(51);

    // Score Badge '000568'
    const scoreBg = this.add.rectangle(width - 75, trY, 120, 38, 0x0f172a, 0.95)
      .setStrokeStyle(1.5, 0xffffff, 0.85)
      .setDepth(50);
    this.scoreText = this.add.text(width - 75, trY, '000000', {
      fontFamily: 'Orbitron',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(51);

    // Coins Badge '18 🪙'
    const coinBg = this.add.rectangle(width - 75, trY + 44, 120, 34, 0x0f172a, 0.95)
      .setStrokeStyle(1.5, 0xf59e0b, 0.85)
      .setDepth(50);
    this.coinsText = this.add.text(width - 75, trY + 44, '0 🪙', {
      fontFamily: 'Orbitron',
      fontSize: '16px',
      color: '#f59e0b'
    }).setOrigin(0.5).setDepth(51);

    // ═══════════════════════════════════════════════════════
    // ❤️ BOTTOM-LEFT: LIVES CAPSULE BADGE (Exact Match to Target)
    // ═══════════════════════════════════════════════════════
    const blY = height - 60;
    const livesBadge = this.add.graphics().setDepth(50);
    livesBadge.fillStyle(0x0f172a, 0.92);
    livesBadge.lineStyle(2, 0x38bdf8, 0.9);
    livesBadge.fillRoundedRect(24, blY - 32, 130, 56, 12);
    livesBadge.strokeRoundedRect(24, blY - 32, 130, 56, 12);

    this.add.text(89, blY - 20, 'LIVES', {
      fontFamily: 'Orbitron',
      fontSize: '11px',
      color: '#94a3b8'
    }).setOrigin(0.5).setDepth(51);

    this.livesContainer = this.add.container(89, blY + 4).setDepth(51);
    this.updateLivesDisplay();

    // ═══════════════════════════════════════════════════════
    // 🏁 BOTTOM-CENTER: MISSION PROGRESS BAR (Exact Match to Target)
    // ═══════════════════════════════════════════════════════
    const bcX = width / 2;
    const bcY = height - 42;

    const missionCard = this.add.graphics().setDepth(50);
    missionCard.fillStyle(0x0f172a, 0.92);
    missionCard.lineStyle(2, 0x00f0ff, 0.9);
    missionCard.fillRoundedRect(bcX - 190, bcY - 28, 380, 52, 12);
    missionCard.strokeRoundedRect(bcX - 190, bcY - 28, 380, 52, 12);

    this.add.text(bcX, bcY - 14, `MISSION ${this.levelId} - COLLECT ${this.requiredCoins} COINS`, {
      fontFamily: 'Orbitron',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(51);

    this.distanceProgressBar = this.add.graphics().setDepth(51);
    this.distancePercentText = this.add.text(bcX, bcY + 8, '0 / 100', {
      fontFamily: 'Orbitron',
      fontSize: '11px',
      color: '#38bdf8'
    }).setOrigin(0.5).setDepth(52);

    this.updateDistanceBar();

    // Floating Controls Prompt
    this.rejectPromptText = this.add.text(bcX, bcY - 42, '⚡ ◀ ▶ / A D TO DODGE | SPACEBAR / TAP TO REPEL! ⚡', {
      fontFamily: 'Orbitron',
      fontSize: '11px',
      color: '#00f0ff',
      stroke: '#05070e',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(50);

    this.tweens.add({
      targets: this.rejectPromptText,
      alpha: 0.35,
      duration: 750,
      yoyo: true,
      repeat: -1
    });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    }
  }

  // ═══════════════════════════════════════════════════════
  // ⏸️ PAUSE, RESUME & NAVIGATION SYSTEM
  // ═══════════════════════════════════════════════════════

  private togglePause(): void {
    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  private pauseGame(): void {
    if (this.isPaused) return;
    this.isPaused = true;

    // Freeze physics, animations, and scene timers
    this.physics.pause();
    this.tweens.pauseAll();
    this.time.paused = true;
    AudioManager.getInstance().pauseBGM();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.pauseContainer = this.add.container(0, 0).setDepth(100);

    // 1. Dark Semi-Transparent Backdrop
    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    this.pauseContainer.add(backdrop);

    // 2. Glassmorphic Modal Card Body
    const cw = 440;
    const ch = 300;
    const cx = width / 2;
    const cy = height / 2;

    const card = this.add.rectangle(cx, cy, cw, ch, 0x0f172a, 0.96)
      .setStrokeStyle(2, 0x00f0ff, 0.9);
    this.pauseContainer.add(card);

    // Header Title
    const title = this.add.text(cx, cy - 95, 'GAME PAUSED', {
      fontFamily: 'Orbitron',
      fontSize: '32px',
      color: '#00f0ff',
      stroke: '#05070e',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.pauseContainer.add(title);

    const subtext = this.add.text(cx, cy - 50, `MISSION ${this.levelId} - ${this.envInfo.themeName}`, {
      fontFamily: 'Inter',
      fontSize: '14px',
      color: '#94a3b8'
    }).setOrigin(0.5);
    this.pauseContainer.add(subtext);

    // Modal Button Helper
    const createModalButton = (by: number, text: string, colorHex: number, textHex: string, callback: () => void) => {
      const bw = 260;
      const bh = 52;

      const btnRect = this.add.rectangle(cx, by, bw, bh, 0x1e293b, 0.95)
        .setStrokeStyle(2, colorHex, 1)
        .setInteractive({ useHandCursor: true });

      const btnText = this.add.text(cx, by, text, {
        fontFamily: 'Orbitron',
        fontSize: '18px',
        color: textHex
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      const trigger = () => {
        callback();
      };

      btnRect.on('pointerover', () => {
        btnRect.setFillStyle(colorHex, 0.95);
        btnText.setColor('#ffffff');
      });

      btnText.on('pointerover', () => {
        btnRect.setFillStyle(colorHex, 0.95);
        btnText.setColor('#ffffff');
      });

      btnRect.on('pointerout', () => {
        btnRect.setFillStyle(0x1e293b, 0.95);
        btnText.setColor(textHex);
      });

      btnText.on('pointerout', () => {
        btnRect.setFillStyle(0x1e293b, 0.95);
        btnText.setColor(textHex);
      });

      btnRect.on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
        if (event) event.stopPropagation();
        trigger();
      });

      btnText.on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
        if (event) event.stopPropagation();
        trigger();
      });

      this.pauseContainer!.add(btnRect);
      this.pauseContainer!.add(btnText);
    };

    // ▶ RESUME PLAY Button
    createModalButton(cy + 10, '▶ RESUME PLAY', 0x00f0ff, '#00f0ff', () => this.resumeGame());

    // 🚪 EXIT TO MENU Button
    createModalButton(cy + 75, '🚪 EXIT TO MENU', 0xff0077, '#ff0077', () => this.exitToMenu());
  }

  private resumeGame(): void {
    if (!this.isPaused) return;

    if (this.pauseContainer) {
      this.pauseContainer.destroy();
      this.pauseContainer = null;
    }

    this.physics.resume();
    this.tweens.resumeAll();
    this.time.paused = false;
    AudioManager.getInstance().resumeBGM();

    this.isPaused = false;
  }

  private exitToMenu(): void {
    AudioManager.getInstance().stopBGM();

    if (this.isPaused) {
      this.physics.resume();
      this.tweens.resumeAll();
      this.time.paused = false;
      this.isPaused = false;
    }

    if (this.pauseContainer) {
      this.pauseContainer.destroy();
      this.pauseContainer = null;
    }

    this.scene.start('MainMenuScene');
  }

  private updateLivesDisplay(): void {
    this.livesContainer.removeAll(true);
    for (let i = 0; i < 3; i++) {
      const active = i < this.hero.lives;
      const heart = this.add.text((i - 1) * 26, 0, active ? '❤️' : '🖤', {
        fontSize: '16px'
      }).setOrigin(0.5);
      this.livesContainer.add(heart);
    }
  }

  private updateDistanceBar(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const bcX = width / 2;
    const bcY = height - 42;
    const barX = bcX - 160;
    const barY = bcY + 2;
    const barW = 320;
    const barH = 10;

    this.distanceProgressBar.clear();
    this.distanceProgressBar.fillStyle(0x0f172a, 1);
    this.distanceProgressBar.fillRoundedRect(barX, barY, barW, barH, 4);

    const ratio = Phaser.Math.Clamp(this.runDistance / this.targetDistance, 0, 1);
    this.distanceProgressBar.fillStyle(0x00f0ff, 1);
    this.distanceProgressBar.fillRoundedRect(barX, barY, barW * ratio, barH, 4);
    this.distanceProgressBar.lineStyle(1.5, 0x00f0ff, 0.9);
    this.distanceProgressBar.strokeRoundedRect(barX, barY, barW, barH, 4);

    this.distancePercentText.setText(`${this.coinsCollected} / ${this.requiredCoins}`);
  }

  private updatePowerBar(): void {
    const barX = 145;
    const barY = 38;
    const barW = 90;
    const barH = 12;

    this.powerBarGraphics.clear();
    this.powerBarGraphics.fillStyle(0x0f172a, 1);
    this.powerBarGraphics.fillRoundedRect(barX, barY, barW, barH, 4);

    const ratio = Math.max(0, this.hero.magneticPower / this.hero.maxPower);
    this.powerBarGraphics.fillStyle(0xff0077, 1);
    this.powerBarGraphics.fillRoundedRect(barX, barY, barW * ratio, barH, 4);
    this.powerBarGraphics.lineStyle(1.5, 0xff0077, 0.8);
    this.powerBarGraphics.strokeRoundedRect(barX, barY, barW, barH, 4);
  }

  private spawnTrackObject(): void {
    const lane = Math.floor(Math.random() * 3);
    const spawnY = TrackEnvironmentManager.TOP_Y;
    const spawnX = TrackEnvironmentManager.getLaneXAtY(lane, spawnY);
    const initialScale = TrackEnvironmentManager.getScaleAtY(spawnY);

    const rand = Math.random();

    if (rand < 0.45) {
      // Stream of Coins
      for (let i = 0; i < 3; i++) {
        const coin = this.objectsGroup.create(spawnX, spawnY - i * 35, 'item_coin') as MovingObject;
        coin.objectCategory = 'coin';
        coin.lane = lane;
        coin.setScale(initialScale);
        coin.body.setCircle(14);
      }
    } else if (rand < 0.70) {
      // Obstacle
      const obsKeys = ['obs_train', 'obs_car', 'obs_crate', 'obs_barrier'];
      const chosenKey = obsKeys[Math.floor(Math.random() * obsKeys.length)];
      const obs = this.objectsGroup.create(spawnX, spawnY, chosenKey) as MovingObject;
      obs.objectCategory = 'obstacle';
      obs.lane = lane;
      obs.setScale(initialScale);
      obs.body.setSize(obs.width * 0.8, obs.height * 0.8);
    } else if (rand < 0.88) {
      // Magnetic Bomb hazard
      const bomb = this.objectsGroup.create(spawnX, spawnY, 'obs_bomb') as MovingObject;
      bomb.objectCategory = 'bomb';
      bomb.lane = lane;
      bomb.setScale(initialScale);
      bomb.body.setCircle(16);
    } else {
      // Power-up
      const powerKeys: Array<{ key: string; type: 'shield' | 'magnet' | 'boost' }> = [
        { key: 'power_shield', type: 'shield' },
        { key: 'power_magnet', type: 'magnet' },
        { key: 'power_boost', type: 'boost' }
      ];
      const chosen = powerKeys[Math.floor(Math.random() * powerKeys.length)];
      const pow = this.objectsGroup.create(spawnX, spawnY, chosen.key) as MovingObject;
      pow.objectCategory = 'powerup';
      pow.powerType = chosen.type;
      pow.lane = lane;
      pow.setScale(initialScale);
      pow.body.setCircle(16);
    }
  }

  public update(time: number, delta: number): void {
    if (this.isPaused) return;

    // 1. Scroll Track & Hero Update
    const effectiveSpeed = this.runSpeed * this.speedScale;
    this.trackManager.update(delta, effectiveSpeed);
    this.hero.update(time, delta);

    // 2. Increment Distance Progress (scaled)
    this.runDistance += effectiveSpeed * delta * 0.001;
    this.updateDistanceBar();

    if (this.runDistance >= this.targetDistance) {
      this.handleLevelCompleted();
      return;
    }

    // 3. Move Oncoming Track Objects Downward in 3D Perspective
    this.beamGraphics.clear();
    const gauntletPos = new Phaser.Math.Vector2(this.hero.x, this.hero.y);

    const objects = this.objectsGroup.getChildren() as MovingObject[];
    objects.forEach(obj => {
      if (!obj.active) return;

      // Move object down track
      obj.y += effectiveSpeed * (delta / 1000) * 1.5;

      // 3D Perspective Scaling & Converging Lane Position
      const targetScale = TrackEnvironmentManager.getScaleAtY(obj.y);

      if (obj.objectCategory === 'coin') {
        obj.rotation += 0.03;
        obj.setScale(targetScale * (1 + Math.sin(time * 0.008 + obj.y) * 0.08));
      } else if (obj.objectCategory === 'powerup') {
        obj.rotation += 0.015;
        obj.setScale(targetScale * (1 + Math.sin(time * 0.01) * 0.12));
      } else if (obj.objectCategory === 'bomb') {
        obj.setScale(targetScale * (1 + Math.sin(time * 0.012) * 0.15));
      } else {
        obj.setScale(targetScale);
      }

      // ═══════════════════════════════════════════════════════
      // 🧲 SAME-LANE MAGNETIC ATTRACTION CORE MECHANIC & BOMB FIX!
      // ═══════════════════════════════════════════════════════
      let isPulled = false;
      const isSameLane = obj.lane === this.hero.currentLane;
      const isAttractableCategory = obj.objectCategory === 'coin' || obj.objectCategory === 'crystal' || (this.hero.isSuperMagnet && obj.objectCategory === 'powerup');
      const isNotHazard = obj.objectCategory !== 'bomb' && obj.objectCategory !== 'obstacle';

      if (isSameLane && isNotHazard && isAttractableCategory) {
        const dist = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, obj.x, obj.y);
        const radius = this.hero.isSuperMagnet ? 600 : this.hero.attractionRadius;

        if (dist <= radius) {
          isPulled = true;
          // Gravitational pull toward 3rd-person hero's magnet
          const pullAngle = Phaser.Math.Angle.Between(obj.x, obj.y, this.hero.x + 22, this.hero.y - 12);
          obj.x += Math.cos(pullAngle) * 16;
          obj.y += Math.sin(pullAngle) * 16;

          // Electric Bezier Magnetic Force Arc Visual to hero's magnet tip
          this.beamGraphics.lineStyle(3, 0x00f0ff, 0.95);
          const curve = new Phaser.Curves.QuadraticBezier(
            new Phaser.Math.Vector2(gauntletPos.x + 22, gauntletPos.y - 12),
            new Phaser.Math.Vector2((gauntletPos.x + obj.x) / 2, (gauntletPos.y + obj.y) / 2 - 25),
            new Phaser.Math.Vector2(obj.x, obj.y)
          );
          curve.draw(this.beamGraphics);
        }
      }

      if (!isPulled) {
        // Track along 3D Perspective Lane Slope
        obj.x = TrackEnvironmentManager.getLaneXAtY(obj.lane, obj.y) + (obj.objectCategory !== 'obstacle' ? Math.cos(time * 0.004 + obj.y) * 4 : 0);
      }

      // Cleanup objects off screen
      if (obj.y > this.cameras.main.height + 60) {
        obj.destroy();
      }
    });
  }

  private handleRepelPulse(px: number, py: number, radius: number): void {
    AudioManager.getInstance().playRepelSFX();
    const objects = this.objectsGroup.getChildren() as MovingObject[];
    objects.forEach(obj => {
      if (!obj.active) return;

      const dist = Phaser.Math.Distance.Between(px, py, obj.x, obj.y);
      if (dist <= radius && (obj.objectCategory === 'bomb' || obj.objectCategory === 'obstacle')) {
        this.showFloatingText(obj.x, obj.y, 'REPELLED! 💥 +200', '#00f0ff');
        this.score += 200;

        const emitter = this.add.particles(obj.x, obj.y, 'spark_particle', {
          speed: { min: 80, max: 200 },
          scale: { start: 1.5, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 400,
          quantity: 12,
          blendMode: 'ADD'
        });
        this.time.delayedCall(400, () => emitter.destroy());

        obj.destroy();
      }
    });
  }

  private handleHeroObjectCollision(hero: SubwayHero, obj: MovingObject): void {
    if (!obj.active) return;

    if (obj.objectCategory === 'coin') {
      AudioManager.getInstance().playCoinSFX();
      this.coinsCollected += 1;
      const pts = Math.floor(100 * this.combo);
      this.score += pts;
      this.combo = Math.min(5.0, this.combo + 0.15);
      this.showFloatingText(obj.x, obj.y, `+${pts}`, '#ffb700');
    } else if (obj.objectCategory === 'powerup') {
      AudioManager.getInstance().playPowerupSFX();
      if (obj.powerType === 'shield') {
        hero.hasShield = true;
        this.showFloatingText(obj.x, obj.y, 'SHIELD ACTIVATED! 🛡️', '#38bdf8');
      } else if (obj.powerType === 'magnet') {
        hero.isSuperMagnet = true;
        this.showFloatingText(obj.x, obj.y, 'SUPER MAGNET SURGE! 🧲', '#facc15');
        this.time.delayedCall(5000, () => hero.isSuperMagnet = false);
      } else if (obj.powerType === 'boost') {
        hero.isTurboBoost = true;
        this.showFloatingText(obj.x, obj.y, 'TURBO SPEED BOOST! ⚡', '#4ade80');
        this.time.delayedCall(4000, () => hero.isTurboBoost = false);
      }
    } else if (obj.objectCategory === 'obstacle' || obj.objectCategory === 'bomb') {
      if (obj.objectCategory === 'bomb') {
        AudioManager.getInstance().playBombSFX();
      } else {
        AudioManager.getInstance().playHitSFX();
      }
      if (hero.hasShield) {
        hero.hasShield = false;
        this.showFloatingText(obj.x, obj.y, 'SHIELD ABSORBED HIT! 🛡️', '#38bdf8');
        this.cameras.main.shake(150, 0.01);
      } else if (hero.isTurboBoost) {
        this.showFloatingText(obj.x, obj.y, 'BLASTED THROUGH! ⚡', '#4ade80');
      } else {
        hero.lives -= 1;
        this.combo = 1;
        this.updateLivesDisplay();

        this.cameras.main.shake(250, 0.02);
        this.cameras.main.flash(200, 239, 68, 68);
        this.showFloatingText(obj.x, obj.y, 'DAMAGED! -1 LIFE', '#ef4444');

        if (hero.lives <= 0) {
          this.handleGameOver();
        }
      }
    }

    this.scoreText.setText(String(Math.floor(this.score)).padStart(6, '0'));
    this.coinsText.setText(`${this.coinsCollected} 🪙`);

    // Immediate cleanup from physics body, rendering canvas, and active array
    if (obj.body) {
      obj.body.enable = false;
    }
    obj.setActive(false);
    obj.setVisible(false);
    this.objectsGroup.remove(obj, true, true);
    obj.destroy();
  }

  private showFloatingText(x: number, y: number, text: string, color: string): void {
    const txt = this.add.text(x, y, text, {
      fontFamily: 'Orbitron',
      fontSize: '16px',
      color: color,
      stroke: '#05070e',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: txt,
      y: y - 50,
      alpha: 0,
      duration: 850,
      onComplete: () => txt.destroy()
    });
  }

  private handleLevelCompleted(): void {
    AudioManager.getInstance().playWinSFX();
    AudioManager.getInstance().stopBGM();
    const elapsedSeconds = Math.max(1, Math.floor((Date.now() - this.levelStartTime) / 1000));
    const stars = Math.max(1, this.hero.lives);

    const currentProg = StorageManager.loadProgress();
    const nextLevelId = Math.min(20, this.levelId + 1);
    StorageManager.saveProgress({
      highScore: Math.max(currentProg.highScore, Math.floor(this.score)),
      unlockedLevel: Math.max(currentProg.unlockedLevel, nextLevelId),
      levelStars: { ...currentProg.levelStars, [this.levelId]: Math.max(currentProg.levelStars[this.levelId] || 0, stars) }
    });

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const nextEnvInfo = EnvironmentManager.getEnvironmentInfo(nextLevelId);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.82);
    overlay.fillRect(0, 0, width, height);

    const card = this.add.graphics();
    card.fillStyle(0x0f172a, 0.95);
    card.lineStyle(2, 0x00f0ff, 1);
    card.fillRoundedRect(width / 2 - 240, height / 2 - 160, 480, 320, 16);
    card.strokeRoundedRect(width / 2 - 240, height / 2 - 160, 480, 320, 16);

    this.add.text(width / 2, height / 2 - 120, 'RUN COMPLETED!', {
      fontFamily: 'Orbitron',
      fontSize: '28px',
      color: '#00f0ff'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 70, `${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)} (${stars}/3 STARS)`, {
      fontFamily: 'Orbitron',
      fontSize: '22px',
      color: '#ffb700'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 20, `SCORE: ${Math.floor(this.score)}  |  TIME: ${elapsedSeconds}s`, {
      fontFamily: 'Inter',
      fontSize: '17px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const prevG = this.add.graphics();
    prevG.fillStyle(0x1e293b, 1);
    prevG.fillRoundedRect(width / 2 - 200, height / 2 + 15, 400, 44, 8);
    this.add.text(width / 2, height / 2 + 37, `NEXT TRACK: LEVEL ${nextLevelId} - ${nextEnvInfo.themeName}`, {
      fontFamily: 'Orbitron',
      fontSize: '13px',
      color: '#00f0ff'
    }).setOrigin(0.5);

    const nextBtn = this.add.text(width / 2, height / 2 + 95, 'NEXT TRACK ►', {
      fontFamily: 'Orbitron',
      fontSize: '18px',
      color: '#ff0077'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    nextBtn.on('pointerdown', () => {
      this.scene.restart({ levelId: nextLevelId });
    });
  }

  private handleGameOver(): void {
    // 1. Immediately halt BGM audio loop
    AudioManager.getInstance().stopBGM();
    AudioManager.getInstance().playHitSFX();

    // 2. Pause scene physics and motion timers
    this.isPaused = true;
    this.physics.pause();
    this.tweens.pauseAll();
    this.time.paused = true;

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const overlay = this.add.graphics().setDepth(150);
    overlay.fillStyle(0x000000, 0.88);
    overlay.fillRect(0, 0, width, height);

    this.add.text(width / 2, height / 2 - 60, 'RUN CRASHED', {
      fontFamily: 'Orbitron',
      fontSize: '48px',
      color: '#ef4444'
    }).setOrigin(0.5).setDepth(151);

    this.add.text(width / 2, height / 2 - 10, `FAILED AT LEVEL ${this.levelId} - ${this.envInfo.themeName}`, {
      fontFamily: 'Orbitron',
      fontSize: '15px',
      color: '#94a3b8'
    }).setOrigin(0.5).setDepth(151);

    const retryBtn = this.add.text(width / 2, height / 2 + 45, 'RETRY RUN ↺', {
      fontFamily: 'Orbitron',
      fontSize: '22px',
      color: '#ffffff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(151);

    retryBtn.on('pointerdown', () => {
      this.physics.resume();
      this.tweens.resumeAll();
      this.time.paused = false;
      this.isPaused = false;
      this.scene.restart({ levelId: this.levelId });
    });
  }
}
