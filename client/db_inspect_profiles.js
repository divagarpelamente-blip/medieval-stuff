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

async function inspect() {
  console.log('--- FETCHING GUEST PROFILE ---');
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000000')
    .maybeSingle();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Guest Profile:', profile);
  }

  console.log('--- FETCHING ADMIN PROFILE ---');
  const { data: adminProf, error: adminErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', 'd8bd5b93-4bd8-4077-863e-8a28f9ab3b6e')
    .maybeSingle();

  if (adminErr) {
    console.error('Error:', adminErr);
  } else {
    console.log('Admin Profile:', adminProf);
  }
}

inspect();
