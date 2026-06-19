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
  console.log('--- FETCHING ALL PROFILES ---');
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('*');
  if (profErr) {
    console.error('Error fetching profiles:', profErr);
  } else {
    console.log('Profiles:');
    profiles.forEach(p => {
      console.log(`ID: ${p.id}, Email: ${p.email}, Gold: ${p.gold}, Level: ${p.level}, XP: ${p.xp}`);
    });
  }

  console.log('--- FETCHING ALL TRANSACTIONS WITH PROFILE INFO ---');
  const { data: txs, error: txErr } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });
  if (txErr) {
    console.error('Error fetching transactions:', txErr);
  } else {
    console.log(`Transactions found: ${txs.length}`);
    txs.forEach(t => {
      console.log(`ID: ${t.id}, ProfileID: ${t.profile_id}, Type: ${t.transaction_type}, Subtype: ${t.transaction_subtype}, Flow: ${t.flow}, Status: ${t.payment_status}, Amount: ${t.amount}`);
    });
  }
}

inspect();
