import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config/env.js";

const supabaseUrl =
  config.supabase.url ||
  process.env.SUPABASE_URL ||
  "https://placeholder-url.supabase.co";

const supabaseKey =
  config.supabase.serviceRoleKey ||
  config.supabase.anonKey ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "placeholder-key";

if (!config.supabase.url || !(config.supabase.serviceRoleKey || config.supabase.anonKey)) {
  console.warn(
    "[Supabase Service] Warning: SUPABASE_URL or key is missing. Database operations may fail.",
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
