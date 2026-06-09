const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const outputDir = path.join(rootDir, 'public');

// Credentials are now Worker secrets (set via `wrangler secret put` or the
// Cloudflare dashboard). The build step no longer needs them.

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const file of ['index.html', 'style.css', 'app.js', 'config.js', 'LICENSE']) {
  fs.copyFileSync(path.join(rootDir, file), path.join(outputDir, file));
}

fs.cpSync(path.join(rootDir, 'assets'), path.join(outputDir, 'assets'), { recursive: true });

console.log('Static site generated in public/.');
