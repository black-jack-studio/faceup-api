import { createClient } from "@supabase/supabase-js";
import { isNative } from "./isNative";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Variables d'environnement Supabase manquantes :", {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey,
  });
  throw new Error("Missing Supabase environment variables");
}

// IMPORTANT : initialisation différente selon plateforme
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: isNative ? "nativeSession" : "webSession",
  },
});