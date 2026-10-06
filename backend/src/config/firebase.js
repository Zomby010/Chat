'use strict';

/**
 * Lazily initialises firebase-admin from config.
 * Supports a base64-encoded service account (easy to store as one env var on
 * hosting platforms), a credentials file path, or the local Emulator Suite.
 */
const { initializeApp, cert, applicationDefault, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

function initFirebase(firebaseConfig) {
  if (getApps().length) return getApps()[0];
  const options = {};
  if (firebaseConfig.serviceAccountBase64) {
    const json = JSON.parse(Buffer.from(firebaseConfig.serviceAccountBase64, 'base64').toString('utf8'));
    options.credential = cert(json);
    options.projectId = json.project_id;
  } else if (firebaseConfig.credentialsFile) {
    options.credential = applicationDefault();
  }
  if (firebaseConfig.projectId) options.projectId = firebaseConfig.projectId;
  if (!options.projectId && firebaseConfig.usingEmulator) options.projectId = 'demo-mindmate';
  return initializeApp(options);
}

function getFirebaseServices(firebaseConfig) {
  const app = initFirebase(firebaseConfig);
  const db = getFirestore(app);
  if (!db._mindmateConfigured) {
    db.settings({ ignoreUndefinedProperties: true });
    db._mindmateConfigured = true;
  }
  return { auth: getAuth(app), db };
}

module.exports = { getFirebaseServices };
