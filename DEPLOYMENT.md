# Deployment Guide

This project is prepared for a Vercel-only deployment:
- App + API route (Next.js): Vercel
- Model provider: Hugging Face Router API

## 1) Deploy App to Vercel

1. Import this repo in Vercel.
2. Framework preset should be Next.js.
3. Add env vars:
   - `HF_API_KEY` (required)
   - `HF_MODEL` (optional, default: `Qwen/Qwen2.5-7B-Instruct`)
   - `HF_API_URL` (optional, default: `https://router.huggingface.co/v1/chat/completions`)
4. Deploy.

The API route is handled in-app at `app/api/generate` and calls Hugging Face directly.

## 2) Local Development

1. Copy `.env.example` to `.env.local`.
2. Set `HF_API_KEY` in `.env.local`.
3. (Optional) set `HF_MODEL` and `HF_API_URL`.
4. Run app in project root:
   - `npm run dev`

## Notes
- Keep real keys only in Vercel environment variables.
- Do not commit secret `.env` files.
