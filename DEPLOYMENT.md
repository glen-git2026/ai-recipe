# Deployment Guide

This project is prepared for a split deployment:
- Frontend (Next.js): Vercel
- Backend API (Hugging Face): Render

## 1) Deploy Backend to Render

Backend source is in `backend/`.

### Option A: Blueprint (recommended)
1. In Render, create a new Blueprint and select this repo.
2. Render will detect `render.yaml`.
3. Set secret env var:
   - `HF_API_KEY` = your Hugging Face key
4. Deploy.

### Option B: Manual Web Service
1. Create a new Web Service from this repo.
2. Set Root Directory to `backend`.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add env vars:
   - `HF_API_KEY` (required)
   - `HF_MODEL` (optional, default: `Qwen/Qwen2.5-7B-Instruct`)
   - `HF_API_URL` (optional)

After deploy, copy the backend URL, for example:
`https://chefs-lab-api.onrender.com`

## 2) Deploy Frontend to Vercel

1. Import this repo in Vercel.
2. Framework preset should be Next.js.
3. Add env var:
   - `RECIPE_API_URL` = your Render backend URL (no trailing slash)
4. Deploy.

The frontend route `app/api/generate` will proxy to:
`$RECIPE_API_URL/generate`

## 3) Local Development

### Backend
1. Copy `backend/.env.example` to `backend/.env` and fill `HF_API_KEY`.
2. Run backend:
   - `cd backend`
   - `npm install`
   - `npm start`

### Frontend
1. Copy `.env.example` to `.env.local`.
2. Set:
   - `RECIPE_API_URL=http://localhost:8000`
3. Run frontend in project root:
   - `npm run dev`

## Notes
- Keep all real keys only in Render/Vercel environment variables.
- Do not commit secret `.env` files.
