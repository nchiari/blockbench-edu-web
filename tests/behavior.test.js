'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const Zip=require('jszip');
const core=require('../blockbench_edu.js');
const catalog=require('../reference/wizard-catalog.json');

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
    assert.equal(e.components['minecraft:healable'].items[0].heal_amount,7);
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
