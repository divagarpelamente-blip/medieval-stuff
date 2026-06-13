import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Manually parse .env file
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

if (!supabaseKey) {
  console.error('Error: VITE_SUPABASE_ANON_KEY is missing from .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Connecting to Supabase and fetching all transactions...');
  const { data: txs, error } = await supabase
    .from('transactions')
    .select('*');
  
  if (error) {
    console.error('Error fetching transactions:', error);
    return;
  }

  console.log(`Fetched ${txs.length} transactions. Analyzing constraint violations...`);
  
  const violations = [];
  txs.forEach(tx => {
    const type = tx.transaction_type;
    const subtype = tx.transaction_subtype;
    const nature = tx.transaction_nature;
    const flow = tx.transaction_flow;
    const status = tx.payment_status;

    const rule1 = (type === 'Receivable' && flow === 'inflow');
    const rule2 = (type === 'Payable' && flow === 'outflow');
    const rule3 = (subtype === 'New Debt' && flow === 'inflow');
    const rule4 = (['Amortization', 'Interest'].includes(subtype) && nature === 'cash' && flow === 'outflow');
    const rule5 = (type === 'Income' || type === 'Expense');
    const rule6 = (!['Receivable', 'Payable', 'Income', 'Expense', 'Debt'].includes(type));

    const isValid = rule1 || rule2 || rule3 || rule4 || rule5 || rule6;

    if (!isValid) {
      violations.push({
        id: tx.id,
        type,
        subtype,
        nature,
        flow,
        status,
        amount: tx.amount,
        description: tx.description
      });
    }
  });

  if (violations.length > 0) {
    console.log(`Found ${violations.length} violations:`);
    console.log(JSON.stringify(violations, null, 2));
  } else {
    console.log('No violations found for the original strict constraint rules.');
  }
}

check();
