import React, { useState } from 'react';
import { PinDefinition, PinFunctionCategory } from '../../types/esp32';
import { ESP32_PINS } from '../../data/esp32Data';
import { D3Oscilloscope } from './D3Oscilloscope';
import { SignalSample } from '../../services/circuitSimulator';
import { Filter, Zap, AlertTriangle, Layers, Activity } from 'lucide-react';

interface PinoutTabProps {
  selectedPin: PinDefinition;
  onSelectPin: (pin: PinDefinition) => void;
  waveform: SignalSample[];
  currentVoltage: number;
  pinVoltages: Map<number, number>;
}

export const PinoutTab: React.FC<PinoutTabProps> = ({
  selectedPin,
  onSelectPin,
  waveform,
  currentVoltage,
  pinVoltages,
}) => {
  const [activeCategory, setActiveCategory] = useState<PinFunctionCategory>('ALL');
  const [mobileSection, setMobileSection] = useState<'LEFT' | 'SCOPE' | 'RIGHT'>('SCOPE');

  const categories: { id: PinFunctionCategory; label: string }[] = [
    { id: 'ALL', label: 'Todos (38)' },
    { id: 'POWER', label: 'Alimentación' },
    { id: 'ADC', label: 'ADC Analógicos' },
    { id: 'DAC', label: 'DAC (D25/D26)' },
    { id: 'TOUCH', label: 'Touch Táctil' },
    { id: 'I2C', label: 'I2C (GPIO21/22)' },
    { id: 'SPI', label: 'Buses SPI' },
    { id: 'UART', label: 'UART Serial' },
    { id: 'STRAPPING', label: 'Strapping' },
  ];

  const leftPins = ESP32_PINS.filter((p) => p.side === 'LEFT');
  const rightPins = ESP32_PINS.filter((p) => p.side === 'RIGHT');

  const matchesCategory = (pin: PinDefinition) => {
    return activeCategory === 'ALL' || pin.categories.includes(activeCategory);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 p-3 sm:p-6 pb-24 lg:pb-6 flex flex-col gap-4 sm:gap-6 select-none">
      {/* Top Filter and Info Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#00878a]" />
          <span className="text-xs font-bold text-slate-700">Filtrar por Periférico:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-[#00878a] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile-only section switcher */}
      <div className="lg:hidden grid grid-cols-3 gap-1 p-1 bg-slate-200/80 rounded-xl">
        <button
          onClick={() => setMobileSection('LEFT')}
          className={`py-2 text-xs font-bold rounded-lg transition-colors min-h-[44px] ${
            mobileSection === 'LEFT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Hilera Izq (1-19)
        </button>
        <button
          onClick={() => setMobileSection('SCOPE')}
          className={`py-2 text-xs font-bold rounded-lg transition-colors min-h-[44px] ${
            mobileSection === 'SCOPE' ? 'bg-white text-[#00878a] shadow-xs' : 'text-slate-600'
          }`}
        >
          Osciloscopio
        </button>
        <button
          onClick={() => setMobileSection('RIGHT')}
          className={`py-2 text-xs font-bold rounded-lg transition-colors min-h-[44px] ${
            mobileSection === 'RIGHT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Hilera Der (20-38)
        </button>
      </div>

      {/* Main Grid: Pinout Diagrams + D3 Oscilloscope */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left Column: 19 Left Header Pins */}
        <div
          className={`lg:col-span-4 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex-col gap-2 ${
            mobileSection === 'LEFT' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>Hilera Izquierda (Pines 1 - 19)</span>
            <span className="text-[11px] font-mono text-[#00878a]">3V3 / EN / ADC</span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-[580px] overflow-y-auto pr-1">
            {leftPins.map((pin) => {
              const active = matchesCategory(pin);
              const isSelected = selectedPin.id === pin.id;
              const liveV = pinVoltages.get(pin.id) ?? pin.voltageNominal;

              return (
                <div
                  key={pin.id}
                  onClick={() => {
                    onSelectPin(pin);
                    if (window.innerWidth < 1024) setMobileSection('SCOPE');
                  }}
                  className={`min-h-[46px] p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    !active ? 'opacity-30' : ''
                  } ${
                    isSelected
                      ? 'bg-teal-50/80 border-[#00878a] shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 text-[10px] font-mono font-bold text-slate-400">
                      #{pin.id}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {pin.label}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[150px] sm:max-w-[180px]">
                        {pin.description}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-emerald-600 tabular-nums shrink-0 ml-2">
                    {liveV.toFixed(2)}V
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center / Right: Live D3 Oscilloscope & Pin Inspector */}
        <div
          className={`lg:col-span-4 flex-col gap-4 ${
            mobileSection === 'SCOPE' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col gap-3">
            <div className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Sonda del Osciloscopio D3</span>
              <span className="text-xs font-mono text-emerald-600 font-bold">
                EN VIVO · PIN {selectedPin.label}
              </span>
            </div>

            <D3Oscilloscope
              selectedPin={selectedPin}
              waveform={waveform}
              currentVoltage={currentVoltage}
            />

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex flex-col gap-2">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>Detalles del Pin Seleccionado:</span>
                <span className="font-mono text-[#00878a]">ID #{selectedPin.id}</span>
              </div>
              <p className="text-slate-600">{selectedPin.description}</p>
              {selectedPin.warning && (
                <div className="flex items-start gap-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <span>{selectedPin.warning}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 19 Right Header Pins */}
        <div
          className={`lg:col-span-4 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex-col gap-2 ${
            mobileSection === 'RIGHT' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>Hilera Derecha (Pines 20 - 38)</span>
            <span className="text-[11px] font-mono text-[#00878a]">GND / I2C / SPI</span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-[580px] overflow-y-auto pr-1">
            {rightPins.map((pin) => {
              const active = matchesCategory(pin);
              const isSelected = selectedPin.id === pin.id;
              const liveV = pinVoltages.get(pin.id) ?? pin.voltageNominal;

              return (
                <div
                  key={pin.id}
                  onClick={() => {
                    onSelectPin(pin);
                    if (window.innerWidth < 1024) setMobileSection('SCOPE');
                  }}
                  className={`min-h-[46px] p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    !active ? 'opacity-30' : ''
                  } ${
                    isSelected
                      ? 'bg-teal-50/80 border-[#00878a] shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 text-[10px] font-mono font-bold text-slate-400">
                      #{pin.id}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {pin.label}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[150px] sm:max-w-[180px]">
                        {pin.description}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-emerald-600 tabular-nums shrink-0 ml-2">
                    {liveV.toFixed(2)}V
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
