// Run after whole-model-probe.js; uses real pointer events on native gizmos.
async (page) => {
    const checks=[];
    const check=(ok,label)=>{if(!ok)throw new Error(label);checks.push(label);};
    const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const state=()=>page.evaluate(()=>JSON.stringify({cubes:Cube.all.map(c=>[c.from,c.to,c.origin,c.rotation]),groups:Group.all.map(g=>[g.origin,g.rotation]),png:Texture.all[0].canvas.toDataURL()}));
    const worldPoints=()=>page.evaluate(()=>{scene.updateMatrixWorld(true);return Cube.all.map(c=>new THREE.Vector3().applyMatrix4(c.mesh.matrixWorld).toArray());});
    await page.locator('#edu-classroom aside select').first().selectOption('__model__');
    await page.getByRole('button',{name:'Mover',exact:true}).click();
    await page.waitForFunction(()=>Transformer.visible && Toolbox.selected.id==='move_tool');
    await settle();
    await page.evaluate(()=>document.getElementById('edu-classroom').__vue__.toggleBone(Group.all.find(g=>g.name==='head').uuid));
    const original=await state(), points=await worldPoints();
    const arrow=await page.evaluate(()=>{
        scene.updateMatrixWorld(true);
        const handle=Transformer.children.find(c=>c.visible).children[0].children.find(c=>c.name==='Y'&&c.type==='Mesh');
        handle.geometry.computeBoundingBox();
        const p=handle.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(handle.matrixWorld).project(Preview.selected.camera);
        const r=Preview.selected.canvas.getBoundingClientRect();return{x:r.x+(p.x+1)*r.width/2,y:r.y+(1-p.y)*r.height/2};
    });
    await page.mouse.move(arrow.x,arrow.y);
    check(await page.evaluate(()=>Transformer.axis==='Y'), 'Pointer picks the native Y arrow');
    await page.mouse.down();
    await page.mouse.move(arrow.x,arrow.y-55,{steps:8});
    const moved=await worldPoints();
    const delta=moved[0][1]-points[0][1];
    check(Math.abs(delta)>0.01 && points.every((p,i)=>Math.abs(moved[i][1]-p[1]-delta)<1e-6 && Math.abs(moved[i][0]-p[0])<1e-6 && Math.abs(moved[i][2]-p[2])<1e-6), 'Dragging an arrow moves every part together live');
    await page.mouse.up();
    await page.getByRole('button',{name:'Deshacer',exact:true}).click();
    check(original===await state(), 'One undo restores the complete arrow drag');
    await page.getByRole('button',{name:'Girar',exact:true}).click();
    await page.waitForFunction(()=>Transformer.visible && Toolbox.selected.id==='rotate_tool');
    await settle();
    const ringBefore=await state(), ringPoints=await worldPoints();
    const ring=await page.evaluate(()=>{
        scene.updateMatrixWorld(true);
        const line=Transformer.children.find(c=>c.visible).children[0].children.find(c=>c.name==='E'&&c.type==='Line');
        const r=Preview.selected.canvas.getBoundingClientRect(),vertices=line.geometry.attributes.position;
        return [8,20].map(i=>{const p=new THREE.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(line.matrixWorld).project(Preview.selected.camera);return{x:r.x+(p.x+1)*r.width/2,y:r.y+(1-p.y)*r.height/2};});
    });
    await page.mouse.move(ring[0].x,ring[0].y);
    check(await page.evaluate(()=>Transformer.axis==='E'), 'Pointer picks the native rotation ring');
    await page.mouse.down(); await page.mouse.move(ring[1].x,ring[1].y,{steps:12});
    const turned=await worldPoints();
    check(ringPoints.some((p,i)=>Math.hypot(...p.map((v,a)=>v-turned[i][a]))>0.1), 'Ring drag rotates the model live');
    check(ringPoints.every((p,i)=>Math.abs(Math.hypot(...p)-Math.hypot(...turned[i]))<1e-5), 'Ring rotation keeps every part at its distance from the common origin');
    await page.mouse.up();
    await page.getByRole('button',{name:'Deshacer',exact:true}).click();
    check(ringBefore===await state(), 'One undo restores the complete ring drag');
    await page.getByRole('button',{name:'Tamaño',exact:true}).click();
    check(await page.evaluate(()=>Toolbox.selected.transformerMode==='hidden'), 'Returning to Size hides all resize handles');
    await page.screenshot({path:'output/playwright/whole-model-v2.png'});
    return {checks};
}
