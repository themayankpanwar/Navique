# AI Travel Planner

> Generate beautiful, personalized travel itineraries in seconds — powered by AI, streamed live.

Plan a complete trip by telling the app your destination, budget, travel type,
transportation, accommodation, and interests. The AI crafts a detailed
day-by-day itinerary with hotels, restaurants, hidden gems, weather, a map,
packing checklist, safety tips, and a budget breakdown — streamed to your
screen in real time. Save trips, download them as PDF, print, or share.

---

## Highlights

- **AI itinerary generation** with live streaming (OpenAI, streamed token-by-token)
- **Trip Planner form** — destination, starting location, days, budget, travel type, transportation, accommodation, interests (multi-select), special requests
- **Beautiful itinerary display** — animated day cards, section cards (hotels, food, tips, etc.), markdown rendering
- **Weather integration** — current temperature, condition, humidity, wind, best time to visit (OpenWeather)
- **Google Maps** — embedded destination map + nearby attractions links
- **Trip history** — save, view, search, and delete trips (Supabase / SQLite)
- **Export** — copy, download as PDF, print, share (Web Share API)
- **Dark / light mode** with system-preference fallback and persistence
- **Responsive** — mobile, tablet, desktop
- **Glassmorphism design** — gradients, soft shadows, rounded cards, micro-interactions
- **Loading skeletons, toast notifications, error handling**

---

## Tech stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React (Vite), TypeScript, Tailwind CSS, React Router, Framer Motion, Axios, Lucide Icons |
| Backend  | Python FastAPI (reference) / Supabase Edge Function (Deno, deployed) |
| AI       | Google Gemini API (streaming) |
| Weather  | OpenWeather API |
| Maps     | Google Maps embed |
| Database | Supabase Postgres (deployed) / SQLite (local FastAPI) |
| Deploy   | Docker, AWS App Runner |

---

## Architecture

This project ships **two interchangeable backends** that expose the same API:

1. **Supabase Edge Function (default, deployed)** — `supabase/functions/travel-planner`.
   A Deno/TypeScript function that proxies Google Gemini + OpenWeather, streams the
   itinerary, and stores trips in the provisioned Supabase Postgres database.
   API keys are stored as Supabase secrets and never touch the browser. This is
   what the frontend talks to out of the box via `VITE_SUPABASE_URL`.

2. **FastAPI backend (reference / Docker)** — `backend/main.py`.
   A standalone Python service with SQLite, matching the original spec exactly.
   Use this for local Docker runs or AWS App Runner deployments where you want
   a single container. Endpoints are identical:

   | Method | Endpoint            | Purpose |
   |--------|---------------------|---------|
   | POST   | `/generate-trip`    | Stream AI itinerary (text/plain) |
   | POST   | `/save-trip`        | Save a trip |
   | GET    | `/trips`            | List saved trips |
   | DELETE | `/trip/{id}`        | Delete a trip |
   | GET    | `/health`           | Health / config check |
   | GET    | `/weather?city=`    | Current weather for a city |

### Folder structure

```
.
├── src/                      # React frontend
│   ├── components/           # Navbar, Footer, Toast, Skeletons, cards, form
│   ├── lib/                  # api, supabase client, types, markdown, theme hook
│   ├── pages/                # Landing, Planner, History
│   └── App.tsx               # Routing + app shell
├── backend/                  # FastAPI reference backend (Python)
│   ├── main.py
│   └── requirements.txt
├── supabase/
│   └── functions/
│       └── travel-planner/   # Deployed edge function (Deno)
│           └── index.ts
├── Dockerfile                # Multi-stage: build frontend, serve via FastAPI
├── .env.example
├── package.json
└── README.md
```

---

## Getting started

### Prerequisites

- Node.js 20+
- (Optional) Python 3.12+ and Docker for the standalone backend
- An OpenAI API key
- An OpenWeather API key (free tier works)

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

| Variable | Where used | Required |
|----------|-----------|----------|
| `VITE_SUPABASE_URL` | Frontend (default backend) | Yes, if using the Supabase edge function |
| `VITE_SUPABASE_ANON_KEY` | Frontend (default backend) | Yes, if using the Supabase edge function |
| `GEMINI_API_KEY` | Backend (edge function secret or FastAPI env) | Yes |
| `OPENWEATHER_API_KEY` | Backend (edge function secret or FastAPI env) | Yes |
| `GEMINI_MODEL` | Backend (optional) | No — auto-probes a list of models and uses the first your key allows |
| `DB_PATH` | FastAPI local backend only | No (defaults to `trips.db`) |

> When using the Supabase edge function, set `GEMINI_API_KEY` and
> `OPENWEATHER_API_KEY` as Supabase edge function **secrets** (Project Settings →
> Edge Functions → Secrets). They are read server-side only and never exposed.
>
> Set `VITE_SUPABASE_URL` to your project root URL only (for example,
> `https://your-project-ref.supabase.co`), not the REST endpoint path
> (`.../rest/v1`).
>
> The backend auto-probes a list of Gemini models (`gemini-2.5-flash-lite`,
> `gemini-2.5-flash`, `gemini-2.0-flash`, ...) and uses the first one your key
> allows. To pin a specific model, set a `GEMINI_MODEL` secret.

### 3. Run the frontend dev server

```bash
npm run dev
```

The app is served at the printed localhost URL. The frontend automatically
talks to the deployed Supabase edge function via `VITE_SUPABASE_URL`.

### 4. (Optional) Run the FastAPI backend locally

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export GEMINI_API_KEY=...
export OPENWEATHER_API_KEY=...
uvicorn main:app --reload --port 8000
```

Health check: <http://localhost:8000/health>

---

## Docker

The multi-stage `Dockerfile` builds the React frontend, then bundles it with
the FastAPI backend in a single image ready for AWS App Runner.

### Build the image

```bash
docker build -t ai-travel-planner .
```

### Run the container

```bash
docker run -p 8000:8000 \
  -e GEMINI_API_KEY=... \
  -e OPENWEATHER_API_KEY=... \
  -e DB_PATH=/tmp/trips.db \
  ai-travel-planner
```

The app is available at <http://localhost:8000>. The FastAPI backend serves the
built frontend from `/static` and the API from the root.

---

## AWS App Runner deployment

App Runner runs your Dockerfile directly — no extra config files needed.

1. Push this repository to GitHub/GitLab (or build & push to ECR).
2. In the AWS Console, open **App Runner → Create service → Source code repository**.
3. Select your repo and branch.
4. Choose **Build type: Dockerfile**, root directory `/`.
5. Under **Environment variables**, add:
   - `GEMINI_API_KEY`
   - `OPENWEATHER_API_KEY`
   - `DB_PATH=/tmp/trips.db`
   - (If you prefer the Supabase backend instead, add `VITE_SUPABASE_URL` and
     `VITE_SUPABASE_ANON_KEY` at build time.)
6. Port: **8000**.
7. Deploy. App Runner builds the image and exposes it at the assigned URL.

> For persistent SQLite across restarts, attach an EFS volume and set `DB_PATH`
> to a path on the mount. For production, prefer the Supabase Postgres backend.

---

## Available scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | ESLint |
| `npm run preview` | Preview the production build locally |

---

## Screenshots

> Add screenshots here once the app is running.

| Landing | Planner | Itinerary |
|---------|---------|-----------|
| _docs/landing.png_ | _docs/planner.png_ | _docs/itinerary.png_ |

| Weather & Map | Trip History | Dark mode |
|---------------|--------------|-----------|
| _docs/weather.png_ | _docs/history.png_ | _docs/dark.png_ |

---

## How the AI prompt works

The backend assembles a system instruction + user prompt from the form inputs
and asks Google Gemini to return clean Markdown with these sections:

- Trip Overview
- Day-by-day Itinerary (Morning / Afternoon / Evening for each day)
- Recommended Hotels
- Recommended Restaurants
- Local Transportation
- Estimated Budget Breakdown (table)
- Packing Checklist
- Safety Tips
- Best Local Foods
- Hidden Gems
- Emergency Contacts
- Travel Tips

The response is **streamed**: the frontend reads the chunked `text/plain` body
(Gemini's SSE `streamGenerateContent` endpoint) and appends tokens to the UI
live, splitting the markdown into animated day cards and appendix section cards.

---

## Security notes

- API keys live **only on the server** (edge function secrets or FastAPI env).
- The frontend never sees `GEMINI_API_KEY` or `OPENWEATHER_API_KEY`.
- Row Level Security is enabled on the `trips` table (single-tenant, anon CRUD).

---

## License

MIT — built for demonstration. Travel images via [Pexels](https://pexels.com).
