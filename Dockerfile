# ---------- Stage 1: build the React frontend ----------
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

# The container serves the FastAPI endpoints from the same origin. Override
# this argument when building an image that should target another API.
ARG VITE_API_BASE_URL=/
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy frontend manifests and install deps
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the frontend source and build
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY tailwind.config.js postcss.config.js eslint.config.js ./
COPY src ./src
COPY public ./public
RUN npm run build

# ---------- Stage 2: Python backend + static frontend ----------
FROM python:3.12-slim AS backend
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Install backend deps
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend ./backend

# Copy the built frontend into a directory the backend can serve as static
COPY --from=frontend-build /app/frontend/dist ./static

WORKDIR /app/backend

EXPOSE 8000

# Run the FastAPI app. Environment variables (GEMINI_API_KEY, OPENWEATHER_API_KEY,
# DB_PATH) must be supplied at runtime via `docker run -e ...` or App Runner env.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
