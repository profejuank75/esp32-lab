import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ESP32BoardModel } from './ESP32BoardModel';
import { Circuit3DBreadboardModel, ComponentPickMeta } from './Circuit3DBreadboardModel';
import { CircuitState } from '../../types/esp32';
import { ESP32_PINS } from '../../data/esp32Data';
import {
  RotateCcw,
  Eye,
  Compass,
  Tag,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  X,
  ArrowRight,
  Cpu,
} from 'lucide-react';

interface ProjectedWireBadge {
  id: string;
  label: string;
  sublabel: string;
  colorHex: string;
  pinId: number;
  screenX: number;
  screenY: number;
  visible: boolean;
}

interface ActiveInspection {
  pinId: number;
  componentName: string;
  connectionDetail: string;
  colorHex: string;
  hitWorldPos: THREE.Vector3 | null;
  locked: boolean;
}

interface ProjectedPinCallout {
  pinX: number;
  pinY: number;
  pinVisible: boolean;
  hitX: number;
  hitY: number;
  hitVisible: boolean;
}

interface Circuit3DViewportProps {
  circuitState: CircuitState;
  ledActive: boolean;
  selectedPinId: number;
  onSelectPinId: (pinId: number) => void;
}

// Reusable temp vectors outside render loop to avoid GC
const _tempProjVec = new THREE.Vector3();
const _tempPinWorldVec = new THREE.Vector3();
const _tempHitProjVec = new THREE.Vector3();

function isObjectVisibleInHierarchy(obj: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (!cur.visible) return false;
    cur = cur.parent;
  }
  return true;
}

export const Circuit3DViewport: React.FC<Circuit3DViewportProps> = ({
  circuitState,
  ledActive,
  selectedPinId,
  onSelectPinId,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const boardModelRef = useRef<ESP32BoardModel | null>(null);
  const circuitModelRef = useRef<Circuit3DBreadboardModel | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const targetCamPosRef = useRef<THREE.Vector3 | null>(null);
  const targetLookAtRef = useRef<THREE.Vector3 | null>(null);

  const circuitStateRef = useRef<CircuitState>(circuitState);
  circuitStateRef.current = circuitState;

  const onSelectPinIdRef = useRef(onSelectPinId);
  onSelectPinIdRef.current = onSelectPinId;

  const [showWireLabels, setShowWireLabels] = useState(false);
  const showWireLabelsRef = useRef(showWireLabels);
  showWireLabelsRef.current = showWireLabels;

  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const isAutoRotatingRef = useRef(isAutoRotating);
  isAutoRotatingRef.current = isAutoRotating;

  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [wireBadges, setWireBadges] = useState<ProjectedWireBadge[]>([]);

  // Hovered vs Locked inspection so hovering previews live and clicking/tapping locks the ESP32 pin trace
  const [hoveredInspect, setHoveredInspect] = useState<ActiveInspection | null>(null);
  const [lockedInspect, setLockedInspect] = useState<ActiveInspection | null>(null);

  const activeInspect = hoveredInspect ?? lockedInspect;
  const activeInspectRef = useRef<ActiveInspection | null>(activeInspect);
  activeInspectRef.current = activeInspect;

  const [pinCallout, setPinCallout] = useState<ProjectedPinCallout | null>(null);

  // Sync 3D wire glow & ESP32 pin beacon whenever active inspection changes
  useEffect(() => {
    if (!circuitModelRef.current) return;
    if (activeInspect) {
      circuitModelRef.current.setHighlightedPin(activeInspect.pinId, activeInspect.colorHex);
    } else {
      circuitModelRef.current.setHighlightedPin(null);
      setPinCallout(null);
    }
  }, [activeInspect?.pinId, activeInspect?.colorHex, Boolean(activeInspect)]);

  // Clear locked inspection when switching circuit types
  useEffect(() => {
    setHoveredInspect(null);
    setLockedInspect(null);
    setPinCallout(null);
    circuitModelRef.current?.setHighlightedPin(null);
  }, [circuitState.type]);

  // Also highlight on ESP32 when user picks a pin from external panel (PINES tab / GPIO chips)
  const prevPinIdRef = useRef<number>(selectedPinId);
  useEffect(() => {
    if (prevPinIdRef.current === selectedPinId) return;
    prevPinIdRef.current = selectedPinId;
    if (!circuitModelRef.current) return;
    const meta = circuitModelRef.current.getDefaultMetaForPin(selectedPinId);
    if (meta) {
      setLockedInspect({
        ...meta,
        hitWorldPos: null,
        locked: true,
      });
    }
  }, [selectedPinId]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
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
      alpha: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 420;
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = null;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0.2, 6.4, 8.2);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 3.2;
    controls.maxDistance = 18;
    controls.target.set(0.05, 0.0, 0.0);
    controls.autoRotate = isAutoRotatingRef.current && !isSoftwareGl;
    controls.autoRotateSpeed = 0.9;
    controlsRef.current = controls;

    const handleControlsStart = () => {
      targetCamPosRef.current = null;
      targetLookAtRef.current = null;
    };
    controls.addEventListener('start', handleControlsStart);

    // 3-Point Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 1.45);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffcf5, 2.0);
    keyLight.position.set(5, 10, 6);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 24;
      const d = 6.0;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00979d, 0.75);
    rimLight.position.set(-7, 4, -6);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xf8fafc, 0.85);
    fillLight.position.set(0, 3, 8);
    scene.add(fillLight);

    // Contact shadow beneath workbench mat
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 512;
    shadowCanvas.height = 512;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(256, 256, 60, 256, 256, 240);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.25)');
    grad.addColorStop(0.65, 'rgba(15, 23, 42, 0.08)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 512, 512);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 8.5),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.75,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(0.05, -0.61, 0);
    scene.add(shadowPlane);

    // 1. Add ESP32 DevKit Board seated on left carrier breadboard
    const boardModel = new ESP32BoardModel();
    boardModel.group.position.set(
      Circuit3DBreadboardModel.ESP_OFFSET_X,
      Circuit3DBreadboardModel.ESP_OFFSET_Y,
      Circuit3DBreadboardModel.ESP_OFFSET_Z
    );
    boardModel.hotspotsGroup.visible = false;
    scene.add(boardModel.group);
    boardModelRef.current = boardModel;

    // 2. Add 3D Breadboard & External Circuits + Jumper Wires
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const circuitModel = new Circuit3DBreadboardModel(maxAnisotropy);
    circuitModel.updateFromState(circuitStateRef.current);
    scene.add(circuitModel.group);
    circuitModelRef.current = circuitModel;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycaster helper returning visible hit metadata + 3D point
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const raycastCircuit = (clientX: number, clientY: number): ActiveInspection | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const pickTargets = [...circuitModel.pickableMeshes, ...boardModel.pickableMeshes];
      const hits = raycaster.intersectObjects(pickTargets, false);

      for (const hit of hits) {
        if (!isObjectVisibleInHierarchy(hit.object)) continue;
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== scene) {
          if (cur.userData?.pinId) {
            const pinId = cur.userData.pinId as number;
            const pinDef = ESP32_PINS.find((p) => p.id === pinId);
            const fallbackMeta: ComponentPickMeta | null = circuitModel.getDefaultMetaForPin(pinId);
            const componentName =
              cur.userData.componentName ||
              fallbackMeta?.componentName ||
              (pinDef ? `Pin ESP32 ${pinDef.label}` : `Pin #${pinId}`);
            const connectionDetail =
              cur.userData.connectionDetail ||
              fallbackMeta?.connectionDetail ||
              pinDef?.description ||
              'Conexión directa al pin del ESP32';
            const colorHex = cur.userData.colorHex || fallbackMeta?.colorHex || '#00878a';

            // Only draw a leader line from hit point if user touched a circuit component/wire (not directly the ESP32 pin itself)
            const isEspPinDirect = !cur.userData.componentName;
            return {
              pinId,
              componentName,
              connectionDetail,
              colorHex,
              hitWorldPos: isEspPinDirect ? null : hit.point.clone(),
              locked: false,
            };
          }
          cur = cur.parent;
        }
      }
      return null;
    };

    let lastMoveTs = 0;
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const now = performance.now();
      if (now - lastMoveTs < 35) return;
      lastMoveTs = now;

      const hitInfo = raycastCircuit(e.clientX, e.clientY);
      setIsHoveringInteractive(hitInfo !== null);
      setHoveredInspect(hitInfo);
    };

    const handlePointerLeave = () => {
      setIsHoveringInteractive(false);
      setHoveredInspect(null);
    };

    let pointerDownX = 0;
    let pointerDownY = 0;
    const handlePointerDown = (e: PointerEvent) => {
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
    };

    const handleCanvasClick = (e: MouseEvent) => {
      // Ignore orbit drag releases
      if (Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY) > 6) return;

      const hitInfo = raycastCircuit(e.clientX, e.clientY);
      if (hitInfo) {
        prevPinIdRef.current = hitInfo.pinId;
        onSelectPinIdRef.current(hitInfo.pinId);
        setLockedInspect({ ...hitInfo, locked: true });
      } else {
        setLockedInspect(null);
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('click', handleCanvasClick);

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth || 800;
      const h = mountRef.current.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Render loop with software WebGL pacing
    let frameId = 0;
    let isDisposed = false;
    const clock = new THREE.Clock();

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      gl.flush();
      const poll = () => {
        if (isDisposed) {
          gl.deleteSync(sync);
          return;
        }
        const status = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    let overlayFrameCounter = 0;

    const tick = () => {
      if (isDisposed) return;
      const delta = Math.min(0.1, clock.getDelta());

      boardModel.update(delta);
      circuitModel.updateFromState(circuitStateRef.current);
      circuitModel.updateBeaconAnimation(delta);

      if (targetCamPosRef.current && targetLookAtRef.current) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamPosRef.current.x, 6, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamPosRef.current.y, 6, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamPosRef.current.z, 6, delta);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, targetLookAtRef.current.x, 6, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, targetLookAtRef.current.y, 6, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, targetLookAtRef.current.z, 6, delta);
        if (camera.position.distanceTo(targetCamPosRef.current) < 0.05) {
          targetCamPosRef.current = null;
          targetLookAtRef.current = null;
        }
      }

      controls.autoRotate = isAutoRotatingRef.current && !isSoftwareGl;
      controls.update();
      renderer.render(scene, camera);

      overlayFrameCounter++;
      if (overlayFrameCounter % 2 === 0) {
        const w = renderer.domElement.clientWidth;
        const h = renderer.domElement.clientHeight;

        // 1. Project active ESP32 pin callout & leader line
        const inspect = activeInspectRef.current;
        if (inspect && circuitModel.getEsp32PinWorldTip(inspect.pinId, _tempPinWorldVec)) {
          _tempPinWorldVec.project(camera);
          const pinX = (_tempPinWorldVec.x * 0.5 + 0.5) * w;
          const pinY = (-_tempPinWorldVec.y * 0.5 + 0.5) * h;
          const pinVisible = _tempPinWorldVec.z < 1;

          let hitX = pinX;
          let hitY = pinY;
          let hitVisible = false;
          if (inspect.hitWorldPos) {
            _tempHitProjVec.copy(inspect.hitWorldPos).project(camera);
            hitX = (_tempHitProjVec.x * 0.5 + 0.5) * w;
            hitY = (-_tempHitProjVec.y * 0.5 + 0.5) * h;
            hitVisible = _tempHitProjVec.z < 1;
          }

          setPinCallout({ pinX, pinY, pinVisible, hitX, hitY, hitVisible });
        }

        // 2. Project optional wire labels
        if (showWireLabelsRef.current) {
          const activeLabels = circuitModel.getVisibleWireLabels();
          const nextBadges: ProjectedWireBadge[] = activeLabels.map((wl) => {
            wl.anchor.getWorldPosition(_tempProjVec);
            _tempProjVec.project(camera);
            return {
              id: wl.id,
              label: wl.label,
              sublabel: wl.sublabel,
              colorHex: wl.colorHex,
              pinId: wl.pinId,
              screenX: (_tempProjVec.x * 0.5 + 0.5) * w,
              screenY: (-_tempProjVec.y * 0.5 + 0.5) * h,
              visible: _tempProjVec.z < 1,
            };
          });
          setWireBadges(nextBadges);
        }
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      tick();
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('start', handleControlsStart);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      controls.dispose();
      circuitModel.dispose();
      shadowTex.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync ESP32 board LED & buttons dynamically
  useEffect(() => {
    if (boardModelRef.current) {
      boardModelRef.current.setUserLedState(ledActive);
    }
  }, [ledActive]);

  useEffect(() => {
    if (boardModelRef.current) {
      boardModelRef.current.setButtonPress('BOOT', circuitState.bootPressed);
      boardModelRef.current.setButtonPress('EN', circuitState.enResetTriggered);
    }
  }, [circuitState.bootPressed, circuitState.enResetTriggered]);

  const setPreset = (preset: 'ISO' | 'TOP' | 'WIRES') => {
    if (preset === 'ISO') {
      targetCamPosRef.current = new THREE.Vector3(0.2, 6.4, 8.2);
      targetLookAtRef.current = new THREE.Vector3(0.05, 0, 0);
    } else if (preset === 'TOP') {
      targetCamPosRef.current = new THREE.Vector3(0.05, 9.8, 0.25);
      targetLookAtRef.current = new THREE.Vector3(0.05, 0, 0);
    } else if (preset === 'WIRES') {
      targetCamPosRef.current = new THREE.Vector3(0.1, 3.2, 5.6);
      targetLookAtRef.current = new THREE.Vector3(0.05, 0.05, 0);
    }
  };

  const handleZoom = (dir: 'IN' | 'OUT') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const factor = dir === 'IN' ? 0.85 : 1.18;
    cameraRef.current.position.multiplyScalar(factor);
    controlsRef.current.update();
  };

  const circuitTitle =
    circuitState.type === 'WIFI_3LEDS'
      ? 'Práctica 2: Control Wi-Fi de 3 LEDs (GPIO18/19/21)'
      : circuitState.type === 'LDR_ANALOG'
      ? 'Divisor Analógico LDR GL5528 + 10kΩ'
      : circuitState.type === 'GPIO2_BLINK'
      ? 'LED Externo 5mm + R 220Ω en GPIO2'
      : 'Circuito Reset Externo (EN) & Estado BOOT';

  const inspectedPinDef = activeInspect
    ? ESP32_PINS.find((p) => p.id === activeInspect.pinId) ?? null
    : null;

  const displayAccentColor =
    activeInspect?.colorHex?.toLowerCase() === '#1e293b'
      ? '#0284c7'
      : activeInspect?.colorHex || '#00878a';

  return (
    <div className="relative w-full h-full min-h-[320px] sm:min-h-[380px] rounded-2xl border border-slate-200/90 overflow-hidden bg-blueprint-grid shadow-xs select-none">
      {/* Isolated WebGL Mount */}
      <div
        ref={mountRef}
        className={`w-full h-full outline-none ${
          isHoveringInteractive ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
        }`}
      />

      {/* Top-Left Minimal Circuit Badge */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm pointer-events-none flex items-center gap-2 max-w-[60%]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#00878a] shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#00878a]">
            MONTAJE EN PROTOBOARD 3D
          </span>
          <span className="text-xs font-extrabold text-slate-900 leading-tight truncate">
            {circuitTitle}
          </span>
          <span className="text-[10px] text-slate-500 leading-tight hidden sm:block">
            Toca o pasa el cursor sobre un cable o componente para ver su pin en el ESP32
          </span>
        </div>
      </div>

      {/* Live Visual ESP32 Pin Pointer & SVG Trace Overlay */}
      {activeInspect && inspectedPinDef && pinCallout && pinCallout.pinVisible && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-15">
          {/* Dashed visual connector line from touched component/wire straight to ESP32 pin */}
          {pinCallout.hitVisible && (
            <svg className="absolute inset-0 w-full h-full">
              <line
                x1={pinCallout.hitX}
                y1={pinCallout.hitY}
                x2={pinCallout.pinX}
                y2={pinCallout.pinY}
                stroke={displayAccentColor}
                strokeWidth="2.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
                opacity="0.9"
              />
              <circle
                cx={pinCallout.hitX}
                cy={pinCallout.hitY}
                r="5"
                fill={displayAccentColor}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx={pinCallout.pinX}
                cy={pinCallout.pinY}
                r="7"
                fill="none"
                stroke={displayAccentColor}
                strokeWidth="2.5"
              />
            </svg>
          )}

          {/* Pin Callout Flag anchored directly above the exact pin on the ESP32 */}
          <div
            style={{
              left: `${pinCallout.pinX}px`,
              top: `${pinCallout.pinY - 22}px`,
              transform: 'translate(-50%, -100%)',
              borderColor: displayAccentColor,
            }}
            className="absolute bg-slate-900 text-white border-2 rounded-xl px-2.5 py-1 shadow-lg flex items-center gap-1.5 whitespace-nowrap"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/60"
              style={{ backgroundColor: displayAccentColor }}
            />
            <span className="font-mono text-[11px] font-extrabold tracking-tight">
              ESP32: {inspectedPinDef.label}
              {inspectedPinDef.gpio !== undefined ? ` (GPIO ${inspectedPinDef.gpio})` : ''}
            </span>
            <span className="font-mono text-[9px] text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
              Pin {inspectedPinDef.id}
            </span>
            {/* Downward pointer caret */}
            <div
              style={{ borderTopColor: displayAccentColor }}
              className="absolute left-1/2 -bottom-[7px] -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px]"
            />
          </div>
        </div>
      )}

      {/* Compact Top-Right Connection Trace Card (appears when hovering/tapping a cable or component) */}
      {activeInspect && inspectedPinDef && (
        <div className="absolute top-3 right-3 z-20 bg-white/95 border-2 rounded-xl p-2.5 shadow-md max-w-[235px] sm:max-w-[265px] flex flex-col gap-1.5"
          style={{ borderColor: displayAccentColor }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: displayAccentColor }}
              />
              <span className="text-[11px] font-extrabold text-slate-900 leading-tight truncate">
                {activeInspect.componentName}
              </span>
            </div>
            {lockedInspect && (
              <button
                onClick={() => {
                  setLockedInspect(null);
                  setHoveredInspect(null);
                }}
                className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                title="Cerrar indicador"
                aria-label="Cerrar indicador"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 text-white rounded-lg px-2 py-1.5">
            <Cpu className="w-3.5 h-3.5 shrink-0 text-teal-400" />
            <ArrowRight className="w-3 h-3 shrink-0 text-slate-400" />
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[11px] font-extrabold leading-tight truncate">
                {inspectedPinDef.label}
                {inspectedPinDef.gpio !== undefined ? ` · GPIO ${inspectedPinDef.gpio}` : ''}
              </span>
              <span className="font-mono text-[9px] text-slate-300 leading-tight">
                Pin #{inspectedPinDef.id} · Hilera {inspectedPinDef.side === 'LEFT' ? 'Izquierda' : 'Derecha'} (pos. {inspectedPinDef.positionIndex + 1})
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-600 leading-snug">
            {activeInspect.connectionDetail}
          </p>
        </div>
      )}

      {/* Floating 3D Jumper Connection Badges */}
      {showWireLabels && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {wireBadges.map((b) => {
            if (!b.visible) return null;
            const isSelected = b.pinId === selectedPinId;
            return (
              <button
                key={b.id}
                onClick={() => {
                  onSelectPinId(b.pinId);
                  setLockedInspect({
                    pinId: b.pinId,
                    componentName: `Cable ${b.label}`,
                    connectionDetail: b.sublabel,
                    colorHex: b.colorHex,
                    hitWorldPos: null,
                    locked: true,
                  });
                }}
                style={{
                  left: `${b.screenX}px`,
                  top: `${b.screenY}px`,
                  transform: 'translate(-50%, -100%)',
                }}
                title={`${b.label}: ${b.sublabel} (Clic para ver pin en ESP32)`}
                className={`absolute pointer-events-auto px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold shadow-sm transition-transform hover:scale-105 flex items-center gap-1 whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-[#00878a]'
                    : 'bg-white/95 text-slate-800 border-slate-300 hover:border-[#00878a]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: b.colorHex }}
                />
                <span>{b.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Compact Bottom Control Dock (Solid surface, zero backdrop-blur) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-white/95 border border-slate-200 rounded-full px-2.5 py-1.5 shadow-md flex items-center gap-1 sm:gap-1.5 max-w-[94%]">
        <button
          onClick={() => setPreset('ISO')}
          className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1 transition-colors"
          title="Vista isométrica del circuito"
        >
          <Compass className="w-3.5 h-3.5 text-[#00878a]" />
          <span className="hidden sm:inline">3D</span>
        </button>

        <button
          onClick={() => setPreset('TOP')}
          className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1 transition-colors"
          title="Vista cenital superior"
        >
          <Eye className="w-3.5 h-3.5 text-[#00878a]" />
          <span className="hidden sm:inline">Cenital</span>
        </button>

        <button
          onClick={() => setPreset('WIRES')}
          className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1 transition-colors"
          title="Enfocar conexiones de cables"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#00878a]" />
          <span className="hidden sm:inline">Cables</span>
        </button>

        <div className="w-px h-4 bg-slate-200 mx-0.5" />

        <button
          onClick={() => handleZoom('OUT')}
          className="p-1.5 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
          title="Alejar zoom"
          aria-label="Alejar zoom"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleZoom('IN')}
          className="p-1.5 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
          title="Acercar zoom"
          aria-label="Acercar zoom"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-0.5" />

        <button
          onClick={() => setShowWireLabels(!showWireLabels)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-colors ${
            showWireLabels
              ? 'bg-[#00878a] text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          title="Mostrar u ocultar etiquetas de cables"
        >
          <Tag className="w-3 h-3" />
          <span className="hidden xs:inline">Etiquetas</span>
        </button>

        <button
          onClick={() => setIsAutoRotating(!isAutoRotating)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-colors ${
            isAutoRotating
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          title="Rotación automática"
        >
          {isAutoRotating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          <span className="hidden sm:inline">Girar</span>
        </button>
      </div>
    </div>
  );
};
