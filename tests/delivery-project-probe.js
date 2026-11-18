async page => {
    const root = new URL('./', page.url()).href;
    page = await page.context().newPage();
    const open = async file => {
        await page.evaluate(() => {
            const click = HTMLInputElement.prototype.click;
            HTMLInputElement.prototype.click = function() {
                if (this.type !== 'file') return click.call(this);
                this.hidden = true; document.body.append(this);
                HTMLInputElement.prototype.click = click;
            };
        });
        await page.getByRole('button',{name:'Abrir una criatura',exact:true}).filter({visible:true}).first().click();
        await page.locator('input[type=file][accept*=".bbmodel"]').last().setInputFiles(file);
        await page.waitForFunction(() => !document.body.classList.contains('edu-setup') && Project?.name && !Dialog.open);
    };
    await page.goto(root + '#clase=' + 'a'.repeat(32));
    await page.waitForFunction(() => typeof Dialog !== 'undefined' && Dialog.open?.content_vue?.steps);
    await page.evaluate(async () => {
        const wizard = Dialog.open.content_vue;
        wizard.creature='pig'; wizard.step=3; await wizard.next();
    });
    await page.locator('#edu-classroom').waitFor();
    await page.evaluate(() => {
        document.getElementById('edu-classroom').__vue__.changePig('health', 37);
        BlockbenchEduDrive.send = async payload => { window.testDelivery = payload; return {ok:true}; };
    });
    await page.getByRole('button',{name:'4 · Guardar y exportar',exact:true}).click();
    await page.getByRole('textbox',{name:'Nombre de tu criatura'}).fill('Lúa del aula');
    await page.getByRole('button',{name:'Continuar',exact:true}).click();
    await page.getByRole('button',{name:/^Entregar al profe/}).click();
    await page.getByRole('textbox',{name:'Tu nombre o número de alumno'}).fill('Prueba');
    await page.getByRole('button',{name:'Entregar',exact:true}).click();
    await page.waitForFunction(() => window.testDelivery?.projectBase64);
    const delivery = await page.evaluate(() => window.testDelivery);
    if (delivery.creature !== 'Lúa del aula' || !delivery.fileName.startsWith('Lúa_del_aula_')) throw Error('Falta el nombre elegido en la entrega');
    const expected = await page.evaluate(() => ({png:Texture.all[0].canvas.toDataURL(), ids:Cube.all.map(c=>c.uuid).join(), behavior:JSON.stringify(document.getElementById('edu-classroom').__vue__.behavior)}));
    for (const [entry, field, ext] of [['docente/','modelBase64','bbmodel'],['','modelBase64','bbmodel'],['#clase='+'a'.repeat(32),'projectBase64','bbedu']]) {
        page = await page.context().newPage();
        await page.goto(root + entry);

        await page.waitForFunction(() => typeof Dialog !== 'undefined' && Dialog.open?.content_vue?.steps);
        await open({name:'Entrega.'+ext,mimeType:'application/octet-stream',buffer:Buffer.from(delivery[field],'base64')});
        if (!await page.evaluate(() => Project.name === 'Lúa del aula')) throw Error('Se perdió el nombre al abrir el archivo');
        if (!await page.evaluate(e => Texture.all[0].canvas.toDataURL() === e.png && Cube.all.map(c=>c.uuid).join() === e.ids,expected)) throw Error('Cambió el modelo o la pintura');
        if (ext==='bbedu' && !await page.evaluate(e => JSON.stringify(document.getElementById('edu-classroom').__vue__.behavior) === e.behavior,expected)) throw Error('Cambió Dale vida');
        if (entry==='docente/') {
            const pending = page.waitForEvent('download');
            await page.getByRole('button',{name:'Guardar mi criatura',exact:true}).filter({visible:true}).click();
            await page.getByRole('button',{name:'Continuar',exact:true}).click();
            if (!(await pending).suggestedFilename().endsWith('.bbedu')) throw Error('Formato de guardado incorrecto');
        }
    }
    return 'Entrega con tres archivos, apertura del bbmodel en docente y alumno, guardado en bbedu y reapertura del proyecto de clase.';
}

