import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 기본 연결 프로젝트 (로컬 및 GitHub Pages 배포 시 동일하게 적용되는 공개 프로젝트 정보)
const DEFAULT_SUPABASE_URL = 'https://ipebholzwovobkbzqbdn.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_HRw7W27mw0-p7f3KqYLFWw_G9XAXVlD';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

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
