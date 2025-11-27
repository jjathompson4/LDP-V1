# Deployment Guide

This project is configured for easy deployment on **Render**, but can be deployed to any provider that supports Python and Node.js.

## Option 1: Deploy to Render (Recommended)

This repository includes a `render.yaml` file (Infrastructure as Code) that sets up both the Frontend and Backend services automatically.

1.  **Push your code** to GitHub (you've already done this).
2.  **Sign up/Log in** to [Render.com](https://render.com).
3.  Go to **Blueprints** and click **New Blueprint Instance**.
4.  Connect your GitHub account and select your `LDP-V1` repository.
5.  Render will detect the `render.yaml` file and show you the two services it will create:
    *   `ldp-backend`: The Python API.
    *   `ldp-frontend`: The React App.
6.  Click **Apply**.

Render will create both services.

### Important: Post-Deployment Configuration
Because the Frontend is built separately, it needs to know the Backend's URL.
1.  Wait for the **ldp-backend** service to finish deploying.
2.  Copy its URL (e.g., `https://ldp-backend-xyz.onrender.com`).
3.  Go to the **ldp-frontend** service in your Render dashboard.
4.  Go to **Environment** -> **Add Environment Variable**.
5.  Key: `VITE_API_URL`
6.  Value: The URL you copied (no trailing slash).
7.  Save changes. This will trigger a new build for the frontend.

## Option 2: Manual Deployment

If you prefer other providers (Railway, Heroku, Vercel), here is the architecture:

### Backend
*   **Type**: Web Service (Python)
*   **Root Directory**: `backend`
*   **Build Command**: `pip install -r requirements.txt`
*   **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend
*   **Type**: Static Site or Web Service (Node)
*   **Root Directory**: `frontend`
*   **Build Command**: `npm install && npm run build`
*   **Output Directory**: `dist`
*   **Environment Variable**: You MUST set `VITE_API_URL` to the URL of your deployed backend (e.g., `https://your-backend.onrender.com`).
