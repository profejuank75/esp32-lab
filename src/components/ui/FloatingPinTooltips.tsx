import React from 'react';
import { PinDefinition, PinFunctionCategory } from '../../types/esp32';
import { AlertTriangle, Info, Zap } from 'lucide-react';

export interface ProjectedPin {
  pin: PinDefinition;
  screenX: number;
  screenY: number;
  visible: boolean; // whether it's in front of the camera
}

interface FloatingPinTooltipsProps {
  projectedPins: ProjectedPin[];
  selectedPinId: number | null;
  hoveredPinId: number | null;
  onSelectPin: (pin: PinDefinition) => void;
  onHoverPin: (pinId: number | null) => void;
  activeCategory: PinFunctionCategory;
  pinVoltages: Map<number, number>;
}

export const FloatingPinTooltips: React.FC<FloatingPinTooltipsProps> = ({
  projectedPins,
  selectedPinId,
  hoveredPinId,
  onSelectPin,
  onHoverPin,
  activeCategory,
  pinVoltages,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {projectedPins.map(({ pin, screenX, screenY, visible }) => {
        if (!visible) return null;

        const isSelected = selectedPinId === pin.id;
        const isHovered = hoveredPinId === pin.id;
        const matchesCategory =
          activeCategory === 'ALL' || pin.categories.includes(activeCategory);

        const currentV = pinVoltages.get(pin.id) ?? pin.voltageNominal;

        // Pin marker dot / label style
        const isPower = pin.primaryType === 'POWER';
        const isGnd = pin.primaryType === 'GND';
        const isRestricted = pin.categories.includes('RESTRICTED');

        const badgeBg = isPower
          ? 'bg-red-500 text-white'
          : isGnd
          ? 'bg-slate-700 text-slate-200'
          : isRestricted
          ? 'bg-amber-600 text-white'
          : 'bg-cyan-600 text-white';

        return (
          <div
            key={pin.id}
            style={{
              transform: `translate(${screenX}px, ${screenY}px)`,
              opacity: matchesCategory ? 1 : 0.2,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-opacity duration-200"
          >
            {/* Interactive Pin Marker Dot */}
            <button
              onClick={() => onSelectPin(pin)}
              onMouseEnter={() => onHoverPin(pin.id)}
              onMouseLeave={() => onHoverPin(null)}
              className={`group relative flex items-center justify-center transition-all ${
                isSelected
                  ? 'scale-125 z-40'
                  : isHovered
                  ? 'scale-110 z-30'
                  : 'z-10'
              }`}
              title={`Pin ${pin.id}: ${pin.label}`}
            >
              {/* Target pin pill */}
              <div
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight shadow-md border flex items-center gap-1 transition-all ${badgeBg} ${
                  isSelected
                    ? 'ring-2 ring-white border-white scale-105'
                    : 'border-slate-900/60 hover:brightness-125'
                }`}
              >
                <span>{pin.label}</span>
                {isSelected && (
                  <span className="text-[9px] bg-black/40 px-1 rounded tabular-nums">
                    {currentV.toFixed(1)}V
                  </span>
                )}
              </div>

              {/* Connecting stalk indicator */}
              <div className="absolute -bottom-2 w-0.5 h-2 bg-white/40 pointer-events-none" />
            </button>

            {/* Expanded Detailed 3D Floating Tooltip card when hovered or selected */}
            {(isHovered || isSelected) && (
              <div
                className={`absolute ${
                  pin.side === 'LEFT' ? 'right-full mr-3' : 'left-full ml-3'
                } top-1/2 -translate-y-1/2 w-64 bg-slate-950/95 border border-slate-700/90 rounded-xl p-3 shadow-2xl backdrop-blur-md z-50 pointer-events-auto flex flex-col gap-2 text-slate-200 animate-in fade-in zoom-in-95 duration-150`}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      Pin {pin.id} · {pin.label}
                    </span>
                    {pin.gpio !== undefined && (
                      <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 px-1 rounded border border-cyan-800">
                        GPIO{pin.gpio}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    <Zap className="w-3 h-3" />
                    <span>{currentV.toFixed(2)} V</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-300 leading-snug">
                  {pin.description}
                </p>

                {/* Multiplexed Functions */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {pin.adcChannel && (
                    <span className="text-[9px] font-mono bg-amber-950/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/60">
                      {pin.adcChannel}
                    </span>
                  )}
                  {pin.dacChannel && (
                    <span className="text-[9px] font-mono bg-purple-950/80 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/60">
                      {pin.dacChannel} (8-bit)
                    </span>
                  )}
                  {pin.touchChannel && (
                    <span className="text-[9px] font-mono bg-pink-950/80 text-pink-300 px-1.5 py-0.5 rounded border border-pink-800/60">
                      {pin.touchChannel}
                    </span>
                  )}
                  {pin.i2cFunction && (
                    <span className="text-[9px] font-mono bg-cyan-950/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/60">
                      {pin.i2cFunction}
                    </span>
                  )}
                  {pin.spiFunction && (
                    <span className="text-[9px] font-mono bg-indigo-950/80 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/60">
                      {pin.spiFunction}
                    </span>
                  )}
                  {pin.uartFunction && (
                    <span className="text-[9px] font-mono bg-teal-950/80 text-teal-300 px-1.5 py-0.5 rounded border border-teal-800/60">
                      {pin.uartFunction}
                    </span>
                  )}
                </div>

                {/* Warnings or notes */}
                {pin.warning && (
                  <div className="flex items-start gap-1.5 bg-amber-950/40 border border-amber-800/60 rounded p-1.5 text-[10px] text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                    <span>{pin.warning}</span>
                  </div>
                )}
                {pin.note && !pin.warning && (
                  <div className="flex items-start gap-1.5 bg-slate-900 border border-slate-800 rounded p-1.5 text-[10px] text-slate-400">
                    <Info className="w-3 h-3 shrink-0 mt-0.5 text-cyan-400" />
                    <span>{pin.note}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
