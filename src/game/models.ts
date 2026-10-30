import * as THREE from 'three';
import type { HazardArchetype } from './rules';

/**
 * Procedural CanvasTextures & 3–12 Part Composite THREE.Group Builders
 * All models pivot at bottom-center (y = 0) so they sit flush on groundHeightAt(x, z).
 */

export function createRadialShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(14, 23, 46, 0.72)');
  grad.addColorStop(0.55, 'rgba(14, 23, 46, 0.32)');
  grad.addColorStop(1, 'rgba(14, 23, 46, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createCobbleRoadTexture(maxAnisotropy: number): {
  albedo: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const size = 256;
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const ctx = albedoCanvas.getContext('2d')!;

  // Warm anime slate-stone cobblestone base
  ctx.fillStyle = '#33415c';
  ctx.fillRect(0, 0, size, size);

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#404040';
  bCtx.fillRect(0, 0, size, size);

  const rows = 8;
  const cols = 6;
  const cellW = size / cols;
  const cellH = size / rows;

  const tones = ['#3d4e6d', '#46587a', '#384766', '#4f6286'];

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cellW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const x = c * cellW + offset + 3;
      const y = r * cellH + 3;
      const w = cellW - 6;
      const h = cellH - 6;

      ctx.fillStyle = tones[(r * 3 + c + 10) % tones.length];
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6);
      ctx.fill();

      // Subtle snow frost in crevices & top highlight
      ctx.strokeStyle = 'rgba(218, 234, 255, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      bCtx.fillStyle = '#d8d8d8';
      bCtx.beginPath();
      bCtx.roundRect(x, y, w, h, 6);
      bCtx.fill();
    }
  }

  const albedo = new THREE.CanvasTexture(albedoCanvas);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.wrapS = THREE.RepeatWrapping;
  albedo.wrapT = THREE.RepeatWrapping;
  albedo.repeat.set(14, 14);
  albedo.anisotropy = maxAnisotropy;

  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(14, 14);
  bump.anisotropy = maxAnisotropy;

  return { albedo, bump };
}

export function createTruckLiveryTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Warm tangerine & cream Hokkaido Express stripes
  ctx.fillStyle = '#ff7847';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#fff5e4';
  ctx.fillRect(0, 96, 256, 46);

  ctx.fillStyle = '#ffd166';
  ctx.fillRect(0, 142, 256, 14);

  // Cute snow emblem circle on door
  ctx.fillStyle = '#1d2d44';
  ctx.beginPath();
  ctx.arc(128, 118, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fffaf0';
  ctx.beginPath();
  ctx.arc(128, 118, 14, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export interface KeiTruckRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  plowAssembly: THREE.Group;
  wheels: THREE.Mesh[];
  frontWheelPivots: THREE.Group[];
  tailLightMat: THREE.MeshStandardMaterial;
  headlightMat: THREE.MeshStandardMaterial;
  headlightBeams: THREE.Group;
  beaconLightMesh: THREE.Mesh;
  cocoaSteamMesh: THREE.Mesh;
}

/**
 * Builds the 11-part Composite Anime Kei-Truck Snowplow ("Hokkaido Kuma-Go").
 * Grounded at y = 0. Faces +Z in local coordinates.
 */
export function createKeiTruckModel(
  liveryTex: THREE.CanvasTexture,
  shadowTex: THREE.CanvasTexture,
): KeiTruckRig {
  const root = new THREE.Group();

  // Contact shadow disc
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(1.75, 24), shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.set(0, 0.018, 0.15);
  root.add(shadowDisc);

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  // Materials with varied roughness (>= 0.25 delta between adjacent parts)
  const cabPaintMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: liveryTex,
    roughness: 0.42,
    metalness: 0.15,
  });
  const creamRoofMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e4,
    roughness: 0.72,
    metalness: 0.05,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x8be9fd,
    roughness: 0.12,
    metalness: 0.25,
    emissive: 0x2a6f97,
    emissiveIntensity: 0.35,
  });
  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.82,
    metalness: 0.2,
  });
  const woodBedMat = new THREE.MeshStandardMaterial({
    color: 0xb07d4f,
    roughness: 0.85,
    metalness: 0.05,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.22,
    metalness: 0.78,
  });
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfff3b0,
    emissive: 0xffd166,
    emissiveIntensity: 1.6,
    roughness: 0.15,
  });

  // 1. Primary Silhouette: Chassis & Lower Skirt
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.32, 2.55), darkTrimMat);
  chassis.position.set(0, 0.38, 0);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  bodyGroup.add(chassis);

  // 2. Forward Kei-Cab Main Hull
  const cabHull = new THREE.Mesh(new THREE.BoxGeometry(1.48, 1.08, 1.18), cabPaintMat);
  cabHull.position.set(0, 1.02, 0.62);
  cabHull.castShadow = true;
  cabHull.receiveShadow = true;
  bodyGroup.add(cabHull);

  // 3. Rounded Cream Roof Cap & Cute Kuma-Ears
  const roofCap = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.16, 1.08), creamRoofMat);
  roofCap.position.set(0, 1.62, 0.6);
  roofCap.castShadow = true;
  bodyGroup.add(roofCap);

  const earGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16);
  [-0.45, 0.45].forEach((xOff) => {
    const ear = new THREE.Mesh(earGeo, creamRoofMat);
    ear.rotation.x = Math.PI / 2;
    ear.position.set(xOff, 1.72, 0.85);
    bodyGroup.add(ear);
  });

  // 4. Glossy Windshield & Side Windows
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.46, 0.08), glassMat);
  windshield.position.set(0, 1.18, 1.2);
  bodyGroup.add(windshield);

  const sideWindows = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.4, 0.78), glassMat);
  sideWindows.position.set(0, 1.18, 0.62);
  bodyGroup.add(sideWindows);

  // 5. Rear Timber Flatbed & Side Rails
  const flatbed = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.42, 1.28), woodBedMat);
  flatbed.position.set(0, 0.72, -0.62);
  flatbed.castShadow = true;
  flatbed.receiveShadow = true;
  bodyGroup.add(flatbed);

  // 6. Hot Cocoa Boiler Tank in the Rear Bed (Secondary Read)
  const cocoaTankMat = new THREE.MeshStandardMaterial({
    color: 0xd62828,
    roughness: 0.35,
    metalness: 0.45,
  });
  const cocoaTank = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.38, 0.82, 18),
    cocoaTankMat,
  );
  cocoaTank.rotation.z = Math.PI / 2;
  cocoaTank.position.set(0, 1.14, -0.58);
  cocoaTank.castShadow = true;
  bodyGroup.add(cocoaTank);

  const cocoaCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.18, 0.22, 14),
    chromeMat,
  );
  cocoaCap.position.set(0, 1.56, -0.58);
  bodyGroup.add(cocoaCap);

  const cocoaSteamMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 12),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
    }),
  );
  cocoaSteamMesh.position.set(0, 1.78, -0.58);
  bodyGroup.add(cocoaSteamMesh);

  // 7. Roof Amber Beacon Light
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xffbe0b,
    emissive: 0xff9f1c,
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });
  const beaconLightMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.18, 0.22, 16),
    beaconMat,
  );
  beaconLightMesh.position.set(0, 1.78, 0.55);
  bodyGroup.add(beaconLightMesh);

  // 8. Twin Round Anime Headlights, Volumetric Night Cones & Chrome Grille
  const headGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.1, 16);
  const headlightBeams = new THREE.Group();
  const beamConeGeo = new THREE.ConeGeometry(1.45, 6.2, 18, 1, true);
  // Orient cone so tip is at local (0,0,0) and wide base extends along +Z (forward)
  beamConeGeo.translate(0, -3.1, 0);
  beamConeGeo.rotateX(-Math.PI / 2);
  const beamConeMat = new THREE.MeshBasicMaterial({
    color: 0xffe599,
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  [-0.46, 0.46].forEach((xPos) => {
    const lamp = new THREE.Mesh(headGeo, headlightMat);
    lamp.rotation.x = Math.PI / 2;
    lamp.position.set(xPos, 0.78, 1.22);
    bodyGroup.add(lamp);

    const cone = new THREE.Mesh(beamConeGeo, beamConeMat);
    cone.position.set(xPos, 0.76, 1.26);
    cone.rotation.x = 0.09; // Pitch slightly downward onto the snow ahead
    headlightBeams.add(cone);
  });

  // Forward headlight pool light illuminating snow drifts ahead of the blade in Night Mode
  const headPoolLight = new THREE.PointLight(0xffe082, 4.8, 14.5, 1.5);
  headPoolLight.position.set(0, 1.45, 4.2);
  headlightBeams.add(headPoolLight);
  headlightBeams.visible = false;
  bodyGroup.add(headlightBeams);

  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.2, 0.08), chromeMat);
  grille.position.set(0, 0.75, 1.22);
  bodyGroup.add(grille);

  // 9. Rear Brake / Reverse Tail Lamps
  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0x991b1b,
    emissiveIntensity: 0.7,
    roughness: 0.2,
  });
  [-0.52, 0.52].forEach((tx) => {
    const tailLamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.14, 0.06),
      tailLightMat,
    );
    tailLamp.position.set(tx, 0.56, -1.28);
    bodyGroup.add(tailLamp);
  });

  // 10. Four Chunky Winter Tires with Hubcaps (Front wheels mounted on steering pivots)
  const wheels: THREE.Mesh[] = [];
  const frontWheelPivots: THREE.Group[] = [];
  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.28, 18);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelPositions: [number, number, number][] = [
    [-0.76, 0.34, 0.78],
    [0.76, 0.34, 0.78],
    [-0.76, 0.34, -0.78],
    [0.76, 0.34, -0.78],
  ];
  wheelPositions.forEach(([wx, wy, wz], idx) => {
    const wheel = new THREE.Mesh(wheelGeo, darkTrimMat);
    wheel.castShadow = true;

    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.3, 12).rotateZ(Math.PI / 2),
      chromeMat,
    );
    wheel.add(hub);

    if (idx < 2) {
      // Front steerable wheel pivot
      const pivot = new THREE.Group();
      pivot.position.set(wx, wy, wz);
      pivot.add(wheel);
      root.add(pivot);
      frontWheelPivots.push(pivot);
    } else {
      wheel.position.set(wx, wy, wz);
      root.add(wheel);
    }
    wheels.push(wheel);
  });

  // 11. Front Hydraulic V-Plow Blade Assembly (Scales on X with blade upgrade!)
  const plowAssembly = new THREE.Group();
  plowAssembly.position.set(0, 0.42, 1.48);
  bodyGroup.add(plowAssembly);

  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xffb703,
    roughness: 0.32,
    metalness: 0.55,
  });
  const scrapeEdgeMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.18,
    metalness: 0.85,
  });

  // Left and Right angled V-Plow wings using ExtrudeGeometry
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, -0.28);
  wingShape.lineTo(0.16, -0.28);
  wingShape.lineTo(0.08, 0.36);
  wingShape.lineTo(-0.08, 0.42);
  wingShape.lineTo(-0.06, -0.18);
  wingShape.closePath();

  const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
    depth: 1.15,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.03,
    bevelSegments: 2,
  });
  wingGeo.center();

  const leftWing = new THREE.Mesh(wingGeo, bladeMat);
  leftWing.rotation.y = Math.PI / 2 + 0.24;
  leftWing.position.set(-0.54, 0.04, 0.18);
  leftWing.castShadow = true;
  plowAssembly.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeo, bladeMat);
  rightWing.rotation.y = Math.PI / 2 - 0.24;
  rightWing.position.set(0.54, 0.04, 0.18);
  rightWing.castShadow = true;
  plowAssembly.add(rightWing);

  // Hydraulic struts & center nose cone
  const noseCone = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.66, 0.34), scrapeEdgeMat);
  noseCone.position.set(0, 0.04, 0.32);
  plowAssembly.add(noseCone);

  const strutGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.55, 10);
  strutGeo.rotateX(Math.PI / 2);
  [-0.36, 0.36].forEach((sx) => {
    const strut = new THREE.Mesh(strutGeo, chromeMat);
    strut.position.set(sx, 0, -0.12);
    plowAssembly.add(strut);
  });

  return {
    root,
    bodyGroup,
    plowAssembly,
    wheels,
    frontWheelPivots,
    tailLightMat,
    headlightMat,
    headlightBeams,
    beaconLightMesh,
    cocoaSteamMesh,
  };
}

/**
 * Tall Landmark 1: Vermilion Shinto Torii Gate (8 parts, grounded at y = 0).
 */
export function createToriiGateLandmark(): THREE.Group {
  const group = new THREE.Group();

  const vermilionMat = new THREE.MeshStandardMaterial({
    color: 0xd93829,
    roughness: 0.45,
    metalness: 0.1,
  });
  const darkSlateMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.78,
    metalness: 0.15,
  });
  const snowCapMat = new THREE.MeshStandardMaterial({
    color: 0xf8fbff,
    roughness: 0.88,
    metalness: 0.02,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    roughness: 0.25,
    metalness: 0.75,
  });

  // 1-2. Stone Pedestals & Main Pillars
  [-2.6, 2.6].forEach((x) => {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.62, 0.85, 16),
      darkSlateMat,
    );
    base.position.set(x, 0.425, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.42, 6.2, 16),
      vermilionMat,
    );
    pillar.position.set(x, 3.5, 0);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    group.add(pillar);
  });

  // 3. Nuki Lower Crossbeam
  const nuki = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.42, 0.42), vermilionMat);
  nuki.position.set(0, 5.1, 0);
  nuki.castShadow = true;
  group.add(nuki);

  // 4. Kasagi Upper Lintel
  const kasagi = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.52, 0.68), darkSlateMat);
  kasagi.position.set(0, 6.45, 0);
  kasagi.castShadow = true;
  group.add(kasagi);

  // 5-6. Upturned Eave Tips + Thick Snow Pillow on Top
  [-3.85, 3.85].forEach((x, idx) => {
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.46, 0.72), darkSlateMat);
    tip.position.set(x, 6.58, 0);
    tip.rotation.z = idx === 0 ? -0.22 : 0.22;
    group.add(tip);
  });

  const snowPillow = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.28, 0.64), snowCapMat);
  snowPillow.position.set(0, 6.82, 0);
  group.add(snowPillow);

  // 7. Center G額 (Gaku) Gold Plaque
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.25, 0.22), darkSlateMat);
  plaque.position.set(0, 5.75, 0);
  group.add(plaque);

  const plaqueTrim = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.98, 0.26), goldMat);
  plaqueTrim.position.set(0, 5.75, 0);
  group.add(plaqueTrim);

  return group;
}

/**
 * Tall Landmark 2: Cozy Onsen Ryokan Bathhouse & Bell Tower (9 parts, grounded at y = 0).
 */
export function createOnsenRyokanLandmark(): THREE.Group {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.85,
  });
  const timberMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    roughness: 0.75,
  });
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xfdf0d5,
    roughness: 0.68,
  });
  const shojiWarmMat = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    emissive: 0xff9f1c,
    emissiveIntensity: 1.35,
    roughness: 0.3,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.62,
    metalness: 0.15,
  });
  const snowRoofMat = new THREE.MeshStandardMaterial({
    color: 0xf8fbff,
    roughness: 0.9,
  });

  // 1. Stone Foundation
  const base = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.7, 4.8), stoneMat);
  base.position.set(0, 0.35, 0);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // 2. First Floor Hall
  const hall = new THREE.Mesh(new THREE.BoxGeometry(5.8, 2.4, 4.0), wallMat);
  hall.position.set(0, 1.9, 0);
  hall.castShadow = true;
  hall.receiveShadow = true;
  group.add(hall);

  // 3. Glowing Shoji Windows
  const shojiFront = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.4, 4.12), shojiWarmMat);
  shojiFront.position.set(0, 1.85, 0);
  group.add(shojiFront);

  // 4. First Tier Eaves + Snow Layer
  const lowerRoof = new THREE.Mesh(
    new THREE.ConeGeometry(4.9, 1.45, 4).rotateY(Math.PI / 4),
    roofMat,
  );
  lowerRoof.scale.set(1.18, 1, 0.88);
  lowerRoof.position.set(0, 3.65, 0);
  lowerRoof.castShadow = true;
  group.add(lowerRoof);

  const lowerSnow = new THREE.Mesh(
    new THREE.ConeGeometry(4.75, 1.2, 4).rotateY(Math.PI / 4),
    snowRoofMat,
  );
  lowerSnow.scale.set(1.16, 1, 0.86);
  lowerSnow.position.set(0, 3.85, 0);
  group.add(lowerSnow);

  // 5. Second Floor Bell Loft
  const upperLoft = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.8, 2.6), timberMat);
  upperLoft.position.set(0, 4.75, 0);
  upperLoft.castShadow = true;
  group.add(upperLoft);

  const upperShoji = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 2.7), shojiWarmMat);
  upperShoji.position.set(0, 4.75, 0);
  group.add(upperShoji);

  // 6. Upper Gable Roof + Snow Cap + Finial
  const upperRoof = new THREE.Mesh(
    new THREE.ConeGeometry(3.3, 1.5, 4).rotateY(Math.PI / 4),
    roofMat,
  );
  upperRoof.scale.set(1.15, 1, 0.9);
  upperRoof.position.set(0, 6.2, 0);
  upperRoof.castShadow = true;
  group.add(upperRoof);

  const upperSnow = new THREE.Mesh(
    new THREE.ConeGeometry(3.15, 1.25, 4).rotateY(Math.PI / 4),
    snowRoofMat,
  );
  upperSnow.scale.set(1.12, 1, 0.88);
  upperSnow.position.set(0, 6.38, 0);
  group.add(upperSnow);

  return group;
}

/**
 * Cozy Village Cottage Prop (5 parts, grounded at y = 0).
 */
export function createVillageCottage(roofColorHex: number): THREE.Group {
  const group = new THREE.Group();

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xfff3dd,
    roughness: 0.72,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x6f4518,
    roughness: 0.82,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: roofColorHex,
    roughness: 0.55,
  });
  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xf8fbff,
    roughness: 0.9,
  });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xffe169,
    emissive: 0xff9f1c,
    emissiveIntensity: 1.2,
    roughness: 0.25,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.1, 2.8), wallMat);
  base.position.set(0, 1.05, 0);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const beams = new THREE.Mesh(new THREE.BoxGeometry(3.28, 0.24, 2.88), woodMat);
  beams.position.set(0, 1.95, 0);
  group.add(beams);

  const win = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 2.86), windowMat);
  win.position.set(0, 1.1, 0);
  group.add(win);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.85, 1.8, 4).rotateY(Math.PI / 4),
    roofMat,
  );
  roof.position.set(0, 2.9, 0);
  roof.castShadow = true;
  group.add(roof);

  const snowCap = new THREE.Mesh(
    new THREE.ConeGeometry(2.72, 1.45, 4).rotateY(Math.PI / 4),
    snowMat,
  );
  snowCap.position.set(0, 3.12, 0);
  group.add(snowCap);

  return group;
}

/**
 * Chochin Lantern Post (5 parts, grounded at y = 0).
 */
export function createLanternPost(): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2c11, roughness: 0.8 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    emissive: 0xff8811,
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });

  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.55), stoneMat);
  pedestal.position.set(0, 0.175, 0);
  group.add(pedestal);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.6, 10), woodMat);
  pole.position.set(0, 1.45, 0);
  pole.castShadow = true;
  group.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.1, 0.1), woodMat);
  arm.position.set(0.28, 2.68, 0);
  group.add(arm);

  const chochin = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), glowMat);
  chochin.scale.set(1, 1.25, 1);
  chochin.position.set(0.52, 2.32, 0);
  group.add(chochin);

  return group;
}

export interface HazardVisualRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  telegraphRing: THREE.Mesh;
  telegraphLine?: THREE.Mesh;
  primaryMat: THREE.MeshStandardMaterial;
}

/**
 * Builds one of the 3 distinct Winter Critter/Hazard 3D models (5-7 parts each)
 * plus a visible ground windup telegraph indicator.
 */
export function createHazardCritterModel(
  archetype: HazardArchetype,
  shadowTex: THREE.CanvasTexture,
): HazardVisualRig {
  const root = new THREE.Group();

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.05, 18),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.016;
  root.add(shadow);

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  // Ground telegraph ring (hidden until 'windup' / 'active')
  const ringMat = new THREE.MeshBasicMaterial({
    color: archetype === 'kiter' ? 0x38bdf8 : 0xff4d6d,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const telegraphRing = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.35, 28),
    ringMat,
  );
  telegraphRing.rotation.x = -Math.PI / 2;
  telegraphRing.position.y = 0.035;
  root.add(telegraphRing);

  let telegraphLine: THREE.Mesh | undefined;
  let primaryMat: THREE.MeshStandardMaterial;

  if (archetype === 'charger') {
    // 1. Inoshishi Snow-Boar: Chubby brown forest boar with snow back & ivory tusks
    primaryMat = new THREE.MeshStandardMaterial({
      color: 0x7f4f24,
      roughness: 0.72,
      metalness: 0.08,
    });
    const snowBackMat = new THREE.MeshStandardMaterial({
      color: 0xf8fbff,
      roughness: 0.9,
    });
    const tuskMat = new THREE.MeshStandardMaterial({
      color: 0xfff8e7,
      roughness: 0.25,
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffbe0b,
      emissive: 0xff5400,
      emissiveIntensity: 1.4,
    });

    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 14), primaryMat);
    torso.scale.set(1.0, 0.88, 1.32);
    torso.position.set(0, 0.68, 0);
    torso.castShadow = true;
    bodyGroup.add(torso);

    const snowCap = new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 10), snowBackMat);
    snowCap.scale.set(0.95, 0.45, 1.15);
    snowCap.position.set(0, 1.12, -0.05);
    bodyGroup.add(snowCap);

    const snout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.34, 0.42, 12).rotateX(Math.PI / 2),
      primaryMat,
    );
    snout.position.set(0, 0.56, 0.92);
    bodyGroup.add(snout);

    [-0.26, 0.26].forEach((tx) => {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.38, 10), tuskMat);
      tusk.rotation.x = Math.PI / 5;
      tusk.position.set(tx, 0.64, 1.02);
      bodyGroup.add(tusk);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), eyeMat);
      eye.position.set(tx * 1.15, 0.86, 0.76);
      bodyGroup.add(eye);
    });

    // Forward charge sight-line telegraph mesh
    const lineGeo = new THREE.PlaneGeometry(0.45, 8.5);
    lineGeo.translate(0, 4.25, 0);
    telegraphLine = new THREE.Mesh(
      lineGeo,
      new THREE.MeshBasicMaterial({
        color: 0xff4d6d,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    telegraphLine.rotation.x = -Math.PI / 2;
    telegraphLine.position.y = 0.04;
    root.add(telegraphLine);
  } else if (archetype === 'orbiter') {
    // 2. Koro-Koro Snow-Daruma Spirit: Double stacked snow spheres with red scarf & gold brow
    primaryMat = new THREE.MeshStandardMaterial({
      color: 0xe2f1ff,
      roughness: 0.55,
      metalness: 0.1,
    });
    const scarfMat = new THREE.MeshStandardMaterial({
      color: 0xe63946,
      roughness: 0.4,
    });
    const coalMat = new THREE.MeshStandardMaterial({
      color: 0x1d3557,
      roughness: 0.2,
    });

    const lowerBall = new THREE.Mesh(new THREE.SphereGeometry(0.76, 18, 16), primaryMat);
    lowerBall.position.set(0, 0.72, 0);
    lowerBall.castShadow = true;
    bodyGroup.add(lowerBall);

    const upperBall = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 14), primaryMat);
    upperBall.position.set(0, 1.62, 0);
    upperBall.castShadow = true;
    bodyGroup.add(upperBall);

    const scarf = new THREE.Mesh(
      new THREE.TorusGeometry(0.46, 0.12, 10, 20).rotateX(Math.PI / 2),
      scarfMat,
    );
    scarf.position.set(0, 1.24, 0);
    bodyGroup.add(scarf);

    const bucketHat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.4, 0.42, 14),
      scarfMat,
    );
    bucketHat.position.set(0, 2.18, 0);
    bucketHat.rotation.z = 0.14;
    bodyGroup.add(bucketHat);

    [-0.18, 0.18].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), coalMat);
      eye.position.set(ex, 1.68, 0.46);
      bodyGroup.add(eye);
    });
  } else {
    // 3. Yuki-inko Frost Sprite: Floating crystal bird/spirit with icy wings
    primaryMat = new THREE.MeshStandardMaterial({
      color: 0x72efdd,
      emissive: 0x00b4d8,
      emissiveIntensity: 0.45,
      roughness: 0.18,
      metalness: 0.35,
    });
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xcaf0f8,
      roughness: 0.12,
      metalness: 0.5,
    });

    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.58, 1), primaryMat);
    core.position.set(0, 1.35, 0);
    core.castShadow = true;
    bodyGroup.add(core);

    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.55, 6), wingMat);
    crown.position.set(0, 2.02, 0);
    bodyGroup.add(crown);

    [-0.65, 0.65].forEach((wx, idx) => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.42), wingMat);
      wing.position.set(wx, 1.42, -0.05);
      wing.rotation.z = idx === 0 ? 0.35 : -0.35;
      bodyGroup.add(wing);
    });
  }

  return {
    root,
    bodyGroup,
    telegraphRing,
    telegraphLine,
    primaryMat,
  };
}
