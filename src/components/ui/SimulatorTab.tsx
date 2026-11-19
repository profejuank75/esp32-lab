import React from 'react';
import { CircuitState, PinDefinition } from '../../types/esp32';
import { CircuitControls } from './CircuitControls';
import { D3Oscilloscope } from './D3Oscilloscope';
import { Circuit3DViewport } from '../3d/Circuit3DViewport';
import { CircuitSummaryPanel } from './CircuitSummaryPanel';
import { SignalSample } from '../../services/circuitSimulator';

interface SimulatorTabProps {
  circuitState: CircuitState;
  ledActive: boolean;
  onStateChange: () => void;
  selectedPin: PinDefinition;
  onSelectPinId: (pinId: number) => void;
  waveform: SignalSample[];
  currentVoltage: number;
}

export const SimulatorTab: React.FC<SimulatorTabProps> = ({
  circuitState,
  ledActive,
  onStateChange,
  selectedPin,
  onSelectPinId,
  waveform,
  currentVoltage,
}) => {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 p-3 sm:p-5 pb-24 lg:pb-6 flex flex-col gap-4 select-none">
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[#00878a]">
              MÓDULO 02 • BANCO DE PRUEBAS & SIMULACIÓN 3D
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Laboratorio de Circuitos Interactivos en 3D para ESP32
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Observa el montaje físico en protoboard 3D con el circuito Wi-Fi de 3 LEDs (GPIO 18, 19 y 21), sensores y actuadores, y analiza sus conexiones y señales en tiempo real.
            </p>
          </div>
        </div>

        {/* Main Split Workbench: Left (3D Circuit + Interactive Controls) | Right (Resumen/Pines/Ejemplo Card + Oscilloscope) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column (7 cols): Interactive 3D Circuit Scene + Circuit Selector & Controls */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="h-[340px] sm:h-[420px] lg:h-[480px] w-full">
              <Circuit3DViewport
                circuitState={circuitState}
                ledActive={ledActive}
                selectedPinId={selectedPin.id}
                onSelectPinId={onSelectPinId}
              />
            </div>

            <CircuitControls
              circuitState={circuitState}
              onStateChange={onStateChange}
              onSelectPinId={onSelectPinId}
            />
          </div>

          {/* Right Column (5 cols): Reference Summary Card (RESUMEN | PINES | EJEMPLO | ESPECIFICACIONES) + Oscilloscope */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <CircuitSummaryPanel
              circuitType={circuitState.type}
              selectedPinId={selectedPin.id}
              onSelectPinId={onSelectPinId}
            />

            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col gap-2">
              <div className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>Telemetría de Señal (D3.js)</span>
                <span className="font-mono text-emerald-600 font-bold text-[11px] sm:text-xs truncate ml-2">
                  SONDA: {selectedPin.label} ({selectedPin.gpio !== undefined ? `GPIO${selectedPin.gpio}` : selectedPin.primaryType})
                </span>
              </div>

              <D3Oscilloscope
                selectedPin={selectedPin}
                waveform={waveform}
                currentVoltage={currentVoltage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
