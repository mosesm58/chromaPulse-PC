import { HsvColor, RgbColor } from '../types/led';

export function rgbToHex(rgb: RgbColor): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function hexToRgb(hex: string): RgbColor {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    return {
      r: parseInt(cleanHex[0] + cleanHex[0], 16) || 0,
      g: parseInt(cleanHex[1] + cleanHex[1], 16) || 0,
      b: parseInt(cleanHex[2] + cleanHex[2], 16) || 0,
    };
  }
  return {
    r: parseInt(cleanHex.substring(0, 2), 16) || 0,
    g: parseInt(cleanHex.substring(2, 4), 16) || 0,
    b: parseInt(cleanHex.substring(4, 6), 16) || 0,
  };
}

export function rgbToHsv(rgb: RgbColor): HsvColor {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  if (diff === 0) {
    h = 0;
  } else if (max === r) {
    h = ((g - b) / diff) % 6;
  } else if (max === g) {
    h = (b - r) / diff + 2;
  } else {
    h = (r - g) / diff + 4;
  }

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : Math.round((diff / max) * 100);
  const v = Math.round(max * 100);

  return { h, s, v };
}

export function hsvToRgb(hsv: HsvColor): RgbColor {
  const h = (hsv.h % 360) / 60;
  const s = Math.max(0, Math.min(100, hsv.s)) / 100;
  const v = Math.max(0, Math.min(100, hsv.v)) / 100;

  const c = v * s;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = v - c;

  let r1 = 0, g1 = 0, b1 = 0;

  if (h >= 0 && h < 1) {
    r1 = c; g1 = x; b1 = 0;
  } else if (h >= 1 && h < 2) {
    r1 = x; g1 = c; b1 = 0;
  } else if (h >= 2 && h < 3) {
    r1 = 0; g1 = c; b1 = x;
  } else if (h >= 3 && h < 4) {
    r1 = 0; g1 = x; b1 = c;
  } else if (h >= 4 && h < 5) {
    r1 = x; g1 = 0; b1 = c;
  } else if (h >= 5 && h <= 6) {
    r1 = c; g1 = 0; b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

// Convert Kelvin color temperature (2000K - 6500K) to RGB (Tanner Helland algorithm)
export function kelvinToRgb(kelvin: number): RgbColor {
  const temp = kelvin / 100;
  let red: number, green: number, blue: number;

  if (temp <= 66) {
    red = 255;
    green = Math.min(255, Math.max(0, 99.4708025861 * Math.log(temp) - 161.1195681661));
    if (temp <= 19) {
      blue = 0;
    } else {
      blue = Math.min(255, Math.max(0, 138.5177312231 * Math.log(temp - 10) - 305.0447927307));
    }
  } else {
    red = Math.min(255, Math.max(0, 329.698727446 * Math.pow(temp - 60, -0.1332047592)));
    green = Math.min(255, Math.max(0, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)));
    blue = 255;
  }

  return {
    r: Math.round(red),
    g: Math.round(green),
    b: Math.round(blue),
  };
}

// Classic Lotus Lantern preset colors
export const LOTUS_PRESET_COLORS: { name: string; rgb: RgbColor }[] = [
  { name: 'Pure Red', rgb: { r: 255, g: 0, b: 0 } },
  { name: 'Electric Green', rgb: { r: 0, g: 255, b: 0 } },
  { name: 'Vibrant Blue', rgb: { r: 0, g: 100, b: 255 } },
  { name: 'Warm Amber', rgb: { r: 255, g: 140, b: 0 } },
  { name: 'Electric Cyan', rgb: { r: 0, g: 240, b: 255 } },
  { name: 'Deep Magenta', rgb: { r: 255, g: 0, b: 200 } },
  { name: 'Neon Purple', rgb: { r: 160, g: 32, b: 255 } },
  { name: 'Golden Yellow', rgb: { r: 255, g: 220, b: 0 } },
  { name: 'Soft Lime', rgb: { r: 120, g: 255, b: 50 } },
  { name: 'Warm White (2700K)', rgb: { r: 255, g: 200, b: 140 } },
  { name: 'Neutral White (4000K)', rgb: { r: 255, g: 240, b: 220 } },
  { name: 'Cool Daylight (6500K)', rgb: { r: 230, g: 245, b: 255 } },
];

export const MOOD_SCENES = [
  { name: 'Cyberpunk Neon', rgb: { r: 255, g: 0, b: 128 }, brightness: 90, desc: 'Ultra-vibrant hot pink synthwave glow' },
  { name: 'Deep Space Blue', rgb: { r: 20, g: 80, b: 255 }, brightness: 75, desc: 'Cosmic deep oceanic ambience' },
  { name: 'Cozy Fireplace', rgb: { r: 255, g: 105, b: 15 }, brightness: 60, desc: 'Intimate warm candlelight tone' },
  { name: 'Tokyo Dusk', rgb: { r: 155, g: 45, b: 255 }, brightness: 80, desc: 'Violet vaporwave evening aesthetic' },
  { name: 'Emerald Forest', rgb: { r: 10, g: 220, b: 110 }, brightness: 70, desc: 'Zen botanical organic calm' },
  { name: 'Focus Daylight', rgb: { r: 245, g: 250, b: 255 }, brightness: 100, desc: 'High-clarity productivity illumination' },
];
