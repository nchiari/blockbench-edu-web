'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const vanilla = process.argv[2];
if (!vanilla || !fs.existsSync(path.join(vanilla, 'sounds.json'))) throw new Error('Pass the vanilla resource pack directory.');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'reference/wizard-catalog.json')));
const sounds = JSON.parse(fs.readFileSync(path.join(vanilla, 'sounds.json'))).entity_sounds.entities;
const spanish = Object.fromEntries(fs.readFileSync(path.join(vanilla, 'texts/es_ES.lang'), 'utf8').split(/\r?\n/).filter(line => line.includes('=')).map(line => {
    const separator = line.indexOf('='); return [line.slice(0, separator), line.slice(separator + 1).split('\t#')[0].trim()];
}));
const missing = [];
for (const [id, mob] of Object.entries(catalog)) {
    if (!mob.entity) continue;
    mob.name = spanish[`entity.${id}.name`] || ({basic: 'Criatura básica', vehicle: 'Vehículo'}[id]) || mob.name;
    const textures = JSON.parse(mob.entity)['minecraft:client_entity'].description.textures;
    for (const [alias, texturePath] of Object.entries(textures)) {
        if (mob.textures[alias]) continue;
        const basename = texturePath.split('/').pop();
        if (basename === '{name}' && mob.textures.default) { mob.textures[alias] = mob.textures.default; continue; }
        if (mob.textures[basename]) { mob.textures[alias] = mob.textures[basename]; continue; }
        const file = path.join(vanilla, texturePath + '.png');
        if (fs.existsSync(file)) mob.textures[alias] = 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
        else if (fs.existsSync(path.join(vanilla, texturePath + '.tga'))) {
            const png = execFileSync(process.env.EDU_PYTHON || 'python', ['-c',
                'from PIL import Image; import sys,io; image=Image.open(sys.argv[1]).convert("RGBA"); output=io.BytesIO(); image.save(output,format="PNG"); output.seek(0); assert Image.open(output).convert("RGBA").tobytes()==image.tobytes(); sys.stdout.buffer.write(output.getvalue())', path.join(vanilla, texturePath + '.tga')]);
            mob.textures[alias] = 'data:image/png;base64,' + png.toString('base64');
        }
        else missing.push({id, alias, texturePath});
    }
    if (!mob.textures.default) mob.textures.default = mob.textures[Object.keys(textures)[0]];
    mob.sounds = sounds[id];
}
const plugin = path.join(root, 'blockbench_edu.js');
const section = '// BEGIN EMBEDDED CATALOG\n    const CATALOG = ' + JSON.stringify(catalog) + ';\n    // END EMBEDDED CATALOG';
let source = fs.readFileSync(plugin, 'utf8');
const pattern = /\/\/ BEGIN EMBEDDED CATALOG\n[\s\S]*?\/\/ END EMBEDDED CATALOG/;
source = pattern.test(source) ? source.replace(pattern, () => section) : source.replace('    function integer(value)', section + '\n    function integer(value)');
fs.writeFileSync(plugin, source);
fs.writeFileSync(path.join(root, 'output/catalog-missing-textures.json'), JSON.stringify(missing, null, 2));
console.log(`Embedded ${Object.keys(catalog).length} entries; ${missing.length} unresolved texture references.`);
