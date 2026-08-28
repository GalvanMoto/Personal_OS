import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"

export default function Page() {
  return (
    <DocsPage
      toc={[
        { title: "Prerequisites", url: "#prerequisites", depth: 2 },
        { title: "1. Clone Repository & Environment", url: "#1-clone-repository-environment", depth: 2 },
        { title: "2. Database Setup (PostgreSQL)", url: "#2-database-setup-postgresql", depth: 2 },
        { title: "3. Redis Setup (Live Sync)", url: "#3-redis-setup-live-sync", depth: 2 },
        { title: "4. AI Provider Configuration", url: "#4-ai-provider-configuration", depth: 2 },
        { title: "5. Google Workspace OAuth (Optional)", url: "#5-google-workspace-oauth-optional", depth: 2 },
        { title: "6. Install Dependencies & Run", url: "#6-install-dependencies-run", depth: 2 },
        { title: "7. Verify Installation", url: "#7-verify-installation", depth: 2 },
        { title: "Docker Deployment", url: "#docker-deployment", depth: 2 },
        { title: "Troubleshooting", url: "#troubleshooting", depth: 2 },
      ]}
    >
      <DocsTitle>Installation Guide</DocsTitle>
      <DocsDescription>Complete step-by-step setup for DLRS Personal OS — from prerequisites to running locally.</DocsDescription>
      <DocsBody>
        <h2 id="prerequisites">Prerequisites</h2>

        <Callout type="info" title="Before You Start">
          <strong>Required:</strong> Node.js 20+, PostgreSQL 14+, Redis 7+<br/>
          <strong>Optional but recommended:</strong> Docker, an AI API key (Anthropic/OpenAI/Gemini/Azure), Google Cloud project for OAuth
        </Callout>

        <Tabs items={["macOS", "Windows (WSL2)", "Linux", "Docker"]}>
          <Tab value="macOS">
            <pre><code>{`# Install via Homebrew
brew install node@20 postgresql@14 redis

# Start services
brew services start postgresql@14
brew services start redis

# Verify
node --version   # v20.x.x
psql --version   # 14.x
redis-cli ping   # PONG`}</code></pre>
          </Tab>
          <Tab value="Windows (WSL2)">
            <pre><code>{`# In WSL2 (Ubuntu)
sudo apt update && sudo apt install -y nodejs postgresql redis-server

# Or use nvm for Node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20

# Start services
sudo service postgresql start
sudo service redis-server start`}</code></pre>
          </Tab>
          <Tab value="Linux">
            <pre><code>{`# Ubuntu/Debian
sudo apt update && sudo apt install -y nodejs postgresql redis-server

# Arch
sudo pacman -S nodejs postgresql redis

# Fedora
sudo dnf install nodejs postgresql redis`}</code></pre>
          </Tab>
          <Tab value="Docker">
            <pre><code>{`# Quick start with Docker Compose
docker compose up -d postgres redis

# Services available at:
# PostgreSQL: localhost:5432
# Redis: localhost:6379`}</code></pre>
          </Tab>
        </Tabs>

        <h2 id="1-clone-repository-environment">1. Clone Repository & Environment</h2>

        <Steps>
          <Step>
            <h3>Clone the repository</h3>
            <pre><code>{`git clone https://github.com/your-org/DLRS_web.git
cd DLRS_web`}</code></pre>
          </Step>
          <Step>
            <h3>Copy environment template</h3>
            <pre><code>{`cp .env.example .env`}</code></pre>
          </Step>
          <Step>
            <h3>Generate required secrets</h3>
            <pre><code>{`# Run these commands to generate 32-byte hex secrets
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SECRET_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"  # For vault encryption
node -e "console.log('WEBHOOK_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"      # For inbox webhooks`}</code></pre>
            <p>Copy each output into your <code>.env</code> file.</p>
          </Step>
        </Steps>

        <h2 id="2-database-setup-postgresql">2. Database Setup (PostgreSQL)</h2>

        <Tabs items={["Local PostgreSQL", "Prisma Postgres (Cloud)", "Docker PostgreSQL"]}>
          <Tab value="Local PostgreSQL">
            <Steps>
              <Step>
                <h3>Create database</h3>
                <pre><code>{`# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE dlrs_os;
CREATE USER dlrs_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE dlrs_os TO dlrs_user;
\q`}</code></pre>
              </Step>
              <Step>
                <h3>Update DATABASE_URL in .env</h3>
                <pre><code>{`DATABASE_URL="postgresql://dlrs_user:your_password@localhost:5432/dlrs_os?schema=public"`}</code></pre>
              </Step>
            </Steps>
          </Tab>
          <Tab value="Prisma Postgres (Cloud)">
            <Steps>
              <Step>
                <h3>Create Prisma Postgres database</h3>
                <pre><code>{`# Option 1: Via Prisma Console
npx prisma postgres create --name dlrs-os

# Option 2: Via create-db CLI (if available)
npx create-db@latest`}</code></pre>
              </Step>
              <Step>
                <h3>Copy connection string to .env</h3>
                <p>The output will include a <code>DATABASE_URL</code> — paste it into your <code>.env</code>.</p>
              </Step>
            </Steps>
          </Tab>
          <Tab value="Docker PostgreSQL">
            <pre><code>{`# docker-compose.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: dlrs_os
      POSTGRES_USER: dlrs_user
      POSTGRES_PASSWORD: your_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  postgres_data:

# Run: docker compose up -d`}</code></pre>
          </Tab>
        </Tabs>

        <Steps>
          <Step>
            <h3>Generate Prisma Client</h3>
            <pre><code>{`npm run db:generate
# Output: Prisma Client generated to ./node_modules/.prisma/client`}</code></pre>
          </Step>
          <Step>
            <h3>Run Migrations</h3>
            <pre><code>{`npm run db:migrate
# Creates all tables: users, workspaces, tasks, projects, clients, emails, etc.`}</code></pre>
          </Step>
          <Step>
            <h3>(Optional) Seed Demo Data</h3>
            <pre><code>{`npm run db:seed
# Creates demo workspace with sample tasks, projects, clients`}</code></pre>
          </Step>
        </Steps>

        <h2 id="3-redis-setup-live-sync">3. Redis Setup (Live Sync)</h2>
        <p>Redis powers real-time features: live badges, notifications, inbox/task updates across tabs.</p>

        <Steps>
          <Step>
            <h3>Verify Redis is running</h3>
            <pre><code>{`redis-cli ping
# Should return: PONG`}</code></pre>
          </Step>
          <Step>
            <h3>Set REDIS_URL in .env</h3>
            <pre><code>{`# Local default (if empty, defaults to this)
REDIS_URL="redis://localhost:6379"

# Or Upstash (serverless Redis)
# REDIS_URL="rediss://default:token@region.upstash.io:6379"
# UPSTASH_REDIS_REST_URL="https://..."
# UPSTASH_REDIS_REST_TOKEN="..."`}</code></pre>
          </Step>
        </Steps>

        <h2 id="4-ai-provider-configuration">4. AI Provider Configuration</h2>
        <p>DLRS supports multiple AI providers. <strong>At least one is required</strong> for AI extraction. The system auto-detects if <code>AI_PROVIDER</code> is not set.</p>

        <Tabs items={["Anthropic (Claude)", "OpenAI", "Google Gemini", "Azure OpenAI", "Heuristic (No API Key)"]}>
          <Tab value="Anthropic (Claude)">
            <pre><code>{`AI_PROVIDER="anthropic"
ANTHROPIC_API_KEY="sk-ant-..."
AGENT_MODEL="claude-3-5-sonnet-20241022"  # or claude-3-haiku for cost savings`}</code></pre>
          </Tab>
          <Tab value="OpenAI">
            <pre><code>{`AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"  # or gpt-4o for higher quality`}</code></pre>
          </Tab>
          <Tab value="Google Gemini">
            <pre><code>{`AI_PROVIDER="gemini"
GEMINI_API_KEY="..."
GEMINI_MODEL="gemini-1.5-flash"`}</code></pre>
          </Tab>
          <Tab value="Azure OpenAI">
            <pre><code>{`AI_PROVIDER="azure"
AZURE_OPENAI_API_KEY="..."
AZURE_OPENAI_ENDPOINT="https://your-resource.cognitiveservices.azure.com/"
AZURE_OPENAI_DEPLOYMENT="gpt-5.4-nano"  # Your deployment name
AZURE_OPENAI_API_VERSION="2024-12-01-preview"`}</code></pre>
          </Tab>
          <Tab value="Heuristic (No API Key)">
            <pre><code>{`# Leave AI_PROVIDER empty or set:
AI_PROVIDER="heuristic"

# Uses rule-based extraction (regex, keywords)
# Good for testing, limited accuracy`}</code></pre>
          </Tab>
        </Tabs>

        <h2 id="5-google-workspace-oauth-optional">5. Google Workspace OAuth (Optional but Powerful)</h2>
        <p>Enables Gmail ingestion, Drive indexing, Calendar sync.</p>

        <Steps>
          <Step>
            <h3>Create Google Cloud Project</h3>
            <ol>
              <li>Go to <a href="https://console.cloud.google.com" target="_blank" className="underline">Google Cloud Console</a></li>
              <li>Create new project or select existing</li>
              <li>Enable APIs: <strong>Gmail API</strong>, <strong>Google Drive API</strong>, <strong>Google Calendar API</strong></li>
            </ol>
          </Step>
          <Step>
            <h3>Configure OAuth Consent Screen</h3>
            <ul>
              <li>User Type: <strong>External</strong> (for personal use)</li>
              <li>App name: "DLRS Personal OS"</li>
              <li>Scopes: <code>.../auth/gmail.readonly</code>, <code>.../auth/drive.readonly</code>, <code>.../auth/calendar.readonly</code></li>
              <li>Test users: Add your email</li>
            </ul>
          </Step>
          <Step>
            <h3>Create OAuth Credentials</h3>
            <ul>
              <li>Application type: <strong>Web application</strong></li>
              <li>Authorized redirect URIs:
                <pre><code>{`http://localhost:3000/api/integrations/gmail/callback
http://localhost:3000/api/integrations/drive/callback
http://localhost:3000/api/integrations/calendar/callback`}</code></pre>
              </li>
            </ul>
          </Step>
          <Step>
            <h3>Add to .env</h3>
            <pre><code>{`GMAIL_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="GOCSPX-..."
GOOGLE_DRIVE_CLIENT_ID="same-or-different-client-id"
GOOGLE_DRIVE_CLIENT_SECRET="..."
GOOGLE_CALENDAR_CLIENT_ID="same-or-different-client-id"
GOOGLE_CALENDAR_CLIENT_SECRET="..."

# SECRET_ENCRYPTION_KEY already generated in step 1 - encrypts OAuth tokens`}</code></pre>
          </Step>
        </Steps>

        <h2 id="6-install-dependencies-run">6. Install Dependencies & Run</h2>

        <Steps>
          <Step>
            <h3>Install npm packages</h3>
            <pre><code>{`npm install
# Installs ~1000 packages including Next.js, Prisma, Fumadocs, AI SDKs`}</code></pre>
          </Step>
          <Step>
            <h3>Start development server</h3>
            <pre><code>{`npm run dev
# Starts at http://localhost:3000`}</code></pre>
          </Step>
          <Step>
            <h3>Start background worker (separate terminal)</h3>
            <pre><code>{`npm run worker
# Processes: email ingestion, AI extraction, reminders, subscriptions`}</code></pre>
          </Step>
        </Steps>

        <h2 id="7-verify-installation">7. Verify Installation</h2>

        <Tabs items={["Health Checks", "Manual Test", "Run Test Suite"]}>
          <Tab value="Health Checks">
            <pre><code>{`# TypeScript check
npm run typecheck

# Unit tests
npm run test

# Database integration tests
npm run test:db

# Tenancy isolation check (CI gate)
npm run check:tenancy

# All checks
npm run check`}</code></pre>
          </Tab>
          <Tab value="Manual Test">
            <ol>
              <li>Open <a href="http://localhost:3000" target="_blank" className="underline">http://localhost:3000</a></li>
              <li>Sign up → Create workspace "My Studio"</li>
              <li>Go to <strong>Inbox</strong> → Paste: <code>"Create 3 reels for GB Banquet by Friday. Photos in Drive."</code></li>
              <li>Click <strong>Extract</strong> → Review → <strong>Create</strong></li>
              <li>Open <strong>Tasks</strong> → Click task → <strong>Start Work</strong> → See Context Pack</li>
            </ol>
          </Tab>
          <Tab value="Run Test Suite">
            <pre><code>{`# Full test suite (takes ~2-3 minutes)
npm run check

# Individual test files
npx tsx --conditions=react-server --test tests/dates.test.ts
npx tsx --conditions=react-server --test tests/extraction.test.ts
npx tsx --conditions=react-server --test tests/pipeline.test.ts`}</code></pre>
          </Tab>
        </Tabs>

        <h2 id="docker-deployment">Docker Deployment (Production)</h2>

        <Callout type="warn" title="Production Checklist">
          <ul className="list-disc pl-4 mt-2 space-y-1">
            <li>Use strong unique secrets (<code>SESSION_SECRET</code>, <code>SECRET_ENCRYPTION_KEY</code>)</li>
            <li>Use managed PostgreSQL (Neon, Supabase, Prisma Postgres, RDS)</li>
            <li>Use managed Redis (Upstash, Redis Cloud, ElastiCache)</li>
            <li>Set <code>NODE_ENV=production</code></li>
            <li>Configure reverse proxy (nginx/Traefik) with SSL</li>
            <li>Run <code>npm run build && npm start</code> (not <code>npm run dev</code>)</li>
          </ul>
        </Callout>

        <pre><code>{`# Dockerfile (multi-stage)
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY . .
RUN npm run build

FROM base AS runner
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]

# docker-compose.prod.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env.production
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16
    env_file: .env.production
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:`}</code></pre>

        <h2 id="troubleshooting">Troubleshooting</h2>

        <Accordion>
          <AccordionItem value="prisma-error" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Prisma P1001 / P1003 — Can't reach database</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ol className="list-decimal pl-4 space-y-2">
                <li>Check <code>DATABASE_URL</code> format: <code>postgresql://user:pass@host:5432/db?schema=public</code></li>
                <li>Verify PostgreSQL is running: <code>pg_isready</code> or <code>brew services list</code></li>
                <li>Check firewall/security groups allow port 5432</li>
                <li>For Prisma Postgres: ensure <code>prisma7.config.ts</code> is configured</li>
                <li>Reset: <code>rm -rf node_modules/.prisma && npm run db:generate</code></li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="chunk-error" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">ChunkLoadError / Turbopack reload loop</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p>Root layout includes a chunk-retry guard. To fix:</p>
              <pre><code>{`rm -rf .next
npm run dev`}</code></pre>
              <p>Clear browser cache / hard refresh (Cmd+Shift+R).</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="css-missing" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Fumadocs styles not applied / layout broken</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ol className="list-decimal pl-4 space-y-2">
                <li>Ensure <code>app/globals.css</code> has: <code>@import "fumadocs-ui/css/shadcn.css"</code> and <code>@import "fumadocs-ui/css/preset.css"</code></li>
                <li>Ensure <code>app/docs/docs.css</code> is imported in <code>app/docs/layout.tsx</code></li>
                <li>Restart dev server after CSS changes: <code>rm -rf .next && npm run dev</code></li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="redis-connection" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Redis connection refused / ECONNREFUSED</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ol className="list-decimal pl-4 space-y-2">
                <li>Check Redis is running: <code>redis-cli ping</code></li>
                <li>Verify <code>REDIS_URL</code> in .env matches your Redis host/port</li>
                <li>For Upstash: use <code>rediss://</code> (TLS) not <code>redis://</code></li>
                <li>App falls back to polling if Redis unavailable (check console for warnings)</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="oauth-redirect" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Google OAuth redirect_uri_mismatch</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p>Exact match required in Google Cloud Console:</p>
              <pre><code>{`http://localhost:3000/api/integrations/gmail/callback
http://localhost:3000/api/integrations/drive/callback
http://localhost:3000/api/integrations/calendar/callback`}</code></pre>
              <p>No trailing slashes, no HTTPS for localhost. For production, use your domain with HTTPS.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="ai-not-working" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">AI extraction not working / returning empty</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ol className="list-decimal pl-4 space-y-2">
                <li>Check <code>AI_PROVIDER</code> and corresponding API key in .env</li>
                <li>Check browser console / server logs for error messages</li>
                <li>Try <code>AI_PROVIDER="heuristic"</code> to test without API key</li>
                <li>Verify API key has credits/quota remaining</li>
                <li>For Azure: check deployment name matches <code>AZURE_OPENAI_DEPLOYMENT</code></li>
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DocsBody>
    </DocsPage>
  )
}