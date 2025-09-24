import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';

// Check if Supabase environment variables are configured
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;


const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function AppleLoginButton() {
  const handleAppleLogin = async () => {
    if (!supabase) {
      console.error('Supabase n\'est pas configuré. Veuillez configurer VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
      return;
    }
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: window.location.origin + '/auth/callback'
      }
    });
    if (error) console.error('Erreur Apple login:', error.message);
  };

  return (
    <motion.button
      onClick={handleAppleLogin}
      className="w-full bg-black text-white font-bold text-lg py-4 rounded-2xl transition-all duration-300 border border-white/20 hover:bg-gray-900 flex items-center justify-center gap-3"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      data-testid="button-apple-login"
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
      Sign in with Apple
    </motion.button>
  );
}