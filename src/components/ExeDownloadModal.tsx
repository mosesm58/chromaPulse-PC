import React, { useState } from 'react';
import {
  Archive,
  Check,
  Copy,
  Download,
  FileCode,
  HardDrive,
  Laptop,
  Monitor,
  Package,
  Play,
  ShieldCheck,
  Terminal,
  X,
} from 'lucide-react';
import { downloadCompleteProjectZip, downloadStandaloneOfflineHtml } from '../utils/localExporter';

interface ExeDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallPwa?: () => void;
  canInstallPwa?: boolean;
}

export const ExeDownloadModal: React.FC<ExeDownloadModalProps> = ({
  isOpen,
  onClose,
  onInstallPwa,
  canInstallPwa,
}) => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingHtml, setDownloadingHtml] = useState(false);
  const [downloadingBat, setDownloadingBat] = useState(false);

  if (!isOpen) return null;

  // Handle Standalone Offline HTML download
  const handleDownloadStandalone = () => {
    setDownloadingHtml(true);
    downloadStandaloneOfflineHtml();
    setTimeout(() => setDownloadingHtml(false), 2000);
  };

  // Handle Full Project ZIP download
  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    await downloadCompleteProjectZip();
    setTimeout(() => setDownloadingZip(false), 2000);
  };

  // Handle Launcher script download
  const handleDownloadLauncher = () => {
    setDownloadingBat(true);
    const appUrl = window.location.origin;
    const script = `@echo off
title Chroma Pulse - Smart LED Studio
echo Launching Chroma Pulse Desktop App...

:: Try Edge App mode (Frameless Native Windows Window)
start msedge --app="${appUrl}" --window-size=1280,820

:: If Edge is not default, try Chrome App mode
if errorlevel 1 (
  start chrome --app="${appUrl}" --window-size=1280,820
)
`;
    const blob = new Blob([script], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ChromaPulse_Launcher.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloadingBat(false), 2000);
  };

  const copyQuickInstallCommand = () => {
    const cmd = `git clone <repo-url> chroma-pulse && cd chroma-pulse && npm install && npm run build && npx electron-builder`;
    navigator.clipboard.writeText(cmd);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0e1017] border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/40 p-1.5 flex items-center justify-center">
              <img src="/icon.svg" alt="Chroma Pulse" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Download & Run Chroma Pulse Locally
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                  Windows x64 / Standalone
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Run natively on your PC with full Web Bluetooth LE LED strip communication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option 1: Standalone Offline Single-File HTML / EXE Wrapper */}
        <div className="p-4 bg-gradient-to-br from-[#131622] to-[#0e1017] rounded-xl border border-indigo-500/40 space-y-3 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Standalone Offline App (.html)</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Instant Run · Zero Installs
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Single standalone offline app containing all color disc wheels, strobe modes, breathing effects, audio spectrum, and room simulator. Double-click to run locally anytime!
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadStandalone}
              disabled={downloadingHtml}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-2 shrink-0 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingHtml ? 'Generating...' : 'Download Standalone'}</span>
            </button>
          </div>
        </div>

        {/* Option 2: Windows 1-Click Desktop Launcher (.BAT / Shortcut) */}
        <div className="p-4 bg-[#11131c] rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-slate-800 text-cyan-400 rounded-xl border border-slate-700 shrink-0">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Windows Desktop App Launcher (.BAT)</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    Frameless Window
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Launches Chroma Pulse in a frameless native Windows desktop window without browser address bars, tabs, or bookmarks.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadLauncher}
              disabled={downloadingBat}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 text-cyan-400" />
              <span>{downloadingBat ? 'Generating...' : 'Download Launcher'}</span>
            </button>
          </div>
        </div>

        {/* Option 3: Complete Project Source ZIP */}
        <div className="p-4 bg-[#11131c] rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-slate-800 text-amber-400 rounded-xl border border-slate-700 shrink-0">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Complete Project ZIP (.zip)</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Full Source Code
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Includes the complete Vite + React + Tailwind + TypeScript codebase, Bluetooth utilities, and ready-to-run package.json.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadZip}
              disabled={downloadingZip}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span>{downloadingZip ? 'Packaging ZIP...' : 'Download Source ZIP'}</span>
            </button>
          </div>
        </div>

        {/* PWA Desktop Install */}
        {canInstallPwa && onInstallPwa && (
          <div className="p-4 bg-indigo-950/20 border border-indigo-700/50 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-indigo-400" />
              <div>
                <div className="text-xs font-semibold text-white">Install to Windows Start Menu & Desktop</div>
                <div className="text-[11px] text-slate-400">Creates a native desktop icon and taskbar shortcut</div>
              </div>
            </div>
            <button
              onClick={onInstallPwa}
              className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
            >
              Install Desktop App
            </button>
          </div>
        )}

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
