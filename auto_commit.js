const { execSync } = require('child_process');

try {
  console.log('Staging all changes...');
  execSync('git add .', { stdio: 'inherit' });

  const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  const commitMsg = `chore(auto-save): Routine commit at ${date}`;

  console.log(`Committing with message: "${commitMsg}"`);
  execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });

  console.log('\n✅ Successfully committed all changes!');
} catch (error) {
  console.log('\n⚠️ No changes to commit, or commit failed.');
}
