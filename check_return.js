const fs = require('fs');
const content = fs.readFileSync('client/src/App.jsx', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === 'return (' && lines[i+1].includes('className="relative')) {
    console.log(lines.slice(i, i+30).join('\n'));
    break;
  }
}
