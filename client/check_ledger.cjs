const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read supabase credentials
const clientCode = fs.readFileSync('src/lib/supabaseClient.js', 'utf-8');
const urlMatch = clientCode.match(/const supabaseUrl = ['"]([^'"]+)['"]/);
const keyMatch = clientCode.match(/const supabaseKey = ['"]([^'"]+)['"]/);

if (!urlMatch || !keyMatch) {
  console.error("Could not parse Supabase credentials.");
  process.exit(1);
}

const supabaseUrl = urlMatch[1];
const supabaseKey = keyMatch[1];
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(5);
  if (pError || !profiles || profiles.length === 0) {
    console.error("Error fetching profiles:", pError);
    return;
  }

  for (const prof of profiles) {
    console.log(`\n========================================`);
    console.log(`PROFILE: ${prof.username} (${prof.id}) | Gold: ${prof.gold}`);

    // Fetch opening balances
    const { data: balances } = await supabase
      .from('account_balances')
      .select('*')
      .eq('profile_id', prof.id);
    console.log("Opening balances:", balances);

    // Fetch transactions
    const { data: txs, error: tError } = await supabase
      .from('transactions')
      .select('*')
      .eq('profile_id', prof.id);

    if (tError) {
      console.error("Error fetching transactions:", tError);
      continue;
    }

    console.log(`Total transactions in ledger: ${txs.length}`);
    
    // Print all transactions affecting 10101001
    const isCompleted = (status) => ['Completed', 'Paid', 'Paid on Time', 'Paid Late'].includes(status);
    const relevantTxs = txs.filter(tx => 
      isCompleted(tx.payment_status) &&
      (tx.source_dest_bank === '10101001' || tx.target_account === '10101001' || (!tx.source_dest_bank && !tx.target_account))
    );
    console.log("\nRelevant transactions affecting 10101001:");
    relevantTxs.forEach(tx => {
      console.log(`  - Type: ${tx.transaction_type} | Flow: ${tx.flow} | Amt: ${tx.amount} | Src: ${tx.source_dest_bank} | Tgt: ${tx.target_account} | Desc: ${tx.description}`);
    });
  }
}

check();
