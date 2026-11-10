const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');

function environment() {
    const files = [], props = new Map();
    let busy = false, failDescription = false, failModelDescription = false, failRename = false, activeUser = 'teacher@example.test';
    const folder = {
        getId: () => 'class-folder',
        createFolder: () => folder,
        getFiles() { let i = 0; return {hasNext: () => i < files.length, next: () => files[i++]}; },
        createFile(blob) {
            const file = {
                name: blob.name, bytes: blob.bytes, description: '',
                getName() { return this.name; }, getSize() { return this.bytes.length; },
                setName(value) { if (failRename) throw new Error('Rename interrupted'); this.name = value; },
                getDescription() { return this.description; },
                getDateCreated: () => new Date('2026-11-10T12:00:00Z'),
                getBlob() { return {getBytes: () => this.bytes}; },
                setDescription(value) { if (failDescription || (failModelDescription && this.name.endsWith('.bbmodel'))) throw new Error('Drive interrupted'); this.description = value; }
            };
            files.push(file); return file;
        }
    };
    const lock = {waitLock() { if (busy) throw Error('busy'); busy = true; },
        tryLock() { if (busy) return false; busy = true; return true; }, releaseLock() { busy = false; }};
    const context = vm.createContext({console: {log() {}}, Date, JSON,
        Session: {getActiveUser: () => ({getEmail: () => activeUser}),
            getEffectiveUser: () => ({getEmail: () => 'teacher@example.test'})},
        PropertiesService: {getScriptProperties: () => ({getProperty: k => props.get(k), setProperty: (k,v) => props.set(k,v)})},
        LockService: {getScriptLock: () => lock}, DriveApp: {getFolderById: () => folder},
        ScriptApp: {getService: () => ({getUrl: () => null})},
        Utilities: {getUuid: () => '01234567-89ab-cdef-0123-456789abcdef', base64Decode: value => [...Buffer.from(value, 'base64')],
            formatDate: (date, timeZone, pattern) => {
                assert.equal(pattern, 'dd-MM-yy');
                return new Intl.DateTimeFormat('en-GB',{timeZone, day:'2-digit', month:'2-digit', year:'2-digit'}).format(date).replaceAll('/','-');
            },
            DigestAlgorithm: {SHA_256: 'sha256'}, computeDigest: (_, bytes) => [...crypto.createHash('sha256').update(Buffer.from(bytes)).digest()],
            newBlob: (bytes, mime, name) => ({bytes, mime, name,getDataAsString:()=>Buffer.from(bytes).toString('utf8')})},
        HtmlService: {XFrameOptionsMode: {ALLOWALL: 'ALLOWALL'}, createHtmlOutput: html => ({html,
            setTitle() { return this; }, addMetaTag() { return this; }, setXFrameOptionsMode(mode) { this.frameMode = mode; return this; }})}
    });
    vm.runInContext(fs.readFileSync('infrastructure/drive/Code.gs', 'utf8'), context);
    context.prepararBuzon();
    const data = () => ({classCode: '0123456789abcdef0123456789abcdef', alias: 'Alumno 07', creature: 'Dragón azul',
        fileName: 'dragon.mcaddon', submissionId: 'a'.repeat(32), base64: Buffer.from([80,75,3,4,...Array(40).fill(0)]).toString('base64')});
    return {context, files, props, data, busy: value => { busy = value; }, failDescription: value => { failDescription = value; },
        failRename: value => { failRename = value; },
        failModelDescription: value => { failModelDescription = value; },
        activeUser: value => { activeUser = value; }};
}

test('visible teacher commands reject anonymous visitors and other accounts', () => {
    const env = environment(), original = env.props.get('EDU_CLASS');
    for (const identity of ['', 'student@example.test']) {
        env.activeUser(identity);
        for (const command of ['prepararBuzon', 'mostrarBuzon', 'cerrarBuzon']) {
            assert.throws(() => env.context[command](), /solo para el docente/);
        }
        assert.equal(env.props.get('EDU_CLASS'), original);
    }
    // An anonymous student can still submit with a valid class code.
    env.activeUser('');
    assert.equal(env.context.entregarAddon(env.data()).ok, true);
    env.activeUser('teacher@example.test');
    env.context.mostrarBuzon();
    env.context.cerrarBuzon();
    assert.equal(JSON.parse(env.props.get('EDU_CLASS')).open, false);
});

test('saves once, preserves identity on retry and uses a private friendly filename', () => {
    const env = environment(), data = env.data();
    assert.equal(env.context.entregarAddon(data).ok, true);
    assert.equal(env.context.entregarAddon(data).duplicate, true);
    assert.equal(env.files.length, 1);
    assert.match(env.files[0].name, /^Alumno_07_\d{2}-\d{2}-\d{2}\.mcaddon$/);
    assert.equal(JSON.parse(env.files[0].description).alias, 'Alumno 07');
    env.context.prepararBuzon_();
    assert.equal(env.files.length, 1);
});

test('rejects wrong codes, closed and expired classes before writing', () => {
    const env = environment();
    assert.throws(() => env.context.entregarAddon({...env.data(), classCode: 'wrong'}), /código/);
    const config = JSON.parse(env.props.get('EDU_CLASS'));
    env.props.set('EDU_CLASS', JSON.stringify({...config, expiresAt: 1}));
    assert.throws(() => env.context.entregarAddon(env.data()), /cerrada/);
    env.props.set('EDU_CLASS', JSON.stringify(config));
    env.context.cerrarBuzon_();
    env.context.prepararBuzon_();
    assert.throws(() => env.context.entregarAddon(env.data()), /cerrada/);
    assert.equal(env.files.length, 0);
});

test('rejects changed content using the same receipt', () => {
    const env = environment(), data = env.data();
    env.context.entregarAddon(data);
    const changed = Buffer.from(data.base64, 'base64'); changed[10] = 1;
    assert.throws(() => env.context.entregarAddon({...data, base64: changed.toString('base64')}), /cambió/);
    assert.equal(env.files.length, 1);
});

test('rejects invalid file, metadata, size and base64', () => {
    const env = environment();
    for (const patch of [{fileName:'x.exe'}, {base64:'!!!!'}, {base64:Buffer.alloc(24).toString('base64')},
        {base64:'A'.repeat(4*Math.ceil(10485760/3)+4)}, {alias:'\u0000'}, {submissionId:['a'.repeat(32)]}]) {
        assert.throws(() => env.context.entregarAddon({...env.data(), ...patch}));
    }
    assert.equal(env.files.length, 0);
});

test('enforces file and byte quotas; releases locks after failure', () => {
    const env = environment();
    for (let i=0;i<200;i++) env.files.push({getName:()=>`other-${i}`, getSize:()=>10, getDescription:()=>''});
    assert.throws(() => env.context.entregarAddon(env.data()), /lleno/);
    env.files.length=0;
    env.files.push({getName:()=> 'large', getSize:()=>500*1024*1024, getDescription:()=>''});
    assert.throws(() => env.context.entregarAddon(env.data()), /lleno/);
    env.files.length=0;
    assert.equal(env.context.entregarAddon(env.data()).ok, true);
});

test('busy inbox asks for a retry without writing', () => {
    const env = environment(); env.busy(true);
    assert.throws(() => env.context.entregarAddon(env.data()), /otras entregas/);
    assert.equal(env.files.length, 0);
});

test('recovers a save interrupted before its description without creating a duplicate', () => {
    const env = environment(); env.failDescription(true);
    assert.throws(() => env.context.entregarAddon(env.data()), /Drive interrupted/);
    env.failDescription(false);
    assert.equal(env.context.entregarAddon(env.data()).duplicate, true);
    assert.equal(env.files.length, 1);
    assert.match(env.files[0].name, /^Alumno_07_\d{2}-\d{2}-\d{2}\.mcaddon$/);
});

test('uses Madrid calendar date and appends a counter only for distinct uploads with the same name', () => {
    const env = environment();
    assert.equal(env.context.nombreEntrega_('Nicolás', '2026-11-10T23:30:00Z', new Set()), 'Nicolas_11-11-26.mcaddon');
    const data=env.data();
    const first=env.context.entregarAddon(data);
    const second=env.context.entregarAddon({...data, submissionId:'b'.repeat(32)});
    assert.equal(second.fileName, first.fileName.replace('.mcaddon','_2.mcaddon'));
    const retried=env.context.entregarAddon(data);
    assert.equal(retried.fileName,first.fileName);
    assert.equal(env.files.length,2);
});

test('a rename failure keeps the receipt and recovers the same final name on retry', () => {
    const env=environment();env.failRename(true);
    assert.throws(()=>env.context.entregarAddon(env.data()),/Rename interrupted/);
    const expected=JSON.parse(env.files[0].description).fileName;
    env.failRename(false);
    const result=env.context.entregarAddon(env.data());
    assert.equal(result.duplicate,true);assert.equal(result.fileName,expected);assert.equal(env.files.length,1);
});

test('retries recognize legacy receipts and preserve a teacher rename after successful delivery', () => {
    const env=environment(), data=env.data();env.context.entregarAddon(data);
    const file=env.files[0], receipt=JSON.parse(file.description);
    delete receipt.fileName;file.description=JSON.stringify(receipt);
    file.name='Alumno_07__Dragon_azul__'+data.submissionId+'.mcaddon';
    assert.equal(env.context.entregarAddon(data).fileName,file.name);
    file.name='Nombre elegido por el docente.mcaddon';
    assert.equal(env.context.entregarAddon(data).fileName,file.name);
    assert.equal(env.files.length,1);
});

function withModel(data) {
    return {...data,modelBase64:Buffer.from(JSON.stringify({meta:{model_format:'bedrock'},elements:[],textures:[{source:'data:image/png;base64,dGVzdA=='}]})).toString('base64')};
}
test('paired delivery saves matching addon and bbmodel filenames and retries both without duplication',()=>{
    const env=environment(),data=withModel(env.data());
    const result=env.context.entregarAddon(data);
    assert.equal(result.modelFileName,result.fileName.replace('.mcaddon','.bbmodel'));
    assert.equal(env.files.length,2);
    const retry=env.context.entregarAddon(data);
    assert.equal(retry.duplicate,true);assert.equal(retry.modelDuplicate,true);assert.equal(env.files.length,2);
    const second=env.context.entregarAddon({...data,submissionId:'b'.repeat(32)});
    assert.equal(second.fileName,result.fileName.replace('.mcaddon','_2.mcaddon'));
    assert.equal(second.modelFileName,second.fileName.replace('.mcaddon','.bbmodel'));
});
test('invalid bbmodel is rejected before creating the addon and changed model cannot reuse a receipt',()=>{
    const env=environment(),data=withModel(env.data());
    for(const modelBase64 of ['',Buffer.from('{}').toString('base64'),Buffer.from('broken').toString('base64')]){
        assert.throws(()=>env.context.entregarAddon({...data,modelBase64}));assert.equal(env.files.length,0);
    }
    env.context.entregarAddon(data);
    const model=JSON.parse(Buffer.from(data.modelBase64,'base64').toString());model.elements.push({name:'changed'});
    assert.throws(()=>env.context.entregarAddon({...data,modelBase64:Buffer.from(JSON.stringify(model)).toString('base64')}),/cambió/);
    assert.equal(env.files.length,2);
});
test('a partial pair completes on retry including an addon saved by an older receiver',()=>{
    const env=environment(),data=withModel(env.data());
    env.context.entregarAddon(env.data());
    const result=env.context.entregarAddon(data);
    assert.equal(result.duplicate,true);assert.equal(result.modelDuplicate,false);assert.equal(env.files.length,2);
    const modelFile=env.files.find(f=>f.name.endsWith('.bbmodel'));modelFile.name='__edu_pending_'+data.submissionId+'.bbmodel';
    const retried=env.context.entregarAddon(data);
    assert.equal(retried.modelDuplicate,true);assert.equal(env.files.length,2);
    assert.equal(modelFile.name,result.modelFileName);
});

test('a failure after saving the model bytes cannot confirm the pair and is recoverable',()=>{
    const env=environment(),data=withModel(env.data());env.failModelDescription(true);
    assert.throws(()=>env.context.entregarAddon(data),/Drive interrupted/);
    assert.equal(env.files.length,2);
    env.failModelDescription(false);
    const result=env.context.entregarAddon(data);
    assert.equal(result.duplicate,true);assert.equal(result.modelDuplicate,true);assert.equal(env.files.length,2);
    assert.equal(result.modelFileName,result.fileName.replace('.mcaddon','.bbmodel'));
});

test('escapes class query input and emits syntactically valid browser script', () => {
    const env = environment();
    const html = env.context.doGet({parameter:{clase:'</script><script>alert(1)</script>'}}).html;
    assert.ok(!html.includes('const classCode = "</script>'));
    const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
    new vm.Script(script);
    assert.match(script, /\\\.mcaddon\$/);
});

test('editor transport permits only known editor origins and random channels', () => {
    const env = environment();
    for (const origen of ['https://evil.example', 'https://nchiari.github.io.evil.example',
        'https://blockbench-edu.pages.dev.evil.example', 'https://other.pages.dev',
        'https://preview.blockbench-edu.pages.dev', 'http://blockbench-edu.pages.dev', 'null']) {
        assert.throws(() => env.context.doGet({parameter:{modo:'editor', origen, canal:'a'.repeat(32)}}), /no válida/);
    }
    assert.throws(() => env.context.doGet({parameter:{modo:'editor', origen:'https://nchiari.github.io', canal:'short'}}));
    const output = env.context.doGet({parameter:{modo:'editor', origen:'http://localhost:4173', canal:'a'.repeat(32)}});
    assert.equal(output.frameMode, 'ALLOWALL');
    new vm.Script(output.html.match(/<script>([\s\S]*)<\/script>/)[1]);
    for (const origen of ['https://blockbench-edu.pages.dev', 'https://nchiari.github.io', 'http://127.0.0.1:4173']) {
        const bridge = env.context.doGet({parameter:{modo:'editor', origen, canal:'a'.repeat(32)}});
        assert.equal(bridge.frameMode, 'ALLOWALL');
        new vm.Script(bridge.html.match(/<script>([\s\S]*)<\/script>/)[1]);
    }
    assert.equal(env.context.doGet({parameter:{}}).frameMode, undefined);
});

test('embedded receiver ignores unknown windows, origins and channels and forwards only uploads', () => {
    const env = environment(), replies = [], calls = [];
    const top = {postMessage: (message, origin) => replies.push({message, origin})};
    let listener, success;
    const run = {withSuccessHandler(fn) { success=fn; return this; }, withFailureHandler() { return this; },
        entregarAddon(payload) { calls.push(payload); }};
    const sandbox = {window:{top, addEventListener: (_, fn) => {listener=fn;}}, google:{script:{run}}};
    const origin='https://blockbench-edu.pages.dev', channel='a'.repeat(32);
    vm.runInNewContext(env.context.puenteEditor_(origin, channel).match(/<script>([\s\S]*)<\/script>/)[1], sandbox);
    assert.equal(replies[0].message.type, 'edu-drive-ready');
    const event = {origin, source:top, data:{channel, type:'edu-drive-upload', payload:{submissionId:'b'.repeat(32)}}};
    listener({...event, origin:'https://evil.example'}); listener({...event, source:{}});
    listener({...event, data:{...event.data, channel:'wrong'}});
    listener({...event, data:{...event.data, type:'cerrarBuzon'}});
    assert.equal(calls.length, 0);
    listener(event); listener(event);
    assert.equal(calls.length, 1);
    success({ok:true, receipt:event.data.payload.submissionId});
    assert.equal(replies[1].message.type, 'edu-drive-result');
    assert.equal(replies[1].origin, origin);
});
