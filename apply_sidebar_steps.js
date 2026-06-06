const fs = require('fs');

let content = fs.readFileSync('client/src/App.jsx', 'utf8').replace(/\r\n/g, '\n');

for (let i = 36; i <= 39; i++) {
  const args = require(`./step_${i}.json`);
  let target = JSON.parse(args.TargetContent).replace(/\r\n/g, '\n');
  let replacement = JSON.parse(args.ReplacementContent).replace(/\r\n/g, '\n');
  
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
