import React, { useEffect, useRef, useState } from 'react';
import { Disc3, FolderOpen, Pause, Play, Sliders, Waves } from 'lucide-react';
import { AudioAnalysis, audioManager } from '../utils/audio';

interface MusicTabProps {
  onAudioBeat: (analysis: AudioAnalysis) => void;
  sensitivity: number;
  onSensitivityChange: (val: number) => void;
}

export const MusicTab: React.FC<MusicTabProps> = ({ onAudioBeat, sensitivity, onSensitivityChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [customTrackName, setCustomTrackName] = useState<string | null>(null);
  const [systemAudioActive, setSystemAudioActive] = useState(false);
  const [systemAudioMessage, setSystemAudioMessage] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const systemAudioStreamRef = useRef<MediaStream | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const toggleSystemAudio = async () => {
    if (systemAudioStreamRef.current) {
      systemAudioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioManager.stop();
      systemAudioStreamRef.current = null;
      setSystemAudioActive(false);
      setSystemAudioMessage('Speaker sync stopped.');
      return;
    }

    try {
      audioRef.current?.pause();
      setIsPlaying(false);
      // Start/resume the AudioContext directly in the click gesture before
      // awaiting the Windows screen/audio capture chooser.
      const audioContextReady = audioManager.prepare();
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true } as DisplayMediaStreamOptions);
      if (!stream.getAudioTracks().length || !(await audioContextReady) || !(await audioManager.bindDisplayAudio(stream))) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error('Windows did not provide loopback audio. Try again in the packaged desktop app.');
      }
      systemAudioStreamRef.current = stream;
      setSystemAudioActive(true);
      setSystemAudioMessage('Listening to Windows speaker output. Play Spotify or other audio to sync the LEDs.');
      stream.getTracks().forEach((track) => track.addEventListener('ended', () => {
        systemAudioStreamRef.current = null;
        setSystemAudioActive(false);
        audioManager.stop();
      }, { once: true }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'System audio capture was cancelled or unavailable.';
      setSystemAudioMessage(message);
      console.warn('System audio capture unavailable:', error);
    }
  };

  useEffect(() => {
    if (audioRef.current && customTrackName) audioManager.bindAudioElement(audioRef.current);
  }, [customTrackName]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    systemAudioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioManager.stop();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !audioRef.current) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    audioRef.current.src = url;
    audioRef.current.load();
    setCustomTrackName(file.name);
    setSystemAudioMessage('');
    audioManager.bindAudioElement(audioRef.current);
    audioRef.current.play().then(() => setIsPlaying(true)).catch((error) => {
      console.warn('Local audio playback failed:', error);
      setSystemAudioMessage('This audio file could not be played. Try another file format.');
    });
    event.target.value = '';
  };

  const togglePlay = () => {
    if (!audioRef.current || !customTrackName) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((error) => {
        setSystemAudioMessage(error instanceof Error ? error.message : 'Local audio playback failed.');
      });
    }
  };

  useEffect(() => {
    const render = () => {
      const analysis = audioManager.getAnalysis(sensitivity);
      const audioActive = isPlaying || systemAudioActive;
      if (audioActive) onAudioBeat(analysis);

      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (canvas && context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        const centerY = canvas.height / 2;
        const samples = analysis.waveformData;
        context.beginPath();
        for (let i = 0; i < samples.length; i++) {
          const x = (i / (samples.length - 1)) * canvas.width;
          const amplitude = audioActive ? (samples[i] - 128) / 128 : 0;
          const y = centerY + amplitude * canvas.height * 0.46;
          if (i === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.lineJoin = 'round';
        context.lineCap = 'round';
        context.strokeStyle = '#818cf8';
        context.lineWidth = 2;
        context.stroke();
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, systemAudioActive, sensitivity, onAudioBeat]);

  const audioActive = isPlaying || systemAudioActive;

  return (
    <div className="space-y-6">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

      <div className="p-6 app-card rounded-2xl border shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border border-indigo-500/30 ${audioActive ? 'bg-indigo-600/20 text-indigo-400' : 'bg-[#151a29] text-slate-500'}`}>
              <Disc3 className={`w-6 h-6 ${audioActive ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{customTrackName || 'No local track selected'}</div>
              <div className="text-xs text-slate-400">{systemAudioActive ? 'Syncing PC speaker output' : customTrackName ? 'Local audio file' : 'Load a file or sync PC audio'}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-[#161c2c] hover:bg-[#1d253b] text-slate-300 border border-slate-700/80 rounded-lg cursor-pointer transition-colors">
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Load PC Audio</span>
              <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={togglePlay}
              disabled={!customTrackName || systemAudioActive}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? 'Pause Local Sync' : 'Play Local Sync'}</span>
            </button>
            <button onClick={toggleSystemAudio} className="px-3 py-2 text-xs rounded-lg border border-slate-700 bg-[#161c2c] text-slate-200 hover:bg-[#1d253b]">
              {systemAudioActive ? 'Stop Speaker Sync' : 'Sync Spotify / Speakers'}
            </button>
          </div>
        </div>
        {systemAudioMessage && <p className={`text-xs ${systemAudioActive ? 'text-emerald-400' : 'text-slate-400'}`}>{systemAudioMessage}</p>}

        <div className="p-4 bg-[#0a0d14] rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5"><Waves className="w-3.5 h-3.5 text-indigo-400" />Live Audio Waveform</span>
            <span className="font-mono">{systemAudioActive ? 'PC speaker output' : isPlaying ? 'Local track' : 'Waiting for audio'}</span>
          </div>
          <canvas ref={canvasRef} width={1024} height={240} className="w-full h-56 rounded-lg block" />
          <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
            <span>Time-domain waveform</span><span>Visual follows live audio</span>
          </div>
        </div>

        <div className="p-4 bg-[#141926] rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="flex items-center gap-1.5 font-medium text-slate-300"><Sliders className="w-3.5 h-3.5 text-indigo-400" />Bass Beat Sensitivity</span>
            <span className="font-mono text-xs font-semibold text-indigo-400 tabular-nums">{sensitivity}%</span>
          </div>
          <input type="range" min={10} max={100} value={sensitivity} onChange={(e) => onSensitivityChange(Number(e.target.value))} className="w-full" style={{ background: `linear-gradient(to right, #1e2536 0%, #6366f1 ${sensitivity}%, #1e2536 ${sensitivity}%)` }} />
          <p className="text-[11px] text-slate-400 mt-2">Calibrate how strongly bass must rise to trigger a color change.</p>
          <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono"><span>Low: strong hits</span><span>High: softer bass hits</span></div>
        </div>
      </div>
    </div>
  );
};
