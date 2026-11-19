export type PinFunctionCategory = 
  | 'ALL'
  | 'POWER' 
  | 'GND' 
  | 'ADC' 
  | 'DAC' 
  | 'TOUCH' 
  | 'I2C' 
  | 'SPI' 
  | 'UART' 
  | 'PWM' 
  | 'STRAPPING'
  | 'RESTRICTED';

export interface PinDefinition {
  id: number; // 1 to 38
  side: 'LEFT' | 'RIGHT';
  positionIndex: number; // 0 to 18 (top to bottom)
  label: string;
  gpio?: number;
  description: string;
  voltageNominal: number; // e.g. 3.3 or 5.0 or 0
  primaryType: 'POWER' | 'GND' | 'GPIO' | 'INPUT_ONLY' | 'FLASH_INTERNAL';
  categories: PinFunctionCategory[];
  adcChannel?: string;
  touchChannel?: string;
  dacChannel?: string;
  spiFunction?: string;
  i2cFunction?: string;
  uartFunction?: string;
  note?: string;
  isInputOnly?: boolean;
  warning?: string;
}

export interface AnatomyPart {
  id: string;
  name: string;
  subtitle: string;
  category: 'CHIP' | 'RF' | 'POWER' | 'INTERFACE' | 'MECHANICAL';
  description: string;
  specs: { [key: string]: string };
  pinConnections?: string[];
  explodedOffset: [number, number, number]; // [x, y, z] separation in exploded view
  meshTag: string;
}

export type LabMode = 'ANATOMY' | 'PINOUT' | 'CIRCUITS';

export type CircuitType = 'WIFI_3LEDS' | 'LDR_ANALOG' | 'GPIO2_BLINK' | 'BOOT_INTERRUPT';

export interface CircuitState {
  type: CircuitType;
  // Wi-Fi 3 LEDs Control Circuit (Práctica 2: GPIO18 Rojo, GPIO19 Amarillo, GPIO21 Verde)
  wifiSsid: string;
  wifiPassword: string;
  wifiIp: string;
  wifiLedRed: boolean; // GPIO 18
  wifiLedYellow: boolean; // GPIO 19
  wifiLedGreen: boolean; // GPIO 21
  wifiSequenceMode: 'MANUAL' | 'SEMAFORO';
  wifiRequestCount: number;
  
  // LDR Analog Circuit
  ldrLightLux: number; // 0 to 1000 lux
  ldrResistance: number; // Ohms
  ldrVoltage: number; // 0.0 to 3.3V
  ldrRawAdc: number; // 0 to 4095 (12-bit)
  
  // GPIO2 Blink Circuit
  ledFrequencyHz: number; // 0.5 to 10 Hz
  ledDutyCycle: number; // 0 to 100%
  ledState: boolean;
  ledMode: 'BLINK' | 'PWM' | 'MANUAL';
  
  // BOOT & EN
  bootPressed: boolean;
  enResetTriggered: boolean;
  bootModeActive: boolean;
  
  // System metrics
  cpuFreqMhz: number;
  uptimeSeconds: number;
  freeHeapBytes: number;
}
