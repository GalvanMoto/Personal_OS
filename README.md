# 🌐 Personal OS (DLRS)

> **Universal Command Center & Autonomous Information Intelligence Engine**  
> *Turn scattered data, client messages, PDFs, receipts, and emails into structured tasks, projects, financial radar, and scheduled actions.*

---

## ⚡ Philosophy: Information → Intelligence → Action

Most productivity tools force you to act like a manual database administrator for your own life — filling forms, tagging tasks, setting reminders, uploading attachments, and organizing folders.

**Personal OS inverts this workflow:**
1. **You drop raw information in:** Paste screenshots, forward emails, drop bank statements / PDFs, or enter raw thoughts.
2. **The Intelligence Engine analyzes:** AI providers extract entities, calculate due dates, match client assets, identify transactions, and assess priorities.
3. **Structured actions are staged:** Tasks, projects, expenses, documents, and reminders are automatically created, linked, and monitored.

---

## 🚀 Key Features

### 📥 1. Universal Inbox & Quick Capture
- **Multimodal Capture:** Accepts text notes, screenshots, images, emails, and PDFs.
- **Automated Entity Extraction:** Automatically detects tasks, due dates, project affiliations, and required assets.
- **Smart Staging & Approval:** Review and confirm AI suggestions before applying changes.

### 🧠 2. Multi-Model AI & Agent Orchestration
- **Flexible AI Providers:** Out-of-the-box support for **Anthropic (Claude 3.5 Sonnet)**, **OpenAI (GPT-4o / GPT-4o-mini)**, **Google Gemini (Gemini 1.5 Flash)**, and an offline **Heuristic engine**.
- **Interactive Assistant:** Conversational copilot equipped with server tools to inspect projects, search documents, and query schedules.

### 📊 3. Financial Radar & Bank Statement Analysis
- **Automated Expense Tracking:** Parse bank and credit card statements (including password-protected PDFs).
- **Subscription Awareness:** Automatically flags recurring subscriptions and upcoming billing cycles.
- **Financial Analytics:** Interactive charts for spending habits, category breakdowns, and revenue/expense balances.

### 🔗 4. Google Workspace Integrations & Webhooks
- **Gmail:** Ingest emails and extract actionable items and attachments.
- **Google Drive:** Automatically discover, link, and organize project brand assets, documents, and media.
- **Google Calendar:** Two-way sync for deadlines, meetings, and follow-ups.
- **Webhook Ingestion:** Send webhooks from external tools, scripts, or automations straight into your inbox.

### 🔒 5. Enterprise-Grade Multi-Tenancy & Security
- **Strict Tenant Isolation:** Every query and mutation is isolated per workspace/tenant.
- **Encrypted Secrets Vault:** OAuth tokens and sensitive credentials encrypted at rest using AES-256-GCM.
- **Session Management:** Secure cookie sessions with cryptographic hashing and verification.

### 📱 6. Modern PWA & Notification Engine
- **Cross-Platform:** Runs seamlessly on macOS, Windows, iOS, and Android as a Progressive Web App (PWA).
- **Interactive Alerts:** Background push notifications, scheduled reminders, and audio chimes.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, React 19)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Database & ORM:** [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM v7](https://www.prisma.io/) (`@prisma/adapter-pg`)
- **AI & LLM Orchestration:** [TanStack AI](https://tanstack.com/) & [OpenAI](https://github.com/openai/openai-node) SDKs
- **PDF & Document Parsing:** `unpdf` & native text extractors
- **Icons & Visualization:** `lucide-react`, `recharts`

---

## 📂 Project Structure

```
├── app/                  # Next.js App Router pages, layouts, and API routes
│   ├── (auth)/           # Authentication flows (Sign in, Sign up, Workspace creation)
│   ├── api/              # API endpoints, webhooks, and OAuth callbacks
│   └── w/[slug]/         # Tenant-scoped workspace routes (Inbox, Projects, Finance, etc.)
├── components/           # UI Components
│   ├── assistant/        # AI Copilot and Rich Content renderers
│   ├── auth/             # Authentication forms and shells
│   ├── automations/      # Background routines and triggers
│   ├── create/           # Universal creation drawers and modals
│   ├── dashboard/        # Charts, metrics, navigation, and overview cards
│   ├── landing/          # Marketing and landing page components
│   └── ui/               # Reusable base UI components (Shadcn UI)
├── docs/                 # Product specifications, PRDs, and module definitions
├── lib/                  # Core business logic
│   ├── actions/          # Server Actions (tasks, inbox, files, approvals)
│   ├── agents/           # AI Agent definitions and execution runtime
│   ├── ai/               # AI Provider adapters (Anthropic, OpenAI, Gemini, Heuristic)
│   ├── auth/             # Session handling and Data Access Layer (DAL)
│   ├── db/               # Prisma client and tenancy guards
│   ├── domain/           # Business domains (Finance, Inbox, Scoring, Tasks, etc.)
│   ├── integrations/     # Google Workspace (Gmail, Drive, Calendar) integrations
│   ├── jobs/             # Job queue, runners, and background scheduler
│   └── storage/          # Local filesystem and cloud asset storage
├── prisma/               # Prisma schema, migrations, and seed scripts
├── scripts/              # Worker runners, smoke tests, and tenant isolation verifiers
└── tests/                # Unit, integration, and database test suites
```

---

## 🏁 Getting Started

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **PostgreSQL**: Local or hosted database instance

### 2. Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/GalvanMoto/Personal_OS.git
   cd Personal_OS
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example `.env` file and update your credentials:
   ```bash
   cp .env.example .env
   ```

   Key environment variables:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/personal_os?schema=public"
   SESSION_SECRET="your-32-byte-random-hex-string"
   SECRET_ENCRYPTION_KEY="your-32-byte-hex-encryption-key"

   # AI Provider Configuration (anthropic | openai | gemini | heuristic)
   AI_PROVIDER="openai"
   OPENAI_API_KEY="sk-..."
   ```

4. **Initialize the Database:**
   ```bash
   # Run Prisma migrations
   npm run db:migrate

   # Generate Prisma client
   npm run db:generate

   # (Optional) Seed the database with demo workspace & data
   npm run db:seed
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Start the Background Job Worker (Optional / Async Processing):**
   ```bash
   npm run worker
   ```

---

## 🧪 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build the application for production |
| `npm run start` | Start production server |
| `npm run check` | Run typecheck, unit tests, DB integration tests, and tenancy verification |
| `npm run test` | Run fast unit tests (dates, extraction, storage, finance, strategies) |
| `npm run test:db` | Run database and pipeline integration tests |
| `npm run check:tenancy` | Verify row-level tenant isolation across all models |
| `npm run db:studio` | Open Prisma Studio to inspect the database |
| `npm run worker` | Launch background job runner and scheduler |
| `npm run smoke` | Run end-to-end smoke verification script |

---

## 📄 License

Private / Proprietary. All rights reserved.
