const fs = require('fs');

let content = fs.readFileSync('client/src/App.jsx', 'utf8');

// 1. Replace Top Entities
content = content.replace(
  /\{\/\* Top Entities Donut \*\/\}\s*<div className="bg-\[#faf4e5\]\/60[^>]+>[\s\S]*?\{renderTopEntitiesChart\(\)\}\s*<\/div>\s*<\/div>/,
  '<TopEntitiesChart entityVolumes={entityVolumes} percentUsed={percentUsed} t={t} />'
);

// 2. Replace Time Evolution
content = content.replace(
  /\{\/\* Spline Time Evolution \*\/\}\s*<div className="bg-\[#faf4e5\]\/60[^>]+>[\s\S]*?\{renderTimeEvolutionChart\(\)\}\s*<\/div>\s*<\/div>/,
  '<TimeEvolutionChart timePoints={timePoints} t={t} />'
);

// 3. Replace Flow By Category
content = content.replace(
  /\{\/\* Category Breakdown \(Diverging Bar Chart\) \*\/\}\s*<div className="bg-\[#faf4e5\]\/60[^>]+diverging-chart-container[\s\S]*?\{renderFlowByCategoryChart\(\)\}\s*<\/div>\s*<\/div>/,
  '<FlowByCategoryChart dashCategoryData={dashCategoryData} t={t} />'
);

// 4. Remove inline render functions
content = content.replace(/  const renderTopEntitiesChart = \(\) => \{[\s\S]*?\n  \};\n/g, '');
content = content.replace(/  const renderTimeEvolutionChart = \(\) => \{[\s\S]*?\n  \};\n/g, '');
content = content.replace(/  const renderFlowByCategoryChart = \(\) => \{[\s\S]*?\n  \};\n/g, '');

// 5. Remove CSV functions
content = content.replace(/  const handleExportCSV = \(\) => \{[\s\S]*?\n  \};\n/g, '');
content = content.replace(/  const parseCSV = \(text\) => \{[\s\S]*?\n  \};\n/g, '');
content = content.replace(/  const handleImportCSV = \(e\) => \{[\s\S]*?\n  \};\n/g, '');

// 6. Update CSV handlers in JSX
content = content.replace(/onClick=\{handleExportCSV\}/g, "onClick={() => handleExportCSV(transactions, t)}");
content = content.replace(/onChange=\{handleImportCSV\}/g, "onChange={(e) => handleImportCSV(e, { t, fromOptions, registerTransactions, GUEST_PROFILE_ID })}");

// 7. Remove states that moved
content = content.replace(/  const \[chartTimeHorizon, setChartTimeHorizon\] = useState\('all'\); \/\/ all, moon, cycles\s*\n  const \[chartGranularity, setChartGranularity\] = useState\('all'\); \/\/ all, Income, Expense, Savings\s*\n  const \[chartScaleMode, setChartScaleMode\] = useState\('absolute'\); \/\/ absolute, percentage\s*\n  const \[chartTooltip, setChartTooltip\] = useState\(null\); \/\/ \{ name, type, amount, percentage, x, y \}\s*\n/, '');
content = content.replace(/  const \[evolutionTooltip, setEvolutionTooltip\] = useState\(null\); \/\/ \{ label, income, expense, x, y \}\s*\n/, '');

// 8. Add Imports
if (!content.includes('import FlowByCategoryChart')) {
  content = content.replace("import Modal from './components/Modal';", 
`import Modal from './components/Modal';
import FlowByCategoryChart from './components/charts/FlowByCategoryChart';
import TimeEvolutionChart from './components/charts/TimeEvolutionChart';
import TopEntitiesChart from './components/charts/TopEntitiesChart';
import { handleExportCSV, handleImportCSV } from './utils/csvHelpers';`);
}

fs.writeFileSync('client/src/App.jsx', content);
console.log('App.jsx chart extraction successful');
