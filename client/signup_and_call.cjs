const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env
const envContent = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const randomEmail = `test_${Date.now()}@eldoria.com`;
  console.log(`Signing up with temporary email: ${randomEmail}...`);
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: randomEmail,
    password: 'password123'
  });

  if (signUpErr) {
    console.error("Sign up failed:", signUpErr);
    return;
  }

  const session = signUpData.session;
  if (!session) {
    console.error("Sign up succeeded but no session returned.");
    return;
  }

  const user = signUpData.user;
  console.log("Registered User ID:", user.id);

  // Initialize authenticated client with API key header
  const authSupabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: supabaseKey
      }
    }
  });

  // Seed the profile first!
  console.log("Seeding profile...");
  const { error: profErr } = await authSupabase
    .from('profiles')
    .insert([{ id: user.id, role: 'lord' }]);
  if (profErr) {
    console.error("Profile seeding failed:", profErr);
    return;
  }

  console.log("Seeding one pending transaction...");
  const { data: tx, error: txErr } = await authSupabase
    .from('transactions')
    .insert([
      {
        profile_id: user.id,
        posting_date: '2026-05-10',
        value_date: '2026-05-12', // Overdue relative to 2026-05-15
        payment_date: null,
        amount: 150.00,
        type: 'Expenses',
        category: 'Utilities',
        entity: 'DIGAL',
        flow: 'outflow',
        payment_status: 'Pending'
      }
    ])
    .select();

  if (txErr) {
    console.error("Seeding transaction failed:", txErr);
    return;
  }
  console.log("Seeded transaction:", tx);

  console.log("Calling get_interactive_dashboard RPC...");
  const today = '2026-05-15';
  const { data, error } = await authSupabase.rpc('get_interactive_dashboard', {
    p_profile_id: user.id,
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

  console.log("Arrear Summary:", JSON.stringify(data.arrear_summary, null, 2));
  console.log("Seeded transaction in ledger:", JSON.stringify((data.ledger || [])[0], null, 2));
}

run();
