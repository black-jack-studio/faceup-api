import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import ws from "ws";
import * as schema from "@shared/schema";

const USE_SUPABASE = process.env.USE_SUPABASE === 'true';

let pool: any;
let db: any;

if (USE_SUPABASE) {
  // SUPABASE CONNECTION
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabasePassword = process.env.SUPABASE_DB_PASSWORD || '';
  const supabaseRegion = process.env.SUPABASE_REGION || 'eu-west-3';

  if (!supabaseUrl || !supabasePassword) {
    throw new Error('Supabase configuration missing: VITE_SUPABASE_URL and SUPABASE_DB_PASSWORD required');
  }

  // Extract project ref from URL (e.g., https://yqganeyurpbdkjaxsgnm.supabase.co)
  const projectRef = supabaseUrl.replace('https://', '').replace('http://', '').split('.')[0];
  const connectionString = `postgresql://postgres.${projectRef}:${supabasePassword}@aws-1-${supabaseRegion}.pooler.supabase.com:5432/postgres`;

  console.log(`🟢 Using SUPABASE DB: postgres.${projectRef}@aws-1-${supabaseRegion}.pooler.supabase.com`);

  const supabaseClient = postgres(connectionString, { prepare: false, max: 10 });
  pool = supabaseClient;
  db = drizzlePostgres(supabaseClient, { schema });

} else {
  // NEON CONNECTION (default)
  neonConfig.webSocketConstructor = ws;

  const dbConfig = {
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  };

  if (!dbConfig.host || !dbConfig.user || !dbConfig.password || !dbConfig.database) {
    throw new Error(
      "Database configuration incomplete. Missing PGHOST, PGUSER, PGPASSWORD, or PGDATABASE environment variables.",
    );
  }

  console.log(`🔵 Using NEON DB: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

  pool = new Pool(dbConfig);
  db = drizzleNeon({ client: pool, schema });
}

export { pool, db };