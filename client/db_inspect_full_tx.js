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
  const { data: txs, error } = await supabase
    .from('transactions')
    .select('*');
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(txs, null, 2));
  }
}

inspect();
