import React, { useEffect, useState } from 'react';
import { Monitor, MonitorOff } from 'lucide-react';
import { AudioAnalysis } from '../utils/audio';
import { RgbColor } from '../types/led';
import { rgbToHex } from '../utils/color';

declare global {
  interface Window {
    ambilightCapture?: {
      start: () => Promise<boolean>;
      stop: () => Promise<boolean>;
      onColor: (callback: (color: RgbColor) => void) => () => void;
    };
  }
}

interface MicTabProps {
  onMicBeat: (analysis: AudioAnalysis) => void;
  onScreenColor: (color: RgbColor) => void;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
}

export const MicTab: React.FC<MicTabProps> = ({ onScreenColor }) => {
  const [sharing, setSharing] = useState(false);
  const [currentColor, setCurrentColor] = useState<RgbColor | null>(null);
  const [message, setMessage] = useState('Start Ambilight to follow the primary display.');

  const stop = () => {
    void window.ambilightCapture?.stop();
    setSharing(false);
    setMessage('Ambilight stopped.');
  };

  const start = async () => {
    try {
      if (!window.ambilightCapture) throw new Error('Screen capture is available in the desktop app only.');
      await window.ambilightCapture.start();
      setSharing(true);
      setMessage('Following the primary display.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not capture the primary display.');
    }
  };

  useEffect(() => {
    if (!sharing || !window.ambilightCapture) return;
    return window.ambilightCapture.onColor((color) => {
      setCurrentColor(color);
      onScreenColor(color);
    });
  }, [sharing, onScreenColor]);

  useEffect(() => () => { void window.ambilightCapture?.stop(); }, []);

  return (
    <div className="space-y-5">
      <div className="app-card rounded-2xl border p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-white">Screen Ambilight</h2>
            <p className="text-sm text-slate-400 mt-1">LED color follows the dominant color on the primary display.</p>
          </div>
          <button onClick={sharing ? stop : start} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white flex items-center gap-2">
            {sharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
            {sharing ? 'Stop Ambilight' : 'Start Ambilight'}
          </button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-400">{message}</p>
          {currentColor && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-4 w-4 rounded-full border border-white/30" style={{ backgroundColor: rgbToHex(currentColor) }} />
              <span className="font-mono">{rgbToHex(currentColor).toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
