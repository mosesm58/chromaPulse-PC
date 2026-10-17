import React from 'react';
import {
  Activity,
  Bluetooth,
  ChevronLeft,
  ChevronRight,
  Clock,
  Disc3,
  Monitor,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Power,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ActiveTab, AppTheme, LedDevice } from '../types/led';
import { rgbToHex } from '../utils/color';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  masterPower: boolean;
  onToggleMasterPower: () => void;
  activeDevice: LedDevice;
  allDevices: LedDevice[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  theme: AppTheme;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  masterPower,
  onToggleMasterPower,
  activeDevice,
  allDevices,
  isCollapsed,
  onToggleCollapse,
  theme,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'color',
      label: 'Color Wheel',
      icon: <Palette className="w-4 h-4 shrink-0" />,
      desc: 'HSV wheel & luminance',
    },
    {
      id: 'style',
      label: 'Dynamic Styles',
      icon: <Zap className="w-4 h-4 shrink-0" />,
      desc: 'Strobes & creative modes',
    },
    {
      id: 'music',
      label: 'Music Sync',
      icon: <Disc3 className="w-4 h-4 shrink-0" />,
      desc: 'FFT audio reactivity',
    },
    {
      id: 'mic',
      label: 'Ambilight',
      icon: <Monitor className="w-4 h-4 shrink-0" />,
      desc: 'Screen color lighting',
    },
    {
      id: 'schedule',
      label: 'Schedules',
      icon: <Clock className="w-4 h-4 shrink-0" />,
      desc: 'Automated timers & sleep',
    },
    {
      id: 'devices',
      label: 'Device Rack',
      icon: <Bluetooth className="w-4 h-4 shrink-0" />,
      desc: `${allDevices.length} devices connected`,
    },
  ];

  const activeHex = rgbToHex(activeDevice.color);

  // Theme styling helpers
  const isLight = theme === 'light';
  const isGrey = theme === 'grey';

  const sidebarBg = isLight
    ? 'bg-slate-50 border-r border-slate-200 text-slate-800'
    : isGrey
    ? 'bg-[#202225] border-r border-[#36393f] text-slate-100'
    : 'bg-[#08090d] border-r border-[#1a1d29] text-slate-100';

  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
    : isGrey
    ? 'bg-[#282b30] border-[#36393f] text-slate-200'
    : 'bg-[#0e1017] border-[#1c202e] text-slate-200';

  return (
    <aside
      className={`h-full flex flex-col justify-between select-none shrink-0 transition-all duration-300 ease-in-out relative z-30 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${sidebarBg}`}
    >
      {/* Top Brand & Master Power Section */}
      <div className={`p-3 space-y-3 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        {/* Sidebar Collapse Control */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <span className="text-xs font-semibold text-slate-500">{!isCollapsed && 'LED STUDIO'}</span>

          {/* Collapse/Expand Toggle Button */}
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isLight
                  ? 'hover:bg-slate-200 border-slate-300 text-slate-600'
                  : 'hover:bg-slate-800 border-slate-700/80 text-slate-400 hover:text-white'
              }`}
              title="Collapse sidebar into compact rail"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isLight
                ? 'hover:bg-slate-200 border-slate-300 text-slate-600'
                : 'hover:bg-slate-800 border-slate-700/80 text-slate-400 hover:text-white'
            }`}
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {/* Master Power Toggle Button */}
        {isCollapsed ? (
          <button
            onClick={onToggleMasterPower}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              masterPower
                ? 'bg-emerald-500 text-white shadow-[0_0_14px_rgba(16,185,129,0.5)] border-emerald-400'
                : isLight
                ? 'bg-slate-200 border-slate-300 text-slate-400 hover:text-slate-700'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title={masterPower ? 'Master Power: ON (Click to turn OFF)' : 'Master Power: STANDBY (Click to turn ON)'}
          >
            <Power className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onToggleMasterPower}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer shadow-sm ${
              masterPower
                ? 'bg-emerald-950/25 border-emerald-500/50 text-emerald-400'
                : isLight
                ? 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                : 'bg-[#12141c] border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  masterPower ? 'bg-emerald-500 text-white shadow-[0_0_10px_#10b981]' : 'bg-slate-700/60 text-slate-400'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
              </div>
              <div className="text-left truncate">
                <div className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {masterPower ? 'Hardware Power ON' : 'Power STANDBY'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {masterPower ? 'Transmitting Live BLE' : 'Strip suspended'}
                </div>
              </div>
            </div>

            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                masterPower ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-slate-500'
              }`}
            />
          </button>
        )}

        {/* Active Target Device Quick Indicator */}
        {isCollapsed ? (
          <div
            onClick={() => onTabChange('devices')}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center cursor-pointer transition-transform hover:scale-105 ${cardBg}`}
            title={`Active: ${activeDevice.name} (${activeDevice.brightness}%)`}
          >
            <div
              className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
              style={{
                backgroundColor: masterPower ? activeHex : '#64748b',
                boxShadow: masterPower ? `0 0 8px ${activeHex}` : undefined,
              }}
            />
          </div>
        ) : (
          <div
            onClick={() => onTabChange('devices')}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-between ${cardBg}`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/40 shadow-sm"
                style={{
                  backgroundColor: masterPower ? activeHex : '#64748b',
                  boxShadow: masterPower ? `0 0 8px ${activeHex}` : undefined,
                }}
              />
              <div className="truncate">
                <div className={`text-xs font-medium truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  {activeDevice.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{activeDevice.location}</div>
              </div>
            </div>

            <span className="text-[10px] font-mono text-indigo-400 font-semibold shrink-0 ml-1">
              {activeDevice.brightness}%
            </span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <nav className={`px-2 py-2 space-y-1 flex-1 overflow-y-auto ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        {!isCollapsed && (
          <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Studio Navigation
          </div>
        )}

        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          if (isCollapsed) {
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : isLight
                    ? 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                title={item.label}
              >
                {item.icon}
                {isActive && (
                  <span className="absolute -left-1 top-2 bottom-2 w-1 rounded-r bg-indigo-400" />
                )}
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40 font-semibold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <div className="truncate">
                  <div className={`text-xs ${isActive ? 'text-white font-semibold' : ''}`}>{item.label}</div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {item.desc}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </nav>

    </aside>
  );
};
