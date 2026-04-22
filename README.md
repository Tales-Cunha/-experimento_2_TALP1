# Student Assessment Management System (SAMS)

A modern, high-efficiency academic portal for managing student assessments with a "Technical Editorial" aesthetic.

## 🚀 Quick Start

### 1. Requirements
* Docker and Docker Compose
* Node.js 20+ (for local testing)

### 2. Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd AI

# Setup environment
cp .env.example .env
```

### 3. Run with Docker
```bash
docker compose up --build
```
*   **Frontend**: http://localhost:5173
*   **Backend**: http://localhost:3001

## 🧪 Testing

### Automated Suite
Run the full pipeline (Health check -> Unit Tests -> Acceptance Tests):
```bash
./sistema/run-tests.sh
```

### Manual Commands
*   **Unit Tests**: `npm run test:unit`
*   **Acceptance (Cucumber)**: `DATA_DIR=$(pwd)/data npm run test:acceptance`

## 📧 Email System
SAMS uses a **Daily Digest** pattern to prevent spamming students.
*   **Queueing**: Every assessment change is added to a daily queue.
*   **Deduplication**: If you change a grade twice in one day, only the latest is kept.
*   **Trigger**: The job runs daily via `node-cron`. For testing, trigger it manually:
    ```bash
    curl -X POST http://localhost:3001/api/email/send-digest
    ```

---

## ☁️ Deployment Guide

### Frontend (Vercel)
The frontend is a Vite + React SPA.
1.  Connect your GitHub repo to **Vercel**.
2.  Set the **Root Directory** to `client`.
3.  Set the **Build Command** to `npm run build`.
4.  Set the **Output Directory** to `dist`.
5.  Add **Environment Variable**:
    *   `VITE_API_URL`: Your Railway Backend URL (e.g., `https://sams-api.up.railway.app`).

### Backend (Railway)
The backend is a Node.js Express server.
1.  Create a new project on **Railway**.
2.  Connect your GitHub repo.
3.  Set the **Root Directory** to `server`.
4.  Railway will automatically detect the `Dockerfile`.
5.  Add **Environment Variables**:
    *   `NODE_ENV`: `production`
    *   `PORT`: `3001`
    *   `DATA_DIR`: `/data`
    *   `RESEND_API_KEY`: Your key from resend.com
    *   `EMAIL_FROM`: Your verified domain email
6.  **Persistence**: Add a **Volume** in Railway settings and mount it to `/data` so your JSON files aren't wiped on restart.
