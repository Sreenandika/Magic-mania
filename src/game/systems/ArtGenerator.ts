import Phaser from 'phaser';

export class ArtGenerator {
  public static generateAll(scene: Phaser.Scene): void {
    this.generateHeroTextures(scene);
    this.generateObstacleTextures(scene);
    this.generateItemAndPowerupTextures(scene);
    this.generateTrackTextures(scene);
  }

  // 1. REALISTIC HUMAN RUNNER ON FOOT (VIEWED FROM BEHIND IN THIRD-PERSON POV - ZERO SKATEBOARD)
  private static generateHeroTextures(scene: Phaser.Scene): void {
    const drawHeroPose = (key: string, frameIndex: number, isPulse: boolean = false, isDamage: boolean = false) => {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      const w = 90;
      const h = 100;
      const centerX = 45;

      // 1. Soft Ground Contact Shadow (Under feet on asphalt)
      g.fillStyle(0x000000, 0.55);
      g.fillEllipse(centerX, 92, 52, 14);

      // Running Stride Leg Offset
      const legOffset = Math.sin((frameIndex * Math.PI) / 2) * 13;

      // 2. Left Leg (Blue jeans & athletic running shoe viewed from behind)
      const lLegY = 58 - legOffset * 0.45;
      g.fillStyle(0x1e3a8a, 1); // Dark blue denim jeans
      g.fillRoundedRect(28 + legOffset * 0.7, lLegY, 13, 28, 4);
      // Shoe Heel Counter & White Sole
      g.fillStyle(0x0284c7, 1); // Blue shoe counter
      g.fillRoundedRect(26 + legOffset * 0.7, lLegY + 24, 17, 9, 3);
      g.fillStyle(0xffffff, 1); // Crisp white rubber sole
      g.fillRect(26 + legOffset * 0.7, lLegY + 30, 17, 3);
      g.fillStyle(0x0f172a, 1);
      g.fillRect(29 + legOffset * 0.7, lLegY + 26, 11, 2);

      // 3. Right Leg (Viewed from behind)
      const rLegY = 58 + legOffset * 0.45;
      g.fillStyle(0x1e3a8a, 1);
      g.fillRoundedRect(49 - legOffset * 0.7, rLegY, 13, 28, 4);
      // Shoe
      g.fillStyle(0x0284c7, 1);
      g.fillRoundedRect(47 - legOffset * 0.7, rLegY + 24, 17, 9, 3);
      g.fillStyle(0xffffff, 1);
      g.fillRect(47 - legOffset * 0.7, rLegY + 30, 17, 3);
      g.fillStyle(0x0f172a, 1);
      g.fillRect(50 - legOffset * 0.7, rLegY + 26, 11, 2);

      // 4. Athletic Hero Hoodie Jacket (White Body with Dark Blue Sleeves - Exact Match to Target)
      g.fillStyle(0xf8fafc, 1); // White Hoodie Back Body
      g.fillRoundedRect(26, 26, 38, 34, 8);
      g.fillStyle(0xe2e8f0, 1); // Spine Seam Shadow
      g.fillRect(43, 28, 4, 30);

      // ⚡ GLOWING MAGNETIC POWER CORE EMBLEM ON BACK
      g.fillStyle(0x00f0ff, 0.4);
      g.fillCircle(centerX, 40, 12);
      g.fillStyle(0x00f0ff, 0.95);
      g.fillCircle(centerX, 40, 8);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(centerX, 40, 4);

      // 5. Left Arm (Pumping in running cadence - Dark Blue Sleeve)
      g.fillStyle(0x1e3a8a, 1); // Dark blue sleeve
      g.fillRoundedRect(15, 28 - legOffset * 0.5, 12, 18, 4);
      g.fillStyle(0xf5c29b, 1); // Skin hand fist
      g.fillCircle(21, 48 - legOffset * 0.5, 5);

      // 6. Head & Hair (Viewed from Behind facing horizon)
      g.fillStyle(0xe2a87c, 1); // Neck
      g.fillRect(40, 20, 10, 8);

      // Dark Styled Hair (Viewed from behind)
      g.fillStyle(0x1e1b4b, 1);
      g.fillCircle(centerX, 15, 14);
      g.fillStyle(0x312e81, 1);
      g.fillCircle(centerX, 14, 13);
      g.fillStyle(0x4338ca, 1);
      g.fillTriangle(34, 16, 42, 6, 45, 16);
      g.fillTriangle(42, 16, 48, 5, 52, 16);

      // 7. REALISTIC METALLIC HORSESHOE GAUNTLET (HELD IN RIGHT HAND POINTING FORWARD DOWN TRACK)
      const magX = isPulse ? 68 : 64;
      const magY = isPulse ? 18 : 28;

      // Right Arm (Dark Blue Sleeve extended forward)
      g.fillStyle(0x1e3a8a, 1);
      g.fillRoundedRect(56, 28, 14, 12, 4);
      g.fillStyle(0xf5c29b, 1);
      g.fillCircle(66, 34, 5);

      // U-Shaped Horseshoe Magnet Body (Pointing forward)
      g.fillStyle(0xef4444, 1); // North Pole Red
      g.fillRect(magX - 6, magY - 14, 6, 16);
      g.fillStyle(0x3b82f6, 1); // South Pole Blue
      g.fillRect(magX + 4, magY - 14, 6, 16);
      g.fillStyle(0xd97706, 1); // Base Curve
      g.fillRoundedRect(magX - 6, magY + 2, 16, 7, 3);

      // Silver Metallic Tips
      g.fillStyle(0xe2e8f0, 1);
      g.fillRect(magX - 6, magY - 18, 6, 5);
      g.fillRect(magX + 4, magY - 18, 6, 5);
      g.fillStyle(0xffffff, 1);
      g.fillRect(magX - 5, magY - 18, 4, 2);
      g.fillRect(magX + 5, magY - 18, 4, 2);

      // Electric Magnetic Field Arc
      g.fillStyle(0x00f0ff, isPulse ? 0.95 : 0.6);
      g.fillCircle(magX - 3, magY - 19, isPulse ? 9 : 5);
      g.fillCircle(magX + 7, magY - 19, isPulse ? 9 : 5);
      g.lineStyle(2, isPulse ? 0xff0077 : 0x00f0ff, 0.95);
      g.lineBetween(magX - 3, magY - 19, magX + 7, magY - 19);

      if (isDamage) {
        g.fillStyle(0xef4444, 0.35);
        g.fillCircle(centerX, 45, 42);
      }

      g.generateTexture(key, w, h);
      g.destroy();
    };

    drawHeroPose('hero_run1', 0);
    drawHeroPose('hero_run2', 1);
    drawHeroPose('hero_run3', 2);
    drawHeroPose('hero_run4', 3);
    drawHeroPose('hero_pulse', 0, true);
    drawHeroPose('hero_damage', 0, false, true);

    drawHeroPose('player_attract', 0);

    // Repel Pulse Shockwave Texture
    const waveG = scene.make.graphics({ x: 0, y: 0 }, false);
    waveG.lineStyle(6, 0x00f0ff, 0.9);
    waveG.strokeCircle(48, 48, 42);
    waveG.lineStyle(3, 0xffffff, 0.95);
    waveG.strokeCircle(48, 48, 34);
    waveG.fillStyle(0x00f0ff, 0.15);
    waveG.fillCircle(48, 48, 42);
    waveG.generateTexture('pulse_shockwave', 96, 96);
    waveG.destroy();

    // Shield Aura Texture
    const shieldG = scene.make.graphics({ x: 0, y: 0 }, false);
    shieldG.fillStyle(0x38bdf8, 0.2);
    shieldG.fillCircle(40, 40, 38);
    shieldG.lineStyle(4, 0x38bdf8, 0.95);
    shieldG.strokeCircle(40, 40, 38);
    shieldG.lineStyle(2, 0xffffff, 0.7);
    shieldG.strokeCircle(40, 40, 32);
    shieldG.generateTexture('shield_aura', 80, 80);
    shieldG.destroy();
  }

  // 2. REALISTIC URBAN OBSTACLES (BARRICADES, METRO TRAINS, CARS, CRATES, BOMBS)
  private static generateObstacleTextures(scene: Phaser.Scene): void {
    // A. REALISTIC CONSTRUCTION ROAD BARRICADE (Exact match to target reference image!)
    const barG = scene.make.graphics({ x: 0, y: 0 }, false);
    const bw = 90;
    const bh = 60;

    // Drop Shadow
    barG.fillStyle(0x000000, 0.5);
    barG.fillRoundedRect(4, 50, 82, 10, 4);

    // Metal Support Legs & A-Frame Feet
    barG.fillStyle(0x334155, 1);
    barG.fillRect(10, 24, 8, 32);
    barG.fillRect(72, 24, 8, 32);
    barG.fillRect(6, 50, 16, 6);
    barG.fillRect(68, 50, 16, 6);

    // Main Heavy Barricade Board
    barG.fillStyle(0xf8fafc, 1); // White base board
    barG.fillRoundedRect(4, 6, 82, 34, 4);
    barG.lineStyle(2, 0x0f172a, 1);
    barG.strokeRoundedRect(4, 6, 82, 34, 4);

    // Red Diagonal Safety Stripes
    barG.fillStyle(0xef4444, 1);
    for (let x = 8; x < 80; x += 22) {
      barG.fillTriangle(x, 6, x + 12, 6, x, 40);
      barG.fillTriangle(x + 12, 40, x + 24, 40, x + 12, 6);
    }

    // Top Warning Flashers / Reflector Lights
    barG.fillStyle(0xf59e0b, 1);
    barG.fillCircle(14, 6, 6);
    barG.fillCircle(76, 6, 6);
    barG.fillStyle(0xffffff, 0.9);
    barG.fillCircle(14, 5, 2.5);
    barG.fillCircle(76, 5, 2.5);

    barG.generateTexture('obs_barrier', bw, bh);
    barG.destroy();

    // B. REALISTIC METRO / SUBWAY TRAIN CAR
    const trainG = scene.make.graphics({ x: 0, y: 0 }, false);
    const tw = 106;
    const th = 98;

    trainG.fillStyle(0x000000, 0.5);
    trainG.fillRoundedRect(2, 82, 102, 14, 6);

    // Stainless Steel Metro Engine Body
    trainG.fillStyle(0x64748b, 1);
    trainG.fillRoundedRect(4, 4, 98, 84, 12);
    trainG.fillStyle(0x94a3b8, 1);
    trainG.fillRoundedRect(8, 8, 90, 76, 10);

    // Red Front Trim Line
    trainG.fillStyle(0xef4444, 1);
    trainG.fillRect(8, 46, 90, 8);

    // Dark Windshield Glass
    trainG.fillStyle(0x0f172a, 1);
    trainG.fillRoundedRect(16, 14, 74, 30, 6);
    trainG.fillStyle(0x38bdf8, 0.4);
    trainG.fillTriangle(18, 16, 56, 16, 18, 42);

    // Glowing Headlights
    trainG.fillStyle(0xfef08a, 1);
    trainG.fillCircle(24, 66, 8);
    trainG.fillCircle(82, 66, 8);
    trainG.fillStyle(0xffffff, 1);
    trainG.fillCircle(22, 64, 3.5);
    trainG.fillCircle(80, 64, 3.5);

    trainG.generateTexture('obs_train', tw, th);
    trainG.destroy();

    // C. REALISTIC CITY SUV / CAR
    const carG = scene.make.graphics({ x: 0, y: 0 }, false);
    carG.fillStyle(0x000000, 0.45);
    carG.fillRoundedRect(2, 48, 84, 14, 6);

    carG.fillStyle(0x1e293b, 1);
    carG.fillRoundedRect(4, 8, 80, 44, 10);
    carG.fillStyle(0x334155, 1);
    carG.fillRoundedRect(8, 10, 72, 22, 6);

    carG.fillStyle(0x0f172a, 1);
    carG.fillRoundedRect(18, 14, 52, 22, 5);
    carG.fillStyle(0x38bdf8, 0.4);
    carG.fillTriangle(20, 16, 50, 16, 20, 32);

    carG.fillStyle(0xef4444, 1);
    carG.fillCircle(14, 44, 5);
    carG.fillCircle(74, 44, 5);

    carG.generateTexture('obs_car', 88, 64);
    carG.destroy();

    // D. CARGO CONTAINER / SHIPPING CRATE
    const crateG = scene.make.graphics({ x: 0, y: 0 }, false);
    crateG.fillStyle(0x000000, 0.45);
    crateG.fillRoundedRect(2, 52, 60, 12, 4);

    crateG.fillStyle(0x78350f, 1);
    crateG.fillRoundedRect(4, 4, 56, 52, 6);
    crateG.fillStyle(0xb45309, 1);
    crateG.fillRoundedRect(8, 8, 48, 44, 4);

    crateG.fillStyle(0x334155, 1);
    crateG.fillRect(4, 4, 10, 10);
    crateG.fillRect(50, 4, 10, 10);
    crateG.fillRect(4, 46, 10, 10);
    crateG.fillRect(50, 46, 10, 10);

    crateG.lineStyle(3, 0x451a03, 1);
    crateG.lineBetween(8, 8, 52, 52);
    crateG.lineBetween(52, 8, 8, 52);

    crateG.generateTexture('obs_crate', 64, 64);
    crateG.destroy();

    // E. INDUSTRIAL HAZARD BOMB
    const bombG = scene.make.graphics({ x: 0, y: 0 }, false);
    bombG.fillStyle(0xef4444, 0.3);
    bombG.fillCircle(24, 24, 22);

    bombG.fillStyle(0x991b1b, 1);
    bombG.fillCircle(24, 24, 18);
    bombG.fillStyle(0xef4444, 1);
    bombG.fillCircle(22, 22, 14);
    bombG.fillStyle(0xffffff, 0.9);
    bombG.fillCircle(16, 16, 3);

    bombG.lineStyle(2.5, 0xffffff, 1);
    bombG.lineBetween(16, 24, 32, 24);
    bombG.lineBetween(24, 16, 24, 32);

    bombG.generateTexture('obs_bomb', 48, 48);
    bombG.destroy();
  }

  // 3. REALISTIC 3D GOLD COINS & POWERUPS
  private static generateItemAndPowerupTextures(scene: Phaser.Scene): void {
    // Metallic 3D Gold Coin (Exact match to target reference!)
    const coinG = scene.make.graphics({ x: 0, y: 0 }, false);
    const cs = 36;

    // Outer Bevel Edge
    coinG.fillStyle(0xb45309, 1);
    coinG.fillCircle(18, 18, 17);
    coinG.fillStyle(0xd97706, 1);
    coinG.fillCircle(18, 18, 15);
    coinG.fillStyle(0xf59e0b, 1);
    coinG.fillCircle(18, 18, 13);
    coinG.fillStyle(0xfef08a, 1);
    coinG.fillCircle(16, 16, 9);

    // Specular Shine Glare
    coinG.fillStyle(0xffffff, 0.95);
    coinG.fillCircle(12, 12, 3);

    coinG.generateTexture('item_coin', cs, cs);
    coinG.destroy();

    // Energy Crystal
    const crysG = scene.make.graphics({ x: 0, y: 0 }, false);
    crysG.fillStyle(0x0284c7, 1);
    crysG.fillTriangle(18, 2, 34, 34, 2, 34);
    crysG.fillStyle(0x00f0ff, 1);
    crysG.fillTriangle(18, 6, 30, 30, 6, 30);
    crysG.fillStyle(0xe0f2fe, 0.9);
    crysG.fillTriangle(18, 8, 24, 20, 12, 20);

    crysG.generateTexture('item_crystal', 36, 36);
    crysG.destroy();

    // Glass Orb Powerups
    const drawOrb = (key: string, baseColor: number, accentColor: number, iconType: 'shield' | 'magnet' | 'boost') => {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      const size = 44;
      const r = 20;

      g.fillStyle(baseColor, 1);
      g.fillCircle(22, 22, r);
      g.fillStyle(accentColor, 1);
      g.fillCircle(22, 22, r - 3);

      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(18, 18, r - 6);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(15, 14, 4);

      g.fillStyle(0xffffff, 1);
      if (iconType === 'shield') {
        g.fillTriangle(22, 11, 31, 31, 13, 31);
      } else if (iconType === 'magnet') {
        g.fillRect(14, 14, 6, 16);
        g.fillRect(24, 14, 6, 16);
        g.fillRoundedRect(14, 24, 16, 6, 2);
      } else if (iconType === 'boost') {
        g.fillTriangle(26, 8, 14, 22, 22, 22);
        g.fillTriangle(18, 36, 30, 22, 22, 22);
      }

      g.generateTexture(key, size, size);
      g.destroy();
    };

    drawOrb('power_shield', 0x0369a1, 0x38bdf8, 'shield');
    drawOrb('power_magnet', 0xa16207, 0xfacc15, 'magnet');
    drawOrb('power_boost', 0x15803d, 0x4ade80, 'boost');
  }

  // 4. REALISTIC URBAN CITY ARCHITECTURE & INFRASTRUCTURE PROP TEXTURES
  private static generateTrackTextures(scene: Phaser.Scene): void {
    const tileG = scene.make.graphics({ x: 0, y: 0 }, false);
    tileG.fillStyle(0x0f172a, 1);
    tileG.fillRect(0, 0, 1280, 60);
    tileG.lineStyle(2, 0x00f0ff, 0.4);
    tileG.lineBetween(0, 0, 1280, 0);
    tileG.lineBetween(0, 60, 1280, 60);
    tileG.generateTexture('track_tile', 1280, 60);
    tileG.destroy();

    // 1. REALISTIC 3D GLASS & CONCRETE SKYSCRAPER TOWER
    const skyG = scene.make.graphics({ x: 0, y: 0 }, false);
    const sw = 140;
    const sh = 280;

    skyG.fillStyle(0x000000, 0.5);
    skyG.fillEllipse(70, 272, 120, 20);

    skyG.fillStyle(0x0f172a, 1);
    skyG.fillRect(10, 10, 120, 260);
    skyG.fillStyle(0x1e293b, 1);
    skyG.fillRect(10, 10, 35, 260);

    skyG.fillStyle(0x38bdf8, 0.6);
    for (let wy = 24; wy < 250; wy += 18) {
      for (let wx = 18; wx < 120; wx += 22) {
        skyG.fillRect(wx, wy, 14, 10);
      }
    }

    skyG.fillStyle(0xfde047, 0.85);
    skyG.fillRect(40, 60, 14, 10);
    skyG.fillRect(84, 96, 14, 10);

    skyG.fillStyle(0x475569, 1);
    skyG.fillRect(66, 0, 8, 10);
    skyG.fillStyle(0xef4444, 1);
    skyG.fillCircle(70, 2, 4);

    skyG.generateTexture('prop_city_skyscraper', sw, sh);
    skyG.destroy();

    // 2. REALISTIC URBAN APARTMENT & COMMERCIAL BUILDING
    const aptG = scene.make.graphics({ x: 0, y: 0 }, false);
    const aw = 130;
    const ah = 230;

    aptG.fillStyle(0x000000, 0.45);
    aptG.fillEllipse(65, 224, 110, 18);

    aptG.fillStyle(0x1e293b, 1);
    aptG.fillRect(10, 10, 110, 215);
    aptG.fillStyle(0x334155, 1);
    aptG.fillRect(10, 10, 25, 215);

    aptG.fillStyle(0x00f0ff, 0.35);
    aptG.fillRect(18, 175, 94, 40);
    aptG.lineStyle(2, 0x00f0ff, 0.8);
    aptG.strokeRect(18, 175, 94, 40);

    aptG.fillStyle(0x64748b, 0.7);
    for (let wy = 22; wy < 160; wy += 24) {
      for (let wx = 22; wx < 105; wx += 26) {
        aptG.fillRect(wx, wy, 16, 14);
        aptG.fillStyle(0x0f172a, 0.9);
        aptG.fillRect(wx - 2, wy + 10, 20, 4);
        aptG.fillStyle(0x64748b, 0.7);
      }
    }

    aptG.generateTexture('prop_city_apartment', aw, ah);
    aptG.destroy();

    // 3. REALISTIC STEEL STREET LIGHT POLE
    const lampG = scene.make.graphics({ x: 0, y: 0 }, false);
    const lw = 60;
    const lh = 180;

    lampG.fillStyle(0x000000, 0.45);
    lampG.fillEllipse(30, 175, 40, 12);

    lampG.fillStyle(0x475569, 1);
    lampG.fillRect(26, 150, 8, 25);
    lampG.fillStyle(0x64748b, 1);
    lampG.fillRect(28, 10, 4, 145);

    lampG.fillRect(28, 10, 22, 4);
    lampG.fillStyle(0xfde047, 0.95);
    lampG.fillCircle(48, 15, 7);
    lampG.fillStyle(0xffffff, 1);
    lampG.fillCircle(48, 15, 3.5);

    lampG.generateTexture('prop_city_lamppost', lw, lh);
    lampG.destroy();

    // 4. REALISTIC HIGHWAY BILLBOARD SIGN
    const billG = scene.make.graphics({ x: 0, y: 0 }, false);
    const bw = 130;
    const bh = 150;

    billG.fillStyle(0x334155, 1);
    billG.fillRect(58, 65, 14, 80);

    billG.fillStyle(0x0f172a, 1);
    billG.fillRoundedRect(5, 5, 120, 60, 6);
    billG.lineStyle(3, 0x00f0ff, 0.9);
    billG.strokeRoundedRect(5, 5, 120, 60, 6);

    billG.fillStyle(0x00f0ff, 0.25);
    billG.fillRect(10, 10, 110, 50);
    billG.fillStyle(0xff0077, 0.9);
    billG.fillRect(20, 22, 70, 8);
    billG.fillStyle(0xffffff, 0.95);
    billG.fillRect(20, 36, 50, 6);

    billG.generateTexture('prop_city_billboard', bw, bh);
    billG.destroy();

    // 5. REALISTIC CONCRETE HIGHWAY JERSEY BARRIER & GUARDRAIL
    const cityBarG = scene.make.graphics({ x: 0, y: 0 }, false);
    const jw = 70;
    const jh = 50;

    cityBarG.fillStyle(0x000000, 0.4);
    cityBarG.fillEllipse(35, 46, 64, 10);

    cityBarG.fillStyle(0x475569, 1);
    cityBarG.fillRoundedRect(4, 18, 62, 28, 4);
    cityBarG.fillStyle(0x64748b, 1);
    cityBarG.fillRoundedRect(6, 20, 58, 14, 3);

    cityBarG.fillStyle(0x94a3b8, 1);
    cityBarG.fillRect(4, 8, 62, 6);
    cityBarG.fillRect(16, 14, 4, 10);
    cityBarG.fillRect(50, 14, 4, 10);

    cityBarG.fillStyle(0xeab308, 0.9);
    cityBarG.fillRect(20, 24, 10, 18);
    cityBarG.fillRect(40, 24, 10, 18);

    cityBarG.generateTexture('prop_city_barrier', jw, jh);
    cityBarG.destroy();
  }
}
