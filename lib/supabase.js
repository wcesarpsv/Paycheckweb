import { createClient } from '@supabase/supabase-js';

// Server-only service client. The paycheckrb schema remains private and is not exposed via Data API.
export function getServerDatabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Missing Supabase server configuration');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
