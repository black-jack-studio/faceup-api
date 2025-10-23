import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from './lib/supabase';
import { useUserStore } from '@/store/user-store';

export function registerDeepLinkHandler() {
  if (!Capacitor.isNativePlatform()) return;

  App.addListener('appUrlOpen', async ({ url }) => {
    try {
      const u = new URL(url);
      // Format attendu: faceup://auth/callback?code=...&state=...
      const code = u.searchParams.get('code');
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('Supabase exchange error', error);
        } else {
          console.log('Session exchanged successfully', data);
          try {
            await useUserStore.getState().finalizeSupabaseSession();
          } catch (sessionError) {
            console.error('Failed to finalize session after deep link login', sessionError);
          }
        }
      }
    } catch (e) {
      console.error('Deep link parse error', e);
    }
  });
}
