# Migrating off Emergent

This app (AdvisoryPro) was originally built on Emergent, which routes AI and
payment calls through its own metered proxy (`emergentintegrations` package +
`EMERGENT_LLM_KEY`) and hosts the dev/runtime environment. This document
covers what was changed to run it independently, and what's left to do.

## What was changed

1. **`backend/utils/emergent_compat.py`** (new file) — a drop-in shim that
   implements the same `LlmChat` / `UserMessage` / `ImageContent` /
   `OpenAISpeechToText` / `StripeCheckout` interfaces the app already calls,
   but backed directly by the official `openai` and `stripe` SDKs using your
   own API keys. No calling code (routes) needed to change beyond the import
   line.

2. **Import swaps** — every `from emergentintegrations...` import in
   `backend/routes/{ai_advisor,voice,documents,transactions,subscriptions}.py`
   and `backend/server.py` now points at `utils.emergent_compat` instead.

3. **`EMERGENT_LLM_KEY` → `OPENAI_API_KEY`** — all `os.environ.get(...)`
   lookups for the AI key now read the standard `OPENAI_API_KEY` env var.

4. **Receipt storage** — `backend/routes/transactions.py` no longer calls
   Emergent's object-storage proxy (`integrations.emergentagent.com/objstore`).
   Receipts are now written to local disk under `UPLOAD_DIR` (default:
   `backend/uploads/`). For production, either mount a persistent volume
   there or swap `put_object`/`get_object` for an S3-compatible bucket
   (boto3 is already a dependency) — Cloudflare R2's free tier covers most
   small apps.

5. **`backend/requirements.txt`** — removed `emergentintegrations==0.1.0`
   and Emergent's private package index. `openai` and `stripe` were already
   listed as dependencies (Emergent's package wrapped them), so nothing new
   to install.

6. **`.env.example`** added for both `backend/` and `frontend/` listing every
   environment variable the app actually reads.

7. **`docker-compose.yml`** added at the repo root for a local MongoDB
   instance, so you don't need Atlas for local development.

## What was NOT changed (safe to ignore)

- `frontend/plugins/visual-edits/` — Emergent's in-browser "click to edit"
  dev tooling. It's disabled automatically in production builds
  (`NODE_ENV=production`) and harmless in dev (just whitelists CORS from
  `*.emergent.sh` domains, which nothing will ever hit off-platform). Fine
  to leave, or delete `frontend/plugins/visual-edits/` and its two `require()`
  calls in `frontend/craco.config.js` if you want it gone entirely.

## Running it locally

```bash
# 1. Start MongoDB
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env        # fill in OPENAI_API_KEY at minimum
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env
yarn install                # or npm install
yarn start                  # or npm start
```

The app should now be at `http://localhost:3000`, talking to the API at
`http://localhost:8000`.

## Minimum keys to get a working app

- `OPENAI_API_KEY` — powers receipt OCR, voice logging, and the AI advisor
  chat. Without it those three features degrade gracefully to errors; the
  rest of the app (calculators, tracker, auth) works fine without it.
- `JWT_SECRET` — required for auth to work at all.
- `MONGO_URL` / `DB_NAME` — required for everything that touches the
  database (i.e. everything).

Stripe, PayFast, and Resend keys are only needed once you wire up real
payments/emails — the app runs fine without them for local development.

## Where to deploy cheaply

- **Frontend**: Vercel or Netlify (free tier is plenty for a React SPA)
- **Backend**: Railway, Render, or Fly.io (a few $/month for a small FastAPI app)
- **Database**: MongoDB Atlas free tier (512MB, fine to start)

This is a fraction of Emergent's all-in-one hosted pricing since you're
paying standard usage-based rates for each piece instead of a bundled
dev-environment markup.
