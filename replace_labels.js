const fs = require('fs');
let code = fs.readFileSync('client/src/App.jsx', 'utf8');

code = code.replace(/>Class Income</g, '>Total income<');
code = code.replace(/>Class Expense</g, '>Total expenses<');
code = code.replace(/>Class Net Balance</g, '>Net cash balance<');
code = code.replace(/>Class Efficiency</g, '>Savings efficiency<');
code = code.replace(/'Class Income'/g, "'Total income'");
code = code.replace(/'Class Expense'/g, "'Total expenses'");
code = code.replace(/'Class Net Balance'/g, "'Net cash balance'");

fs.writeFileSync('client/src/App.jsx', code);
console.log('App.jsx labels updated');

let chartCode = fs.readFileSync('client/src/components/charts/TimeEvolutionChart.jsx', 'utf8');
chartCode = chartCode.replace(/Class Income/g, 'Total income');
chartCode = chartCode.replace(/Class Expense/g, 'Total expenses');
fs.writeFileSync('client/src/components/charts/TimeEvolutionChart.jsx', chartCode);
console.log('TimeEvolutionChart.jsx labels updated');
