// Builds www/ for the app: the page plus a local copy of three.js, so the app does not depend on a CDN.
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, rmSync } from 'node:fs';
const CDN = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
rmSync('www', { recursive: true, force: true });
mkdirSync('www/vendor', { recursive: true });
let html = readFileSync('src/app.html', 'utf8');
if (!html.includes(CDN)) throw new Error('three.js import not found in src/app.html');
html = html.replace(CDN, './vendor/three.module.js');
writeFileSync('www/index.html', html);
for (const f of ['three.module.js', 'three.core.js']) {
  const from = `node_modules/three/build/${f}`;
  if (existsSync(from)) copyFileSync(from, `www/vendor/${f}`);
}
console.log('www/ ready');
