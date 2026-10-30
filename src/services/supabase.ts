import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const SESSION_TOKEN_KEY = 'career_archive_session_token';

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim().length > 0 &&
    !supabaseUrl.includes('your-project-id') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim().length > 0 &&
    !supabaseAnonKey.includes('your-supabase-anon-key')
  );
};

export const getSessionToken = (): string => {
  return sessionStorage.getItem(SESSION_TOKEN_KEY) || '';
};

export const setSessionToken = (token: string | null): void => {
  if (token) {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  }
};

/**
 * Returns a Supabase client dynamically configured with the current session token
 * passed in the 'x-session-token' HTTP header for server-side RLS enforcement.
 */
export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null;
  const token = getSessionToken();
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { 'x-session-token': token } : {},
    },
  });
};

// Export backward-compatible supabase proxy
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
