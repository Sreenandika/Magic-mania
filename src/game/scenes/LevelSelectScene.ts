import Phaser from 'phaser';
import { StorageManager } from '../../storage/localStorage';
import { EnvironmentManager } from '../systems/EnvironmentManager';
import { AudioManager } from '../systems/AudioManager';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene');
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const progress = StorageManager.loadProgress();

    // Ensure BGM is playing
    AudioManager.getInstance().playBGM();

    // 1. Dark Futuristic Grid Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x05070e, 0x070913, 0x0a0d1d, 0x0f172a, 1);
    bg.fillRect(0, 0, width, height);

    // 2. Title
    this.add.text(width / 2, 45, 'SELECT MISSION LEVEL', {
      fontFamily: 'Orbitron',
      fontSize: '32px',
      color: '#00f0ff',
      stroke: '#05070e',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, 82, 'REPLAY LEVELS TO EARN ALL 3 STARS ⭐', {
      fontFamily: 'Inter',
      fontSize: '14px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Top-Right Sound Mute / Unmute Button
    const audioMgr = AudioManager.getInstance();
    const soundBtnBg = this.add.rectangle(width - 70, 40, 110, 36, 0x0f172a, 0.9)
      .setStrokeStyle(2, 0x00f0ff, 0.8)
      .setInteractive({ useHandCursor: true });
    
    const soundBtnText = this.add.text(width - 70, 40, audioMgr.isSoundMuted() ? '🔇 MUTED' : '🔊 SOUND', {
      fontFamily: 'Orbitron',
      fontSize: '13px',
      color: audioMgr.isSoundMuted() ? '#ef4444' : '#00f0ff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const handleSoundToggle = () => {
      const muted = audioMgr.toggleMute();
      soundBtnText.setText(muted ? '🔇 MUTED' : '🔊 SOUND');
      soundBtnText.setColor(muted ? '#ef4444' : '#00f0ff');
      soundBtnBg.setStrokeStyle(2, muted ? 0xef4444 : 0x00f0ff, 0.8);
      if (!muted) {
        audioMgr.playCoinSFX();
      }
    };

    soundBtnBg.on('pointerdown', handleSoundToggle);
    soundBtnText.on('pointerdown', handleSoundToggle);

    // 3. Render 20 Level Cards Grid (5 columns x 4 rows)
    const cols = 5;
    const rows = 4;
    const cardW = 190;
    const cardH = 110;
    const startX = (width - (cols * cardW + (cols - 1) * 20)) / 2 + cardW / 2;
    const startY = 160 + cardH / 2;

    for (let i = 1; i <= 20; i++) {
      const col = (i - 1) % cols;
      const row = Math.floor((i - 1) / cols);
      const cx = startX + col * (cardW + 20);
      const cy = startY + row * (cardH + 16);

      const isUnlocked = i <= progress.unlockedLevel;
      const starsEarned = progress.levelStars[i] || 0;
      const envInfo = EnvironmentManager.getEnvironmentInfo(i);

      // 3D Card Graphics
      const cardG = this.add.graphics();

      const drawCardState = (isHovered: boolean) => {
        cardG.clear();

        const offset = isHovered ? -3 : 0;

        // 3D Shadow
        cardG.fillStyle(0x000000, 0.45);
        cardG.fillRoundedRect(cx - cardW / 2 + 3, cy - cardH / 2 + 5, cardW, cardH, 12);

        // Glass Body
        cardG.fillStyle(isUnlocked ? (isHovered ? 0x1e293b : 0x0f172a) : 0x030712, 0.9);
        cardG.fillRoundedRect(cx - cardW / 2, cy - cardH / 2 + offset, cardW, cardH, 12);

        // Metallic Rim Border
        cardG.lineStyle(isHovered ? 2.5 : 1.5, isUnlocked ? (isHovered ? 0xffffff : 0x00f0ff) : 0x334155, isUnlocked ? 0.9 : 0.4);
        cardG.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2 + offset, cardW, cardH, 12);

        // Top Glass Sheen
        if (isUnlocked) {
          cardG.fillStyle(0xffffff, 0.12);
          cardG.fillRoundedRect(cx - cardW / 2 + 2, cy - cardH / 2 + 2 + offset, cardW - 4, cardH / 2 - 2, 8);
        }
      };

      drawCardState(false);

      // Level Number
      this.add.text(cx - cardW / 2 + 14, cy - cardH / 2 + 12, `LEVEL ${i}`, {
        fontFamily: 'Orbitron',
        fontSize: '18px',
        color: isUnlocked ? '#00f0ff' : '#475569'
      });

      // Environment Title
      this.add.text(cx - cardW / 2 + 14, cy - cardH / 2 + 40, envInfo.themeName, {
        fontFamily: 'Inter',
        fontSize: '11px',
        color: isUnlocked ? '#e2e8f0' : '#334155'
      });

      // Star Display
      const starText = isUnlocked 
        ? `${'⭐'.repeat(starsEarned)}${'☆'.repeat(3 - starsEarned)}`
        : '🔒 LOCKED';

      this.add.text(cx - cardW / 2 + 14, cy - cardH / 2 + 72, starText, {
        fontFamily: 'Inter',
        fontSize: '13px',
        color: isUnlocked ? '#ffb700' : '#ef4444'
      });

      // Interactive Click & 3D Hover elevation
      if (isUnlocked) {
        const hitArea = this.add.rectangle(cx, cy, cardW, cardH, 0x000000, 0).setInteractive({ useHandCursor: true });
        
        hitArea.on('pointerover', () => {
          drawCardState(true);
        });

        hitArea.on('pointerout', () => {
          drawCardState(false);
        });

        hitArea.on('pointerdown', () => {
          this.scene.start('GameScene', { levelId: i });
        });
      }
    }

    // 4. Back to Main Menu Button
    const backBtn = this.add.text(width / 2, height - 35, '◄ BACK TO MAIN MENU', {
      fontFamily: 'Orbitron',
      fontSize: '18px',
      color: '#ff0077'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });
  }
}

