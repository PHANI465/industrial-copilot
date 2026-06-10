# Industrial Operations Copilot

Next.js demo: live-style monitoring for a fictional North Sea facility (~95 assets, 175 sensors), rule-based anomaly detection, failure matching, SOP recommendations, and an AI chat (OpenAI) with TF‑IDF document retrieval.

## Scalability & AWS Migration

This application is built to scale from prototype to production. Currently deployed on Vercel with a Next.js full-stack architecture, it can be migrated to AWS for enterprise-scale operations:

- **AWS Lambda** for event-driven processing and anomaly detection at scale
- **AWS DynamoDB** for time-series sensor data (millions of readings per second)
- **AWS RDS PostgreSQL** for alerts, work orders, and historical records
- **AWS S3** for archiving and long-term data retention
- **AWS EventBridge** for complex alert routing and orchestration
- **Hybrid approach:** Keep frontend on Vercel/Amplify, move backend to AWS Lambda for cost-efficient auto-scaling

Migration requires minimal code changes—API routes become Lambda functions, JSON storage becomes DynamoDB, and the frontend remains unchanged. Current setup handles 5 equipment streams; AWS version scales to thousands.

## Setup

```bash
npm install
npm run prepare-data   # if CSV sources change — builds public/data/*.json
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## OpenAI (optional)

1. Copy `.env.example` to `.env.local`.
2. Set `OPENAI_API_KEY` to your key (server-side only — never `NEXT_PUBLIC_`).
3. Without a key, chat still works using **keyword / rules** mode (badge shows “Keyword” instead of “GPT”).

## CRITICAL email alerts (optional)

Uses [Resend](https://resend.com) from the server (no key in the browser).

1. Create a Resend account and API key; add `RESEND_API_KEY` and optionally `RESEND_FROM_EMAIL` to `.env.local` (use `onboarding@resend.dev` for quick tests).
2. On **Vercel**, the filesystem is read-only — use `ALERT_SUBSCRIBER_EMAILS` (comma-separated = **all** CRITICAL alerts) and/or **`ALERT_SUBSCRIBER_RULES`** as a JSON array of `{ "email", "tags"?, "areas"?, "types"? }` to route alerts by asset tag, platform area, or equipment type. Locally, the dashboard form can also write `data/alert-subscribers.json` with the same shape.
3. When equipment first hits **CRITICAL**, only subscribers whose rules match those assets are emailed; **all-assets** rules have no filters. Same asset group is throttled about every 10 minutes.

## Security before GitHub / Vercel

- **Never commit** `.env.local` or any file containing a real API key.
- Run **`npm run check-secrets`** before you push; it scans **tracked** files for common key patterns.
- If a key was ever committed or pasted into chat/issues, **rotate it** in the OpenAI dashboard.
- On Vercel, set `OPENAI_API_KEY` in **Project → Settings → Environment Variables** (not in the repo).

## Data & scripts

- **`npm run prepare-data`** — CSV → optimized JSON under `public/data/`.
- **`npm run generate-data`** — optional synthetic time-series (TypeScript).
- **`npm run generate-sarimax`** — optional slow Python pipeline (not required for the app).

## Export API

`GET /api/export?type=` one of: `maintenance`, `failures`, `sensors`, `assets`, `timeseries` (requires `&tag=V-101` etc. for time-series).

## Deploy

Standard Next.js on [Vercel](https://vercel.com): connect the repo, add env vars, deploy.
