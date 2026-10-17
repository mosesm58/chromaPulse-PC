import JSZip from 'jszip';
import { LOTUS_MODES } from '../data/modes';
import { LOTUS_PRESET_COLORS, MOOD_SCENES } from './color';

/**
 * Downloads a complete single-file offline HTML applet that runs instantly
 * when double-clicked on any computer without needing Node.js or a server.
 */
export function downloadStandaloneOfflineHtml() {
  const offlineHtml = `<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lotus Lantern PC (Offline Standalone)</title>
  <style>
    body { font: 14px system-ui, sans-serif; background-color: #0b0d13; color: #f1f5f9; user-select: none; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .flex { display: flex; align-items: center; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .gap-2 { gap: .5rem; } .gap-3 { gap: .75rem; } .gap-6 { gap: 1.5rem; }
    .mt-6 { margin-top: 1.5rem; } .mb-3 { margin-bottom: .75rem; } .mb-4 { margin-bottom: 1rem; }
    .p-3 { padding: .75rem; } .p-4 { padding: 1rem; } .p-5 { padding: 1.25rem; } .p-6 { padding: 1.5rem; }
    .space-y-3 > * + * { margin-top: .75rem; } .space-y-5 > * + * { margin-top: 1.25rem; }
    .rounded-xl { border-radius: .75rem; } .rounded-2xl { border-radius: 1rem; }
    .border { border: 1px solid #263044; } .w-full { width: 100%; } .h-10 { height: 2.5rem; }
    button, input { font: inherit; } button { color: inherit; cursor: pointer; background: #171d2b; border: 1px solid #343e55; border-radius: .65rem; padding: .55rem .8rem; }
    .text-xs { font-size: .75rem; } .text-sm { font-size: .875rem; } .font-bold, .font-semibold { font-weight: 650; }
    .text-slate-400 { color: #94a3b8; } .text-white { color: #fff; } .font-mono { font-family: ui-monospace, monospace; }
    input[type='range'] { -webkit-appearance: none; appearance: none; background: transparent; cursor: pointer; }
    input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 9999px; background: #ffffff; box-shadow: 0 0 10px rgba(255, 255, 255, 0.5); border: 2px solid #1e293b; margin-top: -6px; }
    input[type='range']::-webkit-slider-runnable-track { width: 100%; height: 6px; border-radius: 9999px; background: #1e2536; }
  </style>
</head>
<body class="p-6 max-w-6xl mx-auto">
  <div class="flex items-center justify-between pb-6 border-b border-slate-800">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-lg">🪷</div>
      <div>
        <h1 class="text-lg font-bold tracking-tight text-white">Lotus Lantern PC (Offline Standalone Edition)</h1>
        <p class="text-xs text-slate-400">Direct Local LED Controller with Audio Spectrum & Battlestation Simulation</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <button id="pwrBtn" onclick="togglePower()" class="px-5 py-2.5 rounded-xl font-semibold text-xs bg-emerald-600 text-white shadow-lg cursor-pointer">Hardware Power: ON</button>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
    <!-- Left: Color Disc -->
    <div class="lg:col-span-6 p-6 bg-[#10141f] rounded-2xl border border-slate-800 flex flex-col items-center">
      <div class="w-full flex justify-between text-xs font-semibold uppercase text-slate-400 mb-4">
        <span>HSV Color Disc</span>
        <span id="rgbLabel" class="font-mono text-indigo-400">R:99 G:102 B:241</span>
      </div>
      <canvas id="wheelCanvas" width="280" height="280" class="rounded-full shadow-2xl cursor-crosshair border border-slate-700/60"></canvas>
      <div class="mt-4 flex items-center gap-3 p-3 bg-[#151a29] rounded-xl border border-slate-800 w-full justify-between">
        <div class="flex items-center gap-3">
          <div id="swatch" class="w-8 h-8 rounded-lg border border-white/20" style="background-color: #6366f1;"></div>
          <span id="hexLabel" class="font-mono font-bold text-sm text-white">#6366F1</span>
        </div>
        <span class="text-xs text-slate-400">Click anywhere on disc</span>
      </div>
    </div>

    <!-- Right: Controls -->
    <div class="lg:col-span-6 space-y-6">
      <div class="p-6 bg-[#10141f] rounded-2xl border border-slate-800 space-y-5">
        <div>
          <div class="flex justify-between text-xs font-medium text-slate-300 mb-2">
            <span>Luminance / Brightness</span>
            <span id="brightLabel" class="font-mono text-amber-400 font-bold">90%</span>
          </div>
          <input id="brightRange" type="range" min="1" max="100" value="90" oninput="updateBrightness(this.value)" class="w-full" />
        </div>
        <div>
          <div class="flex justify-between text-xs font-medium text-slate-300 mb-2">
            <span>Color Temp (CCT)</span>
            <span id="tempLabel" class="font-mono text-orange-300 font-bold">4000K</span>
          </div>
          <input id="tempRange" type="range" min="2200" max="6500" step="50" value="4000" oninput="updateTemp(this.value)" class="w-full" />
        </div>
      </div>

      <!-- Presets -->
      <div class="p-5 bg-[#10141f] rounded-2xl border border-slate-800">
        <div class="text-xs font-semibold uppercase text-slate-400 mb-3">Classic Lotus Presets</div>
        <div class="grid grid-cols-6 gap-2" id="presetGrid"></div>
      </div>
    </div>
  </div>

  <!-- Battlestation Simulator -->
  <div class="mt-6 p-6 bg-[#10141f] rounded-2xl border border-slate-800 space-y-3">
    <div class="text-sm font-semibold text-white">Live Battlestation Light Simulation</div>
    <div id="simRoom" class="h-64 rounded-xl bg-[#06080e] relative flex items-center justify-center overflow-hidden border border-slate-800 transition-all duration-300">
      <div id="simGlow" class="absolute inset-0 pointer-events-none transition-all duration-200" style="background: radial-gradient(ellipse at 50% 50%, #6366f1aa 0%, transparent 70%);"></div>
      <div class="relative z-10 w-80 h-36 bg-[#0e111a] border-2 border-slate-700 rounded-xl p-3 flex flex-col justify-between shadow-2xl">
        <div class="text-[10px] font-mono text-slate-400 flex justify-between">
          <span>LOTUS_OFFLINE.exe</span>
          <span id="simStatus" class="text-indigo-400">ONLINE</span>
        </div>
        <div class="text-center font-mono text-sm font-bold text-white" id="simTitle">#6366F1</div>
        <div class="text-[9px] font-mono text-slate-500 text-center">Desk Edge & Monitor Backlight Synced</div>
      </div>
    </div>
  </div>

  <script>
    let currentColor = { r: 99, g: 102, b: 241 };
    let currentBrightness = 90;
    let isPowerOn = true;

    const presets = ['#FF0000', '#00FF00', '#0066FF', '#FF8800', '#00E5FF', '#FF00CC', '#9D00FF', '#FFDD00', '#FFFFFF', '#FFB703', '#06D6A0', '#4CC9F0'];
    const pGrid = document.getElementById('presetGrid');
    presets.forEach(hex => {
      const b = document.createElement('button');
      b.className = 'h-10 rounded-xl border border-slate-700 hover:scale-105 transition-all';
      b.style.backgroundColor = hex;
      b.onclick = () => setHexColor(hex);
      pGrid.appendChild(b);
    });

    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const size = 280;
    const center = size / 2;
    const radius = size / 2;

    for (let a = 0; a < 360; a += 1) {
      const rad = (a * Math.PI) / 180;
      const x = center + Math.cos(rad) * (radius - 2);
      const y = center + Math.sin(rad) * (radius - 2);
      const grad = ctx.createLinearGradient(center, center, x, y);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(1, 'hsl(' + a + ', 100%, 50%)');
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(x, y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    function setHexColor(hex) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      currentColor = { r, g, b };
      updateUI();
    }

    function rgbToHex(r, g, b) {
      return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    function updateUI() {
      const hex = rgbToHex(currentColor.r, currentColor.g, currentColor.b);
      document.getElementById('swatch').style.backgroundColor = hex;
      document.getElementById('hexLabel').innerText = hex.toUpperCase();
      document.getElementById('rgbLabel').innerText = 'R:' + currentColor.r + ' G:' + currentColor.g + ' B:' + currentColor.b;
      document.getElementById('simTitle').innerText = hex.toUpperCase();
      
      const glow = document.getElementById('simGlow');
      if (isPowerOn) {
        const alpha = (currentBrightness / 100) * 0.9;
        glow.style.background = 'radial-gradient(ellipse at 50% 50%, ' + hex + Math.round(alpha * 255).toString(16).padStart(2, '0') + ' 0%, transparent 70%)';
      } else {
        glow.style.background = 'none';
      }
    }

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - center;
      const y = e.clientY - rect.top - center;
      let angle = (Math.atan2(y, x) * 180) / Math.PI;
      if (angle < 0) angle += 360;
      const dist = Math.min(Math.sqrt(x*x + y*y), radius - 4);
      const sat = Math.round((dist / (radius - 4)) * 100);
      
      // Simple HSL to RGB approximation
      const c = (100 / 100) * (sat / 100);
      const hPrime = (angle % 360) / 60;
      const xVal = c * (1 - Math.abs((hPrime % 2) - 1));
      let r1 = 0, g1 = 0, b1 = 0;
      if (hPrime < 1) { r1 = c; g1 = xVal; }
      else if (hPrime < 2) { r1 = xVal; g1 = c; }
      else if (hPrime < 3) { g1 = c; b1 = xVal; }
      else if (hPrime < 4) { g1 = xVal; b1 = c; }
      else if (hPrime < 5) { r1 = xVal; b1 = c; }
      else { r1 = c; b1 = xVal; }
      const m = 1 - c;
      currentColor = {
        r: Math.round((r1 + m) * 255),
        g: Math.round((g1 + m) * 255),
        b: Math.round((b1 + m) * 255)
      };
      updateUI();
    });

    function updateBrightness(v) {
      currentBrightness = Number(v);
      document.getElementById('brightLabel').innerText = v + '%';
      updateUI();
    }

    function updateTemp(v) {
      document.getElementById('tempLabel').innerText = v + 'K';
    }

    function togglePower() {
      isPowerOn = !isPowerOn;
      const btn = document.getElementById('pwrBtn');
      if (isPowerOn) {
        btn.innerText = 'Hardware Power: ON';
        btn.className = 'px-5 py-2.5 rounded-xl font-semibold text-xs bg-emerald-600 text-white shadow-lg cursor-pointer';
        document.getElementById('simStatus').innerText = 'ONLINE';
      } else {
        btn.innerText = 'Hardware Power: OFF';
        btn.className = 'px-5 py-2.5 rounded-xl font-semibold text-xs bg-slate-800 text-slate-400 shadow-md cursor-pointer';
        document.getElementById('simStatus').innerText = 'OFFLINE';
      }
      updateUI();
    }
  </script>
</body>
</html>`;

  const blob = new Blob([offlineHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'LotusLanternPC-Standalone.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads the full project ZIP package containing all source code and local launcher script
 */
export async function downloadCompleteProjectZip() {
  const zip = new JSZip();

  // Root files
  zip.file(
    'run-locally.bat',
    `@echo off
title Lotus Lantern PC - Local Runner
echo ========================================================
echo   Lotus Lantern PC - Smart LED Studio (Local Desktop)
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not detected on your system.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules\\" (
    echo [INFO] Installing dependencies...
    call npm install
)

echo [INFO] Starting Lotus Lantern PC local dev server...
start "" "http://localhost:3000"
call npm run dev
pause
`
  );

  zip.file(
    'run-locally.sh',
    `#!/bin/bash
echo "Starting Lotus Lantern PC..."
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Please install Node.js."
    exit 1
fi
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run dev
`
  );

  zip.file(
    'README.md',
    `# Lotus Lantern PC - Smart LED Studio

## Running Locally:
1. Double-click \`run-locally.bat\` (Windows) or execute \`./run-locally.sh\` (Mac/Linux).
2. Or in terminal:
   \`\`\`bash
   npm install
   npm run dev
   \`\`\`
3. Open http://localhost:3000 in your browser!
`
  );

  zip.file(
    'package.json',
    JSON.stringify(
      {
        name: 'lotus-lantern-pc',
        private: true,
        version: '2.4.0',
        type: 'module',
        scripts: {
          dev: 'vite --port=3000 --host=0.0.0.0',
          build: 'vite build',
          preview: 'vite preview',
          'build:exe': 'electron-builder --win nsis',
        },
        dependencies: {
          '@tailwindcss/vite': '^4.3.3',
          '@vitejs/plugin-react': '^6.1.1',
          'lucide-react': '^0.546.0',
          react: '^19.0.1',
          'react-dom': '^19.0.1',
          tailwindcss: '^4.3.3',
          vite: '^8.3.0',
          jszip: '^3.10.1',
        },
        devDependencies: {
          '@types/node': '^22.14.0',
          '@types/react': '^19.3.0',
          '@types/react-dom': '^19.3.0',
          typescript: '^7.0.2',
        },
      },
      null,
      2
    )
  );

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'LotusLanternPC-Source-Package.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
