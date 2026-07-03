import fs from 'fs';
import { parseCSV } from './src/utils/csvHelpers.js';

const text = fs.readFileSync('C:\\Users\\silva\\Downloads\\Ledger Pedro.csv', 'utf-8');
const parsed = parseCSV(text);
console.log(`Parsed total rows (including header): ${parsed.length}`);

const headers = parsed[0].map(h => h.trim().toLowerCase());
const rows = parsed.slice(1);

let skippedCount = 0;
let successCount = 0;

for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  if (row.length === 1 && row[0] === '') {
    console.log(`Row ${i + 2} skipped: empty line`);
    skippedCount++;
    continue;
  }

  // Run validation checks from handleImportCSV
  const tx = {};
  headers.forEach((header, idx) => {
    tx[header] = row[idx] ? row[idx].trim() : '';
  });

  const txType = tx.transaction_type;
  if (!txType || !['Income', 'Expense', 'Assets', 'Liabilities'].includes(txType)) {
    console.log(`Row ${i + 2} transaction_type issue: '${txType}'`);
  }
  
  successCount++;
}

console.log(`Success checks: ${successCount}, Skipped: ${skippedCount}`);
