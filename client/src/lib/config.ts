const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

function normalizeLogLevel(level: string | undefined): LogLevel {
  if (!level) return 'warn';
  const normalized = level.toLowerCase();
  return (normalized in LOG_LEVELS ? normalized : 'warn') as LogLevel;
}

const rawConfig = {
  API_URL: import.meta.env.VITE_API_URL ?? '',
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  STRIPE_PUBLIC_KEY: import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '',
  LOG_LEVEL: normalizeLogLevel(import.meta.env.VITE_LOG_LEVEL),
} as const;

export const CONFIG = rawConfig;

export type Config = typeof CONFIG;

export function isLogLevelEnabled(level: LogLevel): boolean {
  return LOG_LEVELS[level] <= LOG_LEVELS[CONFIG.LOG_LEVEL];
}

function logConfigIssue(level: LogLevel, message: string, ...details: unknown[]) {
  if (!isLogLevelEnabled(level)) return;
  const [method] =
    level === 'error'
      ? [console.error]
      : level === 'warn'
        ? [console.warn]
        : [console.log];
  method(`[CONFIG] ${message}`, ...details);
}

if (!CONFIG.API_URL) {
  logConfigIssue('warn', 'VITE_API_URL is not defined. API calls will fail.');
}

if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
  logConfigIssue('error', 'Supabase environment variables are missing.', {
    hasUrl: Boolean(CONFIG.SUPABASE_URL),
    hasAnonKey: Boolean(CONFIG.SUPABASE_ANON_KEY),
  });
}

if (!CONFIG.STRIPE_PUBLIC_KEY) {
  logConfigIssue('info', 'VITE_STRIPE_PUBLIC_KEY is not set; Stripe widgets will be disabled.');
}
