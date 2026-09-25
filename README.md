# KPSTI Cross-Agency Project Monitoring Hub (`kpsti-project-monitoring-hub`)

Central project monitoring, analytics, and cross-agency tracking hub for **Kementerian Pendidikan, Sains, Teknologi & Inovasi (KPSTI)** Sabah and its sub-agencies/departments (JTDI, JPSM, PNS, SSTC, SCENIC, DGD, etc.).

---

## 🚀 Key Features

- **Analytics Engine**: Real-time KPI summaries, physical vs. financial progress monitoring, and status distributions.
- **Projects & Agency Directory**: Filter and manage projects across KPSTI departments (JTDI, JPSM, PNS, SSTC, SCENIC, DGD, etc.).
- **Audit & History Logs**: Complete submissions audit trail with change tracking.
- **AI Assistant Integration**: Interactive chatbot helper powered by Google Gemini.
- **Firebase Sync & Authentication**: Live data synchronization with Google Firebase/Firestore.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Lucide React icons + Motion
- **Database & Auth**: Firebase / Firestore
- **Deployment**: Netlify Ready (`netlify.toml` pre-configured)

---

## 💻 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/arinn-danish/kpsti-project-monitoring-hub.git
   cd kpsti-project-monitoring-hub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🌐 Deploying to Netlify

### Option 1: Deploy via GitHub (Recommended)

1. **Connect to Netlify:**
   - Go to [Netlify Dashboard](https://app.netlify.com/) and click **"Add new site"** -> **"Import an existing project"**.
   - Choose **GitHub** and select your repository `kpsti-project-monitoring-hub`.

2. **Build Settings** (automatically pre-configured via `netlify.toml`):
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`

### Option 2: Deploy via Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```
