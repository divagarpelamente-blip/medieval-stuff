const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env
const envContent = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log("Fetching dim_contas matrix records...");
  const { data, error } = await supabase.from('dim_contas').select('*');
  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Fetched ${data.length} records.`);
  
  // Group by type, subtype, category, entity
  const types = [...new Set(data.map(d => d.type))];
  const subtypes = [...new Set(data.map(d => d.subtype))];
  const categories = [...new Set(data.map(d => d.category))];
  const entities = [...new Set(data.map(d => d.entity))];

  console.log("Unique Types:", types);
  console.log("Unique Subtypes (first 10):", subtypes.slice(0, 10));
  console.log("Unique Categories (first 10):", categories.slice(0, 10));
  console.log("Unique Entities (first 10):", entities.slice(0, 10));

  console.log("\nFirst 5 records:");
  console.log(JSON.stringify(data.slice(0, 5), null, 2));
}

run();
