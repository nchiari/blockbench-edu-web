'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../blockbench_edu.js');
const catalog=require('../reference/wizard-catalog.json');

const base=id=>core.entityBehavior(JSON.parse(catalog[id].behavior),{...core.defaultBehavior(),profile:'enemy'},true);

test('ranged attack fires the chosen vanilla projectile from the chosen height',()=>{
    const source=JSON.parse(catalog.pig.behavior);
    let b=core.adjustPigBehavior(base('pig'),'reaction','enemy');
    assert.equal(b.pig.ranged.mode,'melee');
    let entity=core.compileBehavior(source,b);
    assert.equal(entity['minecraft:entity'].components['minecraft:behavior.fire_at_target'],undefined);
    b=core.adjustPigBehavior(b,'ranged.mode','both');
    b=core.adjustPigBehavior(b,'ranged.projectile','minecraft:small_fireball');
    b=core.adjustPigBehavior(b,'ranged.origin','feet');
    b=core.adjustPigBehavior(b,'ranged.height',0.75);
    entity=core.compileBehavior(source,b);
    const c=entity['minecraft:entity'].components,fire=c['minecraft:behavior.fire_at_target'];
    assert.equal(fire.projectile_def,'minecraft:small_fireball');
    assert.equal(fire.owner_anchor,0);
    assert.deepEqual(fire.owner_offset,[0,0.75,0]);
    assert.deepEqual(fire.attack_range,[0,b.range]);
    assert.ok(c['minecraft:behavior.melee_attack'],'both keeps melee');
    assert.ok(entity.format_version.localeCompare('1.21.30',undefined,{numeric:true})>=0);
    const only=core.compileBehavior(source,core.adjustPigBehavior(b,'ranged.mode','ranged'))['minecraft:entity'].components;
    assert.equal(only['minecraft:behavior.melee_attack'],undefined);
    assert.ok(only['minecraft:behavior.move_around_target']);
});

test('ranged attack needs a target and rejects unknown projectiles',()=>{
    const source=JSON.parse(catalog.cow.behavior);
    let b=core.adjustPigBehavior(base('cow'),'reaction','neutral');
    b=core.adjustPigBehavior(b,'ranged.mode','ranged');
    assert.equal(core.compileBehavior(source,b)['minecraft:entity'].components['minecraft:behavior.fire_at_target'],undefined);
    assert.throws(()=>core.adjustPigBehavior(b,'ranged.projectile','minecraft:fireball'),/distancia/);
    assert.throws(()=>core.adjustPigBehavior(b,'ranged.height',9),/distancia/);
    const mounted=core.adjustPigBehavior(core.adjustPigBehavior(core.adjustPigBehavior(b,'reaction','retaliate'),'mount.enabled',true),'ranged.mode','both');
    const e=core.compileBehavior(source,mounted)['minecraft:entity'];
    assert.ok(e.component_groups['blockbench_edu:free']['minecraft:behavior.fire_at_target'],'riding pauses shooting like other goals');
});
