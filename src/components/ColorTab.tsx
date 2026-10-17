import React, { useState } from 'react';
import { BookmarkPlus, Flame, Moon, Sparkles, Sun, Trash2, Zap } from 'lucide-react';
import { RgbColor } from '../types/led';
import { LOTUS_PRESET_COLORS, MOOD_SCENES, hexToRgb, kelvinToRgb, rgbToHex } from '../utils/color';
import { ColorWheel } from './ColorWheel';

interface ColorTabProps {
  color: RgbColor;
  brightness: number;
  colorTemp: number;
  onColorChange: (color: RgbColor) => void;
  onBrightnessChange: (brightness: number) => void;
  onColorTempChange: (temp: number) => void;
}

export const ColorTab: React.FC<ColorTabProps> = ({
  color,
  brightness,
  colorTemp,
  onColorChange,
  onBrightnessChange,
  onColorTempChange,
}) => {
  const [savedColors, setSavedColors] = useState<string[]>([
    '#FF0055',
    '#00E5FF',
    '#9D00FF',
    '#FFB703',
    '#06D6A0',
  ]);
  const [customHex, setCustomHex] = useState(rgbToHex(color));

  const currentHex = rgbToHex(color);

  const handleSaveCurrentColor = () => {
    if (!savedColors.includes(currentHex)) {
      setSavedColors([currentHex, ...savedColors.slice(0, 11)]);
    }
  };

  const handleRemoveColor = (hexToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedColors(savedColors.filter((c) => c !== hexToRemove));
  };

  const handleHexSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^#[0-9A-F]{6}$/i.test(customHex)) {
      onColorChange(hexToRgb(customHex));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left/Center Column: Color Wheel & Real-time Hex */}
      <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 app-card rounded-2xl border shadow-xl">
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>HSV Color Disc</span>
          </div>
          <span className="font-mono text-xs text-slate-400 tabular-nums">
            R:{color.r} G:{color.g} B:{color.b}
          </span>
        </div>

        {/* Color Wheel Canvas */}
        <div className="my-2">
          <ColorWheel color={color} onChange={onColorChange} size={280} />
        </div>

        {/* Quick Hex & Color Pill */}
        <div className="mt-5 w-full flex items-center justify-between gap-3 p-3 app-card-subtle rounded-xl border">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg border border-white/30 shadow-sm transition-colors duration-150"
              style={{ backgroundColor: currentHex }}
            />
            <div>
              <div className="text-xs text-slate-400">Current Hex</div>
              <div className="font-mono text-sm font-bold tracking-wider">{currentHex.toUpperCase()}</div>
            </div>
          </div>

          <form onSubmit={handleHexSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              placeholder="#FFFFFF"
              maxLength={7}
              className="w-24 px-2.5 py-1.5 text-xs font-mono uppercase rounded-lg border focus:border-indigo-500 focus:outline-none app-card-subtle"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
            >
              Set
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Brightness, Warm/Cool Temp, Lotus Presets, Scenes */}
      <div className="lg:col-span-6 space-y-6">
        {/* Hardware Sliders: Brightness & Color Temp */}
        <div className="p-5 app-card rounded-2xl border shadow-xl space-y-5">
          {/* Brightness Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>LED Luminance / Brightness</span>
              </label>
              <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
                {brightness}%
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                type="range"
                min={1}
                max={100}
                value={brightness}
                onChange={(e) => onBrightnessChange(Number(e.target.value))}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, #6366f1 0%, #f59e0b ${brightness}%, rgba(148, 163, 184, 0.2) ${brightness}%)`,
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
              <span>1% (Night Dim)</span>
              <span>50%</span>
              <span>100% (Full Blast)</span>
            </div>
          </div>

          <div className="h-px bg-slate-700/30" />

          {/* Color Temperature (Kelvin) Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>White Balance / CCT Temperature</span>
              </label>
              <span className="font-mono text-xs font-bold text-orange-300 tabular-nums">
                {colorTemp}K
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                type="range"
                min={2200}
                max={6500}
                step={50}
                value={colorTemp}
                onChange={(e) => {
                  const temp = Number(e.target.value);
                  onColorTempChange(temp);
                  onColorChange(kelvinToRgb(temp));
                }}
                className="w-full"
                style={{
                  background: 'linear-gradient(to right, #ff8c00 0%, #ffc04d 30%, #fff4e6 65%, #cde8ff 100%)',
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
              <span>2200K (Candle)</span>
              <span>4000K (Natural)</span>
              <span>6500K (Daylight)</span>
            </div>
          </div>
        </div>

        {/* Lotus Lantern Official 12 Preset Swatches */}
        <div className="p-5 app-card rounded-2xl border shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Primary Preset Swatches
            </span>
            <span className="text-xs text-slate-400">12 Primary Hardware States</span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-6 gap-2.5">
            {LOTUS_PRESET_COLORS.map((preset) => {
              const hex = rgbToHex(preset.rgb);
              const isActive = currentHex.toLowerCase() === hex.toLowerCase();
              return (
                <button
                  key={preset.name}
                  onClick={() => onColorChange(preset.rgb)}
                  title={preset.name}
                  className={`group relative h-11 rounded-xl transition-all flex items-center justify-center cursor-pointer border ${
                    isActive ? 'border-white scale-105 shadow-lg' : 'border-slate-700/60 hover:border-white hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: hex,
                    boxShadow: isActive ? `0 0 14px ${hex}88` : undefined,
                  }}
                >
                  {isActive && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-md" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Saved Palette Slots */}
        <div className="p-5 app-card rounded-2xl border shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookmarkPlus className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Custom User Palette
              </span>
            </div>
            <button
              onClick={handleSaveCurrentColor}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>+ Save Active Color</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5 min-h-[44px] items-center">
            {savedColors.map((hex) => {
              const isActive = currentHex.toLowerCase() === hex.toLowerCase();
              return (
                <div
                  key={hex}
                  onClick={() => onColorChange(hexToRgb(hex))}
                  className={`group relative w-10 h-10 rounded-xl cursor-pointer transition-all border flex items-center justify-center ${
                    isActive ? 'border-white scale-105 shadow-md' : 'border-slate-700/60 hover:border-white'
                  }`}
                  style={{ backgroundColor: hex }}
                >
                  <button
                    onClick={(e) => handleRemoveColor(hex, e)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600/90 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-md transition-opacity cursor-pointer"
                    title="Delete swatch"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Mood Scenes */}
        <div className="p-5 app-card rounded-2xl border shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Curated Ambience Scenes
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {MOOD_SCENES.map((scene) => (
              <button
                key={scene.name}
                onClick={() => {
                  onColorChange(scene.rgb);
                  onBrightnessChange(scene.brightness);
                }}
                className="p-2.5 text-left app-card-subtle rounded-xl border transition-all cursor-pointer group hover:border-indigo-500"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: rgbToHex(scene.rgb) }}
                  />
                  <div className="text-xs font-semibold truncate">
                    {scene.name}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 leading-tight line-clamp-1">
                  {scene.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
