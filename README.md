# Lotus Lantern PC — Smart LED Studio

An offline-capable local controller for smart RGB/RGBW LED strips. The app does not use Gemini, cloud APIs, or API keys. Demo audio is generated locally; music and microphone reactivity are processed in the browser.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Start the app: `npm run dev`
3. Open http://localhost:3000

No `.env` file or API key is needed. After dependencies are installed, the app itself runs locally without internet access. Bluetooth device support depends on browser support and permissions.
