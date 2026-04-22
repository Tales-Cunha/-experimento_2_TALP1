# Student Assessment Management System - Implementation Guide

This document summarizes what has been implemented so far, what issues were found, and how to resolve them.

## 1. Project Structure

- `client/`: React + TypeScript + Vite frontend
- `server/`: Node.js + Express + TypeScript backend
- `shared/`: shared domain types and utilities
- `data/`: JSON persistence files (`alunos.json`, `turmas.json`, `avaliacoes.json`, `emailQueue.json`)
- `tests/`: Cucumber acceptance tests + support files

## 2. What Has Been Implemented

### 2.1 Infrastructure and Local Development

- Local Docker development with:
  - `server/Dockerfile.dev`
  - `client/Dockerfile.dev`
  - `docker-compose.yml`
- Health endpoint available:
  - `GET /api/health`

### 2.2 Backend Modules

Implemented with route -> service -> repository separation.

- Students (`alunos`)
  - CRUD endpoints
  - CPF validation and duplicate CPF checks
- Classes (`turmas`)
  - CRUD endpoints
  - enrollment management
- Assessments (`avaliacoes`)
  - upsert by (`alunoId`, `turmaId`, `meta`)
  - list by class and by student

### 2.3 Frontend

- Students page (`/alunos`)
- Classes page (`/turmas`)
- Class detail page (`/turmas/:id`) with assessment section
- Assessments matrix page (`/avaliacoes`)
- API access concentrated in hooks/services (no direct fetch in components)

### 2.4 Email Digest Pipeline

- Queue persistence repository:
  - `server/src/repositories/EmailQueueRepository.ts`
- Queue service:
  - `server/src/services/EmailQueueService.ts`
- Sender service with Resend integration:
  - `server/src/services/EmailSenderService.ts`
- Daily cron job:
  - `server/src/jobs/emailDigestJob.ts`
- Job registration at API startup:
  - `server/src/index.ts`
- New backend dependencies:
  - `resend`
  - `node-cron`

Behavior:
- Every assessment save/update adds/updates a queue item for today.
- Same (`alunoId`, `turmaId`, `meta`) is replaced (latest `conceito` wins).
- Daily cron sends one digest per student and clears that student queue entries for today.
- In non-production mode, email payload is logged and no real email is sent.

## 3. Main Issues Found and How to Overcome

### 3.1 Permission Error (EACCES) on npm install

Observed error example:

`EACCES: permission denied, mkdir '/home/tales/Projects/AI/node_modules/fsevents'`

Root cause:
- Installing from workspace root may try to write into a root-level `node_modules` with ownership/permission mismatch.

How to overcome:

1. Install dependencies only in the package that needs them.

```bash
npm install --prefix /home/tales/Projects/AI/server
npm install --prefix /home/tales/Projects/AI/client
```

2. Prefer Docker local flow for dev runtime.

```bash
docker compose up --build
```

3. If permissions are already broken, fix ownership once (Linux):

```bash
sudo chown -R "$USER":"$USER" /home/tales/Projects/AI/node_modules
sudo chown -R "$USER":"$USER" /home/tales/Projects/AI/server/node_modules
sudo chown -R "$USER":"$USER" /home/tales/Projects/AI/client/node_modules
```

4. If still inconsistent, clean and reinstall package-local dependencies:

```bash
rm -rf /home/tales/Projects/AI/server/node_modules
rm -rf /home/tales/Projects/AI/client/node_modules
npm install --prefix /home/tales/Projects/AI/server
npm install --prefix /home/tales/Projects/AI/client
```

### 3.2 Dist Folder Write Permission During Build

Observed behavior:
- TypeScript build could not write to `server/dist/*` due to permissions.

How to overcome:

```bash
sudo chown -R "$USER":"$USER" /home/tales/Projects/AI/server/dist
```

Then rebuild:

```bash
npm run build --prefix /home/tales/Projects/AI/server
```

### 3.3 Shared Imports and TypeScript rootDir Noise

Observed behavior:
- TypeScript reports `shared/*` files as outside `rootDir` (`server/src`).

Why:
- Backend imports types from `shared/`, but current `server/tsconfig.json` has `rootDir` set to `src`.

Current practical workaround:
- Run through Docker dev (`ts-node`) where runtime is working.
- If needed, adjust tsconfig in a dedicated change so server compilation supports `../shared` cleanly.

## 4. Environment Variables Checklist

Use `.env` with at least:

```env
NODE_ENV=development
PORT=3001
DATA_DIR=/data
CRON_SCHEDULE=0 18 * * *
CORS_ORIGIN=http://localhost:5173
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

Notes:
- In development, missing Resend/domain setup does not block digest job (payload is logged instead).
- In production, `RESEND_API_KEY` and `EMAIL_FROM` are mandatory.

## 5. Quick Verification Flow

1. Start services:

```bash
docker compose up
```

2. Confirm backend health:

```bash
curl http://localhost:3001/api/health
```

3. Create student, class, and assessment from UI or API.
4. Confirm queue file updates:

```bash
cat /home/tales/Projects/AI/data/emailQueue.json
```

5. Trigger digest logic via scheduled time (or add a short cron for testing).
6. In development, verify email payload appears in server logs.

## 6. Current Status

- Core domain (students/classes/assessments): implemented
- Frontend pages: implemented
- Email queue/digest architecture: implemented
- Main blocker encountered: local filesystem permissions (`EACCES`), with documented recovery steps above
