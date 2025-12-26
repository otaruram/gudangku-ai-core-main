# 🚀 Gudangku Deployment Guide

Follow these steps to deploy your application to production.

## Prerequisites
- A **GitHub Account** (The code is already pushed to your repo).
- A **Vercel Account** (for Frontend).
- A **Render Account** (for Backend).
- Your **Supabase Project** URL and Keys.
- Your **Groq API Key**.

---

## 1. Backend Deployment (Render)

We use **Render** because it supports Python efficiently and has a free tier.

1.  Login to [dashboard.render.com](https://dashboard.render.com/).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository: `otaruram/gudangku-ai-core-main`.
4.  **Configuration**:
    *   **Name**: `gudangku-ai-backend` (or similar)
    *   **Region**: Singapore (SG) or closest to you.
    *   **Branch**: `main`
    *   **Root Directory**: `be` (Important!)
    *   **Runtime**: Python 3
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
5.  **Environment Variables** (Add these in the "Environment" tab):
    *   `PYTHON_VERSION`: `3.11.0`
    *   `GROQ_API_KEY`: *(Paste your Groq Key)*
    *   `SUPABASE_URL`: `https://bpsowkovvzbvebuzewiy.supabase.co`
    *   `SUPABASE_KEY`: *(Paste your Supabase SERVICE_ROLE key)*
    *   `DATABASE_URL`: `postgresql://postgres:[PASSWORD]@db.bpsowkovvzbvebuzewiy.supabase.co:5432/postgres?pgbouncer=true` (Replace `[PASSWORD]` with your DB password)
    *   `BACKEND_DOMAINS`: `https://gudangku-ai.onrender.com` (Add `http://localhost:5173` if you need to test locally against prod DB, separated by comma).
    
    *Note: Frontend URLs (`gudangku.vercel.app`) are hardcoded in the backend, so you don't need to add them here.*

6.  Click **Create Web Service**.
7.  Wait for deployment to finish. Copy your backend URL (e.g., `https://gudangku-ai-backend.onrender.com`).

---

## 2. Frontend Deployment (Vercel)

We use **Vercel** for the React Frontend.

1.  Login to [vercel.com](https://vercel.com/).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository: `otaruram/gudangku-ai-core-main`.
4.  **Framework Preset**: Select **Vite**.
5.  **Root Directory**: Click "Edit" and select `fe`. (Important!)
6.  **Environment Variables**:
    *   `VITE_API_URL`: *(Paste your Render Backend URL from step 1)* -> e.g., `https://gudangku-ai-backend.onrender.com`
    *   `VITE_SUPABASE_URL`: `https://bpsowkovvzbvebuzewiy.supabase.co`
    *   `VITE_SUPABASE_ANON_KEY`: *(Paste your Supabase ANON key)*
7.  Click **Deploy**.
8.  Vercel will build and give you a URL (e.g., `https://gudangku.vercel.app`).

---

## 3. Final Connection Check

1.  **Update Database**: Ensure Supabase database password is correct in Render env vars.
2.  **Redirects**: Go to Supabase Dashboard -> Authentication -> URL Configuration. Add your Vercel Production URL (`https://gudangku.vercel.app/dashboard`) to the "Redirect URLs".

**Environment Variable Reference:**

| Component | Variable | Value Example |
| :--- | :--- | :--- |
| **Backend** | `BACKEND_DOMAINS` | `https://gudangku-ai.onrender.com` |
| **Backend** | `DATABASE_URL` | `postgresql://...?pgbouncer=true` |
| **Frontend** | `VITE_API_URL` | `https://gudangku-ai.onrender.com` |

Happy Shipping! 🚀
