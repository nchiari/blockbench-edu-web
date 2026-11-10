// Run on a fresh Edu tab with playwright-cli run-code.
async page => {
    const checks=[];const check=(ok,message)=>{if(!ok)throw Error(message);checks.push(message);};
    await page.waitForFunction(()=>typeof Dialog!=='undefined'&&Dialog.open?.content_vue?.steps);
    await page.evaluate(async()=>{const w=Dialog.open.content_vue;w.creature='zombie';w.step=2;await w.next();});
    const label=await page.evaluate(()=>{
        window.dupBaseline={ids:Cube.all.map(c=>c.uuid),png:Texture.all[0].canvas.toDataURL(),count:Cube.all.length};
        return document.getElementById('edu-classroom').__vue__.bones.find(b=>b.id===Group.all.find(g=>g.name==='head').uuid).label;
    });
    await page.getByRole('button',{name:'Duplicar '+label,exact:true}).click();
    check(await page.evaluate(()=>Cube.all.length===dupBaseline.count+2&&Group.all.some(g=>g.name==='head_copy')&&Group.all.some(g=>g.name==='hat_copy')),'Duplicate includes the head and its child layer with unique bone names');
    check(await page.evaluate(()=>{
        const t=Texture.all[0],copies=Cube.all.filter(c=>!dupBaseline.ids.includes(c.uuid));
        return copies.every(copy=>{
            const source=Cube.all.find(c=>c.name===copy.name.replace(/_copy$/,''));
            return Object.keys(copy.faces).filter(name=>copy.faces[name].texture!==null).every(name=>{
                const a=source.faces[name].uv,b=copy.faces[name].uv;
                if(JSON.stringify(a)===JSON.stringify(b))return false;
                const pixels=uv=>Array.from(t.ctx.getImageData(Math.min(uv[0],uv[2]),Math.min(uv[1],uv[3]),Math.abs(uv[2]-uv[0]),Math.abs(uv[3]-uv[1])).data);
                return JSON.stringify(pixels(a))===JSON.stringify(pixels(b));
            });
        });
    }),'Copy preserves every face pixel in separate UV regions');
    await page.getByRole('button',{name:'Deshacer',exact:true}).click();
    await page.waitForFunction(()=>Texture.all[0].canvas.toDataURL()===dupBaseline.png);
    check(await page.evaluate(()=>Cube.all.length===dupBaseline.count&&Cube.all.every(c=>dupBaseline.ids.includes(c.uuid))),'Undo removes all copied geometry and restores the exact PNG');
    await page.getByRole('button',{name:'Rehacer',exact:true}).click();
    await page.waitForFunction(()=>Cube.all.length===dupBaseline.count+2);
    check(await page.evaluate(()=>Cube.all.some(c=>c.name==='head_copy')),'Redo restores the copied bones');
    await page.evaluate(()=>{
        const v=document.getElementById('edu-classroom').__vue__,copy=Cube.all.find(c=>c.name==='head_copy');
        v.selectPiece(copy.uuid);window.originalHeadBounds=JSON.stringify(Cube.all.find(c=>c.parent.name==='head').from);v.move(0,1);
    });
    check(await page.evaluate(()=>JSON.stringify(Cube.all.find(c=>c.parent.name==='head').from)===originalHeadBounds),'Moving the copy leaves the original in place');
    // Save actual archive bytes; substitute only the file picker when reopening.
    await page.evaluate(()=>{window.dupSaveExport=Blockbench.export;Blockbench.export=function(o,cb){window.dupProjectBlob=o.content;return dupSaveExport.call(this,o,cb);};});
    let pending=page.waitForEvent('download');
    await page.getByRole('button',{name:'Guardar mi criatura',exact:true}).click();
    const saved=await pending;await saved.saveAs('output/duplicated-bone.bbedu');
    await page.getByRole('button',{name:'Seguir creando',exact:true}).click();
    await page.evaluate(async()=>{Blockbench.export=dupSaveExport;window.dupProjectId=Project.uuid;const bytes=await dupProjectBlob.arrayBuffer(),original=Blockbench.import;Blockbench.import=(_options,callback)=>callback([{content:bytes}]);try{document.getElementById('edu-classroom').__vue__.openCreature();}finally{Blockbench.import=original;}});
    await page.waitForFunction(()=>Project.uuid!==dupProjectId&&Cube.all.length===9&&Group.all.some(g=>g.name==='head_copy')&&document.getElementById('edu-classroom'));
    check(await page.evaluate(()=>Cube.all.length===9),'Saved project reopens with its duplicate');
    await page.evaluate(()=>{window.dupNativeExport=Blockbench.export;Blockbench.export=function(options,cb){window.dupExportBlob=options.content;return dupNativeExport.call(this,options,cb);};});
    pending=page.waitForEvent('download');
    await page.evaluate(()=>document.getElementById('edu-classroom').__vue__.download());
    await (await pending).saveAs('output/duplicated-bone.mcaddon');
    const exported=await page.evaluate(async()=>{
        const zip=await JSZip.loadAsync(await dupExportBlob.arrayBuffer()),path=Object.keys(zip.files).find(p=>/models\/entity\/.*\.json$/.test(p));
        const bones=JSON.parse(await zip.file(path).async('string'))['minecraft:geometry'][0].bones;
        Blockbench.export=dupNativeExport;
        return {count:bones.reduce((n,b)=>n+(b.cubes?.length||0),0),copy:bones.some(b=>b.name==='head_copy')};
    });
    check(exported.count===9&&exported.copy,'Minecraft export includes the copied bones after reopening the project');
    return {passed:checks.length,checks};
}
