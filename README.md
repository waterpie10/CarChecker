# VehicleCheck UK

Free UK vehicle history check — a self-hosted alternative to HPI and CarVertical using only public APIs.

## What it checks

- **MOT history** — full test history, pass/fail breakdown, defects and advisories
- **Mileage analysis** — anomaly detection for clocking (drops) and suspicious plateaus
- **Tax & MOT status** — live from DVLA
- **Keeper change indicator** — V5C issue date from DVLA
- **Salvage & auction records** — Copart UK and IAA search
- **Risk scoring** — 0–100 score with detailed red/amber flags
- **VIN decode** — manufacturer, model, body type, transmission via NHTSA

## What it does NOT cover

- Outstanding finance (requires HPI's private register)
- Confirmed write-off category (Cat S/N/A/B — requires Thatcham data)
- Police stolen status (requires PNC access)
- Foreign history beyond DVSA records

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, FastAPI, httpx, pydantic-settings |
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| VIN decode | NHTSA free API + python-vininfo fallback |
| Hosting | Railway/Render (backend), Vercel (frontend) |

---

## Setup

### 1. Get API Keys

**DVLA Vehicle Enquiry API**
- Register at [developer-portal.driver-vehicle-licensing.api.gov.uk](https://developer-portal.driver-vehicle-licensing.api.gov.uk)
- Free tier: 10,000 requests/day

**DVSA MOT History API**
- Register at [documentation.history.mot-data.dvla.gov.uk](https://documentation.history.mot-data.dvla.gov.uk)
- Free for legitimate consumer tools

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys

python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

uvicorn app.main:app --reload
# Runs on http://localhost:8000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# Runs on http://localhost:5173
```

### 4. Docker Compose (both together)

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

docker-compose up --build
```

---

## API Reference

### `POST /api/check`

**Body (registration):**
```json
{ "registration": "AB12CDE" }
```

**Body (VIN):**
```json
{ "vin": "WBA3A5C50DF123456" }
```

**Response:** `VehicleReport` object (see `backend/app/models/report.py`)

### `GET /health`
Returns `{ "status": "ok" }`.

---

## Deployment (Railway + Vercel)

This is the recommended free hosting setup. It takes about 10 minutes.

### Step 1 — Push to GitHub

```bash
# From the CarChecker root
git add .
git commit -m "Initial commit"
git push
```

> Make sure `.env` is in `.gitignore` (it already is) — never commit your API keys.

---

### Step 2 — Deploy backend to Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project → Deploy from GitHub repo** and select this repo
3. When asked, set the **root directory** to `backend`
4. Railway will detect the Dockerfile automatically
5. Go to your service → **Variables** tab and add:
   | Key | Value |
   |-----|-------|
   | `DVLA_API_KEY` | your DVLA key |
   | `DVSA_API_KEY` | your DVSA key (or leave blank to disable MOT) |
   | `ALLOWED_ORIGINS` | `https://your-app.vercel.app` (add after step 3) |
6. Click **Deploy** — Railway will build and give you a URL like `https://vehiclecheck.up.railway.app`

---

### Step 3 — Deploy frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project** and import this repo
3. Set the **Root Directory** to `frontend`
4. Under **Environment Variables**, add:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://your-backend.up.railway.app` |
5. Click **Deploy** — Vercel gives you a URL like `https://vehiclecheck.vercel.app`

---

### Step 4 — Update CORS on the backend

Now that you have your Vercel URL, go back to Railway → Variables and update:
```
ALLOWED_ORIGINS=https://your-app.vercel.app
```
Railway will redeploy automatically.

---

### That's it

Every `git push` to your main branch will auto-redeploy both Railway and Vercel.

---

## Risk Score Breakdown

| Deduction | Condition |
|-----------|-----------|
| -30 | Any mileage drop detected |
| -15 | Mileage plateau detected |
| -20 | Found in salvage auction |
| -10 | Marked for export |
| -5 per (max -20) | Dangerous defects ever recorded |
| -3 per (max -15) | Recurring advisories |
| -5 | MOT pass rate below 60% |
| -5 | V5C issued within last 6 months |
| -10 | V5C issued within last 30 days |

| Score | Rating |
|-------|--------|
| 85–100 | Low Risk (green) |
| 60–84 | Moderate Risk (amber) |
| 0–59 | High Risk (red) |
