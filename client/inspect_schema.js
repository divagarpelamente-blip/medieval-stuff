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

async function run() {
  const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(5);
  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log('Most recent transactions from DB:');
    data.forEach(t => {
      console.log(`ID: ${t.id}, posting_date: ${t.posting_date}, due_date: ${t.due_date}, amount: ${t.amount}, desc: ${t.description}`);
    });
  }
}
run();
