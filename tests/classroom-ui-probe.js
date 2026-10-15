// Run with playwright-cli run-code on a fresh Edu web tab.
// Layout zoom uses the equivalent CSS viewport, not a physical touchpad test.
async (page) => {
    const assert = (ok, message) => { if (!ok) throw new Error(message); };
    const report = {wizard: [], editor: [], cameras: [], touchpad: 'Pending manual user test'};
    const cdp = await page.context().newCDPSession(page);
    const viewport = async (w, h, zoom) => {
        const width = Math.floor(w / zoom), height = Math.floor(h / zoom);
        await cdp.send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: zoom, mobile: false});
        await page.waitForFunction(({width, height}) => innerWidth === width && innerHeight === height, {width, height});
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    };
    await page.waitForFunction(() => typeof ModelLoader !== 'undefined' && ModelLoader.loaders.blockbench_edu);
    await page.evaluate(() => { if (!Dialog.open?.content_vue?.steps) ModelLoader.loaders.blockbench_edu.onStart(); });
    await page.evaluate(() => { Dialog.open.content_vue.step = 1; });
    assert(await page.getByRole('button', {name:'Siguiente', exact:true}).isDisabled(), 'Initial Next must be disabled');
    assert(await page.evaluate(() => Dialog.open.content_vue.creature === ''), 'No initial creature');
    const catalog = await page.evaluate(() => {
        const w = Dialog.open.content_vue;
        const sorted = list => list.every((entry,i) => !i || list[i-1][1].name.localeCompare(entry[1].name,'es',{sensitivity:'base'}) <= 0);
        const complete = sorted(w.choices), count = w.choices.length;
        w.search = 'ara'; const filtered = sorted(w.choices); w.search = '';
        return {complete, filtered, count};
    });
    assert(catalog.complete && catalog.filtered, 'Spanish catalog ordering'); report.catalog = catalog;
    for (const [w,h] of [[1366,768],[1280,720],[1024,768]]) for (const zoom of [1,1.25]) {
        await viewport(w,h,zoom);
        const row = await page.evaluate(() => {
            const scroll = document.querySelector('.edu-wizard-scroll'), footer = document.querySelector('.edu-wizard-footer');
            const before = footer.getBoundingClientRect().toJSON(); scroll.scrollTop = scroll.scrollHeight;
            const after = footer.getBoundingClientRect().toJSON();
            return {visible:after.top>=0 && after.bottom<=innerHeight, stationary:before.top===after.top, cards:document.querySelector('.edu-catalog>li').offsetWidth};
        });
        assert(row.visible && row.stationary && row.cards >= 160, `Wizard layout ${w}/${zoom}`);
        report.wizard.push({w,h,zoom,...row});
    }
    await viewport(1366,768,1);
    await page.locator('.edu-catalog>li').first().focus(); await page.keyboard.press('Enter');
    assert(!await page.getByRole('button',{name:'Siguiente',exact:true}).isDisabled(), 'Keyboard card selection enables Next');
    await page.evaluate(async () => { const w=Dialog.open.content_vue; w.creature='zombie'; w.step=2; await w.next(); });
    assert(!await page.locator('#edu-camera-controls').count(), 'Camera panel initially closed');
    for (const [w,h] of [[1366,768],[1280,720],[1024,768]]) for (const zoom of [1,1.25]) {
        await viewport(w,h,zoom);
        for (const wide of [false,true]) for (const paint of [false,true]) {
            await page.evaluate(({wide,paint}) => {
                const v=document.getElementById('edu-classroom').__vue__;
                v.sidebarWidth=wide?v.sidebarMax:260; v.setMode(paint?'paint':'shape'); v.cameraControlsOpen=true;
            },{wide,paint});
            await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
            const row = await page.evaluate(() => {
                const rect=s=>document.querySelector(s).getBoundingClientRect();
                const history=rect('.edu-history'), scroll=rect('.edu-sidebar-scroll'), preview=rect('#preview'), footer=rect('#edu-classroom footer');
                const before=history.top; document.querySelector('.edu-sidebar-scroll').scrollTop=99999;
                return {historyVisible:history.top>=0 && history.bottom<=innerHeight, historyFixed:before===rect('.edu-history').top,
                    separated:scroll.bottom<=history.top, noOverlap:preview.bottom<=footer.top, previewHeight:preview.height,
                    sidebarWidth:rect('#edu-classroom aside').width, footerVisible:footer.top>=84 && footer.bottom<=innerHeight,
                    returnHidden:document.getElementById('edu-return-students').hidden};
            });
            assert(row.historyVisible && row.historyFixed && row.separated && row.noOverlap && row.footerVisible && row.previewHeight>60 && row.returnHidden,
                `Editor layout ${JSON.stringify({w,h,zoom,wide,paint,...row})}`);
            report.editor.push({w,h,zoom,wide,paint,...row});
        }
    }
    await viewport(1366,768,1);
    const documentState = () => page.evaluate(() => JSON.stringify({id:Project.uuid,index:Undo.index,
        cubes:Cube.all.map(c=>[c.uuid,c.from,c.to,c.rotation,Object.entries(c.faces).map(([name,f])=>[name,f.uv,f.texture,f.rotation])]),png:Texture.all[0].canvas.toDataURL()}));
    for (const paint of [false,true]) for (const ortho of [false,true]) {
        await page.evaluate(({paint,ortho})=>{let v=document.getElementById('edu-classroom').__vue__; v.setMode(paint?'paint':'shape');v.camera('frame');v.camera(ortho?'front':'orbit');},{paint,ortho});
        const original = await documentState();
        const labels=['Girar la vista a la izquierda','Girar la vista a la derecha','Girar la vista hacia arriba','Girar la vista hacia abajo',
            'Desplazar la vista a la izquierda','Desplazar la vista a la derecha','Desplazar la vista hacia arriba','Desplazar la vista hacia abajo','Acercar la vista','Alejar la vista'];
        for (const label of labels) {
            const button=page.getByRole('button',{name:label,exact:true});
            if (ortho && label.startsWith('Girar')) { assert(await button.isDisabled(),'Ortho rotation disabled'); continue; }
            const cameraState=()=>page.evaluate(()=>JSON.stringify([Preview.selected.camera.position.toArray(),Preview.selected.controls.target.toArray(),Preview.selected.camera.zoom]));
            const before=await cameraState(); await button.click(); const changed=before!==await cameraState();
            assert(changed, `Camera action ${label}`); assert(original===await documentState(), `Camera must not edit project ${label}`);
            report.cameras.push({paint,ortho,label,changed});
        }
    }
    const original = await documentState();
    await page.getByRole('button',{name:'Para el docente',exact:true}).click();
    const returnButton=page.locator('#edu-return-students'); assert(await returnButton.isVisible(),'Independent teacher return visible');
    await returnButton.click(); assert(original===await documentState(),'Teacher round trip preserves project');
    assert(await returnButton.isHidden(),'Teacher return hidden in classroom');
    await page.screenshot({path:'output/playwright/feedback-final.png'});
    return report;
}
