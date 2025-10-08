import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { seedCardBacks /*, addSingleCardBack */ } from "./seedCardBacks";
import { storage } from "./storage";
import { runReferralMigration } from "./referral-migration";
import { generateReferralCodesForExistingUsers } from "./utils/generate-referral-codes";
import fs from "fs";
import path from "path";
import { pingDB } from "./db"; 

function log(message: string, source = "express") {
  const t = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${t} [${source}] ${message}`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Statut de readiness ---
let ready = false;
let lastStartupError: string | null = null;

// --- Petit logger pour /api ---
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    // @ts-ignore
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

// --- Endpoints santé ---
app.get("/health", (_req, res) => res.status(200).send("ok"));
app.get("/ready", (_req, res) => res.json({ ready, lastStartupError }));

// --- Static files (client dans dist/public à l'exécution) ---
function serveStatic(app: express.Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    log(`⚠️ Static folder not found at ${distPath} — skipping static hosting`);
    return;
  }
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// --- Util: retry avec backoff ---
async function withRetries<T>(fn: () => Promise<T>, label: string, tries = 3) {
  let attempt = 0;
  // backoff: 0s, 1s, 2s
  while (attempt < tries) {
    try {
      return await fn();
    } catch (e: any) {
      attempt++;
      const msg = e?.message || String(e);
      log(`❌ ${label} failed (attempt ${attempt}/${tries}): ${msg}`);
      if (attempt >= tries) throw e;
      await new Promise(r => setTimeout(r, attempt * 1000));
    }
  }
  // TS
  throw new Error(`${label} exhausted retries`);
}

// --- Tâches de démarrage (après listen) ---
async function runStartupTasks() {
  try {
    await withRetries(() => runReferralMigration(), "Referral migration");
    await withRetries(() => generateReferralCodesForExistingUsers(), "Generate referral codes");
    ready = true;
    lastStartupError = null;
    log("✅ Startup tasks complete. App is READY.");
  } catch (e: any) {
    ready = false;
    lastStartupError = e?.message || String(e);
    log(`❌ Startup tasks ended with error: ${lastStartupError}`);
    // On NE stoppe pas le process : tu peux investiguer via /ready et logs
  }
}

(async () => {
  // 0) Ping DB rapide (diagnostic)
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 3000);
    await pingDB(); // ⬅️ abstraction safe pg/postgres
    clearTimeout(to);
    log("🟢 DB ping ok");
  } catch (e: any) {
    log(`🟡 DB ping failed (continuing): ${e?.message || e}`);
  }

  // 1) Card backs init (dev ou flag explicite)
  log("🎴 Initializing card backs before server startup...");
  if (process.env.NODE_ENV === "development" || process.env.SEED_CARD_BACKS === "true") {
    try {
      await seedCardBacks();
      log("🔄 Synchronizing ALL card backs from JSON...");
      const syncResult = await storage.syncCardBacksFromJson();
      log(`✅ JSON Sync complete: ${syncResult.synced} new, ${syncResult.skipped} existing`);
      log("✅ Card backs fully initialized");
    } catch (error) {
      log(`❌ CRITICAL: Card back initialization failed: ${error}`);
      log("🛑 Server startup aborted - card backs must be initialized");
      process.exit(1);
    }
  } else {
    log("⚠️ Skipping card back seeding - not in development mode and SEED_CARD_BACKS not enabled");
  }

  // 2) Routes API
  await registerRoutes(app);

  // (Optionnel) Exemple de garde pour une route critique dépendante des migrations :
  // app.use("/api/purchases", (req, res, next) => {
  //   if (!ready) return res.status(503).json({ message: "Service initializing, try again shortly." });
  //   next();
  // });

  // 3) Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // 4) Static hosting
  serveStatic(app);

  // 5) Start server (Render doit voir le port)
  const port = parseInt(process.env.PORT || "5000", 10);
  app.listen(port, "0.0.0.0", () => {
    log(`🚀 Server ready – serving on port ${port}`);
    // 6) Lancer les tâches de démarrage en fond
    void runStartupTasks();
  });
})().catch((e) => {
  console.error(e);
  process.exit(1);
});