'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pluginPath = path.join(root, 'blockbench_edu.js');
const starter = {
    project: JSON.parse(fs.readFileSync(path.join(root, 'reference/cerdo_edu.bbmodel'), 'utf8')),
    addon: fs.readFileSync(path.join(root, 'reference/cerdo_edu.mcaddon')).toString('base64')
};
const source = fs.readFileSync(pluginPath, 'utf8');
const section = /\/\/ BEGIN EMBEDDED STARTER[^\n]*\n[\s\S]*?\/\/ END EMBEDDED STARTER/;
if (!section.test(source)) throw new Error('Starter markers missing');
fs.writeFileSync(pluginPath, source.replace(section, () =>
    '// BEGIN EMBEDDED STARTER (updated by scripts/embed-starter.js)\n    const STARTER = ' + JSON.stringify(starter) + ';\n    // END EMBEDDED STARTER'));
console.log('Starter embedded in standalone plugin.');
