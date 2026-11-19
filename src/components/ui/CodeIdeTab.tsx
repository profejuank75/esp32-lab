import React, { useState, useEffect, useRef } from 'react';
import { CircuitState } from '../../types/esp32';
import { circuitSim } from '../../services/circuitSimulator';
import {
  Play,
  UploadCloud,
  Terminal,
  Trash2,
  Send,
} from 'lucide-react';

interface CodeIdeTabProps {
  circuitState: CircuitState;
  onStateChange: () => void;
}

const SKETCHES = {
  blink: {
    name: '01_Blink_GPIO2.ino',
    desc: 'Control del LED azul integrado en GPIO2 con temporización por milisegundos.',
    code: `// ESP32 NodeMCU DevKit V1 - Ejemplo Blink
// LED azul integrado en el pin GPIO2 (D2)

#define LED_PIN 2

void setup() {
  // Inicializar comunicación serie a 115200 baudios
  Serial.begin(115200);
  delay(500);
  Serial.println("\\n[BOOT] ESP32 DevKit V1 iniciado correctamente.");
  Serial.println("[INFO] CPU Frequency: 240 MHz Dual-Core");

  // Configurar GPIO2 como salida digital
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  // Encender LED (Nivel ALTO 3.3V)
  digitalWrite(LED_PIN, HIGH);
  Serial.println("[GPIO2] LED State: HIGH (3.3V)");
  delay(1000);

  // Apagar LED (Nivel BAJO 0V)
  digitalWrite(LED_PIN, LOW);
  Serial.println("[GPIO2] LED State: LOW (0.0V)");
  delay(1000);
}
`,
  },
  ldr: {
    name: '02_Lectura_LDR_ADC1.ino',
    desc: 'Lectura analógica de fotorresistencia en GPIO34 con ADC de 12 bits (0-4095).',
    code: `// ESP32 NodeMCU DevKit V1 - Lectura Analógica LDR
// Pin de entrada: GPIO34 (ADC1_CH6) - Solo entrada analógica

#define LDR_PIN 34
const float V_REF = 3.3;  // Voltaje nominal ESP32
const int ADC_RES = 4095; // Resolución ADC 12 bits

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("[BOOT] Inicializando Conversor ADC1 en GPIO34...");
  analogReadResolution(12);
  // Atenuación de 11dB para rango completo 0 - 3.3V
  analogSetAttenuation(ADC_11db);
}

void loop() {
  // Leer valor digital en bruto (0 a 4095)
  int rawValue = analogRead(LDR_PIN);

  // Convertir a voltaje medido
  float voltage = (rawValue * V_REF) / ADC_RES;

  // Estimación aproximada de lux
  float lux = (voltage / 3.3) * 1000.0;

  Serial.printf("[ADC1] Raw: %4d | Voltaje: %.2f V | Luz: %.0f Lux\\n",
                rawValue, voltage, lux);
  delay(500);
}
`,
  },
  wifi3leds: {
    name: '03_Control_WiFi_3LEDs.ino',
    desc: 'Práctica 2: Servidor web Wi-Fi (192.168.4.1) controlando 3 LEDs en GPIO 18, 19 y 21.',
    code: `// PRÁCTICA 2 - ROBÓTICA EDUCATIVA CON ESP32
// Control de 3 LEDs (Rojo, Amarillo, Verde) por Wi-Fi desde el celular
// GPIO 18 -> R 330 Ohm -> LED Rojo
// GPIO 19 -> R 330 Ohm -> LED Amarillo
// GPIO 21 -> R 330 Ohm -> LED Verde
// GND     -> Retorno común a todos los cátodos (-)

#include <WiFi.h>
#include <WebServer.h>

const char* SSID = "ESP32_LED_JUANK";
const char* PASS = "12345678";

const int LED_ROJO = 18;
const int LED_AMARILLO = 19;
const int LED_VERDE = 21;

WebServer server(80);
bool rojo = false, amarillo = false, verde = false;

void aplicarEstados() {
  digitalWrite(LED_ROJO, rojo ? HIGH : LOW);
  digitalWrite(LED_AMARILLO, amarillo ? HIGH : LOW);
  digitalWrite(LED_VERDE, verde ? HIGH : LOW);
}

void redirigirInicio() {
  server.sendHeader("Location", "/");
  server.send(303);
}

void enviarPagina() {
  String html = "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'>";
  html += "<meta name='viewport' content='width=device-width,initial-scale=1'>";
  html += "<title>Control Wi-Fi ESP32</title>";
  html += "<style>body{font-family:sans-serif;text-align:center;padding:24px;background:#f8fafc}";
  html += "h2{color:#1d4ed8}a{display:block;max-width:280px;margin:12px auto;padding:16px;";
  html += "border-radius:12px;color:#fff;font-weight:700;text-decoration:none;font-size:18px}";
  html += ".r{background:#dc2626}.y{background:#eab308;color:#111}.g{background:#16a34a}";
  html += ".n{background:#334155;font-size:14px;padding:12px}</style></head><body>";
  html += "<h2>Control Wi-Fi ESP32</h2>";
  html += "<a class='r' href='/rojo'>LED ROJO: " + String(rojo ? "ON" : "OFF") + "</a>";
  html += "<a class='y' href='/amarillo'>LED AMARILLO: " + String(amarillo ? "ON" : "OFF") + "</a>";
  html += "<a class='g' href='/verde'>LED VERDE: " + String(verde ? "ON" : "OFF") + "</a>";
  html += "<a class='n' href='/todos_on'>ENCENDER TODOS</a>";
  html += "<a class='n' href='/todos_off'>APAGAR TODOS</a>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_ROJO, OUTPUT);
  pinMode(LED_AMARILLO, OUTPUT);
  pinMode(LED_VERDE, OUTPUT);
  aplicarEstados();

  WiFi.mode(WIFI_AP);
  WiFi.softAP(SSID, PASS);
  Serial.print("[Wi-Fi] Red activa: ");
  Serial.print(SSID);
  Serial.print(" | IP: http://");
  Serial.println(WiFi.softAPIP()); // http://192.168.4.1

  server.on("/", enviarPagina);
  server.on("/rojo", []() { rojo = !rojo; aplicarEstados(); redirigirInicio(); });
  server.on("/amarillo", []() { amarillo = !amarillo; aplicarEstados(); redirigirInicio(); });
  server.on("/verde", []() { verde = !verde; aplicarEstados(); redirigirInicio(); });
  server.on("/todos_on", []() { rojo = amarillo = verde = true; aplicarEstados(); redirigirInicio(); });
  server.on("/todos_off", []() { rojo = amarillo = verde = false; aplicarEstados(); redirigirInicio(); });
  server.begin();
}

void loop() {
  server.handleClient();
}
`,
  },
};

export const CodeIdeTab: React.FC<CodeIdeTabProps> = ({
  circuitState,
  onStateChange,
}) => {
  const [selectedSketchKey, setSelectedSketchKey] = useState<keyof typeof SKETCHES>('blink');
  const [code, setCode] = useState<string>(SKETCHES.blink.code);
  const [compileStatus, setCompileStatus] = useState<'idle' | 'compiling' | 'success'>('idle');
  const [serialLogs, setSerialLogs] = useState<string[]>([
    '[INIT] ESP32 Serial Monitor conectado a COM3 @ 115200 baudios.',
    '[READY] CPU0 & CPU1 inicializados a 240 MHz.',
  ]);
  const [serialInput, setSerialInput] = useState<string>('');
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  const handleSelectSketch = (key: keyof typeof SKETCHES) => {
    setSelectedSketchKey(key);
    setCode(SKETCHES[key].code);
    if (key === 'blink') circuitSim.setCircuitType('GPIO2_BLINK');
    if (key === 'ldr') circuitSim.setCircuitType('LDR_ANALOG');
    if (key === 'wifi3leds') circuitSim.setCircuitType('WIFI_3LEDS');
    onStateChange();
  };

  const handleCompile = () => {
    setCompileStatus('compiling');
    setTimeout(() => {
      setCompileStatus('success');
      setSerialLogs((prev) => [
        ...prev,
        `[BUILD] Compilación completada con éxito.`,
        `  -> Flash utilizada: 184,320 bytes (4% del total de 4MB).`,
        `  -> RAM utilizada: 12,450 bytes (2% del total de 520KB).`,
      ]);
      setTimeout(() => setCompileStatus('idle'), 3000);
    }, 700);
  };

  const handleUpload = () => {
    setCompileStatus('compiling');
    setSerialLogs((prev) => [
      ...prev,
      `[FLASH] Conectando con chip ESP32 por CP2102 en COM3...`,
      `[FLASH] Chip ID: ESP32-D0WDQ6 (revision 1)`,
      `[FLASH] Escribiendo en 0x00010000... 100% OK!`,
      `[BOOT] Reiniciando SoC... Ejecutando código.`,
    ]);
    setTimeout(() => {
      setCompileStatus('success');
      setTimeout(() => setCompileStatus('idle'), 2500);
    }, 900);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const timestamp = new Date().toLocaleTimeString();
      let log = '';
      if (circuitState.type === 'LDR_ANALOG') {
        log = `[${timestamp}] [ADC1 GPIO34] Raw: ${circuitState.ldrRawAdc} | V: ${circuitState.ldrVoltage}V | Luz: ${circuitState.ldrLightLux} lx`;
      } else if (circuitState.type === 'WIFI_3LEDS') {
        log = `[${timestamp}] [Wi-Fi ${circuitState.wifiIp}] ROJO(18): ${circuitState.wifiLedRed ? 'ON' : 'OFF'} | AMARILLO(19): ${circuitState.wifiLedYellow ? 'ON' : 'OFF'} | VERDE(21): ${circuitState.wifiLedGreen ? 'ON' : 'OFF'}`;
      } else {
        log = `[${timestamp}] [GPIO2] LED State: ${circuitState.ledState ? 'HIGH (1)' : 'LOW (0)'}`;
      }

      setSerialLogs((prev) => [...prev.slice(-30), log]);
    }, 2000);

    return () => clearInterval(interval);
  }, [circuitState]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [serialLogs]);

  const handleSendSerial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialInput.trim()) return;
    const cmd = serialInput.trim();
    setSerialLogs((prev) => [...prev, `> ${cmd}`]);

    if (cmd.toUpperCase() === 'LED ON') {
      circuitSim.setLedMode('MANUAL');
      if (!circuitState.ledState) circuitSim.toggleManualLed();
      onStateChange();
      setSerialLogs((prev) => [...prev, `[CMD] GPIO2 establecido en HIGH.`]);
    } else if (cmd.toUpperCase() === 'LED OFF') {
      circuitSim.setLedMode('MANUAL');
      if (circuitState.ledState) circuitSim.toggleManualLed();
      onStateChange();
      setSerialLogs((prev) => [...prev, `[CMD] GPIO2 establecido en LOW.`]);
    } else if (cmd.toUpperCase() === 'RESET') {
      circuitSim.triggerReset();
      onStateChange();
      setSerialLogs((prev) => [...prev, `[CMD] Reinicio por software ejecutado.`]);
    } else if (cmd.toUpperCase() === 'STATUS') {
      setSerialLogs((prev) => [
        ...prev,
        `[STATUS] Freq: 240MHz | Uptime: ${Math.round(circuitState.uptimeSeconds)}s | Heap: ${circuitState.freeHeapBytes} bytes`,
      ]);
    } else {
      setSerialLogs((prev) => [
        ...prev,
        `[INFO] Comando: "${cmd}". Disponibles: LED ON, LED OFF, STATUS, RESET.`,
      ]);
    }
    setSerialInput('');
  };

  return (
    <div className="flex-1 h-full flex flex-col lg:flex-row bg-slate-900 overflow-hidden text-slate-100 pb-20 lg:pb-0">
      {/* Code Editor */}
      <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 min-h-[300px]">
        {/* Editor Toolbar */}
        <div className="min-h-[48px] bg-slate-950 border-b border-slate-800 px-3 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {(Object.keys(SKETCHES) as Array<keyof typeof SKETCHES>).map((key) => (
              <button
                key={key}
                onClick={() => handleSelectSketch(key)}
                className={`min-h-[34px] px-2.5 py-1 rounded-md text-[11px] font-mono font-medium whitespace-nowrap transition-colors ${
                  selectedSketchKey === key
                    ? 'bg-[#00878a] text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {SKETCHES[key].name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCompile}
              disabled={compileStatus === 'compiling'}
              className="min-h-[34px] px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors"
              title="Compilar"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Compilar</span>
            </button>

            <button
              onClick={handleUpload}
              disabled={compileStatus === 'compiling'}
              className="min-h-[34px] px-3 py-1 text-xs font-bold rounded-md bg-[#00878a] hover:bg-[#007073] text-white flex items-center gap-1 transition-colors shadow-xs"
              title="Subir a ESP32"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Subir</span>
            </button>
          </div>
        </div>

        {/* Code Textarea */}
        <div className="flex-1 flex font-mono text-xs overflow-auto bg-[#0d1117] p-3 sm:p-4 leading-relaxed">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="w-full h-full min-h-[220px] bg-transparent resize-none outline-none text-slate-200 font-mono text-xs leading-5"
          />
        </div>
      </div>

      {/* Serial Monitor Terminal */}
      <div className="w-full lg:w-[420px] bg-slate-950 flex flex-col h-64 lg:h-full border-t lg:border-t-0 border-slate-800 shrink-0">
        <div className="min-h-[44px] bg-slate-900 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-200">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="truncate">Monitor Serial (COM3 @ 115200)</span>
          </div>

          <button
            onClick={() => setSerialLogs([])}
            className="min-h-[36px] min-w-[36px] p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
            title="Limpiar terminal"
            aria-label="Limpiar terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-5 text-emerald-400/90 flex flex-col gap-1">
          {serialLogs.map((log, idx) => (
            <div key={idx} className="whitespace-pre-wrap break-all">
              {log}
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        <form onSubmit={handleSendSerial} className="p-2 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={serialInput}
            onChange={(e) => setSerialInput(e.target.value)}
            placeholder="Comando (ej. LED ON, STATUS)..."
            className="flex-1 min-h-[40px] bg-slate-900 border border-slate-700 rounded-md px-3 py-1 text-xs text-slate-200 font-mono outline-none focus:border-[#00878a]"
          />
          <button
            type="submit"
            className="min-h-[40px] px-3.5 bg-[#00878a] hover:bg-[#007073] text-white rounded-md text-xs font-bold flex items-center gap-1 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
