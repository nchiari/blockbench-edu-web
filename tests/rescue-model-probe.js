// Run with playwright-cli run-code on a fresh student preview tab.
async page => {
    const checks = [], check = (ok, message) => { if (!ok) throw Error(message); checks.push(message); };
    await page.waitForFunction(() => typeof Dialog !== 'undefined' && Dialog.open?.content_vue?.steps);
    await page.evaluate(async () => {
        const wizard = Dialog.open.content_vue;
        wizard.creature = 'zombie'; wizard.step = 2; await wizard.next();
    });
    await page.locator('#edu-classroom').waitFor();
    // Simulate a native edit outside Edu's duplication controls: an unregistered cube.
    await page.evaluate(() => {
        Cube.all[0].duplicate();
        const texture = Texture.all[0];
        texture.ctx.fillStyle = '#ab1234'; texture.ctx.fillRect(0, 0, 1, 1); texture.updateChangesAfterEdit();
        const view = document.getElementById('edu-classroom').__vue__;
        view.toggleBone(view.bones[0].id);
        window.rescueBefore = {count: Cube.all.length, png: texture.canvas.toDataURL(),
            bounds: JSON.stringify(Cube.all.map(c => [c.uuid, c.from, c.to])),
            visibility: JSON.stringify(Cube.all.map(c => c.visibility)), projectId: Project.uuid};
    });
    const nativePending = page.waitForEvent('download');
    await page.keyboard.press('Control+Alt+s');
    const nativeDownload = await nativePending;
    await nativeDownload.saveAs('output/playwright/native-structure-rescue.bbmodel');
    check(nativeDownload.suggestedFilename().endsWith('.bbmodel'), 'Existing sessions can download a native backup using Ctrl+Alt+S');
    await page.getByRole('button', {name: '4 · Guardar y exportar', exact: true}).click();
    await page.getByText('Guarda una copia de tu trabajo', {exact: true}).waitFor();
    check(await page.getByText(/Esta copia no se abre/).isVisible(), 'Explains that the rescue file opens in Blockbench');
    await page.getByRole('button', {name: 'Volver', exact: true}).click();
    check(await page.evaluate(() => Project.uuid === rescueBefore.projectId && JSON.stringify(Cube.all.map(c => [c.uuid, c.from, c.to])) === rescueBefore.bounds), 'Cancelling keeps the edited project intact');
    await page.getByRole('button', {name: 'Guardar mi criatura', exact: true}).click();
    await page.evaluate(() => {
        const original = Blockbench.export;
        Blockbench.export = function(options, callback) {
            window.rescueContent = options.content;
            Blockbench.export = original;
            return original.call(this, options, callback);
        };
    });
    const pending = page.waitForEvent('download');
    await page.getByRole('button', {name: 'Guardar copia de rescate', exact: true}).click();
    const download = await pending;
    await download.saveAs('output/playwright/structure-rescue.bbmodel');
    check(download.suggestedFilename().endsWith('_rescate.bbmodel'), 'Downloads the rescue model through the real browser download');
    const model = await page.evaluate(() => JSON.parse(rescueContent));
    const expected = await page.evaluate(() => rescueBefore);
    check(model.elements.filter(c => c.type === 'cube').length === expected.count, 'Includes the unregistered cube');
    check(JSON.stringify(model.elements.filter(c => c.type === 'cube').map(c => [c.uuid, c.from, c.to])) === expected.bounds, 'Preserves exact edited piece IDs and positions');
    check(model.textures[0].source === expected.png, 'Preserves exact painted PNG');
    check(model.elements.filter(c => c.type === 'cube').every(c => c.visibility !== false), 'Includes temporarily hidden parts');
    check(model.textures.every(t => !t.path && !t.relative_path), 'Omits local texture paths');
    check(await page.evaluate(() => JSON.stringify(Cube.all.map(c => c.visibility)) === rescueBefore.visibility), 'Restores the current editor visibility after capture');
    await page.evaluate(async model => {
        Codecs.project.load(model, {path: 'rescate.bbmodel', no_file: true});
        await Promise.all(Texture.all.map(t => new Promise(resolve => t.load(resolve))));
    }, model);
    await page.waitForFunction(count => Cube.all.length === count && Texture.all[0]?.canvas.width > 0, expected.count);
    check(await page.evaluate(() => Cube.all.length === rescueBefore.count), 'Rescue model loads through the Blockbench project codec');
    check(await page.evaluate(() => Texture.all[0].canvas.toDataURL() === rescueBefore.png), 'Reopened rescue restores the painted bitmap');
    return {passed: checks.length, checks};
}
