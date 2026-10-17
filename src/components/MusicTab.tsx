import React, { useEffect, useRef, useState } from 'react';
import { Disc3, FolderOpen, Pause, Play, Sliders, Volume2, Waves } from 'lucide-react';
import { AudioAnalysis, audioManager } from '../utils/audio';

interface MusicTabProps {
  onAudioBeat: (analysis: AudioAnalysis) => void;
  sensitivity: number;
  onSensitivityChange: (val: number) => void;
}

// Create short, loopable demo tones in memory so the demo player works without
// downloading audio files or contacting a third-party host.
function makeOfflineDemoTrack(frequency: number, beatHz: number) {
  const sampleRate = 8000;
  const duration = 2;
  const samples = sampleRate * duration;
  const bytes = new ArrayBuffer(44 + samples);
  const view = new DataView(bytes);
  const write = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  write(0, 'RIFF'); view.setUint32(4, 36 + samples, true); write(8, 'WAVE');
  write(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true);
  write(36, 'data'); view.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const beat = Math.pow(Math.max(0, Math.sin(Math.PI * ((t * beatHz) % 1))), 8);
    const tone = Math.sin(2 * Math.PI * frequency * t) * (0.18 + beat * 0.55);
    view.setUint8(44 + i, Math.max(0, Math.min(255, Math.round(128 + tone * 127))));
  }
  let binary = '';
  const data = new Uint8Array(bytes);
  for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i]);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

export const MusicTab: React.FC<MusicTabProps> = ({
  onAudioBeat,
  sensitivity,
  onSensitivityChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePresetTrack, setActivePresetTrack] = useState<string>('synthwave');
  const [customTrackName, setCustomTrackName] = useState<string | null>(null);
  const [musicMode, setMusicMode] = useState<'bass' | 'spectrum' | 'rhythm' | 'lounge'>('bass');
  const [systemAudioActive, setSystemAudioActive] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const systemAudioStreamRef = useRef<MediaStream | null>(null);

  const toggleSystemAudio = async () => {
    if (systemAudioStreamRef.current) {
      systemAudioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioManager.stop();
      systemAudioStreamRef.current = null;
      setSystemAudioActive(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true } as DisplayMediaStreamOptions);
      if (!audioManager.bindDisplayAudio(stream)) throw new Error('The selected source did not provide audio.');
      systemAudioStreamRef.current = stream;
      setSystemAudioActive(true);
      stream.getTracks().forEach((track) => track.addEventListener('ended', () => {
        systemAudioStreamRef.current = null;
        setSystemAudioActive(false);
        audioManager.stop();
      }, { once: true }));
      stream.getAudioTracks()[0]?.addEventListener('ended', () => setSystemAudioActive(false), { once: true });
    } catch (error) {
      console.warn('System audio capture unavailable:', error);
    }
  };

  // Synthesized web audio or sample audio data URL for immediate plug-and-play music
  const SAMPLE_TRACKS = [
    {
      id: 'synthwave',
      title: 'Neon Drift (Synthwave 120BPM)',
      artist: 'Lotus Studio Sessions',
      src: makeOfflineDemoTrack(110, 2),
    },
    {
      id: 'chill',
      title: 'Midnight Lo-Fi Chill',
      artist: 'Ambient Soundscape',
      src: makeOfflineDemoTrack(220, 1),
    },
    {
      id: 'techno',
      title: 'Cyber Pulse Kick (Peak Time)',
      artist: 'Club Resonance',
      src: makeOfflineDemoTrack(65, 2.5),
    },
  ];

  // Set up audio binding
  useEffect(() => {
    if (audioRef.current) {
      audioManager.bindAudioElement(audioRef.current);
    }
  }, [activePresetTrack]);

  // Handle local MP3 file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && audioRef.current) {
      const url = URL.createObjectURL(file);
      audioRef.current.src = url;
      audioRef.current.load();
      setCustomTrackName(file.name);
      setActivePresetTrack('custom');
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log('Audio play error:', err));
    }
  };

  // Continuous animation loop for FFT spectrum rendering and LED light reactivity
  useEffect(() => {
    const render = () => {
      const analysis = audioManager.getAnalysis(sensitivity);

      if (isPlaying || systemAudioActive) {
        onAudioBeat(analysis);
      }

      // Draw FFT Bars on Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const data = analysis.frequencyData;
          const barCount = 36;
          const barWidth = (canvas.width / barCount) - 2;

          for (let i = 0; i < barCount; i++) {
            const dataIdx = Math.floor((i / barCount) * (data.length / 2));
            const value = isPlaying ? (data[dataIdx] / 255) * (sensitivity / 50) : 0.05;
            const barHeight = Math.max(3, value * (canvas.height - 10));
            const x = i * (barWidth + 2);
            const y = canvas.height - barHeight;

            // Gradient bar
            const grad = ctx.createLinearGradient(0, canvas.height, 0, y);
            grad.addColorStop(0, '#4f46e5');
            grad.addColorStop(0.6, '#06b6d4');
            grad.addColorStop(1, '#ec4899');

            ctx.fillStyle = grad;
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, systemAudioActive, sensitivity, onAudioBeat]);

  const currentTrack =
    activePresetTrack === 'custom'
      ? { title: customTrackName || 'Custom Local Audio', artist: 'PC Local File' }
      : SAMPLE_TRACKS.find((t) => t.id === activePresetTrack) || SAMPLE_TRACKS[0];

  return (
    <div className="space-y-6">
      {/* Hidden HTML Audio Element */}
      <audio
        ref={audioRef}
        loop
        onEnded={() => setIsPlaying(false)}
        src={
          activePresetTrack === 'custom'
            ? undefined
            : SAMPLE_TRACKS.find((t) => t.id === activePresetTrack)?.src
        }
      />

      {/* Top Card: Audio Spectrum & Player */}
      <div className="p-6 app-card rounded-2xl border shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-indigo-500/30 ${isPlaying ? 'bg-indigo-600/20 text-indigo-400' : 'bg-[#151a29] text-slate-500'}`}>
              <Disc3 className={`w-6 h-6 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{currentTrack.title}</div>
              <div className="text-xs text-slate-400">{currentTrack.artist}</div>
            </div>
          </div>

          {/* Controls: Play/Pause, Upload File */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-[#161c2c] hover:bg-[#1d253b] text-slate-300 border border-slate-700/80 rounded-lg cursor-pointer transition-colors">
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Load PC Audio</span>
              <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={togglePlay}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-md cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? 'Pause LED Sync' : 'Start Music Sync'}</span>
            </button>
            <button onClick={toggleSystemAudio} className="px-3 py-2 text-xs rounded-lg border border-slate-700 bg-[#161c2c] text-slate-200">
              {systemAudioActive ? 'Stop Speaker Sync' : 'Sync Spotify / Speakers'}
            </button>
          </div>
        </div>

        {/* Real-time Frequency Spectrum Visualizer */}
        <div className="p-4 bg-[#0a0d14] rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-indigo-400" />
              FFT Audio Frequency Equalizer
            </span>
            <span className="font-mono text-slate-400">
              {isPlaying ? 'Live Real-Time Audio Reactivity' : 'Player Inactive'}
            </span>
          </div>

          <canvas
            ref={canvasRef}
            width={720}
            height={110}
            className="w-full h-28 rounded-lg block"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
            <span>20Hz Sub-Bass</span>
            <span>250Hz Mid-Range</span>
            <span>2.5kHz Presence</span>
            <span>16kHz High Treble</span>
          </div>
        </div>

        {/* Audio Sensitivity Slider */}
        <div className="p-4 bg-[#141926] rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Music Reactivity & Beat Sensitivity
            </span>
            <span className="font-mono text-xs font-semibold text-indigo-400 tabular-nums">
              {sensitivity}%
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            value={sensitivity}
            onChange={(e) => onSensitivityChange(Number(e.target.value))}
            className="w-full"
            style={{
              background: `linear-gradient(to right, #1e2536 0%, #6366f1 ${sensitivity}%, #1e2536 ${sensitivity}%)`,
            }}
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
            <span>Low (Gentle Ambient)</span>
            <span>Normal Rhythm</span>
            <span>High (Aggressive Beat Detection)</span>
          </div>
        </div>
      </div>

      {/* Preset Music Tracks */}
      <div className="p-5 app-card rounded-2xl border shadow-xl space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Built-in Demo Soundtracks
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_TRACKS.map((track) => {
            const isSelected = activePresetTrack === track.id;
            return (
              <button
                key={track.id}
                onClick={() => {
                  setActivePresetTrack(track.id);
                  if (audioRef.current) {
                    audioRef.current.src = track.src;
                    audioRef.current.load();
                    if (isPlaying) {
                      audioRef.current.play().catch(() => {});
                    }
                  }
                }}
                className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/20 border-indigo-500/80 ring-1 ring-indigo-500/50'
                    : 'bg-[#141926] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold text-slate-200 truncate">{track.title}</div>
                <div className="text-[11px] text-slate-400">{track.artist}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
