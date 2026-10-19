import * as THREE from 'three';
import { PhysicsProblem } from '../types/game';

// Helper to create a procedural tick texture for beakers and scales
function createGraduatedScaleTexture(label: string, steps: number = 10): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 128, 512);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, 64, 40);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '16px monospace';
  ctx.textAlign = 'right';

  for (let i = 0; i <= steps; i++) {
    const y = 80 + (i / steps) * 400;
    const isMajor = i % 2 === 0;
    const length = isMajor ? 40 : 20;

    ctx.beginPath();
    ctx.moveTo(110 - length, y);
    ctx.lineTo(110, y);
    ctx.stroke();

    if (isMajor) {
      ctx.fillText(`${(steps - i) * 10}`, 60, y + 5);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Helper to create dial gauge texture
function createDialGaugeTexture(title: string, valueStr: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dial rim & face
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 512);

  ctx.beginPath();
  ctx.arc(256, 256, 240, 0, Math.PI * 2);
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 8;
  ctx.stroke();

  // Scale ticks around perimeter
  ctx.save();
  ctx.translate(256, 256);
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 1.5 + Math.PI * 0.75;
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -220);
    ctx.lineTo(0, i % 5 === 0 ? -190 : -205);
    ctx.strokeStyle = i > 22 ? '#ef4444' : '#94a3b8';
    ctx.lineWidth = i % 5 === 0 ? 5 : 2;
    ctx.stroke();
    ctx.rotate(-angle);
  }
  ctx.restore();

  // Labels
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 180);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 48px monospace';
  ctx.fillText(valueStr, 256, 340);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function build3DApparatus(problem: PhysicsProblem): THREE.Group {
  const root = new THREE.Group();
  root.name = `apparatus_${problem.id}`;

  // 1. Common Altar Base & Pedestal (Composite 3-part base)
  const basePlinthGeo = new THREE.CylinderGeometry(1.4, 1.6, 0.25, 32);
  const basePlinthMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
    metalness: 0.2,
  });
  const plinth = new THREE.Mesh(basePlinthGeo, basePlinthMat);
  plinth.position.y = 0.125;
  plinth.receiveShadow = true;
  root.add(plinth);

  // Altar Ring Inscription
  const ringGeo = new THREE.TorusGeometry(1.35, 0.04, 16, 64);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
    roughness: 0.3,
    metalness: 0.9,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.26;
  root.add(ring);

  // Pedestal Upper Column
  const colGeo = new THREE.CylinderGeometry(1.1, 1.25, 0.65, 32);
  const colMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.4,
    metalness: 0.6,
  });
  const col = new THREE.Mesh(colGeo, colMat);
  col.position.y = 0.58;
  col.castShadow = true;
  col.receiveShadow = true;
  root.add(col);

  // Altar Surface Plate
  const topPlateGeo = new THREE.CylinderGeometry(1.2, 1.1, 0.08, 32);
  const topPlateMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.2,
    metalness: 0.85,
  });
  const topPlate = new THREE.Mesh(topPlateGeo, topPlateMat);
  topPlate.position.y = 0.95;
  topPlate.receiveShadow = true;
  root.add(topPlate);

  // Dedicated Apparatus Assembly on top of Altar (height >= 1.0)
  const apparatusGroup = new THREE.Group();
  apparatusGroup.position.y = 1.0;
  root.add(apparatusGroup);

  switch (problem.apparatusType) {
    case 'orrery_gravity': {
      // 1. Celestial Orrery for Newton Gravitation
      // Central station / Earth
      const centralBodyGeo = new THREE.IcosahedronGeometry(0.35, 3);
      const centralBodyMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0369a1,
        emissiveIntensity: 0.4,
        roughness: 0.3,
        metalness: 0.7,
      });
      const centralBody = new THREE.Mesh(centralBodyGeo, centralBodyMat);
      centralBody.position.set(-0.4, 0.6, 0);
      apparatusGroup.add(centralBody);

      // Orbital Shuttle
      const shuttleGeo = new THREE.ConeGeometry(0.12, 0.3, 8);
      const shuttleMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.3,
        metalness: 0.8,
      });
      const shuttle = new THREE.Mesh(shuttleGeo, shuttleMat);
      shuttle.position.set(0.5, 0.6, 0);
      shuttle.rotation.z = -Math.PI / 2;
      apparatusGroup.add(shuttle);

      // Solar Panels on shuttle
      const wingGeo = new THREE.BoxGeometry(0.04, 0.02, 0.35);
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0x1d4ed8,
        metalness: 0.9,
        roughness: 0.2,
      });
      const wing = new THREE.Mesh(wingGeo, wingMat);
      wing.position.set(0.5, 0.6, 0);
      apparatusGroup.add(wing);

      // Tether / Distance Caliper Line
      const tetherGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.9, 8);
      const tetherMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.5,
      });
      const tether = new THREE.Mesh(tetherGeo, tetherMat);
      tether.rotation.z = Math.PI / 2;
      tether.position.set(0.05, 0.6, 0);
      apparatusGroup.add(tether);

      // Gravitational Force Vector Arrows (Inward pointing)
      const arrowLeft = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-0.4, 0.75, 0),
        0.28,
        0x10b981,
        0.08,
        0.05
      );
      const arrowRight = new THREE.ArrowHelper(
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0.5, 0.75, 0),
        0.28,
        0x10b981,
        0.08,
        0.05
      );
      apparatusGroup.add(arrowLeft);
      apparatusGroup.add(arrowRight);
      break;
    }

    case 'planetary_orbit': {
      // 2. Mars Planet & Descent Lander
      const marsGeo = new THREE.SphereGeometry(0.45, 32, 32);
      const marsMat = new THREE.MeshStandardMaterial({
        color: 0xc2410c, // rust red
        roughness: 0.85,
        metalness: 0.1,
      });
      const mars = new THREE.Mesh(marsGeo, marsMat);
      mars.position.set(0, 0.5, 0);
      apparatusGroup.add(mars);

      // Atmospheric Halo
      const haloGeo = new THREE.RingGeometry(0.5, 0.75, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.set(0, 0.5, 0);
      apparatusGroup.add(halo);

      // Descent capsule hovering above
      const capsuleGeo = new THREE.CylinderGeometry(0.08, 0.15, 0.14, 16);
      const capsuleMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.9,
        roughness: 0.2,
      });
      const capsule = new THREE.Mesh(capsuleGeo, capsuleMat);
      capsule.position.set(0, 1.1, 0);
      apparatusGroup.add(capsule);

      // Vector down
      const gVector = new THREE.ArrowHelper(
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(0, 1.0, 0),
        0.4,
        0xef4444,
        0.08,
        0.06
      );
      apparatusGroup.add(gVector);
      break;
    }

    case 'gravity_potential': {
      // 3. Gravitational Potential Well Funnel
      const funnelGeo = new THREE.ConeGeometry(0.7, 0.5, 32, 1, true);
      const funnelMat = new THREE.MeshStandardMaterial({
        color: 0x4338ca,
        wireframe: true,
      });
      const funnel = new THREE.Mesh(funnelGeo, funnelMat);
      funnel.rotation.x = Math.PI;
      funnel.position.set(0, 0.45, 0);
      apparatusGroup.add(funnel);

      // Earth at bottom
      const earthGeo = new THREE.SphereGeometry(0.18, 24, 24);
      const earthMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.3,
        metalness: 0.5,
      });
      const earth = new THREE.Mesh(earthGeo, earthMat);
      earth.position.set(0, 0.2, 0);
      apparatusGroup.add(earth);

      // Satellite on rim
      const satGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
      const satMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9 });
      const sat = new THREE.Mesh(satGeo, satMat);
      sat.position.set(0.48, 0.7, 0);
      apparatusGroup.add(sat);
      break;
    }

    case 'drop_tower': {
      // 4. Kinetic Drop Tower for near-Earth GPE (mgh)
      // 4 vertical rails
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const x = Math.cos(angle) * 0.25;
        const z = Math.sin(angle) * 0.25;
        const strutGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.3, 8);
        const strutMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
        const strut = new THREE.Mesh(strutGeo, strutMat);
        strut.position.set(x, 0.65, z);
        apparatusGroup.add(strut);
      }

      // Top cross brace
      const topCapGeo = new THREE.BoxGeometry(0.55, 0.06, 0.55);
      const topCapMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
      const topCap = new THREE.Mesh(topCapGeo, topCapMat);
      topCap.position.set(0, 1.3, 0);
      apparatusGroup.add(topCap);

      // Suspended Tungsten Mass Block (elevated)
      const massGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
      const massMat = new THREE.MeshStandardMaterial({
        color: 0x64748b, // tungsten gray
        metalness: 0.95,
        roughness: 0.15,
      });
      const mass = new THREE.Mesh(massGeo, massMat);
      mass.position.set(0, 1.05, 0);
      mass.castShadow = true;
      apparatusGroup.add(mass);

      // Red laser height measure beam
      const beamGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.9, 6);
      const beamMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0.18, 0.55, 0.18);
      apparatusGroup.add(beam);
      break;
    }

    case 'density_beaker': {
      // 5. Beaker with Water & Titanium Block
      // Glass Beaker Cylinder (Physical glass)
      const beakerGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.75, 32, 1, true);
      const beakerMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.92,
        roughness: 0.05,
        metalness: 0.05,
        ior: 1.5,
        thickness: 0.2,
        transparent: true,
        depthWrite: false,
      });
      const beaker = new THREE.Mesh(beakerGeo, beakerMat);
      beaker.position.set(0, 0.4, 0);
      apparatusGroup.add(beaker);

      // Water fluid level inside beaker
      const waterGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.45, 32);
      const waterMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transmission: 0.85,
        roughness: 0.1,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      });
      const water = new THREE.Mesh(waterGeo, waterMat);
      water.position.set(0, 0.25, 0);
      apparatusGroup.add(water);

      // Calibrated Titanium Specimen Block
      const blockGeo = new THREE.BoxGeometry(0.2, 0.15, 0.1);
      const blockMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8, // titanium silver
        metalness: 0.9,
        roughness: 0.2,
      });
      const block = new THREE.Mesh(blockGeo, blockMat);
      block.position.set(0, 0.7, 0); // elevated for clear inspection
      block.castShadow = true;
      apparatusGroup.add(block);

      // Graduated millimeter scale on side of beaker
      const scalePlaneGeo = new THREE.PlaneGeometry(0.15, 0.6);
      const scaleTex = createGraduatedScaleTexture('VOL (mL)', 10);
      const scaleMat = new THREE.MeshBasicMaterial({
        map: scaleTex,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const scalePlane = new THREE.Mesh(scalePlaneGeo, scaleMat);
      scalePlane.position.set(0.36, 0.4, 0);
      scalePlane.rotation.y = Math.PI / 2;
      apparatusGroup.add(scalePlane);
      break;
    }

    case 'barometer_tube': {
      // 6a. Torricellian Mercury Barometer
      // Mercury Reservoir Dish at base
      const dishGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.12, 32);
      const dishMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
      const dish = new THREE.Mesh(dishGeo, dishMat);
      dish.position.set(0, 0.06, 0);
      apparatusGroup.add(dish);

      // Mercury pool in dish
      const poolGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.05, 32);
      const poolMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.98,
        roughness: 0.05,
      });
      const pool = new THREE.Mesh(poolGeo, poolMat);
      pool.position.set(0, 0.11, 0);
      apparatusGroup.add(pool);

      // Vertical Glass Column Tube
      const tubeGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 16);
      const tubeMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.9,
        roughness: 0.1,
        transparent: true,
        depthWrite: false,
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.position.set(0, 0.65, 0);
      apparatusGroup.add(tube);

      // Liquid Mercury Column inside (up to 742 mm / 0.742 normalized to 0.82 height)
      const hgGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.78, 16);
      const hgMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0, // liquid mercury mirror sheen
        metalness: 0.98,
        roughness: 0.05,
      });
      const hg = new THREE.Mesh(hgGeo, hgMat);
      hg.position.set(0, 0.49, 0);
      apparatusGroup.add(hg);

      // Backing Calibrated Scale Plate
      const baroScaleGeo = new THREE.PlaneGeometry(0.18, 1.0);
      const baroScaleTex = createGraduatedScaleTexture('mmHg', 10);
      const baroScaleMat = new THREE.MeshBasicMaterial({
        map: baroScaleTex,
        side: THREE.DoubleSide,
      });
      const baroScale = new THREE.Mesh(baroScaleGeo, baroScaleMat);
      baroScale.position.set(0.1, 0.65, 0.05);
      apparatusGroup.add(baroScale);
      break;
    }

    case 'manometer_tube': {
      // 6b. U-Tube Differential Manometer
      // Backboard mount
      const boardGeo = new THREE.BoxGeometry(0.6, 0.95, 0.04);
      const boardMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.position.set(0, 0.5, -0.05);
      apparatusGroup.add(board);

      // Left arm of U-tube (lower fluid level)
      const leftArmGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.75, 16);
      const tubeMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.9,
        roughness: 0.1,
        transparent: true,
        depthWrite: false,
      });
      const leftArm = new THREE.Mesh(leftArmGeo, tubeMat);
      leftArm.position.set(-0.15, 0.5, 0);
      apparatusGroup.add(leftArm);

      // Right arm of U-tube (higher fluid level)
      const rightArm = new THREE.Mesh(leftArmGeo, tubeMat);
      rightArm.position.set(0.15, 0.5, 0);
      apparatusGroup.add(rightArm);

      // Bottom connector of U-tube
      const bottomUTubeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 16);
      const bottomUTube = new THREE.Mesh(bottomUTubeGeo, tubeMat);
      bottomUTube.rotation.z = Math.PI / 2;
      bottomUTube.position.set(0, 0.15, 0);
      apparatusGroup.add(bottomUTube);

      // Colored manometer fluid in arms
      const fluidMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b, // amber oil fluid
        metalness: 0.3,
        roughness: 0.2,
      });

      // Left fluid column (lower)
      const leftFluidGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.3, 16);
      const leftFluid = new THREE.Mesh(leftFluidGeo, fluidMat);
      leftFluid.position.set(-0.15, 0.3, 0);
      apparatusGroup.add(leftFluid);

      // Right fluid column (higher by Δh = 0.35m scaled)
      const rightFluidGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.55, 16);
      const rightFluid = new THREE.Mesh(rightFluidGeo, fluidMat);
      rightFluid.position.set(0.15, 0.425, 0);
      apparatusGroup.add(rightFluid);

      // Pressurized gas sphere connected to left arm
      const gasSphereGeo = new THREE.SphereGeometry(0.12, 24, 24);
      const gasSphereMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.3,
        roughness: 0.4,
      });
      const gasSphere = new THREE.Mesh(gasSphereGeo, gasSphereMat);
      gasSphere.position.set(-0.15, 0.95, 0);
      apparatusGroup.add(gasSphere);
      break;
    }

    case 'sphygmomanometer_arm': {
      // 6c. Medical Sphygmomanometer
      // Circular Aneroid Dial Gauge
      const dialGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 32);
      const dialTex = createDialGaugeTexture('ARTERIAL', '120 mmHg');
      const dialFaceMat = new THREE.MeshBasicMaterial({ map: dialTex });
      const dialRimMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.1 });
      const dial = new THREE.Mesh(dialGeo, [dialRimMat, dialFaceMat, dialRimMat]);
      dial.rotation.x = Math.PI / 2;
      dial.position.set(0, 0.65, 0.1);
      apparatusGroup.add(dial);

      // Pneumatic inflation bulb
      const bulbGeo = new THREE.SphereGeometry(0.1, 16, 16);
      bulbGeo.scale(1, 1.5, 1);
      const bulbMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(0.4, 0.3, 0);
      apparatusGroup.add(bulb);

      // Fabric Arm Cuff Cylinder
      const cuffGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.35, 24, 1, true);
      const cuffMat = new THREE.MeshStandardMaterial({
        color: 0x0f766e,
        roughness: 0.95,
        side: THREE.DoubleSide,
      });
      const cuff = new THREE.Mesh(cuffGeo, cuffMat);
      cuff.rotation.z = Math.PI / 2;
      cuff.position.set(-0.35, 0.3, 0);
      apparatusGroup.add(cuff);
      break;
    }

    case 'pascal_press': {
      // 7. Pascal's Hydraulic Lift Press
      // Hydraulic Bottom Reservoir / manifold base
      const basePipeGeo = new THREE.BoxGeometry(0.8, 0.1, 0.3);
      const pipeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
      const basePipe = new THREE.Mesh(basePipeGeo, pipeMat);
      basePipe.position.set(0, 0.05, 0);
      apparatusGroup.add(basePipe);

      // Small Input Cylinder (A1 = 50 cm^2 -> radius ~0.08m)
      const c1Geo = new THREE.CylinderGeometry(0.08, 0.08, 0.45, 24);
      const c1 = new THREE.Mesh(c1Geo, pipeMat);
      c1.position.set(-0.25, 0.3, 0);
      apparatusGroup.add(c1);

      // Small Input Piston Rod with manual lever handle
      const rod1Geo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 16);
      const rodMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
      const rod1 = new THREE.Mesh(rod1Geo, rodMat);
      rod1.position.set(-0.25, 0.55, 0);
      apparatusGroup.add(rod1);

      // Large Output Ram (A2 = 1,500 cm^2 -> radius ~0.22m)
      const c2Geo = new THREE.CylinderGeometry(0.22, 0.22, 0.45, 24);
      const c2 = new THREE.Mesh(c2Geo, pipeMat);
      c2.position.set(0.22, 0.3, 0);
      apparatusGroup.add(c2);

      // Heavy 24,000 N load block on large piston
      const loadBlockGeo = new THREE.BoxGeometry(0.4, 0.22, 0.35);
      const loadBlockMat = new THREE.MeshStandardMaterial({
        color: 0xb45309,
        roughness: 0.6,
        metalness: 0.4,
      });
      const loadBlock = new THREE.Mesh(loadBlockGeo, loadBlockMat);
      loadBlock.position.set(0.22, 0.65, 0);
      loadBlock.castShadow = true;
      apparatusGroup.add(loadBlock);
      break;
    }

    case 'buoyancy_tank': {
      // 8a. Archimedes Buoyancy Tank
      // Rectangular glass aquarium tank
      const tankGeo = new THREE.BoxGeometry(0.8, 0.8, 0.6);
      const tankMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.92,
        roughness: 0.05,
        transparent: true,
        depthWrite: false,
      });
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.set(0, 0.45, 0);
      apparatusGroup.add(tank);

      // Seawater volume inside
      const seaGeo = new THREE.BoxGeometry(0.76, 0.65, 0.56);
      const seaMat = new THREE.MeshPhysicalMaterial({
        color: 0x06b6d4, // azure ocean
        transmission: 0.8,
        roughness: 0.15,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      });
      const sea = new THREE.Mesh(seaGeo, seaMat);
      sea.position.set(0, 0.38, 0);
      apparatusGroup.add(sea);

      // Submerged Titanium Exploration Canister
      const canGeo = new THREE.SphereGeometry(0.16, 24, 24);
      canGeo.scale(1, 1.4, 1);
      const canMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.9,
        roughness: 0.2,
      });
      const can = new THREE.Mesh(canGeo, canMat);
      can.position.set(0, 0.35, 0);
      apparatusGroup.add(can);

      // Buoyant Force Upward Vector
      const buoyantArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0.55, 0),
        0.35,
        0x10b981,
        0.08,
        0.06
      );
      apparatusGroup.add(buoyantArrow);
      break;
    }

    case 'displacement_beaker':
    default: {
      // 8b. Archimedes Fluid Displacement Beaker
      const beakerGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 32, 1, true);
      const beakerMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.92,
        roughness: 0.05,
        transparent: true,
        depthWrite: false,
      });
      const beaker = new THREE.Mesh(beakerGeo, beakerMat);
      beaker.position.set(0, 0.45, 0);
      apparatusGroup.add(beaker);

      // Displaced Water inside
      const waterGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.6, 32);
      const waterMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transmission: 0.85,
        roughness: 0.1,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      });
      const water = new THREE.Mesh(waterGeo, waterMat);
      water.position.set(0, 0.35, 0);
      apparatusGroup.add(water);

      // Pure Platinum Artifact submerged inside
      const platGeo = new THREE.DodecahedronGeometry(0.12);
      const platMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0, // bright platinum luster
        metalness: 0.98,
        roughness: 0.1,
      });
      const plat = new THREE.Mesh(platGeo, platMat);
      plat.position.set(0, 0.28, 0);
      apparatusGroup.add(plat);

      // Suspension wire lowering the artifact
      const wireGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.7, 8);
      const wireMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
      const wire = new THREE.Mesh(wireGeo, wireMat);
      wire.position.set(0, 0.65, 0);
      apparatusGroup.add(wire);

      // Graduated scale
      const dispScaleGeo = new THREE.PlaneGeometry(0.15, 0.65);
      const dispScaleTex = createGraduatedScaleTexture('ΔV (L)', 10);
      const dispScaleMat = new THREE.MeshBasicMaterial({
        map: dispScaleTex,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const dispScale = new THREE.Mesh(dispScaleGeo, dispScaleMat);
      dispScale.position.set(0.36, 0.45, 0);
      dispScale.rotation.y = Math.PI / 2;
      apparatusGroup.add(dispScale);
      break;
    }
  }

  // Floating Altar Hologram Beacon Ring above apparatus
  const beaconGeo = new THREE.TorusGeometry(0.5, 0.015, 16, 48);
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.8,
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.rotation.x = Math.PI / 2;
  beacon.position.y = 2.4;
  beacon.name = 'altar_beacon';
  root.add(beacon);

  return root;
}
