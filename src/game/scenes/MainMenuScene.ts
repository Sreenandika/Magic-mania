import Phaser from 'phaser';
import { StorageManager } from '../../storage/localStorage';
import { AudioManager } from '../systems/AudioManager';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const progress = StorageManager.loadProgress();

    // Start background music loop
    AudioManager.getInstance().playBGM();

    // 1. Environmental 3D Cyber Backdrop
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x03050c, 0x070b19, 0x0f172a, 0x020408, 1);
    bg.fillRect(0, 0, width, height);

    // 3D Perspective Floor Grid
    bg.lineStyle(1.5, 0x00f0ff, 0.25);
    for (let x = -200; x < width + 200; x += 60) {
      bg.lineBetween(x, height / 2 + 60, (x - width / 2) * 2.5 + width / 2, height);
    }
    for (let y = height / 2 + 60; y < height; y += 35) {
      bg.lineBetween(0, y, width, y);
    }

    // Floating magnetic particle aura
    this.add.particles(0, 0, 'spark_particle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      speedX: { min: -15, max: 15 },
      speedY: { min: -35, max: -10 },
      scale: { start: 1.8, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 3000,
      frequency: 60,
      blendMode: 'ADD'
    });

    // 2. Holographic 3D Pedestal Stage for Hero
    const stageX = width / 2 - 280;
    const stageY = height / 2 + 100;

    const pedestalG = this.add.graphics();
    // 3D Ellipse Base
    pedestalG.fillStyle(0x000000, 0.6);
    pedestalG.fillEllipse(stageX, stageY + 20, 180, 50);
    pedestalG.fillStyle(0x0f172a, 0.95);
    pedestalG.lineStyle(3, 0x00f0ff, 0.9);
    pedestalG.fillEllipse(stageX, stageY, 160, 40);
    pedestalG.strokeEllipse(stageX, stageY, 160, 40);
    pedestalG.fillStyle(0x00f0ff, 0.3);
    pedestalG.fillEllipse(stageX, stageY, 140, 30);

    // Hero 3D Standee Sprite with bobbing tween
    const heroPreview = this.add.sprite(stageX, stageY - 45, 'player_attract').setScale(2.5);
    this.tweens.add({
      targets: heroPreview,
      y: stageY - 58,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 3. 3D Embossed Chrome Title Header
    const titleX = width / 2 + 100;
    const titleY = height / 2 - 130;

    // Title 3D Drop Shadow
    this.add.text(titleX + 4, titleY + 4, 'MAGNET MANIA', {
      fontFamily: 'Orbitron',
      fontSize: '58px',
      color: '#000000'
    }).setOrigin(0.5).setAlpha(0.7);

    // Main 3D Title
    const titleText = this.add.text(titleX, titleY, 'MAGNET MANIA', {
      fontFamily: 'Orbitron',
      fontSize: '58px',
      color: '#ffffff',
      stroke: '#00f0ff',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Title Sub-heading Banner
    const subCard = this.add.graphics();
    subCard.fillStyle(0x0f172a, 0.8);
    subCard.lineStyle(1.5, 0xff0077, 0.8);
    subCard.fillRoundedRect(titleX - 220, titleY + 40, 440, 32, 8);
    subCard.strokeRoundedRect(titleX - 220, titleY + 40, 440, 32, 8);

    this.add.text(titleX, titleY + 56, '3D URBAN ENDLESS RUNNER', {
      fontFamily: 'Orbitron',
      fontSize: '13px',
      color: '#ff0077',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Helper: Draw 3D Beveled Metallic Action Button
    const create3DButton = (bx: number, by: number, text: string, primaryColor: number, accentColor: number, callback: () => void) => {
      const bw = 260;
      const bh = 56;

      const btnG = this.add.graphics();
      
      const drawState = (isHovered: boolean, isPressed: boolean) => {
        btnG.clear();

        const offset = isPressed ? 2 : (isHovered ? -3 : 0);

        // 3D Shadow
        btnG.fillStyle(0x000000, 0.5);
        btnG.fillRoundedRect(bx - bw / 2 + 4, by - bh / 2 + 6, bw, bh, 12);

        // Main Bevel Body
        btnG.fillStyle(isHovered ? accentColor : 0x0f172a, 0.95);
        btnG.fillRoundedRect(bx - bw / 2, by - bh / 2 + offset, bw, bh, 12);

        // Metallic Rim
        btnG.lineStyle(isHovered ? 3 : 2, isHovered ? 0xffffff : primaryColor, 1);
        btnG.strokeRoundedRect(bx - bw / 2, by - bh / 2 + offset, bw, bh, 12);

        // Top Gloss Highlight
        btnG.fillStyle(0xffffff, 0.2);
        btnG.fillRoundedRect(bx - bw / 2 + 4, by - bh / 2 + 4 + offset, bw - 8, bh / 2 - 4, 8);
      };

      drawState(false, false);

      const btnText = this.add.text(bx, by, text, {
        fontFamily: 'Orbitron',
        fontSize: '20px',
        color: '#ffffff'
      }).setOrigin(0.5);

      const hitRect = this.add.rectangle(bx, by, bw, bh, 0x000000, 0).setInteractive({ useHandCursor: true });

      hitRect.on('pointerover', () => {
        drawState(true, false);
        btnText.setScale(1.05);
      });

      hitRect.on('pointerout', () => {
        drawState(false, false);
        btnText.setScale(1.0);
      });

      hitRect.on('pointerdown', () => {
        drawState(true, true);
        this.time.delayedCall(120, callback);
      });
    };

    // 4. Create 3D Beveled Buttons
    create3DButton(titleX, height / 2 + 30, 'PLAY GAME ▶', 0x00f0ff, 0x0284c7, () => {
      this.scene.start('GameScene', { levelId: progress.unlockedLevel });
    });

    create3DButton(titleX, height / 2 + 105, 'SELECT LEVEL (20)', 0xffb700, 0xd97706, () => {
      this.scene.start('LevelSelectScene');
    });

    // Top-Right Sound Mute / Unmute Button
    const audioMgr = AudioManager.getInstance();
    const soundBtnBg = this.add.rectangle(width - 70, 40, 110, 36, 0x0f172a, 0.9)
      .setStrokeStyle(2, 0x00f0ff, 0.8)
      .setInteractive({ useHandCursor: true });
    
    const soundBtnText = this.add.text(width - 70, 40, audioMgr.isSoundMuted() ? '🔇 MUTED' : '🔊 SOUND', {
      fontFamily: 'Orbitron',
      fontSize: '13px',
      color: audioMgr.isSoundMuted() ? '#ef4444' : '#00f0ff'
    }).setOrigin(0.5);

    soundBtnBg.on('pointerdown', () => {
      const muted = audioMgr.toggleMute();
      soundBtnText.setText(muted ? '🔇 MUTED' : '🔊 SOUND');
      soundBtnText.setColor(muted ? '#ef4444' : '#00f0ff');
      soundBtnBg.setStrokeStyle(2, muted ? 0xef4444 : 0x00f0ff, 0.8);
      if (!muted) {
        audioMgr.playCoinSFX();
      }
    });

    // 5. Glassmorphic Stat Footer Panel
    const totalStars = Object.values(progress.levelStars).reduce((acc, curr) => acc + curr, 0);
    const footerG = this.add.graphics();
    footerG.fillStyle(0x0f172a, 0.85);
    footerG.lineStyle(1.5, 0x00f0ff, 0.5);
    footerG.fillRoundedRect(width / 2 - 320, height - 58, 640, 42, 10);
    footerG.strokeRoundedRect(width / 2 - 320, height - 58, 640, 42, 10);

    this.add.text(width / 2, height - 37, `HIGH SCORE: ${progress.highScore}  |  TOTAL STARS: ⭐ ${totalStars}/60  |  UNLOCKED: LEVEL ${progress.unlockedLevel}/20`, {
      fontFamily: 'Inter',
      fontSize: '14px',
      color: '#e2e8f0'
    }).setOrigin(0.5);
  }
}

