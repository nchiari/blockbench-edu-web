import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import JSZip from 'jszip';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const web = path.join(root, 'web');
const upstream = JSON.parse(await fs.readFile(path.join(web, 'upstream.json'), 'utf8'));
const cache = path.join(root, 'output', 'web-build', upstream.commit);
const source = path.join(cache, 'source');
const dist = path.join(web, 'dist');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
function run(command, args, cwd) {
  const result = spawnSync(command, args, {cwd, stdio: 'inherit', shell: command === 'npm.cmd'});
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
}
await fs.mkdir(cache, {recursive: true});
try { await fs.access(path.join(source, 'package.json')); }
catch {
  const response = await fetch(`https://codeload.github.com/${upstream.repository}/zip/${upstream.commit}`);
  if (!response.ok) throw new Error(`Upstream download failed: ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const zip = await JSZip.loadAsync(bytes);
  for (const entry of Object.values(zip.files)) {
    const relative = entry.name.split('/').slice(1).join('/');
    if (!relative || entry.dir) continue;
    const target = path.resolve(source, relative);
    if (!target.startsWith(source + path.sep)) throw new Error('Invalid archive path');
    await fs.mkdir(path.dirname(target), {recursive: true});
    await fs.writeFile(target, await entry.async('nodebuffer'));
  }
}
const pkg = JSON.parse(await fs.readFile(path.join(source, 'package.json'), 'utf8'));
if (pkg.version !== upstream.version) throw new Error('Unexpected upstream version');
try { await fs.access(path.join(source, 'node_modules', 'esbuild')); }
catch { run(npm, ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], source); }
// Host-specific guards: no persistent PWA cache or official-site telemetry.
// These replacements are idempotent and remain conditional on our web host.
for (const [file, replacements] of [
  ['js/boot_loader.js', [
    ["if ('serviceWorker' in navigator)", "if (!globalThis.BlockbenchEduWeb && 'serviceWorker' in navigator)"],
    ['if (Blockbench.startup_count == 1)', 'if (!globalThis.BlockbenchEduWeb && Blockbench.startup_count == 1)'],
    ['if (Blockbench.startup_count == 3)', 'if (!globalThis.BlockbenchEduWeb && Blockbench.startup_count == 3)']
  ]],
  ['js/plugin_loader.ts', [["$.getJSON('https://blckbn.ch/api/stats/plugins?weeks=2'", "if (!globalThis.BlockbenchEduWeb) $.getJSON('https://blckbn.ch/api/stats/plugins?weeks=2'"]]],
  ['js/interface/start_screen.ts', [["if (Blockbench.hasFlag('after_update') && data.new_version)", "if (!globalThis.BlockbenchEduWeb && Blockbench.hasFlag('after_update') && data.new_version)"]]]
]) {
  const filename = path.join(source, file);
  let code = await fs.readFile(filename, 'utf8');
  for (const [from, to] of replacements) if (!code.includes(to)) code = code.replace(from, to);
  await fs.writeFile(filename, code);
}
run(process.execPath, ['build.js', '--target=web'], source);

// Only reset the generated website, never the upstream checkout or project sources.
await fs.rm(dist, {recursive: true, force: true});
await fs.mkdir(dist, {recursive: true});
for (const name of ['assets', 'css', 'dist', 'lib', 'lang', 'font', 'icons', 'content', 'keymaps', 'themes']) {
  try { await fs.cp(path.join(source, name), path.join(dist, name), {recursive: true}); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
let html = await fs.readFile(path.join(source, 'index.html'), 'utf8');
html = html.replace('<title>Blockbench</title>', '<title>Blockbench Edu</title>');
html = html.replace('<html lang="en">', '<html lang="es">');
html = html.replace('<link rel="manifest" href="manifest.webmanifest">', '');
html = html.replace('</head>', '<link rel="stylesheet" href="edu-web.css">\n</head>');
html = html.replace('<body ', '<body class="edu-web-loading" ');
// Avoid duplicate class attributes in the upstream body.
html = html.replace('class="edu-web-loading" spellcheck="false" class="maximized"', 'spellcheck="false" class="maximized edu-web-loading"');
html = html.replace(/(<body[^>]*>)/, '$1\n<main id="edu-web-start"><section><div class="edu-web-mark" aria-hidden="true">◆</div><h1>Preparando tu editor…</h1><p>En un momento podrás empezar a crear.</p><button hidden>Comenzar</button></section><a href="credits.html" target="_blank" rel="noopener">Créditos, licencias y código fuente</a></main>\n<script src="edu-web.js"></script>');
await fs.writeFile(path.join(dist, 'index.html'), html);
for (const name of ['favicon.png', 'icon_full.png']) await fs.copyFile(path.join(source, name), path.join(dist, name));
for (const name of ['edu-web.js', 'edu-web.css', 'credits.html']) {
  await fs.copyFile(path.join(web, name), path.join(dist, name));
}
await fs.copyFile(path.join(root, 'blockbench_edu.js'), path.join(dist, 'blockbench_edu.js'));
await fs.copyFile(path.join(source, 'LICENSE.MD'), path.join(dist, 'BLOCKBENCH-LICENSE.txt'));
await fs.writeFile(path.join(dist, 'upstream.json'), JSON.stringify(upstream, null, 2));
await fs.writeFile(path.join(dist, '.nojekyll'), '');
console.log(`Built Blockbench Edu with Blockbench ${upstream.version} (${upstream.commit})`);
