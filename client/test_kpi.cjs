const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env manually
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Copied from chartAnalytics.js
function calculateLedgerKPIs(transactions) {
  if (!Array.isArray(transactions)) return {
    totalIncome: 0, totalExpenses: 0, netCashFlow: 0,
    totalAssets: 0, immediateLiquidity: 0, totalInvestments: 0,
    totalLiabilities: 0, netWorth: 0
  };

  let kpi = {
    totalIncome: 0, totalExpenses: 0,
    totalAssets: 0, immediateLiquidity: 0, totalInvestments: 0,
    totalLiabilities: 0
  };

  transactions.forEach(t => {
    const amount = Number(t.amount) || 0;
    const source = t.source_account || '';
    const target = t.target_account || '';

    // 1. Income (Prefix 7)
    if (source.startsWith('7')) kpi.totalIncome += amount;
    if (target.startsWith('7')) kpi.totalIncome -= amount;

    // 2. Expenses (Prefix 6)
    if (target.startsWith('6')) kpi.totalExpenses += amount;
    if (source.startsWith('6')) kpi.totalExpenses -= amount;

    // 3. Assets (Prefix 1)
    if (target.startsWith('1')) {
      kpi.totalAssets += amount;
      if (target.startsWith('1101') || target.startsWith('1102') || target.startsWith('1103')) kpi.immediateLiquidity += amount;
      if (target.startsWith('1301') || target.startsWith('1302')) kpi.totalInvestments += amount;
    }
    if (source.startsWith('1')) {
      kpi.totalAssets -= amount;
      if (source.startsWith('1101') || source.startsWith('1102') || source.startsWith('1103')) kpi.immediateLiquidity -= amount;
      if (source.startsWith('1301') || source.startsWith('1302')) kpi.totalInvestments -= amount;
    }

    // 4. Liabilities (Prefix 2) - Standard balance (taking debt increases balance)
    if (target.startsWith('2')) kpi.totalLiabilities += amount;
    if (source.startsWith('2')) kpi.totalLiabilities -= amount;
  });

  return {
    ...kpi,
    netCashFlow: kpi.totalIncome - kpi.totalExpenses,
    netWorth: kpi.totalAssets - kpi.totalLiabilities
  };
}

async function run() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .limit(10);
  
  if (error) {
    console.error('Error fetching transactions:', error);
    return;
  }
  
  console.log('Sample transaction:', data[0]);
  console.log('Calculated KPIs:', calculateLedgerKPIs(data));
}

run();
