# Deploy MindMate on Vercel

MindMate deploys as **one Vercel project**:

- the website is served as static files;
- the Express API runs as a Vercel serverless function at `/api` (`api/index.js`);
- both share one address (for example `https://mindmate.vercel.app`), so you don't need a second server or any CORS setup.

The repo already contains the configuration (`vercel.json`). You don't change any build settings in Vercel.

---

## Step 1. Create the credentials (once)

Real credentials were never added to the project. You create them yourself, and they go **only** into the Vercel dashboard, never into the code.

### 1a. Firebase project

Open https://console.firebase.google.com and choose your project (`mindmate-6c7c6`), or create a new one.

**Turn on sign-in**
1. Go to *Build → Authentication → Get started → Sign-in method*.
2. Enable **Email/Password**.
3. Optionally enable **Google** (it asks for a support email).

**Create the database**
1. Go to *Build → Firestore Database → Create database*.
2. Choose **Production mode**.
3. Pick a location. `nam5 (United States)` is closest to Vercel's default function region.

**Get the web config**
1. Go to *Project settings (gear icon) → General → Your apps → Add app → Web (`</>`)*.
2. Give it any nickname and register it. Hosting is not needed.
3. Keep the `firebaseConfig` values it shows. You need them in step 3.

**Get the service account (this one is secret)**
1. Go to *Project settings → Service accounts → Generate new private key*. A `.json` file downloads.
2. Turn the file into one line of text (base64).

   On Windows PowerShell, this copies the text to your clipboard:
   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\frank\Downloads\YOUR-KEY-FILE.json")) | Set-Clipboard
   ```

   On Mac/Linux:
   ```bash
   base64 -i ~/Downloads/YOUR-KEY-FILE.json | tr -d '\n' | pbcopy
   ```

3. Keep the `.json` file somewhere safe **outside** the `Chat` folder. Never commit it or share it.

### 1b. Gemini API key (for AI chat replies)

Create a free key at https://aistudio.google.com/app/apikey. Without it, the app works but chat replies say the AI isn't set up. Crisis replies still work.

> Also, if you haven't already, **revoke the two old OpenAI keys** that are in the repo's git history (https://platform.openai.com/api-keys).

---

## Step 2. Deploy the database security rules (once, from your computer)

In your `Chat` folder (on the `claude/project-thread-hjm9ac` branch, after `npm install`):

```bash
npx firebase login
npx firebase deploy --only firestore:rules --project mindmate-6c7c6
```

You should see `Deploy complete!`. These rules block direct database access from browsers, so all data goes through the API.

---

## Step 3. Create the Vercel project

1. **Put the new code on `main` first.**
   - Open the [pull request](https://github.com/Zomby010/Chat/pull/1).
   - Click **Ready for review**, then **Merge pull request**.
   - Vercel's production site deploys from `main`. Without the merge it would deploy the old code.
2. Sign in at https://vercel.com with GitHub.
3. Click **Add New… → Project** and choose **Zomby010/Chat**. Click *Adjust GitHub App Permissions* if the repo isn't listed.
4. On the configure screen:
   - **Framework Preset:** `Other`
   - **Root Directory:** leave as `./`. Don't pick `frontend`.
   - **Build and Output Settings:** leave them alone. `vercel.json` sets them.
5. Open **Environment Variables** and add every row below.

   | Name | Value |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` | `apiKey` from the web config |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain`, e.g. `mindmate-6c7c6.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId`, e.g. `mindmate-6c7c6` |
   | `VITE_FIREBASE_APP_ID` | `appId` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `VITE_ENABLE_GOOGLE_SIGNIN` | `true` if you enabled Google, otherwise `false` |
   | `FIREBASE_PROJECT_ID` | `mindmate-6c7c6` |
   | `FIREBASE_SERVICE_ACCOUNT_BASE64` | the long base64 text from step 1a (tick **Sensitive**) |
   | `DATA_STORE` | `firestore` |
   | `GEMINI_API_KEY` | your Gemini key (tick **Sensitive**) |
   | `DEFAULT_REGION` | the country code for default crisis lines: `KE`, `NG`, `GB`, `US`, `CA`, `AU`, `IN` or `INTL` |

   Don't set `NODE_ENV`, `VITE_API_URL`, `CORS_ORIGINS` or any emulator variables. Vercel handles these, and the site and API share one address.

   The `VITE_` values are public by design: they end up in the website's code. The two Sensitive ones only ever reach the server.
6. Click **Deploy** and wait for "Congratulations". Your address looks like `https://chat-xxxx.vercel.app`, and you can rename it under *Settings → Domains*.

---

## Step 4. Allow your Vercel address in Firebase

Go to Firebase → *Authentication → Settings → Authorized domains → Add domain*. Add your Vercel address without `https://`, for example `chat-xxxx.vercel.app`. Add any custom domain too.

Google sign-in and email links fail until you add it.

---

## Step 5. Check it works

1. Open `https://YOUR-ADDRESS.vercel.app/api/health`. You should see:
   ```json
   {"ok":true,"data":{"status":"healthy","dataStore":"firestore","database":"ok","ai":{"provider":"gemini","configured":true},"auth":"firebase", ...}}
   ```
   - `SERVER_NOT_CONFIGURED`: the message names the missing or wrong variable. Fix it in *Settings → Environment Variables*, then **Deployments → ⋯ → Redeploy**.
   - `"database":"unreachable"`: the Firestore database wasn't created, or the service account belongs to another project.
2. Open the site, **create an account**, do a **check-in**, then send a **chat message**.
3. In Firebase → Firestore you should now see a `users` collection with your data.

If something fails, open Vercel → your project → **Logs** for the error.

---

## Good to know

- **Changing a variable:** after you change any environment variable, redeploy. `VITE_` values are built into the website.
- **Updates:** every push to `main` redeploys automatically. Other branches get their own preview addresses.
- **Rate limits:** these are counted per server instance on Vercel, so they're approximate. That's fine for a student project.
- **Hobby plan:** Vercel's free Hobby plan is for non-commercial use, which suits a final-year project.
- **Running locally:** this is unchanged: `npm install` and `npm start` with the emulators (see the README).
