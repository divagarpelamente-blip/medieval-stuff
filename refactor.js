const fs = require('fs');

let lines = fs.readFileSync('client/src/App.jsx', 'utf8').split('\n');

// Replacements from bottom to top so line numbers don't shift!

// 1. TopEntities container (lines 2243-2250, i.e. indices 2242-2249) -> 8 lines
lines.splice(2242, 8, '                            <TopEntitiesChart entityVolumes={entityVolumes} percentUsed={percentUsed} t={t} />');

// 2. TimeEvolution container (lines 2198-2207, i.e. indices 2197-2206) -> 10 lines
lines.splice(2197, 10, '                            <TimeEvolutionChart timePoints={timePoints} t={t} />');

// 3. FlowByCategory container (lines 2146-2196, i.e. indices 2145-2195) -> 51 lines
lines.splice(2145, 51, '                            <FlowByCategoryChart dashCategoryData={dashCategoryData} t={t} />');

// 4. renderTopEntitiesChart (lines 1097-1191, i.e. indices 1096-1190) -> 95 lines
lines.splice(1096, 95);

// 5. renderTimeEvolutionChart (lines 884-1095, i.e. indices 883-1094) -> 212 lines
lines.splice(883, 212);

// 6. renderFlowByCategoryChart (lines 777-882, i.e. indices 776-881) -> 106 lines
lines.splice(776, 106);

// 7. CSV Functions (lines 531-698, i.e. indices 530-697) -> 168 lines
lines.splice(530, 168);

// 8. Update onClick/onChange for CSV (we do this globally)
let content = lines.join('\n');
content = content.replace(/onClick=\{handleExportCSV\}/g, "onClick={() => handleExportCSV(transactions, t)}");
content = content.replace(/onChange=\{handleImportCSV\}/g, "onChange={(e) => handleImportCSV(e, { t, fromOptions, registerTransactions, GUEST_PROFILE_ID })}");

// 9. Remove states (lines 41-46)
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
console.log('App.jsx refactored successfully.');
