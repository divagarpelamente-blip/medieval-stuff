const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rykdgxbfvfuuwvqybims.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5a2RneGJmdmZ1dXd2cXliaW1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxODI0ODAsImV4cCI6MjA5Mzc1ODQ4MH0.mpMr8W1SZnQkdhgawq9klNlKx51caVbul31q-SOzN3c";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Attempting to sign in/up a test user...");
  // Let's try signing in first
  let { data: authData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: 'lord@eldoria.com',
    password: 'password123'
  });

  if (signInErr) {
    console.log("Sign in failed, attempting sign up...");
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: 'lord@eldoria.com',
      password: 'password123'
    });
    if (signUpErr) {
      console.error("Sign up failed:", signUpErr);
      return;
    }
    authData = signUpData;
  }

  const user = authData.user;
  console.log("Authenticated User ID:", user.id);

  // Check if profile exists
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  console.log("Profile:", profile, profErr);
}

run();
