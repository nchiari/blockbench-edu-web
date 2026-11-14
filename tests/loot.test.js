'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const fs=require('node:fs');
const Zip=require('jszip');
const core=require('../blockbench_edu.js');
const catalog=require('../reference/wizard-catalog.json');

test('loot search ships the pinned item registry and Spanish labels in the standalone plugin',()=>{
    const snapshot=require('../reference/loot-items.json');
    assert.equal(snapshot.version,'1.26.30.5');
    assert.equal(snapshot.items.length,1518);
    assert.deepEqual(core.lootItems,snapshot.items);
    assert.equal(new Set(core.lootItems.map(i=>i.id)).size,1518);
    assert.ok(core.lootItems.every(i=>/^minecraft:[a-z0-9_]+$/.test(i.id)&&i.label.trim().length>0));
    for(const id of ['diamond','diamond_sword','netherite_ingot','music_disc_13','barrier','creeper_spawn_egg','oak_log'])
        assert.ok(core.lootItems.some(i=>i.id==='minecraft:'+id));
    assert.equal(core.lootItems.find(i=>i.id==='minecraft:diamond').label,'Diamante');
});

test('loot rows keep repeated and unstackable items as separate guaranteed rewards',()=>{
    const loot={mode:'custom',entries:[{item:'minecraft:diamond',count:64},{item:'minecraft:diamond_sword',count:3},{item:'minecraft:diamond',count:5}]};
    const table=core.compileLootTable(loot);
    assert.equal(table.pools.length,3);
    assert.deepEqual(table.pools.map(p=>p.rolls),[64,3,5]);
    assert.deepEqual(table.pools.map(p=>p.entries[0].name),loot.entries.map(i=>i.item));
    assert.ok(table.pools.every(p=>p.entries.length===1&&p.entries[0].functions[0].count===1));
    assert.deepEqual(core.compileLootTable({mode:'none',entries:[]}),{pools:[]});
});

test('loot validation rejects unknown IDs, malformed quantities and row limits',()=>{
    for(const loot of [null,{mode:'random',entries:[]},{mode:'custom',entries:[]},
        {mode:'custom',entries:[{item:'minecraft:fake',count:1}]},
        ...[0,-1,1.5,NaN,Infinity,'5',65].map(count=>({mode:'custom',entries:[{item:'minecraft:diamond',count}]})),
        {mode:'custom',entries:[{item:'minecraft:diamond',count:65},{item:'minecraft:apple',count:640}]},
        {mode:'custom',entries:Array.from({length:6},()=>({item:'minecraft:apple',count:1}))}])
        assert.throws(()=>core.validateLoot(loot),/botín/);
    assert.doesNotThrow(()=>core.validateLoot({mode:'custom',entries:Array.from({length:5},()=>({item:'minecraft:apple',count:64}))}));
});

test('loot inherits old projects and item editing survives mode changes, removal and mounting',()=>{
    const source=JSON.parse(catalog.pig.behavior);
    let b=core.entityBehavior(source);
    assert.deepEqual(b.pig.loot,{mode:'inherit',entries:[]});
    assert.deepEqual(core.compileBehavior(source,b)['minecraft:entity'].components['minecraft:loot'],source['minecraft:entity'].components['minecraft:loot']);
    b=core.adjustPigBehavior(b,'loot',{mode:'custom',entries:[{item:'minecraft:diamond',count:7}]});
    b=core.adjustPigBehavior(b,'mount.enabled',true);
    let e=core.compileBehavior(source,b)['minecraft:entity'];
    assert.equal(e.components['minecraft:loot'].table,core.lootTablePath(source));
    assert.ok(Object.values(e.component_groups).every(g=>g['minecraft:loot']===undefined));
    b=core.adjustPigBehavior(b,'loot.entries',[]);
    assert.equal(b.pig.loot.mode,'none');
    b=core.adjustPigBehavior(b,'loot',{mode:'original',entries:[]});
    e=core.compileBehavior(source,b)['minecraft:entity'];
    assert.deepEqual(e.components['minecraft:loot'],core.entityComponent(source,'loot'));
});

test('custom and empty tables stay inside the right BP in flat and nested addon exports',async()=>{
    for(const nested of [false,true]) {
        let bytes=(await core.createMobAddon(catalog.pig,{},Zip,randomUUID)).addon;
        if(nested) {
            const flat=await Zip.loadAsync(bytes),outer=new Zip();
            for(const prefix of ['BP/','RP/']) {
                const pack=new Zip();
                for(const [name,entry]of Object.entries(flat.files))if(!entry.dir&&name.startsWith(prefix))pack.file(name.slice(prefix.length),await entry.async('uint8array'));
                outer.file(prefix.slice(0,-1)+'.mcpack',await pack.generateAsync({type:'uint8array'}));
            }
            bytes=await outer.generateAsync({type:'uint8array'});
        }
        const ref=await core.readAddon(bytes,Zip),before=await ref.root.generateAsync({type:'uint8array'});
        let b=core.entityBehavior(ref.behavior.json);
        for(const mode of ['custom','none','original']) {
            b=core.adjustPigBehavior(b,'loot',{mode,entries:mode==='custom'?[{item:'minecraft:diamond',count:64,chance:'low'},{item:'minecraft:iron_sword',count:2,chance:'very_high'}]:[]});
            const built=await core.buildAddon(ref,{'minecraft:geometry':[ref.geometry]},catalog.pig.textures.default.split(',')[1],Zip,{},b);
            const out=await core.readAddon(await built.zip.generateAsync({type:'uint8array'}),Zip),loot=out.behavior.json['minecraft:entity'].components['minecraft:loot'];
            if(mode==='original')assert.deepEqual(loot,core.entityComponent(ref.behavior.json,'loot'));
            else {
                const root=out.bp.path.slice(0,out.bp.path.lastIndexOf('/')+1);
                const entry=out.bp.zip.file(root+loot.table);assert.ok(entry);
                assert.deepEqual(JSON.parse(await entry.async('string')),core.compileLootTable(b.pig.loot));
            }
            assert.equal(out.bp.manifest.header.uuid,ref.bp.manifest.header.uuid);
        }
        assert.deepEqual(await ref.root.generateAsync({type:'uint8array'}),before);
    }
});

test('loot configuration works for every classroom entity and never mutates its template',()=>{
    const embedded=JSON.parse(fs.readFileSync(require.resolve('../blockbench_edu.js'),'utf8').match(/const CATALOG = (.+);/)[1]);
    let count=0;
    for(const [id,mob]of Object.entries(embedded))if(mob.entity&&mob.behavior&&!['basic','vehicle','armor_stand'].includes(id)&&!mob.disable_on_edu) {
        count++;const source=JSON.parse(mob.behavior),before=JSON.stringify(source);
        let b=core.entityBehavior(source);
        b=core.adjustPigBehavior(b,'loot',{mode:'custom',entries:[{item:'minecraft:diamond',count:10}]});
        const e=core.compileBehavior(source,b)['minecraft:entity'];
        assert.equal(e.components['minecraft:loot'].table,core.lootTablePath(source),id);
        assert.equal(JSON.stringify(source),before,id);
    }
    assert.equal(count,70);
});


test('word choices compile independent chances for the whole quantity, with no numeric UI setting',()=>{
    assert.deepEqual(core.lootChances.map(c=>[c.label,c.chance]),[
        ['Siempre',1],['Muy alta',0.9],['Alta',0.75],['Media',0.5],['Baja',0.25],['Muy baja',0.1]
    ]);
    for(const choice of core.lootChances) {
        const table=core.compileLootTable({mode:'custom',entries:Array.from({length:5},()=>({item:'minecraft:diamond_sword',count:64,chance:choice.id}))});
        assert.equal(table.pools.length,5);
        for(const pool of table.pools) {
            assert.equal(pool.rolls,64);
            assert.deepEqual(pool.conditions,choice.chance===1?undefined:[{condition:'random_chance',chance:choice.chance}]);
            assert.equal(pool.entries[0].conditions,undefined);
            assert.equal(pool.entries[0].functions[0].count,1);
        }
    }
    for(const chance of [0,50,100,'unknown','50','']) {
        assert.throws(()=>core.validateLoot({mode:'custom',entries:[{item:'minecraft:apple',count:1,chance}]}),/botín/);
    }
});
