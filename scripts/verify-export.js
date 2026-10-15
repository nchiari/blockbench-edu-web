'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const Zip = require('jszip');
const core = require('../blockbench_edu');
(async () => {
    const original = await core.readAddon(fs.readFileSync('reference/cerdo_edu.mcaddon'), Zip);
    const report = [];
    for (const patch of [1, 2]) {
        const output = await core.readAddon(fs.readFileSync(`output/cerdo_edu_prueba_1_0_${patch}.mcaddon`), Zip);
        for (const [pack, other] of [[output.bp, output.rp], [output.rp, output.bp]]) {
            assert.deepEqual(pack.manifest.header.version, [1, 0, patch]);
            assert.ok(pack.manifest.dependencies.some(d => d.uuid === other.manifest.header.uuid && JSON.stringify(d.version) === JSON.stringify([1, 0, patch])));
            assert.deepEqual(pack.manifest.header.min_engine_version, [1, 16, 0]);
        }
        const originalHead = original.geometry.bones.find(b => b.name === 'head').cubes[0];
        const head = output.geometry.bones.find(b => b.name === 'head').cubes[0];
        assert.deepEqual(head.size, [12, 8, 8]);
        assert.deepEqual(head.origin.map((v, i) => v + head.size[i] / 2), originalHead.origin.map((v, i) => v + originalHead.size[i] / 2));
        const changed = [];
        assert.deepEqual(Object.keys(original.root.files).sort(), Object.keys(output.root.files).sort());
        for (const name of Object.keys(original.root.files)) {
            if (original.root.files[name].dir) continue;
            const a = await original.root.file(name).async('nodebuffer'), b = await output.root.file(name).async('nodebuffer');
            if (!a.equals(b)) changed.push(name);
        }
        const expected = [original.bp.path, original.rp.path, original.path,
            ...new Set(Object.values(original.entity.description.textures).map(t => original.rp.prefix + t + '.png'))];
        assert.deepEqual(changed.sort(), expected.sort());
        for (const name of expected.filter(n => n.endsWith('.png'))) {
            const png = await output.root.file(name).async('nodebuffer');
            assert.equal(png.readUInt32BE(16), output.geometry.description.texture_width);
            assert.equal(png.readUInt32BE(20), output.geometry.description.texture_height);
        }
        report.push({version: output.bp.manifest.header.version, head: head.size,
            texture: [output.geometry.description.texture_width, output.geometry.description.texture_height], changed});
    }
    console.log(JSON.stringify({passed: true, exports: report}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
