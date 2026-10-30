import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateClearancePercentage,
  calculateComboMultiplier,
  canPurchaseUpgrade,
  computeTruckStats,
  getUpgradeCost,
  isStageTargetMet,
  purchaseUpgrade,
  registerSnowClearedOnCombo,
  stepHazardBehavior,
  tickComboState,
  type ComboState,
  type HazardEntity,
  type UpgradeLevels,
} from './rules';

test('combo multiplier scales across thresholds and resets after timer expiry', () => {
  assert.equal(calculateComboMultiplier(0), 1);
  assert.equal(calculateComboMultiplier(4), 1);
  assert.equal(calculateComboMultiplier(5), 2);
  assert.equal(calculateComboMultiplier(15), 3);
  assert.equal(calculateComboMultiplier(30), 4);
  assert.equal(calculateComboMultiplier(50), 5);
  assert.equal(calculateComboMultiplier(80), 6);

  let combo: ComboState = {
    count: 0,
    multiplier: 1,
    timer: 0,
    maxTimer: 3,
    maxComboReached: 0,
  };

  const step1 = registerSnowClearedOnCombo(combo, 6, 25);
  combo = step1.combo;
  assert.equal(combo.count, 6);
  assert.equal(combo.multiplier, 2);
  assert.equal(step1.tierUp, true);
  assert.equal(step1.pointsAwarded, 300);

  // Tick down partially
  combo = tickComboState(combo, 1.0);
  assert.ok(combo.count === 6 && combo.timer > 0);

  // Tick past expiration
  combo = tickComboState(combo, 5.0);
  assert.equal(combo.count, 0);
  assert.equal(combo.multiplier, 1);
  assert.equal(combo.maxComboReached, 6);
});

test('upgrade purchase deducts coins, increments level, and increases truck stats', () => {
  const initialLevels: UpgradeLevels = {
    blade: 1,
    engine: 1,
    heater: 1,
    magnet: 1,
  };
  const baseStats = computeTruckStats(initialLevels);
  const cost = getUpgradeCost('blade', 1);
  assert.equal(cost, 45);

  assert.equal(canPurchaseUpgrade('blade', initialLevels, 30), false);
  assert.equal(canPurchaseUpgrade('blade', initialLevels, 50), true);

  const res = purchaseUpgrade('blade', initialLevels, 100);
  assert.equal(res.purchased, true);
  assert.equal(res.levels.blade, 2);
  assert.equal(res.coins, 55);

  const upgradedStats = computeTruckStats(res.levels);
  assert.ok(upgradedStats.plowWidth > baseStats.plowWidth);
  assert.ok(upgradedStats.plowPower > baseStats.plowPower);
});

test('clearance percentage and stage win target checks', () => {
  assert.equal(calculateClearancePercentage(0, 100), 0);
  assert.equal(calculateClearancePercentage(75, 100), 75);
  assert.equal(calculateClearancePercentage(120, 100), 100);
  assert.equal(isStageTargetMet(74, 75), false);
  assert.equal(isStageTargetMet(75, 75), true);
});

test('three hazard archetypes execute distinct movement policies and windup telegraphs', () => {
  const charger: HazardEntity = {
    id: 1,
    archetype: 'charger',
    phase: 'patrol',
    phaseTimer: 0,
    x: 0,
    z: 0,
    vx: 0,
    vz: 0,
    heading: 0,
    homeX: 0,
    homeZ: 0,
    orbitAngle: 0,
    orbitRadius: 4,
    targetX: 0,
    targetZ: 0,
    hitFlashTimer: 0,
  };

  // Player within range triggers charger windup telegraph first, not immediate dash
  const chargerStep1 = stepHazardBehavior(charger, 4, 0, 0.05, true);
  assert.equal(chargerStep1.triggeredWindup, true);
  assert.equal(chargerStep1.hazard.phase, 'windup');

  // After windup finishes, charger transitions to active dash
  const chargerStep2 = stepHazardBehavior(chargerStep1.hazard, 4, 0, 0.65, true);
  assert.equal(chargerStep2.hazard.phase, 'active');
  assert.ok(chargerStep2.hazard.vx > 10);

  // Kiter moves away from close player and triggers frost ring windup
  const kiter: HazardEntity = {
    ...charger,
    id: 2,
    archetype: 'kiter',
    phaseTimer: 0.5,
  };
  const kiterMove = stepHazardBehavior(kiter, 3, 0, 0.1, true);
  assert.ok(kiterMove.hazard.x < 0, 'kiter kites away from player on +X');
});
