import { createClient } from '@supabase/supabase-js';
import { normalizeSupabaseProjectUrl } from './supabaseUrl';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseUrl = rawSupabaseUrl ? normalizeSupabaseProjectUrl(rawSupabaseUrl) : '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase env vars missing — trip history will not work.');
}

// Kept for future direct Supabase use. Do not create a client with empty URLs,
// because it fails at module evaluation in local FastAPI deployments.
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
}) : null;
