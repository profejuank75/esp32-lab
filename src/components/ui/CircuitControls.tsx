import React from 'react';
import { CircuitState, CircuitType } from '../../types/esp32';
import { circuitSim } from '../../services/circuitSimulator';
import {
  Sun,
  Zap,
  Wifi,
  Cpu,
  RefreshCw,
  Power,
  Smartphone,
  Play,
  Lightbulb,
} from 'lucide-react';

interface CircuitControlsProps {
  circuitState: CircuitState;
  onStateChange: () => void;
  onSelectPinId: (pinId: number) => void;
}

export const CircuitControls: React.FC<CircuitControlsProps> = ({
  circuitState,
  onStateChange,
  onSelectPinId,
}) => {
  const handleCircuitSelect = (type: CircuitType) => {
    circuitSim.setCircuitType(type);
    if (type === 'WIFI_3LEDS') onSelectPinId(28); // GPIO18 LED Rojo
    if (type === 'LDR_ANALOG') onSelectPinId(5); // GPIO34 ADC1
    if (type === 'GPIO2_BLINK') onSelectPinId(33); // GPIO2 LED
    if (type === 'BOOT_INTERRUPT') onSelectPinId(2); // EN or GPIO0
    onStateChange();
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 shadow-2xl flex flex-col gap-3">
      {/* Circuit mode selector tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800/80 overflow-x-auto">
        <button
          onClick={() => handleCircuitSelect('WIFI_3LEDS')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            circuitState.type === 'WIFI_3LEDS'
              ? 'bg-[#00878a] text-white shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wifi className="w-3.5 h-3.5" />
          Control Wi-Fi 3 LEDs (GPIO18/19/21)
        </button>

        <button
          onClick={() => handleCircuitSelect('LDR_ANALOG')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            circuitState.type === 'LDR_ANALOG'
              ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          Sensor LDR Analógico (GPIO34)
        </button>

        <button
          onClick={() => handleCircuitSelect('GPIO2_BLINK')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            circuitState.type === 'GPIO2_BLINK'
              ? 'bg-blue-500 text-white shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          LED Azul & PWM (GPIO2)
        </button>

        <button
          onClick={() => handleCircuitSelect('BOOT_INTERRUPT')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            circuitState.type === 'BOOT_INTERRUPT'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Botones BOOT / EN
        </button>
      </div>

      {/* Content depending on selected circuit */}
      {circuitState.type === 'WIFI_3LEDS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
          {/* Virtual Smartphone Web Interface (http://192.168.4.1) */}
          <div className="bg-slate-950 border-2 border-slate-700 rounded-2xl p-2.5 flex flex-col gap-2 shadow-inner">
            {/* Phone Status & Address Bar */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
              <span className="flex items-center gap-1 text-slate-300 font-bold">
                <Smartphone className="w-3 h-3 text-[#00a8ac]" />
                10:24
              </span>
              <span className="bg-slate-900 border border-slate-700/80 text-sky-300 px-2 py-0.5 rounded-md text-[10px]">
                http://{circuitState.wifiIp}
              </span>
              <Wifi className="w-3 h-3 text-emerald-400" />
            </div>

            {/* Simulated Mobile Web Page */}
            <div className="bg-white rounded-xl p-2.5 flex flex-col gap-2 shadow-sm">
              <div className="text-center border-b border-slate-100 pb-1">
                <div className="text-xs font-extrabold text-blue-700 tracking-tight">
                  Control Wi-Fi ESP32
                </div>
              </div>

              <button
                onClick={() => {
                  circuitSim.toggleWifiLed('RED');
                  onSelectPinId(28);
                  onStateChange();
                }}
                className={`w-full py-2 px-3 rounded-lg font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer ${
                  circuitState.wifiLedRed
                    ? 'bg-red-600 text-white shadow-[0_0_14px_rgba(239,68,68,0.55)] ring-2 ring-red-300'
                    : 'bg-red-500/85 hover:bg-red-600 text-white/95 opacity-80'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                  LED ROJO
                </span>
                <span className="font-mono text-[10px] bg-black/20 px-1.5 py-0.5 rounded">
                  {circuitState.wifiLedRed ? 'ON · 3.3V' : 'OFF · 0V'}
                </span>
              </button>

              <button
                onClick={() => {
                  circuitSim.toggleWifiLed('YELLOW');
                  onSelectPinId(27);
                  onStateChange();
                }}
                className={`w-full py-2 px-3 rounded-lg font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer ${
                  circuitState.wifiLedYellow
                    ? 'bg-amber-400 text-slate-950 shadow-[0_0_14px_rgba(250,204,21,0.6)] ring-2 ring-amber-200'
                    : 'bg-amber-400/75 hover:bg-amber-400 text-slate-900 opacity-80'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                  LED AMARILLO
                </span>
                <span className="font-mono text-[10px] bg-black/15 px-1.5 py-0.5 rounded">
                  {circuitState.wifiLedYellow ? 'ON · 3.3V' : 'OFF · 0V'}
                </span>
              </button>

              <button
                onClick={() => {
                  circuitSim.toggleWifiLed('GREEN');
                  onSelectPinId(25);
                  onStateChange();
                }}
                className={`w-full py-2 px-3 rounded-lg font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer ${
                  circuitState.wifiLedGreen
                    ? 'bg-emerald-600 text-white shadow-[0_0_14px_rgba(34,197,94,0.55)] ring-2 ring-emerald-300'
                    : 'bg-emerald-600/80 hover:bg-emerald-600 text-white/95 opacity-80'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                  LED VERDE
                </span>
                <span className="font-mono text-[10px] bg-black/20 px-1.5 py-0.5 rounded">
                  {circuitState.wifiLedGreen ? 'ON · 3.3V' : 'OFF · 0V'}
                </span>
              </button>
            </div>
          </div>

          {/* Wi-Fi AP Credentials + Group Controls */}
          <div className="flex flex-col justify-between gap-2.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-1.5">
                <span className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-[#00a8ac]" />
                  Punto de Acceso Wi-Fi (SoftAP)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                  HTTP #{circuitState.wifiRequestCount}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                <div className="bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <div className="text-[9px] text-slate-400 uppercase">Red Wi-Fi (SSID)</div>
                  <div className="text-sky-300 font-bold truncate">{circuitState.wifiSsid}</div>
                </div>
                <div className="bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <div className="text-[9px] text-slate-400 uppercase">Contraseña</div>
                  <div className="text-amber-300 font-bold">{circuitState.wifiPassword}</div>
                </div>
              </div>

              {/* Clickable GPIO probe badges */}
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                <button
                  onClick={() => onSelectPinId(28)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg px-2 py-1 text-center transition-colors"
                  title="Medir GPIO 18 en osciloscopio"
                >
                  <div className="text-[9px] font-mono text-slate-400">GPIO 18</div>
                  <div className={`text-[11px] font-mono font-bold ${circuitState.wifiLedRed ? 'text-red-400' : 'text-slate-500'}`}>
                    {circuitState.wifiLedRed ? 'HIGH' : 'LOW'}
                  </div>
                </button>
                <button
                  onClick={() => onSelectPinId(27)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg px-2 py-1 text-center transition-colors"
                  title="Medir GPIO 19 en osciloscopio"
                >
                  <div className="text-[9px] font-mono text-slate-400">GPIO 19</div>
                  <div className={`text-[11px] font-mono font-bold ${circuitState.wifiLedYellow ? 'text-amber-400' : 'text-slate-500'}`}>
                    {circuitState.wifiLedYellow ? 'HIGH' : 'LOW'}
                  </div>
                </button>
                <button
                  onClick={() => onSelectPinId(25)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg px-2 py-1 text-center transition-colors"
                  title="Medir GPIO 21 en osciloscopio"
                >
                  <div className="text-[9px] font-mono text-slate-400">GPIO 21</div>
                  <div className={`text-[11px] font-mono font-bold ${circuitState.wifiLedGreen ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {circuitState.wifiLedGreen ? 'HIGH' : 'LOW'}
                  </div>
                </button>
              </div>
            </div>

            {/* Combined Actions */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800/80">
              <button
                onClick={() => {
                  circuitSim.setAllWifiLeds(true);
                  onStateChange();
                }}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-[11px] font-bold transition-colors"
              >
                Todos ON
              </button>
              <button
                onClick={() => {
                  circuitSim.setAllWifiLeds(false);
                  onStateChange();
                }}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors"
              >
                Todos OFF
              </button>
              <button
                onClick={() => {
                  circuitSim.setWifiSequenceMode(
                    circuitState.wifiSequenceMode === 'SEMAFORO' ? 'MANUAL' : 'SEMAFORO'
                  );
                  onStateChange();
                }}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors ${
                  circuitState.wifiSequenceMode === 'SEMAFORO'
                    ? 'bg-[#00878a] text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-teal-300'
                }`}
              >
                <Play className="w-3 h-3" />
                Semáforo
              </button>
            </div>
          </div>
        </div>
      )}

      {circuitState.type === 'LDR_ANALOG' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
          {/* LDR Circuit Schematics & Values */}
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Sun className="w-4 h-4" />
                Divisor de Tensión LDR (GL5528)
              </span>
              <span className="text-[11px] font-mono text-slate-400">Pin 5 · GPIO34</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center py-1">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">Luz (Lux)</div>
                <div className="text-sm font-mono font-bold text-amber-400">{circuitState.ldrLightLux} lx</div>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">Resistencia</div>
                <div className="text-sm font-mono font-bold text-slate-200">
                  {circuitState.ldrResistance >= 1000
                    ? `${(circuitState.ldrResistance / 1000).toFixed(1)} kΩ`
                    : `${circuitState.ldrResistance} Ω`}
                </div>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">ADC (12-bit)</div>
                <div className="text-sm font-mono font-bold text-emerald-400">{circuitState.ldrRawAdc} / 4095</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400">
              Fórmula: <code className="text-amber-300 font-mono">Vout = 3.3V × [10kΩ / (R_ldr + 10kΩ)] = {circuitState.ldrVoltage}V</code>
            </div>
          </div>

          {/* Interactive flashlight slider */}
          <div className="flex flex-col gap-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800/70">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-400" />
                Intensidad lumínica sobre el sensor:
              </span>
              <span className="font-mono text-amber-400 font-bold">{circuitState.ldrLightLux} Lux</span>
            </div>

            <input
              type="range"
              min={0}
              max={1000}
              step={10}
              value={circuitState.ldrLightLux}
              aria-label="Intensidad lumínica"
              onChange={(e) => {
                circuitSim.setLdrLux(Number(e.target.value));
                onStateChange();
              }}
              className="w-full accent-amber-400 cursor-pointer h-2"
            />

            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Oscuridad (0 lx)</span>
              <span>Habitación (400 lx)</span>
              <span>Luz Solar / Linterna (1000 lx)</span>
            </div>
          </div>
        </div>
      )}

      {circuitState.type === 'GPIO2_BLINK' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
          {/* LED Visual Feedback */}
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  circuitState.ledState
                    ? 'bg-blue-500 shadow-[0_0_20px_#3b82f6] text-white scale-105'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  LED Azul en Placa (GPIO2)
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Estado: <strong className={circuitState.ledState ? 'text-blue-400' : 'text-slate-500'}>
                    {circuitState.ledState ? 'HIGH (3.3V) ENCENDIDO' : 'LOW (0V) APAGADO'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Mode selection buttons */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {(['BLINK', 'PWM', 'MANUAL'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    circuitSim.setLedMode(m);
                    onStateChange();
                  }}
                  className={`px-2 py-1 text-[11px] font-semibold rounded ${
                    circuitState.ledMode === m
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m === 'BLINK' ? 'Parpadeo' : m === 'PWM' ? 'PWM Dim' : 'Manual'}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive sliders for Blink / PWM */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/70 flex flex-col gap-2">
            {circuitState.ledMode === 'BLINK' && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Frecuencia de parpadeo:</span>
                  <span className="font-mono text-blue-400 font-bold">{circuitState.ledFrequencyHz} Hz</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={circuitState.ledFrequencyHz}
                  aria-label="Frecuencia de parpadeo"
                  onChange={(e) => {
                    circuitSim.setLedFrequency(Number(e.target.value));
                    onStateChange();
                  }}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </>
            )}

            {circuitState.ledMode === 'PWM' && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Ciclo de trabajo PWM (Duty Cycle):</span>
                  <span className="font-mono text-blue-400 font-bold">{circuitState.ledDutyCycle} %</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={circuitState.ledDutyCycle}
                  aria-label="Ciclo de trabajo PWM"
                  onChange={(e) => {
                    circuitSim.setLedDutyCycle(Number(e.target.value));
                    onStateChange();
                  }}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </>
            )}

            {circuitState.ledMode === 'MANUAL' && (
              <button
                onClick={() => {
                  circuitSim.toggleManualLed();
                  onStateChange();
                }}
                className={`w-full py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                  circuitState.ledState
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Power className="w-4 h-4" />
                {circuitState.ledState ? 'Apagar LED (digitalWrite LOW)' : 'Encender LED (digitalWrite HIGH)'}
              </button>
            )}
          </div>
        </div>
      )}

      {circuitState.type === 'BOOT_INTERRUPT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
          {/* BOOT button action */}
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
              <span>Pulsador BOOT (GPIO0)</span>
              <span className="text-[11px] font-mono text-cyan-400">Pin de Strapping</span>
            </div>

            <button
              onMouseDown={() => {
                circuitSim.setBootPressed(true);
                onStateChange();
              }}
              onMouseUp={() => {
                circuitSim.setBootPressed(false);
                onStateChange();
              }}
              onMouseLeave={() => {
                if (circuitState.bootPressed) {
                  circuitSim.setBootPressed(false);
                  onStateChange();
                }
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                circuitSim.setBootPressed(true);
                onStateChange();
              }}
              onTouchEnd={() => {
                circuitSim.setBootPressed(false);
                onStateChange();
              }}
              className={`py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                circuitState.bootPressed
                  ? 'bg-amber-500 text-slate-950 shadow-inner'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
              }`}
            >
              <Cpu className="w-4 h-4" />
              {circuitState.bootPressed ? 'Presionado (GPIO0 = 0V GND)' : 'Mantener presionado Botón BOOT'}
            </button>
          </div>

          {/* Reset button action */}
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
              <span>Pulsador EN (Hardware Reset)</span>
              <span className="text-[11px] font-mono text-emerald-400">CHIP_PU</span>
            </div>

            <button
              onClick={() => {
                circuitSim.triggerReset();
                onStateChange();
              }}
              className="py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 bg-red-950/70 hover:bg-red-900/80 text-red-200 border border-red-800/60 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${circuitState.enResetTriggered ? 'animate-spin' : ''}`} />
              {circuitState.enResetTriggered ? 'Reiniciando SoC ESP32...' : 'Pulsar EN (Reset en Frío)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
