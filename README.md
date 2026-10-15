# 🚀 TubePilot - AI YouTube Growth Desktop App

**TubePilot** is a cross-platform desktop application (Windows, macOS, Linux) engineered for YouTube creators. It links directly to your YouTube channel, continuously monitors 90-day retention telemetry, and automatically produces a ready-to-execute daily content growth package:
- 💡 **Algorithmic Video Concepts** (Shorts + Long-form mix tailored to your top search keywords)
- 🎨 **High-CTR Thumbnail Prompts & 3-Variation Image Generator** (16:9 for Long, 9:16 for Shorts, text overlay editor, mobile readability checklist, CTR score)
- 🔁 **Seamless Looping Video Generator** (Hypnotic cyclic motion with 0 pops, crossfaded ambient pad audio, with bundled local FFmpeg fallback)
- 📦 **Copy-Paste Upload Kits** (3 title options <60 chars, fold-optimized descriptions, strict 3-5 hashtag rules, backend tags, chapters, pinned comments & direct YouTube upload)
- 🗄️ **Project Asset Library** (Organized by date and concept, persistent local SQLite database, 1-click open folder)

---

## ⚡ Tech Stack & Architecture

- **Desktop Framework:** Electron 34 + Node.js
- **Frontend UI:** React 18, TypeScript, Vite 6, TailwindCSS, Lucide Icons, Recharts
- **State Management:** Zustand
- **Local Storage:** SQLite (`sql.js` WebAssembly + file sync) — zero cloud database dependencies; your data stays entirely on your computer
- **Security:** OS Keychain encryption (`safeStorage` / DPAPI / AES-256-GCM) for API keys and tokens
- **Media Engine:** FFmpeg (bundled via `ffmpeg-static`) for Ken Burns zoom/pan, ping-pong loops, and crossfaded ambient audio
- **AI Pluggable Providers:**
  - **Text AI:** Claude (Anthropic API - default), OpenAI (GPT-4o), Google Gemini
  - **Image AI:** OpenAI (DALL-E 3), Stability AI (SD 3.5), Replicate (Flux 1.1 Pro), and Offline Studio Canvas generator
  - **Video AI:** Runway, Luma Dream Machine, Replicate, plus **Local FFmpeg Fallback** (zero API keys required)

---

## 📦 Quick Start & Development

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested on v20 & v22)
- npm or pnpm

### 2. Install Dependencies
```bash
npm install
```

### 3. Launch Development Mode
```bash
npm run dev
```
*TubePilot opens instantly with pre-loaded realistic seed data in Demo/Manual mode so you can test all features before connecting any accounts.*

### 4. Run Automated Test Suite
```bash
npm test
```
Runs Vitest unit tests verifying:
- Database CRUD and AES/Keychain credential encryption
- JSON schema Zod validation across all AI output formats
- YouTube upload kit rules (Long <60 chars, Shorts <40 chars with `#Shorts`, 3-5 hashtags constraint)
- FFmpeg binary discovery and render cancel handles

### 5. Build Desktop Installers
```bash
npm run build
```
Generates distributable desktop installers in `/release` for your operating system.

---

## 🔑 Setting Up YouTube OAuth 2.0 Credentials

TubePilot connects to your channel via Google OAuth 2.0 Desktop Loopback flow with PKCE.

### Step-by-Step Google Cloud Console Setup:

1. **Create a Google Cloud Project:**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Click **Select a project** > **New Project** and name it `TubePilot`.

2. **Enable Required APIs:**
   - Go to **APIs & Services** > **Library**.
   - Search for and enable:
     - **YouTube Data API v3**
     - **YouTube Analytics API**

3. **Configure the OAuth Consent Screen:**
   - Go to **APIs & Services** > **OAuth consent screen**.
   - Select **External** and click **Create**.
   - Fill in:
     - App name: `TubePilot`
     - User support email: your email
     - Developer contact info: your email
   - Under **Scopes**, add:
     - `https://www.googleapis.com/auth/youtube.readonly`
     - `https://www.googleapis.com/auth/yt-analytics.readonly`
     - `https://www.googleapis.com/auth/youtube.upload`
   - Under **Test users**, add your own Google email address (the one associated with your YouTube channel).

4. **Create Desktop OAuth Credentials:**
   - Go to **APIs & Services** > **Credentials**.
   - Click **Create Credentials** > **OAuth client ID**.
   - Application type: **Desktop app**.
   - Name: `TubePilot Desktop`.
   - Click **Create**.
   - Copy the **Client ID** and **Client Secret**.

5. **Link in TubePilot:**
   - Open TubePilot and navigate to **Settings**.
   - Under **YouTube Integration**, paste your **Client ID** and **Client Secret**.
   - Click **Connect YouTube (OAuth PKCE)**.
   - Your browser will open a Google sign-in tab. Grant permission and return to TubePilot.

---

## 🛠️ Offline & Manual Profile Mode

Don't have a Google Cloud project or API keys ready yet?
- TubePilot includes a built-in **Manual Mode**:
  - Enter your niche (e.g. `Tech & AI Coding`), channel description, and audience profile in **Settings**.
  - TubePilot will generate tailored ideas, thumbnails, loops, and upload kits using its local AI engine and bundled FFmpeg renderer!

---

## 🧠 Editable AI Prompt Templates

All AI instructions live in human-readable, editable Markdown files inside the `/prompts` folder:
- [`channel-summary.md`](./prompts/channel-summary.md): Converts 90-day retention and search metrics into plain-English diagnosis.
- [`daily-ideas.md`](./prompts/daily-ideas.md): Generates minimum 3 ideas (Shorts vs Long-form mix) with hooks, rationales, and script outlines.
- [`thumbnail-prompt.md`](./prompts/thumbnail-prompt.md): Produces high-CTR visual prompts, negative prompts, text overlays, and mobile readability scores.
- [`loop-video-prompt.md`](./prompts/loop-video-prompt.md): Creates seamless cyclic motion prompts and audio looping directives.
- [`upload-kit-long.md`](./prompts/upload-kit-long.md): Enforces 3 titles <60 chars, fold-optimized descriptions, and strictly 3 to 5 hashtags.
- [`upload-kit-short.md`](./prompts/upload-kit-short.md): Enforces titles <40 chars with `#Shorts`, on-screen text hooks, and seamless loop tips.

---

## ❓ Troubleshooting

| Issue | Resolution |
| :--- | :--- |
| **Google OAuth: Access blocked: TubePilot has not completed the Google verification process** | Add your Google account email to the **Test Users** list in the Google Cloud OAuth Consent Screen. |
| **Port 8765 busy during OAuth** | TubePilot listens on `http://127.0.0.1:8765/oauth2callback`. Ensure no other local development server is using port 8765. |
| **FFmpeg loop render is slow** | Local fallback renders at 25fps using `-preset veryfast` with H.264 video. If rendering longer durations (e.g. 10m / 1h), ensure sufficient free disk space in your export folder. |
| **Where are my exported files?** | Click the **Open Exports Folder** icon in the header or in Library to jump directly to your `TubePilot_Exports` folder on disk. |
| **Where is the SQLite database stored?** | Windows: `%APPDATA%/TubePilot/tubepilot.sqlite`<br>macOS: `~/Library/Application Support/TubePilot/tubepilot.sqlite`<br>Linux: `~/.config/TubePilot/tubepilot.sqlite` |

---

## 📄 License
MIT License. Crafted for high-growth YouTube creators.
