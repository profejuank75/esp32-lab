import React from 'react';
import { X, FileText, Download, Check, Cpu, Wifi, Zap, Activity } from 'lucide-react';
import { ESP32_PINS } from '../../data/esp32Data';

interface DatasheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatasheetModal: React.FC<DatasheetModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00878a] text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#00878a]">
                FICHA TÉCNICA OFICIAL ESPRESSIF / NODEMCU
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">
                ESP32 NodeMCU DevKit V1 (38 Pines)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const text = `ESP32 NodeMCU DevKit V1 (38 Pines)\nProcesador: Dual-Core Xtensa 32-bit LX6 @ 240 MHz\nFlash: 4 MB SPI\nSRAM: 520 KB\nWi-Fi: 802.11 b/g/n\nBluetooth: v4.2 BR/EDR + BLE\nPines: 38 (2 filas de 19)`;
                const blob = new Blob([text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'ESP32_DevKit_V1_Datasheet.txt';
                a.click();
              }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 text-sm">
          {/* Key specs grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#00878a]">
                <Cpu className="w-4 h-4" /> Microcontrolador
              </div>
              <div className="text-sm font-bold text-slate-900">Xtensa LX6 Dual-Core</div>
              <div className="text-xs text-slate-500">240 MHz · 600 DMIPS</div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <Wifi className="w-4 h-4" /> Conectividad RF
              </div>
              <div className="text-sm font-bold text-slate-900">Wi-Fi & Bluetooth</div>
              <div className="text-xs text-slate-500">802.11 b/g/n + BLE 4.2</div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600">
                <Zap className="w-4 h-4" /> Alimentación
              </div>
              <div className="text-sm font-bold text-slate-900">3.3V / 5.0V USB</div>
              <div className="text-xs text-slate-500">Regulador AMS1117 (800mA)</div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                <Activity className="w-4 h-4" /> Periféricos I/O
              </div>
              <div className="text-sm font-bold text-slate-900">38 Pines Totales</div>
              <div className="text-xs text-slate-500">18 ADC, 2 DAC, 10 Touch</div>
            </div>
          </div>

          {/* Detailed table */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
              Tabla Completa de Pines (Pinout Matrix)
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Pin</th>
                    <th className="p-2.5">Etiqueta</th>
                    <th className="p-2.5">GPIO</th>
                    <th className="p-2.5">Tipo</th>
                    <th className="p-2.5">Funciones Alternativas</th>
                    <th className="p-2.5">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {ESP32_PINS.slice(0, 19).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-[#00878a]">{p.id}</td>
                      <td className="p-2 font-bold text-slate-900">{p.label}</td>
                      <td className="p-2 text-slate-600">{p.gpio ? `GPIO${p.gpio}` : '-'}</td>
                      <td className="p-2 font-sans text-slate-600">{p.primaryType}</td>
                      <td className="p-2 text-slate-500">
                        {[p.adcChannel, p.touchChannel, p.dacChannel, p.spiFunction, p.i2cFunction]
                          .filter(Boolean)
                          .join(', ') || '-'}
                      </td>
                      <td className="p-2 font-sans text-slate-500 text-[11px]">{p.warning || p.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
