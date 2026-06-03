import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase URL or Anon Key is missing. Using placeholder values.');
} else {
  console.log('Supabase client initialized for:', import.meta.env.VITE_SUPABASE_URL.substring(0, 20) + '...');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
