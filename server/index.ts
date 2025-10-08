import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { seedCardBacks, addSingleCardBack } from "./seedCardBacks";
import { storage } from "./storage";
import { runReferralMigration } from "./referral-migration";
import { generateReferralCodesForExistingUsers } from "./utils/generate-referral-codes";
import fs from "fs";
import path from "path";


function log(message: string, source = "express") {
  const t = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  console.log(`${t} [${source}] ${message}`);
}

function serveStatic(app: express.Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(`Could not find the build directory: ${distPath}. Build the client first (npm run build).`);
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // CRITICAL: Initialize card backs BEFORE starting server to prevent race conditions
  log("🎴 Initializing card backs before server startup...");
  
  if (process.env.NODE_ENV === "development" || process.env.SEED_CARD_BACKS === "true") {
    try {
      // First, seed the hardcoded card backs
      await seedCardBacks();
      
      // DISABLED: Add the new Orbital Hypnosis card back
      // await addSingleCardBack({
      //   name: 'Orbital Hypnosis',
      //   description: 'Mesmerizing white design with hypnotic orbital circles and cosmic energy',
      //   rarity: 'LEGENDARY',
      //   priceGems: 1000,
      //   sourceFile: 'cgcg-removebg-preview_1758055631062.png'
      // });
      
      // CRITICAL: Sync ALL card backs from JSON to database to prevent foreign key errors
      log("🔄 Synchronizing ALL card backs from JSON...");
      const syncResult = await storage.syncCardBacksFromJson();
      log(`✅ JSON Sync complete: ${syncResult.synced} new, ${syncResult.skipped} existing`);
      
      log("✅ Card backs fully initialized - server ready to accept requests");
    } catch (error) {
      log(`❌ CRITICAL: Card back initialization failed: ${error}`);
      log("🛑 Server startup aborted - card backs must be initialized");
      process.exit(1);
    }
  } else {
    log("⚠️ Skipping card back seeding - not in development mode and SEED_CARD_BACKS not enabled");
  }

  // Run referral system migration
  log("🔄 Running referral system migration...");
  await runReferralMigration();

  // Generate referral codes for existing users
  log("🔄 Generating referral codes for existing users...");
  await generateReferralCodesForExistingUsers();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  serveStatic(app);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`🚀 Server ready - serving on port ${port}`);
    log("🎯 Card backs initialized - mystery pack purchases are safe");
  });
})();
