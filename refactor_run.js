const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'client/src/App.jsx',
  'client/src/utils/csvHelpers.js',
  'client/src/components/charts/FlowByCategoryChart.jsx',
  'client/src/components/charts/TimeEvolutionChart.jsx',
  'client/src/components/charts/TopEntitiesChart.jsx'
];

filesToProcess.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping missing file: ${file}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. tx.type checks
  // tx.type === 'income' -> tx.class === 'Income'
  // tx.type === 'expense' -> tx.class !== 'Income' (or tx.class === 'Expense'?)
  // Let's look at the old logic. If old logic checked `tx.type === 'expense'`, we can just use `tx.class !== 'Income'`.
  // But maybe it's safer to use `tx.class === 'Expense'` if they only care about strict expenses, or maybe `['Expense', 'Savings', 'Debt'].includes(tx.class)`?
  // Let's replace `tx.type === 'income'` with `tx.class === 'Income'`
  content = content.replace(/tx\.type\s*===\s*'income'/g, "tx.class === 'Income'");
  content = content.replace(/tx\.type\s*!==\s*'income'/g, "tx.class !== 'Income'");
  
  // Replace `tx.type === 'expense'` with `tx.class !== 'Income'` since all non-income are expenses in the DB trigger.
  content = content.replace(/tx\.type\s*===\s*'expense'/g, "tx.class !== 'Income'");

  // Also catch double quotes or variable names if necessary.
  content = content.replace(/txType/g, "txClass");
  content = content.replace(/setTxType/g, "setTxClass");
  
  // Now replace the properties:
  // type -> dropped. Where `tx.type` is used directly (e.g. `{tx.type}`), we replace it with `{tx.class}`.
  content = content.replace(/tx\.type/g, "tx.class");
  
  // category -> class
  // Wait, if I replace tx.category with tx.class, then when I replace tx.subcategory, I might mess up.
  // We should do it carefully.
  content = content.replace(/tx\.entity_category/g, "tx.__TEMP_CAT__");
  content = content.replace(/tx\.subcategory/g, "tx.sub_class");
  content = content.replace(/tx\.category/g, "tx.class");
  content = content.replace(/tx\.__TEMP_CAT__/g, "tx.category");

  // Translation keys
  content = content.replace(/t\('ledger\.headers\.type'\)/g, "t('ledger.headers.class')");
  content = content.replace(/t\('ledger\.headers\.subcategory'\)/g, "t('ledger.headers.sub_class')");
  content = content.replace(/t\('ledger\.headers\.entity_category'\)/g, "t('ledger.headers.category')");
  // t('ledger.headers.category') is already category, but old category is now class.
  // Wait, if old category is class, then `t('ledger.headers.category')` should become `t('ledger.headers.class')`!
  // But wait, what about the new `category`? The old `entity_category` is now `category`.
  // So:
  // old type -> dropped
  // old category -> class
  // old subcategory -> sub_class
  // old entity_category -> category
  
  // Let's do a safe string replacement for headers
  content = content.replace(/ledger\.headers\.entity_category/g, "__TEMP_HEAD_CAT__");
  content = content.replace(/ledger\.headers\.subcategory/g, "ledger.headers.sub_class");
  content = content.replace(/ledger\.headers\.category/g, "ledger.headers.class");
  content = content.replace(/__TEMP_HEAD_CAT__/g, "ledger.headers.category");
  
  // And for the UI labels `t.type`, `t.category`, `t.subcategory`, `t.entity_category`
  content = content.replace(/\bt\.entity_category\b/g, "__TEMP_T_CAT__");
  content = content.replace(/\bt\.subcategory\b/g, "t.sub_class");
  content = content.replace(/\bt\.category\b/g, "t.class");
  content = content.replace(/\bt\.type\b/g, "t.class"); // since type is dropped and its place taken by class
  content = content.replace(/__TEMP_T_CAT__/g, "t.category");
  
  // Also fix setTxCategory etc.
  content = content.replace(/txEntityCategory/g, "__TEMP_STATE_CAT__");
  content = content.replace(/setTxEntityCategory/g, "__TEMP_SET_CAT__");
  
  content = content.replace(/txSubcategory/g, "txSubClass");
  content = content.replace(/setTxSubcategory/g, "setTxSubClass");
  
  content = content.replace(/txCategory/g, "txClass"); 
  // Wait, if txCategory is txClass, then where do we save the new category? It's in __TEMP_STATE_CAT__.
  content = content.replace(/setTxCategory/g, "setTxClass");

  content = content.replace(/__TEMP_STATE_CAT__/g, "txCategory");
  content = content.replace(/__TEMP_SET_CAT__/g, "setTxCategory");

  // In App.jsx New Transaction state:
  // We need a new state: txSubCategory
  // Let's just do it manually in App.jsx.

  // In csvHelpers.js, the headers need updating.
  if (file.includes('csvHelpers.js')) {
    content = content.replace(/entity_category/g, "category");
    content = content.replace(/subcategory/g, "sub_class");
    content = content.replace(/category/g, "class"); // careful with the previous replace!
    // I will manually fix csvHelpers.js to be safe.
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
