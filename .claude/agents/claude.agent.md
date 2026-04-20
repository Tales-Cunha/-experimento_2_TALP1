---
name: claude
description:  Student Assessment Management System.
---

<!-- Tip: Use /create-agent in chat to generate content with agent assistance -->

# CLAUDE.md — Student Assessment Management System

> This file contains persistent instructions for Claude Code. Read it at the start of every session.

---

## Project Overview

A web system for managing students, classes (turmas), and assessments (avaliações) with email notifications. Built for a university course experiment using AI agents.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Runner (dev) | ts-node + nodemon |
| Tests | Cucumber.js + Gherkin (acceptance), Jest (unit) |
| Persistence | JSON files via Docker volume (no database) |
| Email | Resend API (https://resend.com) |
| Scheduler | node-cron (daily email digest) |
| Linting | ESLint + Prettier |
| Package manager | npm |
| Containers | Docker + Docker Compose |
| Frontend deploy | Vercel (static, free tier) |
| Backend deploy | Railway (Docker, free $5 credit/month) |

---

## Deployment Architecture

```
User → Vercel CDN (React SPA)
         ↓ fetch /api/*
       Railway (Node + Express)
         ↓ reads/writes
       Railway Volume (/data/*.json)
```

- Frontend and backend are **separate deployments**
- Frontend calls backend via `VITE_API_URL` env var (Railway public URL)
- Backend CORS must allow the Vercel domain
- No nginx needed — Vercel serves the static files directly; Railway runs the Node container

---

## Project Structure

```
/sistema
  /client                    ← React SPA (deployed to Vercel)
    /src
      /components            ← Reusable UI components
      /pages                 ← One folder per page/feature
      /hooks                 ← Custom React hooks (no fetch in components)
      /services              ← API call wrappers
    Dockerfile               ← NOT used by Vercel; keep for local docker compose
    Dockerfile.dev           ← Vite dev server for local Docker
    vite.config.ts           ← Must proxy /api to backend in dev
  /server                    ← Express REST API (deployed to Railway via Docker)
    /src
      /routes                ← Express route handlers (thin layer only)
      /services              ← Business logic (stateless, testable)
      /repositories          ← JSON read/write abstraction
      /jobs                  ← Scheduled tasks (email digest)
    Dockerfile               ← Multi-stage: compile TS → run node (used by Railway)
    Dockerfile.dev           ← nodemon + ts-node for local Docker
  /shared                    ← Types and utils shared by client and server
    types.ts
    /utils
      cpfValidator.ts
  /tests                     ← Acceptance tests
    /features                ← .feature files (Gherkin)
    /steps                   ← Step definitions (TypeScript)
    /support                 ← Cucumber hooks and world setup
  /data                      ← JSON files (Docker named volume — never committed)
    alunos.json
    turmas.json
    avaliacoes.json
    emailQueue.json
  docker-compose.yml         ← Local development only
  .env.example
  .gitignore
  README.md
```

---

## Domain Model

```typescript
// /shared/types.ts

type Conceito = "MANA" | "MPA" | "MA";
// MANA = Meta Ainda Não Atingida
// MPA  = Meta Parcialmente Atingida
// MA   = Meta Atingida

type Meta = "Requisitos" | "Testes" | "Implementação" | "Refatoração" | "Documentação";

interface Aluno {
  id: string;       // UUID
  nome: string;
  cpf: string;      // "000.000.000-00", unique, valid check digits
  email: string;
}

interface Turma {
  id: string;
  topico: string;
  ano: number;
  semestre: 1 | 2;
  alunosIds: string[];
}

interface Avaliacao {
  id: string;
  alunoId: string;
  turmaId: string;
  meta: Meta;
  conceito: Conceito;
  updatedAt: string; // ISO date string
}

interface EmailQueueEntry {
  alunoId: string;
  date: string;     // YYYY-MM-DD — one digest per student per day
  changes: {
    turmaId: string;
    turmaNome: string;
    meta: Meta;
    conceito: Conceito;
  }[];
}
```

---

## Docker Setup (Local Development Only)

### docker-compose.yml

```yaml
version: "3.9"
services:
  server:
    build:
      context: ./server
      dockerfile: Dockerfile.dev
    volumes:
      - ./server:/app
      - ./shared:/shared
      - data_volume:/data
    env_file: .env
    ports:
      - "3001:3001"

  client:
    build:
      context: ./client
      dockerfile: Dockerfile.dev
    volumes:
      - ./client:/app
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3001

volumes:
  data_volume:
```

### Server Dockerfile.dev (hot reload)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npx", "nodemon", "--exec", "ts-node", "src/index.ts"]
```

### Server Dockerfile (production — used by Railway)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### Client Dockerfile.dev (local only — Vercel handles production build itself)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npx", "vite", "--host"]
```

### Docker rules
- `/data` is always a **named Docker volume** — never baked into any image
- In local dev, frontend calls backend at `http://localhost:3001` via `VITE_API_URL`
- In production, frontend calls Railway backend URL via `VITE_API_URL`

---

## Deployment

### Frontend → Vercel

1. Connect GitHub repo to Vercel
2. Set **Root Directory** to `client`
3. Vercel auto-detects Vite — no extra config needed
4. Set environment variable: `VITE_API_URL=https://your-app.railway.app`
5. Every push to `main` triggers automatic redeploy

**vercel.json** (place in `/client`):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
This ensures React Router works on page refresh.

### Backend → Railway

1. Create new Railway project → "Deploy from GitHub repo"
2. Set **Root Directory** to `server`
3. Railway detects the `Dockerfile` automatically
4. Add a **Railway Volume** mounted at `/data`
5. Set environment variables (see below)
6. Railway gives a public URL like `https://your-app.railway.app`

### Backend environment variables on Railway
```
NODE_ENV=production
PORT=3001
DATA_DIR=/data
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
CRON_SCHEDULE=0 18 * * *
CORS_ORIGIN=https://your-app.vercel.app
```

### Local .env (copy from .env.example)
```
NODE_ENV=development
PORT=3001
DATA_DIR=/data
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
CRON_SCHEDULE=0 18 * * *
CORS_ORIGIN=http://localhost:5173
```

---

## CORS Configuration

The backend **must** configure CORS to allow the Vercel frontend domain:

```typescript
// server/src/index.ts
import cors from 'cors';

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
```

In development, `CORS_ORIGIN=http://localhost:5173`.
In production, `CORS_ORIGIN=https://your-app.vercel.app`.

---

## Email (Resend SDK)

```bash
npm install resend   # in /server
```

```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: process.env.EMAIL_FROM!,
  to: aluno.email,
  subject: 'Suas avaliações foram atualizadas',
  html: buildDigestHtml(aluno, changes),
});
```

- In `NODE_ENV !== production` → log the email content to console, skip the Resend call
- Never send real emails during Cucumber tests

---

## Email Batching Rules

1. Assessment saved/updated → add entry to `emailQueue.json`
2. `node-cron` job runs once daily at `CRON_SCHEDULE` time
3. For each student with entries for today → send **one digest email** with all changes across all turmas
4. After sending → clear those entries from the queue
5. Same `(alunoId, turmaId, meta)` updated multiple times today → keep only the **latest** conceito

---

## Coding Rules

### TypeScript
- **No `any` types** — ever. Use `unknown` + narrowing, or define proper interfaces.
- Strict mode enabled in all `tsconfig.json`.
- Shared types always imported from `/shared/types.ts`.

### Backend
- Routes: validate input → call service → return response. Nothing else.
- Services: all business logic. Stateless. No JSON access.
- Repositories: all JSON file I/O. No business logic.
- IDs: always `uuid` package.
- File paths: always `process.env.DATA_DIR` — never hardcode `./data`.
- CORS: always configured from `CORS_ORIGIN` env var.

### Frontend
- No `fetch` in components — only in hooks or service files.
- API URL always from `import.meta.env.VITE_API_URL`.
- Always show loading and error states.
- One page = one folder under `/client/src/pages/`.
- `vercel.json` must be present in `/client` for React Router to work after deploy.

### Testing
- Write Gherkin `.feature` file **before** writing implementation.
- Step definitions make real HTTP calls to the local backend container.
- `npm run test:acceptance` — Cucumber tests.
- `npm run test:unit` — Jest unit tests.

### Commits
- One commit per accepted agent action.
- Format: `feat:` / `test:` / `fix:` / `refactor:` / `docs:` / `chore:` / `docker:`

---

## API Routes

```
GET    /api/alunos                 → list all students
POST   /api/alunos                 → create student
PUT    /api/alunos/:id             → update student
DELETE /api/alunos/:id             → delete student

GET    /api/turmas                 → list all classes
POST   /api/turmas                 → create class
PUT    /api/turmas/:id             → update class
DELETE /api/turmas/:id             → delete class

GET    /api/turmas/:id/avaliacoes  → assessments for a class
POST   /api/avaliacoes             → create or update assessment
GET    /api/alunos/:id/avaliacoes  → all assessments for a student
```

---

## Frontend Pages

| Route | Description |
|---|---|
| `/alunos` | List, add, edit, remove students |
| `/turmas` | List, add, edit, remove classes |
| `/turmas/:id` | Class detail: enrolled students + assessment table |
| `/avaliacoes` | Global table: all students × all metas |

---

## What NOT to do

- No database — JSON files only (assignment requirement)
- No authentication or login system
- No synchronous email on assessment save
- No business logic in React components
- No `any` in TypeScript
- No hardcoded file paths — use `DATA_DIR`
- No hardcoded API URLs — use `VITE_API_URL`
- No `/data` files baked into Docker images
- No implementation before writing the Gherkin scenario
- No nginx — Vercel handles the frontend, no proxy needed in production