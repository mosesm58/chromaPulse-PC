import React, { useState } from 'react';
import { Eye, Monitor, Moon, Sun } from 'lucide-react';
import { RgbColor } from '../types/led';
import { rgbToHex } from '../utils/color';

interface RoomSimulatorProps {
  color: RgbColor;
  brightness: number;
  power: boolean;
  activeModeName?: string;
  isAudioReactive?: boolean;
  hardwareType?: 'whole-strip' | 'addressable';
}

export const RoomSimulator: React.FC<RoomSimulatorProps> = ({
  color,
  brightness,
  power,
  activeModeName,
  isAudioReactive,
  hardwareType = 'whole-strip',
}) => {
  const [isDarkRoom, setIsDarkRoom] = useState(true);
  const [viewMode, setViewMode] = useState<'desk' | 'room'>('desk');

  const hex = rgbToHex(color);
  const effectiveAlpha = power ? (brightness / 100) : 0;
  const glowStyle = {
    color: hex,
    boxShadow: power
      ? `0 0 ${40 * (brightness / 100)}px ${hex}99, 0 0 ${100 * (brightness / 100)}px ${hex}44`
      : 'none',
  };

  return (
    <div className="p-6 app-card rounded-2xl border shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">
              Live PC Battlestation & Room Simulator
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time optical ambient light reflection modeling wall bounce, monitor bias, and desk strip
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Room Ambient Light Day/Night Toggle */}
          <button
            onClick={() => setIsDarkRoom(!isDarkRoom)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#141926] hover:bg-[#1a2133] text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          >
            {isDarkRoom ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isDarkRoom ? 'Night Mode' : 'Daylight Ambient'}</span>
          </button>

          {/* View Toggle */}
          <div className="flex items-center p-0.5 bg-[#0e121c] rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('desk')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'desk' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Desk Setup
            </button>
            <button
              onClick={() => setViewMode('room')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'room' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Room
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Visual Canvas Area */}
      <div
        className={`relative w-full h-[360px] rounded-xl overflow-hidden border border-slate-800 transition-colors duration-500 flex items-center justify-center ${
          isDarkRoom ? 'bg-[#06080e]' : 'bg-[#181c26]'
        }`}
      >
        {/* Massive Ambient Wall Glow Bounce from Behind Monitor */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{
            background: power
              ? `radial-gradient(ellipse 65% 55% at 50% 45%, ${hex}${Math.round(
                  effectiveAlpha * 140
                ).toString(16).padStart(2, '0')} 0%, ${hex}${Math.round(
                  effectiveAlpha * 50
                ).toString(16).padStart(2, '0')} 45%, transparent 75%)`
              : 'none',
          }}
        />

        {/* Room Ceiling Cove Light if in room mode */}
        {viewMode === 'room' && (
          <div
            className="absolute top-0 left-0 right-0 h-10 transition-all duration-300 pointer-events-none"
            style={{
              background: power
                ? `linear-gradient(to bottom, ${hex}${Math.round(effectiveAlpha * 120).toString(16).padStart(2, '0')}, transparent)`
                : 'none',
            }}
          />
        )}

        {/* Simulated Battlestation Graphics */}
        <div className="relative z-10 w-full max-w-xl flex flex-col items-center">
          {/* Ultrawide Monitor */}
          <div className="relative flex flex-col items-center">
            {/* Ambient LED Bias Strip on back of monitor */}
            <div
              className="absolute -inset-2 rounded-2xl transition-all duration-200"
              style={{
                boxShadow: power
                  ? `0 0 ${50 * (brightness / 100)}px ${hex}, 0 0 ${120 * (brightness / 100)}px ${hex}88`
                  : 'none',
              }}
            />

            {/* Monitor Bezel */}
            <div className="relative w-72 sm:w-96 h-40 bg-[#0d0f17] border-2 border-slate-700/80 rounded-xl p-2 shadow-2xl flex flex-col justify-between overflow-hidden">
              {/* Screen Content - Code / IDE / Wallpaper */}
              <div className="w-full h-full bg-[#080a10] rounded-lg p-2.5 flex flex-col justify-between border border-slate-800/60 relative overflow-hidden">
                <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500/80" />
                    <div className="w-2 h-2 rounded-full bg-amber-500/80" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
                  </div>
                  <span>LOTUS_STUDIO.app</span>
                </div>

                <div className="text-center my-auto">
                  <div
                    className="font-mono text-xs font-bold tracking-wider transition-colors duration-150"
                    style={{ color: power ? hex : '#64748b' }}
                  >
                    {power ? (activeModeName || hex.toUpperCase()) : 'OFFLINE'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {power ? `${brightness}% LUMENS · SYNCED` : 'STANDBY'}
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px] font-mono text-slate-600">
                  <span>60 FPS</span>
                  <span>BLE 2.4GHz</span>
                </div>

                {/* Ambient screen reflection glow */}
                {power && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                      background: `linear-gradient(135deg, ${hex} 0%, transparent 60%)`,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Monitor Stand */}
            <div className="w-5 h-8 bg-slate-700 border-x border-slate-600" />
            <div className="w-24 h-2 bg-slate-600 rounded-sm shadow-md" />
          </div>

          {/* Desktop Surface */}
          <div className="w-full relative mt-1">
            {/* Desk Surface Plank */}
            <div className="w-full h-14 bg-[#111420] border-t border-slate-700/70 shadow-2xl rounded-t-lg relative flex items-center justify-center">
              {/* Desk Back LED Strip */}
              <div
                className="absolute top-0 left-0 right-0 h-1 transition-all duration-200"
                style={{
                  backgroundColor: power ? hex : '#1e2536',
                  boxShadow: power
                    ? `0 -4px ${20 * (brightness / 100)}px ${hex}, 0 0 ${10 * (brightness / 100)}px ${hex}`
                    : 'none',
                }}
              />

              {/* Keyboard & Mousepad */}
              <div className="flex items-center gap-4">
                {/* Mechanical Keyboard */}
                <div className="w-40 h-8 bg-[#0a0d14] rounded border border-slate-800 p-1 flex items-center justify-between shadow-inner relative">
                  {/* Keyboard Backlight */}
                  <div
                    className="absolute inset-0 rounded opacity-60 pointer-events-none transition-all duration-200"
                    style={{
                      boxShadow: power ? `0 0 8px ${hex}` : 'none',
                    }}
                  />
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3.5 h-5 rounded-xs bg-[#161a26] border border-slate-700/60"
                      style={{
                        backgroundColor: power ? `${hex}33` : '#161a26',
                      }}
                    />
                  ))}
                </div>

                {/* Mouse */}
                <div
                  className="w-5 h-7 bg-[#0a0d14] rounded-full border border-slate-800 shadow-sm transition-all"
                  style={{
                    boxShadow: power ? `0 0 6px ${hex}88` : 'none',
                  }}
                />
              </div>

              {/* PC Tower Chassis (Right Side) */}
              <div className="absolute right-4 bottom-2 w-16 h-28 bg-[#0b0e17] border border-slate-700/80 rounded-sm p-1.5 shadow-2xl flex flex-col justify-between overflow-hidden">
                {/* Transparent Tempered Glass RGB Fans */}
                <div
                  className="w-7 h-7 rounded-full border border-slate-600 mx-auto flex items-center justify-center transition-all duration-200"
                  style={{
                    boxShadow: power ? `0 0 10px ${hex}` : 'none',
                    borderColor: power ? hex : '#475569',
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: power ? hex : '#334155' }}
                  />
                </div>

                <div
                  className="w-7 h-7 rounded-full border border-slate-600 mx-auto flex items-center justify-center transition-all duration-200"
                  style={{
                    boxShadow: power ? `0 0 10px ${hex}` : 'none',
                    borderColor: power ? hex : '#475569',
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: power ? hex : '#334155' }}
                  />
                </div>
              </div>
            </div>

            {/* Desk Front Edge LED Strip Underglow */}
            <div
              className="w-full h-1.5 transition-all duration-200 rounded-b-sm"
              style={{
                backgroundColor: power ? hex : '#151a26',
                boxShadow: power
                  ? `0 6px ${30 * (brightness / 100)}px ${hex}, 0 0 ${15 * (brightness / 100)}px ${hex}`
                  : 'none',
              }}
            />
          </div>
        </div>

        {/* Interactive Overlay Badge */}
        <div className="absolute bottom-3 left-3 bg-[#0a0d14]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-2.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: power ? hex : '#ef4444' }}
          />
          <span>{power ? `ACTIVE: ${hex.toUpperCase()} (${brightness}%)` : 'HARDWARE OFF'}</span>
          <span className="text-slate-600">|</span>
          <span className="text-indigo-400 font-sans">
            {hardwareType === 'whole-strip' ? 'Whole-Strip RGB' : 'ARGB Diode Mode'}
          </span>
        </div>
      </div>
    </div>
  );
};
