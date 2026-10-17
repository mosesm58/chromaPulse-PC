import { useCallback, useEffect, useRef, useState } from 'react';
import { LOTUS_MODES } from '../data/modes';
import { ActiveTab, DynamicMode, LedDevice, RgbColor, ScheduleItem } from '../types/led';
import { AudioAnalysis } from '../utils/audio';
import { buildLotusPacket, sendLotusPacket } from '../utils/bluetooth';
import { hexToRgb, hsvToRgb } from '../utils/color';

const INITIAL_DEVICES: LedDevice[] = [
  {
    id: 'dev-desk',
    name: 'Battlestation Desk Strip',
    location: 'PC Desk Edge',
    type: 'strip',
    hardwareType: 'whole-strip',
    ledCount: 150,
    isOnline: true,
    power: true,
    color: { r: 99, g: 102, b: 241 }, // Indigo glow
    brightness: 90,
    colorTemp: 4000,
    modeId: null,
    speed: 60,
    rssi: -42,
  },
  {
    id: 'dev-monitor',
    name: 'Ultrawide Monitor Bias Backlight',
    location: 'Wall Behind Monitor',
    type: 'bar',
    hardwareType: 'whole-strip',
    ledCount: 72,
    isOnline: true,
    power: true,
    color: { r: 6, g: 182, b: 212 }, // Cyan glow
    brightness: 85,
    colorTemp: 4500,
    modeId: null,
    speed: 50,
    rssi: -48,
  },
  {
    id: 'dev-cove',
    name: 'Ceiling Perimeter Cove',
    location: 'Room Ceiling',
    type: 'strip',
    hardwareType: 'whole-strip',
    ledCount: 300,
    isOnline: true,
    power: true,
    color: { r: 168, g: 85, b: 247 }, // Purple ambient
    brightness: 70,
    colorTemp: 3200,
    modeId: null,
    speed: 40,
    rssi: -65,
  },
];

const INITIAL_SCHEDULES: ScheduleItem[] = [
  {
    id: 'sch-1',
    time: '07:30',
    action: 'on',
    repeatDays: [1, 2, 3, 4, 5],
    enabled: true,
    sunriseEffect: true,
    targetBrightness: 80,
  },
  {
    id: 'sch-2',
    time: '23:45',
    action: 'off',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
  },
];

export function useLedController() {
  const [devices, setDevices] = useState<LedDevice[]>(() => {
    try {
      const saved = localStorage.getItem('lotus-led-devices');
      if (saved) {
        const parsed = JSON.parse(saved) as LedDevice[];
        if (Array.isArray(parsed) && parsed.length) return parsed.map((device) => ({
          ...device,
          isRealBluetooth: false,
          bleCharacteristic: undefined,
          isOnline: false,
        }));
      }
    } catch { /* Restore defaults if stored data is invalid. */ }
    return INITIAL_DEVICES;
  });
  const [activeDeviceId, setActiveDeviceId] = useState<string>(() => {
    try { return localStorage.getItem('lotus-led-active-device') || 'dev-desk'; }
    catch { return 'dev-desk'; }
  });
  const [masterPower, setMasterPower] = useState(true);
  const [allSynced, setAllSynced] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(INITIAL_SCHEDULES);
  const [sleepRemainingSeconds, setSleepRemainingSeconds] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sensitivity, setSensitivity] = useState(65);

  const activeDevice = devices.find((d) => d.id === activeDeviceId) || devices[0];
  const lastBleStreamTime = useRef<number>(0);

  useEffect(() => {
    try {
      const savedDevices = devices.map(({ bleCharacteristic: _characteristic, ...device }) => ({
        ...device,
        isRealBluetooth: false,
        isOnline: false,
      }));
      localStorage.setItem('lotus-led-devices', JSON.stringify(savedDevices));
      localStorage.setItem('lotus-led-active-device', activeDeviceId);
    } catch (error) {
      console.warn('Could not save LED device settings:', error);
    }
  }, [devices, activeDeviceId]);

  // Sound FX synthesizer
  const playClickSound = useCallback(
    (frequency: number = 800) => {
      if (!soundEnabled) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } catch {
        // Audio context might be restricted
      }
    },
    [soundEnabled]
  );

  // Transmit real Bluetooth packets if device has BLE characteristic
  const broadcastBlePacket = useCallback(
    (type: 'power' | 'color' | 'brightness' | 'mode' | 'speed', val1: number, val2?: number, val3?: number) => {
      const packet = buildLotusPacket(type, val1, val2, val3);
      devices.forEach((dev) => {
        if (dev.isRealBluetooth && dev.bleCharacteristic) {
          sendLotusPacket(dev.bleCharacteristic, packet);
        }
      });
    },
    [devices]
  );

  // Master Power Toggle
  const toggleMasterPower = useCallback(() => {
    setMasterPower((prev) => {
      const next = !prev;
      playClickSound(next ? 1000 : 400);
      broadcastBlePacket('power', next ? 1 : 0);
      setDevices((current) =>
        current.map((dev) => ({
          ...dev,
          power: next,
        }))
      );
      return next;
    });
  }, [playClickSound, broadcastBlePacket]);

  // Device Power Toggle
  const toggleDevicePower = useCallback(
    (id: string) => {
      playClickSound(700);
      setDevices((current) =>
        current.map((dev) => {
          if (dev.id === id) {
            const nextPower = !dev.power;
            if (dev.isRealBluetooth && dev.bleCharacteristic) {
              sendLotusPacket(dev.bleCharacteristic, buildLotusPacket('power', nextPower ? 1 : 0));
            }
            return { ...dev, power: nextPower };
          }
          return dev;
        })
      );
    },
    [playClickSound]
  );

  // Color Change (Static Color Wheel)
  const setColor = useCallback(
    (newColor: RgbColor) => {
      broadcastBlePacket('color', newColor.r, newColor.g, newColor.b);
      setDevices((current) =>
        current.map((dev) => {
          if (allSynced || dev.id === activeDeviceId) {
            return { ...dev, color: newColor, modeId: null };
          }
          return dev;
        })
      );
    },
    [activeDeviceId, allSynced, broadcastBlePacket]
  );

  // Brightness Change
  const setBrightness = useCallback(
    (val: number) => {
      broadcastBlePacket('brightness', val);
      setDevices((current) =>
        current.map((dev) => {
          if (allSynced || dev.id === activeDeviceId) {
            return { ...dev, brightness: val };
          }
          return dev;
        })
      );
    },
    [activeDeviceId, allSynced, broadcastBlePacket]
  );

  // Individual Device Brightness
  const setDeviceBrightness = useCallback((id: string, val: number) => {
    setDevices((current) =>
      current.map((dev) => {
        if (dev.id === id) {
          if (dev.isRealBluetooth && dev.bleCharacteristic) {
            sendLotusPacket(dev.bleCharacteristic, buildLotusPacket('brightness', val));
          }
          return { ...dev, brightness: val };
        }
        return dev;
      })
    );
  }, []);

  // Color Temp Change
  const setColorTemp = useCallback(
    (temp: number) => {
      setDevices((current) =>
        current.map((dev) => {
          if (allSynced || dev.id === activeDeviceId) {
            return { ...dev, colorTemp: temp, modeId: null };
          }
          return dev;
        })
      );
    },
    [activeDeviceId, allSynced]
  );

  // Dynamic Mode Selection
  const setDynamicMode = useCallback(
    (modeId: number) => {
      playClickSound(880);
      const mode = LOTUS_MODES.find((m) => m.id === modeId);

      // If it's a native hardware mode (Jump 0x87-0x88, Gradient 0x89-0x8A, Breathing 0x8B-0x91, Hardware Strobe 0x92-0x9A):
      if (mode && !mode.isSoftwareEngine && activeDevice.isRealBluetooth) {
        broadcastBlePacket('mode', modeId);
        broadcastBlePacket('speed', activeDevice.speed);
      }

      setDevices((current) =>
        current.map((dev) => {
          if (allSynced || dev.id === activeDeviceId) {
            return { ...dev, modeId };
          }
          return dev;
        })
      );
    },
    [activeDeviceId, allSynced, broadcastBlePacket, playClickSound, activeDevice.speed]
  );

  // Dynamic Speed Change
  const setSpeed = useCallback(
    (speedVal: number) => {
      const mode = activeDevice.modeId ? LOTUS_MODES.find((m) => m.id === activeDevice.modeId) : null;
      if (mode && !mode.isSoftwareEngine && activeDevice.isRealBluetooth) {
        broadcastBlePacket('speed', speedVal);
      }
      setDevices((current) =>
        current.map((dev) => {
          if (allSynced || dev.id === activeDeviceId) {
            return { ...dev, speed: speedVal };
          }
          return dev;
        })
      );
    },
    [activeDeviceId, allSynced, broadcastBlePacket, activeDevice.modeId]
  );

  // Sync All Devices Toggle
  const toggleSyncAll = useCallback(() => {
    playClickSound(750);
    setAllSynced((prev) => {
      const next = !prev;
      if (next && activeDevice) {
        setDevices((current) =>
          current.map((d) => ({
            ...d,
            color: activeDevice.color,
            brightness: activeDevice.brightness,
            modeId: activeDevice.modeId,
            speed: activeDevice.speed,
          }))
        );
      }
      return next;
    });
  }, [activeDevice, playClickSound]);

  // Audio Reactivity Callback
  const handleAudioBeat = useCallback(
    (analysis: AudioAnalysis) => {
      if (!masterPower) return;

      if (analysis.isBeat) {
        setDevices((current) =>
          current.map((dev) => {
            if (dev.power) {
              const boost = Math.min(100, Math.round(dev.brightness * 1.3));
              return { ...dev, brightness: boost };
            }
            return dev;
          })
        );

        setTimeout(() => {
          setDevices((current) =>
            current.map((dev) => ({
              ...dev,
              brightness: activeDevice.brightness,
            }))
          );
        }, 90);
      }
    },
    [masterPower, activeDevice.brightness]
  );

  // Sleep Timer Tick
  useEffect(() => {
    if (sleepRemainingSeconds === null || sleepRemainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setSleepRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          setMasterPower(false);
          setDevices((curr) => curr.map((d) => ({ ...d, power: false })));
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepRemainingSeconds]);

  const setSleepTimer = useCallback(
    (minutes: number) => {
      playClickSound(600);
      if (minutes <= 0) {
        setSleepRemainingSeconds(null);
      } else {
        setSleepRemainingSeconds(minutes * 60);
      }
    },
    [playClickSound]
  );

  // Dynamic Mode Animation & Active BLE Streaming Loop
  useEffect(() => {
    if (!masterPower || activeDevice.modeId === null) return;

    const mode = LOTUS_MODES.find((m) => m.id === activeDevice.modeId);
    if (!mode) return;

    const speed = activeDevice.speed;
    // Calculate interval based on speed: 25ms to 180ms
    // Preserve crisp transitions for flashes; smooth styles use a faster tick.
    const isFlashStyle = mode.category === 'Strobe' || mode.id === 0xb2 || mode.id === 0xb5 || mode.id === 0xb6 || mode.id === 0xb7;
    const intervalMs = isFlashStyle
      ? Math.max(90, Math.floor(520 - speed * 4))
      : Math.max(35, Math.floor(1000 / (speed * 0.45 + 5)));

    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % 100000;
      let targetColor: RgbColor = activeDevice.color;

      // 1. JUMP MODES (0x87, 0x88)
      if (mode.category === 'Jump') {
        const stepRate = Math.max(3, Math.floor(12 - (speed / 100) * 8));
        const colorIdx = Math.floor(step / stepRate) % mode.colors.length;
        targetColor = hexToRgb(mode.colors[colorIdx]);
      }

      // 2. GRADIENT MODES (0x89, 0x8A)
      else if (mode.category === 'Gradient') {
        if (mode.id === 0x89) {
          // 3-Color RGB Crossfade
          const rgbCycle = ['#FF0000', '#00FF00', '#0044FF'];
          const subStep = (step * (speed / 40)) % 300;
          const idxA = Math.floor(subStep / 100) % 3;
          const idxB = (idxA + 1) % 3;
          const factor = (subStep % 100) / 100;
          const colA = hexToRgb(rgbCycle[idxA]);
          const colB = hexToRgb(rgbCycle[idxB]);
          targetColor = {
            r: Math.round(colA.r + (colB.r - colA.r) * factor),
            g: Math.round(colA.g + (colB.g - colA.g) * factor),
            b: Math.round(colA.b + (colB.b - colA.b) * factor),
          };
        } else {
          // 7-Color 360-degree rainbow continuous flow
          const hue = (step * (speed / 10)) % 360;
          targetColor = hsvToRgb({ h: hue, s: 100, v: 100 });
        }
      }

      // 3. BREATHING MODES (0x8B - 0x91)
      else if (mode.category === 'Breathing') {
        const breathFreq = 0.08 + (speed / 100) * 0.16;
        const breathSine = (Math.sin(step * breathFreq) + 1) / 2;
        const breathLevel = 0.12 + breathSine * 0.88;
        const base = hexToRgb(mode.colors[0]);
        targetColor = {
          r: Math.round(base.r * breathLevel),
          g: Math.round(base.g * breathLevel),
          b: Math.round(base.b * breathLevel),
        };
      }

      // 4. HARDWARE STROBE MODES (0x92 - 0x9A)
      else if (mode.category === 'Strobe') {
        // High-cadence square wave flash
        const isFlashOn = step % 2 === 0;
        if (mode.id === 0x92 || mode.id === 0x93) {
          // Multi-color strobe: cycle color every flash
          const colorIdx = Math.floor(step / 2) % mode.colors.length;
          const flashColor = hexToRgb(mode.colors[colorIdx]);
          targetColor = isFlashOn ? flashColor : { r: Math.round(flashColor.r * 0.025), g: Math.round(flashColor.g * 0.025), b: Math.round(flashColor.b * 0.025) };
        } else {
          // Single-color strobe (White, Red, Green, Blue, Yellow, Cyan, Purple)
          const baseColor = hexToRgb(mode.colors[0]);
          targetColor = isFlashOn ? baseColor : { r: Math.round(baseColor.r * 0.025), g: Math.round(baseColor.g * 0.025), b: Math.round(baseColor.b * 0.025) };
        }
      }

      // 5. CREATIVE SPECIAL MODES (0xB0 - 0xB9)
      else if (mode.category === 'Special') {
        switch (mode.id) {
          case 0xb0: {
            // Whole-Strip Candlelight Flicker: natural warm dips & golden surges
            const flickerNoise = 0.68 + Math.sin(step * 0.45) * 0.12 + (Math.random() * 0.2);
            targetColor = {
              r: 255,
              g: Math.max(70, Math.min(150, Math.round(115 * flickerNoise))),
              b: Math.max(10, Math.min(35, Math.round(18 * flickerNoise))),
            };
            break;
          }

          case 0xb1: {
            // Cozy Fireplace Glowing Embers: deep warm coals shifting between crimson, amber & gold
            const emberSine = (Math.sin(step * 0.12) + 1) / 2;
            const goldSine = (Math.cos(step * 0.08) + 1) / 2;
            targetColor = {
              r: Math.round(214 + 41 * goldSine),
              g: Math.round(40 + 95 * emberSine),
              b: Math.round(10 + 20 * goldSine),
            };
            break;
          }

          case 0xb2: {
            // Thunderstorm Lightning Surge: dark ambient backdrop interrupted by sudden multi-flashes
            const strikePhase = step % 45;
            if (strikePhase === 1 || strikePhase === 3 || strikePhase === 7) {
              // Triple lightning flash
              targetColor = { r: 255, g: 255, b: 255 };
            } else if (strikePhase === 2 || strikePhase === 4) {
              targetColor = { r: 70, g: 85, b: 180 };
            } else {
              targetColor = { r: 6, g: 8, b: 24 }; // Moody deep dark blue ambient
            }
            break;
          }

          case 0xb3: {
            // Sunset Golden Hour to Twilight
            const cycle = (step * 0.04) % 4;
            const sub = cycle % 1;
            const sunsetCols = [
              { r: 255, g: 183, b: 3 },   // Golden solar
              { r: 251, g: 133, b: 0 },   // Fiery orange
              { r: 114, g: 9, b: 183 },   // Dusk violet
              { r: 40, g: 8, b: 80 },     // Twilight midnight
            ];
            const i1 = Math.floor(cycle);
            const i2 = (i1 + 1) % 4;
            const c1 = sunsetCols[i1];
            const c2 = sunsetCols[i2];
            targetColor = {
              r: Math.round(c1.r + (c2.r - c1.r) * sub),
              g: Math.round(c1.g + (c2.g - c1.g) * sub),
              b: Math.round(c1.b + (c2.b - c1.b) * sub),
            };
            break;
          }

          case 0xb4: {
            // Deep Sleep 4-7-8 Breathing: 4s inhale, 7s hold, 8s exhale
            const phase = (step * 0.05) % 19;
            let level = 0.1;
            if (phase < 4) {
              // 4s Inhale glow
              level = 0.1 + (phase / 4) * 0.75;
            } else if (phase < 11) {
              // 7s Hold
              level = 0.85;
            } else {
              // 8s Exhale dim
              level = 0.85 - ((phase - 11) / 8) * 0.75;
            }
            const sleepBase = { r: 69, g: 123, b: 157 };
            targetColor = {
              r: Math.round(sleepBase.r * level),
              g: Math.round(sleepBase.g * level),
              b: Math.round(sleepBase.b * level),
            };
            break;
          }

          case 0xb5: {
            // Police Pursuit Interceptor Strobe: 3 red pulses, pause, 3 blue pulses, pause
            const sub = step % 16;
            if (sub === 0 || sub === 2 || sub === 4) {
              targetColor = { r: 255, g: 0, b: 0 }; // Red flash
            } else if (sub === 8 || sub === 10 || sub === 12) {
              targetColor = { r: 0, g: 70, b: 255 }; // Blue flash
            } else {
              targetColor = { r: 2, g: 2, b: 2 }; // Dim between flashes; avoid controller power-off behavior
            }
            break;
          }

          case 0xb6: {
            // Cyberpunk Neon Alternator: Cyan & Magenta rapid alternation
            const neonPulse = step % 4 < 2;
            targetColor = neonPulse
              ? { r: 0, g: 255, b: 255 }   // Cyber Cyan
              : { r: 255, g: 0, b: 127 };  // Hot Neon Magenta
            break;
          }

          case 0xb7: {
            // Matrix Cyber Rain: dark terminal emerald backdrop with laser green surges
            const matrixBeat = step % 6;
            if (matrixBeat === 0) {
              targetColor = { r: 0, g: 255, b: 65 }; // Laser green strobe
            } else {
              targetColor = { r: 0, g: Math.round(35 + Math.random() * 25), b: 0 }; // Dark terminal
            }
            break;
          }

          case 0xb8: {
            // Aurora Borealis Glacial Flow
            const wave = (Math.sin(step * 0.08) + 1) / 2;
            targetColor = {
              r: Math.round(16 + 120 * (1 - wave)),
              g: Math.round(182 + 50 * wave),
              b: Math.round(214 + 40 * Math.cos(step * 0.05)),
            };
            break;
          }

          case 0xb9: {
            // Lava Molten Magma Pulse
            const lavaBreath = (Math.sin(step * 0.1) + 1) / 2;
            targetColor = {
              r: Math.round(220 + 35 * lavaBreath),
              g: Math.round(38 + 50 * lavaBreath),
              b: Math.round(12),
            };
            break;
          }
        }
      }

      // Update React State for active fixture
      setDevices((curr) =>
        curr.map((d) => (d.id === activeDeviceId ? { ...d, color: targetColor } : d))
      );

      // ACTIVE BLUETOOTH STREAMING:
      // For software engine modes (or special styles), stream real-time RGB packets over BLE to physical strips!
    // These patterns are authored in the app; do not rely on controller
    // firmware mode IDs for effects whose timing/colors vary by model.
    if (mode.isSoftwareEngine || mode.category === 'Strobe' || !activeDevice.isRealBluetooth) {
        const now = performance.now();
        if (now - lastBleStreamTime.current >= (isFlashStyle ? intervalMs : 65)) {
          lastBleStreamTime.current = now;
          devices.forEach((dev) => {
            if ((dev.id === activeDeviceId || allSynced) && dev.isRealBluetooth && dev.bleCharacteristic && dev.power) {
              sendLotusPacket(
                dev.bleCharacteristic,
                buildLotusPacket('color', targetColor.r, targetColor.g, targetColor.b)
              );
            }
          });
        }
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [masterPower, activeDevice.modeId, activeDevice.speed, activeDeviceId, devices]);

  // Toggle between Whole-Strip (single color at a time) and Addressable (multi-color IC)
  const toggleDeviceHardwareType = useCallback(
    (id: string) => {
      playClickSound(900);
      setDevices((curr) =>
        curr.map((d) => {
          if (d.id === id) {
            const nextType = d.hardwareType === 'whole-strip' ? 'addressable' : 'whole-strip';
            return { ...d, hardwareType: nextType };
          }
          return d;
        })
      );
    },
    [playClickSound]
  );

  // Add / Remove Devices
  const addDevice = useCallback((dev: LedDevice) => {
    setDevices((curr) => [...curr, dev]);
  }, []);

  const removeDevice = useCallback(
    (id: string) => {
      setDevices((curr) => curr.filter((d) => d.id !== id));
      if (activeDeviceId === id) {
        setActiveDeviceId(devices[0]?.id || '');
      }
    },
    [activeDeviceId, devices]
  );

  // Schedule management
  const toggleSchedule = useCallback(
    (id: string) => {
      playClickSound(650);
      setSchedules((curr) =>
        curr.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
      );
    },
    [playClickSound]
  );

  const addSchedule = useCallback(
    (sch: Omit<ScheduleItem, 'id'>) => {
      playClickSound(800);
      const newSch: ScheduleItem = {
        ...sch,
        id: `sch-${Date.now()}`,
      };
      setSchedules((curr) => [...curr, newSch]);
    },
    [playClickSound]
  );

  const deleteSchedule = useCallback(
    (id: string) => {
      playClickSound(500);
      setSchedules((curr) => curr.filter((s) => s.id !== id));
    },
    [playClickSound]
  );

  return {
    devices,
    activeDeviceId,
    setActiveDeviceId,
    activeDevice,
    masterPower,
    toggleMasterPower,
    toggleDevicePower,
    setColor,
    setBrightness,
    setDeviceBrightness,
    setColorTemp,
    setDynamicMode,
    setSpeed,
    allSynced,
    toggleSyncAll,
    handleAudioBeat,
    schedules,
    toggleSchedule,
    addSchedule,
    deleteSchedule,
    sleepRemainingSeconds,
    setSleepTimer,
    soundEnabled,
    toggleSound: () => setSoundEnabled((p) => !p),
    sensitivity,
    setSensitivity,
    addDevice,
    removeDevice,
    toggleDeviceHardwareType,
  };
}
