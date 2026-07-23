import axios from 'axios';
import type { HealthStatus, SavedTrip, TripInput, WeatherData } from './types';
import { normalizeSupabaseProjectUrl } from './supabaseUrl';
console.log(import.meta.env);
console.log(import.meta.env.VITE_API_BASE_URL);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const configuredApiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
const normalizedSupabaseUrl = SUPABASE_URL ? normalizeSupabaseProjectUrl(SUPABASE_URL) : '';
const BASE = configuredApiBase !== undefined
  ? configuredApiBase.replace(/\/$/, '')
  : normalizedSupabaseUrl
    ? `${normalizedSupabaseUrl}/functions/v1/travel-planner`
    : '';

function requireApiBase(): string {
  if (!BASE) {
    throw new Error('API is not configured. Set VITE_API_BASE_URL or VITE_SUPABASE_URL.');
  }
  return BASE;
}

const headers = {
  'Content-Type': 'application/json',
  ...(ANON_KEY ? { Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY } : {}),
};

// GET /health — check backend configuration.
export async function getHealth(): Promise<HealthStatus> {
  const { data } = await axios.get<HealthStatus>(`${requireApiBase()}/health`, { headers });
  return data;
}

// POST /generate-trip — streams markdown chunks. Calls onChunk for each piece.
export async function generateTripStream(
  input: TripInput,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${requireApiBase()}/generate-trip`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Request failed');
    let message = errText;
    try {
      message = JSON.parse(errText).error ?? errText;
    } catch {
      /* keep raw */
    }
    throw new Error(message || `Request failed (${res.status})`);
  }
  if (!res.body) throw new Error('No response stream');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    full += text;
    onChunk(text);
  }
  const tail = decoder.decode();
  if (tail) {
    full += tail;
    onChunk(tail);
  }
  return full;
}

// POST /save-trip — persist a generated itinerary.
export async function saveTrip(
  input: TripInput,
  itinerary: string,
): Promise<SavedTrip> {
  const { data } = await axios.post<SavedTrip>(
    `${requireApiBase()}/save-trip`,
    { ...input, itinerary },
    { headers },
  );
  return data;
}

// GET /trips — list all saved trips, newest first.
export async function listTrips(): Promise<SavedTrip[]> {
  const { data } = await axios.get<SavedTrip[]>(`${requireApiBase()}/trips`, { headers });
  return data ?? [];
}

// DELETE /trip/{id}
export async function deleteTrip(id: string): Promise<void> {
  await axios.delete(`${requireApiBase()}/trip/${encodeURIComponent(id)}`, { headers });
}

// GET /weather?city=...
export async function getWeather(city: string): Promise<WeatherData> {
  const { data } = await axios.get<WeatherData>(`${requireApiBase()}/weather`, {
    headers,
    params: { city },
  });
  return data;
}
