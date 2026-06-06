const fs = require('fs');
let content = fs.readFileSync('client/src/App.jsx', 'utf8');

const timePointsLogic = `
  const timePoints = [...dashboardFilteredTransactions].reverse().reduce((acc, tx) => {
    const existing = acc.find(p => p.label === tx.month);
    if (existing) {
      if (tx.type === 'income') existing.income += Number(tx.amount);
      if (tx.type === 'expense') existing.expense += Number(tx.amount);
    } else {
      acc.push({
        label: tx.month,
        income: tx.type === 'income' ? Number(tx.amount) : 0,
        expense: tx.type === 'expense' ? Number(tx.amount) : 0,
      });
    }
    return acc;
  }, []);
`;

if (!content.includes('const timePoints =')) {
  content = content.replace('const dashCategoryData', timePointsLogic + '\n  const dashCategoryData');
}

// Remove the `timePoints={[]}` hack
content = content.replace(/timePoints=\{\[\]\}/g, 'timePoints={timePoints}');

fs.writeFileSync('client/src/App.jsx', content);
