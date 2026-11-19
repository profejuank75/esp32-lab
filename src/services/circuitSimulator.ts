import { CircuitState, CircuitType } from '../types/esp32';

export interface SignalSample {
  timestamp: number;
  voltage: number;
  logicLevel: 0 | 1;
}

export class CircuitSimulator {
  private state: CircuitState;
  private signalBuffers: Map<number, SignalSample[]> = new Map();
  private maxBufferSize = 120;
  private simulationClock = 0;
  private lastTickTime = performance.now();

  constructor() {
    this.state = {
      type: 'WIFI_3LEDS',
      wifiSsid: 'ESP32_LED_JUANK',
      wifiPassword: '12345678',
      wifiIp: '192.168.4.1',
      wifiLedRed: true,
      wifiLedYellow: false,
      wifiLedGreen: false,
      wifiSequenceMode: 'MANUAL',
      wifiRequestCount: 1,

      ldrLightLux: 450,
      ldrResistance: 4800,
      ldrVoltage: 2.22,
      ldrRawAdc: 2755,

      ledFrequencyHz: 2.0,
      ledDutyCycle: 50,
      ledState: false,
      ledMode: 'BLINK',

      bootPressed: false,
      enResetTriggered: false,
      bootModeActive: false,

      cpuFreqMhz: 240,
      uptimeSeconds: 0,
      freeHeapBytes: 284920,
    };

    // Initialize buffers for active pins (Pin IDs: 28=GPIO18, 27=GPIO19, 25=GPIO21, 33=GPIO2, 5=GPIO34, 2=EN)
    [28, 27, 25, 33, 5, 2, 26].forEach((pinId) => {
      this.signalBuffers.set(pinId, []);
    });
  }

  public getState(): CircuitState {
    return { ...this.state };
  }

  public setCircuitType(type: CircuitType) {
    this.state.type = type;
  }

  public toggleWifiLed(color: 'RED' | 'YELLOW' | 'GREEN') {
    this.state.wifiSequenceMode = 'MANUAL';
    if (color === 'RED') this.state.wifiLedRed = !this.state.wifiLedRed;
    if (color === 'YELLOW') this.state.wifiLedYellow = !this.state.wifiLedYellow;
    if (color === 'GREEN') this.state.wifiLedGreen = !this.state.wifiLedGreen;
    this.state.wifiRequestCount += 1;
  }

  public setAllWifiLeds(enabled: boolean) {
    this.state.wifiSequenceMode = 'MANUAL';
    this.state.wifiLedRed = enabled;
    this.state.wifiLedYellow = enabled;
    this.state.wifiLedGreen = enabled;
    this.state.wifiRequestCount += 1;
  }

  public setWifiSequenceMode(mode: 'MANUAL' | 'SEMAFORO') {
    this.state.wifiSequenceMode = mode;
    this.state.wifiRequestCount += 1;
  }

  public setLdrLux(lux: number) {
    this.state.ldrLightLux = Math.max(0, Math.min(1000, lux));
    const rLdr = 500000 / (this.state.ldrLightLux * 2 + 10);
    const rFixed = 10000;
    const vOut = 3.3 * (rFixed / (rLdr + rFixed));
    const adcRaw = Math.round((vOut / 3.3) * 4095);

    this.state.ldrResistance = Math.round(rLdr);
    this.state.ldrVoltage = Number(vOut.toFixed(2));
    this.state.ldrRawAdc = adcRaw;
  }

  public setLedMode(mode: 'BLINK' | 'PWM' | 'MANUAL') {
    this.state.ledMode = mode;
  }

  public setLedFrequency(hz: number) {
    this.state.ledFrequencyHz = Math.max(0.2, Math.min(20, hz));
  }

  public setLedDutyCycle(duty: number) {
    this.state.ledDutyCycle = Math.max(0, Math.min(100, duty));
  }

  public toggleManualLed() {
    this.state.ledState = !this.state.ledState;
  }

  public setBootPressed(pressed: boolean) {
    this.state.bootPressed = pressed;
    if (pressed && this.state.enResetTriggered) {
      this.state.bootModeActive = true;
    }
  }

  public triggerReset() {
    this.state.enResetTriggered = true;
    this.state.uptimeSeconds = 0;
    this.state.wifiRequestCount = 0;
    setTimeout(() => {
      this.state.enResetTriggered = false;
      if (this.state.bootPressed) {
        this.state.bootModeActive = true;
      } else {
        this.state.bootModeActive = false;
      }
    }, 400);
  }

  public tick(): { ledActive: boolean; currentPinVoltages: Map<number, number> } {
    const now = performance.now();
    const dt = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;
    this.simulationClock += dt;
    this.state.uptimeSeconds += dt;

    // 1. Wi-Fi 3 LEDs Sequence Mode (Semáforo automático)
    if (
      this.state.type === 'WIFI_3LEDS' &&
      this.state.wifiSequenceMode === 'SEMAFORO' &&
      !this.state.enResetTriggered
    ) {
      const cycle = this.simulationClock % 4.4;
      if (cycle < 1.8) {
        this.state.wifiLedGreen = true;
        this.state.wifiLedYellow = false;
        this.state.wifiLedRed = false;
      } else if (cycle < 2.6) {
        this.state.wifiLedGreen = false;
        this.state.wifiLedYellow = true;
        this.state.wifiLedRed = false;
      } else {
        this.state.wifiLedGreen = false;
        this.state.wifiLedYellow = false;
        this.state.wifiLedRed = true;
      }
    }

    // 2. Calculate GPIO2 LED state
    let ledVoltage = 0;
    if (this.state.enResetTriggered) {
      this.state.ledState = false;
    } else if (this.state.ledMode === 'MANUAL') {
      ledVoltage = this.state.ledState ? 3.3 : 0;
    } else if (this.state.ledMode === 'BLINK') {
      const period = 1 / this.state.ledFrequencyHz;
      const cyclePos = (this.simulationClock % period) / period;
      this.state.ledState = cyclePos < this.state.ledDutyCycle / 100;
      ledVoltage = this.state.ledState ? 3.3 : 0;
    } else if (this.state.ledMode === 'PWM') {
      const highFraction = this.state.ledDutyCycle / 100;
      this.state.ledState = highFraction > 0.05;
      ledVoltage = 3.3 * highFraction;
    }

    // 3. Calculate LDR Voltage (GPIO34) with tiny thermal noise
    const noise = (Math.random() - 0.5) * 0.015;
    const ldrActualV = Math.max(0, Math.min(3.3, this.state.ldrVoltage + noise));

    // 4. Wi-Fi 3 LEDs Output Voltages (GPIO18 = Pin 28, GPIO19 = Pin 27, GPIO21 = Pin 25)
    const redV = !this.state.enResetTriggered && this.state.wifiLedRed ? 3.3 : 0.0;
    const yellowV = !this.state.enResetTriggered && this.state.wifiLedYellow ? 3.3 : 0.0;
    const greenV = !this.state.enResetTriggered && this.state.wifiLedGreen ? 3.3 : 0.0;

    // Pin Voltages map (indexed by PinDefinition.id 1..38)
    const pinVoltages = new Map<number, number>();
    pinVoltages.set(1, 3.3); // 3V3
    pinVoltages.set(2, this.state.enResetTriggered ? 0.0 : 3.3); // EN
    pinVoltages.set(14, 0.0); // GND
    pinVoltages.set(19, 5.0); // VIN
    pinVoltages.set(20, 0.0); // GND
    pinVoltages.set(26, 0.0); // GND (Común de los 3 LEDs)
    pinVoltages.set(38, 0.0); // GND

    // Active simulated pins
    pinVoltages.set(28, redV); // Pin 28 = D18 (GPIO18 - LED Rojo)
    pinVoltages.set(27, yellowV); // Pin 27 = D19 (GPIO19 - LED Amarillo)
    pinVoltages.set(25, greenV); // Pin 25 = D21 (GPIO21 - LED Verde)
    pinVoltages.set(33, ledVoltage); // Pin 33 = D2 (GPIO2)
    pinVoltages.set(5, ldrActualV); // Pin 5 = D34 (GPIO34)

    // Append to circular buffers for oscilloscope
    this.appendSample(28, redV);
    this.appendSample(27, yellowV);
    this.appendSample(25, greenV);
    this.appendSample(26, 0.0);
    this.appendSample(33, ledVoltage);
    this.appendSample(5, ldrActualV);
    this.appendSample(2, pinVoltages.get(2)!);

    return {
      ledActive: this.state.ledState,
      currentPinVoltages: pinVoltages,
    };
  }

  private appendSample(pinId: number, v: number) {
    let buf = this.signalBuffers.get(pinId);
    if (!buf) {
      buf = [];
      this.signalBuffers.set(pinId, buf);
    }
    buf.push({
      timestamp: performance.now(),
      voltage: v,
      logicLevel: v > 1.8 ? 1 : 0,
    });
    if (buf.length > this.maxBufferSize) {
      buf.shift();
    }
  }

  public getPinWaveform(pinId: number): SignalSample[] {
    return this.signalBuffers.get(pinId) || [];
  }
}

export const circuitSim = new CircuitSimulator();
