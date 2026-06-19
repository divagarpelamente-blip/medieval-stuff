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
  console.log('--- FETCHING ACCOUNT BALANCES ---');
  const { data: balances, error: balErr } = await supabase
    .from('account_balances')
    .select('*');
  if (balErr) {
    console.error('Error fetching balances:', balErr);
  } else {
    console.log('Account Balances found:', balances.length);
    console.log(JSON.stringify(balances, null, 2));
  }

  console.log('--- FETCHING RECENT TRANSACTIONS ---');
  const { data: txs, error: txErr } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  if (txErr) {
    console.error('Error fetching transactions:', txErr);
  } else {
    console.log('Recent Transactions:');
    txs.forEach(t => {
      console.log(`ID: ${t.id}, Type: ${t.transaction_type}, Subtype: ${t.transaction_subtype}, Flow: ${t.flow}, Status: ${t.payment_status}, Amount: ${t.amount}, Source: ${t.source_dest_bank}, Target: ${t.target_account}`);
    });
  }
}

inspect();
