// Run with playwright-cli run-code after loading the current plugin.
// Creates and closes only the temporary projects created by this probe.
async (page) => {
    return await page.evaluate(() => {
        window.eduAuditResults = [];
        // The Bedrock codec expands cached culling bounds when compiling. Those
        // derived export bounds are not editable geometry or UV state.
        const geometrySnapshot = () => JSON.stringify(Codecs.bedrock.compile({raw:true}), (key,value) => key.startsWith('visible_bounds_') ? undefined : value);
        window.eduAuditBatch = async (start, count) => {
            ModelLoader.loaders.blockbench_edu.onStart();
            const choices = Dialog.open.content_vue.choices.map(([id]) => id);
            Dialog.open.content_vue.cancel();
            const results = [];
            for (const id of choices.slice(start, start + count)) {
                const previousId = Project?.uuid;
                let created;
                try {
                    ModelLoader.loaders.blockbench_edu.onStart();
                    const wizard = Dialog.open.content_vue;
                    wizard.creature = id; wizard.step = 2;
                    await wizard.next();
                    if (Project?.uuid !== previousId) created = Project;
                    if (wizard.error) throw new Error(wizard.error);
                    const editor = document.getElementById('edu-classroom').__vue__;
                    const cube = Cube.all.find(c => c.size()[0] > 0) || Cube.all[0];
                    editor.selectPiece(cube.uuid);
                    const before = {geometry: geometrySnapshot(), png: Texture.all[0].canvas.toDataURL(), width: cube.size()[0]};
                    await editor.resize(0,1);
                    if (Math.abs(cube.size()[0] - before.width - 1) > 1e-8) throw new Error('Size did not increase by one');
                    const after = {geometry: geometrySnapshot(), png: Texture.all[0].canvas.toDataURL()};
                    editor.undo();
                    const deadline = performance.now() + 3000;
                    while ((Texture.all[0].canvas.toDataURL() !== before.png || geometrySnapshot() !== before.geometry) && performance.now() < deadline) await new Promise(requestAnimationFrame);
                    if (geometrySnapshot() !== before.geometry) { window.eduAuditDifference = {id, before:JSON.parse(before.geometry), after:Codecs.bedrock.compile({raw:true})}; throw new Error('Undo geometry differs'); }
                    if (Texture.all[0].canvas.toDataURL() !== before.png) throw new Error('Undo bitmap differs');
                    editor.redo();
                    const redoDeadline = performance.now() + 3000;
                    while ((Texture.all[0].canvas.toDataURL() !== after.png || geometrySnapshot() !== after.geometry) && performance.now() < redoDeadline) await new Promise(requestAnimationFrame);
                    if (geometrySnapshot() !== after.geometry) throw new Error('Redo geometry differs');
                    if (Texture.all[0].canvas.toDataURL() !== after.png) throw new Error('Redo bitmap differs');
                    results.push({id, ok:true, cubes:Cube.all.length, atlas:[Project.texture_width,Project.texture_height]});
                } catch (error) { results.push({id, ok:false, error:error.message}); }
                finally {
                    document.querySelector('#edu-classroom .edu-teacher')?.click();
                    if (Dialog.open?.id === 'blockbench_edu_wizard') Dialog.open.content_vue.cancel();
                    if (created) { created.saved = true; await created.close(); }
                }
            }
            eduAuditResults.push(...results);
            return results;
        };
        return 'Catalog probe installed; call eduAuditBatch(start,count).';
    });
}
