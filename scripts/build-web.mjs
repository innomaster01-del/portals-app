// Builds www/ for the app: the page, a local copy of three.js and the fonts, so the app works offline.
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, rmSync } from 'node:fs';
const CDN = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
rmSync('www', { recursive: true, force: true });
mkdirSync('www/vendor', { recursive: true });
mkdirSync('www/fonts', { recursive: true });
let html = readFileSync('src/app.html', 'utf8');
if (!html.includes(CDN)) throw new Error('three.js import not found in src/app.html');
html = html.replace(CDN, './vendor/three.module.js');
for (const f of ['three.module.js', 'three.core.js']) {
  const from = `node_modules/three/build/${f}`;
  if (existsSync(from)) copyFileSync(from, `www/vendor/${f}`);
}
// fonts from @fontsource instead of Google Fonts
const faces = [['inter', 'Inter', [400, 500, 600, 700]], ['space-grotesk', 'Space Grotesk', [500, 600, 700]]];
let css = '';
for (const [pkg, family, weights] of faces) for (const w of weights) {
  const file = `${pkg}-latin-${w}-normal.woff2`, from = `node_modules/@fontsource/${pkg}/files/${file}`;
  if (!existsSync(from)) { console.warn('missing font', from); continue; }
  copyFileSync(from, `www/fonts/${file}`);
  css += `@font-face{font-family:'${family}';font-style:normal;font-weight:${w};font-display:swap;src:url(./fonts/${file}) format('woff2')}\n`;
}
if (css) {
  writeFileSync('www/fonts/fonts.css', css);
  html = html.replace(/<link[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>\s*/g, '').replace('</title>', '</title>\n<link rel="stylesheet" href="./fonts/fonts.css">');
}
for (const f of ['icon.png']) if (existsSync(`src/${f}`)) copyFileSync(`src/${f}`, `www/${f}`);
writeFileSync('www/index.html', html);
console.log('www/ ready', css ? '(fonts bundled)' : '(fonts from Google)');
