const fs = require('fs');
const lines = fs.readFileSync('C:/Users/silva/.gemini/antigravity-ide/brain/b8c989af-0cff-4b4c-8248-aee98f012eb1/.system_generated/logs/transcript.jsonl', 'utf8').split('\n');

const replacements = [];

lines.forEach(l => {
  if(!l) return;
  try {
    const obj = JSON.parse(l);
    if(obj.tool_calls) {
      obj.tool_calls.forEach(tc => {
        const funcName = tc.name;
        if(funcName && (funcName.includes('replace_file_content') || funcName === 'write_to_file' || funcName === 'multi_replace_file_content')) {
          const args = typeof tc.args === 'string' ? JSON.parse(tc.args) : tc.args;
          if(args.TargetFile && args.TargetFile.includes('App.jsx')) {
            replacements.push({
              funcName,
              summary: args.toolSummary,
              args: args
            });
          }
        }
      });
    }
    
    // Also look for user explicit diffs
    if (obj.type === 'USER_INPUT' && obj.content.includes('The following changes were made by the USER to:')) {
      replacements.push({
        funcName: 'USER_DIFF',
        content: obj.content
      });
    }
  } catch(e) {}
});

fs.writeFileSync('app_jsx_history.json', JSON.stringify(replacements, null, 2));
console.log(`Found ${replacements.length} App.jsx modifications.`);
