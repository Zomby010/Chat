# MindMate

A calm, private web app for looking after your mental wellbeing: gentle daily mood check-ins, five evidence-based self-help tools, and an AI companion that is built around safety first.

> **MindMate is a self-care and support tool, not a medical service.** It does not diagnose, treat or replace professional care, and it cannot respond to emergencies. It has not been certified under health-data regulations such as HIPAA, or assessed as a medical device.

Final-year project by Frank (Zomby010).

---

## Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Getting started](#getting-started)
4. [Configuration](#configuration)
5. [API reference](#api-reference)
6. [Data model](#data-model)
7. [The AI companion and safety design](#the-ai-companion-and-safety-design)
8. [Evidence base](#evidence-base)
9. [Crisis resources](#crisis-resources)
10. [Security and privacy](#security-and-privacy)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Known limitations](#known-limitations)

---

## Features

| Area | What it does |
| --- | --- |
| **Accounts** | Email/password sign-up with validation, sign-in, password reset (doesn't reveal whether an account exists), optional Google sign-in, persistent sessions, protected routes, email verification sent on sign-up. |
| **Home dashboard** | Greeting, today's check-in, quick actions, daily encouragement + small step, quote and joke (each refreshable), weekly stats for mood, movement, calm and sleep, a 30-day mood chart, today's plans, and personal insights such as "your mood is higher on days you move". |
| **Mood check-in** | "How are you feeling today?" on a five-face scale (colours run blue to warm, never red to green), optional emotion tags and note, supportive message and tailored suggestions, history, trend, streak and distribution. Risky language in a note shows crisis lines. |
| **AI companion** | Multiple saved conversations, history, typing indicator, timestamps, error messages with retry, delete one or all conversations. Crisis detection runs on the server before the AI is called. |
| **Breathing** | Animated pacer for calm (4-2-6), box (4-4-4-4) and 4-7-8 breathing, 1–5 minutes, sessions logged. |
| **Mindfulness** | Guided 5-4-3-2-1 grounding, body scan, mindful minute and kindness practice, step by step with a timer. |
| **Movement** | Log activities and intensity; progress ring toward the WHO 150-minute weekly guideline (vigorous minutes count double). |
| **Plan something good** | Behavioural activation: schedule small activities, mark them done, rate mood before and after, see the average lift. |
| **Sleep & routine** | Sleep diary (bed/wake time, quality, wind-down, screens off), average hours and quality, NHS-based tips. |
| **Stay connected** | A daily small-connection prompt and a log of connections (relationship type only, never names). |
| **Support** | "Get help now" on every screen, region-aware crisis lines that work signed out and offline, a full support page. |
| **Privacy controls** | Opt-in sharing of mood with the AI, opt-out of name sharing, download all data as JSON, delete conversations, delete all data, delete account. |
| **Design** | Calm teal and linen palette, Fraunces and Inter type, light and dark themes, responsive from phones to desktops with a bottom tab bar on mobile, keyboard and screen-reader friendly, respects reduced motion. |

## Architecture

```
React (Vite)  ──HTTPS + Firebase ID token──▶  Express API  ──▶  Firestore (Admin SDK)
     │                                          │
     └── Firebase Auth (sign-in only)           ├──▶  Crisis detection (deterministic, runs first)
                                                ├──▶  AI provider: Gemini or OpenAI (server-side key)
                                                └──▶  Output guard (blocks dosage, diagnosis, "I'm a therapist")
```

- **Frontend** (`frontend/`): React 19, React Router, Vite. Firebase is used in the browser **only for authentication**. All data goes through the API.
- **Backend** (`backend/`): Node 22, Express 5, layered as `routes → middleware → controllers → services → repositories`. Validation with zod, helmet, CORS allow-list, rate limits, JSON logging without request bodies, consistent `{ ok, data | error }` responses.
- **Database**: Cloud Firestore through the Admin SDK. `firestore.rules` denies all direct client access, so the API is the only way in and every query is scoped to the verified user's id.
- **Shared** (`shared/crisisResources.json`): crisis lines used by both the backend (in AI safety messages) and the frontend (bundled, so they work offline).

```
backend/src
├── app.js, server.js          app factory (dependency-injected) and start-up
├── config/                    validated env, Firebase Admin
├── middleware/                auth, validation, rate limits, errors, request logs
├── routes/, controllers/
├── services/                  profile, mood, activity, plan, chat, insights, content, crisis
│   └── ai/                    prompt, Gemini + OpenAI providers, retries, output guard
├── repositories/              Firestore and in-memory implementations of one interface
├── validation/schemas.js
└── content/dailyContent.js    quotes (attributed), jokes, encouragement, suggestions
frontend/src
├── pages/                     Landing, auth, Home, Mood, Chat, wellbeing/*, info/*, Profile
├── components/                ui, layout, crisis, charts, mood, chat, daily, wellbeing
├── context/                   Auth, Toast, Crisis dialog, Theme
├── lib/                       api client, firebase, region, formatting
├── data/evidence.js           sources shown inside each feature and on the About page
└── styles/                    design tokens, base, components, layout, page styles
e2e/                           Playwright journeys + stub AI server for tests
```

## Getting started

### Prerequisites

- Node.js 22.12+
- Java 11+ (only for the Firebase emulators)
- Nothing else: the Firebase CLI is installed by `npm install`

### Option A: run locally with the Firebase emulators (no real project or keys)

This is the quickest way to see everything working. The emulators provide Auth and Firestore locally, and their data is wiped when you stop them.

```bash
npm install   # installs backend + frontend and creates backend/.env and frontend/.env.local for the emulators
npm start     # starts the emulators, the API (port 5000) and the web app together
```

Open http://localhost:5173 and create an account (any email works). Press Ctrl+C to stop.

Without an AI key everything works except AI replies, which return a clear "AI not configured" message. Crisis replies still work because they never use the AI. To turn replies on, paste a free key from https://aistudio.google.com/app/apikey after `GEMINI_API_KEY=` in `backend/.env` and restart.

To run the parts separately: `npm run emulators`, `npm run dev:api` and `npm run dev:web`, each in its own terminal.

### Option B: run against your real Firebase project

1. Firebase console → Authentication → enable **Email/Password** (and **Google** if wanted). Add your deployed domain under *Authorised domains*.
2. Firestore → create a database, then deploy the rules: `npx firebase-tools deploy --only firestore:rules --project <your-project-id>`.
3. Project settings → Service accounts → *Generate new private key*. Base64-encode the JSON (`base64 -w0 key.json`) and put it in `backend/.env` as `FIREBASE_SERVICE_ACCOUNT_BASE64`. **Never commit the key file.**
4. Project settings → General → your web app → copy the config into `frontend/.env.local` as the `VITE_FIREBASE_*` values.
5. Add `GEMINI_API_KEY` (from https://aistudio.google.com/app/apikey) or `OPENAI_API_KEY` to `backend/.env`.
6. `npm run dev:api` and `npm run dev:web`.

## Configuration

### Backend (`backend/.env`, see `backend/.env.example`)

| Variable | Purpose |
| --- | --- |
| `NODE_ENV`, `PORT` | Environment and port (default 5000). |
| `CORS_ORIGINS` | Comma-separated list of allowed web origins. |
| `TRUST_PROXY` | `true` behind a hosting proxy so rate limits see real client IPs. |
| `DATA_STORE` | `firestore` (required in production) or `memory` for quick experiments. |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Base64 service-account JSON. Alternatively `GOOGLE_APPLICATION_CREDENTIALS` (path) on Google Cloud. |
| `FIREBASE_PROJECT_ID` | Project id (e.g. `mindmate-6c7c6`, or `demo-mindmate` with emulators). |
| `FIREBASE_AUTH_EMULATOR_HOST`, `FIRESTORE_EMULATOR_HOST` | Use local emulators. |
| `AI_PROVIDER` | `gemini`, `openai` or `none`. Defaults to whichever key is set. |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Gemini key and model (default `gemini-2.5-flash`). |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | OpenAI key and model (default `gpt-4o-mini`). |
| `AI_TIMEOUT_MS`, `AI_MAX_OUTPUT_TOKENS` | Provider timeout and reply length. |
| `DEFAULT_REGION` | Crisis region when a user hasn't chosen one (`INTL`, `KE`, `NG`, `GB`, `US`, `CA`, `AU`, `IN`). |
| `LOG_LEVEL` | `debug`, `info`, `warn`, `error`. |

Configuration is validated at start-up; a missing credential fails loudly instead of failing inside a request.

### Frontend (`frontend/.env.local`, see `frontend/.env.example`)

`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_ENABLE_GOOGLE_SIGNIN`, `VITE_API_URL`, and the emulator variables.

The Firebase **web** config is public by design (it identifies the project; security comes from Auth and the rules). **No secret ever goes in a `VITE_` variable**: AI keys and the service account live only on the server.

## API reference

All responses are JSON: `{ "ok": true, "data": ... }` or `{ "ok": false, "error": { "code", "message", "details?" } }`.
Authenticated routes need `Authorization: Bearer <Firebase ID token>`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | – | Status of the data store, AI provider and auth mode. |
| GET | `/api/crisis/regions` | – | Supported regions. |
| GET | `/api/crisis/resources?region=KE` | – | Crisis lines for a region (falls back to international). |
| POST | `/api/crisis/assess` | ✓ | Risk level for a piece of text. |
| GET / PATCH / DELETE | `/api/me` | ✓ | Get (creates on first call), update, or delete account and all data. |
| GET | `/api/me/export` | ✓ | Everything stored about the user as JSON. |
| DELETE | `/api/me/data` | ✓ | Delete all records, keep account and settings. |
| GET | `/api/dashboard?tzOffset=` | ✓ | Weekly summary, trends and insights. |
| GET | `/api/content/daily` | ✓ | Daily encouragement, suggestion, quote and joke (`r_quote=1` etc. to refresh one). |
| GET / POST | `/api/moods` | ✓ | List (`?days=30`) or create a check-in; create returns supportive suggestions and a safety flag. |
| DELETE | `/api/moods/:id` | ✓ | Delete a check-in. |
| GET / POST | `/api/activities` | ✓ | List (`?type=sleep&days=30`) or log breathing, mindfulness, movement, connection or sleep. |
| DELETE | `/api/activities/:id` | ✓ | Delete an entry. |
| GET / POST | `/api/plans` | ✓ | List or create behavioural-activation plans. |
| PATCH / DELETE | `/api/plans/:id` | ✓ | Update status, mood before/after, reflection; or delete. |
| GET / POST / DELETE | `/api/chat/sessions` | ✓ | List, create, or delete all conversations. |
| GET / DELETE | `/api/chat/sessions/:id` | ✓ | A conversation with its messages; delete it. |
| POST | `/api/chat/sessions/:id/messages` | ✓ | Send a message; returns the saved user and assistant messages and a safety object. Rate limited to 12/min per user. |

> The previous README listed `/api/auth/login` and `/api/auth/register`. Those endpoints never existed in the code. Sign-in is now handled by Firebase Authentication in the browser, and the API verifies the resulting ID token on every request.

## Data model

All data is stored per user under `users/{uid}`:

```
users/{uid}                     displayName, email, region, preferences{shareNameWithAI, shareMoodWithAI,
                                weeklyMovementGoal, sleepGoalHours, showJokes}, createdAt, updatedAt
  moods/{id}                    score 1–5, label, emotions[], note?, safetyLevel, day, createdAt
  activities/{id}               type: breathing | mindfulness | movement | connection | sleep, day,
                                durationMin and type-specific fields, createdAt
  plans/{id}                    title, category, date, status planned|done|skipped,
                                moodBefore?, moodAfter?, reflection?, completedAt?
  chatSessions/{id}             title, messageCount, highestSafetyLevel, createdAt, updatedAt
    messages/{id}               role user|assistant, content, createdAt; user messages: safety{level, categories};
                                assistant messages: source ai|guarded|safety|safety-fallback, model?
```

`day` is the user's local calendar day, so streaks and weekly totals follow their timezone. Deleting an account recursively removes the user document and every subcollection.

## The AI companion and safety design

Each message goes through these steps on the server:

1. **Validate and rate-limit** (2,000 characters, 12 messages a minute).
2. **Crisis detection** (`services/crisis.service.js`). Deterministic patterns classify the text as `imminent`, `high`, `concern` or `none`, with negation handling ("I'm not suicidal").
   - `imminent` (a plan, intent, an overdose already taken): **the AI is not called.** A fixed message with the user's emergency number and two crisis lines is returned.
   - `high`: the AI is called with extra safety instructions, and crisis contacts are always shown. If the AI fails, the fixed crisis message is used.
   - `concern`: gentle check-in instructions; resources are offered.
3. **System prompt** (`services/ai/prompt.js`): the companion is warm and brief, listens before suggesting, offers small evidence-informed steps, and must never claim to be a professional, diagnose, discuss medication or doses, or give harmful instructions. Only the first name, chosen country and (if the user opts in) latest mood are included as context. The email address is never sent.
4. **Provider call** with a timeout and one retry on transient errors. Errors map to clear user messages (`AI_TIMEOUT`, `AI_RATE_LIMITED` and so on).
5. **Output guard** (`services/ai/outputGuard.js`): replies containing dosages, "increase your dose", professional claims or diagnoses are replaced with a safe explanation.
6. If an ordinary message fails, nothing is saved and the user can retry.

The keyword-based detector is intentionally simple and explainable, but it can miss indirect language or misread context. That is why "Get help now" is always one tap away.

## Evidence base

Each tool shows a "Why this helps, and its limits" panel with its sources. The About page lists them all.

| Feature | Evidence | Limits shown to the user |
| --- | --- | --- |
| Movement | WHO 2020 guidelines: 150–300 min/week moderate activity; reduced symptoms of anxiety and depression; "some activity is better than none". NICE NG222 lists group exercise for less severe depression. | Benefits build over weeks; not a replacement for treatment of moderate or severe depression. |
| Plan something good (behavioural activation) | Ekers et al. 2014, *PLoS ONE*: meta-analysis of 26 RCTs (1,524 participants), SMD −0.74 versus controls. NICE NG222 first-line option. | App offers BA-inspired self-help, not therapist-delivered BA. |
| Mindfulness & breathing | Hoge et al. 2022, *JAMA Psychiatry*: 8-week MBSR non-inferior to escitalopram for anxiety (n=276). NICE recommends MBCT for preventing depression relapse. | Trials studied structured 8-week courses; short app sessions are a lighter-touch version. |
| Sleep & routine | NHS Inform CBT-I self-help: fixed wake time, the 15-minute rule, caffeine and alcohol timing, short early naps, worry time. | A sleep diary helps notice patterns; it doesn't diagnose sleep disorders. |
| Social connection | US Surgeon General's 2023 advisory on loneliness; NHS "5 steps to mental wellbeing: Connect". | The evidence is largely observational; the app never stores names. |

Journaling is part of the mood check-in note.

## Crisis resources

`shared/crisisResources.json` covers Kenya, Nigeria, the UK, the US, Canada, Australia and India, plus an international fallback (findahelpline.com). Each entry has the emergency number, helplines with hours, and tap-to-call / tap-to-text links. Numbers were checked on the date in `_meta.lastVerified` against the sources listed there. **Helplines change: re-check them before any public launch**, and add your audience's country if it's missing.

The user's region comes from their profile, or a guess from the browser language, falling back to international. It can be changed on any crisis screen.

## Security and privacy

- **Secrets stay on the server.** AI keys and the Firebase service account are only read from the backend environment. `.env` files and service-account JSON are git-ignored.
- **Every request is authenticated** with a verified Firebase ID token (revocation checked), and every query is scoped to that user's id. Tests check that one user can't read or delete another's data.
- **Firestore rules deny all client access**, so the database can't be reached around the API.
- helmet security headers, a CORS allow-list, a 32 KB body limit, strict zod schemas (unknown fields rejected), and rate limits (120 requests/min per IP; 12 chat messages/min per user).
- Logs contain method, path, status and timing only, never request bodies.
- AI output is rendered as React text (no `dangerouslySetInnerHTML`), so model output can't inject HTML.
- See the in-app Privacy page for the user-facing explanation, including that chat text is processed by the AI provider and that data is not end-to-end encrypted.

**Important:** earlier versions of this repository committed OpenAI API keys to git history. Those keys must be revoked in the OpenAI dashboard; removing them from the latest commit does not remove them from history.

## Testing

| Command | What it covers |
| --- | --- |
| `npm --prefix backend test` | 48 tests: crisis detection, AI providers and output guard, every API route, validation, user isolation, insights maths. |
| `npm --prefix backend run test:emulator` | Full API flow against real Firebase Auth and Firestore emulators: tokens, data isolation, recursive delete, account deletion. |
| `npm --prefix frontend test` | Unit and component tests: breathing pacer, sleep maths, WHO minutes, sign-up validation, safe rich text, check-in flow, routing and crisis links. |
| `npm --prefix e2e test` | 13 Playwright journeys in a real browser against the emulators, the real API and a stub AI server: new user (sign up → check-in → chat → plan → export → sign out → sign back in), crisis (signed-out help, imminent message never reaches the AI, AI-down fallback, risky mood note), errors (validation, wrong password, password reset, AI failure with retry, medication advice blocked, API unreachable, account deletion) and a mobile journey checking every page for horizontal overflow. |

The E2E suite starts everything it needs. Set `FIREBASE_BIN` if you have firebase-tools installed somewhere specific. The stub AI server (`e2e/stub-ai-server.js`) stands in for Gemini only in tests; the app itself never fakes AI replies.

GitHub Actions (`.github/workflows/ci.yml`) runs the backend tests, the emulator integration test, and the frontend tests and build on every pull request.

## Deployment

A simple, free-tier-friendly setup:

- **Frontend**: Firebase Hosting, Vercel or Netlify. Build with `npm --prefix frontend run build` (output `frontend/dist`), set the `VITE_*` variables, and add an SPA rewrite to `index.html`.
- **Backend**: Render, Railway, Fly.io or Cloud Run. Start command `npm start` in `backend/`. Set `NODE_ENV=production`, `DATA_STORE=firestore`, `FIREBASE_SERVICE_ACCOUNT_BASE64`, the AI key, `CORS_ORIGINS=https://your-frontend-domain`, and `TRUST_PROXY=true`.
- Set `VITE_API_URL` in the frontend to the backend URL, and add the frontend domain to Firebase Auth's authorised domains.
- Deploy `firestore.rules`.

## Known limitations

- Crisis detection is keyword-based and English-only.
- Facebook sign-in was removed: it needs a Meta developer app and review. It can be added through Firebase Auth later.
- Some free AI API tiers allow the provider to use submitted content to improve their services. Use a paid tier for real users.
- There is no clinician involvement, outcome measurement or formal evaluation; the evidence above supports the techniques, not this app.
- Crisis numbers must be re-verified periodically.
