'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const Zip=require('jszip');
const core=require('../blockbench_edu.js');
const catalog=require('../reference/wizard-catalog.json');

test('pig locomotion replaces incompatible controllers and exports swimming, amphibious and flight',()=>{
    const source=JSON.parse(catalog.pig.behavior),before=JSON.stringify(source);
    let b=core.pigBehavior({...core.defaultBehavior(),profile:'calm'});
    b=core.adjustPigBehavior(b,'mount.enabled',true);
    for(const mode of ['swim','amphibious','fly']) {
        b=core.adjustPigBehavior(b,'locomotion.mode',mode);
        assert.equal(b.pig.mount.enabled,false);
        const c=core.compileBehavior(source,b)['minecraft:entity'].components;
        assert.equal(c['minecraft:navigation.walk'],undefined);
        assert.equal(c['minecraft:movement.basic'],undefined);
        assert.equal(c['minecraft:behavior.float'],undefined);
        if(mode==='fly') {
            assert.ok(c['minecraft:movement.fly']);assert.ok(c['minecraft:can_fly']);
            assert.equal(c['minecraft:physics'].has_gravity,false);
            assert.ok(c['minecraft:behavior.random_fly']);assert.equal(c['minecraft:behavior.random_swim'],undefined);
        } else {
            assert.equal(c['minecraft:navigation.generic'].can_walk,mode==='amphibious');
            assert.ok(c['minecraft:behavior.random_swim']);assert.ok(c['minecraft:behavior.breath_air']);
            assert.equal(c['minecraft:underwater_movement'].value,b.speed);
        }
        assert.throws(()=>core.adjustPigBehavior(b,'mount.enabled',true),/montura/);
        const still=core.adjustPigBehavior(b,'wander',false);
        const sc=core.compileBehavior(source,still)['minecraft:entity'].components;
        for(const goal of ['random_fly','random_swim','random_stroll']) assert.equal(sc['minecraft:behavior.'+goal],undefined);
    }
    b=core.adjustPigBehavior(b,'locomotion.mode','walk');
    const c=core.compileBehavior(source,b)['minecraft:entity'].components;
    assert.ok(c['minecraft:navigation.walk']);assert.equal(c['minecraft:can_fly'],undefined);
    assert.equal(JSON.stringify(source),before);
});

test('respiration is independent of swimming and incoming damage protection',()=>{
    const source=JSON.parse(catalog.pig.behavior);
    let b=core.adjustPigBehavior(core.pigBehavior({...core.defaultBehavior(),profile:'calm'}),'locomotion.mode','swim');
    for(const medium of ['air','water','both']) {
        b=core.adjustPigBehavior(b,'respiration.medium',medium);
        b=core.adjustPigBehavior(b,'respiration.reserve',60);
        const c=core.compileBehavior(source,b)['minecraft:entity'].components;
        assert.equal(c['minecraft:breathable'].breathes_air,medium!=='water');
        assert.equal(c['minecraft:breathable'].breathes_water,medium!=='air');
        assert.equal(c['minecraft:breathable'].total_supply,60);
        assert.equal(!!c['minecraft:behavior.breath_air'],medium==='air');
    }
    b=core.adjustPigBehavior(b,'damageSources.drowning',false);
    assert.ok(core.compileBehavior(source,b)['minecraft:entity'].components['minecraft:damage_sensor'].triggers.some(t=>t.cause==='drowning'));
    for(const value of [0,301,15.5,'15']) assert.throws(()=>core.adjustPigBehavior(b,'respiration.reserve',value),/respiración/);
});

test('mob choices allow a friendly player reaction, merge targeting and prevent contradictory goals',()=>{
    const source=JSON.parse(catalog.pig.behavior);
    let b=core.pigBehavior({...core.defaultBehavior(),profile:'calm'});
    b=core.adjustPigBehavior(b,'breeding.enabled',true);
    b=core.adjustPigBehavior(b,'targets.attack',['zombie','skeleton']);
    assert.equal(b.pig.reaction,'neutral');assert.equal(b.pig.panic,false);assert.equal(b.pig.breeding.enabled,false);
    b=core.adjustPigBehavior(b,'targets.avoid',['creeper']);
    assert.throws(()=>core.adjustPigBehavior(b,'targets.avoid',['zombie']),/misma criatura/);
    assert.throws(()=>core.adjustPigBehavior(b,'panic',true),/Atacar criaturas/);
    assert.throws(()=>core.adjustPigBehavior(b,'breeding.enabled',true),/Atacar criaturas/);
    for(const list of [['dragon'],['zombie','zombie'],'zombie']) assert.throws(()=>core.adjustPigBehavior(b,'targets.attack',list),/criaturas/);
    let c=core.compileBehavior(source,b)['minecraft:entity'].components;
    assert.equal(c['minecraft:attack'].damage,b.damage);
    assert.equal(c['minecraft:behavior.nearest_attackable_target'].entity_types.length,2);
    assert.deepEqual(c['minecraft:behavior.nearest_attackable_target'].entity_types[0].filters.all_of,[{test:'is_family',subject:'other',value:'zombie'},{test:'is_tamed',subject:'other',value:false}]);
    assert.equal(c['minecraft:behavior.avoid_mob_type'].entity_types[0].filters.value,'creeper');
    b=core.adjustPigBehavior(b,'reaction','enemy');
    c=core.compileBehavior(source,b)['minecraft:entity'].components;
    assert.equal(c['minecraft:behavior.nearest_attackable_target'].entity_types.length,3);
    assert.deepEqual(c['minecraft:behavior.hurt_by_target'].entity_types[0].filters.none_of,[{test:'is_family',subject:'other',value:'creeper'}]);
    b=core.adjustPigBehavior(b,'reaction','flee');
    c=core.compileBehavior(source,b)['minecraft:entity'].components;
    assert.equal(c['minecraft:behavior.avoid_mob_type'].entity_types.length,2);
    b=core.adjustPigBehavior(b,'defend',true);
    const e=core.compileBehavior(source,b)['minecraft:entity'];
    assert.equal(e.component_groups['blockbench_edu:tamed']['minecraft:behavior.owner_hurt_by_target'].entity_types[0].filters.none_of[0].value,'creeper');
});

test('old pig projects gain walking and air defaults without modifying saved choices',()=>{
    const b=core.pigBehavior({...core.defaultBehavior(),profile:'calm'});
    delete b.pig.locomotion;delete b.pig.respiration;delete b.pig.targets;
    assert.doesNotThrow(()=>core.validateBehavior(b));
    const upgraded=core.pigBehavior(b);
    assert.deepEqual(upgraded.pig.locomotion,{mode:'walk'});
    assert.deepEqual(upgraded.pig.respiration,{medium:'air',reserve:15});
    assert.deepEqual(upgraded.pig.targets,{attack:[],avoid:[]});
    assert.equal(b.pig.locomotion,undefined);
});

test('pig damage-source choices block only selected causes and remove the separate lava hazard',()=>{
    const source=JSON.parse(catalog.pig.behavior),before=JSON.stringify(source);
    let b=core.pigBehavior({...core.defaultBehavior(),profile:'calm'});
    assert.ok(Object.values(b.pig.damageSources).every(Boolean));
    assert.equal(core.compileBehavior(source,b)['minecraft:entity'].components['minecraft:damage_sensor'],undefined);
    b=core.adjustPigBehavior(b,'damageSources.fire',false);
    b=core.adjustPigBehavior(b,'damageSources.lava',false);
    b=core.adjustPigBehavior(b,'damageSources.fall',false);
    const c=core.compileBehavior(source,b)['minecraft:entity'].components;
    assert.deepEqual(c['minecraft:damage_sensor'].triggers,[{cause:'fire',deals_damage:false},{cause:'fire_tick',deals_damage:false},{cause:'lava',deals_damage:false},{cause:'fall',deals_damage:false}]);
    assert.equal(c['minecraft:hurt_on_condition'],undefined);
    assert.ok(!c['minecraft:damage_sensor'].triggers.some(t=>t.cause==='entity_attack'||t.cause==='all'));
    assert.equal(c['minecraft:health'].max,20);
    assert.equal(JSON.stringify(source),before);
    b=core.adjustPigBehavior(b,'damageSources.lava',true);
    assert.ok(core.compileBehavior(source,b)['minecraft:entity'].components['minecraft:hurt_on_condition']);
    b.profile='original';
    assert.deepEqual(core.compileBehavior(source,b),source);
});

test('pig damage-source guards remain on babies and mounted pigs without replacing other systems',()=>{
    const b=core.pigBehavior({...core.defaultBehavior(),profile:'companion'});
    b.pig.mount.enabled=true;b.pig.breeding.enabled=true;b.pig.heal=true;
    for(const key of Object.keys(b.pig.damageSources)) b.pig.damageSources[key]=false;
    const e=core.compileBehavior(JSON.parse(catalog.pig.behavior),b)['minecraft:entity'];
    const triggers=e.components['minecraft:damage_sensor'].triggers;
    for(const cause of ['entity_attack','projectile','fire','fire_tick','lava','fall','drowning','suffocation','magic','wither','block_explosion','entity_explosion','contact','magma','lightning','freezing','anvil'])
        assert.ok(triggers.some(t=>t.cause===cause&&!t.deals_damage),cause);
    assert.equal(new Set(triggers.map(t=>t.cause)).size,triggers.length);
    assert.ok(!triggers.some(t=>['all','void','override','none'].includes(t.cause)));
    for(const group of Object.values(e.component_groups)) assert.equal(group['minecraft:damage_sensor'],undefined);
    assert.ok(e.component_groups['blockbench_edu:tamed']['minecraft:healable']);
    assert.ok(e.events['blockbench_edu:on_mount']);assert.ok(e.component_groups['blockbench_edu:baby']);
});

test('damage-source data rejects missing, unknown and non-boolean flags while preserving old projects',()=>{
    const b=core.pigBehavior({...core.defaultBehavior(),profile:'calm'});
    for(const bad of [null,[],{}, {...b.pig.damageSources,lava:'false'}, {...b.pig.damageSources,unknown:true}])
        assert.throws(()=>core.validateBehavior({...b,pig:{...b.pig,damageSources:bad}}),/causas de daño/);
    const old=structuredClone(b);delete old.pig.damageSources;
    assert.doesNotThrow(()=>core.validateBehavior(old));
    assert.ok(Object.values(core.pigBehavior(old).pig.damageSources).every(Boolean));
    assert.equal(old.pig.damageSources,undefined);
});

test('pig mounting pauses movement, combat and breeding without losing ownership or healing',()=>{
    let b=core.pigBehavior({...core.defaultBehavior(),profile:'companion'});
    b.pig.mount={enabled:true,saddle:true,control:'player',height:1.15,offset:-0.25};
    b.pig.breeding.enabled=true;
    b.pig.heal=true;
    const out=core.compileBehavior(JSON.parse(catalog.pig.behavior),b),e=out['minecraft:entity'],g=e.component_groups;
    assert.equal(out.format_version,'1.21.80');
    const ready=g['blockbench_edu:ride_ready']['minecraft:rideable'];
    assert.equal(ready.seat_count,1);assert.deepEqual(ready.family_types,['player']);
    assert.deepEqual(ready.seats.position,[0,1.15,-0.25]);
    assert.ok(g['blockbench_edu:ride_ready']['minecraft:is_saddled']);
    assert.equal(g['blockbench_edu:unsaddled']['minecraft:rideable'],undefined);
    assert.deepEqual(e.events['blockbench_edu:on_saddle'].remove.component_groups,['blockbench_edu:unsaddled']);
    assert.equal(ready.on_rider_enter_event.event,'blockbench_edu:on_mount');
    assert.equal(ready.on_rider_exit_event.event,'blockbench_edu:on_dismount');
    const pause=e.events['blockbench_edu:on_mount'];
    assert.ok(pause.remove.component_groups.includes('blockbench_edu:owner_free'));
    assert.ok(pause.remove.component_groups.includes('blockbench_edu:breed_free'));
    assert.ok(!pause.remove.component_groups.includes('blockbench_edu:tamed'));
    assert.ok(g['blockbench_edu:tamed']['minecraft:is_tamed']);
    assert.ok(g['blockbench_edu:tamed']['minecraft:healable']);
    assert.ok(g['blockbench_edu:owner_free']['minecraft:behavior.follow_owner']);
    assert.equal(e.components['minecraft:behavior.tempt'],undefined);
    assert.ok(g['blockbench_edu:free']['minecraft:behavior.tempt']);
    assert.ok(g['blockbench_edu:mounted']['minecraft:item_controllable']);
    const resume=e.events['blockbench_edu:on_dismount'].sequence;
    assert.ok(resume.some(step=>step.filters?.test==='is_tamed'&&step.add.component_groups.includes('blockbench_edu:owner_free')));
    assert.ok(!e.events['minecraft:entity_born'].add.component_groups.includes('blockbench_edu:unsaddled'));
    assert.ok(e.events['minecraft:entity_born'].remove.component_groups.includes('blockbench_edu:ride_ready'));
    assert.ok(e.events['blockbench_edu:grow_up'].add.component_groups.includes('blockbench_edu:unsaddled'));
});

test('pig ride modes respect saddle choices and validate seat coordinates',()=>{
    let b=core.pigBehavior({...core.defaultBehavior(),profile:'calm'});
    b=core.adjustPigBehavior(b,'mount.enabled',true);
    b=core.adjustPigBehavior(b,'mount.saddle',false);
    b=core.adjustPigBehavior(b,'mount.control','pig');
    const e=core.compileBehavior(JSON.parse(catalog.pig.behavior),b)['minecraft:entity'];
    assert.ok(e.events['minecraft:entity_spawned'].add.component_groups.includes('blockbench_edu:ride_ready'));
    assert.equal(e.component_groups['blockbench_edu:unsaddled'],undefined);
    assert.ok(e.component_groups['blockbench_edu:mounted']['minecraft:behavior.random_stroll']);
    assert.equal(e.component_groups['blockbench_edu:mounted']['minecraft:item_controllable'],undefined);
    b.pig.wander=false;
    assert.deepEqual(core.compileBehavior(JSON.parse(catalog.pig.behavior),b)['minecraft:entity'].component_groups['blockbench_edu:mounted'],{});
    for(const patch of [{control:'invalid'},{saddle:1},{height:-0.1},{height:5},{height:NaN},{offset:3},{enabled:'yes'}])
        assert.throws(()=>core.validateBehavior({...b,pig:{...b.pig,mount:{...b.pig.mount,...patch}}}),/montura/);
    const old=structuredClone(b);delete old.pig.mount;
    assert.equal(core.pigBehavior(old).pig.mount.enabled,false);
    assert.equal(old.pig.mount,undefined);
});

test('mount exports require compatible BP/RP engine versions, while Original and unmounted exports preserve them',async()=>{
    const starter=await core.createMobAddon(catalog.pig,{},Zip,randomUUID),ref=await core.readAddon(starter.addon,Zip);
    let b=core.pigBehavior({...core.defaultBehavior(),profile:'calm'});b.pig.mount.enabled=true;
    const make=async settings=>core.readAddon(await (await core.buildAddon(ref,{'minecraft:geometry':[ref.geometry]},catalog.pig.textures.default.split(',')[1],Zip,{},settings)).zip.generateAsync({type:'uint8array'}),Zip);
    const out=await make(b);
    assert.deepEqual(out.bp.manifest.header.min_engine_version,[1,21,80]);
    assert.deepEqual(out.rp.manifest.header.min_engine_version,[1,21,80]);
    assert.equal(out.behavior.json.format_version,'1.21.80');
    assert.equal(out.behavior.json['minecraft:entity'].description.identifier,starter.identifier);
    const untouched=await make(core.defaultBehavior());
    assert.deepEqual(untouched.behavior.json,ref.behavior.json);
    assert.deepEqual(untouched.bp.manifest.header.min_engine_version,ref.bp.manifest.header.min_engine_version);
    b.pig.mount.enabled=false;
    assert.deepEqual((await make(b)).bp.manifest.header.min_engine_version,ref.bp.manifest.header.min_engine_version);
});

test('separate pig foods export to independent actions and healing follows taming',()=>{
    let b=core.pigBehavior({...core.defaultBehavior(),profile:'companion'});
    b.pig.food={attract:['carrot','potato'],tame:['apple'],heal:[{item:'beetroot',amount:3},{item:'wheat',amount:8}],chance:25};
    b.pig.heal=true;
    const e=core.compileBehavior(JSON.parse(catalog.pig.behavior),b)['minecraft:entity'];
    assert.deepEqual(e.components['minecraft:behavior.tempt'].items,['carrot','potato']);
    assert.deepEqual(e.component_groups['blockbench_edu:wild']['minecraft:tameable'].tame_items,['apple']);
    assert.equal(e.component_groups['blockbench_edu:wild']['minecraft:tameable'].probability,0.25);
    assert.equal(e.components['minecraft:healable'],undefined);
    assert.deepEqual(e.component_groups['blockbench_edu:tamed']['minecraft:healable'].items,[{item:'beetroot',heal_amount:3},{item:'wheat',heal_amount:8}]);
    b=core.adjustPigBehavior(b,'tame',false);
    assert.ok(core.compileBehavior(JSON.parse(catalog.pig.behavior),b)['minecraft:entity'].components['minecraft:healable']);
});

test('pig reproduction has adult-only breeding, baby growth and stable ownership transitions',async()=>{
    const starter=await core.createMobAddon(catalog.pig,{},Zip,randomUUID),ref=await core.readAddon(starter.addon,Zip);
    let b=core.pigBehavior({...core.defaultBehavior(),profile:'companion'});
    b.pig.breeding={enabled:true,items:['potato'],cooldown:90,growth:120};
    const e=core.compileBehavior(ref.behavior.json,b)['minecraft:entity'];
    const adult=e.component_groups['blockbench_edu:adult'],baby=e.component_groups['blockbench_edu:baby'];
    assert.equal(e.components['minecraft:breedable'],undefined);
    assert.equal(adult['minecraft:breedable'].breeds_with.mate_type,starter.identifier);
    assert.equal(adult['minecraft:breedable'].breeds_with.baby_type,starter.identifier);
    assert.equal(adult['minecraft:breedable'].require_tame,true);
    assert.equal(adult['minecraft:breedable'].inherit_tamed,false);
    assert.equal(adult['minecraft:breedable'].breed_cooldown,90);
    assert.equal(baby['minecraft:ageable'].duration,120);
    assert.equal(baby['minecraft:scale'].value,0.5);
    assert.equal(baby['minecraft:breedable'],undefined);
    assert.deepEqual(e.events['minecraft:entity_spawned'].add.component_groups,['blockbench_edu:adult','blockbench_edu:wild']);
    assert.ok(e.events['minecraft:entity_born'].remove.component_groups.includes('blockbench_edu:adult'));
    assert.ok(e.events['minecraft:entity_born'].add.component_groups.includes('blockbench_edu:baby'));
    assert.deepEqual(e.events['blockbench_edu:grow_up'],{remove:{component_groups:['blockbench_edu:baby']},add:{component_groups:['blockbench_edu:adult']}});
    assert.equal(core.adjustPigBehavior(b,'defend',true).pig.breeding.enabled,false);
    assert.equal(core.adjustPigBehavior(b,'reaction','enemy').pig.breeding.enabled,false);
    const out=await core.buildAddon(ref,{'minecraft:geometry':[ref.geometry]},catalog.pig.textures.default.split(',')[1],Zip,{},b);
    const loaded=await core.readAddon(await out.zip.generateAsync({type:'uint8array'}),Zip);
    assert.deepEqual(loaded.behavior.json['minecraft:entity'].component_groups,e.component_groups);
});

test('pig food validation rejects malformed choices, timing and healing/breeding conflicts',()=>{
    const b=core.pigBehavior({...core.defaultBehavior(),profile:'calm'});
    for(const patch of [{attract:[]},{tame:['apple','apple']},{tame:['bad_item']},{chance:0},{chance:101},{heal:[{item:'carrot',amount:21}]}])
        assert.throws(()=>core.validateBehavior({...b,pig:{...b.pig,food:{...b.pig.food,...patch}}}),/alimentos/);
    for(const patch of [{growth:9},{growth:7201},{cooldown:3601},{items:[]}])
        assert.throws(()=>core.validateBehavior({...b,pig:{...b.pig,breeding:{...b.pig.breeding,...patch}}}),/alimentos/);
    const conflict=structuredClone(b);conflict.pig.heal=true;conflict.pig.breeding={...conflict.pig.breeding,enabled:true,items:['apple']};
    assert.throws(()=>core.validateBehavior(conflict),/curar/);
    const old=structuredClone(b);delete old.pig.food;delete old.pig.breeding;
    assert.doesNotThrow(()=>core.validateBehavior(old));
    const upgraded=core.pigBehavior(old);
    assert.deepEqual(upgraded.pig.food.attract,[old.item]);
    assert.equal(upgraded.pig.breeding.enabled,false);
    assert.equal(old.pig.food,undefined);
});

test('pig controls resolve conflicts, preserve separate settings, and keep following distances ordered',()=>{
    let b=core.pigBehavior({...core.defaultBehavior(),profile:'companion'});
    b=core.adjustPigBehavior(b,'defend',true);
    b=core.adjustPigBehavior(b,'reaction','enemy');
    assert.equal(b.pig.tame,false); assert.equal(b.pig.follow,false); assert.equal(b.pig.defend,false);
    assert.equal(b.pig.panic,false); assert.equal(b.tempt,false);
    b=core.adjustPigBehavior(b,'reaction','neutral');
    b=core.adjustPigBehavior(b,'tame',true);
    b=core.adjustPigBehavior(b,'follow',true);
    b=core.adjustPigBehavior(b,'followStop',10);
    assert.equal(b.pig.followStart,11);
    b=core.adjustPigBehavior(b,'followStart',4);
    assert.equal(b.pig.followStop,3);
    b=core.adjustPigBehavior(b,'defend',true);
    b=core.adjustPigBehavior(b,'tame',false);
    assert.equal(b.pig.follow,false); assert.equal(b.pig.defend,false);
    assert.equal(b.pig.followStart,4);
    b=core.adjustPigBehavior(b,'reaction','retaliate');
    assert.equal(b.pig.panic,false); assert.equal(b.pig.tame,false);
    for(const reaction of ['neutral','flee','enemy','retaliate']) {
        let r=core.adjustPigBehavior(b,'reaction',reaction);
        for(const [key,value] of [['tame',true],['follow',true],['defend',true],['panic',true],['tame',false]]) {
            r=core.adjustPigBehavior(r,key,value);
            assert.doesNotThrow(()=>core.validateBehavior(r));
            assert.doesNotThrow(()=>core.compileBehavior(JSON.parse(catalog.pig.behavior),r));
        }
    }
});

test('pig categories combine independent movement, healing, friendship and defense settings',()=>{
    const b=core.pigBehavior({...core.defaultBehavior(),profile:'calm'});
    Object.assign(b.pig,{wander:false,tame:true,follow:false,defend:true,panic:false,heal:true,healAmount:7,temptRange:18});
    const e=core.compileBehavior(JSON.parse(catalog.pig.behavior),b)['minecraft:entity'];
    assert.equal(e.components['minecraft:behavior.random_stroll'],undefined);
    assert.equal(e.components['minecraft:behavior.panic'],undefined);
    assert.equal(e.component_groups['blockbench_edu:tamed']['minecraft:healable'].items[0].heal_amount,4);
    assert.equal(e.components['minecraft:behavior.tempt'].within_radius,18);
    assert.equal(e.component_groups['blockbench_edu:tamed']['minecraft:behavior.follow_owner'],undefined);
    assert.ok(e.component_groups['blockbench_edu:tamed']['minecraft:behavior.owner_hurt_by_target']);
    assert.throws(()=>core.compileBehavior(JSON.parse(catalog.cow.behavior),b),/cerdo/);
    const retaliation=core.pigBehavior({...core.defaultBehavior(),profile:'calm'});
    Object.assign(retaliation.pig,{reaction:'retaliate',panic:false});
    const r=core.compileBehavior(JSON.parse(catalog.pig.behavior),retaliation)['minecraft:entity'].components;
    assert.ok(r['minecraft:behavior.hurt_by_target']);
    assert.equal(r['minecraft:behavior.nearest_attackable_target'],undefined);
});

test('pig category dependencies and distance bounds reject contradictory combinations',()=>{
    const b=core.pigBehavior({...core.defaultBehavior(),profile:'calm'});
    for(const patch of [{follow:true},{defend:true},{tame:true,reaction:'enemy'},{reaction:'retaliate'},{followStart:2},{followStop:6},{healAmount:21},{temptRange:25},{wander:'yes'}])
        assert.throws(()=>core.validateBehavior({...b,pig:{...b.pig,...patch}}),/cerdo/);
    const legacy={...core.defaultBehavior(),profile:'guardian',health:60};
    const upgraded=core.pigBehavior(legacy);
    assert.equal(upgraded.health,60);
    assert.equal(upgraded.pig.defend,true);
    assert.equal(upgraded.pig.follow,true);
    assert.equal(upgraded.pig.panic,false);
    assert.equal(legacy.pig,undefined);
});

test('Original is unchanged for every catalog behavior; supported walking bases compile without source mutation',()=>{
    let supported=0;
    for(const mob of Object.values(catalog)) {
        if(!mob.behavior) continue;
        const source=JSON.parse(mob.behavior), before=JSON.stringify(source);
        assert.deepEqual(core.compileBehavior(source),source);
        if(!core.supportsBehavior(source)) continue;
        supported++;
        for(const profile of ['calm','shy','companion','guardian','enemy']) {
            const result=core.compileBehavior(source,{...core.defaultBehavior(),profile});
            const e=result['minecraft:entity'];
            assert.equal(e.description.identifier,source['minecraft:entity'].description.identifier);
            assert.equal(e.description.runtime_identifier,undefined);
            assert.deepEqual(e.components['minecraft:collision_box'],source['minecraft:entity'].components['minecraft:collision_box']);
            assert.deepEqual(Object.keys(e.events),['companion','guardian'].includes(profile) ? ['minecraft:entity_spawned','blockbench_edu:on_tame'] : []);
        }
        assert.equal(JSON.stringify(source),before);
    }
    assert.ok(supported>10);
});

test('roles avoid conflicting goals and taming activates ownership before guardian defense',()=>{
    const source=JSON.parse(catalog.pig.behavior);
    const make=profile=>core.compileBehavior(source,{...core.defaultBehavior(),profile,item:'carrot',tempt:false,health:60,damage:8,range:24})['minecraft:entity'];
    const enemy=make('enemy'), shy=make('shy'), friend=make('companion'), guard=make('guardian');
    assert.equal(enemy.components['minecraft:health'].max,60);
    assert.equal(enemy.components['minecraft:attack'].damage,8);
    assert.equal(enemy.components['minecraft:behavior.nearest_attackable_target'].entity_types[0].max_dist,24);
    assert.equal(enemy.components['minecraft:tameable'],undefined);
    assert.equal(enemy.components['minecraft:behavior.tempt'],undefined);
    assert.equal(shy.components['minecraft:behavior.avoid_mob_type'].entity_types[0].filters.value,'player');
    assert.equal(shy.components['minecraft:attack'],undefined);
    assert.equal(friend.components['minecraft:attack'],undefined);
    assert.equal(friend.component_groups['blockbench_edu:wild']['minecraft:tameable'].tame_items[0],'carrot');
    assert.equal(friend.component_groups['blockbench_edu:tamed']['minecraft:behavior.follow_owner'].stop_distance,2);
    assert.equal(guard.components['minecraft:behavior.owner_hurt_by_target'],undefined);
    assert.ok(guard.component_groups['blockbench_edu:tamed']['minecraft:behavior.owner_hurt_by_target']);
    assert.equal(guard.component_groups['blockbench_edu:tamed']['minecraft:behavior.owner_hurt_target'],undefined);
    assert.deepEqual(guard.events['blockbench_edu:on_tame'].remove.component_groups,['blockbench_edu:wild']);
    assert.deepEqual(guard.events['blockbench_edu:on_tame'].add.component_groups,['blockbench_edu:tamed']);
});

test('invalid settings and unsupported locomotion are rejected',()=>{
    for(const change of [{version:2},{profile:'hostile'},{health:0},{health:201},{health:2.5},{speed:NaN},{speed:4},{damage:21},{range:3},{range:33},{item:'unknown'},{tempt:'yes'}])
        assert.throws(()=>core.validateBehavior({...core.defaultBehavior(),...change}),/comportamiento/);
    for(const id of ['bat','blaze','squid','glow_squid','vex','strider'])
        assert.throws(()=>core.compileBehavior(JSON.parse(catalog[id].behavior),{...core.defaultBehavior(),profile:'enemy'}),/movimiento original/);
});

test('export modifies matching BP entity in both addon layouts, preserves source, identity, and restores Original',async()=>{
    for(const nested of [false,true]) {
        const starter=await core.createMobAddon(catalog.pig,{},Zip,randomUUID);
        let bytes=starter.addon;
        if(nested) {
            const original=await Zip.loadAsync(bytes), outer=new Zip();
            for(const prefix of ['BP/','RP/']) {
                const pack=new Zip();
                for(const [name,entry] of Object.entries(original.files)) if(name.startsWith(prefix)&&!entry.dir)
                    pack.file(name.slice(prefix.length),await entry.async('uint8array'));
                outer.file(prefix.slice(0,2)+'.mcpack',await pack.generateAsync({type:'uint8array'}));
            }
            bytes=await outer.generateAsync({type:'uint8array'});
        }
        const ref=await core.readAddon(bytes,Zip), original=await ref.bp.zip.file(ref.behavior.path).async('string');
        const geometry={'minecraft:geometry':[ref.geometry]}, png=catalog.pig.textures.default.split(',')[1];
        const result=await core.buildAddon(ref,geometry,png,Zip,{}, {...core.defaultBehavior(),profile:'enemy',health:42});
        const exported=await core.readAddon(await result.zip.generateAsync({type:'uint8array'}),Zip);
        assert.equal(exported.behavior.json['minecraft:entity'].components['minecraft:health'].max,42);
        assert.equal(exported.behavior.json['minecraft:entity'].description.identifier,ref.entity.description.identifier);
        assert.equal(exported.bp.manifest.header.uuid,ref.bp.manifest.header.uuid);
        assert.equal(await ref.bp.zip.file(ref.behavior.path).async('string'),original);
        const restored=await core.buildAddon(ref,geometry,png,Zip,{},core.defaultBehavior());
        const restoredRef=await core.readAddon(await restored.zip.generateAsync({type:'uint8array'}),Zip);
        assert.equal(await restoredRef.bp.zip.file(restoredRef.behavior.path).async('string'),original);
    }
});
