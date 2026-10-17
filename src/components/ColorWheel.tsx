import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HsvColor, RgbColor } from '../types/led';
import { hsvToRgb, rgbToHex, rgbToHsv } from '../utils/color';

interface ColorWheelProps {
  color: RgbColor;
  onChange: (rgb: RgbColor) => void;
  size?: number;
}

export const ColorWheel: React.FC<ColorWheelProps> = ({ color, onChange, size = 280 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hsv = rgbToHsv(color);

  // Draw the circular color disc
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const radius = size / 2;
    const center = radius;

    ctx.clearRect(0, 0, size, size);

    // Draw Hue ring + Saturation disc using radial lines
    for (let angle = 0; angle < 360; angle += 0.75) {
      const rad = (angle * Math.PI) / 180;
      const x = center + Math.cos(rad) * (radius - 2);
      const y = center + Math.sin(rad) * (radius - 2);

      const gradient = ctx.createLinearGradient(center, center, x, y);
      gradient.addColorStop(0, '#FFFFFF'); // Center is white (0% sat)
      gradient.addColorStop(1, `hsl(${angle}, 100%, 50%)`); // Edge is 100% saturated

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(x, y);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Outer subtle ring border
    ctx.beginPath();
    ctx.arc(center, center, radius - 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [size]);

  // Calculate position from HSV
  const radius = (size / 2) - 2;
  const center = size / 2;
  const rad = ((hsv.h || 0) * Math.PI) / 180;
  const dist = (hsv.s / 100) * (radius - 6);
  const handleX = center + Math.cos(rad) * dist;
  const handleY = center + Math.sin(rad) * dist;

  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left - center;
      const y = clientY - rect.top - center;

      const rawDist = Math.sqrt(x * x + y * y);
      const maxRadius = radius - 4;
      const clampedDist = Math.min(rawDist, maxRadius);

      let angle = (Math.atan2(y, x) * 180) / Math.PI;
      if (angle < 0) angle += 360;

      const sat = Math.round((clampedDist / maxRadius) * 100);
      const newHsv: HsvColor = {
        h: Math.round(angle),
        s: sat,
        v: 100, // value handled by brightness slider
      };

      const newRgb = hsvToRgb(newHsv);
      onChange(newRgb);
    },
    [center, radius, onChange]
  );

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handlePointer(e.clientX, e.clientY);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handlePointer(e.clientX, e.clientY);
      }
    };
    const onMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handlePointer]);

  return (
    <div className="relative flex flex-col items-center select-none">
      <div
        className="relative cursor-crosshair rounded-full shadow-2xl p-2 bg-[#121622]/90 border border-slate-800/80"
        onMouseDown={onMouseDown}
        onTouchStart={(e) => {
          setIsDragging(true);
          const t = e.touches[0];
          handlePointer(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          if (isDragging) {
            const t = e.touches[0];
            handlePointer(t.clientX, t.clientY);
          }
        }}
        onTouchEnd={() => setIsDragging(false)}
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="rounded-full block"
        />

        {/* Center glowing indicator */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
        >
          <div
            className="w-14 h-14 rounded-full border-2 border-white/90 shadow-xl transition-colors duration-150 flex items-center justify-center"
            style={{
              backgroundColor: rgbToHex(color),
              boxShadow: `0 0 20px ${rgbToHex(color)}88`,
            }}
          >
            <div className="w-3 h-3 rounded-full bg-white/70 shadow-sm" />
          </div>
        </div>

        {/* Draggable Selector Ring Handle */}
        <div
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
          style={{
            left: `${handleX + 8}px`,
            top: `${handleY + 8}px`,
          }}
        >
          <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-950/80 shadow-[0_0_12px_rgba(0,0,0,0.8)] flex items-center justify-center">
            <div
              className="w-4 h-4 rounded-full border border-white/60"
              style={{ backgroundColor: rgbToHex(color) }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
