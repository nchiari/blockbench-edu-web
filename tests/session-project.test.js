'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Zip = require('jszip');
const {readAddon,writeCreatureProject,readCreatureProject,buildAddon} = require('../blockbench_edu.js');

async function fixture() {
    const reference = await readAddon(fs.readFileSync('reference/cerdo_edu.mcaddon'),Zip);
    const model = JSON.parse(fs.readFileSync('reference/cerdo_edu.bbmodel','utf8'));
    const cubes = model.elements.filter(c=>c.type==='cube');
    const state = {prepared:true,headId:cubes[0].uuid,selectedId:cubes[0].uuid,textureId:model.textures[0].uuid,
        cubeIds:cubes.map(c=>c.uuid),initialSizes:Object.fromEntries(cubes.map(c=>[c.uuid,c.to.map((v,i)=>v-c.from[i])])),
        originalResolution:[model.resolution.width,model.resolution.height],lastVersion:[1,0,4],
        originalFaces:cubes.flatMap(c=>Object.entries(c.faces).filter(([,f])=>f.texture!==null).map(([name,f])=>({
            cubeId:c.uuid,name,uv:f.uv,signs:[1,1],width:1,height:1})))
    };
    return {model,state,reference};
}
test('portable project retains exact model, original addon, limits and export identity',async()=>{
    const {model,state,reference} = await fixture();
    model.elements[0].from[0] -= 2;
    const bytes = await writeCreatureProject(model,state,reference,Zip);
    const loaded = await readCreatureProject(bytes,Zip);
    assert.deepEqual(loaded.model,model);
    assert.deepEqual(loaded.state,state);
    assert.deepEqual(loaded.reference.lastVersion,[1,0,4]);
    assert.equal(loaded.reference.bp.manifest.header.uuid,reference.bp.manifest.header.uuid);
    assert.equal(loaded.reference.rp.manifest.header.uuid,reference.rp.manifest.header.uuid);
    const source = await Zip.loadAsync(bytes);
    const sourceAddon = await Zip.loadAsync(await source.file('reference.mcaddon').async('uint8array'));
    for (const [name,entry] of Object.entries(reference.root.files)) if (!entry.dir)
        assert.deepEqual(await sourceAddon.file(name).async('uint8array'),await entry.async('uint8array'));
    const next = await buildAddon(loaded.reference,{'minecraft:geometry':[loaded.reference.geometry]},model.textures[0].source.split(',')[1],Zip);
    assert.deepEqual(next.version,[1,0,5]);
});
test('rejects malformed, future and incomplete projects before importing',async()=>{
    const {model,state,reference} = await fixture();
    await assert.rejects(readCreatureProject('not a zip',Zip),/dañado/);
    const bytes = await writeCreatureProject(model,state,reference,Zip);
    const mutate = async change => {
        const zip=await Zip.loadAsync(bytes), data=JSON.parse(await zip.file('project.json').async('string'));
        change(data,zip); zip.file('project.json',JSON.stringify(data));
        return readCreatureProject(await zip.generateAsync({type:'uint8array'}),Zip);
    };
    await assert.rejects(mutate(d=>{d.version=3;}),/otra versión/);
    await assert.rejects(mutate((d,z)=>z.remove('reference.mcaddon')),/addon base/);
    await assert.rejects(mutate(d=>{d.model.textures[0].source='';}),/pintura incluida/);
    await assert.rejects(mutate(d=>{d.state.originalFaces.pop();}),/pintura original/);
    await assert.rejects(mutate(d=>{d.state.cubeIds[0]=d.state.cubeIds[1];}),/piezas/);
    await assert.rejects(mutate(d=>{d.model.model_identifier='another_creature';}),/misma criatura/);
    await assert.rejects(mutate(d=>{d.state.lastVersion=[1,-1,0];}),/versión del addon/);
});

test('behavior settings survive saving and loading while v1 projects keep their original behavior',async()=>{
    const {model,state,reference} = await fixture();
    state.behavior={...require('../blockbench_edu.js').defaultBehavior(),profile:'guardian',health:60,item:'carrot'};
    const bytes=await writeCreatureProject(model,state,reference,Zip);
    const loaded=await readCreatureProject(bytes,Zip);
    assert.deepEqual(loaded.state.behavior,state.behavior);
    const archive=await Zip.loadAsync(bytes), data=JSON.parse(await archive.file('project.json').async('string'));
    assert.equal(data.version,2);
    data.version=1; delete data.state.behavior;
    archive.file('project.json',JSON.stringify(data));
    const old=await readCreatureProject(await archive.generateAsync({type:'uint8array'}),Zip);
    assert.equal(old.state.behavior,undefined);
    data.state.behavior={...state.behavior,health:Infinity}; archive.file('project.json',JSON.stringify(data));
    await assert.rejects(readCreatureProject(await archive.generateAsync({type:'uint8array'}),Zip),/comportamiento/);
});
