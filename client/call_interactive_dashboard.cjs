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

  console.log("Calling get_interactive_dashboard RPC...");
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.rpc('get_interactive_dashboard', {
    p_profile_id: userId,
    p_client_today: today
  });

  if (error) {
    console.error("RPC Error:", error);
    return;
  }

  console.log("Dashboard Data Keys:", Object.keys(data));
  console.log("Arrear Summary:", JSON.stringify(data.arrear_summary, null, 2));
  console.log("Status Summary:", JSON.stringify(data.status_summary, null, 2));
  console.log("First 3 transactions in ledger:", JSON.stringify((data.ledger_data || []).slice(0, 3), null, 2));
}

run();
