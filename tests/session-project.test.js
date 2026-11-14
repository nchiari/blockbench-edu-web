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

test('universal category settings use portable format 10 and retain high health and custom movement',async()=>{
    const {model,state,reference}=await fixture(),core=require('../blockbench_edu.js');
    state.behavior=core.entityBehavior(reference.behavior.json,{...core.defaultBehavior(),profile:'companion'});
    state.behavior=core.adjustPigBehavior(state.behavior,'health',500);
    state.behavior=core.adjustPigBehavior(state.behavior,'locomotion.mode','fly');
    const loaded=await readCreatureProject(await writeCreatureProject(model,state,reference,Zip),Zip);
    assert.equal(loaded.version,10);assert.deepEqual(loaded.state.behavior,state.behavior);
    const exported=await buildAddon(loaded.reference,{'minecraft:geometry':[loaded.reference.geometry]},model.textures[0].source.split(',')[1],Zip,{},loaded.state.behavior);
    const addon=await readAddon(await exported.zip.generateAsync({type:'uint8array'}),Zip);
    assert.equal(addon.behavior.json['minecraft:entity'].components['minecraft:health'].max,500);
    assert.ok(addon.behavior.json['minecraft:entity'].components['minecraft:movement.fly']);
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
    await assert.rejects(mutate(d=>{d.version=11;}),/otra versión/);
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

test('pig category projects require format 7 and retain all detailed choices',async()=>{
    const {model,state,reference}=await fixture();
    state.behavior=require('../blockbench_edu.js').pigBehavior({...require('../blockbench_edu.js').defaultBehavior(),profile:'companion'});
    state.behavior.pig.followStart=12;
    state.behavior.pig.followStop=4;
    state.behavior.pig.heal=true;
    state.behavior.pig.food={attract:['carrot','potato'],tame:['apple'],heal:[{item:'beetroot',amount:6}],chance:50};
    state.behavior.pig.breeding={enabled:true,items:['wheat'],cooldown:60,growth:120};
    state.behavior.pig.mount={enabled:true,saddle:false,control:'player',height:1.1,offset:-0.3};
    state.behavior.pig.damageSources.fire=false;
    state.behavior.pig.damageSources.lava=false;
    const bytes=await writeCreatureProject(model,state,reference,Zip);
    const loaded=await readCreatureProject(bytes,Zip);
    assert.equal(loaded.version,7);
    assert.deepEqual(loaded.state.behavior,state.behavior);
    const result=await buildAddon(loaded.reference,{'minecraft:geometry':[loaded.reference.geometry]},model.textures[0].source.split(',')[1],Zip,{},loaded.state.behavior);
    const exported=await readAddon(await result.zip.generateAsync({type:'uint8array'}),Zip);
    assert.equal(exported.behavior.json['minecraft:entity'].component_groups['blockbench_edu:owner_free']['minecraft:behavior.follow_owner'].start_distance,12);
    assert.equal(exported.behavior.json['minecraft:entity'].component_groups['blockbench_edu:breed_free']['minecraft:breedable'].breed_cooldown,60);
    assert.deepEqual(exported.behavior.json['minecraft:entity'].component_groups['blockbench_edu:ride_ready']['minecraft:rideable'].seats.position,[0,1.1,-0.3]);
    assert.deepEqual(exported.behavior.json['minecraft:entity'].components['minecraft:damage_sensor'].triggers.map(t=>t.cause),['fire','fire_tick','lava']);
    const zip=await Zip.loadAsync(bytes),data=JSON.parse(await zip.file('project.json').async('string'));
    data.version=3; delete data.state.behavior.pig.food;delete data.state.behavior.pig.breeding;delete data.state.behavior.pig.mount;delete data.state.behavior.pig.damageSources;delete data.state.behavior.pig.locomotion;delete data.state.behavior.pig.respiration;delete data.state.behavior.pig.targets;
    zip.file('project.json',JSON.stringify(data));
    const previous=await readCreatureProject(await zip.generateAsync({type:'uint8array'}),Zip);
    assert.equal(previous.state.behavior.pig.food,undefined);
    const migrated=require('../blockbench_edu.js').pigBehavior(previous.state.behavior);
    assert.deepEqual(migrated.pig.food.tame,[previous.state.behavior.item]);
    assert.equal(migrated.pig.breeding.enabled,false);
});

test('flight, respiration and mob targets survive portable save and addon export',async()=>{
    const {model,state,reference}=await fixture(),core=require('../blockbench_edu.js');
    let b=core.pigBehavior({...core.defaultBehavior(),profile:'calm'});
    for(const [key,value] of [['locomotion.mode','fly'],['respiration.medium','both'],['respiration.reserve',45],['targets.attack',['zombie','skeleton']],['targets.avoid',['creeper']]]) b=core.adjustPigBehavior(b,key,value);
    state.behavior=b;
    const loaded=await readCreatureProject(await writeCreatureProject(model,state,reference,Zip),Zip);
    assert.equal(loaded.version,7);assert.deepEqual(loaded.state.behavior,b);
    const built=await buildAddon(loaded.reference,{'minecraft:geometry':[loaded.reference.geometry]},model.textures[0].source.split(',')[1],Zip,{},loaded.state.behavior);
    const exported=await readAddon(await built.zip.generateAsync({type:'uint8array'}),Zip),c=exported.behavior.json['minecraft:entity'].components;
    assert.ok(c['minecraft:movement.fly']);assert.equal(c['minecraft:breathable'].breathes_water,true);
    assert.equal(c['minecraft:behavior.nearest_attackable_target'].entity_types.length,2);
    assert.equal(c['minecraft:behavior.avoid_mob_type'].entity_types[0].filters.value,'creeper');
    const zip=await Zip.loadAsync(await writeCreatureProject(model,state,reference,Zip));
    const data=JSON.parse(await zip.file('project.json').async('string'));
    data.version=6;delete data.state.behavior.pig.locomotion;delete data.state.behavior.pig.respiration;delete data.state.behavior.pig.targets;
    zip.file('project.json',JSON.stringify(data));
    const old=await readCreatureProject(await zip.generateAsync({type:'uint8array'}),Zip);
    assert.equal(old.version,6);assert.equal(core.pigBehavior(old.state.behavior).pig.locomotion.mode,'walk');
});
