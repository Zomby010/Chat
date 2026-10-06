'use strict';

/**
 * Centralised, validated configuration.
 * Every environment variable the API reads is declared here, so a missing or
 * malformed value fails loudly at start-up instead of deep inside a request.
 */
const path = require('path');
const { z } = require('zod');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const bool = (fallback) =>
  z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((v) => (v === undefined ? fallback : v === 'true' || v === '1'));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  TRUST_PROXY: bool(false),

  // Data store: "firestore" in production, "memory" for local development/tests.
  DATA_STORE: z.enum(['firestore', 'memory']).optional(),

  // Firebase Admin credentials (one of these is needed for DATA_STORE=firestore
  // and for verifying ID tokens outside the emulator).
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_BASE64: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  FIREBASE_AUTH_EMULATOR_HOST: z.string().optional(),
  FIRESTORE_EMULATOR_HOST: z.string().optional(),

  // AI provider
  AI_PROVIDER: z.enum(['gemini', 'openai', 'none']).optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  GEMINI_BASE_URL: z.string().url().default('https://generativelanguage.googleapis.com'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_BASE_URL: z.string().url().default('https://api.openai.com'),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(20000),
  AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(600),

  DEFAULT_REGION: z.string().default('INTL'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

function loadConfig(env = process.env) {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const e = parsed.data;

  const usingEmulator = Boolean(e.FIREBASE_AUTH_EMULATOR_HOST || e.FIRESTORE_EMULATOR_HOST);
  const hasFirebaseCredentials = Boolean(
    e.FIREBASE_SERVICE_ACCOUNT_BASE64 || e.GOOGLE_APPLICATION_CREDENTIALS || usingEmulator
  );

  const aiProvider =
    e.AI_PROVIDER || (e.GEMINI_API_KEY ? 'gemini' : e.OPENAI_API_KEY ? 'openai' : 'none');

  const config = {
    env: e.NODE_ENV,
    isProduction: e.NODE_ENV === 'production',
    port: e.PORT,
    corsOrigins: e.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
    trustProxy: e.TRUST_PROXY,
    dataStore: e.DATA_STORE || (hasFirebaseCredentials ? 'firestore' : 'memory'),
    firebase: {
      projectId: e.FIREBASE_PROJECT_ID,
      serviceAccountBase64: e.FIREBASE_SERVICE_ACCOUNT_BASE64,
      credentialsFile: e.GOOGLE_APPLICATION_CREDENTIALS,
      usingEmulator,
      hasCredentials: hasFirebaseCredentials,
    },
    ai: {
      provider: aiProvider,
      timeoutMs: e.AI_TIMEOUT_MS,
      maxOutputTokens: e.AI_MAX_OUTPUT_TOKENS,
      gemini: { apiKey: e.GEMINI_API_KEY, model: e.GEMINI_MODEL, baseUrl: e.GEMINI_BASE_URL },
      openai: { apiKey: e.OPENAI_API_KEY, model: e.OPENAI_MODEL, baseUrl: e.OPENAI_BASE_URL },
    },
    defaultRegion: e.DEFAULT_REGION.toUpperCase(),
    logLevel: e.LOG_LEVEL,
  };

  const problems = [];
  if (config.isProduction && config.dataStore !== 'firestore') {
    problems.push('Production requires DATA_STORE=firestore with Firebase credentials.');
  }
  if (config.dataStore === 'firestore' && !hasFirebaseCredentials) {
    problems.push('DATA_STORE=firestore needs FIREBASE_SERVICE_ACCOUNT_BASE64 or GOOGLE_APPLICATION_CREDENTIALS.');
  }
  if (aiProvider === 'gemini' && !e.GEMINI_API_KEY) problems.push('AI_PROVIDER=gemini needs GEMINI_API_KEY.');
  if (aiProvider === 'openai' && !e.OPENAI_API_KEY) problems.push('AI_PROVIDER=openai needs OPENAI_API_KEY.');
  if (problems.length) throw new Error(`Configuration error:\n  - ${problems.join('\n  - ')}`);

  return config;
}

module.exports = { loadConfig };
