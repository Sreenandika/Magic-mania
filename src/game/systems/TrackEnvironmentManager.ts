import Phaser from 'phaser';
import { EnvironmentManager, EnvironmentInfo } from './EnvironmentManager';

export class TrackEnvironmentManager {
  public static TOP_Y = 200;
  public static BOTTOM_Y = 660;

  // 3D Perspective Helper: Returns 3D Lane X position given lane index (0, 1, 2) and Y position (200 to 660)
  public static getLaneXAtY(lane: number, y: number): number {
    const t = Phaser.Math.Clamp((y - this.TOP_Y) / (this.BOTTOM_Y - this.TOP_Y), 0, 1);
    if (lane === 0) {
      return Phaser.Math.Linear(570, 380, t);
    } else if (lane === 2) {
      return Phaser.Math.Linear(710, 900, t);
    }
    return 640; // Center lane stays at 640
  }

  // 3D Perspective Scale Helper: Returns scale (0.18 to 1.25) for depth zoom from horizon to foreground
  public static getScaleAtY(y: number): number {
    const t = Phaser.Math.Clamp((y - this.TOP_Y) / (this.BOTTOM_Y - this.TOP_Y), 0, 1);
    return Phaser.Math.Linear(0.18, 1.25, t);
  }

  public static LANE_X: [number, number, number] = [380, 640, 900];

  private scene: Phaser.Scene;
  private bgGraphics: Phaser.GameObjects.Graphics;
  private sidePropsGroup: Phaser.GameObjects.Group;
  private envInfo: EnvironmentInfo;
  private scrollOffset: number = 0;
  private propCycleIndex: number = 0;

  constructor(scene: Phaser.Scene, levelId: number) {
    this.scene = scene;
    this.envInfo = EnvironmentManager.getEnvironmentInfo(levelId);
    this.bgGraphics = scene.add.graphics();
    this.sidePropsGroup = scene.add.group();

    this.spawnInitialSideProps();
  }

  private getNextPropKey(): string {
    if (!this.envInfo.propKeys || this.envInfo.propKeys.length === 0) {
      return 'prop_city_skyscraper';
    }
    const key = this.envInfo.propKeys[this.propCycleIndex % this.envInfo.propKeys.length];
    this.propCycleIndex++;
    return key;
  }

  private spawnInitialSideProps(): void {
    for (let y = 220; y < 650; y += 90) {
      const scale = TrackEnvironmentManager.getScaleAtY(y) * 1.5;
      const t = (y - TrackEnvironmentManager.TOP_Y) / (TrackEnvironmentManager.BOTTOM_Y - TrackEnvironmentManager.TOP_Y);
      const leftX = Phaser.Math.Linear(460, 70, t);
      const rightX = Phaser.Math.Linear(820, 1210, t);

      const leftKey = this.getNextPropKey();
      const rightKey = this.getNextPropKey();

      const leftProp = this.scene.add.sprite(leftX, y, leftKey).setOrigin(0.5, 1.0).setAlpha(0.95).setScale(scale);
      const rightProp = this.scene.add.sprite(rightX, y, rightKey).setOrigin(0.5, 1.0).setAlpha(0.95).setScale(scale);

      leftProp.setData('baseScale', scale);
      rightProp.setData('baseScale', scale);

      this.sidePropsGroup.addMultiple([leftProp, rightProp]);
    }
  }

  public update(delta: number, speed: number): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const timeNow = this.scene.time.now;

    this.scrollOffset = (this.scrollOffset + speed * (delta / 1000) * 1.5) % 50;

    this.bgGraphics.clear();

    const horizonY = TrackEnvironmentManager.TOP_Y;

    // ═══════════════════════════════════════════════════════
    // 🏙️ 1. REALISTIC URBAN SKYLINE & ATMOSPHERIC SKY
    // ═══════════════════════════════════════════════════════
    // Upper Sky Gradient
    this.bgGraphics.fillStyle(0x0f172a, 1);
    this.bgGraphics.fillRect(0, 0, width, horizonY);
    this.bgGraphics.fillStyle(0x1e293b, 0.6);
    this.bgGraphics.fillRect(0, 100, width, horizonY - 100);

    // Distant Skyscrapers Silhouette
    const buildingWidths = [60, 85, 50, 95, 70, 55, 90, 75, 110, 60, 80, 65, 90, 70];
    let skyX = 0;
    this.bgGraphics.fillStyle(0x0a0f1d, 1);
    buildingWidths.forEach((bWidth, idx) => {
      const bHeight = 45 + (idx * 23) % 80;
      this.bgGraphics.fillRect(skyX, horizonY - bHeight - 20, bWidth - 4, bHeight + 20);
      skyX += bWidth;
    });

    // Lit Office Buildings Layer
    skyX = 15;
    buildingWidths.forEach((bWidth, idx) => {
      const bHeight = 35 + (idx * 19) % 65;
      const bY = horizonY - bHeight;

      this.bgGraphics.fillStyle(0x1e293b, 1);
      this.bgGraphics.fillRect(skyX, bY, bWidth - 6, bHeight);

      // Windows Grid
      const isWindowLit = Math.floor(timeNow * 0.0015 + idx) % 2 === 0;
      this.bgGraphics.fillStyle(0x38bdf8, isWindowLit ? 0.75 : 0.25);
      for (let wy = bY + 6; wy < horizonY - 6; wy += 10) {
        for (let wx = skyX + 6; wx < skyX + bWidth - 12; wx += 12) {
          if ((wx + wy) % 3 === 0) {
            this.bgGraphics.fillRect(wx, wy, 5, 5);
          }
        }
      }
      skyX += bWidth;
    });

    // ═══════════════════════════════════════════════════════
    // 🚇 2. OVERHEAD METRO FLYOVER / VIADUCT (Right Side Overhead Rail)
    // ═══════════════════════════════════════════════════════
    // Heavy Elevated Concrete Beam
    this.bgGraphics.fillStyle(0x334155, 1);
    this.bgGraphics.beginPath();
    this.bgGraphics.moveTo(760, horizonY - 20);
    this.bgGraphics.lineTo(1280, horizonY - 35);
    this.bgGraphics.lineTo(1280, horizonY + 10);
    this.bgGraphics.lineTo(840, horizonY + 5);
    this.bgGraphics.closePath();
    this.bgGraphics.fillPath();

    // Concrete Pillars Supporting Flyover
    for (let px = 820; px < width + 100; px += 180) {
      this.bgGraphics.fillStyle(0x1e293b, 1);
      this.bgGraphics.fillRect(px, horizonY - 15, 24, 70);
      this.bgGraphics.fillStyle(0x475569, 1);
      this.bgGraphics.fillRect(px + 4, horizonY - 15, 6, 70);
    }

    // ═══════════════════════════════════════════════════════
    // 🛣️ 3. REALISTIC 3-LANE ASPHALT ROAD SURFACE
    // ═══════════════════════════════════════════════════════
    // Dark Asphalt Polygon (Trapezoid from Horizon to Foreground)
    this.bgGraphics.fillStyle(0x1e293b, 1); // Dark Asphalt Grey
    this.bgGraphics.beginPath();
    this.bgGraphics.moveTo(500, horizonY);
    this.bgGraphics.lineTo(780, horizonY);
    this.bgGraphics.lineTo(1080, height);
    this.bgGraphics.lineTo(200, height);
    this.bgGraphics.closePath();
    this.bgGraphics.fillPath();

    // ═══════════════════════════════════════════════════════
    // 🏙️ 4. CONCRETE SIDEWALKS (Left & Right Boundaries)
    // ═══════════════════════════════════════════════════════
    this.bgGraphics.fillStyle(0x334155, 1); // Concrete Sidewalk
    // Left Sidewalk
    this.bgGraphics.beginPath();
    this.bgGraphics.moveTo(0, horizonY);
    this.bgGraphics.lineTo(500, horizonY);
    this.bgGraphics.lineTo(200, height);
    this.bgGraphics.lineTo(0, height);
    this.bgGraphics.closePath();
    this.bgGraphics.fillPath();

    // Right Sidewalk
    this.bgGraphics.beginPath();
    this.bgGraphics.moveTo(780, horizonY);
    this.bgGraphics.lineTo(width, horizonY);
    this.bgGraphics.lineTo(width, height);
    this.bgGraphics.lineTo(1080, height);
    this.bgGraphics.closePath();
    this.bgGraphics.fillPath();

    // ═══════════════════════════════════════════════════════
    // 🚧 5. STEEL GUARDRAILS & ROAD MARGIN CURBS
    // ═══════════════════════════════════════════════════════
    // Solid Yellow Outer Road Edges
    this.bgGraphics.lineStyle(4, 0xeab308, 0.9);
    this.bgGraphics.lineBetween(500, horizonY, 200, height);
    this.bgGraphics.lineBetween(780, horizonY, 1080, height);

    // Solid White Outer Curb Lines
    this.bgGraphics.lineStyle(3, 0xf8fafc, 0.95);
    this.bgGraphics.lineBetween(510, horizonY, 220, height);
    this.bgGraphics.lineBetween(770, horizonY, 1060, height);

    // ═══════════════════════════════════════════════════════
    // ⚪ 6. WHITE DASHED 3-LANE DIVIDERS (SCROLLING DOWNWARD)
    // ═══════════════════════════════════════════════════════
    this.bgGraphics.lineStyle(3.5, 0xf8fafc, 0.95); // Crisp White Road Markings

    // Left/Center Lane Divider Dashed Line
    for (let stepY = horizonY + (this.scrollOffset % 30); stepY < height; stepY += 35) {
      const t = (stepY - horizonY) / (height - horizonY);
      const startX = Phaser.Math.Linear(595, 490, t);
      const endY = Math.min(height, stepY + 18);
      const endT = (endY - horizonY) / (height - horizonY);
      const endX = Phaser.Math.Linear(595, 490, endT);
      this.bgGraphics.lineBetween(startX, stepY, endX, endY);
    }

    // Center/Right Lane Divider Dashed Line
    for (let stepY = horizonY + (this.scrollOffset % 30); stepY < height; stepY += 35) {
      const t = (stepY - horizonY) / (height - horizonY);
      const startX = Phaser.Math.Linear(685, 790, t);
      const endY = Math.min(height, stepY + 18);
      const endT = (endY - horizonY) / (height - horizonY);
      const endX = Phaser.Math.Linear(685, 790, endT);
      this.bgGraphics.lineBetween(startX, stepY, endX, endY);
    }

    // Steel Guardrail Posts on Sidewalk Edge
    this.bgGraphics.lineStyle(3, 0x64748b, 0.85);
    for (let stepY = horizonY + (this.scrollOffset % 40); stepY < height; stepY += 45) {
      const t = (stepY - horizonY) / (height - horizonY);
      const lX = Phaser.Math.Linear(480, 170, t);
      const rX = Phaser.Math.Linear(800, 1110, t);
      const h = Phaser.Math.Linear(8, 28, t);
      this.bgGraphics.lineBetween(lX, stepY, lX, stepY - h);
      this.bgGraphics.lineBetween(rX, stepY, rX, stepY - h);
    }

    // Horizontal Steel Rail Cable
    this.bgGraphics.lineStyle(2, 0x94a3b8, 0.85);
    this.bgGraphics.lineBetween(480, horizonY - 8, 170, height - 28);
    this.bgGraphics.lineBetween(800, horizonY - 8, 1110, height - 28);

    // ═══════════════════════════════════════════════════════
    // 🏢 7. SIDE CITY BUILDINGS & URBAN PROPS
    // ═══════════════════════════════════════════════════════
    this.sidePropsGroup.getChildren().forEach(child => {
      const prop = child as Phaser.GameObjects.Sprite;
      prop.y += speed * (delta / 1000) * 1.5;

      const t = (prop.y - TrackEnvironmentManager.TOP_Y) / (height - TrackEnvironmentManager.TOP_Y);
      const scale = TrackEnvironmentManager.getScaleAtY(prop.y) * 1.5;
      prop.setScale(scale);

      if (prop.x < width / 2) {
        prop.x = Phaser.Math.Linear(460, 70, t);
      } else {
        prop.x = Phaser.Math.Linear(820, 1210, t);
      }

      // Recycle prop at horizon
      if (prop.y > height + 100) {
        prop.y = TrackEnvironmentManager.TOP_Y - 30;
        const newKey = this.getNextPropKey();
        prop.setTexture(newKey);
        prop.setOrigin(0.5, 1.0);
        prop.setRotation(0);
      }
    });
  }
}
