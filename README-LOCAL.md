# Lotus Lantern PC — Smart LED Studio

A modern minimalist desktop controller clone of Lotus Lantern for smart RGB/RGBW LED light strips, dynamic lighting styles, ambient music sync, timers, and multi-device Bluetooth management.

The app does not use Gemini or require API keys. Demo audio and UI assets run locally. Internet is only needed to install Node dependencies the first time (unless already cached).

---

## 🚀 Running Locally on your PC

### Option 1: One-Click Windows Script
If you are on Windows, simply double-click `run-locally.bat`. It will automatically:
1. Verify Node.js is installed
2. Run `npm install` if dependencies are missing
3. Launch the development server and open `http://localhost:3000` in your default browser or standalone window!

---

### Option 2: Command Line (Windows, macOS, Linux)
Open your terminal in this folder and run:

```bash
# 1. Install dependencies
npm install

# 2. Start local server
npm run dev
```

Visit `http://localhost:3000` to control your LED lights!

---

### Build the Windows desktop installer
Install dependencies once, then build the offline Windows installer:

```bash
# Install dependencies (internet required for this first step)
npm install

# Build installer into ./release
npm run desktop:package
```
Run `npm run desktop:dev` to launch the app in its own desktop window during development. The packaged app needs neither Node.js nor an API key and runs offline.
