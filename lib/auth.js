import { createClient } from '@supabase/supabase-js';
import { getServerDatabase } from './supabase';

// Validate the bearer token with Supabase Auth before any privileged database lookup.
export async function getCurrentEmployee(request) {
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer (.+)$/.exec(header);
  if (!match) return null;
  const url = process.env.SUPABASE_URL;
  const publishable = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishable) throw new Error('Supabase Auth not configured');
  const authClient = createClient(url, publishable, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error } = await authClient.auth.getUser(match[1]);
  if (error || !user) return null;
  const db = getServerDatabase();
  const { data: employee, error: employeeError } = await db.rpc('paycheckrb_server_employee_lookup', { p_user_id: user.id }).maybeSingle();
  if (employeeError) throw employeeError;
  if (!employee?.active) return null;
  return employee;
}
