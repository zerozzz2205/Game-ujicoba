import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateClearancePercentage,
  calculateComboMultiplier,
  canPurchaseUpgrade,
  clampPointToMapShape,
  computeTruckStats,
  cycleCameraPreset,
  getUpgradeCost,
  isPointInMapShape,
  isStageTargetMet,
  purchaseUpgrade,
  registerSnowClearedOnCombo,
  STAGES,
  stepHazardBehavior,
  stepVehicleKinematics,
  tickComboState,
  type ComboState,
  type HazardEntity,
  type UpgradeLevels,
  type VehicleKinematicsState,
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

test('GTA vehicle kinematics: forward throttle, speed-scaled turning, braking, and reverse gear', () => {
  const stats = computeTruckStats({ blade: 1, engine: 1, heater: 1, magnet: 1 });
  let v: VehicleKinematicsState = {
    x: 0,
    z: 0,
    heading: 0,
    signedSpeed: 0,
    steerAngle: 0,
    pitchAngle: 0,
    rollAngle: 0,
    gear: 'N',
    isBraking: false,
  };

  // 1. Steering while stationary pivots front wheels without spinning the truck in place
  v = stepVehicleKinematics(
    v,
    { throttleInput: 0, steerInput: -1, isBoosting: false },
    stats,
    0.1,
    30,
  );
  assert.ok(v.steerAngle > 0, 'Left steer input pivots front wheels positive');
  assert.equal(v.heading, 0, 'Truck does not spin in place at zero speed');

  // 2. Forward throttle + Left steer accelerates along heading and turns counter-clockwise (+heading)
  for (let i = 0; i < 10; i++) {
    v = stepVehicleKinematics(
      v,
      { throttleInput: 1, steerInput: -1, isBoosting: false },
      stats,
      0.05,
      30,
    );
  }
  assert.equal(v.gear, 'D');
  assert.ok(v.signedSpeed > 4, 'Truck accelerates forward in Drive gear');
  assert.ok(v.heading > 0.1, 'Truck turns left (+heading) when moving forward with left steer');

  // 3. Pressing S while moving forward brakes first, then engages Reverse ('R')
  const speedBeforeBrake = v.signedSpeed;
  v = stepVehicleKinematics(
    v,
    { throttleInput: -1, steerInput: 0, isBoosting: false },
    stats,
    0.05,
    30,
  );
  assert.ok(v.signedSpeed < speedBeforeBrake, 'Holding S while moving forward applies brakes');
  assert.equal(v.isBraking, true);

  for (let i = 0; i < 25; i++) {
    v = stepVehicleKinematics(
      v,
      { throttleInput: -1, steerInput: 0, isBoosting: false },
      stats,
      0.05,
      30,
    );
  }
  assert.equal(v.gear, 'R', 'Holding S after stopping engages Reverse gear');
  assert.ok(v.signedSpeed < -1, 'Truck moves backward in Reverse gear');

  // 4. Camera preset cycling order
  assert.equal(cycleCameraPreset('chase'), 'isometric');
  assert.equal(cycleCameraPreset('isometric'), 'overview');
  assert.equal(cycleCameraPreset('overview'), 'chase');
});

test('six escalating stages include night mode shifts and non-circular map geometry', () => {
  assert.equal(STAGES.length, 6);
  const nightStages = STAGES.filter((s) => s.timeOfDay === 'night');
  assert.ok(nightStages.length >= 3, 'At least 3 stages feature night mode');

  const nonCircleShapes = new Set(
    STAGES.filter((s) => s.mapShape !== 'circle').map((s) => s.mapShape),
  );
  assert.ok(nonCircleShapes.has('cross'));
  assert.ok(nonCircleShapes.has('courtyard-ring'));
  assert.ok(nonCircleShapes.has('twin-bridge'));
  assert.ok(nonCircleShapes.has('diamond'));

  // Escalating clearance target and deep snow ratio from Stage 0 to Stage 5
  assert.ok(STAGES[5].targetClearPercent > STAGES[0].targetClearPercent);
  assert.ok(STAGES[5].deepSnowRatio > STAGES[0].deepSnowRatio);

  // Verify spawn point (0, 9.0) is inside every stage map shape
  for (const st of STAGES) {
    assert.equal(
      isPointInMapShape(0, 9.0, st.mapShape, 23.0),
      true,
      `Spawn pad (0, 9) must be inside ${st.mapShape}`,
    );
  }

  // Courtyard-ring blocks center (0, 0) and clamps out to ±5.0
  assert.equal(isPointInMapShape(0, 0, 'courtyard-ring', 23.0), false);
  const clampedCenter = clampPointToMapShape(1.2, 0.5, 'courtyard-ring', 23.0);
  assert.equal(clampedCenter.clamped, true);
  assert.ok(Math.abs(clampedCenter.x) >= 5.0 || Math.abs(clampedCenter.z) >= 5.0);

  // Twin-bridge allows crossing at x = 8.8, z = 0, but blocks canal center (0, 0)
  assert.equal(isPointInMapShape(8.8, 0, 'twin-bridge', 23.0), true);
  assert.equal(isPointInMapShape(0, 0, 'twin-bridge', 23.0), false);
});


