import React, { useState, useEffect, useCallback } from 'react';
import { Topbar, AppTab } from './components/ui/Topbar';
import { MobileBottomNav } from './components/ui/MobileBottomNav';
import { SidebarAnatomy } from './components/ui/SidebarAnatomy';
import { Viewport3D, ProjectedHotspot } from './components/3d/Viewport3D';
import { BlueprintCalloutsOverlay } from './components/ui/BlueprintCalloutsOverlay';
import { BottomViewportToolbar } from './components/ui/BottomViewportToolbar';
import { AnatomyDetailModal } from './components/ui/AnatomyDetailModal';
import { SimulatorTab } from './components/ui/SimulatorTab';
import { CodeIdeTab } from './components/ui/CodeIdeTab';
import { PinoutTab } from './components/ui/PinoutTab';
import { DatasheetModal } from './components/ui/DatasheetModal';
import { EmbedModal } from './components/ui/EmbedModal';
import { ESP32_PINS, ESP32_ANATOMY_PARTS } from './data/esp32Data';
import { PinDefinition, AnatomyPart, CircuitState } from './types/esp32';
import { circuitSim, SignalSample } from './services/circuitSimulator';
import { ProjectedPin } from './components/ui/FloatingPinTooltips';

export default function App() {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<AppTab>('ANATOMY');

  // Anatomy & 3D states
  const [explodedProgress, setExplodedProgress] = useState<number>(0);
  const [showBlueprintCards, setShowBlueprintCards] = useState<boolean>(true);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [rotateStep, setRotateStep] = useState<number>(0);
  const [zoomStep, setZoomStep] = useState<number>(0);
  const [cameraPreset, setCameraPreset] = useState<'ISO' | 'TOP' | 'FRONT' | 'PINS' | null>(null);

  // Mobile Drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Entities selection
  const [selectedPin, setSelectedPin] = useState<PinDefinition>(
    ESP32_PINS.find((p) => p.id === 28)! // Pin 28 (GPIO18 - LED Rojo)
  );
  const [hoveredPinId, setHoveredPinId] = useState<number | null>(null);
  const [selectedPart, setSelectedPart] = useState<AnatomyPart | null>(null);

  // Modals
  const [isDatasheetOpen, setIsDatasheetOpen] = useState<boolean>(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState<boolean>(false);

  // 3D projections
  const [, setProjectedPins] = useState<ProjectedPin[]>([]);
  const [projectedHotspots, setProjectedHotspots] = useState<ProjectedHotspot[]>([]);

  // Circuit simulator state
  const [circuitState, setCircuitState] = useState<CircuitState>(circuitSim.getState());
  const [ledActive, setLedActive] = useState<boolean>(false);
  const [pinVoltages, setPinVoltages] = useState<Map<number, number>>(new Map());
  const [waveform, setWaveform] = useState<SignalSample[]>([]);

  // Live simulation tick loop
  useEffect(() => {
    const interval = window.setInterval(() => {
      const { ledActive: isLedOn, currentPinVoltages } = circuitSim.tick();
      setLedActive(isLedOn);
      setPinVoltages(new Map(currentPinVoltages));
      setCircuitState(circuitSim.getState());
      setWaveform([...circuitSim.getPinWaveform(selectedPin.id)]);
    }, 40);

    return () => clearInterval(interval);
  }, [selectedPin.id]);

  const handleStateChange = useCallback(() => {
    setCircuitState(circuitSim.getState());
  }, []);

  const handleOpenPartDetails = (partId: string) => {
    const part = ESP32_ANATOMY_PARTS.find((p) => p.id === partId);
    if (part) {
      setSelectedPart(part);
    }
  };

  const handleRotateStep = (dir: 'CCW' | 'CW') => {
    setRotateStep((prev) => (dir === 'CW' ? prev + 1 : prev - 1));
  };

  const handleZoomStep = (dir: 'IN' | 'OUT') => {
    setZoomStep((prev) => (dir === 'IN' ? prev + 1 : prev - 1));
  };

  const handleDownloadZip = () => {
    const zipManifest = `ESP32Lab 3D - Paquete de Desarrollo
Placa: ESP32 NodeMCU DevKit V1 (38 Pines)
Procesador: Dual-Core Xtensa 32-bit LX6 @ 240 MHz
Contenido:
- Datasheet oficial ESP-WROOM-32
- Pinout de alta resolución (38 pines)
- Código de ejemplo: Control Wi-Fi 3 LEDs (GPIO 18/19/21), LDR ADC1, Blink GPIO2
- Diagramas esquemáticos y conexiones`;
    const blob = new Blob([zipManifest], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ESP32Lab_3D_Package.txt';
    a.click();
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#f0f4f8] text-slate-800 flex flex-col font-sans select-none">
      {/* 1. Header Topbar (Responsive for mobile & desktop) */}
      <Topbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenDatasheet={() => setIsDatasheetOpen(true)}
        onOpenEmbed={() => setIsEmbedModalOpen(true)}
        onDownloadZip={handleDownloadZip}
        onResetBoard={() => {
          circuitSim.triggerReset();
          handleStateChange();
        }}
        isResetting={circuitState.enResetTriggered}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 w-full h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] flex overflow-hidden relative">
        {/* TAB 1: ANATOMÍA */}
        {activeTab === 'ANATOMY' && (
          <>
            {/* Sidebar with Desktop & Mobile Drawer mode */}
            <SidebarAnatomy
              parts={ESP32_ANATOMY_PARTS}
              selectedPart={selectedPart}
              onSelectPart={setSelectedPart}
              showBlueprintCards={showBlueprintCards}
              onToggleBlueprintCards={setShowBlueprintCards}
              onResetView={() => {
                setCameraPreset('ISO');
                setExplodedProgress(0);
                setSelectedPart(null);
              }}
              explodedProgress={explodedProgress}
              onExplodedChange={setExplodedProgress}
              isOpenMobile={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />

            {/* Central 3D Canvas Viewport */}
            <main className="flex-1 h-full relative overflow-hidden bg-blueprint-grid">
              <Viewport3D
                explodedProgress={explodedProgress}
                selectedPinId={selectedPin.id}
                hoveredPinId={hoveredPinId}
                onSelectPin={(pin) => {
                  if (pin) setSelectedPin(pin);
                }}
                onHoverPin={setHoveredPinId}
                onSelectPart={setSelectedPart}
                onUpdateProjectedPins={setProjectedPins}
                onUpdateProjectedHotspots={setProjectedHotspots}
                ledActive={ledActive}
                pinVoltages={pinVoltages}
                cameraPreset={cameraPreset}
                onCameraPresetApplied={() => setCameraPreset(null)}
                bootPressed={circuitState.bootPressed}
                enResetTriggered={circuitState.enResetTriggered}
                isAutoRotating={isAutoRotating}
                rotateStep={rotateStep}
                zoomStep={zoomStep}
              />

              {/* Floating Blueprint 3D Cards */}
              <BlueprintCalloutsOverlay
                projectedHotspots={projectedHotspots}
                showCards={showBlueprintCards}
                onOpenPartDetails={handleOpenPartDetails}
                selectedPartId={selectedPart?.id}
              />

              {/* Bottom Floating Viewport Toolbar */}
              <BottomViewportToolbar
                onRotateStep={handleRotateStep}
                onZoomStep={handleZoomStep}
                onSetPreset={(preset) => setCameraPreset(preset)}
                showBlueprintCards={showBlueprintCards}
                onToggleBlueprintCards={() => setShowBlueprintCards(!showBlueprintCards)}
                isAutoRotating={isAutoRotating}
                onToggleAutoRotate={() => setIsAutoRotating(!isAutoRotating)}
                onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
              />

              {/* Detail Modal for Selected Component */}
              <AnatomyDetailModal
                selectedPart={selectedPart}
                onClose={() => setSelectedPart(null)}
                onSelectPart={setSelectedPart}
                allParts={ESP32_ANATOMY_PARTS}
              />
            </main>
          </>
        )}

        {/* TAB 2: SIMULADOR */}
        {activeTab === 'SIMULATOR' && (
          <SimulatorTab
            circuitState={circuitState}
            ledActive={ledActive}
            onStateChange={handleStateChange}
            selectedPin={selectedPin}
            onSelectPinId={(id) => {
              const p = ESP32_PINS.find((pin) => pin.id === id);
              if (p) setSelectedPin(p);
            }}
            waveform={waveform}
            currentVoltage={pinVoltages.get(selectedPin.id) ?? selectedPin.voltageNominal}
          />
        )}

        {/* TAB 3: CÓDIGO IDE */}
        {activeTab === 'IDE' && (
          <CodeIdeTab
            circuitState={circuitState}
            onStateChange={handleStateChange}
          />
        )}

        {/* TAB 4: PINOUT */}
        {activeTab === 'PINOUT' && (
          <PinoutTab
            selectedPin={selectedPin}
            onSelectPin={setSelectedPin}
            waveform={waveform}
            currentVoltage={pinVoltages.get(selectedPin.id) ?? selectedPin.voltageNominal}
            pinVoltages={pinVoltages}
          />
        )}
      </div>

      {/* 3. Mobile Fixed Bottom Navigation Bar (<lg) */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* 4. Official Datasheet Modal */}
      <DatasheetModal
        isOpen={isDatasheetOpen}
        onClose={() => setIsDatasheetOpen(false)}
      />

      {/* 5. Embed Modal */}
      <EmbedModal
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
      />
    </div>
  );
}
