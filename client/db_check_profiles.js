import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://rykdgxbfvfuuwvqybims.supabase.co';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Let's try to query profiles table. Since we don't have auth, let's see if we can call count
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  console.log('Profiles table check - Count:', count, 'Error:', error);
}

check();
