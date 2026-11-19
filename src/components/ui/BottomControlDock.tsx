import React from 'react';
import { LabMode, PinFunctionCategory, AnatomyPart } from '../../types/esp32';
import {
  Layers,
  Grid,
  Activity,
  RotateCcw,
  Eye,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Compass,
} from 'lucide-react';

interface BottomControlDockProps {
  currentMode: LabMode;
  onSelectMode: (mode: LabMode) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  // Exploded View Props
  explodedProgress: number;
  onExplodedChange: (val: number) => void;
  // Pinout Filter Props
  activeCategory: PinFunctionCategory;
  onSelectCategory: (cat: PinFunctionCategory) => void;
  // Camera Presets
  onSetCameraPreset: (preset: 'ISO' | 'TOP' | 'FRONT' | 'PINS') => void;
  onResetCamera: () => void;
  // Anatomy parts list
  anatomyParts: AnatomyPart[];
  selectedPart: AnatomyPart | null;
  onSelectPart: (part: AnatomyPart) => void;
}

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  currentMode,
  onSelectMode,
  isCollapsed,
  onToggleCollapse,
  explodedProgress,
  onExplodedChange,
  activeCategory,
  onSelectCategory,
  onSetCameraPreset,
  onResetCamera,
  anatomyParts,
  selectedPart,
  onSelectPart,
}) => {
  const pinCategories: { id: PinFunctionCategory; label: string }[] = [
    { id: 'ALL', label: 'Todos (38)' },
    { id: 'POWER', label: '3.3V / 5V' },
    { id: 'GND', label: 'GND (0V)' },
    { id: 'ADC', label: 'ADC Analógicos' },
    { id: 'DAC', label: 'DAC (D25/D26)' },
    { id: 'TOUCH', label: 'Touch Táctil' },
    { id: 'I2C', label: 'I2C (D21/D22)' },
    { id: 'SPI', label: 'SPI (HSPI/VSPI)' },
    { id: 'UART', label: 'UART Serial' },
    { id: 'STRAPPING', label: 'Strapping' },
  ];

  return (
    <div
      style={{
        maxWidth: 'min(960px, 94vw)',
      }}
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 transition-transform duration-300 ease-out flex flex-col items-center ${
        isCollapsed ? 'translate-y-[calc(100%-2.25rem)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand Tab Button */}
      <button
        onClick={onToggleCollapse}
        className="px-4 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-t-xl border-t border-x border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 shadow-xl backdrop-blur-md transition-colors"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Mostrar Panel de Control</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Modo Cine (Ocultar Dock)</span>
          </>
        )}
      </button>

      {/* Main Glassmorphic Dock Container */}
      <div className="w-full bg-slate-950/95 border border-slate-800 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-col gap-3">
        {/* Top bar of dock: Mode selector & Camera Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5">
          {/* Main Lab Modes */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onSelectMode('ANATOMY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                currentMode === 'ANATOMY'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Anatomía & Despiece
            </button>

            <button
              onClick={() => onSelectMode('PINOUT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                currentMode === 'PINOUT'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Mapa de Pines (38)
            </button>

            <button
              onClick={() => onSelectMode('CIRCUITS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                currentMode === 'CIRCUITS'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Circuitos & Osciloscopio
            </button>
          </div>

          {/* Camera Presets */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">Cámara:</span>
            <button
              onClick={() => onSetCameraPreset('ISO')}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-medium"
              title="Vista isométrica orbital"
            >
              Isométrica
            </button>
            <button
              onClick={() => onSetCameraPreset('TOP')}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-medium"
              title="Vista superior 2D/3D cenital"
            >
              Superior
            </button>
            <button
              onClick={() => onSetCameraPreset('FRONT')}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-medium"
              title="Vista frontal"
            >
              Frontal
            </button>
            <button
              onClick={onResetCamera}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
              title="Restablecer vista inicial"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Mode Content in Dock */}
        {currentMode === 'ANATOMY' && (
          <div className="flex flex-col gap-2">
            {/* Exploded slider & percentage */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 shrink-0">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Despiece Explosionado:</span>
                <span className="font-mono text-cyan-400 font-bold tabular-nums">
                  {Math.round(explodedProgress * 100)}%
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={explodedProgress}
                aria-label="Despiece explosionado"
                onChange={(e) => onExplodedChange(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2"
              />

              <button
                onClick={() => onExplodedChange(explodedProgress > 0 ? 0 : 0.85)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 shrink-0 font-medium"
              >
                {explodedProgress > 0 ? 'Compactar' : 'Separar Todo'}
              </button>
            </div>

            {/* Quick parts selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
              <span className="text-[10px] text-slate-500 font-mono shrink-0">Partes:</span>
              {anatomyParts.map((part) => (
                <button
                  key={part.id}
                  onClick={() => onSelectPart(part)}
                  className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors border ${
                    selectedPart?.id === part.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  {part.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentMode === 'PINOUT' && (
          <div className="flex flex-col gap-1.5">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Filtrar pines por categoría (pasa el cursor o haz clic para ver voltajes y multiplexado):</span>
              <span className="font-mono text-cyan-400 font-semibold">2 hileras × 19 pines</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {pinCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                    activeCategory === cat.id
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentMode === 'CIRCUITS' && (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Interactúa con los módulos superiores o selecciona un pin de la placa para conectar la sonda del osciloscopio en tiempo real.
            </span>
            <span className="font-mono text-emerald-400 font-semibold shrink-0">
              ADC 12-bit (0-4095) / I2C @ 400kHz
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
