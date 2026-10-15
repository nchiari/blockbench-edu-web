'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Zip = require('jszip');
const core = require('../blockbench_edu.js');
test('bone order and inherited inflate compare by effective geometry', () => {
    const a = {bones:[{name:'body',inflate:-0.02,cubes:[{origin:[0,0,0],size:[2,3,4],uv:[0,0]}]},{name:'arm',parent:'body',pivot:[1,0,0]}]};
    const b = JSON.parse(JSON.stringify(a));
    b.bones[0].cubes[0].inflate = -0.02; delete b.bones[0].inflate;
    b.bones.reverse();
    assert.equal(core.signature(a),core.signature(b));
    b.bones[1].cubes[0].inflate = 0;
    assert.notEqual(core.signature(a),core.signature(b));
});
test('reference signature tolerates floating point residue and omitted zero rotations only', () => {
    const original = {bones:[{name:'piece',cubes:[{origin:[0.1,0,0],size:[2,3,4],uv:[0,0],pivot:[1,2,3],rotation:[0,0,0]}]}]};
    const roundTrip = JSON.parse(JSON.stringify(original));
    roundTrip.bones[0].cubes[0].origin[0] = 0.10000000000000009;
    delete roundTrip.bones[0].cubes[0].rotation; delete roundTrip.bones[0].cubes[0].pivot;
    assert.equal(core.signature(original), core.signature(roundTrip));
    roundTrip.bones[0].cubes[0].origin[0] += 0.001;
    assert.notEqual(core.signature(original), core.signature(roundTrip));
});
test('creeper charged geometry follows edited geometry with its own identifier', async () => {
    const mob = require('../reference/wizard-catalog.json').creeper;
    const starter = await core.createMobAddon(mob, {}, Zip, require('node:crypto').randomUUID);
    const ref = await core.readAddon(starter.addon, Zip);
    assert.equal(ref.linkedGeometryIds.length, 2);
    assert.equal(ref.entity.description.geometry.charged, ref.geometryId + '.charged');
    const edited = JSON.parse(JSON.stringify(ref.geometry));
    edited.bones[0].cubes[0].size[0] += 1;
    const result = await core.buildAddon(ref, {format_version:'1.12.0', 'minecraft:geometry':[edited]}, mob.textures.default.split(',')[1], Zip);
    const json = JSON.parse(await result.zip.file(ref.path).async('string'));
    assert.equal(json['minecraft:geometry'].length, 2);
    assert.equal(json['minecraft:geometry'][1].description.identifier, ref.geometryId + '.charged');
    assert.deepEqual(json['minecraft:geometry'][1].bones, edited.bones);
});
test('Wizard catalog generation preserves cow geometry, behavior, animation and independent pack identities', async () => {
    const catalog = require('../reference/wizard-catalog.json');
    const {randomUUID} = require('node:crypto');
    const first = await core.createMobAddon(catalog.cow, {name: 'Mi vaca'}, Zip, randomUUID);
    const second = await core.createMobAddon(catalog.cow, {name: 'Otra vaca'}, Zip, randomUUID);
    const ref = await core.readAddon(first.addon, Zip);
    const other = await core.readAddon(second.addon, Zip);
    assert.notEqual(first.identifier, second.identifier);
    assert.notEqual(ref.bp.manifest.header.uuid, other.bp.manifest.header.uuid);
    assert.equal(ref.bp.manifest.dependencies[0].uuid, ref.rp.manifest.header.uuid);
    assert.equal(ref.rp.manifest.dependencies[0].uuid, ref.bp.manifest.header.uuid);
    const stem = first.identifier.split(':')[1];
    const original = text => JSON.parse(text.replace(/\{name\}/g, stem).replace(/\{identifier\}/g, first.identifier));
    assert.deepEqual(first.geometry, original(catalog.cow.model));
    assert.deepEqual(JSON.parse(await ref.root.file(`BP/entities/${stem}.behavior.json`).async('string')), original(catalog.cow.behavior));
    assert.deepEqual(JSON.parse(await ref.root.file(`RP/animations/${stem}.animation.json`).async('string')), original(catalog.cow.animations));
    assert.equal(await ref.root.file(ref.texturePath).async('base64'), catalog.cow.textures.default.split(',')[1]);
    assert.match(await ref.root.file('RP/texts/es_ES.lang').async('string'), /Mi vaca/);
});
function image(width, height) {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        data.set([x * 13, y * 17, x + y, (x + y) % 2 ? 87 : 255], (y * width + x) * 4);
    }
    return {width, height, data};
}
function pixel(img, x, y) { return Array.from(img.data.slice((y * img.width + x) * 4, (y * img.width + x + 1) * 4)); }
test('density preparation samples nearest RGBA and preserves already matching regions', () => {
    const source = image(4,3);
    assert.deepEqual(core.sampleRegion(source,[1,0,3,2],2,2),core.extractPixels(source,[1,0,3,2]));
    const scaled = core.sampleRegion(source,[0,0,2,1],4,2);
    for(let y=0;y<2;y++) for(let x=0;x<4;x++) assert.deepEqual(pixel(scaled,x,y),pixel(source,Math.floor(x/2),0));
    const reduced = core.sampleRegion(source,[0,0,4,2],2,1);
    assert.deepEqual(pixel(reduced,0,0),pixel(source,1,1));
    assert.deepEqual(pixel(reduced,1,0),pixel(source,3,1));
});
test('plane edges seed nearest existing texel and preserve visible face pixels', () => {
    const source = image(4,3);
    assert.deepEqual(core.extractSurface(source, [1,0,3,2]), core.extractPixels(source, [1,0,3,2]));
    const edge = core.extractSurface(source, [4,0,4,3]);
    assert.equal(edge.width, 1); assert.equal(edge.height, 3);
    for (let y=0; y<3; y++) assert.deepEqual(pixel(edge,0,y), pixel(source,3,y));
    const corner = core.extractSurface(source, [4,3,4,3]);
    assert.deepEqual(pixel(corner,0,0), pixel(source,3,2));
    const outside = core.extractSurface(source, [4,0,4,-6]);
    assert.equal(outside.height, 6);
    for (let y=0; y<6; y++) assert.deepEqual(pixel(outside,0,y),pixel(source,3,0));
    assert.deepEqual(core.centeredBounds([0,0,0],[2,0,4],1,1), {from:[0,-0.5,0],to:[2,0.5,4]});
});
test('growth copies exact colors/alpha and nearest corners without interpolation', () => {
    const source = image(4, 3), grown = core.resizePixels(source, 8, 7);
    for (let y = 0; y < 7; y++) for (let x = 0; x < 8; x++) {
        assert.deepEqual(pixel(grown, x, y), pixel(source, Math.max(0, Math.min(3, x - 2)), Math.max(0, Math.min(2, y - 2))));
    }
});
test('odd changes put extra margin/crop at positive UV end including mirrored faces', () => {
    const source = image(4, 3);
    const grown = core.resizePixels(source, 5, 3);
    for (let x = 0; x < 4; x++) assert.deepEqual(pixel(grown, x, 0), pixel(source, x, 0));
    assert.deepEqual(pixel(grown, 4, 0), pixel(source, 3, 0));
    const cropped = core.resizePixels(source, 3, 3);
    assert.deepEqual(pixel(cropped, 0, 0), pixel(source, 0, 0));
    const mirrored = core.resizePixels(source, 3, 3, [-1, 1]);
    assert.deepEqual(pixel(mirrored, 0, 0), pixel(source, 1, 0));
});
test('crop then manual growth extends current edge instead of resurrecting paint', () => {
    const source = image(4, 3);
    const back = core.resizePixels(core.resizePixels(source, 2, 1), 4, 3);
    assert.notDeepEqual(back.data, source.data);
    assert.deepEqual(pixel(back, 0, 0), pixel(source, 1, 1));
    assert.deepEqual(source, image(4, 3)); // source snapshots were never mutated
});
test('UV extraction retains ascending bitmap and supports negative UV directions', () => {
    const atlas = image(8, 8);
    const face = core.extractPixels(atlas, [5, 6, 2, 2]);
    assert.equal(face.width, 3); assert.equal(face.height, 4);
    assert.deepEqual(pixel(face, 0, 0), pixel(atlas, 2, 2));
    assert.throws(() => core.extractPixels(atlas, [0, 0, 9, 2]));
    assert.throws(() => core.extractPixels(atlas, [0.5, 0, 2, 2]));
});
test('packing is deterministic, exact, nonoverlapping, and has transparent gutters', () => {
    const faces = Array.from({length: 42}, (_, i) => ({cubeId: String(i), name: 'north', pixels: image(i % 9 + 1, i % 5 + 1)}));
    const packed = core.packFaces(faces), occupancy = new Set();
    assert.deepEqual(packed, core.packFaces(faces));
    for (const face of packed.placements) {
        for (let y = 0; y < face.pixels.height; y++) for (let x = 0; x < face.pixels.width; x++) {
            const key = (face.y + y) * packed.width + face.x + x;
            assert.equal(occupancy.has(key), false); occupancy.add(key);
            assert.deepEqual(pixel(packed, face.x + x, face.y + y), pixel(face.pixels, x, y));
        }
    }
    for (let i = 0; i < packed.width * packed.height; i++) if (!occupancy.has(i)) assert.equal(packed.data[i * 4 + 3], 0);
    const small = core.packFaces([{pixels: image(3, 3)}]);
    assert.deepEqual([small.width, small.height], [3, 3]);
});
test('one total pixel preserves center and changes only the selected axis', () => {
    for (const axis of [0, 1, 2]) {
        const from = [-4, 8, -14], to = [4, 16, -6];
        const result = core.centeredBounds(from, to, axis, 1);
        for (let a = 0; a < 3; a++) {
            assert.equal(result.from[a] + result.to[a], from[a] + to[a]);
            assert.equal(result.to[a] - result.from[a], 8 + (a === axis ? 1 : 0));
        }
        assert.deepEqual(core.centeredBounds(result.from, result.to, axis, -1), {from, to});
    }
});
test('reference signature detects changed UVs, mirrors and bone rotations', () => {
    const geometry = {bones: [{name: 'head', cubes: [{origin: [0, 0, 0], size: [8, 8, 8], uv: [0, 0]}]}]};
    for (const change of [g => { g.bones[0].cubes[0].uv = [1, 0]; }, g => { g.bones[0].mirror = true; },
        g => { g.bones[0].rotation = [0, 90, 0]; }]) {
        const other = structuredClone(geometry); change(other);
        assert.notEqual(core.signature(geometry), core.signature(other));
    }
});
test('manifests preserve engine/schema/UUID, synchronize dependencies and advance versions', () => {
    const bp = {format_version: 2, header: {uuid: 'bp', version: [1, 0, 2], min_engine_version: [1, 16, 0]}, modules: [{type: 'data', version: [1, 0, 0]}], dependencies: [{uuid: 'unrelated', version: [1, 0, 0]}]};
    const rp = {format_version: 2, header: {uuid: 'rp', version: [1, 1, 0]}, modules: [{type: 'resources', version: [1, 0, 0]}]};
    const result = core.syncManifests(bp, rp);
    assert.deepEqual(result.version, [1, 1, 1]);
    assert.deepEqual(result.bp.dependencies, [{uuid: 'unrelated', version: [1, 0, 0]}, {uuid: 'rp', version: [1, 1, 1]}]);
    assert.deepEqual(result.rp.dependencies, [{uuid: 'bp', version: [1, 1, 1]}]);
    assert.deepEqual(result.bp.header.min_engine_version, [1, 16, 0]);
    assert.deepEqual(core.syncManifests(bp, rp, result.version).version, [1, 1, 2]);
    assert.deepEqual(bp.header.version, [1, 0, 2]);
});
async function fixture(nested) {
    const root = new Zip(), rp = nested ? new Zip() : root, bp = nested ? new Zip() : root;
    const r = nested ? '' : 'any resource folder/', b = nested ? '' : 'different behavior folder/';
    const geom = {'format_version': '1.12.0', 'minecraft:geometry': [{description: {identifier: 'geometry.test', texture_width: 8, texture_height: 8}, bones: []}]};
    rp.file(r + 'manifest.json', JSON.stringify({header: {uuid: 'rp', version: [1, 0, 0]}, modules: [{type: 'resources', version: [1, 0, 0]}]}));
    bp.file(b + 'manifest.json', JSON.stringify({header: {uuid: 'bp', version: [1, 0, 0]}, modules: [{type: 'data', version: [1, 0, 0]}]}));
    rp.file(r + 'entity/pig.json', JSON.stringify({'minecraft:client_entity': {description: {identifier: 'edu:pig', geometry: {default: 'geometry.test'}, textures: {default: 'textures/entity/custom'}}}}));
    rp.file(r + 'models/entity/unusual_name.json', JSON.stringify(geom));
    rp.file(r + 'textures/entity/custom.png', 'original');
    bp.file(b + 'entities/pig.json', 'unchanged behavior');
    rp.file(r + 'animations/pig.json', 'unchanged animation');
    if (nested) { root.file('one.mcpack', await bp.generateAsync({type: 'uint8array'})); root.file('two.mcpack', await rp.generateAsync({type: 'uint8array'})); }
    return {input: await root.generateAsync({type: 'uint8array'}), geom};
}
for (const nested of [false, true]) test(`addon round trip (${nested ? 'nested packs' : 'arbitrary folders'}) replaces only intended resources`, async () => {
    const {input, geom} = await fixture(nested), reference = await core.readAddon(input, Zip);
    geom['minecraft:geometry'][0].description.texture_width = 19;
    const auxiliaryPath = reference.rp.prefix + 'textures/entity/secondary.png';
    const result = await core.buildAddon(reference, geom, Buffer.from('new png').toString('base64'), Zip,
        {[auxiliaryPath]: Buffer.from('remapped alternate').toString('base64')});
    const reread = await core.readAddon(await result.zip.generateAsync({type: 'uint8array'}), Zip);
    assert.equal(reread.geometry.description.texture_width, 19);
    assert.equal(await reread.rp.zip.file(reread.texturePath).async('string'), 'new png');
    assert.equal(await reread.rp.zip.file(auxiliaryPath).async('string'), 'remapped alternate');
    assert.equal(await reread.bp.zip.file(reread.bp.prefix + 'entities/pig.json').async('string'), 'unchanged behavior');
    assert.equal(await reread.rp.zip.file(reread.rp.prefix + 'animations/pig.json').async('string'), 'unchanged animation');
    assert.deepEqual(result.version, [1, 0, 1]);
    assert.equal(await reference.rp.zip.file(reference.texturePath).async('string'), 'original');
    const wrong = structuredClone(geom); wrong['minecraft:geometry'][0].description.identifier = 'geometry.wrong';
    await assert.rejects(core.buildAddon(reference, wrong, '', Zip), /identificador/);
});
test('real Wizard reference can be resolved by JSON references', async () => {
    const file = path.join(__dirname, '../reference/cerdo_edu.mcaddon');
    assert.equal(fs.existsSync(file), true, 'Wizard reference must be prepared');
    const reference = await core.readAddon(fs.readFileSync(file), Zip);
    assert.equal(reference.entity.description.identifier, 'blockbench_edu:cerdo');
    assert.ok(reference.geometry.bones.some(b => b.name === 'head'));
    assert.ok(reference.geometry.bones.some(b => b.name === 'body'));
});
test('wizard creates self-contained projects with independent identities and matching geometry', async () => {
    const starter = {project: JSON.parse(fs.readFileSync(path.join(__dirname, '../reference/cerdo_edu.bbmodel'), 'utf8')),
        addon: fs.readFileSync(path.join(__dirname, '../reference/cerdo_edu.mcaddon')).toString('base64')};
    const {randomUUID} = require('node:crypto');
    const a = await core.createStarter(starter, Zip, randomUUID), b = await core.createStarter(starter, Zip, randomUUID);
    const ar = await core.readAddon(a.addon, Zip), br = await core.readAddon(b.addon, Zip);
    assert.notEqual(ar.bp.manifest.header.uuid, br.bp.manifest.header.uuid);
    assert.notEqual(ar.rp.manifest.header.uuid, br.rp.manifest.header.uuid);
    assert.notEqual(ar.entity.description.identifier, br.entity.description.identifier);
    assert.equal(ar.geometryId, 'geometry.' + a.project.model_identifier);
    for (const texture of Object.values(ar.entity.description.textures)) assert.ok(ar.rp.zip.file(ar.rp.prefix + texture + '.png'));
    assert.equal(ar.bp.manifest.dependencies[0].uuid, ar.rp.manifest.header.uuid);
    assert.equal(ar.rp.manifest.dependencies[0].uuid, ar.bp.manifest.header.uuid);
    assert.equal(starter.project.model_identifier, 'cerdo');
});

test('sound variants only query properties synchronized by the actor; pack icons are included', async () => {
    const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'../blockbench_edu.js'),'utf8').match(/const CATALOG = (.*);/)[1]);
    const source=catalog.pig.sounds;
    const behavior=JSON.parse(catalog.pig.behavior);
    const fixed=core.compatibleSounds(source,behavior);
    assert.equal(fixed.variants,undefined);
    assert.deepEqual(fixed.events,source.events);
    assert.ok(source.variants);
    behavior['minecraft:entity'].description.properties={'minecraft:sound_variant':{type:'enum',values:['default'],default:'default',client_sync:true}};
    assert.deepEqual(core.compatibleSounds(source,behavior),source);
    const addon=await core.createMobAddon(catalog.pig,{},Zip,require('node:crypto').randomUUID);
    const zip=await Zip.loadAsync(addon.addon);
    for(const pack of ['BP','RP']) assert.equal(await zip.file(pack+'/pack_icon.png').async('base64'),catalog.pig.thumbnail.split(',')[1]);
});

test('smoothing mixes colors within a two-pixel radius and preserves alpha and distant pixels', () => {
    const data=new Uint8ClampedArray(7*7*4);
    for(let i=0;i<49;i++)data.set([0,0,0,255],i*4);
    data.set([255,255,255,255],(3*7+3)*4);
    data.set([255,0,255,0],(2*7+3)*4);
    const source={width:7,height:7,data}, before=data.slice();
    const result=core.smoothPixels(source,3,3,2);
    assert.deepEqual(data,before);
    assert.ok(pixel(result,3,3)[0]>0 && pixel(result,3,3)[0]<255);
    assert.deepEqual(pixel(result,3,2),[255,0,255,0]);
    for(let y=0;y<7;y++)for(let x=0;x<7;x++){
        assert.equal(pixel(result,x,y)[3],pixel(source,x,y)[3]);
        if((x-3)**2+(y-3)**2>4)assert.deepEqual(pixel(result,x,y),pixel(source,x,y));
    }
    const edge=core.smoothPixels(source,0,0,2);
    assert.deepEqual(pixel(edge,0,0),[0,0,0,255]);
});
