import React, { useEffect, useState } from 'react';
import {
  Activity,
  Bluetooth,
  ChevronDown,
  Clock,
  Disc3,
  Download,
  Flame,
  LayoutGrid,
  Mic,
  Monitor,
  Palette,
  Power,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ColorTab } from './components/ColorTab';
import { DesktopWindowHeader } from './components/DesktopWindowHeader';
import { DeviceManager } from './components/DeviceManager';
import { ExeDownloadModal } from './components/ExeDownloadModal';
import { MicTab } from './components/MicTab';
import { MusicTab } from './components/MusicTab';
import { RoomSimulator } from './components/RoomSimulator';
import { ScheduleTab } from './components/ScheduleTab';
import { Sidebar } from './components/Sidebar';
import { StyleTab } from './components/StyleTab';
import { LOTUS_MODES } from './data/modes';
import { useLedController } from './hooks/useLedController';
import { usePWAInstall } from './hooks/usePWAInstall';
import { ActiveTab, AppTheme } from './types/led';
import { rgbToHex } from './utils/color';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('color');
  const [isExeModalOpen, setIsExeModalOpen] = useState(false);
  const [showSimulator, setShowSimulator] = useState(true);

  // 3 Themes: 'dark' (OLED pitch black), 'light' (clean white), 'grey' (slate graphite)
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('chroma_pulse_theme') as AppTheme) || 'dark';
  });

  // Collapsible sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('chroma_pulse_sidebar_collapsed') === 'true';
  });

  const {
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
    toggleSound,
    sensitivity,
    setSensitivity,
    addDevice,
    removeDevice,
    toggleDeviceHardwareType,
  } = useLedController();

  const { isInstallable, install } = usePWAInstall();

  // Handle Theme Change
  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    localStorage.setItem('chroma_pulse_theme', newTheme);
    document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-grey');
    document.documentElement.classList.add(`theme-${newTheme}`);
    if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  useEffect(() => {
    document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-grey');
    document.documentElement.classList.add(`theme-${theme}`);
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  // Handle Sidebar Collapse Toggle
  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('chroma_pulse_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Keyboard Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space: Toggle Master Power (if not typing in input)
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        toggleMasterPower();
      }
      // Ctrl + B: Toggle Sidebar collapse
      if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleSidebar();
      }
      // Ctrl + 1-6 for tab switching
      if (e.ctrlKey) {
        if (e.key === '1') { e.preventDefault(); setActiveTab('color'); }
        if (e.key === '2') { e.preventDefault(); setActiveTab('style'); }
        if (e.key === '3') { e.preventDefault(); setActiveTab('music'); }
        if (e.key === '4') { e.preventDefault(); setActiveTab('mic'); }
        if (e.key === '5') { e.preventDefault(); setActiveTab('schedule'); }
        if (e.key === '6') { e.preventDefault(); setActiveTab('devices'); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMasterPower]);

  const activeMode = activeDevice.modeId
    ? LOTUS_MODES.find((m) => m.id === activeDevice.modeId)
    : undefined;

  const currentHex = rgbToHex(activeDevice.color);

  // Theme styling helpers
  const isLight = theme === 'light';
  const isGrey = theme === 'grey';

  const mainBgClass = isLight
    ? 'bg-white text-slate-900'
    : isGrey
    ? 'bg-[#18191c] text-slate-100'
    : 'bg-[#000000] text-slate-100';

  const subHeaderBg = isLight
    ? 'bg-slate-50 border-b border-slate-200 text-slate-700'
    : isGrey
    ? 'bg-[#202225] border-b border-[#36393f] text-slate-200'
    : 'bg-[#0a0b10] border-b border-[#1c202e] text-slate-200';

  const workspaceBg = isLight
    ? 'bg-slate-100/70'
    : isGrey
    ? 'bg-[#18191c]'
    : 'bg-[#000000]';

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden select-none font-sans relative ${mainBgClass} theme-${theme}`}
    >
      {/* Dynamic Ambient Reactive Aura Background Visual Effect */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 overflow-hidden"
        style={{
          opacity: masterPower && activeDevice.power ? 0.35 : 0.05,
        }}
      >
        <div
          className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full blur-[140px] transition-colors duration-300 animate-pulse-aura"
          style={{
            backgroundColor: currentHex,
          }}
        />
        <div
          className="absolute -bottom-[20%] -right-[10%] w-[50vw] h-[50vw] rounded-full blur-[160px] transition-colors duration-500"
          style={{
            backgroundColor: currentHex,
          }}
        />
      </div>

      {/* 1. Single Unified Chroma Pulse Desktop Header (Removed repetitive top bar!) */}
      <DesktopWindowHeader
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        theme={theme}
        onThemeChange={handleThemeChange}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        devices={devices}
        activeDeviceId={activeDeviceId}
        onSelectDevice={setActiveDeviceId}
        onToggleHardwareType={toggleDeviceHardwareType}
        masterPower={masterPower}
      />

      {/* 2. Main Body Split: Collapsible Left Sidebar + Central Work Area */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Left Studio Sidebar (Collapsible into clean rail) */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          masterPower={masterPower}
          onToggleMasterPower={toggleMasterPower}
          activeDevice={activeDevice}
          allDevices={devices}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          theme={theme}
        />

        {/* Central Workspace */}
        <main className={`flex-1 flex flex-col overflow-y-auto transition-colors duration-200 ${workspaceBg}`}>
          {/* Workspace Sub-Header: Active Target Selection & Quick Stats */}
          <div className={`px-6 py-2.5 flex items-center justify-between gap-4 shrink-0 ${subHeaderBg}`}>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Target:
              </span>

              {/* Target Device Dropdown Selector */}
              <div className="relative">
                <select
                  value={activeDeviceId}
                  onChange={(e) => setActiveDeviceId(e.target.value)}
                  className={`text-xs font-semibold rounded-lg px-3 py-1 pr-7 appearance-none cursor-pointer focus:outline-none border transition-colors ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-800'
                      : isGrey
                      ? 'bg-[#282b30] border-[#36393f] text-white'
                      : 'bg-[#10121a] border-slate-700/80 text-white'
                  }`}
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                      {d.name} ({d.location})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
              </div>

              {/* Hardware Profile Badge */}
              <button
                onClick={() => toggleDeviceHardwareType(activeDeviceId)}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                    : isGrey
                    ? 'bg-[#282b30] hover:bg-[#32363d] border-[#36393f] text-slate-200'
                    : 'bg-[#10121a] hover:bg-[#181b26] border-slate-700/80 text-slate-300'
                }`}
                title="Click to toggle between Whole-Strip single color and Addressable multi-color"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span>
                  {activeDevice.hardwareType === 'whole-strip'
                    ? 'Whole-Strip RGB (Synchronous)'
                    : 'Addressable ARGB'}
                </span>
              </button>

              {allSynced && (
                <span className="text-[11px] font-mono font-semibold text-cyan-400">
                  Sync: All Lights Mirroring
                </span>
              )}
            </div>

            {/* Right: Room Simulator Toggle & Quick Stats */}
            <div className="flex items-center gap-4 text-xs">
              <div className="hidden sm:flex items-center gap-2 text-slate-400">
                <span className="text-[11px]">Color:</span>
                <span className="font-mono font-bold text-xs" style={{ color: currentHex }}>
                  {currentHex.toUpperCase()}
                </span>
                <span
                  className="w-3 h-3 rounded-full border border-white/40 shadow-sm"
                  style={{ backgroundColor: currentHex }}
                />
              </div>

              <div className="hidden sm:flex items-center gap-2 text-slate-400">
                <span className="text-[11px]">Luminance:</span>
                <span className="font-mono text-amber-400 font-bold">{activeDevice.brightness}%</span>
              </div>

              <button
                onClick={() => setShowSimulator(!showSimulator)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  showSimulator
                    ? 'bg-indigo-600/20 border-indigo-500/60 text-indigo-400'
                    : isLight
                    ? 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
                    : 'bg-[#10121a] border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>{showSimulator ? 'Hide Battlestation' : 'Show Battlestation'}</span>
              </button>
            </div>
          </div>

          {/* Tab Content Panes with Framer Motion Animation */}
          <div className="p-6 space-y-6 flex-1 max-w-7xl w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {activeTab === 'color' && (
                  <ColorTab
                    color={activeDevice.color}
                    brightness={activeDevice.brightness}
                    colorTemp={activeDevice.colorTemp}
                    onColorChange={setColor}
                    onBrightnessChange={setBrightness}
                    onColorTempChange={setColorTemp}
                  />
                )}

                {activeTab === 'style' && (
                  <StyleTab
                    activeModeId={activeDevice.modeId}
                    speed={activeDevice.speed}
                    onSelectMode={setDynamicMode}
                    onSpeedChange={setSpeed}
                    hardwareType={activeDevice.hardwareType || 'whole-strip'}
                    onToggleHardwareType={() => toggleDeviceHardwareType(activeDeviceId)}
                    theme={theme}
                  />
                )}

                {activeTab === 'music' && (
                  <MusicTab
                    onAudioBeat={handleAudioBeat}
                    sensitivity={sensitivity}
                    onSensitivityChange={setSensitivity}
                  />
                )}

                {activeTab === 'mic' && (
                  <MicTab
                    onMicBeat={handleAudioBeat}
                    onScreenColor={setColor}
                    sensitivity={sensitivity}
                    onSensitivityChange={setSensitivity}
                  />
                )}

                {activeTab === 'schedule' && (
                  <ScheduleTab
                    schedules={schedules}
                    onToggleSchedule={toggleSchedule}
                    onAddSchedule={addSchedule}
                    onDeleteSchedule={deleteSchedule}
                    onSleepTimerSet={setSleepTimer}
                    sleepRemainingSeconds={sleepRemainingSeconds}
                  />
                )}

                {activeTab === 'devices' && (
                  <DeviceManager
                    devices={devices}
                    activeDeviceId={activeDeviceId}
                    onSelectDevice={setActiveDeviceId}
                    onToggleDevicePower={toggleDevicePower}
                    onDeviceBrightnessChange={setDeviceBrightness}
                    onAddDevice={addDevice}
                    onRemoveDevice={removeDevice}
                    onSyncAll={toggleSyncAll}
                    allSynced={allSynced}
                    onToggleHardwareType={toggleDeviceHardwareType}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Interactive PC Battlestation & Room Simulator */}
            {showSimulator && (
              <div className="pt-2">
                <RoomSimulator
                  color={activeDevice.color}
                  brightness={activeDevice.brightness}
                  power={masterPower && activeDevice.power}
                  activeModeName={activeMode?.name}
                  isAudioReactive={activeTab === 'music' || activeTab === 'mic'}
                  hardwareType={activeDevice.hardwareType || 'whole-strip'}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Windows Executable (.exe) Download & Standalone Launcher Modal */}
      <ExeDownloadModal
        isOpen={isExeModalOpen}
        onClose={() => setIsExeModalOpen(false)}
        canInstallPwa={isInstallable}
        onInstallPwa={install}
      />
    </div>
  );
}
