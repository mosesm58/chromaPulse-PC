import { DynamicMode } from '../types/led';

/**
 * Chroma Pulse Dynamic Modes Database
 * 
 * Hardware Firmware Modes (0x87-0x9A):
 * Native Lotus Lantern / ELK-BLEDOM single-color PWM modes executed directly by the strip's BLE controller chip.
 * 
 * Chroma Pulse Creative Engine Modes (0xB0-0xB9):
 * Advanced algorithmic whole-strip lighting effects actively streamed via Bluetooth RGB packets.
 */
export const LOTUS_MODES: DynamicMode[] = [
  // ==========================================
  // JUMP MODES (Hardware IDs 0x87 - 0x88)
  // ==========================================
  {
    id: 0x87,
    name: '3-Color Jump (RGB)',
    category: 'Jump',
    colors: ['#FF0000', '#00FF00', '#0044FF'],
    description: 'Instant snapping cadence cycling between pure Red, Green, and Blue across the whole strip.',
    supportsWholeStrip: true,
  },
  {
    id: 0x88,
    name: '7-Color Jump (All Primary & Secondary)',
    category: 'Jump',
    colors: ['#FF0000', '#00FF00', '#0044FF', '#FFDD00', '#00FFFF', '#BF00FF', '#FFFFFF'],
    description: 'Crisp synchronous cadence cycling across all 7 primary and secondary colors.',
    supportsWholeStrip: true,
  },

  // ==========================================
  // GRADIENT MODES (Hardware IDs 0x89 - 0x8A)
  // ==========================================
  {
    id: 0x89,
    name: '3-Color Crossfade (RGB)',
    category: 'Gradient',
    colors: ['#FF0000', '#00FF00', '#0044FF'],
    description: 'Smooth, continuous color morphing between Red, Green, and Blue.',
    supportsWholeStrip: true,
  },
  {
    id: 0x8a,
    name: '7-Color Rainbow Crossfade',
    category: 'Gradient',
    colors: ['#FF0055', '#FF7700', '#FFDD00', '#00FF66', '#00C8FF', '#7A00FF', '#FF00AA'],
    description: 'Full continuous 360-degree rainbow spectrum morph across the whole strip.',
    supportsWholeStrip: true,
  },

  // ==========================================
  // BREATHING MODES (Hardware IDs 0x8B - 0x91)
  // ==========================================
  {
    id: 0x8b,
    name: 'Red Fade & Breathing',
    category: 'Breathing',
    colors: ['#FF0000', '#330000'],
    description: 'Harmonic crimson breathing pulse (dims down and swells back to full saturation).',
    supportsWholeStrip: true,
  },
  {
    id: 0x8c,
    name: 'Green Fade & Breathing',
    category: 'Breathing',
    colors: ['#00FF00', '#003300'],
    description: 'Harmonic emerald green breathing pulse for the entire strip.',
    supportsWholeStrip: true,
  },
  {
    id: 0x8d,
    name: 'Blue Fade & Breathing',
    category: 'Breathing',
    colors: ['#0044FF', '#000d33'],
    description: 'Harmonic deep cobalt blue breathing pulse for the entire strip.',
    supportsWholeStrip: true,
  },
  {
    id: 0x8e,
    name: 'Yellow Fade & Breathing',
    category: 'Breathing',
    colors: ['#FFDD00', '#332c00'],
    description: 'Warm solar yellow harmonic breathing pulse.',
    supportsWholeStrip: true,
  },
  {
    id: 0x8f,
    name: 'Cyan Fade & Breathing',
    category: 'Breathing',
    colors: ['#00FFFF', '#003333'],
    description: 'Glacial cyan neon breathing sweep across the whole strip.',
    supportsWholeStrip: true,
  },
  {
    id: 0x90,
    name: 'Purple Fade & Breathing',
    category: 'Breathing',
    colors: ['#BF00FF', '#260033'],
    description: 'Mystical ultraviolet purple breathing surge.',
    supportsWholeStrip: true,
  },
  {
    id: 0x91,
    name: 'White Fade & Breathing',
    category: 'Breathing',
    colors: ['#FFFFFF', '#333333'],
    description: 'Clean monochrome daylight breathing wave.',
    supportsWholeStrip: true,
  },

  // ==========================================
  // HARDWARE STROBE MODES (Hardware IDs 0x92 - 0x9A)
  // Native Lotus Lantern / ELK-BLEDOM single-color firmware strobe commands
  // ==========================================
  {
    id: 0x92,
    name: '3-Color RGB Synchronous Strobe',
    category: 'Strobe',
    colors: ['#FF0000', '#00FF00', '#0044FF'],
    description: 'Rapid-fire hardware strobe alternating between Red, Green, and Blue across the entire strip.',
    supportsWholeStrip: true,
  },
  {
    id: 0x93,
    name: '7-Color Party Strobe',
    category: 'Strobe',
    colors: ['#FF0000', '#00FF00', '#0044FF', '#FFDD00', '#00FFFF', '#BF00FF', '#FFFFFF'],
    description: 'High-energy synchronous strobe flashing all 7 colors at the hardware clock rate.',
    supportsWholeStrip: true,
  },
  {
    id: 0x94,
    name: 'White Flash Strobe',
    category: 'Strobe',
    colors: ['#FFFFFF', '#000000'],
    description: 'High-voltage camera flash white strobe pulse across the entire strip.',
    supportsWholeStrip: true,
  },
  {
    id: 0x95,
    name: 'Red Flash Strobe',
    category: 'Strobe',
    colors: ['#FF0000', '#000000'],
    description: 'Urgent red alert emergency strobe flash pulse.',
    supportsWholeStrip: true,
  },
  {
    id: 0x96,
    name: 'Green Flash Strobe',
    category: 'Strobe',
    colors: ['#00FF00', '#000000'],
    description: 'Laser green rapid-pulse flash across the entire strip.',
    supportsWholeStrip: true,
  },
  {
    id: 0x97,
    name: 'Blue Flash Strobe',
    category: 'Strobe',
    colors: ['#0044FF', '#000000'],
    description: 'Deep cobalt blue high-speed strobe flash.',
    supportsWholeStrip: true,
  },
  {
    id: 0x98,
    name: 'Yellow Flash Strobe',
    category: 'Strobe',
    colors: ['#FFDD00', '#000000'],
    description: 'High-intensity caution amber/yellow strobe flash.',
    supportsWholeStrip: true,
  },
  {
    id: 0x99,
    name: 'Cyan Flash Strobe',
    category: 'Strobe',
    colors: ['#00FFFF', '#000000'],
    description: 'Glacial electric cyan strobe flash pulse.',
    supportsWholeStrip: true,
  },
  {
    id: 0x9a,
    name: 'Purple Flash Strobe',
    category: 'Strobe',
    colors: ['#BF00FF', '#000000'],
    description: 'Synthwave ultraviolet purple rapid strobe flash.',
    supportsWholeStrip: true,
  },

  // ==========================================
  // CREATIVE SPECIAL STYLES (Engine IDs 0xB0 - 0xB9)
  // Whole-Strip Active RGB Streaming Engine
  // ==========================================
  {
    id: 0xb0,
    name: 'Whole-Strip Candlelight Flicker',
    category: 'Special',
    colors: ['#FF5500', '#FF8800', '#FFAA20', '#FF3300'],
    description: 'Authentic organic flame flicker with natural micro-brightness dips and warm golden fluctuations.',
    supportsWholeStrip: true,
    isSoftwareEngine: true,
  },
  {
    id: 0xb1,
    name: 'Cozy Fireplace Glowing Embers',
    category: 'Special',
    colors: ['#D62828', '#F77F00', '#FCBF49', '#800E13'],
    description: 'Warm glowing hearth coals shifting harmonically between deep crimson, burnt orange, and radiant gold.',
    supportsWholeStrip: true,
    isSoftwareEngine: true,
  },
  {
    id: 0xb2,
    name: 'Thunderstorm Lightning Surge',
    category: 'Special',
    colors: ['#050814', '#FFFFFF', '#6366F1'],
    description: 'Dark moody ambient background interrupted by sudden, startling double and triple lightning flashes.',
    supportsWholeStrip: true,
    isSoftwareEngine: true,
  },
  {
    id: 0xb3,
    name: 'Sunset Golden Hour to Twilight',
    category: 'Special',
    colors: ['#FFB703', '#FB8500', '#7209B7', '#3A0CA3'],
    description: 'Gradual evening sky transition from warm gold through fiery amber into deep dusk violet.',
    supportsWholeStrip: true,
    isSoftwareEngine: true,
  },
  {
    id: 0xb4,
    name: 'Deep Sleep 4-7-8 Breathing',
    category: 'Special',
    colors: ['#1D3557', '#457B9D', '#03045E'],
    description: 'Clinical 4-7-8 relaxation cadence (4s gentle inhale glow, 7s steady hold, 8s serene dimming exhale).',
    supportsWholeStrip: true,
    isSoftwareEngine: true,
  },
  {
    id: 0xb5,
    name: 'Police Pursuit Interceptor Strobe',
    category: 'Special',
    colors: ['#FF0000', '#0044FF', '#FFFFFF'],
    description: 'Authentic high-speed emergency vehicle sequence: triple red pulse, pause, triple blue pulse!',
    supportsWholeStrip: true,
    isSoftwareEngine: true,
  },
  {
    id: 0xb6,
    name: 'Cyberpunk Neon Alternator',
    category: 'Special',
    colors: ['#00FFFF', '#FF007F'],
    description: 'High-frequency dance club alternation between Electric Cyan and Hot Neon Magenta.',
    supportsWholeStrip: true,
    isSoftwareEngine: true,
  },
  {
    id: 0xb7,
    name: 'Matrix Cyber Rain Pulse',
    category: 'Special',
    colors: ['#002200', '#00FF41', '#008F11'],
    description: 'Deep terminal shadow backdrop with sudden electric surges of pure matrix neon green.',
    supportsWholeStrip: true,
    isSoftwareEngine: true,
  },
  {
    id: 0xb8,
    name: 'Aurora Borealis Glacial Flow',
    category: 'Special',
    colors: ['#10B981', '#06B6D4', '#8B5CF6'],
    description: 'Slow hypnotic atmospheric waves morphing between emerald borealis, glacial cyan, and twilight purple.',
    supportsWholeStrip: true,
    isSoftwareEngine: true,
  },
  {
    id: 0xb9,
    name: 'Lava Molten Magma Pulse',
    category: 'Special',
    colors: ['#DC2626', '#EA580C', '#B91C1C'],
    description: 'Heavy, viscous magma warmth gently swelling and ebbing like molten subterranean lava.',
    supportsWholeStrip: true,
    isSoftwareEngine: true,
  },
];
