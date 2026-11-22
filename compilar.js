// Genera index.html (lo que abre el navegador) a partir de fuente.html (la versión legible).
// Los cambios se hacen SIEMPRE en fuente.html; después: node compilar.js
// Requiere: npm i @babel/standalone
const B = require('@babel/standalone'), fs = require('fs');
const src = fs.readFileSync(__dirname + '/fuente.html', 'utf8');
const m = src.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);
if (!m) throw new Error('No encontré el bloque <script type="text/babel"> en fuente.html');
const js = B.transform(m[1], { presets: ['react'], compact: true, comments: false }).code.replace(/<\/script/gi, '<\\/script');
let out = src.replace(m[0], () => '<script>\n' + js + '\n</script>');
out = out.replace(/<script[^>]*babel-standalone[^>]*><\/script>\s*/g, '');
out = out.replace('<head>', '<head>\n<!-- ARCHIVO GENERADO: no editar. Editar fuente.html y correr "node compilar.js" -->');
fs.writeFileSync(__dirname + '/index.html', out);
console.log('index.html generado', out.length, 'bytes');
