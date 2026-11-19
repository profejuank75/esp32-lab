import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ESP32BoardModel } from './ESP32BoardModel';
import { ESP32_PINS, ESP32_ANATOMY_PARTS, ESP32_BLUEPRINT_CALLOUTS } from '../../data/esp32Data';
import { PinDefinition, AnatomyPart } from '../../types/esp32';
import { ProjectedPin } from '../ui/FloatingPinTooltips';

export interface ProjectedHotspot {
  id: string;
  screenX: number;
  screenY: number;
  visible: boolean;
}

interface Viewport3DProps {
  explodedProgress: number;
  selectedPinId: number | null;
  hoveredPinId: number | null;
  onSelectPin: (pin: PinDefinition | null) => void;
  onHoverPin: (pinId: number | null) => void;
  onSelectPart: (part: AnatomyPart | null) => void;
  onUpdateProjectedPins: (pins: ProjectedPin[]) => void;
  onUpdateProjectedHotspots: (hotspots: ProjectedHotspot[]) => void;
  ledActive: boolean;
  pinVoltages: Map<number, number>;
  cameraPreset: 'ISO' | 'TOP' | 'FRONT' | 'PINS' | null;
  onCameraPresetApplied: () => void;
  bootPressed: boolean;
  enResetTriggered: boolean;
  isAutoRotating: boolean;
  rotateStep: number; // incremented whenever user clicks ↺ or ↻
  zoomStep: number; // incremented whenever user clicks - or +
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  explodedProgress,
  onSelectPin,
  onHoverPin,
  onSelectPart,
  onUpdateProjectedPins,
  onUpdateProjectedHotspots,
  ledActive,
  cameraPreset,
  onCameraPresetApplied,
  bootPressed,
  enResetTriggered,
  isAutoRotating,
  rotateStep,
  zoomStep,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const boardModelRef = useRef<ESP32BoardModel | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const targetCameraPos = useRef<THREE.Vector3 | null>(null);
  const targetLookAt = useRef<THREE.Vector3 | null>(null);

  const onSelectPinRef = useRef(onSelectPin);
  onSelectPinRef.current = onSelectPin;
  const onHoverPinRef = useRef(onHoverPin);
  onHoverPinRef.current = onHoverPin;
  const onSelectPartRef = useRef(onSelectPart);
  onSelectPartRef.current = onSelectPart;
  const onUpdateProjectedPinsRef = useRef(onUpdateProjectedPins);
  onUpdateProjectedPinsRef.current = onUpdateProjectedPins;
  const onUpdateProjectedHotspotsRef = useRef(onUpdateProjectedHotspots);
  onUpdateProjectedHotspotsRef.current = onUpdateProjectedHotspots;

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

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // Transparent background so the .bg-blueprint-grid shows through seamlessly
    scene.background = null;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    // Perspective matching ArduinoLab 3D
    camera.position.set(4.2, 4.6, 5.4);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 2.5;
    controls.maxDistance = 14;
    controls.target.set(0, 0, 0);
    controls.autoRotate = isAutoRotating;
    controls.autoRotateSpeed = 1.2;
    controlsRef.current = controls;

    // Lighting rig for clean engineering showcase
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 1.4);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(5, 9, 5);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 20;
      const d = 4.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00979d, 0.8);
    rimLight.position.set(-6, 3, -6);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.9);
    fillLight.position.set(0, 2, 7);
    scene.add(fillLight);

    // Soft ground contact shadow for clean engineering grounding
    const contactShadowTexture = (() => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(256, 256, 50, 256, 256, 240);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.28)');
      grad.addColorStop(0.6, 'rgba(15, 23, 42, 0.10)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    })();

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshBasicMaterial({
        map: contactShadowTexture,
        transparent: true,
        depthWrite: false,
        opacity: 0.65,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.0;
    scene.add(shadowPlane);

    // Add procedural ESP32 board
    const boardModel = new ESP32BoardModel();
    scene.add(boardModel.group);
    boardModelRef.current = boardModel;

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getRaycastIntersects = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      return raycaster.intersectObjects(boardModel.pickableMeshes, true);
    };

    const handlePointerMove = (e: MouseEvent) => {
      const hits = getRaycastIntersects(e.clientX, e.clientY);
      if (hits.length > 0) {
        let foundPinId: number | null = null;
        for (const hit of hits) {
          let cur: THREE.Object3D | null = hit.object;
          while (cur && cur !== scene) {
            if (cur.userData?.pinId) {
              foundPinId = cur.userData.pinId;
              break;
            }
            cur = cur.parent;
          }
          if (foundPinId) break;
        }
        onHoverPinRef.current(foundPinId);
      } else {
        onHoverPinRef.current(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const hits = getRaycastIntersects(e.clientX, e.clientY);
      if (hits.length > 0) {
        for (const hit of hits) {
          let cur: THREE.Object3D | null = hit.object;
          while (cur && cur !== scene) {
            if (cur.userData?.pinId) {
              const pin = ESP32_PINS.find((p) => p.id === cur!.userData.pinId);
              if (pin) {
                onSelectPinRef.current(pin);
                return;
              }
            } else if (cur.userData?.partId) {
              const part = ESP32_ANATOMY_PARTS.find((p) => p.id === cur!.userData.partId);
              if (part) {
                onSelectPartRef.current(part);
                return;
              }
            }
            cur = cur.parent;
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animFrameId = 0;
    const clock = new THREE.Clock();
    const tempVec = new THREE.Vector3();

    const animate = () => {
      const delta = Math.min(0.1, clock.getDelta());
      boardModel.update(delta);

      if (targetCameraPos.current && targetLookAt.current) {
        camera.position.lerp(targetCameraPos.current, 0.08);
        controls.target.lerp(targetLookAt.current, 0.08);
        if (camera.position.distanceTo(targetCameraPos.current) < 0.05) {
          targetCameraPos.current = null;
          targetLookAt.current = null;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      const w = renderer.domElement.clientWidth;
      const h = renderer.domElement.clientHeight;

      // Project 38 pins
      const projected: ProjectedPin[] = [];
      ESP32_PINS.forEach((pin) => {
        const anchor = boardModel.pinAnchorObjects.get(pin.id);
        if (anchor) {
          anchor.getWorldPosition(tempVec);
          tempVec.project(camera);
          projected.push({
            pin,
            screenX: (tempVec.x * 0.5 + 0.5) * w,
            screenY: (-tempVec.y * 0.5 + 0.5) * h,
            visible: tempVec.z < 1,
          });
        }
      });
      onUpdateProjectedPinsRef.current(projected);

      // Project blueprint hotspots
      const projectedHotspots: ProjectedHotspot[] = [];
      ESP32_BLUEPRINT_CALLOUTS.forEach((callout) => {
        const hotspotObj = boardModel.hotspotObjects.get(callout.id);
        if (hotspotObj) {
          hotspotObj.getWorldPosition(tempVec);
          tempVec.project(camera);
          projectedHotspots.push({
            id: callout.id,
            screenX: (tempVec.x * 0.5 + 0.5) * w,
            screenY: (-tempVec.y * 0.5 + 0.5) * h,
            visible: tempVec.z < 1,
          });
        }
      });
      onUpdateProjectedHotspotsRef.current(projectedHotspots);

      animFrameId = requestAnimationFrame(animate);
    };
    animFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update exploded view
  useEffect(() => {
    if (boardModelRef.current) {
      boardModelRef.current.targetExplodedProgress = explodedProgress;
    }
  }, [explodedProgress]);

  // Update user LED
  useEffect(() => {
    if (boardModelRef.current) {
      boardModelRef.current.setUserLedState(ledActive);
    }
  }, [ledActive]);

  // Buttons feedback
  useEffect(() => {
    if (boardModelRef.current) {
      boardModelRef.current.setButtonPress('BOOT', bootPressed);
    }
  }, [bootPressed]);

  useEffect(() => {
    if (boardModelRef.current) {
      boardModelRef.current.setButtonPress('EN', enResetTriggered);
    }
  }, [enResetTriggered]);

  // Auto-rotation toggle
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating;
    }
  }, [isAutoRotating]);

  // Handle rotate step buttons (↺ and ↻)
  useEffect(() => {
    if (controlsRef.current && cameraRef.current && rotateStep !== 0) {
      const angle = (rotateStep > 0 ? 1 : -1) * (Math.PI / 8);
      const cam = cameraRef.current;
      const x = cam.position.x;
      const z = cam.position.z;
      cam.position.x = x * Math.cos(angle) - z * Math.sin(angle);
      cam.position.z = x * Math.sin(angle) + z * Math.cos(angle);
      controlsRef.current.update();
    }
  }, [rotateStep]);

  // Handle zoom step buttons (- and +)
  useEffect(() => {
    if (controlsRef.current && cameraRef.current && zoomStep !== 0) {
      const factor = zoomStep > 0 ? 0.85 : 1.18;
      cameraRef.current.position.multiplyScalar(factor);
      controlsRef.current.update();
    }
  }, [zoomStep]);

  // Handle camera presets
  useEffect(() => {
    if (!cameraPreset || !controlsRef.current || !cameraRef.current) return;

    if (cameraPreset === 'ISO') {
      targetCameraPos.current = new THREE.Vector3(4.2, 4.6, 5.4);
      targetLookAt.current = new THREE.Vector3(0, 0, 0);
    } else if (cameraPreset === 'TOP') {
      targetCameraPos.current = new THREE.Vector3(0, 8.2, 0.01);
      targetLookAt.current = new THREE.Vector3(0, 0, 0);
    } else if (cameraPreset === 'FRONT') {
      targetCameraPos.current = new THREE.Vector3(0, 1.2, 7.2);
      targetLookAt.current = new THREE.Vector3(0, 0.2, 0);
    } else if (cameraPreset === 'PINS') {
      targetCameraPos.current = new THREE.Vector3(5.2, 2.8, 0);
      targetLookAt.current = new THREE.Vector3(0, 0, 0);
    }

    onCameraPresetApplied();
  }, [cameraPreset, onCameraPresetApplied]);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing outline-none select-none bg-blueprint-grid"
    />
  );
};
