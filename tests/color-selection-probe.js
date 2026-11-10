// Run with playwright-cli run-code on a fresh local Edu web tab.
async page => {
    const results=[];
    const check=(ok,message)=>{if(!ok)throw Error(message);results.push(message);};
    await page.setViewportSize({width:1366,height:768});
    await page.waitForFunction(()=>Dialog.open?.content_vue?.steps);
    await page.evaluate(async()=>{const wizard=Dialog.open.content_vue;wizard.creature='zombie';wizard.step=2;await wizard.next();});
    await page.waitForSelector('#edu-classroom');
    await page.evaluate(()=>{settings.undo_selections.value=true;});
    const point=await page.evaluate(()=>{
        const view=document.getElementById('edu-classroom').__vue__;
        view.setMode('paint');view.showOnlyBone(Group.all.find(group=>group.name==='head').uuid);
        const cube=Cube.all.find(cube=>cube.parent.name==='head');
        const center=new THREE.Box3().setFromObject(cube.mesh).getCenter(new THREE.Vector3());
        const point=Preview.selected.vectorToScreenPosition(center),rect=Preview.selected.canvas.getBoundingClientRect();
        return {x:Math.round(rect.left+point.x)+3,y:Math.round(rect.top+point.y)+2};
    });
    await page.getByRole('button',{name:'Seleccionar color',exact:true}).click();
    await page.evaluate(({x,y})=>{
        const hit=Canvas.raycast(new MouseEvent('pointerdown',{clientX:x,clientY:y,button:0}));
        if(!hit?.intersects?.length)throw Error('No head surface at test point');
        const texture=Texture.all[0],uv=hit.intersects[0].uv,w=texture.canvas.width,h=texture.canvas.height;
        const px=Math.min(w-1,Math.floor(uv.x*w)),py=Math.min(h-1,Math.floor((1-uv.y)*h));
        const body=Cube.all.find(cube=>cube.parent.name==='body'),face=body.faces.north.uv;
        const bx=Math.floor((face[0]+face[2])/2),by=Math.floor((face[1]+face[3])/2);
        const target=py*w+px,hidden=by*w+bx;
        if(target===hidden)throw Error('Test requires separated UV regions');
        const others=[];for(let i=0;others.length<3;i++)if(i!==target&&i!==hidden)others.push(i);
        const image=texture.ctx.getImageData(0,0,w,h);
        for(let i=0;i<w*h;i++)image.data.set([80,90,100,255],i*4);
        image.data.set([17,41,73,255],target*4);image.data.set([17,41,73,255],hidden*4);
        image.data.set([17,41,73,128],others[0]*4);image.data.set([18,41,73,255],others[1]*4);image.data.set([17,41,73,0],others[2]*4);
        texture.ctx.putImageData(image,0,0);texture.updateChangesAfterEdit();
        // Read the actual canvas: transparent pixels and half-alpha RGB are normalized by the browser.
        window.eduColorTest={target,hidden,others,before:Array.from(texture.ctx.getImageData(0,0,w,h).data),png:texture.canvas.toDataURL(),undo:Undo.index};
    },point);
    await page.mouse.click(point.x,point.y);
    check(await page.evaluate(()=>{
        const {target,hidden,others}=eduColorTest,selection=Texture.all[0].selection;
        return selection.is_custom&&selection.array.reduce((n,v)=>n+v,0)===2&&selection.array[target]&&selection.array[hidden]&&others.every(i=>!selection.array[i]);
    }),'Click on the 3D model selects both disconnected exact RGBA matches, including a hidden part');
    check(await page.evaluate(()=>Texture.all[0].canvas.toDataURL()===eduColorTest.png),'Selecting a color does not repaint the texture');
    check(await page.evaluate(()=>document.getElementById('edu-classroom').__vue__.selectedPixelCount===2),'Selected-pixel count is visible in the classroom');
    await page.getByRole('button',{name:'Color #e85b61',exact:true}).click();
    await page.getByRole('button',{name:'Rellenar',exact:true}).click();
    await page.mouse.click(point.x,point.y);
    check(await page.evaluate(()=>{
        const {target,hidden,before}=eduColorTest,texture=Texture.all[0];
        const after=texture.ctx.getImageData(0,0,texture.canvas.width,texture.canvas.height).data;
        const all=before.every((v,i)=>{
            const pixel=Math.floor(i/4),channel=i%4;
            return after[i]===((pixel===target||pixel===hidden)&&channel<3?[232,91,97][channel]:v);
        });
        eduColorTest.paintedPng=texture.canvas.toDataURL();
        return all;
    }),'The bucket changes every selected pixel, including the hidden body, and preserves every unselected pixel');
    check(await page.evaluate(()=>Cube.all.filter(cube=>cube.visibility).every(cube=>cube.parent.name==='head')),'Recoloring preserves isolated parts');
    await page.getByRole('button',{name:'Deshacer',exact:true}).click();
    await page.waitForFunction(()=>Texture.all[0].canvas.toDataURL()===eduColorTest.png);
    check(await page.evaluate(()=>Texture.all[0].canvas.toDataURL()===eduColorTest.png),'Undo restores the exact original PNG');
    await page.getByRole('button',{name:'Rehacer',exact:true}).click();
    await page.waitForFunction(()=>Texture.all[0].canvas.toDataURL()===eduColorTest.paintedPng);
    check(await page.evaluate(()=>Texture.all[0].canvas.toDataURL()===eduColorTest.paintedPng),'Redo restores the exact recolored PNG');
    await page.getByRole('button',{name:'Deshacer',exact:true}).click();
    await page.waitForFunction(()=>Texture.all[0].canvas.toDataURL()===eduColorTest.png);
    await page.getByRole('button',{name:'Color #f7b45c',exact:true}).click();
    await page.evaluate(()=>{const view=document.getElementById('edu-classroom').__vue__;view.tool('brush_tool');view.changeBrushSize(2);});
    await page.mouse.click(point.x,point.y);
    check(await page.evaluate(()=>{
        const {target,hidden,before}=eduColorTest,texture=Texture.all[0],data=texture.ctx.getImageData(0,0,texture.canvas.width,texture.canvas.height).data;
        let changed=0;
        for(let i=0;i<data.length;i++)if(data[i]!==before[i]){if(Math.floor(i/4)!==target&&Math.floor(i/4)!==hidden)return false;changed++;}
        return changed>0;
    }),'A native brush stroke changes selected pixels and leaves every unselected pixel intact');
    await page.getByRole('button',{name:'Deshacer',exact:true}).click();
    await page.waitForFunction(()=>Texture.all[0].canvas.toDataURL()===eduColorTest.png);
    await page.getByRole('button',{name:'Suavizar',exact:true}).click();
    await page.mouse.click(point.x,point.y);
    check(await page.evaluate(()=>{
        const {target,hidden,before}=eduColorTest,texture=Texture.all[0],data=texture.ctx.getImageData(0,0,texture.canvas.width,texture.canvas.height).data;
        let changed=0;
        for(let i=0;i<data.length;i++)if(data[i]!==before[i]){
            if((Math.floor(i/4)!==target&&Math.floor(i/4)!==hidden)||i%4===3)return false;
            changed++;
        }
        return changed>0;
    }),'Smooth changes only selected color channels and preserves alpha and all unselected pixels');
    await page.getByRole('button',{name:'Deshacer',exact:true}).click();
    await page.waitForFunction(()=>Texture.all[0].canvas.toDataURL()===eduColorTest.png);
    await page.getByRole('button',{name:'Borrador',exact:true}).click();
    await page.mouse.click(point.x,point.y);
    check(await page.evaluate(()=>{
        const {target,hidden,before}=eduColorTest,texture=Texture.all[0],data=texture.ctx.getImageData(0,0,texture.canvas.width,texture.canvas.height).data;
        return data[target*4+3]===0 && before.every((value,i)=>Math.floor(i/4)===target||Math.floor(i/4)===hidden||data[i]===value);
    }),'The eraser removes selected pixels without touching any unselected pixel');
    await page.getByRole('button',{name:'Deshacer',exact:true}).click();
    await page.waitForFunction(()=>Texture.all[0].canvas.toDataURL()===eduColorTest.png);
    await page.getByRole('button',{name:'Quitar selección',exact:true}).click();
    check(await page.evaluate(()=>!Texture.all[0].selection.is_custom&&document.getElementById('edu-classroom').__vue__.selectedPixelCount===0),'Clear Selection releases native painting restrictions and removes contextual controls');
    await page.getByRole('button',{name:'Deshacer',exact:true}).click();
    check(await page.evaluate(()=>document.getElementById('edu-classroom').__vue__.selectedPixelCount===2),'Undo restores the color selection and its displayed count');
    await page.getByRole('button',{name:'Quitar selección',exact:true}).click();
    await page.getByRole('button',{name:'Seleccionar color',exact:true}).click();
    await page.mouse.click(point.x,point.y);
    await page.screenshot({path:'output/playwright/color-selection-final.png'});
    return {passed:results.length,results};
}
