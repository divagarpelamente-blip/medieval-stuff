import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rykdgxbfvfuuwvqybims.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5a2RneGJmdmZ1dXd2cXliaW1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxODI0ODAsImV4cCI6MjA5Mzc1ODQ4MH0.mpMr8W1SZnQkdhgawq9klNlKx51caVbul31q-SOzN3c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('Inserting transaction...');
  const { data, error } = await supabase
    .from('transactions')
    .insert([
      {
        profile_id: '00000000-0000-0000-0000-000000000000',
        class: 'Income',
        amount: 1000,
        from: 'Pedro',
        date: '2026-05-15',
        status: 'Completed',
        sub_class: 'Cash receipt',
        entity: 'Salary',
        category: 'Payroll',
        sub_category: 'Monthly',
        description: 'Ordenado de Maio'
      }
    ]);

  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Success:', data);
  }
}

testInsert();
