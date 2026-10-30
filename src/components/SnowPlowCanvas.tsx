import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  calculateClearancePercentage,
  computeTruckStats,
  isStageTargetMet,
  registerSnowClearedOnCombo,
  STAGES,
  stepHazardBehavior,
  tickComboState,
  type CameraPreset,
  type ComboState,
  type GamePhase,
  type HazardArchetype,
  type HazardEntity,
  type OutcomeType,
  type RunSnapshot,
  type UpgradeLevels,
} from '../game/rules';
import { synthAudio } from '../game/audio';
import {
  createCobbleRoadTexture,
  createHazardCritterModel,
  createKeiTruckModel,
  createLanternPost,
  createOnsenRyokanLandmark,
  createRadialShadowTexture,
  createToriiGateLandmark,
  createTruckLiveryTexture,
  createVillageCottage,
  type HazardVisualRig,
} from '../game/models';

export interface HudTelemetry {
  score: number;
  bestScore: number;
  coins: number;
  clearedPercent: number;
  targetPercent: number;
  comboCount: number;
  comboMultiplier: number;
  comboTimerRatio: number;
  warmthPips: number;
  maxWarmthPips: number;
  damagedFlash: boolean;
  boostEnergyRatio: number;
  isBoosting: boolean;
  stageIndex: number;
  stageName: string;
  stageJpName: string;
  speedKmh: number;
  activeCritterWarning: string | null;
}

interface SnowPlowCanvasProps {
  phase: GamePhase;
  stageIndex: number;
  upgradeLevels: UpgradeLevels;
  coins: number;
  bestScore: number;
  cameraPreset: CameraPreset;
  resetSignal: number;
  onPhaseChange: (nextPhase: GamePhase, outcome?: OutcomeType, snapshot?: RunSnapshot) => void;
  onCoinsChange: (nextCoins: number) => void;
  onHudUpdate: (hud: HudTelemetry) => void;
  onQuickUpgradeKey: (slotIndex: number) => void;
  onToggleDockKey: () => void;
  onToggleMuteKey: () => void;
}

// Pre-allocated module-scope math objects (Zero GC inside render loop)
const _mat4 = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _euler = new THREE.Euler();
const _color = new THREE.Color();
const _camTarget = new THREE.Vector3();
const _camDesired = new THREE.Vector3();

interface SnowCell {
  x: number;
  z: number;
  maxHealth: number;
  health: number; // 0 = cleared
  scaleY: number;
  isDeep: boolean;
}

interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  maxAge: number;
  size: number;
  kind: 'snow' | 'gold' | 'frost';
}

interface WorldPickup {
  active: boolean;
  x: number;
  z: number;
  kind: 'coin' | 'cocoa';
  spin: number;
  mesh: THREE.Group;
}

const MAX_PARTICLES = 180;
const MAX_SNOWFLAKES = 85;
const MAX_PICKUPS = 28;

export const SnowPlowCanvas: React.FC<SnowPlowCanvasProps> = ({
  phase,
  stageIndex,
  upgradeLevels,
  coins,
  bestScore,
  cameraPreset,
  resetSignal,
  onPhaseChange,
  onCoinsChange,
  onHudUpdate,
  onQuickUpgradeKey,
  onToggleDockKey,
  onToggleMuteKey,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  // Store mutable React props/callbacks in refs so WebGL never re-initializes
  const propsRef = useRef({
    phase,
    stageIndex,
    upgradeLevels,
    coins,
    bestScore,
    cameraPreset,
    onPhaseChange,
    onCoinsChange,
    onHudUpdate,
    onQuickUpgradeKey,
    onToggleDockKey,
    onToggleMuteKey,
  });

  useEffect(() => {
    propsRef.current = {
      phase,
      stageIndex,
      upgradeLevels,
      coins,
      bestScore,
      cameraPreset,
      onPhaseChange,
      onCoinsChange,
      onHudUpdate,
      onQuickUpgradeKey,
      onToggleDockKey,
      onToggleMuteKey,
    };
  });

  const resetStageFnRef = useRef<((idx: number) => void) | null>(null);

  useEffect(() => {
    if (resetStageFnRef.current) {
      resetStageFnRef.current(stageIndex);
    }
  }, [stageIndex, resetSignal]);

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    // 1. Software WebGL probe (from renderer string, never userAgent)
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const initialRect = mount.getBoundingClientRect();
    const initW = Math.max(1, initialRect.width || window.innerWidth);
    const initH = Math.max(1, initialRect.height || window.innerHeight);
    renderer.setSize(initW, initH);
    renderer.domElement.setAttribute('data-testid', 'snowplow-canvas');
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a2849);
    scene.fog = new THREE.FogExp2(0x1a2849, 0.0145);

    // 2. Mandatory RoomEnvironment Reflection Map on every device
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(40, initW / initH, 0.5, 160);
    camera.position.set(18, 20, 18);
    camera.lookAt(0, 0, 0);

    // 3. Balanced Studio & Winter Golden-Hour Lighting Rig (1 shadow caster)
    const hemiLight = new THREE.HemisphereLight(0xa8dadc, 0x24345a, 1.15);
    hemiLight.position.set(0, 40, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffe4b5, 2.25);
    dirLight.position.set(22, 34, 18);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    const d = 28;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.near = 2;
    dirLight.shadow.camera.far = 85;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x72efdd, 0.75);
    rimLight.position.set(-20, 16, -22);
    scene.add(rimLight);

    // Warm village lantern point lights (capped at 4 unshadowed lights)
    const lanternPositions: [number, number, number][] = [
      [-8, 3.2, -10],
      [8, 3.2, -10],
      [-10, 3.2, 8],
      [10, 3.2, 8],
    ];
    lanternPositions.forEach(([lx, ly, lz]) => {
      const pt = new THREE.PointLight(0xff9f1c, 3.8, 13, 1.8);
      pt.position.set(lx, ly, lz);
      scene.add(pt);
    });

    // 4. Procedural Textures & Ground Surfaces (offset on Y to prevent Z-fighting)
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const shadowTex = createRadialShadowTexture();
    const { albedo: roadAlbedo, bump: roadBump } = createCobbleRoadTexture(maxAniso);
    const truckLiveryTex = createTruckLiveryTexture(maxAniso);

    // Extended snowy outer valley floor (160m x 160m)
    const outerSnowFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.MeshStandardMaterial({
        color: 0xdbeafe,
        roughness: 0.88,
        metalness: 0.04,
      }),
    );
    outerSnowFloor.rotation.x = -Math.PI / 2;
    outerSnowFloor.position.y = -0.03;
    outerSnowFloor.receiveShadow = true;
    scene.add(outerSnowFloor);

    // Playable cobblestone village plaza (y = 0.0)
    const villagePlaza = new THREE.Mesh(
      new THREE.CircleGeometry(27.5, 48),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: roadAlbedo,
        bumpMap: roadBump,
        bumpScale: 0.04,
        roughness: 0.65,
        metalness: 0.12,
      }),
    );
    villagePlaza.rotation.x = -Math.PI / 2;
    villagePlaza.position.y = 0.0;
    villagePlaza.receiveShadow = true;
    scene.add(villagePlaza);

    // Decorative shrine approach warm slate walkway strip (y = 0.012)
    const approachStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 46),
      new THREE.MeshStandardMaterial({
        color: 0x475569,
        map: roadAlbedo,
        roughness: 0.58,
        metalness: 0.15,
      }),
    );
    approachStrip.rotation.x = -Math.PI / 2;
    approachStrip.position.set(0, 0.012, 0);
    approachStrip.receiveShadow = true;
    scene.add(approachStrip);

    // 5. Tall Landmarks & Village Props (Grounded at y = 0)
    const toriiGate = createToriiGateLandmark();
    toriiGate.position.set(0, 0, -21.5);
    scene.add(toriiGate);

    const onsenRyokan = createOnsenRyokanLandmark();
    onsenRyokan.position.set(-20.5, 0, -12.5);
    onsenRyokan.rotation.y = Math.PI / 5;
    scene.add(onsenRyokan);

    const cottageConfigs: { x: number; z: number; rot: number; color: number }[] = [
      { x: 20.5, z: -13.5, rot: -Math.PI / 4, color: 0xb5446e },
      { x: -21.5, z: 12.5, rot: Math.PI / 3, color: 0x2a9d8f },
      { x: 21.0, z: 13.0, rot: -Math.PI / 3, color: 0xe76f51 },
    ];
    cottageConfigs.forEach((cfg) => {
      const house = createVillageCottage(cfg.color);
      house.position.set(cfg.x, 0, cfg.z);
      house.rotation.y = cfg.rot;
      scene.add(house);
    });

    lanternPositions.forEach(([lx, , lz], idx) => {
      const post = createLanternPost();
      post.position.set(lx, 0, lz);
      post.rotation.y = idx % 2 === 0 ? 0 : Math.PI;
      scene.add(post);
    });

    // 6. Natural Outdoor Perimeter: Instanced Snow-Capped Cedar Grove (72 trees)
    const treeCount = 72;
    const trunkInst = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.28, 0.42, 1.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.85 }),
      treeCount,
    );
    const foliageInst = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1.65, 3.6, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72 }),
      treeCount,
    );
    const snowCapInst = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1.42, 2.1, 8),
      new THREE.MeshStandardMaterial({ color: 0xf8fbff, roughness: 0.88 }),
      treeCount,
    );
    trunkInst.castShadow = !isSoftwareGl;
    foliageInst.castShadow = !isSoftwareGl;

    const foliagePalette = [0x2d6a4f, 0x1b4332, 0x40916c, 0x3a5a40];
    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2 + (i % 3) * 0.04;
      // Leave small visual gap right behind the north Torii vista
      const radius = 28.5 + (i % 4) * 3.6;
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius;
      const s = 0.85 + ((i * 7) % 30) / 100; // ±15% scale variation

      _pos.set(tx, 0.8 * s, tz);
      _quat.setFromEuler(_euler.set(0, (i * 1.1) % Math.PI, 0));
      _scale.set(s, s, s);
      _mat4.compose(_pos, _quat, _scale);
      trunkInst.setMatrixAt(i, _mat4);

      _pos.set(tx, 2.7 * s, tz);
      _mat4.compose(_pos, _quat, _scale);
      foliageInst.setMatrixAt(i, _mat4);
      foliageInst.setColorAt(i, _color.setHex(foliagePalette[i % foliagePalette.length]));

      _pos.set(tx, 3.45 * s, tz);
      _mat4.compose(_pos, _quat, _scale);
      snowCapInst.setMatrixAt(i, _mat4);
    }
    trunkInst.instanceMatrix.needsUpdate = true;
    foliageInst.instanceMatrix.needsUpdate = true;
    if (foliageInst.instanceColor) foliageInst.instanceColor.needsUpdate = true;
    snowCapInst.instanceMatrix.needsUpdate = true;
    trunkInst.computeBoundingSphere();
    foliageInst.computeBoundingSphere();
    snowCapInst.computeBoundingSphere();
    scene.add(trunkInst, foliageInst, snowCapInst);

    // 7. Hero Kei-Truck Snowplow Model
    const truckRig = createKeiTruckModel(truckLiveryTex, shadowTex);
    scene.add(truckRig.root);

    // 8. Plowable 3D Snow Field InstancedMesh (Up to 520 snow drift tiles)
    const maxSnowCells = 520;
    const snowTileGeo = new THREE.BoxGeometry(1.68, 0.58, 1.68);
    // Shift geometry so bottom is at y = 0
    snowTileGeo.translate(0, 0.29, 0);
    const snowTileMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.78,
      metalness: 0.05,
    });
    const snowInstMesh = new THREE.InstancedMesh(snowTileGeo, snowTileMat, maxSnowCells);
    snowInstMesh.castShadow = !isSoftwareGl;
    snowInstMesh.receiveShadow = true;
    snowInstMesh.frustumCulled = false;
    scene.add(snowInstMesh);

    const snowCells: SnowCell[] = [];

    // 9. Pooled Particle Ring Buffer (180 particles in a single InstancedMesh)
    const particleGeo = new THREE.DodecahedronGeometry(0.22, 0);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const particleInst = new THREE.InstancedMesh(particleGeo, particleMat, MAX_PARTICLES);
    particleInst.frustumCulled = false;
    scene.add(particleInst);

    const particles: PooledParticle[] = Array.from({ length: MAX_PARTICLES }, () => ({
      active: false,
      x: 0,
      y: -10,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      age: 0,
      maxAge: 0.5,
      size: 1,
      kind: 'snow',
    }));
    let particleCursor = 0;

    function spawnParticles(
      x: number,
      y: number,
      z: number,
      count: number,
      kind: 'snow' | 'gold' | 'frost',
      speedScale = 1,
    ) {
      for (let i = 0; i < count; i++) {
        const p = particles[particleCursor];
        particleCursor = (particleCursor + 1) % MAX_PARTICLES;
        p.active = true;
        p.x = x + (Math.random() - 0.5) * 0.8;
        p.y = y + Math.random() * 0.4;
        p.z = z + (Math.random() - 0.5) * 0.8;
        const angle = Math.random() * Math.PI * 2;
        const spd = (2.2 + Math.random() * 4.2) * speedScale;
        p.vx = Math.cos(angle) * spd;
        p.vy = (2.8 + Math.random() * 3.8) * speedScale;
        p.vz = Math.sin(angle) * spd;
        p.age = 0;
        p.maxAge = 0.38 + Math.random() * 0.32;
        p.size = 0.65 + Math.random() * 0.85;
        p.kind = kind;
      }
    }

    // 10. Ambient Falling Snowflakes InstancedMesh
    const flakeInst = new THREE.InstancedMesh(
      new THREE.OctahedronGeometry(0.11, 0),
      new THREE.MeshBasicMaterial({ color: 0xf8fbff, transparent: true, opacity: 0.8 }),
      MAX_SNOWFLAKES,
    );
    flakeInst.frustumCulled = false;
    scene.add(flakeInst);
    const flakeCoords = Array.from({ length: MAX_SNOWFLAKES }, (_, i) => ({
      x: ((i * 19) % 48) - 24,
      y: (i * 3.7) % 18,
      z: ((i * 31) % 48) - 24,
      drift: 0.6 + (i % 5) * 0.2,
    }));

    // 11. World Pickups Pool (Golden Koban Coins & Hot Cocoa Mugs)
    const pickupsGroup = new THREE.Group();
    scene.add(pickupsGroup);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xff9f1c,
      emissiveIntensity: 0.5,
      roughness: 0.22,
      metalness: 0.82,
    });
    const cocoaMugMat = new THREE.MeshStandardMaterial({
      color: 0xe63946,
      roughness: 0.35,
      metalness: 0.15,
    });
    const pickupsPool: WorldPickup[] = Array.from({ length: MAX_PICKUPS }, (_, idx) => {
      const kind = idx % 5 === 0 ? 'cocoa' : 'coin';
      const g = new THREE.Group();
      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.48, 12),
        new THREE.MeshBasicMaterial({
          map: shadowTex,
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
        }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.02;
      g.add(shadow);

      if (kind === 'coin') {
        const coin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.36, 0.36, 0.12, 16).rotateX(Math.PI / 2),
          coinMat,
        );
        coin.scale.set(0.82, 1.18, 1);
        coin.position.y = 0.55;
        g.add(coin);
      } else {
        const mug = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.25, 0.52, 14),
          cocoaMugMat,
        );
        mug.position.y = 0.46;
        g.add(mug);
        const foam = new THREE.Mesh(
          new THREE.SphereGeometry(0.24, 10, 10),
          new THREE.MeshBasicMaterial({ color: 0xfff8e7 }),
        );
        foam.position.y = 0.72;
        g.add(foam);
      }
      g.visible = false;
      pickupsGroup.add(g);
      return {
        active: false,
        x: 0,
        z: 0,
        kind,
        spin: idx * 0.5,
        mesh: g,
      };
    });

    function spawnWorldPickup(x: number, z: number, preferKind?: 'coin' | 'cocoa') {
      const slot = pickupsPool.find(
        (p) => !p.active && (!preferKind || p.kind === preferKind),
      );
      if (!slot) return;
      slot.active = true;
      slot.x = x;
      slot.z = z;
      slot.mesh.position.set(x, 0, z);
      slot.mesh.visible = true;
    }

    // 12. Winter Critter / Hazard Entities & 3D Rigs
    const hazardGroup = new THREE.Group();
    scene.add(hazardGroup);
    let hazards: HazardEntity[] = [];
    let hazardRigs: HazardVisualRig[] = [];

    // Simulation state variables
    let playerX = 0;
    let playerZ = 8.5;
    let playerHeading = Math.PI; // Facing North (-Z) along clear open shrine avenue
    let playerSpeed = 0;
    let warmthPips = 3;
    let invulnTimer = 0;
    let boostEnergy = 100;
    let isBoosting = false;
    let score = 0;
    let stageElapsedSec = 0;
    let hitstopTimer = 0;
    let cameraTrauma = 0;
    let squashX = 1;
    let squashY = 1;
    let squashZ = 1;
    let totalSnowCount = 1;
    let clearedSnowCount = 0;
    let comboState: ComboState = {
      count: 0,
      multiplier: 1,
      timer: 0,
      maxTimer: 3.0,
      maxComboReached: 0,
    };
    let outcomePendingTimer = 0;
    let pendingOutcomeType: OutcomeType = null;

    function updateSnowInstances() {
      for (let i = 0; i < maxSnowCells; i++) {
        const cell = snowCells[i];
        if (!cell || cell.health <= 0) {
          _pos.set(0, -20, 0);
          _scale.set(0.001, 0.001, 0.001);
          _quat.identity();
          _mat4.compose(_pos, _quat, _scale);
          snowInstMesh.setMatrixAt(i, _mat4);
        } else {
          const hRatio = cell.health / cell.maxHealth;
          _pos.set(cell.x, 0, cell.z);
          _quat.identity();
          const sy = (cell.isDeep ? 1.55 : 0.85) * (0.45 + 0.55 * hRatio);
          _scale.set(1, sy, 1);
          _mat4.compose(_pos, _quat, _scale);
          snowInstMesh.setMatrixAt(i, _mat4);
          snowInstMesh.setColorAt(
            i,
            _color.setHex(cell.isDeep ? 0x93c5fd : 0xf8fbff),
          );
        }
      }
      snowInstMesh.instanceMatrix.needsUpdate = true;
      if (snowInstMesh.instanceColor) snowInstMesh.instanceColor.needsUpdate = true;
    }

    function buildStageWorld(idx: number) {
      const stage = STAGES[idx] || STAGES[0];
      const stats = computeTruckStats(propsRef.current.upgradeLevels);

      scene.background = new THREE.Color(stage.skyTopHex);
      scene.fog = new THREE.FogExp2(stage.skyTopHex, 0.0145);

      // Reset player on open spawn path (0, 8.5) facing clear northern avenue
      playerX = 0;
      playerZ = 9.0;
      playerHeading = Math.PI;
      playerSpeed = 0;
      warmthPips = stats.maxWarmthPips;
      invulnTimer = 0;
      boostEnergy = stats.maxBoostEnergy;
      isBoosting = false;
      score = 0;
      stageElapsedSec = 0;
      hitstopTimer = 0;
      cameraTrauma = 0;
      squashX = 1;
      squashY = 1;
      squashZ = 1;
      outcomePendingTimer = 0;
      pendingOutcomeType = null;
      comboState = {
        count: 0,
        multiplier: 1,
        timer: 0,
        maxTimer: 3.0,
        maxComboReached: 0,
      };

      // Populate snow cells across the village grid, keeping a 2-tile-wide spawn pad clear around (0, 9.0)
      snowCells.length = 0;
      const step = 1.78;
      const R = stage.gridRadius;
      let cellIdx = 0;
      for (let gx = -R; gx <= R; gx++) {
        for (let gz = -R; gz <= R; gz++) {
          if (cellIdx >= maxSnowCells) break;
          const distGrid = Math.hypot(gx, gz);
          if (distGrid > R + 0.35) continue;

          const wx = gx * step;
          const wz = gz * step;

          // Keep immediate spawn pad (radius 3.2m around 0, 9.0) open so player spawns on an open path
          if (Math.hypot(wx - 0, wz - 9.0) < 3.1) continue;
          // Keep lantern post bases clear
          if (lanternPositions.some(([lx, , lz]) => Math.hypot(wx - lx, wz - lz) < 1.3)) {
            continue;
          }

          const hash = Math.abs(Math.sin(gx * 12.9898 + gz * 78.233));
          const isDeep = hash < stage.deepSnowRatio;
          snowCells.push({
            x: wx,
            z: wz,
            maxHealth: isDeep ? 2 : 1,
            health: isDeep ? 2 : 1,
            scaleY: isDeep ? 1.55 : 0.85,
            isDeep,
          });
          cellIdx++;
        }
      }
      totalSnowCount = Math.max(1, snowCells.length);
      clearedSnowCount = 0;
      updateSnowInstances();

      // Seed initial Golden Coins & Cocoa Mugs along the avenue so player immediately sees pickups
      pickupsPool.forEach((p) => {
        p.active = false;
        p.mesh.visible = false;
      });
      const initialCoinCoords: [number, number][] = [
        [0, 3.5],
        [0, 1.2],
        [0, -1.2],
        [-4.5, -3.5],
        [4.5, -3.5],
        [-7.5, 2.5],
        [7.5, 2.5],
      ];
      initialCoinCoords.forEach(([cx, cz], i) => {
        spawnWorldPickup(cx, cz, i === 4 ? 'cocoa' : 'coin');
      });

      // Rebuild Winter Critters / Hazards (3 distinct archetypes)
      hazardGroup.clear();
      hazards = [];
      hazardRigs = [];

      const spawnSpecs: { archetype: HazardArchetype; x: number; z: number; r: number }[] = [];
      for (let i = 0; i < stage.hazardBudget.chargers; i++) {
        spawnSpecs.push({
          archetype: 'charger',
          x: i % 2 === 0 ? -11.5 : 11.5,
          z: -6.5 - i * 4,
          r: 4,
        });
      }
      for (let i = 0; i < stage.hazardBudget.orbiters; i++) {
        spawnSpecs.push({
          archetype: 'orbiter',
          x: i % 2 === 0 ? 9.5 : -9.5,
          z: 1.5 - i * 6,
          r: 6.2,
        });
      }
      for (let i = 0; i < stage.hazardBudget.kiters; i++) {
        spawnSpecs.push({
          archetype: 'kiter',
          x: i % 2 === 0 ? -6.5 : 6.5,
          z: -12.5 + i * 4,
          r: 4.5,
        });
      }

      spawnSpecs.forEach((sp, i) => {
        const rig = createHazardCritterModel(sp.archetype, shadowTex);
        rig.root.position.set(sp.x, 0, sp.z);
        hazardGroup.add(rig.root);
        hazardRigs.push(rig);

        hazards.push({
          id: i + 1,
          archetype: sp.archetype,
          phase: 'patrol',
          phaseTimer: 1.8 + i * 0.6, // Safe opening seconds without instant attack
          x: sp.x,
          z: sp.z,
          vx: 0,
          vz: 0,
          heading: 0,
          homeX: sp.x,
          homeZ: sp.z,
          orbitAngle: i * 1.4,
          orbitRadius: sp.r,
          targetX: sp.x,
          targetZ: sp.z,
          hitFlashTimer: 0,
        });
      });
    }

    resetStageFnRef.current = buildStageWorld;
    buildStageWorld(propsRef.current.stageIndex);

    // Pre-warm shaders on hardware GPUs
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 13. Unified Input Hub (Held vs JustPressed + Focus-loss clearing + Pointer steering)
    const keysHeld = new Set<string>();
    const keysJustPressed = new Set<string>();
    let pointerSteeringActive = false;
    let pointerNormX = 0;
    let pointerNormY = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const code = e.code;
      keysHeld.add(code);
      keysJustPressed.add(code);

      const p = propsRef.current.phase;
      if (p === 'title' && (code === 'Enter' || code === 'Space')) {
        e.preventDefault();
        propsRef.current.onPhaseChange('playing');
      } else if (p === 'playing' && (code === 'Escape' || code === 'KeyP')) {
        e.preventDefault();
        propsRef.current.onPhaseChange('paused');
      } else if (p === 'paused' && (code === 'Escape' || code === 'KeyP')) {
        e.preventDefault();
        propsRef.current.onPhaseChange('playing');
      } else if (code === 'KeyM') {
        propsRef.current.onToggleMuteKey();
      } else if (code === 'KeyH') {
        propsRef.current.onToggleDockKey();
      } else if (p === 'playing' && code === 'KeyR') {
        buildStageWorld(propsRef.current.stageIndex);
      } else if (p === 'playing') {
        if (code === 'Digit1') propsRef.current.onQuickUpgradeKey(0);
        if (code === 'Digit2') propsRef.current.onQuickUpgradeKey(1);
        if (code === 'Digit3') propsRef.current.onQuickUpgradeKey(2);
        if (code === 'Digit4') propsRef.current.onQuickUpgradeKey(3);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysHeld.delete(e.code);
    };

    const clearInputs = () => {
      keysHeld.clear();
      keysJustPressed.clear();
      pointerSteeringActive = false;
    };

    const updatePointerNorm = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointerNormX = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNormY = ((clientY - rect.top) / rect.height) * 2 - 1;
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (propsRef.current.phase !== 'playing') return;
      pointerSteeringActive = true;
      updatePointerNorm(e.clientX, e.clientY);
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (!pointerSteeringActive) return;
      updatePointerNorm(e.clientX, e.clientY);
    };
    const handlePointerUp = () => {
      pointerSteeringActive = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearInputs);
    document.addEventListener('visibilitychange', clearInputs);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Live ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(1, entry.contentRect.width);
        const h = Math.max(1, entry.contentRect.height);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(mount);

    // 14. Main Simulation & Render Loop (with Software-WebGL afterDraw pacing)
    let frameId = 0;
    let lastTime = performance.now();
    let titleOrbitAngle = 0.65;
    let lastHudEmitAt = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (!sync) {
          frameId = window.setTimeout(cb, 80);
          return;
        }
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      // Clamped dt <= 0.05s
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      const currentPhase = propsRef.current.phase;
      const stage = STAGES[propsRef.current.stageIndex] || STAGES[0];
      const stats = computeTruckStats(propsRef.current.upgradeLevels);

      // Update visual scale of the V-plow blade to reflect upgrade level!
      const targetBladeScaleX = 1 + (propsRef.current.upgradeLevels.blade - 1) * 0.24;
      truckRig.plowAssembly.scale.x = THREE.MathUtils.damp(
        truckRig.plowAssembly.scale.x,
        targetBladeScaleX,
        8,
        dt,
      );

      // Ambient falling snowflakes update in all non-paused phases
      if (currentPhase !== 'paused') {
        for (let i = 0; i < MAX_SNOWFLAKES; i++) {
          const f = flakeCoords[i];
          f.y -= (2.1 + (i % 3) * 0.4) * dt;
          f.x += Math.sin(now * 0.001 + i) * f.drift * dt;
          if (f.y < 0.1) f.y = 17.5;
          _pos.set(f.x, f.y, f.z);
          _quat.identity();
          _scale.setScalar(1);
          _mat4.compose(_pos, _quat, _scale);
          flakeInst.setMatrixAt(i, _mat4);
        }
        flakeInst.instanceMatrix.needsUpdate = true;
      }

      if (currentPhase === 'title') {
        // Live World Camera Tour / Hero Centerpiece Showcase
        titleOrbitAngle += dt * 0.22;
        const camR = 21.5;
        _camDesired.set(
          Math.sin(titleOrbitAngle) * camR,
          13.5 + Math.sin(titleOrbitAngle * 1.5) * 1.5,
          Math.cos(titleOrbitAngle) * camR,
        );
        camera.position.lerp(_camDesired, 1 - Math.exp(-4 * dt));
        _camTarget.set(0, 1.5, -2.5);
        camera.lookAt(_camTarget);

        // Idle engine bob on the hero kei-truck
        truckRig.root.position.set(0, 0, 8.5);
        truckRig.root.rotation.y = Math.PI + Math.sin(now * 0.0015) * 0.12;
        truckRig.bodyGroup.position.y = Math.sin(now * 0.014) * 0.03;
      } else if (currentPhase === 'playing') {
        // Tick hitstop timer in real dt
        if (hitstopTimer > 0) {
          hitstopTimer = Math.max(0, hitstopTimer - dt);
        }
        const simDt = hitstopTimer > 0 ? 0 : dt;

        // Tick invulnerability & camera trauma in real dt
        invulnTimer = Math.max(0, invulnTimer - dt);
        cameraTrauma = Math.max(0, cameraTrauma - dt * 1.85);

        // Recover squash-and-stretch
        squashX = THREE.MathUtils.damp(squashX, 1, 10, dt);
        squashY = THREE.MathUtils.damp(squashY, 1, 10, dt);
        squashZ = THREE.MathUtils.damp(squashZ, 1, 10, dt);
        truckRig.bodyGroup.scale.set(squashX, squashY, squashZ);

        if (outcomePendingTimer > 0) {
          outcomePendingTimer -= dt;
          if (outcomePendingTimer <= 0 && pendingOutcomeType) {
            const clearedPct = calculateClearancePercentage(
              clearedSnowCount,
              totalSnowCount,
            );
            const snap: RunSnapshot = {
              stageIndex: stage.index,
              stageName: stage.name,
              outcome: pendingOutcomeType,
              score,
              bestScore: Math.max(propsRef.current.bestScore, score),
              coinsEarned:
                pendingOutcomeType === 'victory' ? stage.clearBonusCoins : 25,
              clearedPercent: clearedPct,
              targetPercent: stage.targetClearPercent,
              maxCombo: comboState.maxComboReached,
              clearTimeSec: Math.round(stageElapsedSec),
              warmthRemaining: warmthPips,
              maxWarmth: stats.maxWarmthPips,
            };
            propsRef.current.onPhaseChange('gameover', pendingOutcomeType, snap);
            pendingOutcomeType = null;
          }
        } else if (simDt > 0) {
          stageElapsedSec += simDt;

          // 1. Read driving inputs (Isometric world-aligned + tank/steering options)
          let inputX = 0;
          let inputZ = 0;
          if (keysHeld.has('KeyW') || keysHeld.has('ArrowUp')) inputZ -= 1;
          if (keysHeld.has('KeyS') || keysHeld.has('ArrowDown')) inputZ += 1;
          if (keysHeld.has('KeyA') || keysHeld.has('ArrowLeft')) inputX -= 1;
          if (keysHeld.has('KeyD') || keysHeld.has('ArrowRight')) inputX += 1;

          if (pointerSteeringActive && Math.hypot(pointerNormX, pointerNormY) > 0.08) {
            inputX = pointerNormX;
            inputZ = pointerNormY;
          }

          // Edge-triggered Boost ignition sound + continuous boost hold
          const boostHeld =
            keysHeld.has('Space') || keysHeld.has('ShiftLeft') || keysHeld.has('ShiftRight');
          if (
            (keysJustPressed.has('Space') || keysJustPressed.has('ShiftLeft')) &&
            boostEnergy > 15
          ) {
            synthAudio.playBoostBurst();
            squashX = 0.86;
            squashY = 1.14;
            squashZ = 1.18;
          }

          if (boostHeld && boostEnergy > 2 && Math.hypot(inputX, inputZ) > 0.05) {
            isBoosting = true;
            boostEnergy = Math.max(0, boostEnergy - stats.boostDrainRate * simDt);
          } else {
            isBoosting = false;
            boostEnergy = Math.min(
              stats.maxBoostEnergy,
              boostEnergy + stats.boostRechargeRate * simDt,
            );
          }

          const inputLen = Math.hypot(inputX, inputZ);
          const targetTopSpeed = isBoosting ? stats.boostSpeed : stats.maxSpeed;
          if (inputLen > 0.05) {
            const nx = inputX / inputLen;
            const nz = inputZ / inputLen;
            const desiredHeading = Math.atan2(nx, nz);

            // Smooth shortest-angle turn
            let diff = desiredHeading - playerHeading;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            playerHeading += diff * Math.min(1, 11.5 * simDt);

            playerSpeed = THREE.MathUtils.damp(
              playerSpeed,
              targetTopSpeed * Math.min(1, inputLen),
              7.5,
              simDt,
            );
          } else {
            playerSpeed = THREE.MathUtils.damp(playerSpeed, 0, 8.5, simDt);
          }

          const moveX = Math.sin(playerHeading) * playerSpeed * simDt;
          const moveZ = Math.cos(playerHeading) * playerSpeed * simDt;
          playerX += moveX;
          playerZ += moveZ;

          // Keep truck inside circular village arena (radius 23.5m)
          const arenaR = 23.5;
          const pDist = Math.hypot(playerX, playerZ);
          if (pDist > arenaR) {
            playerX = (playerX / pDist) * arenaR;
            playerZ = (playerZ / pDist) * arenaR;
          }

          // Update truck transform & distance-synced wheel spin + suspension bob
          const distStep = Math.hypot(moveX, moveZ);
          truckRig.root.position.set(playerX, 0, playerZ);
          truckRig.root.rotation.y = playerHeading;
          truckRig.wheels.forEach((w) => {
            w.rotation.x += distStep * 2.8;
          });
          truckRig.bodyGroup.position.y =
            Math.abs(Math.sin(now * 0.018)) * (playerSpeed / targetTopSpeed) * 0.06;
          truckRig.cocoaSteamMesh.position.y = 1.74 + Math.sin(now * 0.008) * 0.1;

          // 2. Snow Plowing Collision at the Front V-Blade & Hull
          const bladeWorldX = playerX + Math.sin(playerHeading) * 1.45;
          const bladeWorldZ = playerZ + Math.cos(playerHeading) * 1.45;
          const halfSwath = stats.plowWidth * 0.68;
          const halfSwathSq = halfSwath * halfSwath;

          let tilesClearedThisFrame = 0;
          let hitDeepSnow = false;
          let dirtySnowMesh = false;

          for (let i = 0; i < snowCells.length; i++) {
            const cell = snowCells[i];
            if (cell.health <= 0) continue;
            const dxBlade = cell.x - bladeWorldX;
            const dzBlade = cell.z - bladeWorldZ;
            const dxHull = cell.x - playerX;
            const dzHull = cell.z - playerZ;
            if (
              dxBlade * dxBlade + dzBlade * dzBlade <= halfSwathSq ||
              dxHull * dxHull + dzHull * dzHull <= halfSwathSq * 0.75
            ) {
              const dmg = isBoosting || stats.plowPower >= 1.45 ? 2 : 1;
              cell.health = Math.max(0, cell.health - dmg);
              dirtySnowMesh = true;

              if (cell.health <= 0) {
                clearedSnowCount++;
                tilesClearedThisFrame++;
                if (cell.isDeep) hitDeepSnow = true;
                spawnParticles(
                  cell.x,
                  0.35,
                  cell.z,
                  cell.isDeep ? 7 : 4,
                  'snow',
                  isBoosting ? 1.35 : 1.0,
                );
                // Chance to uncover buried Yen Coin or Hot Cocoa pickup
                if (Math.random() < (cell.isDeep ? 0.24 : 0.11)) {
                  spawnWorldPickup(
                    cell.x,
                    cell.z,
                    Math.random() < 0.16 ? 'cocoa' : 'coin',
                  );
                }
              } else {
                // Partially chipped deep snow drift
                spawnParticles(cell.x, 0.45, cell.z, 3, 'snow', 0.8);
                playerSpeed *= 0.86;
              }
            }
          }

          if (dirtySnowMesh) {
            updateSnowInstances();
          }

          if (tilesClearedThisFrame > 0) {
            const comboRes = registerSnowClearedOnCombo(
              comboState,
              tilesClearedThisFrame,
              hitDeepSnow ? 40 : 25,
            );
            comboState = comboRes.combo;
            score += comboRes.pointsAwarded;

            // Award direct plowing Yen Coins scaled by combo multiplier
            const directCoins = Math.max(
              1,
              Math.round(
                tilesClearedThisFrame *
                  1.5 *
                  stats.coinValueMultiplier *
                  (1 + (comboState.multiplier - 1) * 0.25),
              ),
            );
            propsRef.current.onCoinsChange(propsRef.current.coins + directCoins);

            synthAudio.playSnowClear(
              comboState.count,
              comboState.multiplier,
              hitDeepSnow,
            );
            if (comboRes.tierUp) {
              synthAudio.playComboTierUp(comboState.multiplier);
              squashX = 1.12;
              squashY = 0.9;
              squashZ = 1.12;
            }
            if (hitDeepSnow) {
              cameraTrauma = Math.min(0.45, cameraTrauma + 0.14);
            }

            // Check stage win target!
            const clearedPct = calculateClearancePercentage(
              clearedSnowCount,
              totalSnowCount,
            );
            if (isStageTargetMet(clearedPct, stage.targetClearPercent)) {
              synthAudio.playOutcomeSting(true);
              propsRef.current.onCoinsChange(
                propsRef.current.coins + stage.clearBonusCoins,
              );
              pendingOutcomeType = 'victory';
              outcomePendingTimer = 0.45;
            }
          } else {
            comboState = tickComboState(comboState, simDt);
          }

          // 3. Collect World Pickups (with Maneki Magnet pull)
          const magnetSq = stats.coinMagnetRadius * stats.coinMagnetRadius;
          for (let i = 0; i < pickupsPool.length; i++) {
            const p = pickupsPool[i];
            if (!p.active) continue;
            p.spin += 2.6 * simDt;
            p.mesh.rotation.y = p.spin;

            const dx = playerX - p.x;
            const dz = playerZ - p.z;
            const dSq = dx * dx + dz * dz;
            if (dSq < magnetSq && dSq > 0.01) {
              const d = Math.sqrt(dSq);
              p.x += (dx / d) * 11.5 * simDt;
              p.z += (dz / d) * 11.5 * simDt;
              p.mesh.position.set(p.x, 0, p.z);
            }
            if (dSq < 1.35) {
              p.active = false;
              p.mesh.visible = false;
              synthAudio.playPickup(p.kind);
              spawnParticles(
                p.x,
                0.5,
                p.z,
                8,
                p.kind === 'coin' ? 'gold' : 'snow',
                1.1,
              );
              if (p.kind === 'coin') {
                const coinBonus = Math.round(12 * stats.coinValueMultiplier);
                propsRef.current.onCoinsChange(propsRef.current.coins + coinBonus);
                score += coinBonus * comboState.multiplier;
              } else {
                warmthPips = Math.min(stats.maxWarmthPips, warmthPips + 1);
                boostEnergy = stats.maxBoostEnergy;
              }
            }
          }

          // 4. Step the 3 Winter Critter/Hazard Archetypes (with Attack Token Pool <= 2 concurrent windups)
          let activeWindupCount = hazards.filter(
            (h) => h.phase === 'windup' || h.phase === 'active',
          ).length;

          for (let i = 0; i < hazards.length; i++) {
            const canWindup = activeWindupCount < 2;
            const res = stepHazardBehavior(
              hazards[i],
              playerX,
              playerZ,
              simDt,
              canWindup,
            );
            hazards[i] = res.hazard;
            const h = hazards[i];
            const rig = hazardRigs[i];

            if (res.triggeredWindup) {
              activeWindupCount++;
              synthAudio.playHazardTelegraph();
            }

            // If Frost Sprite completes its windup ring, refreeze up to 4 nearby cleared snow cells
            if (res.triggeredFrostPulse) {
              spawnParticles(h.x, 0.6, h.z, 14, 'frost', 1.2);
              let refrozen = 0;
              for (let c = 0; c < snowCells.length && refrozen < 4; c++) {
                const cell = snowCells[c];
                if (
                  cell.health <= 0 &&
                  Math.hypot(cell.x - h.x, cell.z - h.z) < 3.6
                ) {
                  cell.health = 1;
                  clearedSnowCount = Math.max(0, clearedSnowCount - 1);
                  refrozen++;
                }
              }
              if (refrozen > 0) updateSnowInstances();
            }

            // Update 3D visual rig & windup telegraphs
            rig.root.position.set(h.x, 0, h.z);
            rig.bodyGroup.rotation.y = h.heading;
            rig.bodyGroup.position.y =
              h.phase === 'ko'
                ? Math.max(0, Math.sin(h.phaseTimer * 5) * 0.8)
                : Math.abs(Math.sin(now * 0.008 + i)) * 0.12;
            rig.bodyGroup.rotation.z = h.phase === 'ko' ? h.phaseTimer * 6 : 0;

            // Hit flash emissive highlight
            if (h.hitFlashTimer > 0) {
              rig.primaryMat.emissive.setHex(0xffffff);
              rig.primaryMat.emissiveIntensity = 1.6;
            } else if (h.phase === 'windup') {
              rig.primaryMat.emissive.setHex(0xff4d6d);
              rig.primaryMat.emissiveIntensity = 0.85;
            } else {
              rig.primaryMat.emissive.setHex(
                h.archetype === 'kiter' ? 0x00b4d8 : 0x000000,
              );
              rig.primaryMat.emissiveIntensity = h.archetype === 'kiter' ? 0.45 : 0;
            }

            // Ground telegraph ring & sight-line visibility
            const ringMat = rig.telegraphRing.material as THREE.MeshBasicMaterial;
            if (h.phase === 'windup' || h.phase === 'active') {
              ringMat.opacity = h.phase === 'windup' ? 0.78 : 0.45;
              const pulse = 1 + Math.sin(now * 0.025) * 0.18;
              rig.telegraphRing.scale.setScalar(
                h.archetype === 'kiter' ? 2.4 * pulse : 1.2 * pulse,
              );
            } else {
              ringMat.opacity = 0;
            }

            if (rig.telegraphLine) {
              const lineMat = rig.telegraphLine.material as THREE.MeshBasicMaterial;
              if (h.phase === 'windup') {
                lineMat.opacity = 0.72;
                rig.telegraphLine.rotation.z = -h.heading;
              } else {
                lineMat.opacity = 0;
              }
            }

            // Player <-> Critter Collision
            if (h.phase !== 'ko') {
              const cdx = playerX - h.x;
              const cdz = playerZ - h.z;
              const cDist = Math.hypot(cdx, cdz);
              if (cDist < 1.55) {
                if (isBoosting || propsRef.current.upgradeLevels.blade >= 3) {
                  // Player bashes critter into a comical KO arc!
                  h.phase = 'ko';
                  h.phaseTimer = 1.1;
                  h.hitFlashTimer = 0.14;
                  const nx = cDist > 0.01 ? -cdx / cDist : 1;
                  const nz = cDist > 0.01 ? -cdz / cDist : 0;
                  h.vx = nx * 15;
                  h.vz = nz * 15;
                  score += 150 * comboState.multiplier;
                  hitstopTimer = 0.045;
                  cameraTrauma = Math.min(0.75, cameraTrauma + 0.38);
                  squashX = 1.22;
                  squashY = 0.78;
                  squashZ = 1.15;
                  spawnParticles(h.x, 0.8, h.z, 18, 'gold', 1.4);
                  synthAudio.playHeavyImpact(false);
                } else if (invulnTimer <= 0) {
                  // Critter bumps the truck, chilling 1 Warmth Pip
                  warmthPips = Math.max(0, warmthPips - 1);
                  invulnTimer = 1.6;
                  h.hitFlashTimer = 0.12;
                  h.phase = 'recovery';
                  h.phaseTimer = 1.4;
                  hitstopTimer = 0.055;
                  cameraTrauma = Math.min(0.9, cameraTrauma + 0.55);
                  squashX = 1.26;
                  squashY = 0.74;
                  squashZ = 0.88;
                  const nx = cDist > 0.01 ? cdx / cDist : 0;
                  const nz = cDist > 0.01 ? cdz / cDist : 1;
                  playerX += nx * 1.4;
                  playerZ += nz * 1.4;
                  playerSpeed = -3.5;
                  spawnParticles(playerX, 0.8, playerZ, 20, 'frost', 1.35);
                  synthAudio.playHeavyImpact(true);

                  if (warmthPips <= 0) {
                    synthAudio.playOutcomeSting(false);
                    pendingOutcomeType = 'defeat';
                    outcomePendingTimer = 0.55;
                  }
                }
              }
            }
          }
        }

        // 5. Update Pooled Particle Ring Buffer in place
        for (let i = 0; i < MAX_PARTICLES; i++) {
          const p = particles[i];
          if (!p.active) {
            _pos.set(0, -30, 0);
            _scale.setScalar(0.001);
            _mat4.compose(_pos, _quat.identity(), _scale);
            particleInst.setMatrixAt(i, _mat4);
            continue;
          }
          p.age += dt;
          if (p.age >= p.maxAge) {
            p.active = false;
            continue;
          }
          p.vy -= 9.8 * dt;
          p.x += p.vx * dt;
          p.y = Math.max(0.05, p.y + p.vy * dt);
          p.z += p.vz * dt;
          const lifeLeft = 1 - p.age / p.maxAge;
          _pos.set(p.x, p.y, p.z);
          _scale.setScalar(p.size * lifeLeft);
          _mat4.compose(_pos, _quat.identity(), _scale);
          particleInst.setMatrixAt(i, _mat4);
          particleInst.setColorAt(
            i,
            _color.setHex(
              p.kind === 'gold'
                ? 0xffd166
                : p.kind === 'frost'
                  ? 0x72efdd
                  : 0xffffff,
            ),
          );
        }
        particleInst.instanceMatrix.needsUpdate = true;
        if (particleInst.instanceColor) particleInst.instanceColor.needsUpdate = true;

        // 6. Smooth Exponentially Damped Camera Follow + Trauma Shake
        const preset = propsRef.current.cameraPreset;
        if (preset === 'isometric') {
          _camDesired.set(playerX + 14.5, 16.5, playerZ + 14.5);
        } else if (preset === 'chase') {
          _camDesired.set(
            playerX - Math.sin(playerHeading) * 9.5,
            8.2,
            playerZ - Math.cos(playerHeading) * 9.5,
          );
        } else {
          _camDesired.set(playerX * 0.35 + 19.5, 25.5, playerZ * 0.35 + 19.5);
        }

        const dampFactor = 1 - Math.exp(-6.5 * dt);
        camera.position.lerp(_camDesired, dampFactor);

        const shakeMag = cameraTrauma * cameraTrauma * 0.65;
        const shakeX = (Math.random() - 0.5) * shakeMag;
        const shakeY = (Math.random() - 0.5) * shakeMag;

        _camTarget.set(
          playerX + Math.sin(playerHeading) * 1.8 + shakeX,
          0.9 + shakeY,
          playerZ + Math.cos(playerHeading) * 1.8,
        );
        camera.lookAt(_camTarget);
      }

      // Clear single-frame edge triggers
      keysJustPressed.clear();

      // Throttle React HUD telemetry updates to ~10Hz (every 95ms)
      if (now - lastHudEmitAt >= 95) {
        lastHudEmitAt = now;
        const clearedPct = calculateClearancePercentage(
          clearedSnowCount,
          totalSnowCount,
        );
        const warningCritter = hazards.find((h) => h.phase === 'windup');
        let warningLabel: string | null = null;
        if (warningCritter) {
          warningLabel =
            warningCritter.archetype === 'charger'
              ? 'Snow-Boar Charge Incoming!'
              : warningCritter.archetype === 'kiter'
                ? 'Frost Sprite Casting Freeze Ring!'
                : 'Snowball Spirit Accelerating!';
        }
        propsRef.current.onHudUpdate({
          score,
          bestScore: Math.max(propsRef.current.bestScore, score),
          coins: propsRef.current.coins,
          clearedPercent: clearedPct,
          targetPercent: stage.targetClearPercent,
          comboCount: comboState.count,
          comboMultiplier: comboState.multiplier,
          comboTimerRatio:
            comboState.maxTimer > 0 ? comboState.timer / comboState.maxTimer : 0,
          warmthPips,
          maxWarmthPips: stats.maxWarmthPips,
          damagedFlash: invulnTimer > 1.15,
          boostEnergyRatio:
            stats.maxBoostEnergy > 0 ? boostEnergy / stats.maxBoostEnergy : 0,
          isBoosting,
          stageIndex: stage.index,
          stageName: stage.name,
          stageJpName: stage.jpName,
          speedKmh: Math.round(Math.abs(playerSpeed) * 4.2),
          activeCritterWarning: warningLabel,
        });
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearInputs);
      document.removeEventListener('visibilitychange', clearInputs);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={canvasMountRef}
      className="fixed inset-0 w-full h-full overflow-hidden"
      aria-label="3D Isometric Snow Plowing Arena"
    />
  );
};
