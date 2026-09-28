import {build} from 'esbuild';
import {readFile, writeFile, mkdir, cp} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {ANIMAL_IDS} from '../src/demos/trex/species-data.js';

process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const base = 'src/demos/trex/';
const dataURL = async (path, mime) => `data:${mime};base64,${(await readFile(path)).toString('base64')}`;
const tag = (id, content, type = 'application/octet-stream') => `<script type="${type}" id="${id}">${content}</script>`;
const [bundle, template, style, layout, trex] = await Promise.all([
  build({entryPoints: [base + 'viewer.js'], bundle: true, minify: true, format: 'iife', write: false}),
  readFile(base + 'index.html', 'utf8'), readFile(base + 'style.css', 'utf8'),
  readFile(base + 'layout.css', 'utf8'), readFile('model3d/trex-demo/model.json'),
]);
const previews = {};
for (const id of ['trex', 'stego', 'trice', 'ptero', 'mosa', 'deino', ...ANIMAL_IDS]) {
  previews[id] = {still: await dataURL(base + `previews/${id}.png`, 'image/png'), motions: [1,2,3].map(n => `previews/${id}-${n}.mp4`)};
  for (const path of previews[id].motions) await readFile(path); // Fail if the deploy would contain broken previews.
}
let extras = tag('preview-data', JSON.stringify(previews), 'application/json');
for (const [id, path] of Object.entries({
  pterosaur: 'pterosaur-demo/Pteradactal-1024.glb', stego: 'stegosaurus-demo/model.glb',
  mosa: 'mosasaurus-demo/model-1024.glb', trice: 'triceratops-demo/model.glb', deino: 'deinonychus-demo/Deinonychus-Rigged.glb',
})) extras += tag(id + '-data', (await readFile('model3d/' + path)).toString('base64'));
const models = JSON.parse(await readFile('model3d/animal-demo/animals.json', 'utf8'));
const textures = {};
for (const model of Object.values(models)) for (const material of model.materials) for (const path of Object.values(material.maps)) {
  textures[path] ??= await dataURL('model3d/animal-demo/' + path, 'image/png');
}
extras += tag('animal-data', gzipSync(Buffer.from(JSON.stringify({models, textures})), {level: 9}).toString('base64'));
const trexTextures = {
  diffuse: await dataURL('model3d/trex-demo/diffuse.jpeg', 'image/jpeg'),
  normal: await dataURL('model3d/trex-demo/normal.jpeg', 'image/jpeg'),
};
const output = template
  .replace(/<title>.*?<\/title>/, '<title>Creature Lab · Khủng long & Động vật</title>')
  .replace('/* INLINE_CSS */', () => style + '\n' + layout)
  .replace('__MODEL__', () => gzipSync(trex, {level: 9}).toString('base64'))
  .replace('__TEXTURES__', () => JSON.stringify(trexTextures))
  .replace('<script>/* INLINE_JS */</script>', () => extras + '<script>' + bundle.outputFiles[0].text.replaceAll('</script', '<\\/script') + '</script>');
await mkdir('dist', {recursive: true});
await writeFile('dist/index.html', output);
await cp('previews', 'dist/previews', {recursive: true});
console.log(`Built dist/index.html (${(Buffer.byteLength(output)/1048576).toFixed(2)} MiB), with 36 MP4 previews.`);
