export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';

export type OutcomeType = 'victory' | 'defeat' | null;

export type CameraPreset = 'isometric' | 'chase' | 'overview';

export interface UpgradeLevels {
  blade: number; // 1..5: Increases snow plow width & heavy drift breaking power
  engine: number; // 1..5: Increases top drive speed & torque through deep snow
  heater: number; // 1..5: Increases boost fuel capacity & max warmth vitality pips
  magnet: number; // 1..5: Increases coin pickup radius & coin value bonus
}

export interface UpgradeSpec {
  id: keyof UpgradeLevels;
  keyHint: string;
  name: string;
  jpSub: string;
  roleClue: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
}

export const UPGRADE_SPECS: UpgradeSpec[] = [
  {
    id: 'blade',
    keyHint: '1',
    name: 'V-Plow Blade',
    jpSub: '除雪ブレード',
    roleClue: 'Wider Swath · Crushes Deep Drifts',
    baseCost: 45,
    costMultiplier: 1.65,
    maxLevel: 5,
  },
  {
    id: 'engine',
    keyHint: '2',
    name: 'Kei-Turbo Engine',
    jpSub: '軽ターボ',
    roleClue: 'Higher Drive Speed · Less Snow Drag',
    baseCost: 50,
    costMultiplier: 1.65,
    maxLevel: 5,
  },
  {
    id: 'heater',
    keyHint: '3',
    name: 'Cocoa Boiler',
    jpSub: 'ココア暖炉',
    roleClue: '+Warmth Hull Pip · Longer Boost',
    baseCost: 60,
    costMultiplier: 1.75,
    maxLevel: 5,
  },
  {
    id: 'magnet',
    keyHint: '4',
    name: 'Maneki Magnet',
    jpSub: '招き磁石',
    roleClue: 'Pulls Yen Coins · +20% Coin Value',
    baseCost: 40,
    costMultiplier: 1.6,
    maxLevel: 5,
  },
];

export type MapShape = 'circle' | 'cross' | 'courtyard-ring' | 'twin-bridge' | 'diamond';

export type TimeOfDay = 'day' | 'dusk' | 'night';

export interface StageSpec {
  index: number;
  id: string;
  name: string;
  jpName: string;
  subtitle: string;
  mapShape: MapShape;
  mapShapeLabel: string;
  timeOfDay: TimeOfDay;
  targetClearPercent: number;
  gridRadius: number;
  deepSnowRatio: number;
  hazardBudget: {
    chargers: number;
    orbiters: number;
    kiters: number;
  };
  clearBonusCoins: number;
  skyTopHex: number;
  skyHorizonHex: number;
}

export const STAGES: StageSpec[] = [
  {
    index: 0,
    id: 'shirakawa-lane',
    name: 'Hotaru Torii Lane',
    jpName: '蛍鳥居の小道',
    subtitle: 'Clear the circular shrine approach before the morning festival train arrives.',
    mapShape: 'circle',
    mapShapeLabel: 'Circle Plaza',
    timeOfDay: 'day',
    targetClearPercent: 75,
    gridRadius: 11,
    deepSnowRatio: 0.18,
    hazardBudget: {
      chargers: 1,
      orbiters: 1,
      kiters: 1,
    },
    clearBonusCoins: 120,
    skyTopHex: 0x1e325c,
    skyHorizonHex: 0xf6c19e,
  },
  {
    index: 1,
    id: 'yuzawa-crossroad',
    name: 'Yuzawa Crossroad Market',
    jpName: '湯沢十字路市場',
    subtitle: 'Plow the four intersecting market avenues as dusk settles over the bathhouse.',
    mapShape: 'cross',
    mapShapeLabel: 'Crossroad (+)',
    timeOfDay: 'dusk',
    targetClearPercent: 78,
    gridRadius: 12,
    deepSnowRatio: 0.3,
    hazardBudget: {
      chargers: 2,
      orbiters: 2,
      kiters: 1,
    },
    clearBonusCoins: 190,
    skyTopHex: 0x192549,
    skyHorizonHex: 0xe69896,
  },
  {
    index: 2,
    id: 'gion-moonlit-courtyard',
    name: 'Gion Moonlit Courtyard',
    jpName: '祇園月夜の回廊',
    subtitle: 'Night shift! Switch on your headlights and circle the sacred garden courtyard.',
    mapShape: 'courtyard-ring',
    mapShapeLabel: 'Courtyard Ring',
    timeOfDay: 'night',
    targetClearPercent: 82,
    gridRadius: 12,
    deepSnowRatio: 0.38,
    hazardBudget: {
      chargers: 2,
      orbiters: 2,
      kiters: 2,
    },
    clearBonusCoins: 270,
    skyTopHex: 0x070c1b,
    skyHorizonHex: 0x1b2a4a,
  },
  {
    index: 3,
    id: 'otaru-twin-bridges',
    name: 'Otaru Canal Twin Bridges',
    jpName: '小樽運河・双子橋',
    subtitle: 'Navigate two icy stone bridges spanning the frozen midnight canal.',
    mapShape: 'twin-bridge',
    mapShapeLabel: 'Twin Bridges',
    timeOfDay: 'night',
    targetClearPercent: 85,
    gridRadius: 13,
    deepSnowRatio: 0.46,
    hazardBudget: {
      chargers: 3,
      orbiters: 2,
      kiters: 2,
    },
    clearBonusCoins: 360,
    skyTopHex: 0x050914,
    skyHorizonHex: 0x152238,
  },
  {
    index: 4,
    id: 'zao-diamond-pass',
    name: 'Zao Diamond Switchback',
    jpName: '蔵王ダイヤ峠',
    subtitle: 'Steep diamond ridge packed with thick glacial drifts and aggressive snow-boars.',
    mapShape: 'diamond',
    mapShapeLabel: 'Alpine Diamond',
    timeOfDay: 'day',
    targetClearPercent: 88,
    gridRadius: 13,
    deepSnowRatio: 0.54,
    hazardBudget: {
      chargers: 3,
      orbiters: 3,
      kiters: 2,
    },
    clearBonusCoins: 460,
    skyTopHex: 0x16284c,
    skyHorizonHex: 0x93c5fd,
  },
  {
    index: 5,
    id: 'kurobe-midnight-citadel',
    name: 'Kurobe Midnight Blizzard',
    jpName: '黒部真夜中の吹雪',
    subtitle: 'Extreme night blizzard across the grand crossroad! Maximum frost spirit activity.',
    mapShape: 'cross',
    mapShapeLabel: 'Grand Cross (+)',
    timeOfDay: 'night',
    targetClearPercent: 90,
    gridRadius: 14,
    deepSnowRatio: 0.62,
    hazardBudget: {
      chargers: 3,
      orbiters: 3,
      kiters: 3,
    },
    clearBonusCoins: 620,
    skyTopHex: 0x040711,
    skyHorizonHex: 0x111c33,
  },
];

/**
 * Pure geometric test for whether a world coordinate (x, z) lies inside the active stage's map shape.
 */
export function isPointInMapShape(
  x: number,
  z: number,
  shape: MapShape,
  maxExtent = 23.5,
): boolean {
  const ax = Math.abs(x);
  const az = Math.abs(z);

  if (shape === 'circle') {
    return Math.hypot(x, z) <= maxExtent;
  }
  if (shape === 'cross') {
    const armHalf = maxExtent * 0.44;
    return ax <= maxExtent && az <= maxExtent && (ax <= armHalf || az <= armHalf);
  }
  if (shape === 'courtyard-ring') {
    const innerIsland = 5.0;
    return ax <= maxExtent && az <= maxExtent && !(ax < innerIsland && az < innerIsland);
  }
  if (shape === 'twin-bridge') {
    if (ax > maxExtent || az > maxExtent) return false;
    const canalHalfZ = 4.0;
    if (az < canalHalfZ) {
      // Must be on West Bridge [-12.8, -4.8] or East Bridge [4.8, 12.8]
      return ax >= 4.8 && ax <= 12.8;
    }
    return true;
  }
  if (shape === 'diamond') {
    return ax <= maxExtent && az <= maxExtent && ax + az <= maxExtent * 1.28;
  }
  return Math.hypot(x, z) <= maxExtent;
}

/**
 * Clamps a world position (x, z) to stay inside the playable road surface of the given MapShape.
 */
export function clampPointToMapShape(
  x: number,
  z: number,
  shape: MapShape,
  maxExtent = 23.5,
): { x: number; z: number; clamped: boolean } {
  let nx = x;
  let nz = z;
  let clamped = false;

  if (shape === 'circle') {
    const d = Math.hypot(nx, nz);
    if (d > maxExtent) {
      nx = (nx / d) * maxExtent;
      nz = (nz / d) * maxExtent;
      clamped = true;
    }
    return { x: nx, z: nz, clamped };
  }

  // Outer square clamp for all non-circular shapes
  if (Math.abs(nx) > maxExtent) {
    nx = Math.sign(nx) * maxExtent;
    clamped = true;
  }
  if (Math.abs(nz) > maxExtent) {
    nz = Math.sign(nz) * maxExtent;
    clamped = true;
  }

  if (shape === 'cross') {
    const armHalf = maxExtent * 0.44;
    const ax = Math.abs(nx);
    const az = Math.abs(nz);
    if (ax > armHalf && az > armHalf) {
      if (ax - armHalf < az - armHalf) {
        nx = Math.sign(nx) * armHalf;
      } else {
        nz = Math.sign(nz) * armHalf;
      }
      clamped = true;
    }
  } else if (shape === 'courtyard-ring') {
    const innerIsland = 5.0;
    const ax = Math.abs(nx);
    const az = Math.abs(nz);
    if (ax < innerIsland && az < innerIsland) {
      if (innerIsland - ax < innerIsland - az) {
        nx = (nx >= 0 ? 1 : -1) * innerIsland;
      } else {
        nz = (nz >= 0 ? 1 : -1) * innerIsland;
      }
      clamped = true;
    }
  } else if (shape === 'twin-bridge') {
    const canalHalfZ = 4.0;
    const ax = Math.abs(nx);
    const az = Math.abs(nz);
    if (az < canalHalfZ && (ax < 4.8 || ax > 12.8)) {
      const distToBank = canalHalfZ - az;
      const distToBridge = ax < 4.8 ? 4.8 - ax : ax - 12.8;
      if (distToBank <= distToBridge) {
        nz = (nz >= 0 ? 1 : -1) * canalHalfZ;
      } else {
        const targetX = ax < 4.8 ? 4.8 : 12.8;
        nx = (nx >= 0 ? 1 : -1) * targetX;
      }
      clamped = true;
    }
  } else if (shape === 'diamond') {
    const limit = maxExtent * 1.28;
    const sum = Math.abs(nx) + Math.abs(nz);
    if (sum > limit) {
      const excess = (sum - limit) * 0.5;
      nx -= Math.sign(nx) * excess;
      nz -= Math.sign(nz) * excess;
      clamped = true;
    }
  }

  return { x: nx, z: nz, clamped };
}

export interface DerivedTruckStats {
  plowWidth: number;
  plowPower: number;
  maxSpeed: number;
  boostSpeed: number;
  maxWarmthPips: number;
  maxBoostEnergy: number;
  boostDrainRate: number;
  boostRechargeRate: number;
  coinMagnetRadius: number;
  coinValueMultiplier: number;
}

export interface ComboState {
  count: number;
  multiplier: number;
  timer: number;
  maxTimer: number;
  maxComboReached: number;
}

export interface RunSnapshot {
  stageIndex: number;
  stageName: string;
  outcome: OutcomeType;
  score: number;
  bestScore: number;
  coinsEarned: number;
  clearedPercent: number;
  targetPercent: number;
  maxCombo: number;
  clearTimeSec: number;
  warmthRemaining: number;
  maxWarmth: number;
}

export function getUpgradeCost(
  id: keyof UpgradeLevels,
  currentLevel: number,
): number {
  const spec = UPGRADE_SPECS.find((s) => s.id === id);
  if (!spec) return 9999;
  if (currentLevel >= spec.maxLevel) return 0;
  return Math.round(
    spec.baseCost * Math.pow(spec.costMultiplier, currentLevel - 1),
  );
}

export function canPurchaseUpgrade(
  id: keyof UpgradeLevels,
  levels: UpgradeLevels,
  coins: number,
): boolean {
  const spec = UPGRADE_SPECS.find((s) => s.id === id);
  if (!spec) return false;
  const currentLevel = levels[id];
  if (currentLevel >= spec.maxLevel) return false;
  const cost = getUpgradeCost(id, currentLevel);
  return coins >= cost;
}

export function purchaseUpgrade(
  id: keyof UpgradeLevels,
  levels: UpgradeLevels,
  coins: number,
): { levels: UpgradeLevels; coins: number; purchased: boolean; cost: number } {
  if (!canPurchaseUpgrade(id, levels, coins)) {
    return { levels, coins, purchased: false, cost: 0 };
  }
  const cost = getUpgradeCost(id, levels[id]);
  return {
    levels: {
      ...levels,
      [id]: levels[id] + 1,
    },
    coins: coins - cost,
    purchased: true,
    cost,
  };
}

export function computeTruckStats(levels: UpgradeLevels): DerivedTruckStats {
  const maxWarmthPips = 3 + Math.floor((levels.heater - 1) / 2); // 3 to 5 pips
  return {
    plowWidth: 2.3 + (levels.blade - 1) * 0.55, // 2.3m up to 4.5m wide swath
    plowPower: 1.0 + (levels.blade - 1) * 0.45,
    maxSpeed: 10.5 + (levels.engine - 1) * 1.65,
    boostSpeed: 16.5 + (levels.engine - 1) * 2.1,
    maxWarmthPips,
    maxBoostEnergy: 100 + (levels.heater - 1) * 25,
    boostDrainRate: Math.max(18, 30 - (levels.heater - 1) * 2.5),
    boostRechargeRate: 16 + (levels.heater - 1) * 3.5,
    coinMagnetRadius: 2.6 + (levels.magnet - 1) * 1.35,
    coinValueMultiplier: 1 + (levels.magnet - 1) * 0.2,
  };
}

export function calculateComboMultiplier(comboCount: number): number {
  if (comboCount < 5) return 1;
  if (comboCount < 14) return 2;
  if (comboCount < 28) return 3;
  if (comboCount < 48) return 4;
  if (comboCount < 75) return 5;
  return 6;
}

export function registerSnowClearedOnCombo(
  combo: ComboState,
  tilesCleared: number,
  basePointsPerTile = 25,
): { combo: ComboState; pointsAwarded: number; tierUp: boolean } {
  if (tilesCleared <= 0) {
    return { combo, pointsAwarded: 0, tierUp: false };
  }
  const prevMultiplier = combo.multiplier;
  const newCount = combo.count + tilesCleared;
  const newMultiplier = calculateComboMultiplier(newCount);
  const maxTimer = Math.max(1.8, 3.4 - (newMultiplier - 1) * 0.22);
  const pointsAwarded = Math.round(
    tilesCleared * basePointsPerTile * newMultiplier,
  );
  return {
    combo: {
      count: newCount,
      multiplier: newMultiplier,
      timer: maxTimer,
      maxTimer,
      maxComboReached: Math.max(combo.maxComboReached, newCount),
    },
    pointsAwarded,
    tierUp: newMultiplier > prevMultiplier,
  };
}

export function tickComboState(combo: ComboState, dt: number): ComboState {
  if (combo.count === 0 || combo.timer <= 0) {
    return {
      ...combo,
      count: 0,
      multiplier: 1,
      timer: 0,
    };
  }
  const nextTimer = combo.timer - dt;
  if (nextTimer <= 0) {
    return {
      ...combo,
      count: 0,
      multiplier: 1,
      timer: 0,
    };
  }
  return {
    ...combo,
    timer: nextTimer,
  };
}

export function calculateClearancePercentage(
  clearedCount: number,
  totalCount: number,
): number {
  if (totalCount <= 0) return 100;
  const raw = (clearedCount / totalCount) * 100;
  return Math.min(100, Math.max(0, Math.floor(raw)));
}

export function isStageTargetMet(
  clearedPercent: number,
  targetPercent: number,
): boolean {
  return clearedPercent >= targetPercent;
}

export type HazardArchetype = 'charger' | 'orbiter' | 'kiter';
export type HazardPhase = 'patrol' | 'windup' | 'active' | 'recovery' | 'ko';

export interface HazardEntity {
  id: number;
  archetype: HazardArchetype;
  phase: HazardPhase;
  phaseTimer: number;
  x: number;
  z: number;
  vx: number;
  vz: number;
  heading: number;
  homeX: number;
  homeZ: number;
  orbitAngle: number;
  orbitRadius: number;
  targetX: number;
  targetZ: number;
  hitFlashTimer: number;
}

/**
 * Pure step function for the 3 distinct winter critter/hazard policies:
 * 1. 'charger' (Inoshishi Snow-Boar): Patrols near home, enters a 0.55s visible/audible windup telegraph when the plow comes within 11m, then charges in a straight line before a recovery pause.
 * 2. 'orbiter' (Koro-Koro Snowball Spirit): Sweeps in a wide figure-eight / circular orbit around village plazas, briefly accelerating on its active sweep.
 * 3. 'kiter' (Yuki-inko Frost Sprite): Kites away when the plow gets close, then pauses for a 0.60s windup ring telegraph before puffing a frost patch that refreezes nearby cleared tiles.
 */
export function stepHazardBehavior(
  h: HazardEntity,
  playerX: number,
  playerZ: number,
  dt: number,
  canStartWindup: boolean,
  mapShape: MapShape = 'circle',
): { hazard: HazardEntity; triggeredWindup: boolean; triggeredFrostPulse: boolean } {
  const next: HazardEntity = {
    ...h,
    hitFlashTimer: Math.max(0, h.hitFlashTimer - dt),
  };
  let triggeredWindup = false;
  let triggeredFrostPulse = false;

  if (next.phase === 'ko') {
    next.phaseTimer -= dt;
    next.x += next.vx * dt;
    next.z += next.vz * dt;
    next.vx *= Math.exp(-3.5 * dt);
    next.vz *= Math.exp(-3.5 * dt);
    next.heading += 8 * dt;
    if (next.phaseTimer <= 0) {
      next.phase = 'patrol';
      next.phaseTimer = 1.5;
      next.x = next.homeX;
      next.z = next.homeZ;
      next.vx = 0;
      next.vz = 0;
    }
    return { hazard: next, triggeredWindup, triggeredFrostPulse };
  }

  const dx = playerX - next.x;
  const dz = playerZ - next.z;
  const distSq = dx * dx + dz * dz;
  const dist = Math.sqrt(distSq);

  if (next.archetype === 'charger') {
    if (next.phase === 'patrol') {
      next.orbitAngle += 0.9 * dt;
      const goalX = next.homeX + Math.cos(next.orbitAngle) * 3.2;
      const goalZ = next.homeZ + Math.sin(next.orbitAngle) * 3.2;
      const gx = goalX - next.x;
      const gz = goalZ - next.z;
      next.vx = gx * 1.8;
      next.vz = gz * 1.8;
      next.x += next.vx * dt;
      next.z += next.vz * dt;
      if (Math.abs(next.vx) + Math.abs(next.vz) > 0.05) {
        next.heading = Math.atan2(next.vx, next.vz);
      }
      next.phaseTimer = Math.max(0, next.phaseTimer - dt);
      if (dist < 11.5 && next.phaseTimer <= 0 && canStartWindup) {
        next.phase = 'windup';
        next.phaseTimer = 0.58; // 0.58s telegraph before dash
        next.heading = Math.atan2(dx, dz);
        const norm = dist > 0.001 ? 1 / dist : 1;
        next.targetX = next.x + dx * norm * 11.0;
        next.targetZ = next.z + dz * norm * 11.0;
        next.vx = 0;
        next.vz = 0;
        triggeredWindup = true;
      }
    } else if (next.phase === 'windup') {
      next.phaseTimer -= dt;
      if (next.phaseTimer <= 0) {
        next.phase = 'active';
        next.phaseTimer = 0.72;
        const tx = next.targetX - next.x;
        const tz = next.targetZ - next.z;
        const tLen = Math.hypot(tx, tz) || 1;
        const chargeSpeed = 14.2;
        next.vx = (tx / tLen) * chargeSpeed;
        next.vz = (tz / tLen) * chargeSpeed;
        next.heading = Math.atan2(next.vx, next.vz);
      }
    } else if (next.phase === 'active') {
      next.phaseTimer -= dt;
      next.x += next.vx * dt;
      next.z += next.vz * dt;
      if (next.phaseTimer <= 0) {
        next.phase = 'recovery';
        next.phaseTimer = 1.25;
        next.vx = 0;
        next.vz = 0;
      }
    } else if (next.phase === 'recovery') {
      next.phaseTimer -= dt;
      if (next.phaseTimer <= 0) {
        next.phase = 'patrol';
        next.phaseTimer = 1.6;
      }
    }
  } else if (next.archetype === 'orbiter') {
    // Sweeping figure-8 / circular orbit policy
    const speedFactor = next.phase === 'active' ? 2.1 : 1.25;
    next.orbitAngle += speedFactor * dt;
    const prevX = next.x;
    const prevZ = next.z;
    next.x = next.homeX + Math.cos(next.orbitAngle) * next.orbitRadius;
    next.z =
      next.homeZ +
      Math.sin(next.orbitAngle) * Math.cos(next.orbitAngle * 0.5) * next.orbitRadius;
    next.vx = dt > 0 ? (next.x - prevX) / dt : 0;
    next.vz = dt > 0 ? (next.z - prevZ) / dt : 0;
    if (Math.abs(next.vx) + Math.abs(next.vz) > 0.01) {
      next.heading = Math.atan2(next.vx, next.vz);
    }
    next.phaseTimer -= dt;
    if (next.phase === 'patrol' && dist < 10 && next.phaseTimer <= 0 && canStartWindup) {
      next.phase = 'windup';
      next.phaseTimer = 0.45;
      triggeredWindup = true;
    } else if (next.phase === 'windup' && next.phaseTimer <= 0) {
      next.phase = 'active';
      next.phaseTimer = 1.4;
    } else if (next.phase === 'active' && next.phaseTimer <= 0) {
      next.phase = 'patrol';
      next.phaseTimer = 2.4;
    }
  } else if (next.archetype === 'kiter') {
    // Kites away from player and periodically casts a telegraphed frost ring
    if (next.phase === 'patrol') {
      if (dist < 7.5 && dist > 0.01) {
        // Kite away from player while gently pulling toward home perimeter
        const awayX = -dx / dist;
        const awayZ = -dz / dist;
        const homePullX = (next.homeX - next.x) * 0.15;
        const homePullZ = (next.homeZ - next.z) * 0.15;
        next.vx = awayX * 5.8 + homePullX;
        next.vz = awayZ * 5.8 + homePullZ;
      } else {
        next.orbitAngle += 1.1 * dt;
        const goalX = next.homeX + Math.cos(next.orbitAngle) * 4.5;
        const goalZ = next.homeZ + Math.sin(next.orbitAngle) * 4.5;
        next.vx = (goalX - next.x) * 1.6;
        next.vz = (goalZ - next.z) * 1.6;
      }
      next.x += next.vx * dt;
      next.z += next.vz * dt;
      next.heading = Math.atan2(dx, dz);
      next.phaseTimer -= dt;
      if (dist < 12.5 && next.phaseTimer <= 0 && canStartWindup) {
        next.phase = 'windup';
        next.phaseTimer = 0.62;
        next.targetX = next.x;
        next.targetZ = next.z;
        next.vx = 0;
        next.vz = 0;
        triggeredWindup = true;
      }
    } else if (next.phase === 'windup') {
      next.phaseTimer -= dt;
      if (next.phaseTimer <= 0) {
        next.phase = 'active';
        next.phaseTimer = 0.35;
        triggeredFrostPulse = true;
      }
    } else if (next.phase === 'active') {
      next.phaseTimer -= dt;
      if (next.phaseTimer <= 0) {
        next.phase = 'recovery';
        next.phaseTimer = 1.5;
      }
    } else if (next.phase === 'recovery') {
      next.phaseTimer -= dt;
      if (next.phaseTimer <= 0) {
        next.phase = 'patrol';
        next.phaseTimer = 2.8;
      }
    }
  }

  // Keep within playable map shape boundary
  const maxBound = 23.0;
  const clampedH = clampPointToMapShape(next.x, next.z, mapShape, maxBound);
  next.x = clampedH.x;
  next.z = clampedH.z;

  return { hazard: next, triggeredWindup, triggeredFrostPulse };
}

export type GearState = 'D' | 'R' | 'N';

export interface VehicleKinematicsState {
  x: number;
  z: number;
  heading: number;
  signedSpeed: number; // + forward along nose, - reverse
  steerAngle: number; // radians (+ = left turn around +Y, - = right turn around +Y)
  pitchAngle: number; // radians (+ = nose dive on brake, - = squat on throttle)
  rollAngle: number; // radians (body roll in turns)
  gear: GearState;
  isBraking: boolean;
}

export interface VehicleControlInput {
  throttleInput: number; // -1 (S / Down) .. +1 (W / Up)
  steerInput: number; // -1 (A / Left) .. +1 (D / Right)
  isBoosting: boolean;
}

export const CAMERA_PRESET_ORDER: CameraPreset[] = ['chase', 'isometric', 'overview'];

export function cycleCameraPreset(current: CameraPreset): CameraPreset {
  const idx = CAMERA_PRESET_ORDER.indexOf(current);
  if (idx === -1) return 'chase';
  return CAMERA_PRESET_ORDER[(idx + 1) % CAMERA_PRESET_ORDER.length];
}

/**
 * Pure GTA-style vehicle-relative kinematics step:
 * - W / Up (+throttleInput): accelerates forward along the truck's nose heading (or brakes if reversing).
 * - S / Down (-throttleInput): brakes while moving forward; once slowed near zero, shifts into Reverse ('R') and backs up.
 * - A / D (steerInput): pivots the front wheels up to ±32° (0.56 rad). Yaw turn rate scales with forward/reverse velocity and naturally inverts when backing up.
 */
export function stepVehicleKinematics(
  state: VehicleKinematicsState,
  input: VehicleControlInput,
  stats: DerivedTruckStats,
  dt: number,
  arenaRadius = 23.5,
  mapShape: MapShape = 'circle',
): VehicleKinematicsState {
  const maxForward = input.isBoosting ? stats.boostSpeed : stats.maxSpeed;
  const maxReverse = stats.maxSpeed * 0.58;
  const maxSteerRad = 0.56; // ~32 degrees front wheel lock

  // Positive rotation around +Y is Left from the vehicle's POV
  const targetSteerAngle = -input.steerInput * maxSteerRad;
  const steerBlend = 1 - Math.exp(-12 * dt);
  const steerAngle = state.steerAngle + (targetSteerAngle - state.steerAngle) * steerBlend;

  let signedSpeed = state.signedSpeed;
  let isBraking = false;
  let targetPitch = 0;

  if (input.throttleInput > 0.05) {
    if (signedSpeed < -0.25) {
      // Braking from reverse
      isBraking = true;
      signedSpeed = Math.min(0, signedSpeed + 28 * dt);
      targetPitch = -0.05;
    } else {
      // Forward acceleration
      const accel = (input.isBoosting ? 24 : 15.5) * input.throttleInput;
      signedSpeed = Math.min(maxForward, signedSpeed + accel * dt);
      targetPitch = input.isBoosting ? -0.065 : -0.035;
    }
  } else if (input.throttleInput < -0.05) {
    const revMag = Math.abs(input.throttleInput);
    if (signedSpeed > 0.4) {
      // Braking from forward motion before reversing
      isBraking = true;
      signedSpeed = Math.max(0, signedSpeed - 30 * revMag * dt);
      targetPitch = 0.06; // Nose dips forward under braking
    } else {
      // Shift into Reverse gear and accelerate backward
      const revAccel = 12.5 * revMag;
      signedSpeed = Math.max(-maxReverse, signedSpeed - revAccel * dt);
      targetPitch = 0.025;
    }
  } else {
    // Natural snow rolling friction / engine coasting
    const drag = Math.exp(-4.2 * dt);
    signedSpeed *= drag;
    if (Math.abs(signedSpeed) < 0.08) {
      signedSpeed = 0;
    }
    targetPitch = 0;
  }

  // Ackermann-inspired speed-coupled yaw rate (no spinning in place at 0 speed; inverts in reverse)
  const absSpeed = Math.abs(signedSpeed);
  let yawRate = 0;
  if (absSpeed > 0.12) {
    const wheelBase = 2.15;
    const highSpeedTaper = 1 / (1 + absSpeed * 0.042);
    yawRate = steerAngle * (signedSpeed / wheelBase) * 1.45 * highSpeedTaper;
  }

  let heading = state.heading + yawRate * dt;
  // Normalize heading to (-PI, PI]
  while (heading > Math.PI) heading -= Math.PI * 2;
  while (heading <= -Math.PI) heading += Math.PI * 2;

  let x = state.x + Math.sin(heading) * signedSpeed * dt;
  let z = state.z + Math.cos(heading) * signedSpeed * dt;

  // Keep inside active stage map shape boundary
  const boundaryRes = clampPointToMapShape(x, z, mapShape, arenaRadius);
  if (boundaryRes.clamped) {
    x = boundaryRes.x;
    z = boundaryRes.z;
    signedSpeed *= 0.78;
  }

  const targetRoll = -yawRate * (absSpeed / Math.max(1, stats.maxSpeed)) * 0.055;
  const attBlend = 1 - Math.exp(-10 * dt);
  const pitchAngle = state.pitchAngle + (targetPitch - state.pitchAngle) * attBlend;
  const rollAngle = state.rollAngle + (targetRoll - state.rollAngle) * attBlend;

  const gear: GearState =
    signedSpeed < -0.15 ? 'R' : signedSpeed > 0.15 || input.throttleInput > 0 ? 'D' : 'N';

  return {
    x,
    z,
    heading,
    signedSpeed,
    steerAngle,
    pitchAngle,
    rollAngle,
    gear,
    isBraking,
  };
}

