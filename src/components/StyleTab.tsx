import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Check,
  Cpu,
  Flame,
  Gauge,
  Info,
  Play,
  Radio,
  Sparkles,
  Zap,
} from 'lucide-react';
import { LOTUS_MODES } from '../data/modes';
import { AppTheme, DynamicMode } from '../types/led';

interface StyleTabProps {
  activeModeId: number | null;
  speed: number;
  onSelectMode: (modeId: number) => void;
  onSpeedChange: (speed: number) => void;
  hardwareType: 'whole-strip' | 'addressable';
  onToggleHardwareType: () => void;
  theme?: AppTheme;
}

export const StyleTab: React.FC<StyleTabProps> = ({
  activeModeId,
  speed,
  onSelectMode,
  onSpeedChange,
  hardwareType,
  onToggleHardwareType,
  theme = 'dark',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stripFrame, setStripFrame] = useState(0);

  const categories = ['All', 'Strobe', 'Special', 'Breathing', 'Gradient', 'Jump'];

  const filteredModes = LOTUS_MODES.filter(
    (m) => selectedCategory === 'All' || m.category === selectedCategory
  );

  const activeMode = LOTUS_MODES.find((m) => m.id === activeModeId) || LOTUS_MODES[0];

  // Animate the simulated LED strip bar according to mode and speed
  useEffect(() => {
    const intervalMs = Math.max(25, Math.floor(1000 / (speed * 0.5 + 6)));
    const interval = setInterval(() => {
      setStripFrame((prev) => (prev + 1) % 10000);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [speed]);

  // Compute color for the simulated LED strip and individual diodes
  const getDiodeColor = (index: number = 0, total: number = 28): string => {
    if (!activeMode) return '#6366f1';
    const colors = activeMode.colors;

    // WHOLE-STRIP HARDWARE: All LEDs MUST be the exact same uniform color across the entire strip!
    if (hardwareType === 'whole-strip') {
      if (activeMode.category === 'Jump') {
        const step = Math.floor(stripFrame / 6) % colors.length;
        return colors[step];
      } else if (activeMode.category === 'Gradient') {
        if (activeMode.id === 0x89) {
          const cycle = (stripFrame * 0.02) % colors.length;
          const index = Math.floor(cycle);
          const mix = cycle - index;
          const a = colors[index].slice(1).match(/.{2}/g)!.map((v) => parseInt(v, 16));
          const b = colors[(index + 1) % colors.length].slice(1).match(/.{2}/g)!.map((v) => parseInt(v, 16));
          return `#${a.map((v, i) => Math.round(v + (b[i] - v) * mix).toString(16).padStart(2, '0')).join('')}`;
        }
        return `hsl(${(stripFrame * 2) % 360}, 100%, 50%)`;
      } else if (activeMode.category === 'Strobe') {
        const isFlashOn = stripFrame % 2 === 0;
        if (activeMode.id === 0x92 || activeMode.id === 0x93) {
          const cIdx = Math.floor(stripFrame / 2) % colors.length;
          return isFlashOn ? colors[cIdx] : '#000000';
        }
        return isFlashOn ? colors[0] : '#000000';
      } else if (activeMode.category === 'Breathing') {
        const breathSine = (Math.sin(stripFrame * 0.16) + 1) / 2;
        const breathLevel = 0.12 + breathSine * 0.88;
        const baseHex = colors[0].replace('#', '');
        const r = Math.round(parseInt(baseHex.substring(0, 2), 16) * breathLevel);
        const g = Math.round(parseInt(baseHex.substring(2, 4), 16) * breathLevel);
        const b = Math.round(parseInt(baseHex.substring(4, 6), 16) * breathLevel);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      } else if (activeMode.category === 'Special') {
        switch (activeMode.id) {
          case 0xb0: {
            // Candlelight Flicker
            const flicker = 0.68 + Math.sin(stripFrame * 0.4) * 0.15 + ((stripFrame % 3) * 0.05);
            const g = Math.max(60, Math.min(150, Math.round(115 * flicker)));
            return `#ff${g.toString(16).padStart(2, '0')}12`;
          }
          case 0xb1: {
            // Fireplace Embers
            const goldSine = (Math.sin(stripFrame * 0.12) + 1) / 2;
            const r = Math.round(210 + 45 * goldSine);
            const g = Math.round(45 + 95 * goldSine);
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}14`;
          }
          case 0xb2: {
            // Thunderstorm Lightning
            const phase = stripFrame % 36;
            if (phase === 1 || phase === 3 || phase === 6) return '#ffffff';
            if (phase === 2 || phase === 4) return '#4f46e5';
            return '#060814';
          }
          case 0xb5: {
            // Police Pursuit
            const sub = stripFrame % 16;
            if (sub === 0 || sub === 2 || sub === 4) return '#ff0000';
            if (sub === 8 || sub === 10 || sub === 12) return '#0044ff';
            return '#000000';
          }
          case 0xb6: {
            // Cyberpunk
            return stripFrame % 4 < 2 ? '#00ffff' : '#ff007f';
          }
          case 0xb7: {
            // Matrix
            return stripFrame % 6 === 0 ? '#00ff41' : '#002808';
          }
          case 0xb8: {
            // Aurora
            const hue = 140 + Math.sin(stripFrame * 0.08) * 80;
            return `hsl(${hue}, 90%, 50%)`;
          }
          default: {
            const sub = Math.floor(stripFrame * 0.05) % colors.length;
            return colors[sub];
          }
        }
      } else {
        // Gradient
        if (activeMode.id === 0x89) {
          const rgbColors = ['#ff0000', '#00ff00', '#0044ff'];
          const idx = Math.floor(stripFrame * 0.05) % rgbColors.length;
          return rgbColors[idx];
        }
        const hue = (stripFrame * 3) % 360;
        return `hsl(${hue}, 100%, 50%)`;
      }
    }

    // MULTI-COLOR ADDRESSABLE (ARGB):
    if (activeMode.category === 'Jump') {
      const step = Math.floor(stripFrame / 4) % colors.length;
      return colors[step];
    } else if (activeMode.category === 'Strobe') {
      const flash = stripFrame % 2 === 0;
      return flash ? colors[stripFrame % colors.length] : '#000000';
    } else {
      const offset = (index / total) * colors.length + stripFrame * 0.1;
      const colorIdx = Math.floor(offset) % colors.length;
      return colors[colorIdx];
    }
  };

  const uniformCurrentColor = getDiodeColor(0, 28);
  const isLight = theme === 'light';
  const isGrey = theme === 'grey';

  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
    : isGrey
    ? 'bg-[#282b30] border-[#36393f] text-slate-100'
    : 'bg-[#0e1017] border-[#1c202e] text-slate-100';

  const innerBg = isLight ? 'bg-slate-50 border-slate-200' : isGrey ? 'bg-[#202225] border-[#36393f]' : 'bg-[#08090d] border-slate-800';

  return (
    <div className="space-y-5">
      {/* Hardware Profile Banner */}
      <div className={`p-4 rounded-2xl border shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBg}`}>
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Active Controller Profile:
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {hardwareType === 'whole-strip'
                  ? 'Whole-Strip RGB (Single Uniform Color at a Time)'
                  : 'Addressable ARGB (Multi-Color IC)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {hardwareType === 'whole-strip'
                ? 'Standard 4-pin 5050 RGB light strips. All Strobes, Candlelight, Lightning, and Breathing modes transition the ENTIRE strip synchronously.'
                : 'Digital IC addressable strips (WS2812B/DreamColor) capable of individual pixel chases.'}
            </p>
          </div>
        </div>

        <button
          onClick={onToggleHardwareType}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors shrink-0 cursor-pointer ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
          }`}
        >
          Switch to {hardwareType === 'whole-strip' ? 'Addressable ARGB' : 'Whole-Strip RGB'}
        </button>
      </div>

      {/* Top Banner: Dynamic LED Strip Simulation & Speed Controller */}
      <div className={`p-5 rounded-2xl border shadow-xl space-y-4 ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {activeMode ? activeMode.name : 'Select a Dynamic Style'}
              </h2>
              {activeMode?.isSoftwareEngine ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  Chroma Stream Engine
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Hardware 0x{activeMode?.id.toString(16).toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {activeMode?.description || 'Synchronous hardware PWM color patterns'}
            </p>
          </div>

          {/* Speed Hardware Slider */}
          <div className={`w-full sm:w-64 p-3 rounded-xl border ${innerBg}`}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className={`flex items-center gap-1.5 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                Cycle Speed
              </span>
              <span className="font-mono text-xs font-bold text-indigo-400 tabular-nums">
                {speed}%
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={speed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="w-full"
              style={{
                background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${speed}%, rgba(148, 163, 184, 0.2) ${speed}%)`,
              }}
            />
          </div>
        </div>

        {/* Live Whole-Strip Light Tube Simulation */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-mono">
            <span>
              Real-time Simulation ({hardwareType === 'whole-strip' ? 'Whole Strip Uniform' : '28 ARGB Diodes'})
            </span>
            <span>
              Color: {uniformCurrentColor.toUpperCase()} · Mode ID: 0x{activeMode.id.toString(16).toUpperCase()}
            </span>
          </div>

          {hardwareType === 'whole-strip' ? (
            /* Frosted 3D Acrylic Uniform Strip Bar */
            <div className={`p-3 rounded-xl border shadow-inner flex flex-col gap-2 ${innerBg}`}>
              <div
                className="w-full h-9 rounded-lg transition-all duration-75 relative overflow-hidden border border-white/20 shadow-lg"
                style={{
                  backgroundColor: uniformCurrentColor,
                  boxShadow: `0 0 30px ${uniformCurrentColor}bb, inset 0 1px 2px rgba(255,255,255,0.6)`,
                }}
              >
                {/* Specular reflection highlight */}
                <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-slate-400 px-1">
                <span>Pin 1 (+12V DC)</span>
                <span>Entire 150 Diodes Glow in Perfect Synchrony</span>
                <span>Strip End</span>
              </div>
            </div>
          ) : (
            /* Multi-diode array for ARGB */
            <div className={`p-3 rounded-xl border flex items-center justify-between gap-1 overflow-x-auto shadow-inner ${innerBg}`}>
              {Array.from({ length: 28 }).map((_, i) => {
                const diodeCol = getDiodeColor(i, 28);
                return (
                  <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                    <div
                      className="w-3.5 h-7 rounded-sm transition-all duration-75 shadow-sm"
                      style={{
                        backgroundColor: diodeCol,
                        boxShadow: `0 0 10px ${diodeCol}`,
                      }}
                    />
                    <span className="text-[8px] font-mono text-slate-500">{i + 1}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Category Segmented Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-md'
                : isLight
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            {cat === 'Strobe' ? '⚡ Strobe (Fixed)' : cat === 'Special' ? '✨ Special Styles (Fixed)' : cat}
          </button>
        ))}
      </div>

      {/* Grid of Dynamic Mode Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {filteredModes.map((mode) => {
          const isSelected = activeModeId === mode.id;

          return (
            <div
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${cardBg} ${
                isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-950/20'
                  : 'hover:border-slate-500/60 hover:-translate-y-0.5'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-indigo-400' : isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {mode.name}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  {mode.description}
                </p>
              </div>

              {/* Bottom Badges & Color Swatch */}
              <div className="pt-2 border-t border-slate-700/30 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1">
                    {mode.colors.slice(0, 4).map((c, idx) => (
                      <span
                        key={idx}
                        className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 font-semibold ml-1">
                    0x{mode.id.toString(16).toUpperCase()}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    mode.category === 'Strobe'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : mode.category === 'Special'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  }`}
                >
                  {mode.category}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
