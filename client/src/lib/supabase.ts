import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config';
import { isNative } from './isNative';
import { createLogger } from './logger';

const logger = createLogger('AUTH_SYNC');

if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
  logger.error('Missing Supabase configuration. Cannot initialize client.', {
    hasUrl: Boolean(CONFIG.SUPABASE_URL),
    hasAnonKey: Boolean(CONFIG.SUPABASE_ANON_KEY),
  });
  throw new Error('Supabase configuration is incomplete');
}

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: isNative ? 'nativeSession' : 'webSession',
  },
});
