// Run with playwright-cli run-code --filename tests/session-project-probe.js on a fresh local student entry.
async (page) => {
    const results = [];
    const check = (ok,message) => { if (!ok) throw new Error(message); results.push(message); };
    const button = name => page.getByRole('button',{name,exact:true});
    const waitTexture = () => page.waitForFunction(() => Texture.all[0].img.complete &&
        Texture.all[0].img.naturalWidth === Project.texture_width && Texture.all[0].img.naturalHeight === Project.texture_height);
    // Keep native import/read callbacks, but attach the input so the CLI can
    // supply files without interrupting run-code with an OS chooser.
    const attachPicker = () => page.evaluate(() => {
        const click = HTMLInputElement.prototype.click;
        HTMLInputElement.prototype.click = function() {
            if (this.type === 'file') { this.hidden=true; document.body.append(this); }
            else click.call(this);
        };
    });
    const choose = async file => {
        await button('Abrir una criatura').click();
        await page.locator('input[type=file][accept=".bbedu"]').last().setInputFiles(file);
    };
    const state = () => page.evaluate(() => JSON.stringify({
        geometry:Codecs.bedrock.compile({raw:true}), png:Texture.all[0].canvas.toDataURL(),
        ids:Cube.all.map(c => c.uuid), texture:Texture.all[0].uuid, name:Project.name
    }));
    // Native undo restores bitmaps asynchronously, after its click handler returns.
    const waitState = expected => page.waitForFunction(expected => JSON.stringify({
        geometry:Codecs.bedrock.compile({raw:true}), png:Texture.all[0].canvas.toDataURL(),
        ids:Cube.all.map(c => c.uuid), texture:Texture.all[0].uuid, name:Project.name
    }) === expected, expected, {timeout:5000});
    const download = async name => {
        if (name === 'Llevar a Minecraft' || (name === 'Guardar mi criatura' && await page.locator('#edu-classroom').count())) {
            await button('4 · Guardar y exportar').click();
            await page.locator('#blockbench_edu_save_options').waitFor();
            if (name === 'Guardar mi criatura') name = 'Guardar para seguir editando';
        }
        const pending = page.waitForEvent('download');
        await page.getByRole('button',{name,exact:name !== 'Llevar a Minecraft' && name !== 'Guardar para seguir editando'}).click();
        return await pending;
    };
    await button('Comenzar').click();
    await page.locator('#blockbench_edu_wizard .search_bar input').fill('zombi');
    await page.locator('.edu-catalog>li').filter({hasText:/^Zombi$/}).click();
    await button('Siguiente').click(); await button('Abrir editor').click();
    await page.locator('#edu-classroom').waitFor();
    await button('Aumentar Ancho').click();
    await waitTexture();
    await button('Mover').click(); await button('Mover Arriba / abajo más').click();
    await button('Girar').click(); await button('Girar más: Girar').click();
    await page.evaluate(() => {
        const texture = Texture.all[0];
        Undo.initEdit({textures:[texture],bitmap:true});
        texture.ctx.fillStyle = '#df347c'; texture.ctx.fillRect(0,0,12,12);
        texture.updateChangesAfterEdit(); Undo.finishEdit('Pintura de prueba');
        window.probeExport = Blockbench.export;
        Blockbench.export = function(options,callback) { window.probeLastExport = options; return window.probeExport(options,callback); };
    });
    await page.waitForFunction(() => Texture.all[0].img.complete);
    const before = await state();
    const limits = await page.evaluate(() => document.getElementById('edu-classroom').__vue__.maximum.slice());
    await button('4 · Guardar y exportar').click();
    const options = page.locator('#blockbench_edu_save_options');
    check(await options.getByRole('button',{name:/^Guardar para seguir editando/}).isVisible() &&
        await options.getByRole('button',{name:/^Llevar a Minecraft/}).isVisible(),
        'Third step offers both editable project and Minecraft addon downloads');
    check(await options.getByRole('button',{name:/^Entregar al profe/}).count()===0,
        'Save options omit classroom delivery when no class is configured');
    await page.setViewportSize({width:1024,height:768});
    await page.screenshot({path:'output/playwright/save-options-1024.png'});
    await button('Seguir creando').click();
    check(await state()===before,'Closing save options leaves the creature unchanged');
    const firstAddon = await download('Llevar a Minecraft');
    await firstAddon.saveAs('output/playwright/session-before.mcaddon');
    await button('Seguir creando').click();
    await button('2 · Dale color').click();
    await page.evaluate(() => {
        const ui = document.getElementById('edu-classroom').__vue__;
        ui.toggleBone(ui.bones[0].id);
    });
    const saved = await download('Guardar mi criatura');
    check(saved.suggestedFilename().endsWith('.bbedu'),'Downloads a portable .bbedu project');
    await saved.saveAs('output/playwright/session-roundtrip.bbedu');
    const archive = await page.evaluate(async () => {
        const zip = await JSZip.loadAsync(await window.probeLastExport.content.arrayBuffer());
        const data = JSON.parse(await zip.file('project.json').async('string'));
        window.probeArchive = data;
        return {lastVersion:data.state.lastVersion,visible:data.model.elements.filter(c => c.type==='cube').every(c => c.visibility !== false),
            hasSource:!!zip.file('reference.mcaddon'),hasClass:JSON.stringify(data).includes('classCode')};
    });
    check(archive.visible,'Temporary hidden parts are saved as part of the complete creature');
    check(archive.hasSource && !archive.hasClass,'Includes the base addon without classroom access data');
    check(archive.lastVersion.join('.')==='1.0.1','Preserves the exported addon version');
    await button('Seguir creando').click();
    // A fresh page must recover the work using the file alone.
    await page.evaluate(() => {Project.saved = true;});
    await page.reload();
    await button('Abrir una criatura').waitFor();
    await attachPicker();
    await choose('output/playwright/session-roundtrip.bbedu');
    await page.locator('#edu-classroom').waitFor();
    check(await state() === before,'Fresh-page load restores exact geometry, rotation, position, paint, IDs and name');
    check(JSON.stringify(await page.evaluate(() => document.getElementById('edu-classroom').__vue__.maximum)) === JSON.stringify(limits),
        'Reopening preserves the original size limits');
    check(await page.evaluate(() => Undo.history.length===0),'Reopened project starts with a fresh undo history');
    await button('Aumentar Ancho').click();
    await waitTexture();
    check(await state() !== before,'Reopened creature can be resized');
    await button('Deshacer').click();
    await waitTexture();
    await waitState(before);
    check(await state() === before,'Undo after reopening restores geometry and paint exactly');
    await button('Rehacer').click(); await waitTexture(); await button('Deshacer').click(); await waitState(before);
    await button('2 · Dale color').click();
    await page.evaluate(() => {
        const texture = Texture.all[0];
        Undo.initEdit({textures:[texture],bitmap:true});
        texture.ctx.fillStyle='#00ff00'; texture.ctx.fillRect(0,0,2,2);
        texture.updateChangesAfterEdit(); Undo.finishEdit('Pintar después de abrir');
    });
    await waitTexture();
    check(await state() !== before,'Reopened creature accepts new paint');
    await button('Deshacer').click();
    await waitTexture();
    await waitState(before);
    check(await state() === before,'Undo restores the saved paint after a new paint edit');
    await button('1 · Dale forma').click();
    await page.evaluate(() => {
        window.probeExport = Blockbench.export;
        Blockbench.export = function(options,callback) {window.probeLastExport=options; return window.probeExport(options,callback);};
    });
    const secondAddon = await download('Llevar a Minecraft');
    await secondAddon.saveAs('output/playwright/session-after.mcaddon');
    const manifests = await page.evaluate(async () => {
        const zip = await JSZip.loadAsync(await window.probeLastExport.content.arrayBuffer());
        const bp = JSON.parse(await zip.file('BP/manifest.json').async('string'));
        const rp = JSON.parse(await zip.file('RP/manifest.json').async('string'));
        return {bp,rp};
    });
    check(manifests.bp.header.version.join('.')==='1.0.2' && manifests.rp.header.version.join('.')==='1.0.2',
        'Reopened project exports synchronized addon version 1.0.2');
    check(manifests.bp.dependencies.some(d=>d.uuid===manifests.rp.header.uuid) &&
        manifests.rp.dependencies.some(d=>d.uuid===manifests.bp.header.uuid),'Export preserves cross-dependencies');
    await button('Seguir creando').click();
    const oldId = await page.evaluate(() => Project.uuid);
    await choose({name:'roto.bbedu',mimeType:'application/zip',buffer:Buffer.from('invalid')});
    await page.getByText('No pudimos abrir la criatura',{exact:true}).waitFor();
    check(await page.evaluate(id=>Project.uuid===id,oldId) && await state()===before,
        'Invalid file leaves the current creature untouched');
    await button('Volver').click();
    await choose('output/playwright/session-roundtrip.bbedu');
    await page.waitForFunction(id=>Project.uuid!==id,oldId);
    await page.locator('#edu-classroom').waitFor();
    check(await page.evaluate(id=>ModelProject.all.some(p=>p.uuid===id),oldId),'Opening a project preserves the existing project in its own tab');
    await page.setViewportSize({width:1024,height:768});
    await page.screenshot({path:'output/playwright/session-restored-1024.png'});
    check(await button('Guardar mi criatura').isVisible() && await button('Abrir una criatura').isVisible(),
        'Save and open remain visible at 1024 × 768');
    await page.evaluate(() => { for (const p of ModelProject.all) p.saved=true; });
    await page.reload();
    await button('Cancelar').click();
    await attachPicker();
    await choose({name:'roto.bbedu',mimeType:'application/zip',buffer:Buffer.from('invalid')});
    await page.getByText('No pudimos abrir la criatura',{exact:true}).waitFor();
    check(await button('Volver').isVisible(),'Invalid project notice is accessible above the home screen');
    await button('Volver').click();
    await choose('output/playwright/session-roundtrip.bbedu');
    await page.locator('#edu-classroom').waitFor();
    check(await state()===before,'Home screen can reopen the saved creature');
    const base = new URL('./',page.url()).href;
    await page.evaluate(() => { for (const p of ModelProject.all) p.saved=true; });
    await page.goto(base+'docente/');
    await button('Abrir una criatura').waitFor();
    await attachPicker();
    await choose('output/playwright/session-roundtrip.bbedu');
    await page.locator('.edu-probe button').filter({hasText:'Guardar mi criatura'}).waitFor();
    check(await state()===before && await page.locator('#edu-classroom').count()===0,
        'Teacher entry opens the project in the full editor');
    const teacherSave = await download('Guardar mi criatura');
    check(teacherSave.suggestedFilename().endsWith('.bbedu'),'Teacher can also save the editable project');
    await button('Seguir creando').click();
    return {passed:results.length,results};
}
