import * as THREE from 'three';
import { ESP32_PINS, ESP32_BLUEPRINT_CALLOUTS } from '../../data/esp32Data';

export class ESP32BoardModel {
  public group: THREE.Group;
  
  // Subgroups for exploded view animation
  public pcbGroup: THREE.Group;
  public moduleGroup: THREE.Group;
  public shieldGroup: THREE.Group;
  public componentsGroup: THREE.Group;
  public pinHeadersGroup: THREE.Group;
  public hotspotsGroup: THREE.Group;
  public pickableMeshes: THREE.Object3D[] = [];

  // Interactive dynamic elements
  private pwrLedMaterial!: THREE.MeshStandardMaterial;
  private userLedMaterial!: THREE.MeshStandardMaterial;
  private userLedGlow!: THREE.PointLight;
  private enButtonMesh!: THREE.Mesh;
  private bootButtonMesh!: THREE.Mesh;

  // Pin & Hotspot references
  public pinAnchorObjects: Map<number, THREE.Object3D> = new Map();
  public hotspotObjects: Map<string, THREE.Object3D> = new Map();

  // Animation states
  public currentExplodedProgress = 0;
  public targetExplodedProgress = 0;

  // Button press states
  private enButtonDepressed = 0;
  private bootButtonDepressed = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'ESP32_DevKit_Root';

    this.pcbGroup = new THREE.Group();
    this.pcbGroup.name = 'PCB_Layer';
    this.moduleGroup = new THREE.Group();
    this.moduleGroup.name = 'ESP_WROOM_32_Module';
    this.shieldGroup = new THREE.Group();
    this.shieldGroup.name = 'RF_Metal_Shield';
    this.componentsGroup = new THREE.Group();
    this.componentsGroup.name = 'SMD_Components';
    this.pinHeadersGroup = new THREE.Group();
    this.pinHeadersGroup.name = 'Pin_Headers';
    this.hotspotsGroup = new THREE.Group();
    this.hotspotsGroup.name = 'Teal_Blueprint_Hotspots';

    this.group.add(this.pcbGroup);
    this.group.add(this.moduleGroup);
    this.group.add(this.shieldGroup);
    this.group.add(this.componentsGroup);
    this.group.add(this.pinHeadersGroup);
    this.group.add(this.hotspotsGroup);

    this.buildProceduralModel();
    this.buildHotspots();
  }

  private buildProceduralModel() {
    const pcbWidth = 2.8;
    const pcbLength = 5.2;
    const pcbThickness = 0.16;

    // 1. PCB FR4 Board Material with high-resolution texture
    const pcbTexture = this.createPcbSilkscreenTexture();
    const pcbMaterial = new THREE.MeshStandardMaterial({
      color: 0x14161b,
      roughness: 0.65,
      metalness: 0.18,
      map: pcbTexture,
      bumpMap: pcbTexture,
      bumpScale: 0.006,
    });

    const pcbGeometry = new THREE.BoxGeometry(pcbWidth, pcbThickness, pcbLength);
    const pcbMesh = new THREE.Mesh(pcbGeometry, pcbMaterial);
    pcbMesh.receiveShadow = true;
    pcbMesh.castShadow = true;
    pcbMesh.userData = { partId: 'pcb', name: 'Placa PCB FR4' };
    this.pcbGroup.add(pcbMesh);
    this.pickableMeshes.push(pcbMesh);

    // Mounting holes M3 at the 4 corners
    const holeRadius = 0.14;
    const goldPadMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.22,
    });
    const drillHoleMat = new THREE.MeshBasicMaterial({ color: 0x050505 });

    const holePositions = [
      [-pcbWidth / 2 + 0.35, pcbLength / 2 - 0.35],
      [pcbWidth / 2 - 0.35, pcbLength / 2 - 0.35],
      [-pcbWidth / 2 + 0.35, -pcbLength / 2 + 0.35],
      [pcbWidth / 2 - 0.35, -pcbLength / 2 + 0.35],
    ];

    holePositions.forEach(([hx, hz]) => {
      const ringGeom = new THREE.RingGeometry(holeRadius, holeRadius + 0.09, 20);
      const ringMeshTop = new THREE.Mesh(ringGeom, goldPadMaterial);
      ringMeshTop.rotation.x = -Math.PI / 2;
      ringMeshTop.position.set(hx, pcbThickness / 2 + 0.001, hz);
      this.pcbGroup.add(ringMeshTop);

      const ringMeshBot = new THREE.Mesh(ringGeom, goldPadMaterial);
      ringMeshBot.rotation.x = Math.PI / 2;
      ringMeshBot.position.set(hx, -pcbThickness / 2 - 0.001, hz);
      this.pcbGroup.add(ringMeshBot);

      const holeMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(holeRadius, holeRadius, pcbThickness * 1.05, 20),
        drillHoleMat
      );
      holeMesh.position.set(hx, 0, hz);
      this.pcbGroup.add(holeMesh);
    });

    // 2. ESP-WROOM-32 Module Substrate & MIFA Antenna
    const moduleWidth = 1.8;
    const moduleLength = 2.5;
    const moduleThickness = 0.1;
    const moduleSubstrateGeom = new THREE.BoxGeometry(moduleWidth, moduleThickness, moduleLength);
    const moduleSubstrateMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c10,
      roughness: 0.8,
      metalness: 0.2,
    });
    const moduleSubstrateMesh = new THREE.Mesh(moduleSubstrateGeom, moduleSubstrateMat);
    moduleSubstrateMesh.position.set(0, pcbThickness / 2 + moduleThickness / 2, -1.05);
    moduleSubstrateMesh.castShadow = true;
    moduleSubstrateMesh.userData = { partId: 'esp_wroom_32', name: 'Módulo ESP-WROOM-32' };
    this.moduleGroup.add(moduleSubstrateMesh);
    this.pickableMeshes.push(moduleSubstrateMesh);

    // Castellated edge solder pads around module
    const solderMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.18,
    });
    for (let i = 0; i < 14; i++) {
      const padZ = -1.05 + (i - 6.5) * 0.14;
      if (padZ < -1.8) continue;
      const leftPad = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.08), solderMaterial);
      leftPad.position.set(-moduleWidth / 2, pcbThickness / 2 + 0.035, padZ);
      this.moduleGroup.add(leftPad);

      const rightPad = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.08), solderMaterial);
      rightPad.position.set(moduleWidth / 2, pcbThickness / 2 + 0.035, padZ);
      this.moduleGroup.add(rightPad);
    }

    // Bottom edge pads of module
    for (let j = 0; j < 10; j++) {
      const padX = (j - 4.5) * 0.15;
      const botPad = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.08), solderMaterial);
      botPad.position.set(padX, pcbThickness / 2 + 0.035, -1.05 + moduleLength / 2);
      this.moduleGroup.add(botPad);
    }

    // MIFA PCB Antenna
    const antennaTexture = this.createAntennaTexture();
    const antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0x141a13,
      roughness: 0.55,
      metalness: 0.3,
      map: antennaTexture,
      bumpMap: antennaTexture,
      bumpScale: 0.015,
    });
    const antennaGeom = new THREE.BoxGeometry(moduleWidth - 0.04, 0.02, 0.65);
    const antennaMesh = new THREE.Mesh(antennaGeom, antennaMaterial);
    antennaMesh.position.set(0, pcbThickness / 2 + moduleThickness + 0.01, -1.95);
    antennaMesh.userData = { partId: 'pcb_antenna', name: 'Antena PCB MIFA 2.4GHz' };
    this.moduleGroup.add(antennaMesh);
    this.pickableMeshes.push(antennaMesh);

    // 3. Metal RF Shield (Can with laser engravings)
    const shieldWidth = 1.72;
    const shieldLength = 1.65;
    const shieldHeight = 0.24;
    const shieldTexture = this.createRfShieldTexture();

    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xd8dde3,
      metalness: 0.92,
      roughness: 0.24,
      map: shieldTexture,
      bumpMap: shieldTexture,
      bumpScale: 0.008,
    });

    const shieldGeom = new THREE.BoxGeometry(shieldWidth, shieldHeight, shieldLength);
    const shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
    shieldMesh.position.set(0, pcbThickness / 2 + moduleThickness + shieldHeight / 2, -0.75);
    shieldMesh.castShadow = true;
    shieldMesh.receiveShadow = true;
    shieldMesh.userData = { partId: 'esp_wroom_32', name: 'Módulo ESP-WROOM-32' };
    this.shieldGroup.add(shieldMesh);
    this.pickableMeshes.push(shieldMesh);

    // 40 MHz Crystal Oscillator next to ESP32 module
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xcfd5dc,
      metalness: 0.95,
      roughness: 0.15,
    });
    const crystalMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.22), crystalMat);
    crystalMesh.position.set(0.68, pcbThickness / 2 + 0.04, 0.55);
    crystalMesh.castShadow = true;
    this.componentsGroup.add(crystalMesh);

    // 4. Silicon Labs CP2102 IC
    const cp2102Width = 0.55;
    const cp2102Length = 0.55;
    const cp2102Height = 0.12;
    const icTexture = this.createIcTexture('SILABS', 'CP2102');
    const icMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1c22,
      roughness: 0.55,
      metalness: 0.2,
      map: icTexture,
    });
    const cp2102Mesh = new THREE.Mesh(
      new THREE.BoxGeometry(cp2102Width, cp2102Height, cp2102Length),
      icMaterial
    );
    cp2102Mesh.position.set(0, pcbThickness / 2 + cp2102Height / 2, 1.25);
    cp2102Mesh.castShadow = true;
    cp2102Mesh.userData = { partId: 'cp2102', name: 'Puente USB-UART CP2102' };
    this.componentsGroup.add(cp2102Mesh);
    this.pickableMeshes.push(cp2102Mesh);

    // QFN silver pins around CP2102
    for (let side = 0; side < 4; side++) {
      for (let p = 0; p < 6; p++) {
        const lead = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), solderMaterial);
        const offset = (p - 2.5) * 0.08;
        if (side === 0) lead.position.set(offset, pcbThickness / 2 + 0.02, 1.25 + cp2102Length / 2 + 0.02);
        if (side === 1) lead.position.set(offset, pcbThickness / 2 + 0.02, 1.25 - cp2102Length / 2 - 0.02);
        if (side === 2) lead.position.set(cp2102Width / 2 + 0.02, pcbThickness / 2 + 0.02, 1.25 + offset);
        if (side === 3) lead.position.set(-cp2102Width / 2 - 0.02, pcbThickness / 2 + 0.02, 1.25 + offset);
        this.componentsGroup.add(lead);
      }
    }

    // 5. AMS1117-3.3 Voltage Regulator (SOT-223)
    const amsWidth = 0.65;
    const amsLength = 0.45;
    const amsHeight = 0.14;
    const amsTexture = this.createIcTexture('AMS', '1117-3.3');
    const amsMat = new THREE.MeshStandardMaterial({
      color: 0x1f2228,
      roughness: 0.6,
      metalness: 0.15,
      map: amsTexture,
    });
    const amsMesh = new THREE.Mesh(
      new THREE.BoxGeometry(amsWidth, amsHeight, amsLength),
      amsMat
    );
    amsMesh.position.set(0.65, pcbThickness / 2 + amsHeight / 2, 1.35);
    amsMesh.castShadow = true;
    amsMesh.userData = { partId: 'ams1117', name: 'Regulador LDO AMS1117-3.3' };
    this.componentsGroup.add(amsMesh);
    this.pickableMeshes.push(amsMesh);

    // SOT-223 metal heatsink tab
    const tabGeom = new THREE.BoxGeometry(0.38, 0.04, 0.16);
    const tabMesh = new THREE.Mesh(tabGeom, solderMaterial);
    tabMesh.position.set(0.65, pcbThickness / 2 + 0.02, 1.35 - amsLength / 2 - 0.08);
    this.componentsGroup.add(tabMesh);

    // 3 SOT-223 front pins
    for (let pinIdx = -1; pinIdx <= 1; pinIdx++) {
      const pinMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.12), solderMaterial);
      pinMesh.position.set(0.65 + pinIdx * 0.22, pcbThickness / 2 + 0.015, 1.35 + amsLength / 2 + 0.06);
      this.componentsGroup.add(pinMesh);
    }

    // 6. Realistic Procedural Micro-USB Type-B Female Connector
    // Real dimensions: Width ~0.8, Height ~0.34, Length ~0.7
    const usbGroup = new THREE.Group();
    const usbZPos = pcbLength / 2 - 0.35 + 0.12;

    const usbSteelMat = new THREE.MeshStandardMaterial({
      color: 0xdde2e8,
      metalness: 0.95,
      roughness: 0.18,
    });

    const usbDarkInteriorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c10,
      roughness: 0.9,
      metalness: 0.05,
    });

    const usbTongueMat = new THREE.MeshStandardMaterial({
      color: 0x1a1c22, // Black plastic substrate tongue
      roughness: 0.7,
      metalness: 0.1,
    });

    // 6A. Outer stamped metal shell with top rolled rim and chamfered sides
    const usbOuterWidth = 0.82;
    const usbOuterHeight = 0.36;
    const usbOuterLength = 0.68;

    const usbShell = new THREE.Mesh(
      new THREE.BoxGeometry(usbOuterWidth, usbOuterHeight, usbOuterLength),
      usbSteelMat
    );
    usbShell.position.set(0, pcbThickness / 2 + usbOuterHeight / 2, usbZPos);
    usbShell.castShadow = true;
    usbShell.userData = { partId: 'usb_port', name: 'Puerto Micro-USB 5V' };
    usbGroup.add(usbShell);
    this.pickableMeshes.push(usbShell);

    // 6B. Trapezoidal front mouth opening (Micro-USB Type-B signature shape)
    // Dark hollow interior socket cavity
    const cavityWidth = 0.68;
    const cavityHeight = 0.26;
    const cavityDepth = 0.35;
    const cavityMesh = new THREE.Mesh(
      new THREE.BoxGeometry(cavityWidth, cavityHeight, cavityDepth),
      usbDarkInteriorMat
    );
    cavityMesh.position.set(0, pcbThickness / 2 + usbOuterHeight / 2 - 0.01, usbZPos + usbOuterLength / 2 - cavityDepth / 2 + 0.01);
    usbGroup.add(cavityMesh);

    // Angled chamfer bottom corners of mouth (creating the true Micro-B trapezoid profile)
    const chamferGeom = new THREE.CylinderGeometry(0.06, 0.06, cavityDepth * 1.02, 3);
    const leftChamfer = new THREE.Mesh(chamferGeom, usbSteelMat);
    leftChamfer.position.set(-cavityWidth / 2 + 0.03, pcbThickness / 2 + 0.08, usbZPos + usbOuterLength / 2 - cavityDepth / 2);
    leftChamfer.rotation.y = Math.PI / 4;
    usbGroup.add(leftChamfer);

    const rightChamfer = new THREE.Mesh(chamferGeom, usbSteelMat);
    rightChamfer.position.set(cavityWidth / 2 - 0.03, pcbThickness / 2 + 0.08, usbZPos + usbOuterLength / 2 - cavityDepth / 2);
    rightChamfer.rotation.y = -Math.PI / 4;
    usbGroup.add(rightChamfer);

    // 6C. Internal black plastic contact tongue inside socket
    const tongueWidth = 0.52;
    const tongueHeight = 0.06;
    const tongueLength = 0.30;
    const tongueMesh = new THREE.Mesh(
      new THREE.BoxGeometry(tongueWidth, tongueHeight, tongueLength),
      usbTongueMat
    );
    tongueMesh.position.set(
      0,
      pcbThickness / 2 + usbOuterHeight / 2 - 0.04,
      usbZPos + usbOuterLength / 2 - tongueLength / 2 + 0.02
    );
    usbGroup.add(tongueMesh);

    // 6D. 5 Gold-plated contact spring fingers on top of the tongue
    // Pin 1: VBUS, Pin 2: D-, Pin 3: D+, Pin 4: ID, Pin 5: GND
    const goldContactGeom = new THREE.BoxGeometry(0.04, 0.02, tongueLength * 0.9);
    for (let c = 0; c < 5; c++) {
      const contactX = (c - 2) * 0.09;
      const contactMesh = new THREE.Mesh(goldContactGeom, goldPadMaterial);
      contactMesh.position.set(
        contactX,
        pcbThickness / 2 + usbOuterHeight / 2 - 0.04 + tongueHeight / 2 + 0.01,
        usbZPos + usbOuterLength / 2 - tongueLength / 2 + 0.02
      );
      usbGroup.add(contactMesh);
    }

    // 6E. Top retention latch windows (the two distinct rectangular notches on top of Micro-USB)
    const notchMat = new THREE.MeshBasicMaterial({ color: 0x1f242d });
    const notchGeom = new THREE.BoxGeometry(0.12, 0.03, 0.12);

    const leftNotch = new THREE.Mesh(notchGeom, notchMat);
    leftNotch.position.set(-0.20, pcbThickness / 2 + usbOuterHeight + 0.005, usbZPos + 0.08);
    usbGroup.add(leftNotch);

    const rightNotch = new THREE.Mesh(notchGeom, notchMat);
    rightNotch.position.set(0.20, pcbThickness / 2 + usbOuterHeight + 0.005, usbZPos + 0.08);
    usbGroup.add(rightNotch);

    // 6F. Mechanical solder retention legs on sides
    const legGeom = new THREE.BoxGeometry(0.08, 0.22, 0.16);
    const legLeft1 = new THREE.Mesh(legGeom, solderMaterial);
    legLeft1.position.set(-usbOuterWidth / 2 - 0.03, pcbThickness / 2 + 0.02, usbZPos - 0.15);
    usbGroup.add(legLeft1);

    const legRight1 = new THREE.Mesh(legGeom, solderMaterial);
    legRight1.position.set(usbOuterWidth / 2 + 0.03, pcbThickness / 2 + 0.02, usbZPos - 0.15);
    usbGroup.add(legRight1);

    const legLeft2 = new THREE.Mesh(legGeom, solderMaterial);
    legLeft2.position.set(-usbOuterWidth / 2 - 0.03, pcbThickness / 2 + 0.02, usbZPos + 0.15);
    usbGroup.add(legLeft2);

    const legRight2 = new THREE.Mesh(legGeom, solderMaterial);
    legRight2.position.set(usbOuterWidth / 2 + 0.03, pcbThickness / 2 + 0.02, usbZPos + 0.15);
    usbGroup.add(legRight2);

    // 6G. Rear SMD ground and signal solder pins
    for (let rPin = -2; rPin <= 2; rPin++) {
      const pinSolder = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.12), solderMaterial);
      pinSolder.position.set(rPin * 0.1, pcbThickness / 2 + 0.02, usbZPos - usbOuterLength / 2 - 0.05);
      usbGroup.add(pinSolder);
    }

    this.componentsGroup.add(usbGroup);

    // 7. Tactile Buttons: EN & BOOT
    const btnBaseGeom = new THREE.BoxGeometry(0.36, 0.14, 0.36);
    const btnBaseMat = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      metalness: 0.88,
      roughness: 0.28,
    });
    const plungerGeom = new THREE.CylinderGeometry(0.10, 0.10, 0.14, 18);
    const plungerMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.8,
      metalness: 0.1,
    });

    // EN Button (Left)
    const enBase = new THREE.Mesh(btnBaseGeom, btnBaseMat);
    enBase.position.set(-0.65, pcbThickness / 2 + 0.07, pcbLength / 2 - 0.7);
    this.enButtonMesh = new THREE.Mesh(plungerGeom, plungerMat);
    this.enButtonMesh.position.set(-0.65, pcbThickness / 2 + 0.14 + 0.07, pcbLength / 2 - 0.7);
    enBase.userData = { partId: 'btn_en', name: 'Pulsador EN (Enable/Reset)' };
    this.enButtonMesh.userData = { partId: 'btn_en', name: 'Pulsador EN (Enable/Reset)' };
    this.componentsGroup.add(enBase);
    this.componentsGroup.add(this.enButtonMesh);
    this.pickableMeshes.push(enBase, this.enButtonMesh);

    // BOOT Button (Right)
    const bootBase = new THREE.Mesh(btnBaseGeom, btnBaseMat);
    bootBase.position.set(0.65, pcbThickness / 2 + 0.07, pcbLength / 2 - 0.7);
    this.bootButtonMesh = new THREE.Mesh(plungerGeom, plungerMat);
    this.bootButtonMesh.position.set(0.65, pcbThickness / 2 + 0.14 + 0.07, pcbLength / 2 - 0.7);
    bootBase.userData = { partId: 'btn_boot', name: 'Pulsador BOOT (GPIO0)' };
    this.bootButtonMesh.userData = { partId: 'btn_boot', name: 'Pulsador BOOT (GPIO0)' };
    this.componentsGroup.add(bootBase);
    this.componentsGroup.add(this.bootButtonMesh);
    this.pickableMeshes.push(bootBase, this.bootButtonMesh);

    // Solder tabs on buttons
    [-0.65, 0.65].forEach((btnX) => {
      [-0.18, 0.18].forEach((pinOffset) => {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.08), solderMaterial);
        pin.position.set(btnX + pinOffset, pcbThickness / 2 + 0.02, pcbLength / 2 - 0.7);
        this.componentsGroup.add(pin);
      });
    });

    // 8. LEDs: PWR (Red) & USER (Blue on GPIO2)
    const ledGeom = new THREE.BoxGeometry(0.12, 0.08, 0.16);
    this.pwrLedMaterial = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.4,
      roughness: 0.25,
      metalness: 0.1,
    });
    const pwrLedMesh = new THREE.Mesh(ledGeom, this.pwrLedMaterial);
    pwrLedMesh.position.set(-0.35, pcbThickness / 2 + 0.04, 1.85);
    pwrLedMesh.userData = { partId: 'led_pwr', name: 'LED de Alimentación (PWR)' };
    this.componentsGroup.add(pwrLedMesh);
    this.pickableMeshes.push(pwrLedMesh);

    this.userLedMaterial = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.0,
      roughness: 0.25,
      metalness: 0.1,
    });
    const userLedMesh = new THREE.Mesh(ledGeom, this.userLedMaterial);
    userLedMesh.position.set(0.35, pcbThickness / 2 + 0.04, 1.85);
    userLedMesh.userData = { partId: 'led_user', name: 'LED de Usuario (GPIO2)' };
    this.componentsGroup.add(userLedMesh);
    this.pickableMeshes.push(userLedMesh);

    this.userLedGlow = new THREE.PointLight(0x38bdf8, 0, 1.5);
    this.userLedGlow.position.set(0.35, pcbThickness / 2 + 0.15, 1.85);
    this.componentsGroup.add(this.userLedGlow);

    // 9. 38 Pins with gold posts, plastic headers and annular through-hole solder pads
    const pinPitch = 0.23;
    const leftX = -pcbWidth / 2 + 0.15;
    const rightX = pcbWidth / 2 - 0.15;
    const startZ = -((19 - 1) * pinPitch) / 2;

    const stripWidth = 0.22;
    const stripHeight = 0.35;
    const stripLength = 19 * pinPitch + 0.05;
    const stripMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.85,
      metalness: 0.1,
    });

    const leftStrip = new THREE.Mesh(
      new THREE.BoxGeometry(stripWidth, stripHeight, stripLength),
      stripMat
    );
    leftStrip.position.set(leftX, -pcbThickness / 2 - stripHeight / 2, 0);
    this.pinHeadersGroup.add(leftStrip);

    const rightStrip = new THREE.Mesh(
      new THREE.BoxGeometry(stripWidth, stripHeight, stripLength),
      stripMat
    );
    rightStrip.position.set(rightX, -pcbThickness / 2 - stripHeight / 2, 0);
    this.pinHeadersGroup.add(rightStrip);

    const pinWidth = 0.06;
    const pinTotalHeight = 1.25;
    const pinGeom = new THREE.BoxGeometry(pinWidth, pinTotalHeight, pinWidth);
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.2,
    });

    const pickGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8);
    const pickMat = new THREE.MeshBasicMaterial({ visible: false });

    ESP32_PINS.forEach((pin) => {
      const px = pin.side === 'LEFT' ? leftX : rightX;
      const pz = startZ + pin.positionIndex * pinPitch;

      // Real visual metal pin
      const pinMesh = new THREE.Mesh(pinGeom, pinMat);
      pinMesh.position.set(px, -0.2, pz);
      pinMesh.castShadow = true;
      this.pinHeadersGroup.add(pinMesh);

      // Gold Annular solder pad with dark drilled hole on top of PCB
      const padMesh = new THREE.Mesh(
        new THREE.RingGeometry(0.04, 0.09, 14),
        goldPadMaterial
      );
      padMesh.rotation.x = -Math.PI / 2;
      padMesh.position.set(px, pcbThickness / 2 + 0.001, pz);
      this.pcbGroup.add(padMesh);

      const holeMesh = new THREE.Mesh(
        new THREE.CircleGeometry(0.04, 14),
        drillHoleMat
      );
      holeMesh.rotation.x = -Math.PI / 2;
      holeMesh.position.set(px, pcbThickness / 2 + 0.002, pz);
      this.pcbGroup.add(holeMesh);

      // Solder meniscus fillet around pin base
      const filletMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.08, 0.03, 12),
        solderMaterial
      );
      filletMesh.position.set(px, pcbThickness / 2 + 0.015, pz);
      this.pcbGroup.add(filletMesh);

      // Pick target
      const pickTarget = new THREE.Mesh(pickGeom, pickMat);
      pickTarget.position.set(px, pcbThickness / 2 + 0.25, pz);
      pickTarget.userData = { pinId: pin.id, name: `Pin ${pin.label} (GPIO)` };
      this.group.add(pickTarget);
      this.pickableMeshes.push(pickTarget);

      // Anchor dummy object for exact 3D world tip position
      const anchor = new THREE.Object3D();
      anchor.position.set(px, pcbThickness / 2 + 0.28, pz);
      this.group.add(anchor);
      this.pinAnchorObjects.set(pin.id, anchor);
    });
  }

  // Build circular teal hotspots matching ArduinoLab 3D
  private buildHotspots() {
    const tealMat = new THREE.MeshBasicMaterial({ color: 0x00979d });
    const whiteRimMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const circleGeom = new THREE.CircleGeometry(0.09, 24);
    const ringGeom = new THREE.RingGeometry(0.09, 0.14, 24);

    ESP32_BLUEPRINT_CALLOUTS.forEach((callout) => {
      const hotspotContainer = new THREE.Group();
      const [hx, hy, hz] = callout.hotspot3D;
      hotspotContainer.position.set(hx, hy + 0.03, hz);
      hotspotContainer.rotation.x = -Math.PI / 2;

      const innerDot = new THREE.Mesh(circleGeom, tealMat);
      const outerRing = new THREE.Mesh(ringGeom, whiteRimMat);

      hotspotContainer.add(innerDot);
      hotspotContainer.add(outerRing);
      hotspotContainer.userData = { partId: callout.targetHotspotId, name: callout.title };

      this.hotspotsGroup.add(hotspotContainer);
      this.pickableMeshes.push(innerDot, outerRing);
      this.hotspotObjects.set(callout.id, hotspotContainer);
    });
  }

  // Create ultra-detailed procedural PCB silkscreen texture with pin numbers, GPIO labels and copper traces
  private createPcbSilkscreenTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 2400;
    const ctx = canvas.getContext('2d')!;

    // Matte dark black FR4 substrate
    ctx.fillStyle = '#14161b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fine fiberglass weave pattern
    ctx.strokeStyle = '#1a1d24';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 10) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(canvas.width, j);
      ctx.stroke();
    }

    // Copper routing traces (simulated copper layers under the black mask)
    ctx.strokeStyle = '#1f242e';
    ctx.lineWidth = 3;
    // USB D+ and D- differential lines to CP2102
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 20, 2150);
    ctx.lineTo(canvas.width / 2 - 20, 1850);
    ctx.lineTo(canvas.width / 2 - 40, 1650);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 + 20, 2150);
    ctx.lineTo(canvas.width / 2 + 20, 1850);
    ctx.lineTo(canvas.width / 2 + 40, 1650);
    ctx.stroke();

    // Power trace bus from USB to AMS1117
    ctx.strokeStyle = '#272d3a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 80, 2150);
    ctx.lineTo(canvas.width / 2 - 80, 1950);
    ctx.lineTo(760, 1950);
    ctx.lineTo(760, 1720);
    ctx.stroke();

    // Silkscreen outer perimeter boundary line
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 5;
    ctx.strokeRect(35, 35, canvas.width - 70, canvas.height - 70);

    // Inner isolation lines between pins and core electronics
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(250, 180);
    ctx.lineTo(250, 2220);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(canvas.width - 250, 180);
    ctx.lineTo(canvas.width - 250, 2220);
    ctx.stroke();

    // Main Board Branding
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NodeMCU-32S', canvas.width / 2, 1420);

    ctx.font = 'bold 26px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('ESP32 DEVKIT V1 (38-PIN)', canvas.width / 2, 1470);

    ctx.font = '500 22px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Xtensa Dual-Core 240MHz · Wi-Fi & BLE', canvas.width / 2, 1510);
    ctx.fillText('FCC ID: 2AC7Z-ESPWROOM32', canvas.width / 2, 1545);

    // Button silkscreen boxes & labels
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(260, 1980, 80, 80);
    ctx.strokeRect(860, 1980, 80, 80);

    ctx.font = 'bold 30px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('EN', 300, 1950);
    ctx.fillText('BOOT', 900, 1950);

    // LED silkscreen boxes & labels
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#f87171';
    ctx.fillText('PWR', 420, 1920);
    ctx.strokeStyle = '#f87171';
    ctx.strokeRect(400, 1935, 40, 50);

    ctx.fillStyle = '#60a5fa';
    ctx.fillText('D2', 780, 1920);
    ctx.strokeStyle = '#60a5fa';
    ctx.strokeRect(760, 1935, 40, 50);

    // USB silkscreen footprint and pinout
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.strokeRect(canvas.width / 2 - 130, 2120, 260, 200);

    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('MICRO-USB 5V', canvas.width / 2, 2100);

    // PIN NUMBERING & SILKSCREEN LABELS (Left: 1-19, Right: 20-38)
    const leftPinsData = [
      { num: 1, label: '3V3', color: '#fbbf24' },
      { num: 2, label: 'EN', color: '#f8fafc' },
      { num: 3, label: 'VP(36)', color: '#38bdf8' },
      { num: 4, label: 'VN(39)', color: '#38bdf8' },
      { num: 5, label: 'D34', color: '#38bdf8' },
      { num: 6, label: 'D35', color: '#38bdf8' },
      { num: 7, label: 'D32', color: '#f8fafc' },
      { num: 8, label: 'D33', color: '#f8fafc' },
      { num: 9, label: 'D25', color: '#c084fc' },
      { num: 10, label: 'D26', color: '#c084fc' },
      { num: 11, label: 'D27', color: '#f8fafc' },
      { num: 12, label: 'D14', color: '#34d399' },
      { num: 13, label: 'D12', color: '#34d399' },
      { num: 14, label: 'GND', color: '#94a3b8' },
      { num: 15, label: 'D13', color: '#34d399' },
      { num: 16, label: 'D9', color: '#f87171' },
      { num: 17, label: 'D10', color: '#f87171' },
      { num: 18, label: 'D11', color: '#f87171' },
      { num: 19, label: 'VIN(5V)', color: '#fbbf24' },
    ];

    const rightPinsData = [
      { num: 20, label: 'GND', color: '#94a3b8' },
      { num: 21, label: 'D23', color: '#34d399' },
      { num: 22, label: 'D22', color: '#22d3ee' },
      { num: 23, label: 'TX(1)', color: '#f472b6' },
      { num: 24, label: 'RX(3)', color: '#f472b6' },
      { num: 25, label: 'D21', color: '#22d3ee' },
      { num: 26, label: 'GND', color: '#94a3b8' },
      { num: 27, label: 'D19', color: '#34d399' },
      { num: 28, label: 'D18', color: '#34d399' },
      { num: 29, label: 'D5', color: '#34d399' },
      { num: 30, label: 'TX2', color: '#f472b6' },
      { num: 31, label: 'RX2', color: '#f472b6' },
      { num: 32, label: 'D4', color: '#f8fafc' },
      { num: 33, label: 'D2', color: '#60a5fa' },
      { num: 34, label: 'D15', color: '#f8fafc' },
      { num: 35, label: 'D8', color: '#f87171' },
      { num: 36, label: 'D7', color: '#f87171' },
      { num: 37, label: 'D6', color: '#f87171' },
      { num: 38, label: 'CLK/GND', color: '#94a3b8' },
    ];

    const yStart = 240;
    const ySpacing = 98;

    // Prominent pin header markers: Pin 1 indicator arrow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(45, yStart - 25);
    ctx.lineTo(65, yStart - 10);
    ctx.lineTo(25, yStart - 10);
    ctx.closePath();
    ctx.fill();

    // Render Left Row: Explicit Pin numbers (1..19) + Labels
    leftPinsData.forEach((pin, idx) => {
      const y = yStart + idx * ySpacing;

      // Outer Pin Number (e.g. 1, 2, ..., 19)
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'right';
      ctx.fillText(String(pin.num), 65, y + 8);

      // Gold Solder Ring graphic representation
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(105, y, 16, 0, Math.PI * 2);
      ctx.stroke();

      // Dark hole in center
      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.arc(105, y, 9, 0, Math.PI * 2);
      ctx.fill();

      // Functional Label (e.g. 3V3, EN, D34)
      ctx.font = 'bold 28px monospace';
      ctx.fillStyle = pin.color;
      ctx.textAlign = 'left';
      ctx.fillText(pin.label, 140, y + 9);
    });

    // Render Right Row: Explicit Pin numbers (20..38) + Labels
    rightPinsData.forEach((pin, idx) => {
      const y = yStart + idx * ySpacing;

      // Outer Pin Number (e.g. 20, 21, ..., 38)
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.fillText(String(pin.num), canvas.width - 65, y + 8);

      // Gold Solder Ring graphic representation
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(canvas.width - 105, y, 16, 0, Math.PI * 2);
      ctx.stroke();

      // Dark hole in center
      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.arc(canvas.width - 105, y, 9, 0, Math.PI * 2);
      ctx.fill();

      // Functional Label (e.g. GND, D23, D22, D2)
      ctx.font = 'bold 28px monospace';
      ctx.fillStyle = pin.color;
      ctx.textAlign = 'right';
      ctx.fillText(pin.label, canvas.width - 140, y + 9);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    return texture;
  }

  // Laser engraved texture for the metal RF shield
  private createRfShieldTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#d8dde4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle brushed metal streaks
    ctx.strokeStyle = '#edf2f7';
    ctx.lineWidth = 1;
    for (let y = 0; y < canvas.height; y += 3) {
      if (Math.random() > 0.35) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 5;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    // Official Espressif Logo
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 220, 68, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8dde4';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 220, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.fillRect(canvas.width / 2 - 14, 155, 28, 130);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESPRESSIF', canvas.width / 2, 360);

    ctx.font = 'bold 66px monospace';
    ctx.fillText('ESP-WROOM-32', canvas.width / 2, 455);

    ctx.font = '500 32px monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText('FCC ID: 2AC7Z-ESPWROOM32', canvas.width / 2, 535);
    ctx.fillText('IC: 21098-ESPWROOM32', canvas.width / 2, 585);
    ctx.fillText('CE 0700   [R] 211-161007', canvas.width / 2, 635);

    // 2D DataMatrix code block
    ctx.fillStyle = '#0f172a';
    const qrSize = 180;
    const qx = canvas.width / 2 - qrSize / 2;
    const qy = 705;
    ctx.fillRect(qx, qy, qrSize, qrSize);
    ctx.fillStyle = '#d8dde4';
    ctx.fillRect(qx + 18, qy + 18, qrSize - 36, qrSize - 36);
    ctx.fillStyle = '#0f172a';
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if ((r + c) % 2 === 0) {
          ctx.fillRect(qx + 24 + c * 19, qy + 24 + r * 19, 15, 15);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    return texture;
  }

  private createAntennaTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0e1219';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gold serpentine trace
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 14;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';

    ctx.beginPath();
    ctx.moveTo(40, 200);
    ctx.lineTo(40, 60);
    ctx.lineTo(120, 60);
    ctx.lineTo(120, 180);
    ctx.lineTo(200, 180);
    ctx.lineTo(200, 60);
    ctx.lineTo(280, 60);
    ctx.lineTo(280, 180);
    ctx.lineTo(360, 180);
    ctx.lineTo(360, 60);
    ctx.lineTo(460, 60);
    ctx.lineTo(460, 120);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private createIcTexture(vendor: string, model: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#181a1f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(36, 36, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(vendor, 128, 110);
    ctx.font = 'bold 30px monospace';
    ctx.fillText(model, 128, 155);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  public setUserLedState(active: boolean, dutyCycle = 1.0) {
    if (active && dutyCycle > 0) {
      const brightness = Math.min(2.5, 0.5 + dutyCycle * 2.0);
      this.userLedMaterial.emissiveIntensity = brightness;
      this.userLedGlow.intensity = brightness * 0.8;
    } else {
      this.userLedMaterial.emissiveIntensity = 0;
      this.userLedGlow.intensity = 0;
    }
  }

  public setButtonPress(button: 'EN' | 'BOOT', pressed: boolean) {
    if (button === 'EN') {
      this.enButtonDepressed = pressed ? 0.05 : 0;
    } else {
      this.bootButtonDepressed = pressed ? 0.05 : 0;
    }
  }

  public update(delta: number) {
    this.currentExplodedProgress = THREE.MathUtils.damp(
      this.currentExplodedProgress,
      this.targetExplodedProgress,
      8,
      delta
    );

    const progress = this.currentExplodedProgress;

    this.shieldGroup.position.y = progress * 1.5;
    this.moduleGroup.position.y = progress * 0.9;
    this.componentsGroup.position.y = progress * 0.45;
    this.pinHeadersGroup.position.y = progress * -0.9;
    this.hotspotsGroup.position.y = progress * 0.2;

    const pcbThickness = 0.16;
    this.enButtonMesh.position.y = (pcbThickness / 2 + 0.14 + 0.07) - this.enButtonDepressed;
    this.bootButtonMesh.position.y = (pcbThickness / 2 + 0.14 + 0.07) - this.bootButtonDepressed;
  }
}
