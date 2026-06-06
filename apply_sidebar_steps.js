const fs = require('fs');

let content = fs.readFileSync('client/src/App.jsx', 'utf8').replace(/\r\n/g, '\n');

for (let i = 36; i <= 39; i++) {
  const args = require(`./step_${i}.json`);
  let target = args.TargetContent;
  let replacement = args.ReplacementContent;
  
  if (typeof target === 'string' && target.startsWith('"')) {
    try {
      // escape raw newlines or tabs before JSON parse
      let safeStr = target.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
      target = JSON.parse(safeStr);
    } catch(e) { console.log('target parse fail', e.message); }
  }
  if (typeof replacement === 'string' && replacement.startsWith('"')) {
    try {
      let safeStr = replacement.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
      replacement = JSON.parse(safeStr);
    } catch(e) { console.log('repl parse fail', e.message); }
  }
  
  target = target.replace(/\r\n/g, '\n').replace(/\\\\n/g, '\\n');
  replacement = replacement.replace(/\r\n/g, '\n').replace(/\\\\n/g, '\\n');
  
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log(`Step ${i} applied successfully.`);
  } else {
    let trimmedTarget = target.trim();
    if (content.includes(trimmedTarget)) {
      content = content.replace(trimmedTarget, replacement.trim());
      console.log(`Step ${i} applied (trimmed) successfully.`);
    } else {
      console.log(`Step ${i} FAILED: Target not found.`);
      let regexTarget = target.split('\n').map(l => l.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*\\n\\s*');
      let match = content.match(new RegExp(regexTarget));
      if (match) {
        content = content.replace(match[0], replacement);
        console.log(`Step ${i} applied (regex) successfully.`);
      }
    }
  }
}

fs.writeFileSync('client/src/App.jsx', content);
