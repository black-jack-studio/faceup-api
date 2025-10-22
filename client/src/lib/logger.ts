import type { LogLevel } from './config';
import { CONFIG, isLogLevelEnabled } from './config';

type LogMethod = (...args: unknown[]) => void;

type Logger = {
  error: LogMethod;
  warn: LogMethod;
  info: LogMethod;
  debug: LogMethod;
};

function pickConsole(level: LogLevel): LogMethod {
  switch (level) {
    case 'error':
      return console.error.bind(console);
    case 'warn':
      return console.warn.bind(console);
    default:
      return console.log.bind(console);
  }
}

function emit(prefix: string, level: LogLevel, args: unknown[]): void {
  if (!isLogLevelEnabled(level)) return;
  const method = pickConsole(level);
  method(`[${prefix}]`, ...args);
}

export function createLogger(prefix: string): Logger {
  return {
    error: (...args: unknown[]) => emit(prefix, 'error', args),
    warn: (...args: unknown[]) => emit(prefix, 'warn', args),
    info: (...args: unknown[]) => emit(prefix, 'info', args),
    debug: (...args: unknown[]) => emit(prefix, 'debug', args),
  };
}

export const activeLogLevel: LogLevel = CONFIG.LOG_LEVEL;
