const fs = require('fs');
let content = fs.readFileSync('client/src/App.jsx', 'utf8');

// 1. Replace Top Entities
content = content.replace(
/                            \{\/\* Top Entities Donut \*\/\}\r?\n                            <div className="bg-\[#faf4e5\]\/60 border border-\[#8b4513\]\/25 rounded-xl p-4 shadow-sm flex flex-col h-\[240px\]">\r?\n                              <h4 className="title-font text-\[11px\] font-black text-\[#4b2c20\] uppercase tracking-wider border-b border-\[#8b4513\]\/10 pb-1\.5 flex justify-between flex-shrink-0">\r?\n                                <span>\{t\.top_entities\}<\/span>\r?\n                                <span className="text-\[8px\] font-sans font-medium text-stone-500 normal-case">\{t\.by_gold_volume\}<\/span>\r?\n                              <\/h4>\r?\n                              <div className="flex-grow flex items-center justify-center mt-3 overflow-hidden">\r?\n                                \{renderTopEntitiesChart\(\)\}\r?\n                              <\/div>\r?\n                            <\/div>/,
'                            <TopEntitiesChart entityVolumes={entityVolumes} percentUsed={percentUsed} t={t} />'
);

// 2. Replace Time Evolution
content = content.replace(
/                            \{\/\* Spline Time Evolution \*\/\}\r?\n                            <div className="bg-\[#faf4e5\]\/60 border border-\[#8b4513\]\/25 rounded-xl p-4 shadow-sm flex flex-col h-\[340px\]">\r?\n                              <h4 className="title-font text-\[11px\] font-black text-\[#4b2c20\] uppercase tracking-wider border-b border-\[#8b4513\]\/10 pb-1\.5 flex justify-between flex-shrink-0">\r?\n                                <span>\{t\('time_evolution', 'Time Evolution'\)\}<\/span>\r?\n                                <span className="text-\[8px\] font-sans font-medium text-stone-500 normal-case">\{t\('evolution_spline_label', 'Income vs Expenses Spline'\)\}<\/span>\r?\n                              <\/h4>\r?\n                              <div className="flex-grow flex items-center justify-center mt-4">\r?\n                                \{renderTimeEvolutionChart\(\)\}\r?\n                              <\/div>\r?\n                            <\/div>/,
'                            <TimeEvolutionChart timePoints={timePoints} t={t} />'
);

// 3. Replace Flow By Category
content = content.replace(
/                            \{\/\* Flow by Category \(Vertical Column Chart\) \*\/\}\r?\n                            <div className="bg-\[#faf4e5\]\/60 border border-\[#8b4513\]\/25 rounded-xl p-4 shadow-sm flex flex-col h-\[340px\] diverging-chart-container relative select-none">[\s\S]*?<\/div> \/\* End Flow by Category \*\//,
'                            <FlowByCategoryChart dashCategoryData={dashCategoryData} t={t} />'
);

// 4. Remove renderTopEntitiesChart
content = content.replace(/  const renderTopEntitiesChart = \(\) => \{[\s\S]*?\n  \};\r?\n/, '');

// 5. Remove renderTimeEvolutionChart
content = content.replace(/  const renderTimeEvolutionChart = \(\) => \{[\s\S]*?\n  \};\r?\n/, '');

// 6. Remove renderFlowByCategoryChart
content = content.replace(/  const renderFlowByCategoryChart = \(\) => \{[\s\S]*?\n  \};\r?\n/, '');

// 7. Remove CSV functions
content = content.replace(/  const handleExportCSV = \(\) => \{[\s\S]*?\n  \};\r?\n/g, '');
content = content.replace(/  const parseCSV = \(text\) => \{[\s\S]*?\n  \};\r?\n/g, '');
content = content.replace(/  const handleImportCSV = \(e\) => \{[\s\S]*?\n  \};\r?\n/g, '');

// 8. Update onClick/onChange
content = content.replace(/onClick=\{handleExportCSV\}/g, "onClick={() => handleExportCSV(transactions, t)}");
content = content.replace(/onChange=\{handleImportCSV\}/g, "onChange={(e) => handleImportCSV(e, { t, fromOptions, registerTransactions, GUEST_PROFILE_ID })}");

// 9. Remove states
content = content.replace(/  const \[chartScaleMode, setChartScaleMode\] = useState\('absolute'\);\r?\n  const \[chartTooltip, setChartTooltip\] = useState\(null\); \/\/ \{ name, type, amount, percentage, x, y \}\r?\n/g, '');
content = content.replace(/  const \[evolutionTooltip, setEvolutionTooltip\] = useState\(null\); \/\/ \{ label, income, expense, x, y \}\r?\n/g, '');

// 10. Add imports
content = content.replace("import Modal from './components/Modal';", 
`import Modal from './components/Modal';
import FlowByCategoryChart from './components/charts/FlowByCategoryChart';
import TimeEvolutionChart from './components/charts/TimeEvolutionChart';
import TopEntitiesChart from './components/charts/TopEntitiesChart';
import { handleExportCSV, handleImportCSV } from './utils/csvHelpers';`);

fs.writeFileSync('client/src/App.jsx', content);
