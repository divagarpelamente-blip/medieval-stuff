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

async function testDashboardQueries() {
  console.log('Testing transactions query...');
  const tStart = Date.now();
  const txRes = await supabase
    .from('transactions')
    .select('*')
    .eq('profile_id', '00000000-0000-0000-0000-000000000000')
    .order('created_at', { ascending: false })
    .limit(200);
  console.log('Transactions query returned in', Date.now() - tStart, 'ms. Success:', !txRes.error);
  if (txRes.error) console.error(txRes.error);

  console.log('Testing account_balances query...');
  const bStart = Date.now();
  const balRes = await supabase
    .from('account_balances')
    .select('*')
    .eq('profile_id', '00000000-0000-0000-0000-000000000000');
  console.log('Account balances query returned in', Date.now() - bStart, 'ms. Success:', !balRes.error);
  if (balRes.error) console.error(balRes.error);
}

testDashboardQueries();



