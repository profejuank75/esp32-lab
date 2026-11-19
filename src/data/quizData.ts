export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  relatedPartId: string;
}

export const ESP32_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: '¿Cuál es la arquitectura y frecuencia de reloj máxima del microprocesador en el módulo ESP-WROOM-32?',
    options: [
      'ARM Cortex-M4 Single-Core a 80 MHz',
      'Xtensa Dual-Core 32-bit LX6 hasta 240 MHz',
      'ATmega328P de 8 bits a 16 MHz',
      'RISC-V de 64 bits a 100 MHz',
    ],
    correctIndex: 1,
    explanation: 'El ESP32 incorpora dos núcleos Xtensa LX6 de 32 bits capaces de alcanzar 240 MHz y rendir hasta 600 DMIPS, con soporte para multitarea en tiempo real (FreeRTOS).',
    relatedPartId: 'esp_wroom_32',
  },
  {
    id: 2,
    question: '¿Qué función cumple el pulsador táctil BOOT conectado al pin GPIO0?',
    options: [
      'Forzar al ESP32 a entrar en modo de descarga de firmware (Bootloader) al reiniciar',
      'Cortar la alimentación de 5V del puerto USB',
      'Calibrar automáticamente el conversor analógico-digital',
      'Restablecer de fábrica la memoria Flash borrando el bootloader',
    ],
    correctIndex: 0,
    explanation: 'Si GPIO0 está en nivel BAJO (0V) durante el ciclo de arranque, la ROM interna del chip arranca en modo flashing para permitir escribir nuevo código mediante UART.',
    relatedPartId: 'btn_boot',
  },
  {
    id: 3,
    question: '¿Por qué los pines GPIO34, GPIO35, GPIO36 (VP) y GPIO39 (VN) son considerados especiales?',
    options: [
      'Son los únicos pines que toleran 5 voltios de entrada directa',
      'Están reservados exclusivamente para el bus de programación JTAG',
      'Son pines exclusivos de entrada (Input-Only) y carecen de resistencias internas de Pull-Up/Down',
      'Son salidas de alta corriente (hasta 500mA) para motores',
    ],
    correctIndex: 2,
    explanation: 'Los pines GPIO 34 a 39 solo pueden funcionar como entradas digitales o analógicas (ADC1). No tienen drivers de salida ni resistencias internas de pull-up o pull-down.',
    relatedPartId: 'pins_analog',
  },
  {
    id: 4,
    question: '¿Qué circuito integrado incorpora esta placa para la conversión USB-Serial y autoreset?',
    options: [
      'Silicon Labs CP2102',
      'FTDI FT232RL',
      'WCH CH340G',
      'Atmel ATmega16U2',
    ],
    correctIndex: 0,
    explanation: 'La versión oficial NodeMCU DevKit V1 utiliza el chip Silicon Labs CP2102-GMR, el cual incluye control de señales DTR/RTS para programar automáticamente el ESP32 desde el IDE.',
    relatedPartId: 'cp2102',
  },
  {
    id: 5,
    question: '¿Cuál es la tensión de salida regulada que entrega el componente AMS1117 para alimentar al SoC?',
    options: [
      '5.0V constantes',
      '3.3V fijos (±1%)',
      '1.8V de bajo consumo',
      '12.0V para relés externos',
    ],
    correctIndex: 1,
    explanation: 'El AMS1117-3.3 es un regulador lineal LDO que reduce los 5V provenientes del puerto Micro-USB o del pin VIN a los 3.3V que requiere el ESP32, soportando hasta 800mA-1A.',
    relatedPartId: 'ams1117',
  },
  {
    id: 6,
    question: '¿A qué pin GPIO está conectado el LED azul de usuario integrado en la placa para pruebas básicas?',
    options: [
      'GPIO13 (Pin D13)',
      'GPIO0 (Pulsador BOOT)',
      'GPIO16 (Pin RX2)',
      'GPIO2 (Pin D2)',
    ],
    correctIndex: 3,
    explanation: 'El LED azul está conectado a GPIO2. Al poner este pin en nivel ALTO (3.3V) el LED se enciende. Además, es un pin de strapping que interviene en el proceso de arranque.',
    relatedPartId: 'led_user',
  },
  {
    id: 7,
    question: '¿Qué tipo de antena de radiofrecuencia (2.4 GHz) incorpora el módulo sobre el sustrato de PCB?',
    options: [
      'Antena MIFA (Meandered Inverted-F Antenna) de microcinta dorada',
      'Antena telescópica retráctil de cobre',
      'Antena dipolo de varilla externa SMA',
      'Bobina inductiva de ferrita para baja frecuencia',
    ],
    correctIndex: 0,
    explanation: 'El ESP-WROOM-32 cuenta con una antena MIFA trazada con pistas en la PCB exterior al blindaje metálico, optimizada para proporcionar un patrón de radiación omnidireccional en 2.4 GHz.',
    relatedPartId: 'pcb_antenna',
  },
  {
    id: 8,
    question: '¿Cuáles son los pines predeterminados para el bus de comunicación I2C (Wire) en esta placa?',
    options: [
      'GPIO1 (TX0) y GPIO3 (RX0)',
      'GPIO18 (SCK) y GPIO19 (MISO)',
      'GPIO21 (SDA) y GPIO22 (SCL)',
      'GPIO25 (DAC1) y GPIO26 (DAC2)',
    ],
    correctIndex: 2,
    explanation: 'En el core de Arduino para ESP32, el bus I2C principal utiliza GPIO21 como línea de datos (SDA) y GPIO22 como línea de reloj (SCL), utilizados comúnmente para pantallas OLED y sensores.',
    relatedPartId: 'pins_digital',
  },
  {
    id: 9,
    question: '¿Qué consecuencia tiene conectar componentes externos a los pines GPIO6, 7, 8, 9, 10 u 11?',
    options: [
      'El ESP32 se bloqueará o reiniciará porque están conectados internamente a la memoria Flash SPI',
      'Aumenta automáticamente la velocidad de la CPU a 300 MHz',
      'Se activan 6 entradas analógicas de 16 bits sin pérdida',
      'Se apaga de inmediato el regulador AMS1117 para proteger la placa',
    ],
    correctIndex: 0,
    explanation: 'Estos 6 pines están interconectados directamente con el chip de memoria Flash SPI de 4 MB dentro del módulo. Interferir con estas líneas detiene la lectura de instrucciones de la CPU.',
    relatedPartId: 'esp_wroom_32',
  },
  {
    id: 10,
    question: '¿Cuál es la resolución nativa de los convertidores analógico-digitales (ADC) del ESP32?',
    options: [
      '10 bits (rango de valores de 0 a 1023)',
      '12 bits (rango de valores de 0 a 4095)',
      '8 bits (rango de valores de 0 a 255)',
      '16 bits (rango de valores de 0 a 65535)',
    ],
    correctIndex: 1,
    explanation: 'A diferencia de Arduino Uno (10 bits, 0-1023), el ESP32 cuenta con convertidores ADC SAR de 12 bits capaces de distinguir 4096 niveles de tensión entre 0 y 3.3V (con atenuación de 11dB).',
    relatedPartId: 'pins_analog',
  },
];
