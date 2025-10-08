import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Supabase connection string format:
// postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabasePassword = process.env.SUPABASE_DB_PASSWORD || '';

if (!supabaseUrl || !supabasePassword) {
  throw new Error('Supabase configuration missing: VITE_SUPABASE_URL and SUPABASE_DB_PASSWORD required');
}

// Extract project ref from URL (e.g., https://yqganeyurpbdkjaxsgnm.supabase.co)
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

// Connection string for Supabase Postgres
const connectionString = `postgresql://postgres.${projectRef}:${supabasePassword}@aws-1-eu-west-3.pooler.supabase.com:5432/postgres`;

console.log(`🟢 Connecting to Supabase DB: postgres.${projectRef}@aws-1-eu-west-3.pooler.supabase.com`);

export const supabaseClient = postgres(connectionString, {
  prepare: false,
  max: 10,
});

export const supabaseDb = drizzle(supabaseClient, { schema });
