# 🌌 Orbit — Multi-Tenant AI Project Delivery Workspace

Orbit is a production-ready, multi-tenant SaaS project management and delivery application. It is designed to group tasks, projects, workspaces, team roles, billing stubs, and audit trails under a secure, scalable model with built-in Google Gemini AI insights.

---

## 🏗️ Tech Stack & Architecture

Orbit is built with a modern, high-performance web architecture:

* **Frontend**: **React 19** with **Tailwind CSS v4** and **shadcn/ui** components for a responsive dashboard.
* **Routing & SSR**: **TanStack Start** (combining TanStack Router + Vite + Nitro Server engine) to support Server-Side Rendering (SSR) and lightning-fast client-side navigation.
* **Database & Auth**: **Supabase (PostgreSQL)** utilizing **Row Level Security (RLS)** to enforce rigid tenant isolation.
* **State Management**: **TanStack Query** for client-side caching and API state synchronization.
* **AI Engine**: Dynamic gateway (`src/lib/ai-gateway.server.ts`) supporting **Google Gemini API** (via OpenAI compatibility) for generating productivity summaries.

---

## ✨ Features

- 👥 **Multi-Tenancy & RBAC**: Strict team role authorization (`owner`, `admin`, `member`, `viewer`) scoped entirely to the active organization workspace.
- 📊 **Analytics Dashboard**: Interactive charts and widgets monitoring task completion rate, workload distribution, and delivery velocity.
- 📋 **Kanban Boards**: Drag-and-drop task workflow boards for managing item statuses and priority levels.
- 🤖 **Orbit AI Workspace**: Embedded analyst that reviews project and sprint data to highlight delivery risks and suggest mitigations.
- 📜 **Activity Logs & Notifications**: Centralized audit trails recording actions across the workspace.
- 💳 **Billing Stubs**: Plan selection and workspace subscription mock-ups.

---

## 🚀 Getting Started

### Prerequisites
* Node.js 20+
* A Supabase project (Free tier is fine)
* Google Gemini API Key (Optional, from [Google AI Studio](https://aistudio.google.com/))

### 1. Installation
Clone the repository and install the dependencies:
```bash
git clone <your-repo-url>
cd Orbit
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and configure your credentials:
```env
# Supabase Project Credentials (from Settings -> API)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_PROJECT_ID="your-project-ref"

SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-anon-key"
SUPABASE_PROJECT_ID="your-project-ref"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Supabase direct connection string for running migrations
# Format: postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:6543/postgres
SUPABASE_DB_URL="your-postgresql-connection-string"

# AI Integration
GEMINI_API_KEY="your-google-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"
```

### 3. Deploy Database Migrations
Deploy the database schema (tables, RLS policies, seeds) to your remote Supabase instance:
```bash
npm run db:push
```

### 4. Run Locally
Start the development server:
```bash
npm run dev
```
The application will be running at [http://localhost:8080/](http://localhost:8080/).

---

## 🗂️ Project Structure

```text
├── .output/            # Build assets (generated)
├── public/             # Static public assets
├── scripts/
│   └── setup-db.js     # CLI DB push automation script
├── src/
│   ├── components/     # UI widgets, layout templates, app shells
│   ├── hooks/          # Custom hooks (auth, workspaces, tasks)
│   ├── integrations/   # Supabase database hooks and clients
│   ├── lib/            # Utilities, AI gateway, and schema helper definitions
│   ├── routes/         # Routing pages (file-based routing via TanStack Start)
│   ├── server.ts       # SSR start server configurations
│   ├── start.ts        # Client entry config
│   └── styles.css      # Core Tailwind CSS file
├── supabase/
│   ├── migrations/     # PostgreSQL schema migrations
│   └── config.toml     # Supabase project settings
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite server configuration
```

---

## 🛠️ Build and Deploy

### Local Production Preview
Build the production build and test it locally:
```bash
npm run build
npm run preview
```

### Deploy to Vercel
1. Link your repository to GitHub.
2. In Vercel, import the repository and select **Other** as the framework preset.
3. Use the following build commands:
   * **Build Command**: `npm run build`
   * **Install Command**: `npm install`
4. Add all environment variables from `.env.example` (including `NITRO_PRESET=vercel`).
5. Deploy and add the deployment domain to your Supabase Auth allowed redirects.