'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Zip = require('jszip');
const {readAddon,writeCreatureProject,readCreatureProject,buildAddon,attachAddonProject,readExportedAddon} = require('../blockbench_edu.js');

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

test('universal category settings use portable format 12 and retain high health and custom movement',async()=>{
    const {model,state,reference}=await fixture(),core=require('../blockbench_edu.js');
    state.behavior=core.entityBehavior(reference.behavior.json,{...core.defaultBehavior(),profile:'companion'});
    state.behavior=core.adjustPigBehavior(state.behavior,'health',500);
    state.behavior=core.adjustPigBehavior(state.behavior,'locomotion.mode','fly');
    const loaded=await readCreatureProject(await writeCreatureProject(model,state,reference,Zip),Zip);
    assert.equal(loaded.version,12);assert.deepEqual(loaded.state.behavior,state.behavior);
    const exported=await buildAddon(loaded.reference,{'minecraft:geometry':[loaded.reference.geometry]},model.textures[0].source.split(',')[1],Zip,{},loaded.state.behavior);
    const addon=await readAddon(await exported.zip.generateAsync({type:'uint8array'}),Zip);
    assert.equal(addon.behavior.json['minecraft:entity'].components['minecraft:health'].max,500);
    assert.ok(addon.behavior.json['minecraft:entity'].components['minecraft:movement.fly']);
});

test('portable loot rows reopen and export exactly, while format 10 keeps its inherited drops',async()=>{
    const {model,state,reference}=await fixture(),core=require('../blockbench_edu.js');
    state.behavior=core.entityBehavior(reference.behavior.json);
    state.behavior=core.adjustPigBehavior(state.behavior,'loot',{mode:'custom',entries:[{item:'minecraft:diamond',count:64,chance:'medium'},{item:'minecraft:diamond_sword',count:2}]});
    const bytes=await writeCreatureProject(model,state,reference,Zip);
    const loaded=await readCreatureProject(bytes,Zip);
    assert.equal(loaded.version,12);assert.deepEqual(loaded.state.behavior.pig.loot,state.behavior.pig.loot);
    const result=await buildAddon(loaded.reference,{'minecraft:geometry':[loaded.reference.geometry]},model.textures[0].source.split(',')[1],Zip,{},loaded.state.behavior);
    const out=await readAddon(await result.zip.generateAsync({type:'uint8array'}),Zip);
    const table=out.behavior.json['minecraft:entity'].components['minecraft:loot'].table;
    const root=out.bp.path.slice(0,out.bp.path.lastIndexOf('/')+1);
    assert.deepEqual(JSON.parse(await out.bp.zip.file(root+table).async('string')),core.compileLootTable(state.behavior.pig.loot));
    const zip=await Zip.loadAsync(bytes),data=JSON.parse(await zip.file('project.json').async('string'));
    data.version=11;for(const row of data.state.behavior.pig.loot.entries)delete row.chance;
    zip.file('project.json',JSON.stringify(data));
    const legacy=await readCreatureProject(await zip.generateAsync({type:'uint8array'}),Zip);
    assert.ok(core.compileLootTable(legacy.state.behavior.pig.loot).pools.every(p=>p.conditions===undefined));
    data.state.behavior.pig.loot.entries[0].count=200;zip.file('project.json',JSON.stringify(data));
    await assert.rejects(readCreatureProject(await zip.generateAsync({type:'uint8array'}),Zip),/hasta 5 objetos, de 1 a 64/);
    data.version=10;delete data.state.behavior.pig.loot;zip.file('project.json',JSON.stringify(data));
    const previous=await readCreatureProject(await zip.generateAsync({type:'uint8array'}),Zip);
    assert.deepEqual(core.entityBehavior(previous.reference.behavior.json,previous.state.behavior).pig.loot,{mode:'inherit',entries:[]});
});
test('mount jumping survives save and controls the exported direct ride',async()=>{
    const {model,state,reference}=await fixture(),core=require('../blockbench_edu.js');
    const settings=core.adjustPigBehavior(core.entityBehavior(reference.behavior.json),'mount.enabled',true);
    state.behavior=core.adjustPigBehavior(core.adjustPigBehavior(settings,'mount.saddle',false),'mount.jump',true);
    const loaded=await readCreatureProject(await writeCreatureProject(model,state,reference,Zip),Zip);
    assert.equal(loaded.version,14);
    assert.equal(loaded.state.behavior.pig.mount.jump,true);
    const output=await buildAddon(loaded.reference,{'minecraft:geometry':[loaded.reference.geometry]},model.textures[0].source.split(',')[1],Zip,{},loaded.state.behavior);
    const exported=await readAddon(await output.zip.generateAsync({type:'uint8array'}),Zip);
    const entity=exported.behavior.json['minecraft:entity'];
    const mounted=entity.component_groups['blockbench_edu:mounted'];
    assert.deepEqual(mounted['minecraft:can_power_jump'],{});
    assert.deepEqual(mounted['minecraft:is_saddled'],{});
    assert.equal(mounted['minecraft:variable_max_auto_step'].controlled_value,1);
    assert.equal(entity.components['minecraft:horse.jump_strength'].value,0.5);
    assert.ok(entity.events['blockbench_edu:on_dismount'].sequence[0].remove.component_groups.includes('blockbench_edu:mounted'));
    const legacy=structuredClone(settings);
    delete legacy.pig.mount.jump;
    for(const inactive of [legacy,core.adjustPigBehavior(state.behavior,'mount.jump',false),core.adjustPigBehavior(state.behavior,'mount.control','player')]) {
        const result=core.compileBehavior(reference.behavior.json,inactive)['minecraft:entity'];
        assert.equal(result.component_groups['blockbench_edu:mounted']['minecraft:can_power_jump'],undefined);
        assert.equal(result.component_groups['blockbench_edu:mounted']['minecraft:variable_max_auto_step'],undefined);
    }
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
    await assert.rejects(mutate(d=>{d.version=15;}),/otra versión/);
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

test('expanded classroom foods survive reopening and export to three independent actions',async()=>{
    const {model,state,reference}=await fixture();
    const {defaultBehavior,entityBehavior,adjustPigBehavior}=require('../blockbench_edu.js');
    let behavior=entityBehavior(reference.behavior.json,{...defaultBehavior(),profile:'companion'});
    behavior=adjustPigBehavior(behavior,'food.tame',['cod']);
    behavior=adjustPigBehavior(behavior,'food.attract',['sweet_berries']);
    behavior=adjustPigBehavior(behavior,'heal',true);
    state.behavior=adjustPigBehavior(behavior,'food.heal',[{item:'cooked_beef',amount:4}]);
    const loaded=await readCreatureProject(await writeCreatureProject(model,state,reference,Zip),Zip);
    assert.deepEqual(loaded.state.behavior.pig.food,state.behavior.pig.food);
    const result=await buildAddon(loaded.reference,{'minecraft:geometry':[loaded.reference.geometry]},model.textures[0].source.split(',')[1],Zip,{},loaded.state.behavior);
    const exported=await readAddon(await result.zip.generateAsync({type:'uint8array'}),Zip);
    const entity=exported.behavior.json['minecraft:entity'];
    assert.deepEqual(entity.components['minecraft:behavior.tempt'].items,['sweet_berries']);
    assert.deepEqual(entity.component_groups['blockbench_edu:wild']['minecraft:tameable'].tame_items,['cod']);
    assert.deepEqual(entity.component_groups['blockbench_edu:tamed']['minecraft:healable'].items,[{item:'cooked_beef',heal_amount:4}]);
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
test('egg colors survive saving and reopening a portable project', async () => {
    const {model,state,reference} = await fixture();
    const colors = {base_color:'#ee9900',overlay_color:'#1133ff'};
    reference.entity.description.spawn_egg = colors;
    reference.rp.zip.file(reference.entity.path, JSON.stringify(reference.entity.json));
    const loaded = await readCreatureProject(await writeCreatureProject(model,state,reference,Zip),Zip);
    assert.deepEqual(loaded.reference.entity.description.spawn_egg, colors);
});

test('marked Minecraft exports reopen as the same editable creature and update the same packs', async () => {
    const {model,state,reference} = await fixture();
    const geometry = {'minecraft:geometry':[reference.geometry]};
    const png = model.textures[0].source.split(',')[1];
    const addon = await buildAddon(reference,geometry,png,Zip);
    await assert.rejects(readExportedAddon(await addon.zip.generateAsync({type:'uint8array'}),false,Zip), /exportado por Blockbench Edu/);
    state.lastVersion = addon.version;
    const project = await writeCreatureProject(model,state,reference,Zip);
    await attachAddonProject(addon.zip,reference,project,Zip);
    const loaded = await readExportedAddon(await addon.zip.generateAsync({type:'uint8array'}),false,Zip);
    assert.deepEqual(loaded.model,model);
    assert.deepEqual(loaded.state,state);

    for (const kind of ['bp','rp']) {
        const {prefix, outerPath, manifest} = reference[kind];
        const pack = outerPath ? await Zip.loadAsync(await addon.zip.file(outerPath).async('uint8array')) : addon.zip;
        const standalone = new Zip();
        for (const [path,file] of Object.entries(pack.files)) if (!file.dir && path.startsWith(prefix)) {
            standalone.file(path.slice(prefix.length),await file.async('uint8array'));
        }
        const reopened = await readExportedAddon(await standalone.generateAsync({type:'uint8array'}),true,Zip);
        assert.deepEqual(reopened.model,model);
        assert.deepEqual(reopened.state,state);
        assert.equal(reopened.reference[kind].manifest.header.uuid,manifest.header.uuid);
        standalone.file('manifest.json',JSON.stringify({...manifest, header:{...manifest.header,uuid:'another-pack'}}));
        await assert.rejects(readExportedAddon(await standalone.generateAsync({type:'uint8array'}),true,Zip), /no corresponde/);
    }
    const next = await buildAddon(loaded.reference,geometry,png,Zip);
    assert.deepEqual(next.version,[addon.version[0],addon.version[1],addon.version[2]+1]);
    const rebuilt = await readAddon(await next.zip.generateAsync({type:'uint8array'}),Zip);
    assert.equal(rebuilt.bp.manifest.header.uuid,reference.bp.manifest.header.uuid);
    assert.equal(rebuilt.rp.manifest.header.uuid,reference.rp.manifest.header.uuid);
});
