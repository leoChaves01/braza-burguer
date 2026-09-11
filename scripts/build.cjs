const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const root = path.resolve(__dirname, '../public');
const htmlPath = path.join(root, 'index.html');
const cssPath = path.join(root, 'assets/css/styles.css');
const mainPath = path.join(root, 'assets/js/main.js');
const scenePath = path.join(root, 'assets/js/scene.mjs');
const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const main = fs.readFileSync(mainPath, 'utf8');
const scene = fs.readFileSync(scenePath, 'utf8');

function checkReference(reference, directory) {
  if (/^(https?:|data:|#)/.test(reference)) return;
  const destination = path.resolve(directory, reference.split('?')[0]);
  if (!destination.startsWith(root + path.sep) || !fs.existsSync(destination)) {
    throw new Error('Arquivo ausente ou caminho inválido: ' + reference);
  }
}

for (const file of [mainPath, scenePath]) {
  cp.execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}
for (const [, ref] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) checkReference(ref, root);
for (const [, ref] of css.matchAll(/url\(['"]?([^)'" ]+)/g)) checkReference(ref, path.dirname(cssPath));
for (const [, ref] of scene.matchAll(/load\('([^']+)'\)/g)) checkReference(ref, root);
for (const [, ref] of scene.matchAll(/from '([^']+)'/g)) checkReference(ref, path.dirname(scenePath));
for (const [, ref] of main.matchAll(/import\('([^']+)'\)/g)) checkReference(ref, path.dirname(mainPath));
checkReference('assets/vendor/three.core.min.js', root);

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('ID duplicado no HTML.');
for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
  if (!ids.includes(id)) throw new Error('Destino de navegação ausente: ' + id);
}
console.log('Arquivos, JavaScript, imagens e navegação verificados. Pasta pronta: public/');
