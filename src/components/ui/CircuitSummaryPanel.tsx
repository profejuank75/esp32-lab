import React, { useState } from 'react';
import { CircuitType } from '../../types/esp32';
import {
  Cpu,
  SlidersHorizontal,
  Clock,
  Sun,
  Gauge,
  Wifi,
  Smartphone,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Cable,
  Zap,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';

interface CircuitSummaryPanelProps {
  circuitType: CircuitType;
  selectedPinId: number;
  onSelectPinId: (pinId: number) => void;
}

type SummaryTab = 'RESUMEN' | 'PINES' | 'EJEMPLO' | 'ESPECIFICACIONES';

interface BulletTip {
  icon: React.ReactNode;
  text: React.ReactNode;
}

interface PinMapping {
  pinId: number;
  espPin: string;
  target: string;
  wireLabel: string;
  dotClass: string;
}

interface CircuitDocData {
  title: string;
  description: string;
  bullets: BulletTip[];
  pins: PinMapping[];
  codeSnippet: string;
  specs: Array<{ label: string; value: string }>;
}

const CIRCUIT_DOCS: Record<CircuitType, CircuitDocData> = {
  WIFI_3LEDS: {
    title: 'CONTROL WI-FI DE 3 LEDS (PRÁCTICA 2)',
    description:
      'Circuito de robótica educativa con tres LEDs (rojo, amarillo y verde) protegidos por resistencias de 330 Ω y cátodo común a GND. El ESP32 crea la red Wi-Fi ESP32_LED_JUANK y un servidor web en 192.168.4.1 para controlarlos desde el celular.',
    bullets: [
      {
        icon: <Zap className="w-5 h-5 text-slate-600" />,
        text: (
          <span>
            Salidas digitales en{' '}
            <code className="px-1.5 py-0.5 rounded bg-slate-100 text-[#00878a] font-mono text-[11px] font-semibold">
              GPIO 18, 19 y 21
            </code>{' '}
            en serie con resistencias de 330 Ω al ánodo (+)
          </span>
        ),
      },
      {
        icon: <Wifi className="w-5 h-5 text-slate-600" />,
        text: (
          <span>
            Red Wi-Fi{' '}
            <code className="px-1.5 py-0.5 rounded bg-slate-100 text-[#00878a] font-mono text-[11px] font-semibold">
              ESP32_LED_JUANK
            </code>{' '}
            (clave <code className="font-mono font-bold text-slate-800">12345678</code>) →{' '}
            <code className="font-mono text-[#00878a] font-semibold">192.168.4.1</code>
          </span>
        ),
      },
      {
        icon: <Smartphone className="w-5 h-5 text-slate-600" />,
        text: 'Pulsa los botones del celular virtual o el modo Semáforo para encender los LEDs 3D de forma individual o conjunta',
      },
    ],
    pins: [
      { pinId: 28, espPin: 'GPIO 18 (D18)', target: 'LED rojo → Resistencia 330 Ω (ánodo +)', wireLabel: 'Rojo', dotClass: 'bg-red-500' },
      { pinId: 27, espPin: 'GPIO 19 (D19)', target: 'LED amarillo → Resistencia 330 Ω (ánodo +)', wireLabel: 'Amarillo', dotClass: 'bg-amber-400' },
      { pinId: 25, espPin: 'GPIO 21 (D21)', target: 'LED verde → Resistencia 330 Ω (ánodo +)', wireLabel: 'Verde', dotClass: 'bg-emerald-500' },
      { pinId: 26, espPin: 'GND (Pin 26)', target: 'Retorno común a todos los cátodos (−)', wireLabel: 'Negro', dotClass: 'bg-slate-800' },
    ],
    codeSnippet: `#include <WiFi.h>
#include <WebServer.h>

const char* SSID = "ESP32_LED_JUANK";
const char* PASS = "12345678";

const int LED_ROJO = 18;
const int LED_AMARILLO = 19;
const int LED_VERDE = 21;

WebServer server(80);
bool rOn = false, yOn = false, gOn = false;

void aplicarEstados() {
  digitalWrite(LED_ROJO, rOn ? HIGH : LOW);
  digitalWrite(LED_AMARILLO, yOn ? HIGH : LOW);
  digitalWrite(LED_VERDE, gOn ? HIGH : LOW);
}

void redirigirInicio() {
  server.sendHeader("Location", "/");
  server.send(303);
}

void handleRoot() {
  String html = "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'>"
    "<meta name='viewport' content='width=device-width,initial-scale=1'>"
    "<title>Control Wi-Fi ESP32</title>"
    "<style>body{font-family:sans-serif;text-align:center;padding:24px;background:#f8fafc}"
    "h2{color:#1d4ed8}a{display:block;max-width:280px;margin:12px auto;padding:16px;"
    "border-radius:12px;color:#fff;font-weight:700;text-decoration:none;font-size:18px}"
    ".r{background:#dc2626}.y{background:#eab308;color:#111}.g{background:#16a34a}"
    ".n{background:#334155;font-size:14px;padding:12px}</style></head><body>"
    "<h2>Control Wi-Fi ESP32</h2>"
    "<a class='r' href='/rojo'>LED ROJO: " + String(rOn ? "ON" : "OFF") + "</a>"
    "<a class='y' href='/amarillo'>LED AMARILLO: " + String(yOn ? "ON" : "OFF") + "</a>"
    "<a class='g' href='/verde'>LED VERDE: " + String(gOn ? "ON" : "OFF") + "</a>"
    "<a class='n' href='/todos_on'>ENCENDER TODOS</a>"
    "<a class='n' href='/todos_off'>APAGAR TODOS</a>"
    "</body></html>";
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
  Serial.print("Red Wi-Fi activa. IP: http://");
  Serial.println(WiFi.softAPIP()); // 192.168.4.1

  server.on("/", handleRoot);
  server.on("/rojo", []() { rOn = !rOn; aplicarEstados(); redirigirInicio(); });
  server.on("/amarillo", []() { yOn = !yOn; aplicarEstados(); redirigirInicio(); });
  server.on("/verde", []() { gOn = !gOn; aplicarEstados(); redirigirInicio(); });
  server.on("/todos_on", []() { rOn = yOn = gOn = true; aplicarEstados(); redirigirInicio(); });
  server.on("/todos_off", []() { rOn = yOn = gOn = false; aplicarEstados(); redirigirInicio(); });
  server.begin();
}

void loop() {
  server.handleClient();
}`,
    specs: [
      { label: 'Red Wi-Fi (SoftAP)', value: 'ESP32_LED_JUANK (Clave: 12345678)' },
      { label: 'Servidor Web', value: 'http://192.168.4.1 (Puerto 80)' },
      { label: 'Pines Salida', value: 'GPIO 18 (Rojo), 19 (Amarillo), 21 (Verde)' },
      { label: 'Resistencias', value: '3 × 330 Ω ¼W (Naranja-Naranja-Marrón)' },
      { label: 'Retorno Común', value: 'Todos los cátodos (−) al riel GND' },
    ],
  },
  LDR_ANALOG: {
    title: 'SENSOR DE LUZ ANALÓGICO (LDR)',
    description:
      'Divisor de tensión formado por una fotorresistencia GL5528 y una resistencia fija de 10 kΩ. Al variar la luz incidente cambia la resistencia del LDR, generando un voltaje continuo entre 0V y 3.3V medido por el ADC1 de 12 bits.',
    bullets: [
      {
        icon: <Gauge className="w-5 h-5 text-slate-600" />,
        text: (
          <span>
            Lectura analógica 12-bit con{' '}
            <code className="px-1.5 py-0.5 rounded bg-slate-100 text-[#00878a] font-mono text-[11px] font-semibold">
              analogRead(34)
            </code>
          </span>
        ),
      },
      {
        icon: <SlidersHorizontal className="w-5 h-5 text-slate-600" />,
        text: 'Resistencia de 10 kΩ conectada a GND para formar el divisor de voltaje proporcional',
      },
      {
        icon: <Sun className="w-5 h-5 text-slate-600" />,
        text: 'Desliza la intensidad lumínica (Lux) para observar la respuesta en el sensor 3D y el voltaje',
      },
    ],
    pins: [
      { pinId: 1, espPin: '3V3 (Pin 1)', target: 'Terminal superior LDR GL5528', wireLabel: 'Rojo', dotClass: 'bg-red-500' },
      { pinId: 5, espPin: 'GPIO34 (D34)', target: 'Nodo divisor (LDR + R 10kΩ)', wireLabel: 'Naranja', dotClass: 'bg-orange-500' },
      { pinId: 14, espPin: 'GND (Pin 14)', target: 'Terminal inferior R 10 kΩ', wireLabel: 'Negro', dotClass: 'bg-slate-800' },
    ],
    codeSnippet: `#define LDR_PIN 34

void setup() {
  Serial.begin(115200);
  analogSetAttenuation(ADC_11db); // Rango 0 - 3.3V
}

void loop() {
  int raw = analogRead(LDR_PIN); // 0 a 4095
  float volt = (raw * 3.3) / 4095.0;
  Serial.printf("ADC: %d | Vout: %.2f V\\n", raw, volt);
  delay(250);
}`,
    specs: [
      { label: 'Fotorresistencia', value: 'GL5528 CdS (~1 kΩ a 100 kΩ)' },
      { label: 'Resistencia Divisor', value: '10 kΩ (Marrón-Negro-Naranja)' },
      { label: 'Canal ADC ESP32', value: 'ADC1_CH6 en GPIO34 (Solo Entrada)' },
      { label: 'Resolución', value: '12 bits (4096 niveles, 0.8 mV/paso)' },
    ],
  },
  GPIO2_BLINK: {
    title: 'HAZ PARPADEAR UN LED',
    description:
      'Tu circuito fundamental: un LED azul de 5 mm y una resistencia limitadora de 220 Ω en protoboard, controlados por el pin GPIO2. Encender y apagar el pin con una pausa o modulación PWM regula su brillo y parpadeo.',
    bullets: [
      {
        icon: <Cpu className="w-5 h-5 text-slate-600" />,
        text: (
          <span>
            Salida digital con{' '}
            <code className="px-1.5 py-0.5 rounded bg-slate-100 text-[#00878a] font-mono text-[11px] font-semibold">
              digitalWrite(2, HIGH)
            </code>
          </span>
        ),
      },
      {
        icon: <Zap className="w-5 h-5 text-slate-600" />,
        text: 'Resistencia de 220 Ω en serie para limitar la corriente del GPIO a ~6 mA seguros',
      },
      {
        icon: <Clock className="w-5 h-5 text-slate-600" />,
        text: 'Cambia entre modo Parpadeo, PWM Dim o Manual y observa el LED 3D y el osciloscopio',
      },
    ],
    pins: [
      { pinId: 33, espPin: 'GPIO2 (D2)', target: 'R 220 Ω → Ánodo LED (+)', wireLabel: 'Azul', dotClass: 'bg-blue-500' },
      { pinId: 26, espPin: 'GND (Pin 26)', target: 'Cátodo LED (−)', wireLabel: 'Negro', dotClass: 'bg-slate-800' },
    ],
    codeSnippet: `#define LED_PIN 2

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH); // 3.3V Encendido
  delay(500);
  digitalWrite(LED_PIN, LOW);  // 0.0V Apagado
  delay(500);
}`,
    specs: [
      { label: 'Pin Control', value: 'GPIO2 (Enlazado al LED azul SMD)' },
      { label: 'Resistencia Serie', value: '220 Ω ¼W (Rojo-Rojo-Marrón)' },
      { label: 'Voltaje Lógico', value: '3.3V HIGH / 0V LOW' },
      { label: 'Corriente LED', value: '~5.5 mA (I_max GPIO = 40 mA)' },
    ],
  },
  BOOT_INTERRUPT: {
    title: 'BOTONES BOOT (GPIO0) Y RESET (EN)',
    description:
      'Circuito de arranque y reinicio por hardware. El pulsador conectado al pin EN (CHIP_PU) deriva la línea a GND para reiniciar el microcontrolador, mientras que GPIO0 selecciona el modo de ejecución o descarga de firmware.',
    bullets: [
      {
        icon: <RefreshCw className="w-5 h-5 text-slate-600" />,
        text: (
          <span>
            Reinicio en frío llevando{' '}
            <code className="px-1.5 py-0.5 rounded bg-slate-100 text-[#00878a] font-mono text-[11px] font-semibold">
              EN / CHIP_PU
            </code>{' '}
            a nivel BAJO (0V)
          </span>
        ),
      },
      {
        icon: <ShieldAlert className="w-5 h-5 text-slate-600" />,
        text: 'Mantener BOOT (GPIO0) presionado durante el reset activa el Bootloader ROM UART',
      },
      {
        icon: <Clock className="w-5 h-5 text-slate-600" />,
        text: 'Prueba pulsar BOOT y EN para ver la depresión física en el modelo 3D y el pulso en EN',
      },
    ],
    pins: [
      { pinId: 2, espPin: 'EN (Pin 2)', target: 'Pulsador táctil Reset → GND', wireLabel: 'Verde', dotClass: 'bg-emerald-500' },
      { pinId: 20, espPin: 'GND (Pin 20)', target: 'Referencia común 0V', wireLabel: 'Negro', dotClass: 'bg-slate-800' },
      { pinId: 1, espPin: '3V3 (Pin 1)', target: 'R 220 Ω → LED Estado', wireLabel: 'Ámbar', dotClass: 'bg-amber-500' },
    ],
    codeSnippet: `#define BOOT_PIN 0
#define LED_PIN  2

volatile bool bootEvento = false;
volatile unsigned long ultimaInterrupcion = 0;

void IRAM_ATTR onBootButton() {
  unsigned long ahora = millis();
  if (ahora - ultimaInterrupcion > 200) { // Antirrebote 200 ms
    bootEvento = true;
    ultimaInterrupcion = ahora;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(BOOT_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  attachInterrupt(digitalPinToInterrupt(BOOT_PIN), onBootButton, FALLING);
  Serial.println("Listo. Pulsa BOOT (GPIO0) para generar interrupcion.");
}

void loop() {
  if (bootEvento) {
    bootEvento = false;
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    Serial.println("[ISR] Boton BOOT presionado (flanco de bajada).");
  }
}`,
    specs: [
      { label: 'Pin Habilitación', value: 'EN (CHIP_PU) Pull-Up 10 kΩ interno' },
      { label: 'Pin Strapping', value: 'GPIO0 (HIGH = Flash, LOW = UART Boot)' },
      { label: 'Filtro RC', value: 'Condensador de debounce ~1 µF' },
      { label: 'LED Estado', value: 'Ámbar 5 mm con R limitadora 220 Ω' },
    ],
  },
};

export const CircuitSummaryPanel: React.FC<CircuitSummaryPanelProps> = ({
  circuitType,
  selectedPinId,
  onSelectPinId,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SummaryTab>('RESUMEN');
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const doc = CIRCUIT_DOCS[circuitType];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(doc.codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* Top 4 Underlined Tabs (Matches Reference Screenshot) */}
      <div className="border-b border-slate-200/80 px-3 sm:px-4 flex items-center justify-between bg-slate-50/50 overflow-x-auto">
        {(['RESUMEN', 'PINES', 'EJEMPLO', 'ESPECIFICACIONES'] as SummaryTab[]).map((tab) => {
          const isActive = activeSubTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`py-2.5 px-2 text-[11px] font-bold tracking-wider uppercase border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Inner Framed Content Card */}
      <div className="p-3 sm:p-4">
        <div
          className={`border border-slate-200/90 rounded-xl p-3.5 sm:p-4 bg-white flex flex-col gap-3 transition-all ${
            isExpanded ? 'max-h-[520px] overflow-y-auto' : 'max-h-[290px] overflow-y-auto'
          }`}
        >
          {/* TAB 1: RESUMEN */}
          {activeSubTab === 'RESUMEN' && (
            <>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase">
                  {doc.title}
                </h3>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                  title={isExpanded ? 'Contraer tarjeta' : 'Expandir tarjeta'}
                >
                  {isExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {doc.description}
              </p>

              {/* 3 Icon-Box Educational Rows matching the screenshot */}
              <div className="flex flex-col gap-2.5 pt-1">
                {doc.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-center shrink-0 shadow-2xs">
                      {bullet.icon}
                    </div>
                    <div className="text-xs text-slate-700 leading-snug font-medium">
                      {bullet.text}
                    </div>
                  </div>
                ))}
              </div>

              {circuitType === 'WIFI_3LEDS' && (
                <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Diagrama simplificado (GPIO → 330 Ω → LED → GND)
                  </div>
                  <svg viewBox="0 0 320 112" className="w-full h-24" aria-label="Diagrama simplificado de 3 LEDs con resistencias de 330 Ohm a GND">
                    {[
                      { x: 52, label: 'GPIO 18', fill: '#ef4444', stroke: '#b91c1c' },
                      { x: 148, label: 'GPIO 19', fill: '#facc15', stroke: '#a16207' },
                      { x: 244, label: 'GPIO 21', fill: '#22c55e', stroke: '#15803d' },
                    ].map((branch) => (
                      <g key={branch.label}>
                        <text x={branch.x} y="14" textAnchor="middle" className="fill-slate-800 text-[10px] font-bold font-mono">
                          {branch.label}
                        </text>
                        <line x1={branch.x} y1="19" x2={branch.x} y2="27" stroke="#0f172a" strokeWidth="1.8" />
                        <polyline
                          points={`${branch.x},27 ${branch.x - 5},31 ${branch.x + 5},36 ${branch.x - 5},41 ${branch.x + 5},46 ${branch.x - 5},51 ${branch.x},55`}
                          fill="none"
                          stroke="#0f172a"
                          strokeWidth="1.8"
                        />
                        <text x={branch.x + 9} y="44" className="fill-slate-600 text-[9px] font-mono font-semibold">
                          330 Ω
                        </text>
                        <line x1={branch.x} y1="55" x2={branch.x} y2="63" stroke="#0f172a" strokeWidth="1.8" />
                        <path
                          d={`M ${branch.x - 8} 76 L ${branch.x - 8} 70 A 8 8 0 0 1 ${branch.x + 8} 70 L ${branch.x + 8} 76 Z`}
                          fill={branch.fill}
                          stroke={branch.stroke}
                          strokeWidth="1.5"
                        />
                        <line x1={branch.x} y1="76" x2={branch.x} y2="90" stroke="#0f172a" strokeWidth="1.8" />
                      </g>
                    ))}
                    <line x1="52" y1="90" x2="288" y2="90" stroke="#0f172a" strokeWidth="2" />
                    <line x1="288" y1="90" x2="288" y2="98" stroke="#0f172a" strokeWidth="2" />
                    <line x1="274" y1="98" x2="302" y2="98" stroke="#0f172a" strokeWidth="2" />
                    <line x1="279" y1="103" x2="297" y2="103" stroke="#0f172a" strokeWidth="1.8" />
                    <line x1="284" y1="108" x2="292" y2="108" stroke="#0f172a" strokeWidth="1.6" />
                    <text x="266" y="108" textAnchor="end" className="fill-slate-800 text-[9px] font-bold font-mono">
                      GND
                    </text>
                  </svg>
                </div>
              )}
            </>
          )}

          {/* TAB 2: PINES (Interactive Pin Connections) */}
          {activeSubTab === 'PINES' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 uppercase flex items-center gap-1.5">
                  <Cable className="w-4 h-4 text-[#00878a]" />
                  Conexiones Físicas del Circuito
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Clic para medir señal
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {doc.pins.map((p) => {
                  const isSelected = selectedPinId === p.pinId;
                  return (
                    <button
                      key={`${p.pinId}_${p.target}`}
                      onClick={() => onSelectPinId(p.pinId)}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-teal-50 border-[#00878a] ring-1 ring-[#00878a]/30'
                          : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-3 h-3 rounded-full shrink-0 ${p.dotClass}`} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-mono font-bold text-slate-900 truncate">
                            {p.espPin}
                          </span>
                          <span className="text-[11px] text-slate-600 truncate">
                            {p.target}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono font-semibold text-slate-600 shrink-0">
                        Cable {p.wireLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: EJEMPLO (Arduino C++ Snippet) */}
          {activeSubTab === 'EJEMPLO' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 uppercase">
                  Código Arduino C++
                </span>
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] leading-relaxed rounded-xl overflow-x-auto border border-slate-800">
                {doc.codeSnippet}
              </pre>
            </div>
          )}

          {/* TAB 4: ESPECIFICACIONES */}
          {activeSubTab === 'ESPECIFICACIONES' && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-extrabold text-slate-900 uppercase">
                Parámetros Eléctricos y Hardware
              </span>
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
                {doc.specs.map((s) => (
                  <div
                    key={s.label}
                    className="px-3 py-2 flex items-center justify-between gap-3 bg-slate-50/40 text-xs"
                  >
                    <span className="font-semibold text-slate-600">{s.label}</span>
                    <span className="font-mono font-bold text-slate-900 text-right">
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
