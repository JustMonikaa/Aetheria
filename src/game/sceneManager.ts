import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MazeData } from './mazeGenerator';
import { build3DApparatus } from './apparatusBuilder';
import { PathType } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

// Pre-allocated math objects to avoid garbage collection in render loop
const _vec3 = new THREE.Vector3();
const _moveDir = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();

export interface SceneCallbacks {
  onNearChamber: (chamberId: string | null) => void;
  onNearChambersList?: (chamberIds: string[]) => void;
  onNearDataLog: (text: string | null) => void;
  onEnterHazard: (type: 'steam' | 'gravity_anomaly') => void;
  onOxygenRecharge: () => void;
  onStatsUpdate: (delta: { distance: number; staminaDelta: number; oxygenDrain: number; batteryDrain: number }) => void;
  onPlayerTransform?: (pos: { x: number; z: number }, yaw: number) => void;
}

export class MazeSceneManager {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  private isRunning: boolean = false;
  private animFrameId: number | null = null;
  private clock: THREE.Clock = new THREE.Clock();

  // Maze & World Data
  public mazeData: MazeData;
  private wallColliders: THREE.Box3[] = [];
  private chamberApparatusMap: Map<string, THREE.Group> = new Map();
  private beaconMeshes: THREE.Mesh[] = [];
  private hazardGlowElements: { ring: THREE.Mesh; col: THREE.Mesh; light: THREE.PointLight; baseIntensity: number }[] = [];
  private atmosphericParticles: THREE.Points | null = null;
  private particleVelocities: Float32Array | null = null;
  private beaconParticles: THREE.Points | null = null;
  private starfield: THREE.Points | null = null;

  // Player Kinematics
  public playerPos: THREE.Vector3 = new THREE.Vector3();
  private playerVelocity: THREE.Vector3 = new THREE.Vector3();
  public yaw: number = 0;
  public pitch: number = 0;
  private playerRadius: number = 0.45;
  private moveSpeed: number = 5.2;
  private sprintMultiplier: number = 1.7;

  // Input State
  private keys: Record<string, boolean> = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    ShiftLeft: false,
    ShiftRight: false,
  };
  public isPointerLocked: boolean = false;
  public isModalOpen: boolean = false;
  public isShiftHeld: boolean = false;
  private guidancePillar: THREE.Group | null = null;
  private currentGuidanceChamberId: string | null = null;
  private lastPointerLockExitTime: number = 0;
  private pointerLockPending: boolean = false;
  private cleanupListeners: (() => void)[] = [];
  public flashlightOn: boolean = true;
  private flashlight: THREE.SpotLight | null = null;
  private flashlightTarget: THREE.Object3D | null = null;

  // Title Camera orbit state
  public isTitleScreen: boolean = true;
  private titleOrbitAngle: number = 0;

  // Callbacks
  private callbacks: SceneCallbacks;

  // Wall Material
  private wallMaterial: THREE.MeshStandardMaterial;
  private floorMaterial: THREE.MeshStandardMaterial;

  constructor(container: HTMLDivElement, mazeData: MazeData, callbacks: SceneCallbacks) {
    this.mazeData = mazeData;
    this.callbacks = callbacks;

    // 1. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    const isHeadless = typeof navigator !== 'undefined' && (/HeadlessChrome/i.test(navigator.userAgent) || navigator.webdriver);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 2. Scene & Fog Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050914);
    this.scene.fog = new THREE.FogExp2(0x050914, 0.038);

    // 3. Camera Setup (far plane 1200 so 600m beacon is visible anywhere on map)
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1200);

    // Initial player position
    const startWorldX = mazeData.startPos.x * mazeData.cellSize + mazeData.cellSize / 2;
    const startWorldZ = mazeData.startPos.z * mazeData.cellSize + mazeData.cellSize / 2;
    this.playerPos.set(startWorldX, 1.7, startWorldZ);
    this.camera.position.copy(this.playerPos);

    // 4. Procedural Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting Rig
    this.setupLighting();

    // 6. Materials
    this.wallMaterial = this.createWallMaterial();
    this.floorMaterial = this.createFloorMaterial();

    // 7. Build Maze Geometry & Altars
    this.buildMazeWorld();

    // 8. Event Listeners
    this.setupControls(container);

    // 9. Resize Handling
    window.addEventListener('resize', this.onWindowResize);

    // 10. Start Loop
    this.isRunning = true;
    this.animate();
  }

  private setupLighting() {
    // Ambient / Fill contrast
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.45);
    this.scene.add(hemiLight);

    // Warm Directional Sunbeam (simulating light from labyrinth skylights)
    const sunLight = new THREE.DirectionalLight(0xffedd5, 0.9);
    sunLight.position.set(40, 60, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 120;
    const d = 50;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    // Flashlight (mounted to camera)
    this.flashlight = new THREE.SpotLight(0xffffff, 2.2, 28, Math.PI / 5, 0.4, 1.2);
    this.flashlight.castShadow = true;
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.flashlight);
  }

  private createWallMaterial(): THREE.MeshStandardMaterial {
    // Procedural sci-fi labyrinth panelling texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 512);

    // Panel borders
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, 492, 492);

    // Inner bevel & conduits
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, 432, 432);

    // Glowing conduit line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(40, 256);
    ctx.lineTo(472, 256);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.65,
      metalness: 0.35,
    });
  }

  private createFloorMaterial(): THREE.MeshStandardMaterial {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 512, 512);

    // Grid floor lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 512, 512);
    ctx.strokeRect(128, 128, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(17, 17);

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.75,
      metalness: 0.2,
    });
  }

  private buildMazeWorld() {
    const { width, height, cellSize, cells, chambers, oxygenVents, hazards, dataLogs } = this.mazeData;
    const wallHeight = 4.2;
    const wallThickness = 0.5;

    // Floor Mesh
    const floorSizeX = width * cellSize;
    const floorSizeZ = height * cellSize;
    const floorGeo = new THREE.PlaneGeometry(floorSizeX, floorSizeZ);
    const floor = new THREE.Mesh(floorGeo, this.floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(floorSizeX / 2, 0, floorSizeZ / 2);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Deep Cosmic Starfield (visible overhead anywhere across the labyrinth)
    const starCount = 1500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const radius = 80 + Math.random() * 320;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.45;
      starPos[i * 3 + 0] = floorSizeX / 2 + radius * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = 10.0 + radius * Math.cos(phi);
      starPos[i * 3 + 2] = floorSizeZ / 2 + radius * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 1.4,
      transparent: true,
      opacity: 0.85,
      fog: false,
    });
    this.starfield = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starfield);

    // Wall top cyber trim runners material
    const wallTrimMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.65,
    });
    const trimXGeo = new THREE.BoxGeometry(cellSize, 0.08, wallThickness * 1.05);
    const trimZGeo = new THREE.BoxGeometry(wallThickness * 1.05, 0.08, cellSize);

    // Atmospheric Quantum Dust Motes Particle System
    const particleCount = 1200;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    const pVelocities = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);

    const cCyan = new THREE.Color(0x38bdf8);
    const cTeal = new THREE.Color(0x10b981);
    const cViolet = new THREE.Color(0xa855f7);

    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3 + 0] = Math.random() * floorSizeX;
      pPositions[i * 3 + 1] = 0.3 + Math.random() * 3.5;
      pPositions[i * 3 + 2] = Math.random() * floorSizeZ;

      pVelocities[i * 3 + 0] = (Math.random() - 0.5) * 0.25;
      pVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.12;
      pVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.25;

      const pick = Math.random();
      const col = pick < 0.6 ? cCyan : pick < 0.85 ? cTeal : cViolet;
      pColors[i * 3 + 0] = col.r;
      pColors[i * 3 + 1] = col.g;
      pColors[i * 3 + 2] = col.b;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d')!;
    const pGrad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    pGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    pGrad.addColorStop(0.3, 'rgba(56, 189, 248, 0.8)');
    pGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    pCtx.fillStyle = pGrad;
    pCtx.fillRect(0, 0, 32, 32);
    const pTex = new THREE.CanvasTexture(pCanvas);

    const pMat = new THREE.PointsMaterial({
      size: 0.22,
      map: pTex,
      transparent: true,
      opacity: 0.7,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.atmosphericParticles = new THREE.Points(pGeo, pMat);
    this.particleVelocities = pVelocities;
    this.scene.add(this.atmosphericParticles);

    // Wall geometries
    const wallXGeo = new THREE.BoxGeometry(cellSize, wallHeight, wallThickness);
    const wallZGeo = new THREE.BoxGeometry(wallThickness, wallHeight, cellSize);

    // Build walls from cell data
    for (let z = 0; z < height; z++) {
      for (let x = 0; x < width; x++) {
        const cell = cells[z][x];
        const cellCenterX = x * cellSize + cellSize / 2;
        const cellCenterZ = z * cellSize + cellSize / 2;

        // North wall
        if (cell.walls.north) {
          const wallMesh = new THREE.Mesh(wallXGeo, this.wallMaterial);
          wallMesh.position.set(cellCenterX, wallHeight / 2, z * cellSize);
          wallMesh.castShadow = true;
          wallMesh.receiveShadow = true;
          this.scene.add(wallMesh);

          const box = new THREE.Box3();
          box.setFromObject(wallMesh);
          this.wallColliders.push(box);
        }

        // South wall (only on edge to prevent duplicate)
        if (cell.walls.south && z === height - 1) {
          const wallMesh = new THREE.Mesh(wallXGeo, this.wallMaterial);
          wallMesh.position.set(cellCenterX, wallHeight / 2, (z + 1) * cellSize);
          wallMesh.castShadow = true;
          wallMesh.receiveShadow = true;
          this.scene.add(wallMesh);

          const box = new THREE.Box3();
          box.setFromObject(wallMesh);
          this.wallColliders.push(box);
        }

        // West wall
        if (cell.walls.west) {
          const wallMesh = new THREE.Mesh(wallZGeo, this.wallMaterial);
          wallMesh.position.set(x * cellSize, wallHeight / 2, cellCenterZ);
          wallMesh.castShadow = true;
          wallMesh.receiveShadow = true;
          this.scene.add(wallMesh);

          const box = new THREE.Box3();
          box.setFromObject(wallMesh);
          this.wallColliders.push(box);
        }

        // East wall (only on outer boundary)
        if (cell.walls.east && x === width - 1) {
          const wallMesh = new THREE.Mesh(wallZGeo, this.wallMaterial);
          wallMesh.position.set((x + 1) * cellSize, wallHeight / 2, cellCenterZ);
          wallMesh.castShadow = true;
          wallMesh.receiveShadow = true;
          this.scene.add(wallMesh);

          const box = new THREE.Box3();
          box.setFromObject(wallMesh);
          this.wallColliders.push(box);
        }
      }
    }

    // Spawn 3D Apparatuses in Chambers
    for (const chamber of chambers) {
      const apparatusGroup = build3DApparatus(chamber.problem);
      const chamberWorldX = chamber.x * cellSize + cellSize / 2;
      const chamberWorldZ = chamber.z * cellSize + cellSize / 2;
      apparatusGroup.position.set(chamberWorldX, 0, chamberWorldZ);
      this.scene.add(apparatusGroup);

      this.chamberApparatusMap.set(chamber.id, apparatusGroup);

      // Local PointLight illuminating the altar
      const altarLight = new THREE.PointLight(0x38bdf8, 2.5, 12, 1.5);
      altarLight.position.set(chamberWorldX, 2.6, chamberWorldZ);
      this.scene.add(altarLight);

      // Grab beacon
      const beacon = apparatusGroup.getObjectByName('altar_beacon') as THREE.Mesh;
      if (beacon) this.beaconMeshes.push(beacon);
    }

    // Spawn Oxygen Vents
    for (const vent of oxygenVents) {
      const vx = vent.x * cellSize + cellSize / 2;
      const vz = vent.z * cellSize + cellSize / 2;

      // Base ring
      const ringGeo = new THREE.TorusGeometry(1.0, 0.08, 16, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.8,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(vx, 0.05, vz);
      this.scene.add(ring);

      // Bioluminescent Pillar
      const pillarGeo = new THREE.CylinderGeometry(0.15, 0.2, 2.0, 16);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x047857,
        roughness: 0.3,
        metalness: 0.8,
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(vx, 1.0, vz);
      this.scene.add(pillar);

      const ventLight = new THREE.PointLight(0x10b981, 1.8, 8);
      ventLight.position.set(vx, 1.5, vz);
      this.scene.add(ventLight);
    }

    // Spawn Hazards with intense glowing visual effects
    for (const h of hazards) {
      const hx = h.x * cellSize + cellSize / 2;
      const hz = h.z * cellSize + cellSize / 2;
      const hazardColor = h.type === 'steam' ? 0xf97316 : 0xef4444;

      // Concentric glowing floor disk
      const hazardDiscGeo = new THREE.CircleGeometry(1.5, 32);
      const hazardDiscMat = new THREE.MeshBasicMaterial({
        color: hazardColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      });
      const hDisc = new THREE.Mesh(hazardDiscGeo, hazardDiscMat);
      hDisc.rotation.x = -Math.PI / 2;
      hDisc.position.set(hx, 0.015, hz);
      this.scene.add(hDisc);

      // Glowing Perimeter Ring with high emissive power
      const hazardRingGeo = new THREE.TorusGeometry(1.5, 0.05, 16, 48);
      const hazardRingMat = new THREE.MeshStandardMaterial({
        color: hazardColor,
        emissive: hazardColor,
        emissiveIntensity: 1.8,
        roughness: 0.2,
        metalness: 0.9,
      });
      const hRing = new THREE.Mesh(hazardRingGeo, hazardRingMat);
      hRing.rotation.x = Math.PI / 2;
      hRing.position.set(hx, 0.04, hz);
      this.scene.add(hRing);

      // Energetic Holographic Hazard Field Column
      const colGeo = new THREE.CylinderGeometry(1.45, 1.45, 1.4, 32, 1, true);
      const colMat = new THREE.MeshBasicMaterial({
        color: hazardColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(hx, 0.7, hz);
      this.scene.add(col);

      // Warning Point Light casting actual radiant glow on walls and floors
      const hLight = new THREE.PointLight(hazardColor, 2.8, 7.0, 1.5);
      hLight.position.set(hx, 0.8, hz);
      this.scene.add(hLight);

      this.hazardGlowElements.push({ ring: hRing, col, light: hLight, baseIntensity: 2.8 });
    }

    // Spawn Data Logs
    for (const log of dataLogs) {
      const lx = log.x * cellSize + cellSize / 2;
      const lz = log.z * cellSize + cellSize / 2;

      const termPedGeo = new THREE.CylinderGeometry(0.25, 0.35, 1.1, 16);
      const termPedMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
      const term = new THREE.Mesh(termPedGeo, termPedMat);
      term.position.set(lx, 0.55, lz);
      this.scene.add(term);

      const screenGeo = new THREE.BoxGeometry(0.5, 0.35, 0.04);
      const screenMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(lx, 1.25, lz);
      screen.rotation.x = -0.3;
      this.scene.add(screen);
    }
  }

  private setupControls(container: HTMLDivElement) {
    // Keyboard handlers
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      const key = e.key.toLowerCase();
      let handled = false;

      if (e.code === 'KeyW' || key === 'w' || e.code === 'ArrowUp') {
        this.keys.KeyW = true;
        handled = true;
      }
      if (e.code === 'KeyS' || key === 's' || e.code === 'ArrowDown') {
        this.keys.KeyS = true;
        handled = true;
      }
      if (e.code === 'KeyA' || key === 'a' || e.code === 'ArrowLeft') {
        this.keys.KeyA = true;
        handled = true;
      }
      if (e.code === 'KeyD' || key === 'd' || e.code === 'ArrowRight') {
        this.keys.KeyD = true;
        handled = true;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.shiftKey) {
        this.keys.ShiftLeft = true;
        handled = true;
        // Shift is held: temporarily free pointer so user can see cursor and click instead of moving camera
        if (!this.isShiftHeld) {
          this.isShiftHeld = true;
          this.exitPointerLock();
        }
      }

      // Prevent accidental browser shortcuts or scrolling during gameplay
      if (handled) {
        e.preventDefault();
      }

      if (e.code === 'KeyF' || key === 'f') {
        e.preventDefault();
        this.flashlightOn = !this.flashlightOn;
        if (this.flashlight) this.flashlight.visible = this.flashlightOn;
        soundEngine.playFlashlightClick(this.flashlightOn);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.code === 'KeyW' || key === 'w' || e.code === 'ArrowUp') this.keys.KeyW = false;
      if (e.code === 'KeyS' || key === 's' || e.code === 'ArrowDown') this.keys.KeyS = false;
      if (e.code === 'KeyA' || key === 'a' || e.code === 'ArrowLeft') this.keys.KeyA = false;
      if (e.code === 'KeyD' || key === 'd' || e.code === 'ArrowRight') this.keys.KeyD = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.keys.ShiftLeft = false;
        this.isShiftHeld = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    this.cleanupListeners.push(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    });

    // Pointer Lock & Mouse Look
    const onContainerClick = (e: MouseEvent) => {
      // Never acquire pointer lock if a dialog modal is open, on title screen, or when Shift is held
      if (
        this.isModalOpen ||
        this.isPointerLocked ||
        this.isTitleScreen ||
        this.pointerLockPending ||
        this.isShiftHeld
      ) {
        return;
      }

      // Chromium rate limit: cannot acquire pointer lock within ~1.25s after exiting
      const timeSinceExit = Date.now() - this.lastPointerLockExitTime;
      if (timeSinceExit < 1350) {
        return;
      }

      this.pointerLockPending = true;
      try {
        const lockPromise = container.requestPointerLock?.();
        if (lockPromise && typeof (lockPromise as Promise<void>).then === 'function') {
          (lockPromise as Promise<void>)
            .then(() => {
              this.pointerLockPending = false;
            })
            .catch(() => {
              // Silently handle browser rate limit or cancellation rejection
              this.pointerLockPending = false;
              this.lastPointerLockExitTime = Date.now();
            });
        } else {
          this.pointerLockPending = false;
        }
      } catch {
        this.pointerLockPending = false;
        this.lastPointerLockExitTime = Date.now();
      }
    };

    const onPointerLockChange = () => {
      const isNowLocked = document.pointerLockElement === container;
      if (this.isPointerLocked && !isNowLocked) {
        // Just exited pointer lock, record exit time to guard the 1.25s cooldown
        this.lastPointerLockExitTime = Date.now();
      }
      this.isPointerLocked = isNowLocked;
      this.pointerLockPending = false;
      isDragging = false; // Immediately clear drag state to avoid abrupt delta jumps
    };

    const onPointerLockError = () => {
      this.isPointerLocked = false;
      this.pointerLockPending = false;
      this.lastPointerLockExitTime = Date.now();
      isDragging = false;
    };

    container.addEventListener('click', onContainerClick);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('pointerlockerror', onPointerLockError);

    // Prevent double click on canvas triggering accidental full screen
    const onDblClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    container.addEventListener('dblclick', onDblClick);

    this.cleanupListeners.push(() => {
      container.removeEventListener('click', onContainerClick);
      container.removeEventListener('dblclick', onDblClick);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('pointerlockerror', onPointerLockError);
    });

    const PITCH_LIMIT = Math.PI * 0.46; // ~82.8 degrees: avoids gimbal lock flip at ±PI/2

    const onMouseMove = (e: MouseEvent) => {
      if (this.isModalOpen || !this.isPointerLocked || this.isShiftHeld) return;

      // Filter out Chromium Pointer-Lock cursor recenter anomalies:
      // When moving quickly, the browser forcibly teleports the cursor and emits
      // a massive artifact delta (e.g. movementX = -1200), flipping camera 180°.
      if (Math.abs(e.movementX) > 120 || Math.abs(e.movementY) > 120) {
        return;
      }

      const sensitivity = 0.0022;
      const maxDelta = 50;
      const clampedX = Math.max(-maxDelta, Math.min(maxDelta, e.movementX));
      const clampedY = Math.max(-maxDelta, Math.min(maxDelta, e.movementY));

      this.yaw -= clampedX * sensitivity;
      this.pitch -= clampedY * sensitivity;

      // Keep yaw normalized within [-2*PI, 2*PI]
      if (this.yaw > Math.PI * 2) this.yaw -= Math.PI * 2;
      if (this.yaw < -Math.PI * 2) this.yaw += Math.PI * 2;

      // Strictly clamp pitch to avoid Gimbal Lock singularity
      this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));
    };

    window.addEventListener('mousemove', onMouseMove);
    this.cleanupListeners.push(() => window.removeEventListener('mousemove', onMouseMove));

    // Mobile / drag look fallback
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (this.isModalOpen || this.isPointerLocked) return;
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (this.isModalOpen || this.isPointerLocked) return;
      if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        // Discard large spikes during pointer grab
        if (Math.abs(dx) > 120 || Math.abs(dy) > 120) return;

        const sensitivity = 0.0035;
        const maxDelta = 50;
        const clampedDx = Math.max(-maxDelta, Math.min(maxDelta, dx));
        const clampedDy = Math.max(-maxDelta, Math.min(maxDelta, dy));

        this.yaw -= clampedDx * sensitivity;
        this.pitch -= clampedDy * sensitivity;

        if (this.yaw > Math.PI * 2) this.yaw -= Math.PI * 2;
        if (this.yaw < -Math.PI * 2) this.yaw += Math.PI * 2;

        this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    this.cleanupListeners.push(() => {
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    });

    // Clear keys on blur
    const onBlur = () => {
      for (const k in this.keys) {
        this.keys[k] = false;
      }
      this.playerVelocity.set(0, 0, 0);
    };
    window.addEventListener('blur', onBlur);
    this.cleanupListeners.push(() => window.removeEventListener('blur', onBlur));
  }

  public setModalOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
    if (isOpen) {
      this.exitPointerLock();
      for (const k in this.keys) {
        this.keys[k] = false;
      }
      this.playerVelocity.set(0, 0, 0);
    }
  }

  public exitPointerLock() {
    this.isPointerLocked = false;
    this.pointerLockPending = false;
    this.lastPointerLockExitTime = Date.now();
    if (document.pointerLockElement) {
      try {
        document.exitPointerLock?.();
      } catch {
        // ignore
      }
    }
  }

  public updateThemeForPath(path: PathType) {
    soundEngine.updateAmbientForPath(path);
  }

  public setChamberSolved(chamberId: string) {
    const apparatus = this.chamberApparatusMap.get(chamberId);
    if (apparatus) {
      const beacon = apparatus.getObjectByName('altar_beacon') as THREE.Mesh;
      if (beacon && beacon.material) {
        (beacon.material as THREE.MeshStandardMaterial).color.setHex(0x10b981);
        (beacon.material as THREE.MeshStandardMaterial).emissive.setHex(0x059669);
      }
    }
    // If the solved chamber had the guidance pillar, remove it
    if (this.currentGuidanceChamberId === chamberId) {
      this.setGuidanceChamber(null);
    }
  }

  public setGuidanceChamber(chamberId: string | null) {
    if (this.currentGuidanceChamberId === chamberId) return;
    this.currentGuidanceChamberId = chamberId;

    if (this.guidancePillar) {
      this.scene.remove(this.guidancePillar);
      this.guidancePillar = null;
    }

    if (!chamberId) return;

    const chamber = this.mazeData.chambers.find((c) => c.id === chamberId);
    if (!chamber) return;

    const group = new THREE.Group();
    const cx = chamber.x * this.mazeData.cellSize + this.mazeData.cellSize / 2;
    const cz = chamber.z * this.mazeData.cellSize + this.mazeData.cellSize / 2;
    group.position.set(cx, 0, cz);

    // Vertical luminous beam of light reaching from floor to ceiling (height 4.2m)
    // Vertical luminous beam of light reaching 600m into the sky (fog: false ensures map-wide visibility)
    const beamHeight = 600;
    const beamGeo = new THREE.CylinderGeometry(0.7, 3.5, beamHeight, 32, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.52,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = beamHeight / 2;
    group.add(beam);

    // Inner bright laser core pillar reaching high into deep space
    const coreGeo = new THREE.CylinderGeometry(0.15, 0.15, beamHeight, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = beamHeight / 2;
    group.add(core);

    // Holographic X-Ray guide trace (depthTest: false makes it visible even behind walls)
    const holoGeo = new THREE.CylinderGeometry(0.2, 0.2, beamHeight, 16);
    const holoMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      fog: false,
    });
    const holo = new THREE.Mesh(holoGeo, holoMat);
    holo.position.y = beamHeight / 2;
    group.add(holo);

    // Glowing base ring
    const ringGeo = new THREE.TorusGeometry(0.8, 0.05, 16, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85, fog: false });
    const bRing = new THREE.Mesh(ringGeo, ringMat);
    bRing.rotation.x = Math.PI / 2;
    bRing.position.y = 0.15;
    group.add(bRing);

    // Floating ascending pulse rings along the pillar
    for (let r = 0; r < 5; r++) {
      const pRGeo = new THREE.TorusGeometry(0.75 + r * 0.12, 0.03, 16, 32);
      const pRMat = new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        fog: false,
      });
      const pRMesh = new THREE.Mesh(pRGeo, pRMat);
      pRMesh.rotation.x = Math.PI / 2;
      pRMesh.position.y = 1.0 + r * 3.5;
      pRMesh.name = `beacon_pulse_ring_${r}`;
      group.add(pRMesh);
    }

    // Guiding Point Light
    const pLight = new THREE.PointLight(0x38bdf8, 5.0, 35, 1.2);
    pLight.position.set(0, 3.0, 0);
    group.add(pLight);

    this.scene.add(group);
    this.guidancePillar = group;
  }

  public setVirtualMovement(moveX: number, moveZ: number, isSprinting: boolean = false) {
    if (this.isTitleScreen || this.isModalOpen) return;
    this.virtualMoveX = moveX;
    this.virtualMoveZ = moveZ;
    this.virtualSprinting = isSprinting;
  }

  public rotateCamera(deltaYaw: number, deltaPitch: number) {
    if (this.isModalOpen) return;
    const maxDelta = 0.25;
    const clampedYaw = Math.max(-maxDelta, Math.min(maxDelta, deltaYaw));
    const clampedPitch = Math.max(-maxDelta, Math.min(maxDelta, deltaPitch));
    this.yaw -= clampedYaw;
    this.pitch -= clampedPitch;
    if (this.yaw > Math.PI * 2) this.yaw -= Math.PI * 2;
    if (this.yaw < -Math.PI * 2) this.yaw += Math.PI * 2;
    const PITCH_LIMIT = Math.PI * 0.46;
    this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));
  }

  private virtualMoveX: number = 0;
  private virtualMoveZ: number = 0;
  private virtualSprinting: boolean = false;

  private updatePlayerMovement(dt: number) {
    if (this.isTitleScreen || this.isModalOpen) {
      this.playerVelocity.set(0, 0, 0);
      return;
    }

    // Movement vectors from yaw
    _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();
    _moveDir.set(0, 0, 0);

    if (this.keys.KeyW) _moveDir.add(_forward);
    if (this.keys.KeyS) _moveDir.sub(_forward);
    if (this.keys.KeyD) _moveDir.add(_right);
    if (this.keys.KeyA) _moveDir.sub(_right);

    // Blend virtual touchscreen joystick inputs
    if (Math.abs(this.virtualMoveZ) > 0.05) _moveDir.addScaledVector(_forward, this.virtualMoveZ);
    if (Math.abs(this.virtualMoveX) > 0.05) _moveDir.addScaledVector(_right, this.virtualMoveX);

    const isMoving = _moveDir.lengthSq() > 0.001;
    if (isMoving) {
      _moveDir.normalize();
    }

    const isSprinting = isMoving && (this.keys.ShiftLeft || this.keys.ShiftRight || this.virtualSprinting);
    const speed = this.moveSpeed * (isSprinting ? this.sprintMultiplier : 1.0);

    // Accelerate velocity
    const targetVel = _vec3.copy(_moveDir).multiplyScalar(speed);
    this.playerVelocity.lerp(targetVel, Math.min(dt * 12, 1));

    // Desired new position
    const nextX = this.playerPos.x + this.playerVelocity.x * dt;
    const nextZ = this.playerPos.z + this.playerVelocity.z * dt;

    // Circle vs Wall AABB Collision Resolution (Resolved separately on X and Z for smooth wall sliding)
    const resolvedX = this.resolveCollisionX(nextX, this.playerPos.z);
    const resolvedZ = this.resolveCollisionZ(resolvedX, nextZ);

    const distanceDelta = Math.hypot(resolvedX - this.playerPos.x, resolvedZ - this.playerPos.z);
    this.playerPos.x = resolvedX;
    this.playerPos.z = resolvedZ;

    // Footstep audio trigger
    if (isMoving && distanceDelta > 0.02) {
      if (Math.random() < 0.07) {
        soundEngine.playFootstep();
      }
    }

    // Stats callback
    this.callbacks.onStatsUpdate({
      distance: distanceDelta,
      staminaDelta: isSprinting ? -dt * 18 : dt * 10,
      oxygenDrain: (isSprinting ? 1.6 : 0.8) * dt,
      batteryDrain: this.flashlightOn ? 0.3 * dt : 0,
    });

    // Check proximities to Chambers, Oxygen Vents, Hazards, Data Logs
    this.checkProximities();
  }

  private resolveCollisionX(targetX: number, currentZ: number): number {
    const r = this.playerRadius;
    const playerBox = new THREE.Box3(
      new THREE.Vector3(targetX - r, 0, currentZ - r),
      new THREE.Vector3(targetX + r, 4, currentZ + r)
    );

    for (const wall of this.wallColliders) {
      if (playerBox.intersectsBox(wall)) {
        if (targetX > this.playerPos.x) {
          targetX = wall.min.x - r - 0.002;
        } else if (targetX < this.playerPos.x) {
          targetX = wall.max.x + r + 0.002;
        }
        playerBox.min.x = targetX - r;
        playerBox.max.x = targetX + r;
      }
    }
    return targetX;
  }

  private resolveCollisionZ(currentX: number, targetZ: number): number {
    const r = this.playerRadius;
    const playerBox = new THREE.Box3(
      new THREE.Vector3(currentX - r, 0, targetZ - r),
      new THREE.Vector3(currentX + r, 4, targetZ + r)
    );

    for (const wall of this.wallColliders) {
      if (playerBox.intersectsBox(wall)) {
        if (targetZ > this.playerPos.z) {
          targetZ = wall.min.z - r - 0.002;
        } else if (targetZ < this.playerPos.z) {
          targetZ = wall.max.z + r + 0.002;
        }
        playerBox.min.z = targetZ - r;
        playerBox.max.z = targetZ + r;
      }
    }
    return targetZ;
  }

  private checkProximities() {
    const { cellSize, chambers, oxygenVents, hazards, dataLogs } = this.mazeData;

    // 1. Chamber Proximity
    const nearbyChamberIds: string[] = [];
    let interactableChamberId: string | null = null;

    for (const ch of chambers) {
      const cx = ch.x * cellSize + cellSize / 2;
      const cz = ch.z * cellSize + cellSize / 2;
      const dist = Math.hypot(this.playerPos.x - cx, this.playerPos.z - cz);

      // Track nearby chambers for curve-wave pulse on tracker (e.g. within 14m)
      if (dist < 14) {
        nearbyChamberIds.push(ch.id);
      }

      // Interaction prompt: only if NOT already solved!
      if (dist < 2.6 && !ch.solved) {
        interactableChamberId = ch.id;
      }
    }

    this.callbacks.onNearChamber(interactableChamberId);
    if (this.callbacks.onNearChambersList) {
      this.callbacks.onNearChambersList(nearbyChamberIds);
    }

    // 2. Oxygen Vent Proximity
    for (const v of oxygenVents) {
      const vx = v.x * cellSize + cellSize / 2;
      const vz = v.z * cellSize + cellSize / 2;
      const dist = Math.hypot(this.playerPos.x - vx, this.playerPos.z - vz);
      if (dist < 1.8) {
        this.callbacks.onOxygenRecharge();
        break;
      }
    }

    // 3. Hazard Proximity
    for (const h of hazards) {
      const hx = h.x * cellSize + cellSize / 2;
      const hz = h.z * cellSize + cellSize / 2;
      const dist = Math.hypot(this.playerPos.x - hx, this.playerPos.z - hz);
      if (dist < 1.6) {
        this.callbacks.onEnterHazard(h.type);
        break;
      }
    }

    // 4. Data Log Proximity
    let nearLogText: string | null = null;
    for (const log of dataLogs) {
      const lx = log.x * cellSize + cellSize / 2;
      const lz = log.z * cellSize + cellSize / 2;
      const dist = Math.hypot(this.playerPos.x - lx, this.playerPos.z - lz);
      if (dist < 2.0) {
        nearLogText = `${log.title}\n\n${log.content}`;
        break;
      }
    }
    this.callbacks.onNearDataLog(nearLogText);
  }

  private animate = () => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.animate);

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);

    // Beacon hover rotation
    for (const beacon of this.beaconMeshes) {
      beacon.rotation.z += dt * 1.2;
    }

    // Animate glowing pulsing circles for suit stability hazards
    const elapsedTime = this.clock.getElapsedTime();
    for (const h of this.hazardGlowElements) {
      const pulse = 1.0 + 0.35 * Math.sin(elapsedTime * 3.5);
      h.light.intensity = h.baseIntensity * pulse;
      if (h.ring.material && 'emissiveIntensity' in h.ring.material) {
        (h.ring.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.2 * pulse;
      }
      if (h.col.material && 'opacity' in h.col.material) {
        (h.col.material as THREE.MeshBasicMaterial).opacity = 0.22 + 0.12 * Math.sin(elapsedTime * 3.5);
      }
    }

    // Animate atmospheric quantum dust motes drifting across corridors
    if (this.atmosphericParticles && this.particleVelocities) {
      const posAttr = this.atmosphericParticles.geometry.attributes.position as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      const vels = this.particleVelocities;
      const worldW = this.mazeData.width * this.mazeData.cellSize;
      const worldH = this.mazeData.height * this.mazeData.cellSize;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 0] += vels[i + 0] * dt;
        positions[i + 1] += vels[i + 1] * dt;
        positions[i + 2] += vels[i + 2] * dt;

        if (positions[i + 0] < 0) positions[i + 0] += worldW;
        else if (positions[i + 0] > worldW) positions[i + 0] -= worldW;

        if (positions[i + 1] < 0.2) positions[i + 1] = 3.8;
        else if (positions[i + 1] > 3.9) positions[i + 1] = 0.3;

        if (positions[i + 2] < 0) positions[i + 2] += worldH;
        else if (positions[i + 2] > worldH) positions[i + 2] -= worldH;
      }
      posAttr.needsUpdate = true;
    }

    // Animate celestial cosmic starfield
    if (this.starfield) {
      this.starfield.rotation.y += dt * 0.004;
    }

    // Animate ascending beacon pulse rings
    if (this.guidancePillar) {
      for (let r = 0; r < 5; r++) {
        const ring = this.guidancePillar.getObjectByName(`beacon_pulse_ring_${r}`);
        if (ring) {
          ring.position.y += dt * (3.0 + r * 0.6);
          if (ring.position.y > 35.0) {
            ring.position.y = 0.6;
          }
          ring.rotation.z += dt * 1.5;
        }
      }
    }

    if (this.isTitleScreen) {
      // Atmospheric live title orbit pan
      this.titleOrbitAngle += dt * 0.25;
      const chamber0 = this.mazeData.chambers[0];
      const centerX = chamber0.x * this.mazeData.cellSize + this.mazeData.cellSize / 2;
      const centerZ = chamber0.z * this.mazeData.cellSize + this.mazeData.cellSize / 2;

      const orbitRadius = 4.2;
      this.camera.position.x = centerX + Math.cos(this.titleOrbitAngle) * orbitRadius;
      this.camera.position.y = 2.4 + Math.sin(this.titleOrbitAngle * 0.7) * 0.3;
      this.camera.position.z = centerZ + Math.sin(this.titleOrbitAngle) * orbitRadius;
      this.camera.lookAt(centerX, 1.4, centerZ);
    } else {
      // First person player simulation
      this.updatePlayerMovement(dt);

      this.camera.position.copy(this.playerPos);

      // Camera orientation from pitch and yaw
      const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
      this.camera.quaternion.setFromEuler(euler);

      // Notify HUD/Minimap of live player transform
      if (this.callbacks.onPlayerTransform) {
        this.callbacks.onPlayerTransform({ x: this.playerPos.x, z: this.playerPos.z }, this.yaw);
      }

      // Update flashlight to point where camera looks
      if (this.flashlight && this.flashlightTarget) {
        this.flashlight.position.copy(this.camera.position);
        _forward.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
        this.flashlightTarget.position.copy(this.camera.position).add(_forward.multiplyScalar(10));
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  private onWindowResize = () => {
    if (!this.renderer || !this.camera) return;
    const parent = this.renderer.domElement.parentElement;
    if (!parent) return;

    this.camera.aspect = parent.clientWidth / parent.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(parent.clientWidth, parent.clientHeight);
  };

  public resetForNewGame(newMazeData: MazeData) {
    this.mazeData = newMazeData;
    const startWorldX = newMazeData.startPos.x * newMazeData.cellSize + newMazeData.cellSize / 2;
    const startWorldZ = newMazeData.startPos.z * newMazeData.cellSize + newMazeData.cellSize / 2;
    this.playerPos.set(startWorldX, 1.7, startWorldZ);
    this.playerVelocity.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.camera.position.copy(this.playerPos);

    // Reset beacons
    for (const ch of newMazeData.chambers) {
      const apparatus = this.chamberApparatusMap.get(ch.id);
      if (apparatus) {
        const beacon = apparatus.getObjectByName('altar_beacon') as THREE.Mesh;
        if (beacon && beacon.material) {
          (beacon.material as THREE.MeshStandardMaterial).color.setHex(0x38bdf8);
          (beacon.material as THREE.MeshStandardMaterial).emissive.setHex(0x0284c7);
        }
      }
    }
  }

  public dispose() {
    this.isRunning = false;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onWindowResize);

    // Clean up all input & pointer lock listeners
    this.cleanupListeners.forEach((fn) => {
      try {
        fn();
      } catch {
        // ignore
      }
    });
    this.cleanupListeners = [];

    if (
      document.pointerLockElement &&
      (document.pointerLockElement === this.renderer.domElement ||
        document.pointerLockElement === this.renderer.domElement.parentElement)
    ) {
      try {
        document.exitPointerLock?.();
      } catch {
        // ignore
      }
    }
    this.renderer.dispose();
  }
}
