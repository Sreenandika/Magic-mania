import Phaser from 'phaser';

export type SceneryType = 'city';

export interface EnvironmentInfo {
  themeName: string;
  sceneryType: SceneryType;
  bgColor: number;
  floorColor: number;
  gridLineColor: number;
  wallColor: number;
  propKeys: string[];
}

export class EnvironmentManager {
  private static themeMap: Record<number, EnvironmentInfo> = {
    1: { themeName: 'METRO DOWNTOWN', sceneryType: 'city', bgColor: 0x0f172a, floorColor: 0x1e293b, gridLineColor: 0xf8fafc, wallColor: 0x334155, propKeys: ['prop_city_skyscraper', 'prop_city_lamppost', 'prop_city_apartment', 'prop_city_barrier', 'prop_city_billboard'] },
    2: { themeName: 'URBAN AVENUE', sceneryType: 'city', bgColor: 0x0f172a, floorColor: 0x1e293b, gridLineColor: 0xf8fafc, wallColor: 0x334155, propKeys: ['prop_city_apartment', 'prop_city_lamppost', 'prop_city_skyscraper', 'prop_city_barrier'] },
    3: { themeName: 'COMMERCIAL DISTRICT', sceneryType: 'city', bgColor: 0x0f172a, floorColor: 0x1e293b, gridLineColor: 0xf8fafc, wallColor: 0x334155, propKeys: ['prop_city_skyscraper', 'prop_city_billboard', 'prop_city_lamppost', 'prop_city_apartment'] },
    4: { themeName: 'CIVIC CENTER EXPRESSWAY', sceneryType: 'city', bgColor: 0x0f172a, floorColor: 0x1e293b, gridLineColor: 0xf8fafc, wallColor: 0x334155, propKeys: ['prop_city_apartment', 'prop_city_skyscraper', 'prop_city_lamppost', 'prop_city_barrier'] },
    5: { themeName: 'GRAND METRO RUNWAY', sceneryType: 'city', bgColor: 0x0f172a, floorColor: 0x1e293b, gridLineColor: 0xf8fafc, wallColor: 0x334155, propKeys: ['prop_city_skyscraper', 'prop_city_lamppost', 'prop_city_billboard', 'prop_city_apartment'] },

    6: { themeName: 'FINANCIAL TOWER WAY', sceneryType: 'city', bgColor: 0x030712, floorColor: 0x0f172a, gridLineColor: 0xf8fafc, wallColor: 0x1e293b, propKeys: ['prop_city_skyscraper', 'prop_city_billboard', 'prop_city_lamppost', 'prop_city_skyscraper'] },
    7: { themeName: 'HIGH-RISE CORRIDOR', sceneryType: 'city', bgColor: 0x030712, floorColor: 0x0f172a, gridLineColor: 0xf8fafc, wallColor: 0x1e293b, propKeys: ['prop_city_skyscraper', 'prop_city_apartment', 'prop_city_billboard', 'prop_city_lamppost'] },
    8: { themeName: 'WALL STREET FLYOVER', sceneryType: 'city', bgColor: 0x030712, floorColor: 0x0f172a, gridLineColor: 0xf8fafc, wallColor: 0x1e293b, propKeys: ['prop_city_skyscraper', 'prop_city_lamppost', 'prop_city_skyscraper', 'prop_city_barrier'] },
    9: { themeName: 'PLAZA SKYSCRAPERS', sceneryType: 'city', bgColor: 0x030712, floorColor: 0x0f172a, gridLineColor: 0xf8fafc, wallColor: 0x1e293b, propKeys: ['prop_city_skyscraper', 'prop_city_billboard', 'prop_city_lamppost', 'prop_city_apartment'] },
    10: { themeName: 'METROPOLITAN CORE', sceneryType: 'city', bgColor: 0x030712, floorColor: 0x0f172a, gridLineColor: 0xf8fafc, wallColor: 0x1e293b, propKeys: ['prop_city_skyscraper', 'prop_city_lamppost', 'prop_city_billboard', 'prop_city_skyscraper'] },

    11: { themeName: 'SUNSET EXPRESSWAY', sceneryType: 'city', bgColor: 0x1e1b4b, floorColor: 0x1e293b, gridLineColor: 0xf8fafc, wallColor: 0x334155, propKeys: ['prop_city_skyscraper', 'prop_city_barrier', 'prop_city_lamppost', 'prop_city_apartment'] },
    12: { themeName: 'BAY BRIDGE SKYWAY', sceneryType: 'city', bgColor: 0x1e1b4b, floorColor: 0x1e293b, gridLineColor: 0xf8fafc, wallColor: 0x334155, propKeys: ['prop_city_apartment', 'prop_city_lamppost', 'prop_city_skyscraper', 'prop_city_barrier'] },
    13: { themeName: 'GOLDEN HOUR BOULEVARD', sceneryType: 'city', bgColor: 0x1e1b4b, floorColor: 0x1e293b, gridLineColor: 0xf8fafc, wallColor: 0x334155, propKeys: ['prop_city_skyscraper', 'prop_city_billboard', 'prop_city_lamppost', 'prop_city_apartment'] },
    14: { themeName: 'HARBOR SKYLINE PASS', sceneryType: 'city', bgColor: 0x1e1b4b, floorColor: 0x1e293b, gridLineColor: 0xf8fafc, wallColor: 0x334155, propKeys: ['prop_city_apartment', 'prop_city_skyscraper', 'prop_city_lamppost', 'prop_city_barrier'] },
    15: { themeName: 'TWILIGHT METROPOLIS', sceneryType: 'city', bgColor: 0x1e1b4b, floorColor: 0x1e293b, gridLineColor: 0xf8fafc, wallColor: 0x334155, propKeys: ['prop_city_skyscraper', 'prop_city_lamppost', 'prop_city_billboard', 'prop_city_apartment'] },

    16: { themeName: 'MIDNIGHT HIGHWAY', sceneryType: 'city', bgColor: 0x030712, floorColor: 0x0b0f19, gridLineColor: 0xf8fafc, wallColor: 0x1e293b, propKeys: ['prop_city_skyscraper', 'prop_city_billboard', 'prop_city_lamppost', 'prop_city_apartment'] },
    17: { themeName: 'NEON CITY METRO', sceneryType: 'city', bgColor: 0x030712, floorColor: 0x0b0f19, gridLineColor: 0xf8fafc, wallColor: 0x1e293b, propKeys: ['prop_city_skyscraper', 'prop_city_lamppost', 'prop_city_billboard', 'prop_city_barrier'] },
    18: { themeName: 'OVERPASS ARTERY', sceneryType: 'city', bgColor: 0x030712, floorColor: 0x0b0f19, gridLineColor: 0xf8fafc, wallColor: 0x1e293b, propKeys: ['prop_city_apartment', 'prop_city_skyscraper', 'prop_city_lamppost', 'prop_city_billboard'] },
    19: { themeName: 'CENTRAL SKYWAY', sceneryType: 'city', bgColor: 0x030712, floorColor: 0x0b0f19, gridLineColor: 0xf8fafc, wallColor: 0x1e293b, propKeys: ['prop_city_skyscraper', 'prop_city_barrier', 'prop_city_lamppost', 'prop_city_apartment'] },
    20: { themeName: 'ULTIMATE URBAN RUN', sceneryType: 'city', bgColor: 0x030712, floorColor: 0x090514, gridLineColor: 0xf8fafc, wallColor: 0x1e293b, propKeys: ['prop_city_skyscraper', 'prop_city_billboard', 'prop_city_lamppost', 'prop_city_skyscraper'] }
  };

  public static getEnvironmentInfo(levelId: number): EnvironmentInfo {
    return this.themeMap[levelId] || this.themeMap[1];
  }

  public static renderLevelEnvironment(scene: Phaser.Scene, levelId: number): EnvironmentInfo {
    return this.getEnvironmentInfo(levelId);
  }
}
