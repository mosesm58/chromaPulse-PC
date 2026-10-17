import React, { useEffect, useRef, useState } from 'react';
import { Monitor, MonitorOff } from 'lucide-react';
import { AudioAnalysis } from '../utils/audio';
import { RgbColor } from '../types/led';
import { audioManager } from '../utils/audio';

interface MicTabProps {
  onMicBeat: (analysis: AudioAnalysis) => void;
  onScreenColor: (color: RgbColor) => void;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
}

export const MicTab: React.FC<MicTabProps> = ({ onScreenColor, onMicBeat }) => {
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState('Share a screen or window to start Ambilight.');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number>(0);

  const stop = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setSharing(false);
    setMessage('Screen sharing stopped.');
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true } as DisplayMediaStreamOptions);
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      if (stream.getAudioTracks().length) audioManager.bindDisplayAudio(stream);
      setSharing(true);
      setMessage(stream.getAudioTracks().length
        ? 'Ambilight is sampling your screen; shared system audio is available for beat analysis.'
        : 'Ambilight is sampling your screen. Select a screen and enable system audio to analyze music.');
      stream.getVideoTracks()[0].addEventListener('ended', stop, { once: true });
    } catch {
      setMessage('Screen capture was cancelled or denied. Choose a screen or window when prompted.');
    }
  };

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 27;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const sample = () => {
      const video = videoRef.current;
      if (sharing && video && context && video.readyState >= 2) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (brightness > 18) { r += data[i]; g += data[i + 1]; b += data[i + 2]; count++; }
        }
        if (count) {
          const color = { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
          onScreenColor(color);
        }
      }
      frameRef.current = window.setTimeout(sample, 250);
    };
    sample();
    return () => window.clearTimeout(frameRef.current);
  }, [sharing, onScreenColor]);

  useEffect(() => {
    if (!sharing) return;
    const timer = window.setInterval(() => onMicBeat(audioManager.getAnalysis(65)), 80);
    return () => window.clearInterval(timer);
  }, [sharing, onMicBeat]);

  useEffect(() => () => { audioManager.stop(); streamRef.current?.getTracks().forEach((track) => track.stop()); }, []);

  return <div className="space-y-5">
    <div className="app-card rounded-2xl border p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div><h2 className="font-semibold text-white">Screen Ambilight</h2><p className="text-sm text-slate-400 mt-1">LED color follows the dominant color on your shared screen.</p></div>
        <button onClick={sharing ? stop : start} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white flex items-center gap-2">
          {sharing ? <MonitorOff size={16}/> : <Monitor size={16}/>} {sharing ? 'Stop Ambilight' : 'Share Screen'}
        </button>
      </div>
      <p className="text-sm text-slate-400">{message}</p>
      <video ref={videoRef} muted playsInline className="w-full max-h-96 rounded-xl bg-black object-contain" />
    </div>
  </div>;
};
