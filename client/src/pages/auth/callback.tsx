import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user-store';

function extractCodeFromLocation(): string | null {
  try {
    const currentUrl = new URL(window.location.href);
    const searchCode = currentUrl.searchParams.get('code');
    if (searchCode) {
      return searchCode;
    }

    if (currentUrl.hash) {
      const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ''));
      const hashCode = hashParams.get('code');
      if (hashCode) {
        return hashCode;
      }
    }
  } catch (error) {
    console.error('Failed to parse callback URL', error);
  }

  return null;
}

const AuthCallback = () => {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [message, setMessage] = useState('Finalizing authentication...');

  useEffect(() => {
    const finalizeAuthentication = async () => {
      const errorFromParams = new URLSearchParams(window.location.search).get('error_description');
      if (errorFromParams) {
        setStatus('error');
        setMessage(errorFromParams);
        return;
      }

      const code = extractCodeFromLocation();
      if (!code) {
        setStatus('error');
        setMessage('Missing authorization code.');
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Supabase exchange error', error);
        setStatus('error');
        setMessage(error.message || 'Unable to complete authentication.');
        return;
      }

      try {
        await useUserStore.getState().finalizeSupabaseSession();
        setStatus('success');
        setMessage('Authentication complete. Redirecting...');
        navigate('/');
      } catch (sessionError: any) {
        console.error('Failed to finalize session after callback', sessionError);
        setStatus('error');
        setMessage(sessionError?.message || 'Unable to load your profile.');
      }
    };

    void finalizeAuthentication();
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="rounded-lg border border-border bg-card px-6 py-8 text-center shadow-lg">
        <h1 className="mb-2 text-2xl font-semibold">Authenticating…</h1>
        <p className="text-muted-foreground">
          {status === 'loading' && message}
          {status === 'success' && message}
          {status === 'error' && message}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
