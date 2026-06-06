const fs = require('fs');
let c = fs.readFileSync('client/index.html', 'utf8');
if (!c.includes('window.onerror')) {
  c = c.replace('<head>', '<head><script>window.onerror = function(m, u, l, col, e) { console.log("REACT CRASH: " + m); };</script>');
  fs.writeFileSync('client/index.html', c);
}
