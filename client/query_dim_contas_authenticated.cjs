const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env
const envContent = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log("Signing in...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'lord@eldoria.com',
    password: 'password123'
  });

  if (authErr) {
    console.error("Auth failed:", authErr);
    // Try sign up if sign in failed
    console.log("Trying sign up...");
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: 'lord@eldoria.com',
      password: 'password123'
    });
    if (signUpErr) {
      console.error("Sign up failed:", signUpErr);
      return;
    }
    console.log("Sign up succeeded.");
  }

  // Get session token and build auth client
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) {
    console.error("No session found!");
    return;
  }

  const authSupabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: supabaseKey
      }
    }
  });

  console.log("Querying dim_contas with authenticated session...");
  const { data, error } = await authSupabase.from('dim_contas').select('*');
  if (error) {
    console.error("Query error:", error);
    return;
  }

  console.log(`Fetched ${data.length} records.`);
  if (data.length > 0) {
    console.log("First record:", data[0]);
  }
}

run();
