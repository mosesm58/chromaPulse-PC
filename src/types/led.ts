export interface RgbColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface HsvColor {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

export type ActiveTab = 'color' | 'style' | 'music' | 'mic' | 'schedule' | 'devices';

export type AppTheme = 'dark' | 'light' | 'grey';

export type RgbChannelOrder = 'RGB' | 'RBG' | 'GRB' | 'GBR' | 'BRG' | 'BGR';

export interface DynamicMode {
  id: number;
  name: string;
  category: 'Jump' | 'Gradient' | 'Strobe' | 'Breathing' | 'Special';
  colors: string[];
  description: string;
  supportsWholeStrip: boolean; // True if works on standard non-addressable RGB strips
  isSoftwareEngine?: boolean; // When true, streams dynamic PWM colors to guarantee support on all strips
}

export interface WebBluetoothDevice {
  id: string;
  name?: string;
  gatt?: {
    connected: boolean;
    connect: () => Promise<any>;
    disconnect: () => void;
  };
}

export interface WebBluetoothCharacteristic {
  uuid: string;
  properties: {
    write?: boolean;
    writeWithoutResponse?: boolean;
    read?: boolean;
  };
  writeValue: (value: BufferSource) => Promise<void>;
  writeValueWithoutResponse?: (value: BufferSource) => Promise<void>;
}

export interface LedDevice {
  id: string;
  name: string;
  location: string;
  type: 'strip' | 'bulb' | 'neon' | 'bar';
  hardwareType: 'whole-strip' | 'addressable'; // 'whole-strip' = standard single-color RGB, 'addressable' = WS2812B/ARGB
  ledCount: number;
  isOnline: boolean;
  power: boolean;
  color: RgbColor;
  brightness: number; // 1-100
  colorTemp: number; // 2700K - 6500K
  modeId: number | null; // null if static color
  speed: number; // 1-100
  rssi: number; // -30 to -90 dBm
  isRealBluetooth?: boolean;
  bleDevice?: WebBluetoothDevice;
  bleDeviceId?: string;
  bleCharacteristic?: WebBluetoothCharacteristic;
}

export interface DeviceGroup {
  id: string;
  name: string;
  deviceIds: string[];
  power: boolean;
}

export interface ScheduleItem {
  id: string;
  time: string; // "HH:MM"
  action: 'on' | 'off';
  repeatDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  enabled: boolean;
  sunriseEffect?: boolean;
  targetColor?: RgbColor;
  targetBrightness?: number;
}
