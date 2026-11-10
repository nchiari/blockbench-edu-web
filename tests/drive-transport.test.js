const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {webcrypto} = require('node:crypto');

function environment(hash = '#clase=' + 'a'.repeat(32)) {
    const frames=[], listeners=new Set(), timers=new Map(), otherListeners=new Map(); let next=0;
    const location = {href:'http://localhost:4173/blockbench-edu-web/'+hash, hash, origin:'http://localhost:4173'};
    const window={addEventListener:(type,fn)=>type==='message'?listeners.add(fn):otherListeners.set(type,fn),
        removeEventListener:(type,fn)=>type==='message'?listeners.delete(fn):otherListeners.delete(type),
        dispatchEvent:event=>otherListeners.get(event.type)?.(event)};
    const context=vm.createContext({window,location,URL,URLSearchParams,crypto:webcrypto,Uint8Array,Event,
        document:{createElement:()=>({remove(){this.removed=true;}}),body:{append:frame=>frames.push(frame)}},
        setTimeout:(fn,ms)=>{timers.set(++next,{fn,ms});return next;},clearTimeout:id=>timers.delete(id),
        FileReader:class {readAsDataURL(blob){blob.arrayBuffer().then(bytes=>{this.result='data:application/octet-stream;base64,'+Buffer.from(bytes).toString('base64');this.onload();});}}
    });
    vm.runInContext(fs.readFileSync('web/drive-inbox.js','utf8'),context);
    const peer={sent:[],postMessage(data,origin){this.sent.push({data,origin});}};
    const event=(data,source=peer,origin='https://n-test-script.googleusercontent.com')=>{
        for(const listener of listeners) listener({data,source,origin});
    };
    const ready=()=>{const channel=new URL(frames.at(-1).src).searchParams.get('canal');event({type:'edu-drive-ready',channel});return channel;};
    return {api:window.BlockbenchEduDrive,frames,timers,peer,event,ready,
        hash:value=>{location.hash=value;window.dispatchEvent(new Event('hashchange'));}};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('class link uses a fragment and rejects invalid class codes',()=>{
    const env=environment(); assert.match(env.api.classLink,/#clase=a{32}$/);
    assert.throws(()=>env.api.setClassCode('bad'));
    assert.equal(environment('#clase=bad').api.classLink,'');
    env.hash('#clase='+'c'.repeat(32));assert.equal(env.api.classCode,'c'.repeat(32));
    env.hash('#clase=bad');assert.equal(env.api.classCode,'');
});

test('prepares bytes once with a random retry identifier',async()=>{
    const env=environment(), blob=new Blob(['test']);
    const payload=await env.api.prepare(blob,'Alumno 07','Cerdo','cerdo.mcaddon');
    assert.equal(payload.base64,Buffer.from('test').toString('base64'));
    assert.match(payload.submissionId,/^[a-f0-9]{32}$/);
    await assert.rejects(environment('').api.prepare(blob,'a','b','b.mcaddon'),/seleccionó/);
    await assert.rejects(env.api.prepare({size:10485761},'a','b','b.mcaddon'),/10 MB/);
});

test('requires matching channel, Google origin, peer and receipt before confirming delivery',async()=>{
    const env=environment(), payload={submissionId:'b'.repeat(32)}, response=env.api.send(payload);
    assert.equal(env.frames.length,1);assert.equal(env.frames[0].hidden,true);
    const channel=new URL(env.frames[0].src).searchParams.get('canal');
    env.event({type:'edu-drive-ready',channel},env.peer,'https://evil.example');
    env.event({type:'edu-drive-ready',channel:'wrong'});
    await tick(); assert.equal(env.peer.sent.length,0);
    env.ready();await tick();assert.equal(env.peer.sent.length,1);
    const result={type:'edu-drive-result',channel,submissionId:payload.submissionId,result:{ok:true,receipt:payload.submissionId}};
    env.event(result,{}); env.event({...result,channel:'bad'});
    env.event({...result,submissionId:'wrong'});
    assert.equal(env.timers.size,1);
    env.event(result);assert.equal((await response).ok,true);assert.equal(env.timers.size,0);
    assert.equal(env.peer.sent[0].origin,'https://n-test-script.googleusercontent.com');
});

test('server errors and invalid receipts cannot produce success; retry reuses payload',async()=>{
    const env=environment(), payload={submissionId:'b'.repeat(32)};
    const first=env.api.send(payload);const channel=env.ready();await tick();
    env.event({type:'edu-drive-result',channel,submissionId:payload.submissionId,error:'Buzón cerrado'});
    await assert.rejects(first,/cerrado/);
    const second=env.api.send(payload);await tick();
    env.event({type:'edu-drive-result',channel,submissionId:payload.submissionId,result:{ok:true,receipt:'wrong'}});
    await assert.rejects(second,/no es válida/);
    const third=env.api.send(payload);await tick();
    env.event({type:'edu-drive-result',channel,submissionId:payload.submissionId,result:{ok:true,receipt:payload.submissionId}});
    await third;
    assert.ok(env.peer.sent.every(entry=>entry.data.payload===payload));
});

test('timeouts remove the bridge and allow a new connection',async()=>{
    const env=environment(), payload={submissionId:'b'.repeat(32)};
    const first=env.api.send(payload);
    [...env.timers.values()].find(t=>t.ms===25000).fn();
    await assert.rejects(first,/conectar/);assert.equal(env.frames[0].removed,true);
    const second=env.api.send(payload);env.ready();await tick();
    [...env.timers.values()].find(t=>t.ms===90000).fn();
    await assert.rejects(second,/sin duplicarla/);assert.equal(env.frames[1].removed,true);
});
