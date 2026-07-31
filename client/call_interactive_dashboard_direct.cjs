const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env
const envContent = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log("Signing in as lord@eldoria.com...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'lord@eldoria.com',
    password: 'password123'
  });

  if (authErr) {
    console.error("Auth failed:", authErr);
    return;
  }

  const userId = authData.user.id;
  console.log("User ID:", userId);

  console.log("Checking if profile exists...");
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  console.log("Profile details:", profile);

  console.log("Checking if there are any transactions...");
  const { data: txs, error: txErr } = await supabase
    .from('transactions')
    .select('count', { count: 'exact', head: true });
  console.log("Transaction count:", txs, txErr);

  console.log("Calling get_interactive_dashboard RPC...");
  const today = '2026-05-15';
  const { data, error } = await supabase.rpc('get_interactive_dashboard', {
    p_profile_id: userId,
    p_client_today: today,
    p_start_date: null,
    p_end_date: null,
    p_month: null,
    p_status: 'Pending',
    p_arrear: null,
    p_category: null,
    p_entity: null
  });

  if (error) {
    console.error("RPC Error:", error);
    return;
  }

  console.log("Dashboard Data Keys:", Object.keys(data));
  console.log("Arrear Summary:", JSON.stringify(data.arrear_summary, null, 2));
  console.log("First transaction in ledger:", JSON.stringify((data.ledger || [])[0], null, 2));
}

run();
