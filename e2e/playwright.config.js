// End-to-end tests: real browser, real backend, Firebase emulators and a stub AI server.
// Run from this folder with `npm test`. Requires Java (for the Firestore emulator).
const { defineConfig, devices } = require('@playwright/test');

const FIREBASE = process.env.FIREBASE_BIN || 'npx --yes firebase-tools@15';
const API_PORT = 5055;
const WEB_PORT = 5173;

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}),
  },
  projects: [
    { name: 'desktop', testIgnore: /mobile\.spec/, use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 860 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec/ },
  ],
  webServer: [
    {
      command: `${FIREBASE} emulators:start --project demo-mindmate --only auth,firestore --config ../firebase.json`,
      url: 'http://127.0.0.1:9099',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'node stub-ai-server.js',
      url: 'http://127.0.0.1:9911',
      reuseExistingServer: true,
    },
    {
      command: 'node src/server.js',
      cwd: '../backend',
      url: `http://127.0.0.1:${API_PORT}/api/health`,
      reuseExistingServer: true,
      env: {
        PORT: String(API_PORT),
        NODE_ENV: 'development',
        DATA_STORE: 'firestore',
        FIREBASE_PROJECT_ID: 'demo-mindmate',
        FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
        FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
        AI_PROVIDER: 'gemini',
        GEMINI_API_KEY: 'stub-key',
        GEMINI_BASE_URL: 'http://127.0.0.1:9911',
        AI_TIMEOUT_MS: '5000',
        CORS_ORIGINS: `http://localhost:${WEB_PORT}`,
        LOG_LEVEL: 'warn',
      },
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      cwd: '../frontend',
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: true,
      env: {
        VITE_USE_FIREBASE_EMULATOR: 'true',
        VITE_FIREBASE_PROJECT_ID: 'demo-mindmate',
        VITE_DEV_API_PROXY: `http://127.0.0.1:${API_PORT}`,
      },
    },
  ],
});
