#!/usr/bin/env node
/**
 * One-time local setup, run automatically by `npm install` in the repo root.
 * Installs the backend and frontend packages and creates local settings files
 * that point at the Firebase emulators. Existing .env files are never touched.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const BACKEND_ENV = `# Local development against the Firebase emulators (created by npm install).
DATA_STORE=firestore
FIREBASE_PROJECT_ID=demo-mindmate
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
# Paste a free key from https://aistudio.google.com/app/apikey to turn on chat replies:
GEMINI_API_KEY=
`;

const FRONTEND_ENV = `# Local development against the Firebase emulators (created by npm install).
VITE_USE_FIREBASE_EMULATOR=true
VITE_FIREBASE_PROJECT_ID=demo-mindmate
`;

function writeIfMissing(rel, contents) {
  const file = path.join(root, rel);
  if (fs.existsSync(file)) {
    console.log(`  kept existing ${rel}`);
    return;
  }
  fs.writeFileSync(file, contents);
  console.log(`  created ${rel}`);
}

for (const dir of ['backend', 'frontend']) {
  console.log(`\nInstalling ${dir} packages...`);
  execSync('npm install --no-audit --no-fund', { cwd: path.join(root, dir), stdio: 'inherit' });
}

console.log('\nSettings files:');
writeIfMissing('backend/.env', BACKEND_ENV);
writeIfMissing('frontend/.env.local', FRONTEND_ENV);

console.log('\nAll set. Run "npm start" and open http://localhost:5173\n');
