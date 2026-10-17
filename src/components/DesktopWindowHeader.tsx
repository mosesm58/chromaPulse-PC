import React, { useState } from 'react';
import {
  ChevronDown,
  Cpu,
  Maximize2,
  Minimize2,
  Minus,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { AppTheme, LedDevice } from '../types/led';
import { rgbToHex } from '../utils/color';

interface DesktopWindowHeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  devices: LedDevice[];
  activeDeviceId: string;
  onSelectDevice: (id: string) => void;
  onToggleHardwareType: (id: string) => void;
  masterPower: boolean;
}

export const DesktopWindowHeader: React.FC<DesktopWindowHeaderProps> = ({
  soundEnabled,
  onToggleSound,
  theme,
  onThemeChange,
  isSidebarCollapsed,
  onToggleSidebar,
  devices,
  activeDeviceId,
  onSelectDevice,
  onToggleHardwareType,
  masterPower,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const activeDevice = devices.find((d) => d.id === activeDeviceId) || devices[0];
  const activeHex = rgbToHex(activeDevice?.color || { r: 99, g: 102, b: 241 });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleClose = () => {
    if (window.confirm('Chroma Pulse is running and maintaining live LED sync. Minimize to Windows System Tray?')) {
      setIsMinimized(true);
    }
  };

  const isLight = theme === 'light';
  const isGrey = theme === 'grey';

  const headerBg = isLight
    ? 'bg-white border-b border-slate-200 text-slate-800'
    : isGrey
    ? 'bg-[#202225] border-b border-[#36393f] text-slate-100'
    : 'bg-[#08090d] border-b border-[#1a1d29] text-slate-100';

  return (
    <>
      <header className={`h-11 px-3.5 flex items-center justify-between select-none z-40 text-xs shrink-0 transition-colors ${headerBg}`}>
        {/* Left: Sidebar Toggle + Chroma Pulse Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isLight
                ? 'hover:bg-slate-100 border-slate-200 text-slate-600'
                : 'hover:bg-slate-800 border-slate-700/80 text-slate-300'
            }`}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
          </button>

        </div>

        {/* Center: Active Fixture Quick Selector & Profile */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-700/40 bg-slate-800/30">
            <span className="text-[11px] text-slate-400 font-medium">Fixture:</span>
            <div className="relative">
              <select
                value={activeDeviceId}
                onChange={(e) => onSelectDevice(e.target.value)}
                className={`bg-transparent text-xs font-semibold rounded pr-6 appearance-none cursor-pointer focus:outline-none ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 top-1 pointer-events-none" />
            </div>

            {/* Live Color Swatch */}
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/50 ml-1 transition-all"
              style={{
                backgroundColor: masterPower ? activeHex : '#64748b',
                boxShadow: masterPower ? `0 0 8px ${activeHex}` : undefined,
              }}
              title={`Color: ${activeHex.toUpperCase()}`}
            />
          </div>

          {/* Quick Hardware Mode Switch (Whole Strip vs ARGB) */}
          <button
            onClick={() => onToggleHardwareType(activeDeviceId)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60 text-slate-300'
            }`}
            title="Click to toggle between Whole-Strip single color and Addressable multi-color"
          >
            <Cpu className="w-3 h-3 text-indigo-400" />
            <span>
              {activeDevice.hardwareType === 'whole-strip' ? 'Whole-Strip RGB (Uniform)' : 'Addressable ARGB'}
            </span>
          </button>
        </div>

        {/* Right: 3 Themes + Sound + .EXE Button + Windows Controls */}
        <div className="flex items-center gap-2">
          {/* 3 Themes Switcher */}
          <div
            className={`flex items-center p-0.5 rounded-lg border ${
              isLight ? 'bg-slate-100 border-slate-200' : isGrey ? 'bg-[#282b30] border-[#36393f]' : 'bg-[#12141c] border-slate-800'
            }`}
          >
            <button
              onClick={() => onThemeChange('dark')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                theme === 'dark'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Pitch Black Theme (OLED)"
            >
              <span>🌙</span>
              <span className="hidden lg:inline">Black</span>
            </button>

            <button
              onClick={() => onThemeChange('light')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                theme === 'light'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Clean White Theme"
            >
              <span>☀️</span>
              <span className="hidden lg:inline">White</span>
            </button>

            <button
              onClick={() => onThemeChange('grey')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                theme === 'grey'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Slate Graphite Theme"
            >
              <span>🔲</span>
              <span className="hidden lg:inline">Slate</span>
            </button>
          </div>

          {/* Sound FX Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={soundEnabled ? 'Mute feedback sounds' : 'Enable feedback sounds'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>


          {/* Windows Window Controls */}
          <div className="flex items-center ml-1">
            <button
              onClick={handleMinimize}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors cursor-pointer ${
                isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Minimize"
            >
              <Minus className="w-3 h-3" />
            </button>

            <button
              onClick={toggleFullscreen}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors cursor-pointer ${
                isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title={isFullscreen ? 'Restore' : 'Maximize (F11)'}
            >
              {isFullscreen ? <Minimize2 className="w-2.5 h-2.5" /> : <Maximize2 className="w-2.5 h-2.5" />}
            </button>

            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600 rounded transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      {/* Minimized Tray Banner Alert */}
      {isMinimized && (
        <div className="bg-indigo-950/90 border-b border-indigo-700/60 px-4 py-2 flex items-center justify-between text-xs text-indigo-200 z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Chroma Pulse is running in background maintaining Bluetooth LED sync.</span>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium cursor-pointer"
          >
            Restore Window
          </button>
        </div>
      )}
    </>
  );
};
