# Music Mood DJ

A small full-stack project that lets users upload music files, generate mood-based mixes using an LLM (with a fallback), and play the generated playlist in the browser. Backend focuses on architecture, DB schema, caching, and clean APIs. Frontend is a minimal React/Vite app for upload, playback, and mixing.

## Live demo
- Frontend (Vercel): https://music-mood-dj-git-main-sarvesh-harnes-projects.vercel.app
- Backend API (Railway): https://music-mood-dj-production.up.railway.app/

---

## Features
- Upload mp3/wav files (stored on server or S3 if configured)
- Store track metadata in PostgreSQL
- Generate mood-based playlists using an LLM (OpenAI) or safe random fallback
- Persist mixes and mix items in DB; increment `selected_count`
- `/api/stats/top-tracks` — aggregated + cached (Redis or in-memory TTL)
- Simple web UI for upload, playback, generate, and top tracks

---

## Architecture
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL (Railway)
- Cache: Redis (optional) or in-memory TTL
- Hosting: Vercel (frontend), Railway (backend & Postgres)

---
