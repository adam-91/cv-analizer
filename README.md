# CV Analyzer

An application for analyzing a CV against a specific job posting. The user
uploads a CV (PDF) and the job description, and the app assesses the fit and
provides concrete tips. It uses **Google GenAI** (the **Gemini 3.8 Flash**
model). Available in two languages: **Polish** and **English**.

## Stack

- **Backend:** Python 3.14, FastAPI, pypdf, google-genai, uvicorn, python-multipart
- **Frontend:** React, TypeScript, Vite, react-i18next

## Structure

```
cv-analizer/
├── backend/          # FastAPI API
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── schemas.py
│   │   ├── routers/{health,analyze}.py
│   │   └── services/{pdf_parser,gemini}.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/         # React app (Vite + TypeScript)
│   └── src/
│       ├── api/client.ts
│       ├── components/
│       ├── i18n/ (locales/en.json, locales/pl.json)
│       └── App.tsx
├── render.yaml       # Render blueprint (backend + static site)
└── README.md
```

## Google API Key setup

1. Generate a key in [Google AI Studio](https://aistudio.google.com/app/apikey) (or Google Cloud Console).
2. In the `backend/` directory, create a `.env` file based on `.env.example`:

   ```bash
   cp backend/.env.example backend/.env
   ```

3. Put your key in `GOOGLE_API_KEY` in `backend/.env`.

The model is configured with two environment variables:

- `MODEL_NAME` — the primary model (default `gemini-3.8-flash`).
- `FALLBACK_MODELS` — a comma-separated list of models tried in order when the
  primary model fails (e.g. is temporarily unavailable). Default:
  `gemini-3.6-flash,gemini-3.5-flash-lite`. The app falls back to the next model on
  any API/network failure (such as a `503 UNAVAILABLE`), and only returns an
  error after every configured model has failed.

> The `.env` file is in `.gitignore` — it never goes into the repository.

## Running locally

### One command

After installing the dependencies below, start both services with:

```bash
./start.sh
```

This launches the backend (http://localhost:8000, docs `/docs`) and the
frontend (http://localhost:5173). Press `Ctrl+C` to stop both.

### Backend

Requires Python 3.14 (recommended `uv`):

```bash
cd backend
uv python install 3.14
uv venv --python 3.14 .venv
source .venv/bin/activate
uv pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at http://localhost:8000 (docs: `/docs`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at http://localhost:5173. In dev mode, Vite proxies `/api` to the
backend at `localhost:8000`, so you don't need to set `VITE_API_URL`.

## Tests

Backend tests use pytest:

```bash
cd backend
uv pip install -r requirements-dev.txt
.venv/bin/python -m pytest
```

## Logs

The backend logs to **stdout/stderr** and to a rotating file
(`backend/logs/app.log` by default). To watch the file while the app runs in
the background:

```bash
cd backend
tail -f logs/app.log
```

Configuration via environment variables:

- `LOG_LEVEL` — minimum level to log (`DEBUG`, `INFO`, `WARNING`, `ERROR`;
  default `INFO`). Use `DEBUG` to also log health checks.
- `LOG_FILE` — path to the log file (default `logs/app.log`). Set to an empty
  string to disable file logging and keep only console output.

The frontend also writes `console.error` / `console.warn` messages (prefixed
with `[cv-analizer]`) to the browser developer console.

## API

- `GET /api/health` — health check (the frontend pings it to "wake up" the
  sleeping backend on Render).
- `POST /api/analyze` — multipart/form-data:
  - `cv_file` — PDF file with the CV
  - `job_description` — the job posting text (used when `job_url` is empty)
  - `job_url` — optional link to the job posting; when provided, the backend
    fetches the page and extracts its text (this takes precedence over
    `job_description`)
  - `language` — `pl` or `en`

  Returns JSON: `score`, `summary`, `strengths[]`, `gaps[]`, `suggestions[]`,
  `matched_keywords[]`, `missing_keywords[]`.

> **Note about `job_url`:** the backend fetches the page and strips its HTML.
> Job boards that render their content with JavaScript (e.g. LinkedIn, some
> Pracuj.pl offers) may return little or no text because the content is not
> present in the raw HTML.

## Deploying to Render.com

1. Push the repository to GitHub/GitLab/Bitbucket.
2. In Render: **New → Blueprint** and point to the repository (`render.yaml`).
3. Set the `GOOGLE_API_KEY` environment variable in the `cv-analizer-api` service.

Render creates two services:

- **cv-analizer-api** (web service, free) — sleeps after 15 min of inactivity;
  the first request after idle can take ~30–60 s (cold start).
- **cv-analizer-web** (static site) — always running.

### URL notes

By default, `render.yaml` assumes the addresses `cv-analizer-api.onrender.com`
and `cv-analizer-web.onrender.com`. If Render assigns different subdomains
(names are globally unique), update:

- `VITE_API_URL` in `render.yaml` (static site → API),
- optionally `CORS_ORIGINS` in the backend (default `*`, i.e. all origins).
