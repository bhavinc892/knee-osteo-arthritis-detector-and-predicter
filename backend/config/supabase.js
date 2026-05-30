import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      realtime: {
        transport: ws
      }
    });
    console.log('[SUPABASE] Connected successfully.');
  } catch (err) {
    console.error('[SUPABASE] Connection error:', err.message);
  }
} else {
  console.log('[SUPABASE] Credentials missing. Running in local/mock database mode.');
}

export { supabase };
