import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const USE_SUPABASE = process.env.USE_SUPABASE === 'true';
export const DUAL_WRITE = process.env.DUAL_WRITE === 'true';

let _supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });
    console.log('✅ Supabase client initialized');
  }

  return _supabase;
}

const mode = USE_SUPABASE ? 'SUPABASE' : 'NEON';
const dualWrite = DUAL_WRITE ? ' (dual-write)' : '';
console.log(`🔀 Database Mode: ${mode}${dualWrite}`);
