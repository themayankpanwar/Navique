import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// AI Travel Planner edge function — Gemini streaming backend.
// Deployed via mcp__supabase__deploy_edge_function.
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Read keys using the exact secret names configured in Supabase.
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("Gemini_API_KEY") ?? "";
const WEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY") ?? Deno.env.get("Wheather_API_KEY") ?? "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
  : null;

// Candidate Gemini models, tried in order. The first that responds 200 to a
// streaming request is used. Override the whole list by setting a GEMINI_MODEL
// secret in Supabase (a single model name).
const MODEL_CANDIDATES = (Deno.env.get("GEMINI_MODEL")
  ? [Deno.env.get("GEMINI_MODEL") as string]
  : ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-flash-latest"]);

// Probe a model with a tiny 1-token request. Returns true if usable.
async function modelWorks(model: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Hi" }] }],
          generationConfig: { maxOutputTokens: 1 },
        }),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

// Find the first working model from MODEL_CANDIDATES. Returns "" if none work.
async function resolveModel(): Promise<string> {
  for (const m of MODEL_CANDIDATES) {
    if (await modelWorks(m)) return m;
  }
  return "";
}

interface TripInput {
  destination: string;
  startingLocation?: string;
  budget: string;
  travelType: string;
  transportation: string;
  accommodation: string;
  interests: string[];
  specialRequests?: string;
}

// Build the single prompt Gemini receives. Gemini uses a combined
// systemInstruction + user content rather than separate system/user messages.
function buildPrompt(input: TripInput): { system: string; user: string } {
  const system =
    "You are an expert travel planner. You create detailed, personalized travel itineraries as clean, well-structured Markdown. " +
    "Always use headings (#, ##, ###), bullet lists, bold for activity titles, and tables where helpful. " +
    "Be specific, practical, and inspiring. Never use HTML. Return ONLY the Markdown — no preamble, no code fences.";

  const user = `Plan a trip with the following preferences:
- Destination: ${input.destination}
- Starting location: ${input.startingLocation || "Not specified"}
- Budget tier: ${input.budget}
- Travel type: ${input.travelType}
- Transportation: ${input.transportation}
- Accommodation preference: ${input.accommodation}
- Interests: ${input.interests.join(", ") || "General"}
- Special requests: ${input.specialRequests || "None"}

Generate a complete travel itinerary in Markdown with ALL of these sections:

# Trip Overview
A short inspiring summary (2-3 sentences) plus key facts including a recommended trip duration.

## Day-by-Day Itinerary
Create a sensible day-by-day plan. Decide the ideal number of days based on the destination and interests (typically 3-7 days). For EACH day (Day 1, Day 2, ...) include a ### Day N heading and these subsections:
- **Morning:** activities with timing
- **Afternoon:** activities with timing
- **Evening:** activities with timing

## Recommended Hotels
A table or list of 3-5 hotels matching the accommodation preference and budget tier.

## Recommended Restaurants
3-5 restaurants with cuisine type and price range.

## Local Transportation
How to get around the destination.

## Estimated Budget Breakdown
A markdown table with categories (Stay, Food, Transport, Activities, Misc) and estimated costs in USD.

## Packing Checklist
A bullet checklist of items to pack.

## Safety Tips
3-5 safety tips.

## Best Local Foods
3-5 must-try local dishes.

## Hidden Gems
Lesser-known spots worth visiting.

## Emergency Contacts
Suggested emergency numbers and contacts for the destination.

## Travel Tips
Final practical tips for a great trip.

Return ONLY the Markdown. No preamble, no code fences.`;

  return { system, user };
}

// Stream the itinerary from Gemini's streamGenerateContent API.
// Gemini returns newline-delimited JSON objects, each holding a chunk of text.
async function streamItinerary(input: TripInput, model: string): Promise<ReadableStream<Uint8Array>> {
  const { system, user } = buildPrompt(input);

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
      }),
    },
  );

  if (!geminiRes.ok || !geminiRes.body) {
    const text = await geminiRes.text().catch(() => "Gemini request failed");
    throw new Error(`Gemini error ${geminiRes.status}: ${text}`);
  }

  const reader = geminiRes.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const enqueueEvent = (line: string, controller: ReadableStreamDefaultController<Uint8Array>) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return;
    const data = trimmed.slice(5).trim();
    if (!data || data === "[DONE]") return;
    try {
      const obj = JSON.parse(data);
      const parts = obj.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts)) {
        for (const p of parts) {
          if (typeof p.text === "string" && p.text.length) {
            controller.enqueue(encoder.encode(p.text));
          }
        }
      }
    } catch {
      // Ignore malformed events; valid events are always complete JSON lines.
    }
  };

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        if (buffer) enqueueEvent(buffer, controller);
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      // Gemini SSE: lines start with "data: " and contain one JSON object.
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        enqueueEvent(line, controller);
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

// Non-streaming completion (fallback) — returns full markdown as JSON.
async function generateItineraryFull(input: TripInput, model: string): Promise<string> {
  const { system, user } = buildPrompt(input);
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
      }),
    },
  );
  if (!geminiRes.ok) {
    const text = await geminiRes.text().catch(() => "Gemini request failed");
    throw new Error(`Gemini error ${geminiRes.status}: ${text}`);
  }
  const obj = await geminiRes.json();
  const parts = obj.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts.map((p: { text?: string }) => p.text ?? "").join("");
  }
  return "";
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorJson(message: string, status = 500): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/\/$/, "");

  try {
    // GET /travel-planner/health
    if (path.endsWith("/health") && req.method === "GET") {
      let resolvedModel = "";
      if (GEMINI_API_KEY) resolvedModel = await resolveModel();
      return json({
        status: "ok",
        ai_configured: Boolean(GEMINI_API_KEY),
        ai_provider: "gemini",
        ai_model: resolvedModel || "none-available",
        candidates: MODEL_CANDIDATES,
        weather_configured: Boolean(WEATHER_API_KEY),
        database_configured: Boolean(supabase),
        time: new Date().toISOString(),
      });
    }

    // POST /travel-planner/generate-trip  (streaming text/markdown)
    if (path.endsWith("/generate-trip") && req.method === "POST") {
      if (!GEMINI_API_KEY) return errorJson("Gemini API key not configured on the server.", 500);
      const input = (await req.json()) as TripInput;
      if (!input.destination) {
        return errorJson("destination is required.", 400);
      }
      const model = await resolveModel();
      if (!model) return errorJson("No available Gemini model for this API key. Set GEMINI_MODEL secret to a model your key allows (e.g. gemini-2.5-flash).", 500);
      try {
        const stream = await streamItinerary(input, model);
        return new Response(stream, {
          headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
        });
      } catch (err) {
        return errorJson(err instanceof Error ? err.message : "Stream failed", 502);
      }
    }

    // POST /travel-planner/generate-trip-sync  (non-streaming fallback)
    if (path.endsWith("/generate-trip-sync") && req.method === "POST") {
      if (!GEMINI_API_KEY) return errorJson("Gemini API key not configured on the server.", 500);
      const input = (await req.json()) as TripInput;
      if (!input.destination) {
        return errorJson("destination is required.", 400);
      }
      const model = await resolveModel();
      if (!model) return errorJson("No available Gemini model for this API key. Set GEMINI_MODEL secret to a model your key allows.", 500);
      const itinerary = await generateItineraryFull(input, model);
      return json({ itinerary });
    }

    // POST /travel-planner/save-trip
    if (path.endsWith("/save-trip") && req.method === "POST") {
      if (!supabase) return errorJson("Database not configured.", 500);
      const body = await req.json();
      const { data, error } = await supabase
        .from("trips")
        .insert({
          destination: body.destination,
          starting_location: body.startingLocation ?? null,
          budget: body.budget ?? null,
          travel_type: body.travelType ?? null,
          transportation: body.transportation ?? null,
          accommodation: body.accommodation ?? null,
          interests: Array.isArray(body.interests) ? body.interests.join(", ") : body.interests ?? null,
          special_requests: body.specialRequests ?? null,
          itinerary: body.itinerary,
        })
        .select()
        .single();
      if (error) return errorJson(error.message, 400);
      return json(data, 201);
    }

    // GET /travel-planner/trips
    if (path.endsWith("/trips") && req.method === "GET") {
      if (!supabase) return errorJson("Database not configured.", 500);
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return errorJson(error.message, 400);
      return json(data);
    }

    // DELETE /travel-planner/trip/{id}
    const tripMatch = path.match(/\/trip\/([^/]+)$/);
    if (tripMatch && req.method === "DELETE") {
      if (!supabase) return errorJson("Database not configured.", 500);
      const id = tripMatch[1];
      const { data, error } = await supabase
        .from("trips")
        .delete()
        .eq("id", id)
        .select("id")
        .maybeSingle();
      if (error) return errorJson(error.message, 400);
      if (!data) return errorJson("Trip not found.", 404);
      return json({ success: true, id });
    }

    // GET /travel-planner/weather?city=...
    if (path.endsWith("/weather") && req.method === "GET") {
      const city = url.searchParams.get("city");
      if (!city) return errorJson("city query param is required.", 400);
      if (!WEATHER_API_KEY) return errorJson("Weather API key not configured on the server.", 500);
      const wRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}`,
      );
      if (!wRes.ok) {
        const t = await wRes.text().catch(() => "weather lookup failed");
        return errorJson(`Weather error ${wRes.status}: ${t}`, 502);
      }
      const w = await wRes.json();
      return json({
        city: w.name,
        country: w.sys?.country,
        temperature: Math.round(w.main?.temp),
        feelsLike: Math.round(w.main?.feels_like),
        condition: w.weather?.[0]?.main,
        description: w.weather?.[0]?.description,
        icon: w.weather?.[0]?.icon,
        humidity: w.main?.humidity,
        windSpeed: Math.round((w.wind?.speed ?? 0) * 3.6), // m/s -> km/h
        bestTime: bestTimeForDestination(w),
      });
    }

    return errorJson("Not found", 404);
  } catch (err) {
    return errorJson(err instanceof Error ? err.message : "Internal server error", 500);
  }
});

// Heuristic "best time to visit" from current weather conditions.
function bestTimeForDestination(w: { weather?: { main: string }[]; main?: { temp: number } }): string {
  const cond = w.weather?.[0]?.main?.toLowerCase() ?? "";
  const temp = w.main?.temp ?? 20;
  if (cond.includes("rain") || cond.includes("storm")) return "Shoulder season (avoid monsoon months).";
  if (temp > 30) return "Spring or autumn for milder temperatures.";
  if (temp < 5) return "Summer months for warmer weather.";
  return "Year-round — current conditions are pleasant.";
}
