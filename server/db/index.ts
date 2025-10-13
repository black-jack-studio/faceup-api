import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import ws from "ws";
import * as schema from "./schema/index";

const USE_SUPABASE = process.env.USE_SUPABASE === "true";

let pool: any; // peut être un Pool (neon) ou un client postgres() (porsager)
let db: any;

if (USE_SUPABASE) {
  // --- SUPABASE CONNECTION ---
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
  const supabasePassword = process.env.SUPABASE_DB_PASSWORD || "";
  const supabaseRegion = process.env.SUPABASE_REGION || "eu-west-3";

  if (!supabaseUrl || !supabasePassword) {
    throw new Error("Supabase configuration missing: VITE_SUPABASE_URL and SUPABASE_DB_PASSWORD required");
  }

  const projectRef = supabaseUrl.replace('https://', '').replace('http://', '').split('.')[0];
  const connectionString =
    `postgresql://postgres.${projectRef}:${supabasePassword}` +
    `@aws-1-${supabaseRegion}.pooler.supabase.com:5432/postgres`;

  console.log(`🟢 Using SUPABASE DB: postgres.${projectRef}@aws-1-${supabaseRegion}.pooler.supabase.com`);

  // 🔐 TLS requis côté pooler Supabase
  const supabaseClient = postgres(connectionString, {
    ssl: "require",
    prepare: false,
    max: 10,
  });

  pool = supabaseClient; // <-- client 'postgres' (pas de .query)
  db = drizzlePostgres(supabaseClient, { schema });

} else {
  // --- NEON CONNECTION (default) ---
  neonConfig.webSocketConstructor = ws;

  const dbConfig = {
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || "5432"),
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

  const neonPool = new Pool(dbConfig); // <-- a bien .query(...)
  pool = neonPool;
  db = drizzleNeon({ client: neonPool, schema });
}

/** Ping base — abstraction pg/postgres */
async function pingDB(): Promise<boolean> {
  if (USE_SUPABASE) {
    // client 'postgres' : utiliser les templates SQL
    const rows = await pool/* sql */`select 1 as ok`;
    return rows?.[0]?.ok === 1;
  } else {
    // client 'pg' : .query(...)
    const { rows } = await pool.query("select 1 as ok");
    return rows?.[0]?.ok === 1;
  }
}

/** exécution SQL "brute" — utile si tu veux une API commune ailleurs */
async function dbQuery(text: string, params: any[] = []) {
  if (USE_SUPABASE) {
    // 'unsafe' accepte une string + params (⚠️ pas de templating automatique)
    return pool.unsafe(text, params);
  } else {
    return pool.query(text, params);
  }
}

export { pool, db, pingDB, dbQuery };
