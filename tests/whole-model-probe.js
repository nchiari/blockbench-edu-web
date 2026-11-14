// Run with playwright-cli run-code on a fresh student preview tab.
async (page) => {
    const checks = [];
    const check = (ok, label) => {if (!ok) throw new Error(label); checks.push(label);};
    await page.waitForFunction(() => typeof ModelLoader !== 'undefined' && ModelLoader.loaders.blockbench_edu);
    await page.evaluate(async () => {const w=Dialog.open.content_vue; w.creature='zombie'; w.step=2; await w.next();});
    await page.waitForSelector('#edu-classroom');
    const selector = page.locator('#edu-classroom aside select').first();
    await selector.selectOption('__model__');
    check(await page.getByText('Estás cambiando todo el modelo.', {exact:true}).isVisible(), 'Whole-model scope is explicit');
    const snapshot = () => page.evaluate(() => JSON.stringify({cubes:Cube.all.map(c=>[c.uuid,c.from,c.to,c.origin,c.rotation,c.inflate,c.visibility,Object.entries(c.faces).map(([n,f])=>[n,f.uv])]),groups:Group.all.map(g=>[g.uuid,g.origin,g.rotation]),png:Texture.all[0].canvas.toDataURL()}));
    // Include hidden shells, nested bones and pre-existing rotations.
    await page.evaluate(() => {
        const v=document.getElementById('edu-classroom').__vue__;
        v.toggleBone(Group.all.find(g=>g.name==='head').uuid);
    });
    const initial = await snapshot();
    const before = await page.evaluate(() => Cube.all.map(c=>({from:c.from.slice(),to:c.to.slice(),origin:c.origin.slice(),inflate:c.inflate})));
    await page.getByRole('button',{name:'Aumentar todo el modelo',exact:true}).click();
    const scaled = await snapshot();
    check(await page.evaluate(before => Cube.all.every((c,i)=>['from','to','origin'].every(k=>c[k].every((v,j)=>Math.abs(v-before[i][k][j]*1.1)<1e-8))) ,before), 'Uniform scaling includes positions, dimensions and pivots of hidden parts');
    await page.getByRole('button',{name:'Deshacer',exact:true}).click();
    check(initial === await snapshot(), 'Scale undo restores geometry, bones, UVs and painting exactly');
    await page.getByRole('button',{name:'Rehacer',exact:true}).click();
    check(scaled === await snapshot(), 'Scale redo restores geometry and painting exactly');
    await page.getByRole('button',{name:'Deshacer',exact:true}).click();
    await page.getByRole('button',{name:'Mover',exact:true}).click();
    await page.getByRole('button',{name:'Mover Arriba / abajo más',exact:true}).click();
    check(await page.evaluate(before=>Cube.all.every((c,i)=>Math.abs(c.from[1]-before[i].from[1]-1)<1e-8 && Math.abs(c.origin[1]-before[i].origin[1]-1)<1e-8),before), 'Move translates the whole model and pivots by one unit');
    await page.getByRole('button',{name:'Deshacer',exact:true}).click();
    check(initial === await snapshot(), 'Move undo restores all cube and bone pivots');
    await page.getByRole('button',{name:'Girar',exact:true}).click();
    // Test vertices in the actual rendered hierarchy, including a rotated parent and child.
    await page.evaluate(() => {Group.all[0].rotation=[10,20,30]; const child=Group.all.find(g=>g.parent instanceof Group); if(child) child.rotation=[20,5,10]; Canvas.updateAll();});
    const rotatedInitial=await snapshot();
    const vertices=()=>page.evaluate(()=>{scene.updateMatrixWorld(true);return Cube.all.map(c=>new THREE.Vector3(0,0,0).applyMatrix4(c.mesh.matrixWorld).toArray());});
    for (const [axis,label] of ['Inclinar','Girar','Ladear'].entries()) {
        const points=await vertices();
        await page.getByRole('button',{name:'Girar más: '+label,exact:true}).click();
        const after=await vertices();
        check(await page.evaluate(({points,after,axis}) => {
            const direction=new THREE.Vector3(); direction.setComponent(axis,1);
            return points.every((p,i)=>new THREE.Vector3(...p).applyAxisAngle(direction,Math.PI/12).distanceTo(new THREE.Vector3(...after[i]))<1e-6);
        }, {points,after,axis}), 'Global rotation on axis '+axis+' follows a shared pivot with pre-rotated bones');
        await page.getByRole('button',{name:'Deshacer',exact:true}).click();
        check(rotatedInitial===await snapshot(), 'Rotation undo restores the complete hierarchy on axis '+axis);
    }
    await page.getByRole('button',{name:'Tamaño',exact:true}).click();
    await page.getByRole('button',{name:'Aumentar todo el modelo',exact:true}).click();
    // Export and portable save validate the texture density and hidden geometry.
    await page.getByRole('button',{name:'4 · Guardar y exportar',exact:true}).click();
    const pending=page.waitForEvent('download');
    await page.getByRole('button',{name:/^Llevar a Minecraft/}).click();
    const addon=await pending; await addon.saveAs('output/whole-model.mcaddon');
    check(addon.suggestedFilename().endsWith('.mcaddon'), 'A scaled and rotated model exports successfully');
    await page.getByRole('button',{name:'Seguir creando',exact:true}).click();
    const saved=page.waitForEvent('download');
    await page.getByRole('button',{name:'Guardar mi criatura',exact:true}).click();
    const project=await saved; await project.saveAs('output/whole-model.bbedu');
    check(project.suggestedFilename().endsWith('.bbedu'), 'Whole-model edits save in a portable project');
    await page.getByRole('button',{name:'Seguir creando',exact:true}).click();
    const portableState = () => page.evaluate(() => {
        const visibility=Cube.all.map(c=>c.visibility);
        try {Cube.all.forEach(c=>c.visibility=true);return JSON.stringify({geometry:Codecs.bedrock.compile({raw:true}),png:Texture.all[0].canvas.toDataURL()});}
        finally {Cube.all.forEach((c,i)=>c.visibility=visibility[i]);}
    });
    const portableBefore = await portableState();
    await page.evaluate(() => {const click=HTMLInputElement.prototype.click; window.wholeModelPickerClick=click; HTMLInputElement.prototype.click=function(){if(this.type==='file'){this.hidden=true;document.body.append(this);}else click.call(this);};});
    await page.getByRole('button',{name:'Abrir una criatura',exact:true}).click();
    await page.locator('input[type=file][accept=".bbedu"]').last().setInputFiles('output/whole-model.bbedu');
    await page.waitForFunction(() => Texture.all[0].img.complete && Texture.all[0].img.naturalWidth===Project.texture_width);
    check(portableBefore === await portableState(), 'Reopening preserves transformed geometry and painting');
    await page.evaluate(() => {HTMLInputElement.prototype.click=window.wholeModelPickerClick;delete window.wholeModelPickerClick;});
    const pieceId=await page.evaluate(()=>Cube.all[0].uuid);
    await selector.selectOption(pieceId);
    check(await page.getByRole('button',{name:'Aumentar Ancho',exact:true}).isVisible(), 'Individual-part controls remain available');
    await selector.selectOption('__model__');
    await page.getByRole('button',{name:'Ver todo',exact:true}).click();
    check(await selector.inputValue()==='__model__', 'Framing the camera keeps whole-model scope');
    await page.setViewportSize({width:1024,height:768});
    await page.screenshot({path:'output/playwright/whole-model.png'});
    return {checks};
}

