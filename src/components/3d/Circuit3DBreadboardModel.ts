import * as THREE from 'three';
import { CircuitState, CircuitType } from '../../types/esp32';
import { ESP32_PINS } from '../../data/esp32Data';

export interface CircuitWireLabel {
  id: string;
  label: string;
  sublabel: string;
  colorHex: string;
  pinId: number;
  anchor: THREE.Object3D;
}

export interface ComponentPickMeta {
  pinId: number;
  componentName: string;
  connectionDetail: string;
  colorHex: string;
}

interface WireVisualEntry {
  pinId: number;
  mat: THREE.MeshStandardMaterial;
  baseColor: number;
  colorHex: string;
  group: THREE.Group;
  label: string;
  sublabel: string;
}

export class Circuit3DBreadboardModel {
  public group: THREE.Group;
  public pickableMeshes: THREE.Object3D[] = [];
  public wireLabels: CircuitWireLabel[] = [];

  private circuitGroups: Record<CircuitType, THREE.Group>;
  private activeType: CircuitType = 'WIFI_3LEDS';
  private wireVisuals: WireVisualEntry[] = [];

  // 3D ESP32 Pin Visual Indicator Beacon (lights up exact pin on ESP32 + carrier bridge)
  private pinBeaconGroup!: THREE.Group;
  private pinBeaconRingMat!: THREE.MeshBasicMaterial;
  private pinBeaconConeMat!: THREE.MeshStandardMaterial;
  private pinBeaconCone!: THREE.Mesh;
  private pinBeaconCarrierRing!: THREE.Mesh;
  private pinBeaconTraceBar!: THREE.Mesh;
  private highlightedPinId: number | null = null;
  private beaconPulseTime = 0;

  // Live dynamic elements for Wi-Fi 3 LEDs (GPIO18 Rojo, GPIO19 Amarillo, GPIO21 Verde)
  private wifiRedLedMat!: THREE.MeshPhysicalMaterial;
  private wifiRedCoreMat!: THREE.MeshBasicMaterial;
  private wifiRedGlow!: THREE.PointLight;
  private wifiYellowLedMat!: THREE.MeshPhysicalMaterial;
  private wifiYellowCoreMat!: THREE.MeshBasicMaterial;
  private wifiYellowGlow!: THREE.PointLight;
  private wifiGreenLedMat!: THREE.MeshPhysicalMaterial;
  private wifiGreenCoreMat!: THREE.MeshBasicMaterial;
  private wifiGreenGlow!: THREE.PointLight;

  // Live dynamic elements for LED / LDR / BOOT
  private extLedMat!: THREE.MeshPhysicalMaterial;
  private extLedGlow!: THREE.PointLight;
  private ldrLightOrbMat!: THREE.MeshBasicMaterial;
  private ldrLightPoint!: THREE.PointLight;
  private extResetCapMesh!: THREE.Mesh;
  private extBootLedMat!: THREE.MeshPhysicalMaterial;

  // Board dimensions and positions
  public static readonly ESP_OFFSET_X = -2.2;
  public static readonly ESP_OFFSET_Y = 0.35;
  public static readonly ESP_OFFSET_Z = 0;

  public static readonly CARRIER_WIDTH = 3.55;
  public static readonly CARRIER_LENGTH = 4.95;

  public static readonly MAIN_BB_X = 2.25;
  public static readonly MAIN_BB_WIDTH = 3.15;
  public static readonly MAIN_BB_LENGTH = 4.95;
  public static readonly MAIN_BB_TOP_Y = -0.17;

  private readonly colorTmp = new THREE.Color();

  constructor(maxAnisotropy = 4) {
    this.group = new THREE.Group();
    this.group.name = 'Circuit_3D_Workbench';

    this.circuitGroups = {
      WIFI_3LEDS: new THREE.Group(),
      LDR_ANALOG: new THREE.Group(),
      GPIO2_BLINK: new THREE.Group(),
      BOOT_INTERRUPT: new THREE.Group(),
    };

    Object.entries(this.circuitGroups).forEach(([key, grp]) => {
      grp.name = `Circuit_${key}`;
      grp.visible = key === this.activeType;
      this.group.add(grp);
    });

    this.buildWorkbenchBase(maxAnisotropy);
    this.buildPinBeacon();
    this.buildWifi3LedsCircuit();
    this.buildLdrCircuit(maxAnisotropy);
    this.buildBlinkCircuit();
    this.buildBootInterruptCircuit();
  }

  /**
   * Builds the 3D visual indicator that snaps onto the exact ESP32 pin + carrier hole
   * whenever the user hovers or taps any wire or component in the circuit.
   */
  private buildPinBeacon() {
    this.pinBeaconGroup = new THREE.Group();
    this.pinBeaconGroup.name = 'ESP32_Pin_Beacon';
    this.pinBeaconGroup.visible = false;

    this.pinBeaconRingMat = new THREE.MeshBasicMaterial({
      color: 0x00d2d3,
      side: THREE.DoubleSide,
    });
    this.pinBeaconConeMat = new THREE.MeshStandardMaterial({
      color: 0x00d2d3,
      emissive: 0x00a8ac,
      emissiveIntensity: 0.75,
      roughness: 0.25,
      metalness: 0.15,
    });

    // Glowing collar ring directly around the ESP32 gold pin pad on the PCB
    const espPinRing = new THREE.Mesh(
      new THREE.RingGeometry(0.085, 0.145, 24),
      this.pinBeaconRingMat
    );
    espPinRing.rotation.x = -Math.PI / 2;
    espPinRing.position.set(0, 0.095, 0);
    this.pinBeaconGroup.add(espPinRing);

    // Downward-pointing 3D indicator arrow hovering above the exact ESP32 pin
    this.pinBeaconCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.28, 16),
      this.pinBeaconConeMat
    );
    this.pinBeaconCone.rotation.x = Math.PI; // point straight down onto the pin
    this.pinBeaconCone.position.set(0, 0.44, 0);
    this.pinBeaconGroup.add(this.pinBeaconCone);

    // Ring on the breadboard carrier socket hole where the jumper wire plugs in
    this.pinBeaconCarrierRing = new THREE.Mesh(
      new THREE.RingGeometry(0.06, 0.11, 20),
      this.pinBeaconRingMat
    );
    this.pinBeaconCarrierRing.rotation.x = -Math.PI / 2;
    this.pinBeaconGroup.add(this.pinBeaconCarrierRing);

    // Illuminated trace bar showing internal breadboard row connection between carrier hole & ESP32 pin
    this.pinBeaconTraceBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.014, 0.055),
      this.pinBeaconRingMat
    );
    this.pinBeaconGroup.add(this.pinBeaconTraceBar);

    this.group.add(this.pinBeaconGroup);
  }

  /**
   * Returns exact 3D world position of an ESP32 pin pad on the DevKit PCB.
   */
  public getEsp32PinWorldTip(pinId: number, out: THREE.Vector3): boolean {
    const pin = ESP32_PINS.find((p) => p.id === pinId);
    if (!pin) return false;
    const pinPitch = 0.23;
    const startZ = -((19 - 1) * pinPitch) / 2;
    const pz = startZ + pin.positionIndex * pinPitch;
    const worldPinX =
      Circuit3DBreadboardModel.ESP_OFFSET_X + (pin.side === 'LEFT' ? -1.25 : 1.25);
    out.set(worldPinX, Circuit3DBreadboardModel.ESP_OFFSET_Y + 0.12, pz);
    return true;
  }

  /**
   * Highlights all wires connected to `pinId` and moves the 3D beacon directly onto that ESP32 pin.
   */
  public setHighlightedPin(pinId: number | null, accentColorHex?: string) {
    this.highlightedPinId = pinId;

    // 1. Update wire emissive glow
    const activeGrp = this.circuitGroups[this.activeType];
    for (const entry of this.wireVisuals) {
      if (pinId !== null && entry.pinId === pinId && entry.group === activeGrp) {
        // For dark/black GND wires, highlight in bright cyan so it pops visually
        const glowColor = entry.baseColor === 0x1e293b ? 0x38bdf8 : entry.baseColor;
        entry.mat.emissive.setHex(glowColor);
        entry.mat.emissiveIntensity = 0.9;
      } else {
        entry.mat.emissive.setHex(0x000000);
        entry.mat.emissiveIntensity = 0.0;
      }
    }

    // 2. Position 3D ESP32 pin beacon
    if (pinId === null) {
      this.pinBeaconGroup.visible = false;
      return;
    }

    const pin = ESP32_PINS.find((p) => p.id === pinId);
    if (!pin) {
      this.pinBeaconGroup.visible = false;
      return;
    }

    const pinPitch = 0.23;
    const startZ = -((19 - 1) * pinPitch) / 2;
    const pz = startZ + pin.positionIndex * pinPitch;
    const worldPinX =
      Circuit3DBreadboardModel.ESP_OFFSET_X + (pin.side === 'LEFT' ? -1.25 : 1.25);
    const holeAnchor = this.getEspPinBreadboardAnchor(pinId, 0);

    // Choose a bright, unmistakable accent color (upgrade black GND to vivid sky-cyan)
    let colorNum = 0x00b4b8;
    if (accentColorHex && accentColorHex.toLowerCase() !== '#1e293b') {
      colorNum = parseInt(accentColorHex.replace('#', ''), 16) || 0x00b4b8;
    } else if (accentColorHex?.toLowerCase() === '#1e293b') {
      colorNum = 0x38bdf8;
    }
    this.pinBeaconRingMat.color.setHex(colorNum);
    this.pinBeaconConeMat.color.setHex(colorNum);
    this.pinBeaconConeMat.emissive.setHex(colorNum);

    this.pinBeaconGroup.position.set(worldPinX, Circuit3DBreadboardModel.ESP_OFFSET_Y, pz);

    const localHoleX = holeAnchor.x - worldPinX;
    const localBbY = Circuit3DBreadboardModel.MAIN_BB_TOP_Y - Circuit3DBreadboardModel.ESP_OFFSET_Y + 0.012;
    this.pinBeaconCarrierRing.position.set(localHoleX, localBbY, 0);
    this.pinBeaconTraceBar.position.set(localHoleX / 2, localBbY, 0);

    this.pinBeaconGroup.visible = true;
  }

  public updateBeaconAnimation(delta: number) {
    if (!this.pinBeaconGroup.visible) return;
    this.beaconPulseTime += delta;
    this.pinBeaconCone.position.y = 0.44 + Math.sin(this.beaconPulseTime * 5.0) * 0.055;
  }

  public getDefaultMetaForPin(pinId: number): ComponentPickMeta | null {
    const activeGrp = this.circuitGroups[this.activeType];
    const match = this.wireVisuals.find((w) => w.group === activeGrp && w.pinId === pinId);
    if (match) {
      return {
        pinId,
        componentName: `Cable ${match.label}`,
        connectionDetail: match.sublabel,
        colorHex: match.colorHex,
      };
    }
    return null;
  }

  /**
   * Returns exact 3D world coordinates of an open carrier breadboard hole
   * aligned to the given ESP32 pin row (1..38).
   */
  private getEspPinBreadboardAnchor(pinId: number, colOffset = 0): {
    x: number;
    y: number;
    z: number;
    side: 'LEFT' | 'RIGHT';
  } {
    const pin = ESP32_PINS.find((p) => p.id === pinId);
    if (!pin) return { x: -2.2, y: Circuit3DBreadboardModel.MAIN_BB_TOP_Y, z: 0, side: 'RIGHT' };

    const pinPitch = 0.23;
    const startZ = -((19 - 1) * pinPitch) / 2;
    const pz = startZ + pin.positionIndex * pinPitch;

    const worldPinX =
      Circuit3DBreadboardModel.ESP_OFFSET_X + (pin.side === 'LEFT' ? -1.25 : 1.25);
    const step = 0.16;
    const holeX =
      pin.side === 'LEFT'
        ? worldPinX - 0.18 - colOffset * step
        : worldPinX + 0.18 + colOffset * step;

    return {
      x: holeX,
      y: Circuit3DBreadboardModel.MAIN_BB_TOP_Y,
      z: pz,
      side: pin.side,
    };
  }

  /**
   * Exact 3D world coordinates of a prototyping breadboard main tie-point hole.
   * col: 0..4 = a..e (left of center ravine), 5..9 = f..j (right of center ravine)
   * row: 0..24 (top to bottom)
   */
  private getProtoHole(col: number, row: number): { x: number; y: number; z: number } {
    const colsPx = [145, 190, 235, 280, 325, 443, 488, 533, 578, 623];
    const px = colsPx[Math.max(0, Math.min(9, col))];
    const py = 65 + Math.max(0, Math.min(24, row)) * 48;

    const wx =
      Circuit3DBreadboardModel.MAIN_BB_X +
      (px / 768 - 0.5) * Circuit3DBreadboardModel.MAIN_BB_WIDTH;
    const wz = (py / 1280 - 0.5) * Circuit3DBreadboardModel.MAIN_BB_LENGTH;

    return {
      x: wx,
      y: Circuit3DBreadboardModel.MAIN_BB_TOP_Y,
      z: wz,
    };
  }

  /**
   * Exact 3D world coordinates of a prototyping breadboard power rail hole.
   * side: 'LEFT' | 'RIGHT', rail: 'PLUS' (+) | 'MINUS' (-), slotIndex: 0..23
   */
  private getProtoRailHole(
    side: 'LEFT' | 'RIGHT',
    rail: 'PLUS' | 'MINUS',
    slotIndex: number
  ): { x: number; y: number; z: number } {
    const basePx = side === 'LEFT' ? 52 : 768 - 52;
    const px = rail === 'PLUS' ? basePx - 10 : basePx + 10;
    // Skip every 6th gap slot just like real breadboards
    const r = slotIndex % 6 === 5 ? slotIndex + 1 : slotIndex;
    const py = 65 + Math.min(23, Math.max(0, r)) * 48;

    const wx =
      Circuit3DBreadboardModel.MAIN_BB_X +
      (px / 768 - 0.5) * Circuit3DBreadboardModel.MAIN_BB_WIDTH;
    const wz = (py / 1280 - 0.5) * Circuit3DBreadboardModel.MAIN_BB_LENGTH;

    return {
      x: wx,
      y: Circuit3DBreadboardModel.MAIN_BB_TOP_Y,
      z: wz,
    };
  }

  private buildWorkbenchBase(maxAnisotropy: number) {
    // 1. Clean ESD Silicone Workbench Mat beneath both boards
    const matGeom = new THREE.BoxGeometry(8.9, 0.04, 5.8);
    const matMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.85,
      metalness: 0.04,
    });
    const matMesh = new THREE.Mesh(matGeom, matMaterial);
    matMesh.position.set(0.05, -0.57, 0);
    matMesh.receiveShadow = true;
    this.group.add(matMesh);

    const trimGeom = new THREE.BoxGeometry(8.98, 0.02, 5.88);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x00878a,
      roughness: 0.5,
      metalness: 0.18,
    });
    const trimMesh = new THREE.Mesh(trimGeom, trimMat);
    trimMesh.position.set(0.05, -0.585, 0);
    this.group.add(trimMesh);

    // Subtle central gutter routing guide lines on the mat surface
    const gutterMat = new THREE.MeshBasicMaterial({ color: 0xcbd5e1 });
    const gutterPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 5.1), gutterMat);
    gutterPlane.rotation.x = -Math.PI / 2;
    gutterPlane.position.set(0.12, -0.548, 0);
    this.group.add(gutterPlane);

    // 2. Left Carrier Breadboard for ESP32 DevKit
    const carrierTex = this.createBreadboardTexture(maxAnisotropy, 'CARRIER');
    const bbMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.48,
      metalness: 0.04,
      map: carrierTex,
    });
    const bbSideMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.55,
      metalness: 0.05,
    });

    const carrierGeom = new THREE.BoxGeometry(
      Circuit3DBreadboardModel.CARRIER_WIDTH,
      0.38,
      Circuit3DBreadboardModel.CARRIER_LENGTH
    );
    const carrierMesh = new THREE.Mesh(carrierGeom, [
      bbSideMat,
      bbSideMat,
      bbMat,
      bbSideMat,
      bbSideMat,
      bbSideMat,
    ]);
    carrierMesh.position.set(Circuit3DBreadboardModel.ESP_OFFSET_X, -0.36, 0);
    carrierMesh.castShadow = true;
    carrierMesh.receiveShadow = true;
    this.group.add(carrierMesh);

    // 3. Right Prototyping Breadboard (400-pt standard breadboard)
    const protoTex = this.createBreadboardTexture(maxAnisotropy, 'PROTO');
    const protoTopMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.45,
      metalness: 0.04,
      map: protoTex,
    });
    const protoGeom = new THREE.BoxGeometry(
      Circuit3DBreadboardModel.MAIN_BB_WIDTH,
      0.38,
      Circuit3DBreadboardModel.MAIN_BB_LENGTH
    );
    const protoMesh = new THREE.Mesh(protoGeom, [
      bbSideMat,
      bbSideMat,
      protoTopMat,
      bbSideMat,
      bbSideMat,
      bbSideMat,
    ]);
    protoMesh.position.set(Circuit3DBreadboardModel.MAIN_BB_X, -0.36, 0);
    protoMesh.castShadow = true;
    protoMesh.receiveShadow = true;
    this.group.add(protoMesh);

    // Central DIP groove on the right breadboard
    const grooveGeom = new THREE.BoxGeometry(0.18, 0.03, 4.75);
    const grooveMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.7,
    });
    const grooveMesh = new THREE.Mesh(grooveGeom, grooveMat);
    grooveMesh.position.set(Circuit3DBreadboardModel.MAIN_BB_X, -0.175, 0);
    this.group.add(grooveMesh);
  }

  private createBreadboardTexture(maxAnisotropy: number, mode: 'CARRIER' | 'PROTO'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    const drawHole = (x: number, y: number, r = 5.5) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x - r + 1.5, y - r + 1.5, 2.5, 2.5);
    };

    if (mode === 'PROTO') {
      const drawPowerRail = (baseX: number) => {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(baseX - 24, 45);
        ctx.lineTo(baseX - 24, canvas.height - 45);
        ctx.stroke();

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(baseX + 24, 45);
        ctx.lineTo(baseX + 24, canvas.height - 45);
        ctx.stroke();

        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ef4444';
        ctx.fillText('+', baseX - 24, 30);
        ctx.fillStyle = '#3b82f6';
        ctx.fillText('−', baseX + 24, 30);

        for (let r = 0; r < 24; r++) {
          if (r % 6 === 5) continue;
          const hy = 65 + r * 48;
          drawHole(baseX - 10, hy, 5);
          drawHole(baseX + 10, hy, 5);
        }
      };

      drawPowerRail(52);
      drawPowerRail(canvas.width - 52);

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(canvas.width / 2 - 22, 35, 44, canvas.height - 70);

      const colsLeft = [145, 190, 235, 280, 325];
      const colsRight = [443, 488, 533, 578, 623];
      const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      [...colsLeft, ...colsRight].forEach((cx, idx) => {
        ctx.fillText(letters[idx], cx, 32);
      });

      for (let row = 0; row < 25; row++) {
        const hy = 65 + row * 48;
        if (row % 5 === 0) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 15px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(String(row + 1), 125, hy + 5);
        }
        colsLeft.forEach((cx) => drawHole(cx, hy));
        colsRight.forEach((cx) => drawHole(cx, hy));
      }
    } else {
      // CARRIER breadboard aligned 1:1 with ESP32 DevKit pins (-2.07 + r * 0.23)
      ctx.strokeStyle = '#00878a';
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 3;
      ctx.strokeRect(114, 60, canvas.width - 228, canvas.height - 120);
      ctx.setLineDash([]);

      const toPxX = (worldX: number) =>
        ((worldX - Circuit3DBreadboardModel.ESP_OFFSET_X) / Circuit3DBreadboardModel.CARRIER_WIDTH +
          0.5) *
        canvas.width;
      const toPxY = (worldZ: number) =>
        (worldZ / Circuit3DBreadboardModel.CARRIER_LENGTH + 0.5) * canvas.height;

      const leftPinX = Circuit3DBreadboardModel.ESP_OFFSET_X - 1.25;
      const rightPinX = Circuit3DBreadboardModel.ESP_OFFSET_X + 1.25;
      const step = 0.16;

      for (let r = 0; r < 19; r++) {
        const wz = -2.07 + r * 0.23;
        const hy = toPxY(wz);

        // ESP32 pin socket holes
        drawHole(toPxX(leftPinX), hy, 6);
        drawHole(toPxX(rightPinX), hy, 6);

        // Accessible outer tie-point holes on the same row
        [0, 1].forEach((colOffset) => {
          drawHole(toPxX(leftPinX - 0.18 - colOffset * step), hy, 5.5);
          drawHole(toPxX(rightPinX + 0.18 + colOffset * step), hy, 5.5);
        });
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAnisotropy;
    return tex;
  }

  /**
   * Neat DuPont jumper wire where the start and end plugs sit firmly inside
   * actual breadboard sockets (or on horizontal LCD I2C header pins), and
   * the insulated wire exits smoothly from the top of each DuPont sleeve.
   */
  private createRoutedWire(
    start: { x: number; y: number; z: number },
    waypoints: Array<{ x: number; y: number; z: number }>,
    end: { x: number; y: number; z: number },
    colorHex: number,
    pinId: number,
    label: string,
    sublabel: string,
    targetGroup: THREE.Group,
    wireId: string,
    endPlugVertical = true
  ) {
    const hexStr = `#${colorHex.toString(16).padStart(6, '0')}`;
    const pickMeta: ComponentPickMeta = {
      pinId,
      componentName: `Cable ${label}`,
      connectionDetail: sublabel,
      colorHex: hexStr,
    };

    const wireGroup = new THREE.Group();
    wireGroup.userData = { ...pickMeta, name: `${label} (${sublabel})` };

    const points: THREE.Vector3[] = [
      new THREE.Vector3(start.x, start.y + 0.14, start.z),
      new THREE.Vector3(start.x, start.y + 0.24, start.z),
      ...waypoints.map((w) => new THREE.Vector3(w.x, w.y, w.z)),
      endPlugVertical
        ? new THREE.Vector3(end.x, end.y + 0.24, end.z)
        : new THREE.Vector3(end.x - 0.16, end.y, end.z),
      new THREE.Vector3(end.x, end.y + (endPlugVertical ? 0.14 : 0), end.z),
    ];

    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.28);
    const tubeGeom = new THREE.TubeGeometry(curve, 52, 0.025, 10, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.34,
      metalness: 0.08,
    });
    const wireMesh = new THREE.Mesh(tubeGeom, tubeMat);
    wireMesh.castShadow = true;
    wireMesh.userData = { ...pickMeta, name: `${label} (${sublabel})` };
    wireGroup.add(wireMesh);
    this.pickableMeshes.push(wireMesh);

    this.wireVisuals.push({
      pinId,
      mat: tubeMat,
      baseColor: colorHex,
      colorHex: hexStr,
      group: targetGroup,
      label,
      sublabel,
    });

    const housingMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.65,
      metalness: 0.1,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
    });
    const housingGeom = new THREE.BoxGeometry(0.072, 0.15, 0.072);
    const pinGeom = new THREE.CylinderGeometry(0.014, 0.014, 0.08, 8);

    // Start DuPont housing seated directly on breadboard hole
    const startHousing = new THREE.Mesh(housingGeom, housingMat);
    startHousing.position.set(start.x, start.y + 0.08, start.z);
    startHousing.castShadow = true;
    startHousing.userData = { ...pickMeta };
    wireGroup.add(startHousing);
    this.pickableMeshes.push(startHousing);

    const startPin = new THREE.Mesh(pinGeom, goldMat);
    startPin.position.set(start.x, start.y + 0.01, start.z);
    wireGroup.add(startPin);

    // End DuPont housing seated directly on breadboard hole
    const endHousing = new THREE.Mesh(housingGeom, housingMat);
    if (endPlugVertical) {
      endHousing.position.set(end.x, end.y + 0.08, end.z);
      const endPin = new THREE.Mesh(pinGeom, goldMat);
      endPin.position.set(end.x, end.y + 0.01, end.z);
      wireGroup.add(endPin);
    } else {
      endHousing.rotation.z = Math.PI / 2;
      endHousing.position.set(end.x - 0.05, end.y, end.z);
    }
    endHousing.castShadow = true;
    endHousing.userData = { ...pickMeta };
    wireGroup.add(endHousing);
    this.pickableMeshes.push(endHousing);

    // Anchor at middle waypoint for optional badge
    const midIdx = Math.floor(points.length / 2);
    const midPt = points[midIdx];
    const anchor = new THREE.Object3D();
    anchor.position.set(midPt.x, midPt.y + 0.08, midPt.z);
    wireGroup.add(anchor);

    this.wireLabels.push({
      id: wireId,
      label,
      sublabel,
      colorHex: hexStr,
      pinId,
      anchor,
    });

    targetGroup.add(wireGroup);
  }

  private createResistor(
    p1: { x: number; y: number; z: number },
    p2: { x: number; y: number; z: number },
    bandColors: number[],
    targetGroup: THREE.Group,
    pickMeta?: ComponentPickMeta
  ) {
    const resGroup = new THREE.Group();
    if (pickMeta) {
      resGroup.userData = { ...pickMeta };
    }
    const midX = (p1.x + p2.x) / 2;
    const midZ = (p1.z + p2.z) / 2;
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const dist = Math.hypot(dx, dz);
    const angle = Math.atan2(dx, dz);

    const leadMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.92,
      roughness: 0.2,
    });

    const yBase = p1.y;
    const resY = yBase + 0.14;
    const spanCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(p1.x, yBase - 0.02, p1.z),
      new THREE.Vector3(p1.x, resY, p1.z),
      new THREE.Vector3(p2.x, resY, p2.z),
      new THREE.Vector3(p2.x, yBase - 0.02, p2.z),
    ]);
    const leadGeom = new THREE.TubeGeometry(spanCurve, 20, 0.015, 8, false);
    const leadMesh = new THREE.Mesh(leadGeom, leadMat);
    leadMesh.castShadow = true;
    if (pickMeta) leadMesh.userData = { ...pickMeta };
    resGroup.add(leadMesh);

    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(midX, resY, midZ);
    bodyGroup.rotation.y = angle;

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xe7c697,
      roughness: 0.45,
      metalness: 0.05,
    });
    const bodyLen = Math.min(0.46, dist * 0.65);
    const bodyMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.072, 0.072, bodyLen, 16),
      bodyMat
    );
    bodyMesh.rotation.x = Math.PI / 2;
    bodyMesh.castShadow = true;
    if (pickMeta) {
      bodyMesh.userData = { ...pickMeta };
      this.pickableMeshes.push(bodyMesh);
    }
    bodyGroup.add(bodyMesh);

    [-bodyLen / 2, bodyLen / 2].forEach((offset) => {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), bodyMat);
      cap.position.z = offset;
      if (pickMeta) cap.userData = { ...pickMeta };
      bodyGroup.add(cap);
    });

    bandColors.forEach((col, i) => {
      const bandZ = -bodyLen * 0.34 + i * (bodyLen * 0.22);
      const bandMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.075, 0.075, 0.036, 16),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 })
      );
      bandMesh.rotation.x = Math.PI / 2;
      bandMesh.position.z = bandZ;
      if (pickMeta) bandMesh.userData = { ...pickMeta };
      bodyGroup.add(bandMesh);
    });

    resGroup.add(bodyGroup);
    targetGroup.add(resGroup);
  }

  // =========================================================================
  // CIRCUIT 1: PRÁCTICA 2 - CONTROL WI-FI DE 3 LEDS (GPIO18, GPIO19, GPIO21)
  // =========================================================================
  private create5mmLedAssembly(
    anodeHole: { x: number; y: number; z: number },
    cathodeHole: { x: number; y: number; z: number },
    baseColorHex: number,
    emissiveColorHex: number,
    lightColorHex: number,
    pinId: number,
    ledName: string,
    targetGroup: THREE.Group
  ): {
    bodyMat: THREE.MeshPhysicalMaterial;
    coreMat: THREE.MeshBasicMaterial;
    glowLight: THREE.PointLight;
  } {
    const bbY = Circuit3DBreadboardModel.MAIN_BB_TOP_Y;
    const ledGroup = new THREE.Group();
    const midZ = (anodeHole.z + cathodeHole.z) / 2;

    const leadMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.92,
      roughness: 0.2,
    });

    // Anode (+) and Cathode (-) metallic legs seated directly into breadboard holes
    const anodeLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.44, 10), leadMat);
    anodeLeg.position.set(anodeHole.x, bbY + 0.22, anodeHole.z);
    ledGroup.add(anodeLeg);

    const cathodeLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.44, 10), leadMat);
    cathodeLeg.position.set(cathodeHole.x, bbY + 0.22, cathodeHole.z);
    ledGroup.add(cathodeLeg);

    // Internal semiconductor die core (bright core glow when energized)
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x334155,
    });
    const innerCore = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.14, 12), coreMat);
    innerCore.position.set(anodeHole.x, bbY + 0.56, midZ);
    ledGroup.add(innerCore);

    // Translucent clearcoat 5mm epoxy lens
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: baseColorHex,
      emissive: emissiveColorHex,
      emissiveIntensity: 0.0,
      roughness: 0.14,
      metalness: 0.04,
      transparent: true,
      opacity: 0.84,
      clearcoat: 1.0,
    });

    const ledColorHex = `#${baseColorHex.toString(16).padStart(6, '0')}`;
    const ledMeta: ComponentPickMeta = {
      pinId,
      componentName: ledName,
      connectionDetail: `Ánodo (+) vía R 330 Ω al pin del ESP32 · Cátodo (−) a GND`,
      colorHex: ledColorHex,
    };

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 24), bodyMat);
    rim.position.set(anodeHole.x, bbY + 0.44, midZ);
    rim.userData = { ...ledMeta, name: ledName };
    ledGroup.add(rim);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.34, 24), bodyMat);
    barrel.position.set(anodeHole.x, bbY + 0.63, midZ);
    barrel.castShadow = true;
    barrel.userData = { ...ledMeta, name: ledName };
    ledGroup.add(barrel);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2),
      bodyMat
    );
    dome.position.set(anodeHole.x, bbY + 0.8, midZ);
    dome.userData = { ...ledMeta, name: ledName };
    ledGroup.add(dome);

    this.pickableMeshes.push(rim, barrel, dome);

    const glowLight = new THREE.PointLight(lightColorHex, 0, 2.8);
    glowLight.position.set(anodeHole.x, bbY + 0.92, midZ);
    ledGroup.add(glowLight);

    targetGroup.add(ledGroup);

    return { bodyMat, coreMat, glowLight };
  }

  private buildWifi3LedsCircuit() {
    const grp = this.circuitGroups.WIFI_3LEDS;
    const bbY = Circuit3DBreadboardModel.MAIN_BB_TOP_Y;

    // 330 Ω Resistor Color Bands: Orange - Orange - Brown - Gold
    const bands330Ohm = [0xf97316, 0xf97316, 0x78350f, 0xeab308];

    // 1. LED VERDE (GPIO 21 / Pin 25) — Rows 4..6
    const greenResL = this.getProtoHole(3, 4); // col d, row 4
    const greenResR = this.getProtoHole(5, 4); // col f, row 4 (bridges central groove)
    this.createResistor(greenResL, greenResR, bands330Ohm, grp, {
      pinId: 25,
      componentName: 'Resistencia 330 Ω (LED Verde)',
      connectionDetail: 'Serie entre GPIO 21 (D21) y ánodo (+) del LED Verde',
      colorHex: '#22c55e',
    });

    const greenAnode = this.getProtoHole(7, 4);   // col h, row 4 (same row as R right leg)
    const greenCathode = this.getProtoHole(7, 6); // col h, row 6
    const greenLed = this.create5mmLedAssembly(
      greenAnode,
      greenCathode,
      0x22c55e,
      0x16a34a,
      0x4ade80,
      25,
      'LED Verde 5mm (GPIO 21)',
      grp
    );
    this.wifiGreenLedMat = greenLed.bodyMat;
    this.wifiGreenCoreMat = greenLed.coreMat;
    this.wifiGreenGlow = greenLed.glowLight;

    // 2. LED AMARILLO (GPIO 19 / Pin 27) — Rows 11..13
    const yellowResL = this.getProtoHole(3, 11);
    const yellowResR = this.getProtoHole(5, 11);
    this.createResistor(yellowResL, yellowResR, bands330Ohm, grp, {
      pinId: 27,
      componentName: 'Resistencia 330 Ω (LED Amarillo)',
      connectionDetail: 'Serie entre GPIO 19 (D19) y ánodo (+) del LED Amarillo',
      colorHex: '#eab308',
    });

    const yellowAnode = this.getProtoHole(7, 11);
    const yellowCathode = this.getProtoHole(7, 13);
    const yellowLed = this.create5mmLedAssembly(
      yellowAnode,
      yellowCathode,
      0xeab308,
      0xca8a04,
      0xfde047,
      27,
      'LED Amarillo 5mm (GPIO 19)',
      grp
    );
    this.wifiYellowLedMat = yellowLed.bodyMat;
    this.wifiYellowCoreMat = yellowLed.coreMat;
    this.wifiYellowGlow = yellowLed.glowLight;

    // 3. LED ROJO (GPIO 18 / Pin 28) — Rows 18..20
    const redResL = this.getProtoHole(3, 18);
    const redResR = this.getProtoHole(5, 18);
    this.createResistor(redResL, redResR, bands330Ohm, grp, {
      pinId: 28,
      componentName: 'Resistencia 330 Ω (LED Rojo)',
      connectionDetail: 'Serie entre GPIO 18 (D18) y ánodo (+) del LED Rojo',
      colorHex: '#ef4444',
    });

    const redAnode = this.getProtoHole(7, 18);
    const redCathode = this.getProtoHole(7, 20);
    const redLed = this.create5mmLedAssembly(
      redAnode,
      redCathode,
      0xef4444,
      0xdc2626,
      0xf87171,
      28,
      'LED Rojo 5mm (GPIO 18)',
      grp
    );
    this.wifiRedLedMat = redLed.bodyMat;
    this.wifiRedCoreMat = redLed.coreMat;
    this.wifiRedGlow = redLed.glowLight;

    // 4. ESP32 Jumper Wires (exact right-side pin order: D21, GND, D19, D18)
    const pinD21 = this.getEspPinBreadboardAnchor(25, 0); // GPIO 21 -> LED Verde
    const pinGnd = this.getEspPinBreadboardAnchor(26, 0); // GND -> Riel azul (-) común
    const pinD19 = this.getEspPinBreadboardAnchor(27, 0); // GPIO 19 -> LED Amarillo
    const pinD18 = this.getEspPinBreadboardAnchor(28, 0); // GPIO 18 -> LED Rojo

    const greenSigHole = this.getProtoHole(0, 4);   // col a, row 4
    const yellowSigHole = this.getProtoHole(0, 11); // col a, row 11
    const redSigHole = this.getProtoHole(0, 18);    // col a, row 18

    // Right Blue (-) Power Rail holes (slots 6, 13, 20, 22 — none on gap indices %6===5)
    const railGndGreen = this.getProtoRailHole('RIGHT', 'MINUS', 6);
    const railGndYellow = this.getProtoRailHole('RIGHT', 'MINUS', 13);
    const railGndRed = this.getProtoRailHole('RIGHT', 'MINUS', 20);
    const railGndMain = this.getProtoRailHole('RIGHT', 'MINUS', 22);

    // Wire 1 (Verde): GPIO 21 -> R 330Ω -> LED Verde
    this.createRoutedWire(
      pinD21,
      [
        { x: 0.12, y: bbY + 0.1, z: pinD21.z },
        { x: 0.12, y: bbY + 0.1, z: greenSigHole.z },
      ],
      greenSigHole,
      0x22c55e,
      25,
      'GPIO 21 · VERDE',
      'Pin 25 (D21) → R 330Ω → LED Verde',
      grp,
      'wifi_led_green',
      true
    );

    // Wire 2 (Amarillo): GPIO 19 -> R 330Ω -> LED Amarillo
    this.createRoutedWire(
      pinD19,
      [
        { x: 0.28, y: bbY + 0.12, z: pinD19.z },
        { x: 0.28, y: bbY + 0.12, z: yellowSigHole.z },
      ],
      yellowSigHole,
      0xeab308,
      27,
      'GPIO 19 · AMARILLO',
      'Pin 27 (D19) → R 330Ω → LED Amarillo',
      grp,
      'wifi_led_yellow',
      true
    );

    // Wire 3 (Rojo): GPIO 18 -> R 330Ω -> LED Rojo
    this.createRoutedWire(
      pinD18,
      [
        { x: 0.44, y: bbY + 0.12, z: pinD18.z },
        { x: 0.44, y: bbY + 0.12, z: redSigHole.z },
      ],
      redSigHole,
      0xef4444,
      28,
      'GPIO 18 · ROJO',
      'Pin 28 (D18) → R 330Ω → LED Rojo',
      grp,
      'wifi_led_red',
      true
    );

    // Wire 4 (Negro): ESP32 GND -> Bottom perimeter -> Right Blue (-) Common Rail
    this.createRoutedWire(
      pinGnd,
      [
        { x: -0.1, y: bbY + 0.04, z: pinGnd.z },
        { x: -0.1, y: bbY + 0.04, z: 2.38 },
        { x: railGndMain.x, y: bbY + 0.04, z: 2.38 },
      ],
      railGndMain,
      0x1e293b,
      26,
      'GND · COMÚN',
      'Retorno común 0V → Todos los cátodos (−)',
      grp,
      'wifi_gnd_main',
      true
    );

    // 5. Short Black Cathode Jumpers: each LED Cathode (col j) -> Right Blue (-) Rail
    this.createRoutedWire(
      this.getProtoHole(9, 6),
      [{ x: (this.getProtoHole(9, 6).x + railGndGreen.x) / 2, y: bbY + 0.16, z: railGndGreen.z }],
      railGndGreen,
      0x1e293b,
      26,
      'Cátodo Verde',
      'Cátodo (−) LED Verde → Riel GND',
      grp,
      'wifi_gnd_green',
      true
    );

    this.createRoutedWire(
      this.getProtoHole(9, 13),
      [{ x: (this.getProtoHole(9, 13).x + railGndYellow.x) / 2, y: bbY + 0.16, z: railGndYellow.z }],
      railGndYellow,
      0x1e293b,
      26,
      'Cátodo Amarillo',
      'Cátodo (−) LED Amarillo → Riel GND',
      grp,
      'wifi_gnd_yellow',
      true
    );

    this.createRoutedWire(
      this.getProtoHole(9, 20),
      [{ x: (this.getProtoHole(9, 20).x + railGndRed.x) / 2, y: bbY + 0.16, z: railGndRed.z }],
      railGndRed,
      0x1e293b,
      26,
      'Cátodo Rojo',
      'Cátodo (−) LED Rojo → Riel GND',
      grp,
      'wifi_gnd_red',
      true
    );
  }

  // =========================================================================
  // CIRCUIT 2: SENSOR ANALÓGICO DE LUZ LDR (GL5528 + R 10kΩ)
  // =========================================================================
  private buildLdrCircuit(maxAnisotropy: number) {
    const grp = this.circuitGroups.LDR_ANALOG;
    const bbY = Circuit3DBreadboardModel.MAIN_BB_TOP_Y;

    // Exact breadboard holes for LDR (row 6 col 'e' to row 9 col 'e') & 10kΩ (row 9 col 'd' to row 14 col 'd')
    const ldrHole1 = this.getProtoHole(4, 6);
    const ldrHole2 = this.getProtoHole(4, 9);
    const resHole1 = this.getProtoHole(3, 9);
    const resHole2 = this.getProtoHole(3, 14);

    // 1. Prominent GL5528 LDR Photoresistor plugged into real breadboard holes
    const ldrGroup = new THREE.Group();
    const leadMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.92,
      roughness: 0.2,
    });
    [ldrHole1, ldrHole2].forEach((hole) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.56, 10), leadMat);
      leg.position.set(hole.x, bbY + 0.27, hole.z);
      ldrGroup.add(leg);
    });

    const ldrMidZ = (ldrHole1.z + ldrHole2.z) / 2;
    const ldrTex = this.createLdrTexture(maxAnisotropy);
    const ldrBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.11, 28),
      new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        roughness: 0.35,
        metalness: 0.05,
        map: ldrTex,
      })
    );
    ldrBody.position.set(ldrHole1.x, bbY + 0.58, ldrMidZ);
    ldrBody.rotation.x = 0.38;
    ldrBody.castShadow = true;
    ldrBody.userData = {
      pinId: 5,
      componentName: 'Fotorresistencia LDR GL5528',
      connectionDetail: 'Divisor de tensión 3.3V → GPIO 34 (ADC1_CH6)',
      colorHex: '#f97316',
    };
    this.pickableMeshes.push(ldrBody);
    ldrGroup.add(ldrBody);

    this.ldrLightOrbMat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.45,
    });
    const lightOrb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 20), this.ldrLightOrbMat);
    lightOrb.position.set(ldrHole1.x, bbY + 1.25, ldrMidZ);
    ldrGroup.add(lightOrb);

    this.ldrLightPoint = new THREE.PointLight(0xfacc15, 0.8, 3.2);
    this.ldrLightPoint.position.set(ldrHole1.x, bbY + 1.15, ldrMidZ);
    ldrGroup.add(this.ldrLightPoint);

    grp.add(ldrGroup);

    // 2. 10kΩ Resistor (row 9 col 'd' -> row 14 col 'd')
    this.createResistor(resHole1, resHole2, [0x78350f, 0x09090b, 0xf97316, 0xeab308], grp, {
      pinId: 5,
      componentName: 'Resistencia Divisor 10 kΩ',
      connectionDetail: 'Pull-down entre nodo GPIO 34 (Pin 5) y GND',
      colorHex: '#f97316',
    });

    // 3. Jumper Wires plugged into shared horizontal rows (a, b)
    const pin3V3 = this.getEspPinBreadboardAnchor(1, 0);  // Left Pin 1 = 3V3
    const pinD34 = this.getEspPinBreadboardAnchor(5, 0);  // Left Pin 5 = GPIO34 (ADC1)
    const pinGnd = this.getEspPinBreadboardAnchor(14, 0); // Left Pin 14 = GND

    const ldrVccTarget = this.getProtoHole(1, 6);
    const adcMidTarget = this.getProtoHole(0, 9);
    const gndResTarget = this.getProtoHole(1, 14);

    // Red: 3V3 -> row 6 col b
    this.createRoutedWire(
      pin3V3,
      [
        { x: pin3V3.x - 0.16, y: bbY + 0.04, z: -2.42 },
        { x: 0.15, y: bbY + 0.04, z: -2.42 },
        { x: 0.15, y: bbY + 0.04, z: ldrVccTarget.z },
      ],
      ldrVccTarget,
      0xef4444,
      1,
      '3V3',
      'Alimentación 3.3V → LDR',
      grp,
      'ldr_3v3',
      true
    );

    // Orange: GPIO34 -> row 9 col a (midpoint divider)
    this.createRoutedWire(
      pinD34,
      [
        { x: pinD34.x - 0.3, y: bbY + 0.04, z: pinD34.z },
        { x: pinD34.x - 0.3, y: bbY + 0.04, z: -2.58 },
        { x: 0.32, y: bbY + 0.04, z: -2.58 },
        { x: 0.32, y: bbY + 0.04, z: adcMidTarget.z },
      ],
      adcMidTarget,
      0xf97316,
      5,
      'ADC1 · GPIO34',
      'Lectura Voltaje Divisor (Pin 5)',
      grp,
      'ldr_adc',
      true
    );

    // Black: GND -> row 14 col b (10kΩ bottom leg)
    this.createRoutedWire(
      pinGnd,
      [
        { x: pinGnd.x - 0.22, y: bbY + 0.04, z: pinGnd.z },
        { x: pinGnd.x - 0.22, y: bbY + 0.04, z: 2.45 },
        { x: 0.2, y: bbY + 0.04, z: 2.45 },
        { x: 0.2, y: bbY + 0.04, z: gndResTarget.z },
      ],
      gndResTarget,
      0x1e293b,
      14,
      'GND',
      'Tierra 0V → R 10kΩ',
      grp,
      'ldr_gnd',
      true
    );
  }

  private createLdrTexture(maxAnisotropy: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#fde68a';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let y = 48; y <= 208; y += 32) {
      const left = 48;
      const right = 208;
      if (((y - 48) / 32) % 2 === 0) {
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
      } else {
        ctx.moveTo(right, y);
        ctx.lineTo(left, y);
      }
    }
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAnisotropy;
    return tex;
  }

  // =========================================================================
  // CIRCUIT 3: LED AZUL 5mm & RESISTENCIA 220Ω EN GPIO2
  // =========================================================================
  private buildBlinkCircuit() {
    const grp = this.circuitGroups.GPIO2_BLINK;
    const bbY = Circuit3DBreadboardModel.MAIN_BB_TOP_Y;

    // 1. 220Ω Current Limiting Resistor: row 8 col c -> row 11 col c
    const resTop = this.getProtoHole(2, 8);
    const resBot = this.getProtoHole(2, 11);
    this.createResistor(resTop, resBot, [0xef4444, 0xef4444, 0x78350f, 0xeab308], grp, {
      pinId: 33,
      componentName: 'Resistencia Limitadora 220 Ω',
      connectionDetail: 'Serie entre GPIO 2 (D2 · Pin 33) y ánodo (+) del LED Azul',
      colorHex: '#3b82f6',
    });

    // 2. 5mm Blue Dome LED plugged into row 11 col e (Anode +) and row 13 col e (Cathode -)
    // Connected directly on the breadboard row 11 to the resistor!
    const ledAnodeHole = this.getProtoHole(4, 11);
    const ledCathodeHole = this.getProtoHole(4, 13);

    const ledGroup = new THREE.Group();
    const ledMidZ = (ledAnodeHole.z + ledCathodeHole.z) / 2;

    const leadMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.92,
      roughness: 0.2,
    });
    const anodeLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.44, 10), leadMat);
    anodeLeg.position.set(ledAnodeHole.x, bbY + 0.22, ledAnodeHole.z);
    ledGroup.add(anodeLeg);

    const cathodeLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.44, 10), leadMat);
    cathodeLeg.position.set(ledCathodeHole.x, bbY + 0.22, ledCathodeHole.z);
    ledGroup.add(cathodeLeg);

    this.extLedMat = new THREE.MeshPhysicalMaterial({
      color: 0x3b82f6,
      emissive: 0x2563eb,
      emissiveIntensity: 0.0,
      roughness: 0.16,
      metalness: 0.05,
      transparent: true,
      opacity: 0.85,
      clearcoat: 1.0,
    });

    const blinkLedMeta: ComponentPickMeta = {
      pinId: 33,
      componentName: 'LED Azul 5mm (GPIO 2)',
      connectionDetail: 'Controlado por GPIO 2 (Pin 33) vía R 220 Ω · Cátodo a GND',
      colorHex: '#3b82f6',
    };

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 24), this.extLedMat);
    rim.position.set(ledAnodeHole.x, bbY + 0.44, ledMidZ);
    rim.userData = { ...blinkLedMeta };
    ledGroup.add(rim);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.32, 24), this.extLedMat);
    barrel.position.set(ledAnodeHole.x, bbY + 0.62, ledMidZ);
    barrel.userData = { ...blinkLedMeta };
    ledGroup.add(barrel);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2),
      this.extLedMat
    );
    dome.position.set(ledAnodeHole.x, bbY + 0.78, ledMidZ);
    dome.userData = { ...blinkLedMeta };
    ledGroup.add(dome);
    this.pickableMeshes.push(rim, barrel, dome);

    this.extLedGlow = new THREE.PointLight(0x38bdf8, 0, 3.2);
    this.extLedGlow.position.set(ledAnodeHole.x, bbY + 0.88, ledMidZ);
    ledGroup.add(this.extLedGlow);

    grp.add(ledGroup);

    // 3. Jumper Wires from ESP32 GPIO2 (Pin 33) -> row 8 col b, & GND (Pin 26) -> row 13 col b
    const pinD2 = this.getEspPinBreadboardAnchor(33, 0);
    const pinGnd = this.getEspPinBreadboardAnchor(26, 0);

    const gpio2Target = this.getProtoHole(1, 8);
    const gndTarget = this.getProtoHole(1, 13);

    this.createRoutedWire(
      pinD2,
      [{ x: 0.15, y: bbY + 0.05, z: gpio2Target.z }],
      gpio2Target,
      0x3b82f6,
      33,
      'PWM · GPIO2',
      'Señal Digital/PWM (Pin 33)',
      grp,
      'blink_gpio2',
      true
    );

    this.createRoutedWire(
      pinGnd,
      [{ x: 0.32, y: bbY + 0.05, z: gndTarget.z }],
      gndTarget,
      0x1e293b,
      26,
      'GND',
      'Cátodo LED (−) → Tierra 0V',
      grp,
      'blink_gnd',
      true
    );
  }

  // =========================================================================
  // CIRCUIT 4: BOTONES BOOT (GPIO0) & HARDWARE RESET (EN)
  // =========================================================================
  private buildBootInterruptCircuit() {
    const grp = this.circuitGroups.BOOT_INTERRUPT;
    const bbY = Circuit3DBreadboardModel.MAIN_BB_TOP_Y;

    // 1. Tactile Pushbutton straddling central ravine across rows 6 and 9 (cols e & f)
    const swTopLeft = this.getProtoHole(4, 6);
    const swBotLeft = this.getProtoHole(4, 9);
    const swTopRight = this.getProtoHole(5, 6);

    const swCenterX = (swTopLeft.x + swTopRight.x) / 2;
    const swCenterZ = (swTopLeft.z + swBotLeft.z) / 2;

    const swGroup = new THREE.Group();
    swGroup.position.set(swCenterX, bbY, swCenterZ);

    const resetBtnMeta: ComponentPickMeta = {
      pinId: 2,
      componentName: 'Pulsador Táctil Reset (EN)',
      connectionDetail: 'Conecta Pin 2 (EN / CHIP_PU) a GND para reinicio en frío',
      colorHex: '#10b981',
    };

    const swBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.18, 0.58),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
    );
    swBase.position.y = 0.09;
    swBase.castShadow = true;
    swBase.userData = { ...resetBtnMeta };
    swGroup.add(swBase);

    const swMetalPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.035, 0.59),
      new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.25 })
    );
    swMetalPlate.position.y = 0.19;
    swMetalPlate.userData = { ...resetBtnMeta };
    swGroup.add(swMetalPlate);

    this.extResetCapMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.16, 22),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 })
    );
    this.extResetCapMesh.position.y = 0.28;
    this.extResetCapMesh.castShadow = true;
    this.extResetCapMesh.userData = { ...resetBtnMeta };
    swGroup.add(this.extResetCapMesh);
    this.pickableMeshes.push(swBase, this.extResetCapMesh);

    grp.add(swGroup);

    // 2. 220Ω Resistor (row 14 col c -> row 17 col c) & Status LED (row 17 col e -> row 19 col e)
    const stResTop = this.getProtoHole(2, 14);
    const stResBot = this.getProtoHole(2, 17);
    this.createResistor(stResTop, stResBot, [0xef4444, 0xef4444, 0x78350f, 0xeab308], grp, {
      pinId: 1,
      componentName: 'Resistencia 220 Ω (LED Estado)',
      connectionDetail: 'Alimentada desde 3V3 (Pin 1) hacia LED de estado',
      colorHex: '#f59e0b',
    });

    const stLedAnode = this.getProtoHole(4, 17);
    const stLedCathode = this.getProtoHole(4, 19);
    const stLedMidZ = (stLedAnode.z + stLedCathode.z) / 2;

    const statusLedGroup = new THREE.Group();
    const leadMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.92,
      roughness: 0.2,
    });
    [stLedAnode, stLedCathode].forEach((hole) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 10), leadMat);
      leg.position.set(hole.x, bbY + 0.17, hole.z);
      statusLedGroup.add(leg);
    });

    this.extBootLedMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.2,
      roughness: 0.18,
      transparent: true,
      opacity: 0.88,
      clearcoat: 1.0,
    });
    const statusLedMeta: ComponentPickMeta = {
      pinId: 1,
      componentName: 'LED Ámbar de Estado',
      connectionDetail: 'Alimentación 3V3 (Pin 1) vía R 220 Ω · Cátodo a GND',
      colorHex: '#f59e0b',
    };
    const stBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.3, 20),
      this.extBootLedMat
    );
    stBarrel.position.set(stLedAnode.x, bbY + 0.34, stLedMidZ);
    stBarrel.userData = { ...statusLedMeta };
    statusLedGroup.add(stBarrel);

    const stDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      this.extBootLedMat
    );
    stDome.position.set(stLedAnode.x, bbY + 0.49, stLedMidZ);
    stDome.userData = { ...statusLedMeta };
    statusLedGroup.add(stDome);
    this.pickableMeshes.push(stBarrel, stDome);
    grp.add(statusLedGroup);

    // 3. Breadboard-authentic Jumper Wires
    const pinEN = this.getEspPinBreadboardAnchor(2, 0);   // Left Pin 2 = EN
    const pin3V3 = this.getEspPinBreadboardAnchor(1, 0);  // Left Pin 1 = 3V3
    const pinGnd = this.getEspPinBreadboardAnchor(20, 0); // Right Pin 20 = GND

    const enTarget = this.getProtoHole(1, 6);
    const swGndTarget = this.getProtoHole(1, 9);
    const swGndJump = this.getProtoHole(0, 9);
    const ledGndTarget = this.getProtoHole(0, 19);
    const vccLedTarget = this.getProtoHole(1, 14);

    // Emerald: EN -> Switch top-left (row 6 col b)
    this.createRoutedWire(
      pinEN,
      [
        { x: pinEN.x - 0.18, y: bbY + 0.04, z: -2.4 },
        { x: 0.1, y: bbY + 0.04, z: -2.4 },
        { x: 0.1, y: bbY + 0.04, z: enTarget.z },
      ],
      enTarget,
      0x10b981,
      2,
      'EN · CHIP_PU',
      'Botón Reset Externo (Pin 2)',
      grp,
      'boot_en',
      true
    );

    // Black: GND -> Switch bottom-left (row 9 col b)
    this.createRoutedWire(
      pinGnd,
      [{ x: 0.25, y: bbY + 0.04, z: swGndTarget.z }],
      swGndTarget,
      0x1e293b,
      20,
      'GND',
      'Referencia común 0V',
      grp,
      'boot_gnd',
      true
    );

    // Black jumper on breadboard: Switch GND row 9 col a -> LED Cathode row 19 col a
    this.createRoutedWire(
      swGndJump,
      [{ x: 1.05, y: bbY + 0.04, z: (swGndJump.z + ledGndTarget.z) / 2 }],
      ledGndTarget,
      0x1e293b,
      20,
      'GND LED',
      'Cátodo LED Estado → Tierra',
      grp,
      'boot_gnd_led',
      true
    );

    // Amber: 3V3 -> Status LED Resistor (row 14 col b)
    this.createRoutedWire(
      pin3V3,
      [
        { x: pin3V3.x - 0.32, y: bbY + 0.04, z: -2.58 },
        { x: 0.38, y: bbY + 0.04, z: -2.58 },
        { x: 0.38, y: bbY + 0.04, z: vccLedTarget.z },
      ],
      vccLedTarget,
      0xf59e0b,
      1,
      '3V3 · STATUS',
      'Alimentación LED Estado',
      grp,
      'boot_status',
      true
    );
  }

  // =========================================================================
  // LIVE STATE SYNC
  // =========================================================================
  public setActiveCircuit(type: CircuitType) {
    if (this.activeType === type) return;
    this.activeType = type;
    (Object.keys(this.circuitGroups) as CircuitType[]).forEach((key) => {
      this.circuitGroups[key].visible = key === type;
    });
    if (this.highlightedPinId !== null) {
      this.setHighlightedPin(null);
    }
  }

  public getVisibleWireLabels(): CircuitWireLabel[] {
    const activeGrp = this.circuitGroups[this.activeType];
    return this.wireLabels.filter((wl) => {
      let cur: THREE.Object3D | null = wl.anchor;
      while (cur) {
        if (cur === activeGrp) return true;
        cur = cur.parent;
      }
      return false;
    });
  }

  public updateFromState(state: CircuitState) {
    this.setActiveCircuit(state.type);

    if (state.type === 'WIFI_3LEDS') {
      const redOn = !state.enResetTriggered && state.wifiLedRed;
      const yellowOn = !state.enResetTriggered && state.wifiLedYellow;
      const greenOn = !state.enResetTriggered && state.wifiLedGreen;

      this.wifiRedLedMat.emissiveIntensity = redOn ? 2.4 : 0.0;
      this.wifiRedCoreMat.color.setHex(redOn ? 0xfecaca : 0x450a0a);
      this.wifiRedGlow.intensity = redOn ? 2.2 : 0.0;

      this.wifiYellowLedMat.emissiveIntensity = yellowOn ? 2.4 : 0.0;
      this.wifiYellowCoreMat.color.setHex(yellowOn ? 0xfef9c3 : 0x422006);
      this.wifiYellowGlow.intensity = yellowOn ? 2.2 : 0.0;

      this.wifiGreenLedMat.emissiveIntensity = greenOn ? 2.4 : 0.0;
      this.wifiGreenCoreMat.color.setHex(greenOn ? 0xbbf7d0 : 0x052e16);
      this.wifiGreenGlow.intensity = greenOn ? 2.2 : 0.0;
    }

    if (state.type === 'LDR_ANALOG') {
      const normLux = THREE.MathUtils.clamp(state.ldrLightLux / 1000, 0, 1);
      this.ldrLightOrbMat.opacity = 0.12 + normLux * 0.78;
      this.colorTmp.setHSL(0.13, 0.95, 0.25 + normLux * 0.45);
      this.ldrLightOrbMat.color.copy(this.colorTmp);
      this.ldrLightPoint.intensity = normLux * 2.4;
    }

    if (state.type === 'GPIO2_BLINK') {
      let intensity = 0;
      if (!state.enResetTriggered) {
        if (state.ledMode === 'PWM') {
          intensity = (state.ledDutyCycle / 100) * 2.2;
        } else {
          intensity = state.ledState ? 2.2 : 0.0;
        }
      }
      this.extLedMat.emissiveIntensity = intensity;
      this.extLedGlow.intensity = intensity * 0.95;
    }

    if (state.type === 'BOOT_INTERRUPT') {
      this.extResetCapMesh.position.y = state.enResetTriggered ? 0.21 : 0.28;
      this.extBootLedMat.emissiveIntensity = state.bootPressed || state.bootModeActive ? 2.0 : 0.35;
    }
  }

  public dispose() {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}
