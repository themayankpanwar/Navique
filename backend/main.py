"""
AI Travel Planner — FastAPI backend (reference implementation)

This is the full FastAPI backend matching the original spec, adapted to use
Google's Gemini API. The deployed version of this project instead uses a
Supabase Edge Function (supabase/functions/travel-planner) for the same
endpoints — see the README "Architecture" section. This Python service is
provided for local Docker / AWS App Runner deployments that prefer a
standalone backend.

Run locally:
    uvicorn main:app --reload --port 8000
"""
from __future__ import annotations

import os
import json
import sqlite3
from datetime import datetime
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# --- Configuration -----------------------------------------------------------
# Load private backend settings first, then optional shared local settings.
# Vite only exposes variables prefixed with VITE_, so GEMINI_API_KEY stays
# server-side. Runtime environment variables still take precedence.
BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(BACKEND_DIR.parent / ".env")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", os.getenv("Gemini_API_KEY", ""))
WEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", os.getenv("Wheather_API_KEY", ""))
# Candidate models tried in order; first that works is used.
DEFAULT_MODELS = "gemini-2.5-flash-lite,gemini-2.5-flash,gemini-2.0-flash,gemini-2.0-flash-lite,gemini-1.5-flash,gemini-1.5-flash-8b,gemini-flash-latest"
GEMINI_MODELS = [m for m in os.getenv("GEMINI_MODEL", DEFAULT_MODELS).split(",") if m.strip()]
DB_PATH = os.getenv("DB_PATH", "trips.db")

# --- Database (SQLite) -------------------------------------------------------
def init_db() -> None:
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            destination TEXT NOT NULL,
            starting_location TEXT,
            budget TEXT,
            travel_type TEXT,
            transportation TEXT,
            accommodation TEXT,
            interests TEXT,
            special_requests TEXT,
            itinerary TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()
    conn.close()


def db_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# --- Models ------------------------------------------------------------------
class TripInput(BaseModel):
    destination: str
    startingLocation: str | None = ""
    budget: str
    travelType: str
    transportation: str
    accommodation: str
    interests: list[str] = Field(default_factory=list)
    specialRequests: str | None = ""


class SaveTripInput(BaseModel):
    destination: str
    startingLocation: str | None = ""
    budget: str | None = None
    travelType: str | None = None
    transportation: str | None = None
    accommodation: str | None = None
    interests: list[str] = Field(default_factory=list)
    specialRequests: str | None = ""
    itinerary: str


# --- Prompt ------------------------------------------------------------------
def build_prompt(inp: TripInput) -> tuple[str, str]:
    system = (
        "You are an expert travel planner. You create detailed, personalized "
        "travel itineraries as clean, well-structured Markdown. Always use "
        "headings, bullet lists, bold for activity titles, and tables where "
        "helpful. Be specific, practical, and inspiring. Never use HTML. "
        "Return ONLY the Markdown — no preamble, no code fences."
    )
    user = f"""Plan a trip with the following preferences:
- Destination: {inp.destination}
- Starting location: {inp.startingLocation or 'Not specified'}
- Budget tier: {inp.budget}
- Travel type: {inp.travelType}
- Transportation: {inp.transportation}
- Accommodation preference: {inp.accommodation}
- Interests: {', '.join(inp.interests) or 'General'}
- Special requests: {inp.specialRequests or 'None'}

Generate a complete travel itinerary in Markdown with ALL of these sections:
# Trip Overview
A short inspiring summary (2-3 sentences) plus key facts including a recommended trip duration.
## Day-by-Day Itinerary
Create a sensible day-by-day plan. Decide the ideal number of days based on the destination and interests (typically 3-7 days). For EACH day (Day 1, Day 2, ...) include a ### Day N heading and these subsections:
## Recommended Hotels
## Recommended Restaurants
## Local Transportation
## Estimated Budget Breakdown (table)
## Packing Checklist
## Safety Tips
## Best Local Foods
## Hidden Gems
## Emergency Contacts
## Travel Tips
Return ONLY the Markdown. No preamble, no code fences."""
    return system, user


async def _resolve_model() -> str:
    """Probe candidate models and return the first that responds 200."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        for model in GEMINI_MODELS:
            try:
                resp = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                    headers={"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY},
                    json={
                        "contents": [{"role": "user", "parts": [{"text": "Hi"}]}],
                        "generationConfig": {"maxOutputTokens": 1},
                    },
                )
                if resp.status_code == 200:
                    return model
            except httpx.HTTPError:
                continue
    return ""


# --- App ---------------------------------------------------------------------
@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="AI Travel Planner API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
if (STATIC_DIR / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")


@app.get("/health")
async def health() -> dict:
    model = await _resolve_model() if GEMINI_API_KEY else ""
    return {
        "status": "ok",
        "ai_configured": bool(GEMINI_API_KEY),
        "ai_provider": "gemini",
        "ai_model": model or "none-available",
        "candidates": GEMINI_MODELS,
        "weather_configured": bool(WEATHER_API_KEY),
        "database": "sqlite",
        "time": datetime.utcnow().isoformat(),
    }


async def _stream_gemini(inp: TripInput, model: str) -> AsyncGenerator[bytes, None]:
    system, user = build_prompt(inp)
    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse",
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY,
            },
            json={
                "systemInstruction": {"parts": [{"text": system}]},
                "contents": [{"role": "user", "parts": [{"text": user}]}],
                "generationConfig": {"temperature": 0.8, "maxOutputTokens": 8192},
            },
        ) as resp:
            if resp.status_code != 200:
                body = await resp.aread()
                raise HTTPException(resp.status_code, body.decode())
            async for line in resp.aiter_lines():
                if not line.startswith("data:"):
                    continue
                data = line[5:].strip()
                if not data or data == "[DONE]":
                    continue
                try:
                    obj = json.loads(data)
                    parts = obj["candidates"][0]["content"]["parts"]
                    for p in parts:
                        if "text" in p and p["text"]:
                            yield p["text"].encode()
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue


@app.post("/generate-trip")
async def generate_trip(inp: TripInput):
    if not GEMINI_API_KEY:
        raise HTTPException(500, "Gemini API key not configured.")
    if not inp.destination:
        raise HTTPException(400, "destination is required.")
    model = await _resolve_model()
    if not model:
        raise HTTPException(500, "No available Gemini model for this API key.")
    return StreamingResponse(_stream_gemini(inp, model), media_type="text/plain")


@app.post("/save-trip")
async def save_trip(body: SaveTripInput):
    conn = db_conn()
    cur = conn.execute(
        """INSERT INTO trips (destination, starting_location, budget,
           travel_type, transportation, accommodation, interests,
           special_requests, itinerary)
           VALUES (?,?,?,?,?,?,?,?,?)""",
        (
            body.destination,
            body.startingLocation,
            body.budget,
            body.travelType,
            body.transportation,
            body.accommodation,
            ",".join(body.interests),
            body.specialRequests,
            body.itinerary,
        ),
    )
    conn.commit()
    row = conn.execute(
        "SELECT * FROM trips WHERE id = ?", (cur.lastrowid,)
    ).fetchone()
    conn.close()
    return JSONResponse(dict(row), status_code=201)


@app.get("/trips")
async def list_trips():
    conn = db_conn()
    rows = conn.execute(
        "SELECT * FROM trips ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.delete("/trip/{trip_id}")
async def delete_trip(trip_id: int):
    conn = db_conn()
    cur = conn.execute("DELETE FROM trips WHERE id = ?", (trip_id,))
    conn.commit()
    conn.close()
    if cur.rowcount == 0:
        raise HTTPException(404, "Trip not found.")
    return {"success": True, "id": trip_id}


@app.get("/weather")
async def weather(city: str):
    if not WEATHER_API_KEY:
        raise HTTPException(500, "Weather API key not configured.")
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"q": city, "units": "metric", "appid": WEATHER_API_KEY},
        )
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, "Weather lookup failed.")
    w = resp.json()
    return {
        "city": w.get("name"),
        "country": w.get("sys", {}).get("country"),
        "temperature": round(w["main"]["temp"]),
        "feelsLike": round(w["main"]["feels_like"]),
        "condition": w["weather"][0]["main"],
        "description": w["weather"][0]["description"],
        "icon": w["weather"][0]["icon"],
        "humidity": w["main"]["humidity"],
        "windSpeed": round(w["wind"]["speed"] * 3.6),
        "bestTime": best_time_for_destination(w),
    }


def best_time_for_destination(weather: dict) -> str:
    """A small UI hint based on current conditions, not a climate forecast."""
    condition = weather.get("weather", [{}])[0].get("main", "").lower()
    temperature = weather.get("main", {}).get("temp", 20)
    if "rain" in condition or "storm" in condition:
        return "Shoulder season (avoid monsoon months)."
    if temperature > 30:
        return "Spring or autumn for milder temperatures."
    if temperature < 5:
        return "Summer months for warmer weather."
    return "Year-round — current conditions are pleasant."


@app.get("/{path:path}", include_in_schema=False)
async def frontend(path: str):
    """Serve the Vite SPA in the Docker image, including client-side routes."""
    if not STATIC_DIR.is_dir():
        raise HTTPException(404, "Frontend build not found.")
    requested = (STATIC_DIR / path).resolve()
    if path and requested.is_file() and STATIC_DIR.resolve() in requested.parents:
        return FileResponse(requested)
    return FileResponse(STATIC_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
