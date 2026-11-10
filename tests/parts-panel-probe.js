// Run with playwright-cli run-code after classroom-ui-probe.js (its temporary zombie project).
async (page) => {
    await page.waitForSelector('#edu-classroom');
    const report = {checks: [], layouts: []};
    const check = (ok, message) => { if (!ok) throw new Error(message); report.checks.push(message); };
    const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const visible = () => page.evaluate(() => Cube.all.filter(cube => cube.visibility).map(cube => cube.parent.name).sort());
    const geometryAndPaint = () => page.evaluate(() => JSON.stringify({
        cubes: Cube.all.map(cube => [cube.uuid, cube.from, cube.to, cube.rotation, Object.entries(cube.faces).map(([name, face]) => [name, face.uv, face.texture])]),
        png: Texture.all[0].canvas.toDataURL(), undo: Undo.index
    }));
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.clearDeviceMetricsOverride');
    await page.setViewportSize({width: 1366, height: 768});
    await page.evaluate(() => {
        const view = document.getElementById('edu-classroom').__vue__;
        view.sidebarWidth = 260; view.cameraControlsOpen = false; view.partsOpen = true; view.setMode('paint'); view.showAllBones();
        window.eduPartsBaseline = Codecs.bedrock.compile({raw: true})['minecraft:geometry'][0];
    });
    await settle();
    check(await page.locator('#edu-parts-panel').isVisible(), 'Parts panel available in Paint');
    const original = await geometryAndPaint();
    const bone = await page.evaluate(() => {
        const view = document.getElementById('edu-classroom').__vue__;
        return Object.fromEntries(['head', 'body', 'hat', 'rightArm'].map(name => {
            const group = Group.all.find(group => group.name === name);
            return [name, {...view.bones.find(bone => bone.id === group.uuid)}];
        }));
    });
    await page.getByRole('button', {name: 'Ocultar ' + bone.head.label, exact: true}).click();
    check(!(await visible()).includes('head') && !(await visible()).includes('hat'), 'Hiding head also hides its child layer');
    await page.getByRole('button', {name: '1 · Dale forma', exact: true}).click();
    check(!(await visible()).includes('head'), 'Hidden parts remain hidden in Shape');
    await page.getByRole('button', {name: '2 · Dale color', exact: true}).click();
    check(!(await visible()).includes('head'), 'Hidden parts remain hidden on return to Paint');
    await page.getByRole('button', {name: 'Mostrar ' + bone.hat.label, exact: true}).click();
    check((await visible()).includes('head') && (await visible()).includes('hat'), 'Showing child reveals hidden parent');
    const allVisibleBeforeSolo = await visible();
    await page.getByRole('button', {name: 'Ver solo ' + bone.body.label, exact: true}).click();
    const restoreSolo = page.getByRole('button', {name: 'Volver a la vista anterior', exact: true});
    check(await restoreSolo.getAttribute('aria-pressed') === 'true' && await restoreSolo.evaluate(el=>el.classList.contains('active')), 'Solo button remains visibly active after the pointer leaves it');
    await restoreSolo.click();
    check(JSON.stringify(await visible()) === JSON.stringify(allVisibleBeforeSolo), 'Second Solo click restores the previous complete view');
    check(await page.locator('.edu-part-solo[aria-pressed="true"]').count() === 0, 'Restoring the previous view clears the active Solo button');
    await page.getByRole('button', {name:'Ocultar '+bone.hat.label,exact:true}).click();
    const partialViewBeforeSolo = await visible();
    await page.getByRole('button', {name:'Ver solo '+bone.head.label,exact:true}).click();
    await page.getByRole('button', {name:'Ver solo '+bone.body.label,exact:true}).click();
    await page.getByRole('button', {name:'1 · Dale forma',exact:true}).click();
    await page.getByRole('button', {name:'2 · Dale color',exact:true}).click();
    await restoreSolo.click();
    check(JSON.stringify(await visible()) === JSON.stringify(partialViewBeforeSolo), 'Changing isolated parts and modes retains the prior eye visibility settings');
    await page.getByRole('button', {name:'Mostrar todas',exact:true}).click();
    await page.getByRole('button', {name: 'Ver solo ' + bone.body.label, exact: true}).click();
    check(JSON.stringify(await visible()) === JSON.stringify(['body']), 'Solo Body shows only its cubes, independent of child bones');
    await page.getByRole('button', {name: 'Ver solo ' + bone.head.label, exact: true}).click();
    check(JSON.stringify(await visible()) === JSON.stringify(['head']), 'Solo Head hides all other parts including its separate layer');
    await page.getByRole('button', {name: 'Mostrar ' + bone.rightArm.label, exact: true}).click();
    check(JSON.stringify(await visible()) === JSON.stringify(['head', 'rightArm']), 'An eye can add another part while isolated');
    check(await page.locator('.edu-part-solo[aria-pressed="true"]').count() === 0, 'Manual eye changes leave Solo mode and clear its active indicator');
    await page.getByRole('button', {name: 'Ocultar ' + bone.rightArm.label, exact: true}).click();
    check(JSON.stringify(await visible()) === JSON.stringify(['head']), 'An eye can hide an added part while isolated');
    await page.getByRole('button', {name: 'Plegar panel de partes', exact: true}).click();
    await settle();
    const closedWidth = await page.locator('#preview').evaluate(el => el.getBoundingClientRect().width);
    const toggle = page.locator('.edu-parts-toggle');
    check(await toggle.isVisible() && (await toggle.innerText()).includes('6 ocultas'), 'Collapsed control remains visible and counts hidden parts');
    check(await toggle.evaluate(el => el === document.activeElement), 'Closing restores keyboard focus to the launcher');
    await toggle.click(); await settle();
    check(closedWidth > await page.locator('#preview').evaluate(el => el.getBoundingClientRect().width), 'Folding panel returns space to the preview');
    check(await page.getByRole('button', {name:'Plegar panel de partes', exact:true}).evaluate(el => el === document.activeElement), 'Opening moves keyboard focus into the panel');
    await page.keyboard.press('Escape');
    check(await toggle.isVisible(), 'Escape folds the parts panel');
    await toggle.click();
    check(original === await geometryAndPaint(), 'Visibility and layout actions preserve geometry, UV, PNG and undo history');

    await page.getByRole('button', {name:'1 · Dale forma', exact:true}).click();
    await page.evaluate(() => {
        const view = document.getElementById('edu-classroom').__vue__;
        const head = Cube.all.find(cube => cube.parent.name === 'head');
        view.selectPiece(head.uuid);
    });
    await page.getByRole('button', {name:'Aumentar Ancho', exact:true}).click();
    check(JSON.stringify(await visible()) === JSON.stringify(['head']), 'Resizing an isolated part preserves isolation');
    await page.getByRole('button', {name:'Deshacer', exact:true}).click();
    check(JSON.stringify(await visible()) === JSON.stringify(['head']), 'Undo preserves isolation');
    await page.getByRole('button', {name:'Rehacer', exact:true}).click();
    check(JSON.stringify(await visible()) === JSON.stringify(['head']), 'Redo preserves isolation');
    await page.getByRole('button', {name:'Deshacer', exact:true}).click();
    check(original === await geometryAndPaint(), 'Undo restores geometry and texture exactly with other parts hidden');
    await page.getByRole('button', {name:'2 · Dale color', exact:true}).click();

    // Observe the bytes while keeping the native download path active.
    await page.evaluate(() => {
        window.eduPartsNativeExport = Blockbench.export;
        Blockbench.export = function(options, callback) { window.eduPartsExportBlob = options.content; return eduPartsNativeExport.call(this, options, callback); };
    });
    try {
        const pendingDownload = page.waitForEvent('download');
        await page.getByRole('button', {name:'3 · Guardar y compartir', exact:true}).click();
        await page.getByRole('button', {name:/^Llevar a Minecraft/}).click();
        const download = await pendingDownload;
        await download.saveAs('output/parts-panel-hidden.mcaddon');
        const exported = await page.evaluate(async () => {
            const zip = await JSZip.loadAsync(await eduPartsExportBlob.arrayBuffer());
            const path = Object.keys(zip.files).find(path => /models\/entity\/.*\.json$/.test(path));
            const geometry = JSON.parse(await zip.file(path).async('string'))['minecraft:geometry'][0];
            return {sameBones: JSON.stringify(geometry.bones) === JSON.stringify(eduPartsBaseline.bones),
                cubes: geometry.bones.reduce((total, bone) => total + (bone.cubes?.length || 0), 0)};
        });
        check(exported.sameBones && exported.cubes === 7, 'Native download includes all seven original cubes while only Head is visible');
        check(JSON.stringify(await visible()) === JSON.stringify(['head']), 'Export preserves the current hidden parts');
        report.export = exported;
        await page.getByRole('button', {name:'Seguir creando',exact:true}).click();
    } finally {
        await page.evaluate(() => { Blockbench.export = eduPartsNativeExport; delete window.eduPartsNativeExport; delete window.eduPartsExportBlob; });
    }
    await page.getByRole('button', {name:'Mostrar todas',exact:true}).click();
    check((await visible()).length === 7, 'Show All restores the complete initial model');
    check(original === await geometryAndPaint(), 'Export and Show All preserve geometry, texture and undo index');

    for (const [w,h] of [[1366,768], [1280,720], [1024,768]]) for (const zoom of [1,1.25]) for (const wide of [false,true]) {
        await cdp.send('Emulation.setDeviceMetricsOverride', {width:Math.floor(w/zoom),height:Math.floor(h/zoom),deviceScaleFactor:zoom,mobile:false});
        await page.evaluate(wide => {
            const view = document.getElementById('edu-classroom').__vue__;
            view.sidebarWidth = wide ? view.sidebarMax : 260; view.cameraControlsOpen = true; view.partsOpen = true;
        }, wide);
        await settle();
        const row = await page.evaluate(() => {
            const rect = selector => document.querySelector(selector).getBoundingClientRect();
            const panel=rect('#edu-parts-panel'),preview=rect('#preview'),list=rect('.edu-parts-list'),help=rect('.edu-parts-help'),footer=rect('#edu-classroom footer');
            const listBottomLimit = document.querySelector('.edu-parts-help').getClientRects().length ? help.top : panel.bottom-8;
            const fixedBefore = rect('.edu-parts-show-all').top;
            document.querySelector('.edu-parts-list').scrollTop = 99999;
            return {panelVisible:panel.top>=0 && panel.bottom<=innerHeight, noModelOverlap:preview.right<=panel.left,
                noFooterOverlap:panel.bottom<=footer.top, previewWidth:preview.width, listHeight:list.height,
                listContained:list.bottom<=listBottomLimit && list.top>=rect('.edu-parts-count').bottom,
                fixedShowAll:fixedBefore===rect('.edu-parts-show-all').top};
        });
        check(row.panelVisible && row.noModelOverlap && row.noFooterOverlap && row.previewWidth>=200 && row.listHeight>0 && row.listContained && row.fixedShowAll,
            `Parts layout ${JSON.stringify({w,h,zoom,wide,...row})}`);
        report.layouts.push({w,h,zoom,wide,...row});
    }
    await cdp.send('Emulation.clearDeviceMetricsOverride');
    await page.setViewportSize({width:1366,height:768});
    await page.evaluate(() => {
        const view=document.getElementById('edu-classroom').__vue__;
        view.sidebarWidth=260;view.cameraControlsOpen=false;view.setMode('paint');
        view.showOnlyBone(Group.all.find(group=>group.name==='head').uuid);
    });
    await settle();
    await page.screenshot({path:'output/playwright/parts-panel-final.png'});
    if (await page.evaluate(() => window.BlockbenchEduWeb?.role === 'student')) {
        check(await page.locator('.edu-teacher').count()===0,'Student stays in classroom');
    } else {
        await page.getByRole('button',{name:'Para el docente',exact:true}).click();
        check((await visible()).length===7,'Teacher mode restores all parts for native editing');
        check(await page.evaluate(() => !document.body.style.getPropertyValue('--edu-parts-inset')), 'Teacher mode removes the panel layout reservation');
        await page.locator('#edu-return-students').click();
        check(await page.locator('#edu-parts-panel').isVisible(), 'Returning to students restores the open panel');
    }
    return report;
}
