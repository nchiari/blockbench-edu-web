// Run with playwright-cli run-code after linking the untouched reference in web Blockbench.
async (page) => {
    const results = [];
    const check = (condition, message) => { if (!condition) throw new Error(message); results.push(message); };
    const waitTexture = async () => page.waitForFunction(() => Texture.all[0].img.complete &&
        Texture.all[0].canvas.width === Project.texture_width && Texture.all[0].canvas.height === Project.texture_height);
    await page.evaluate(() => {
        window.eduState = () => JSON.stringify({geometry: Codecs.bedrock.compile({raw: true}),
            bitmap: Array.from(Texture.all[0].ctx.getImageData(0, 0, Texture.all[0].canvas.width, Texture.all[0].canvas.height).data)});
        window.eduOriginal = eduState();
        window.eduOriginalFaces = Cube.all.flatMap(c => Object.entries(c.faces).map(([name, f]) => {
            const x = Math.min(f.uv[0], f.uv[2]), y = Math.min(f.uv[1], f.uv[3]);
            const w = Math.abs(f.uv[2] - f.uv[0]), h = Math.abs(f.uv[3] - f.uv[1]);
            return {uuid: c.uuid, name, signs: [Math.sign(f.uv[2] - f.uv[0]), Math.sign(f.uv[3] - f.uv[1])],
                pixels: Array.from(Texture.all[0].ctx.getImageData(x, y, w, h).data)};
        }));
    });
    await page.getByRole('button', {name: 'Preparar textura', exact: true}).click();
    await waitTexture();
    check(await page.evaluate(() => eduOriginalFaces.every(original => {
        const face = Cube.all.find(c => c.uuid === original.uuid).faces[original.name];
        const pixels = Texture.all[0].ctx.getImageData(Math.min(face.uv[0], face.uv[2]), Math.min(face.uv[1], face.uv[3]),
            Math.abs(face.uv[2] - face.uv[0]), Math.abs(face.uv[3] - face.uv[1])).data;
        return pixels.every((v, i) => v === original.pixels[i]) &&
            Math.sign(face.uv[2] - face.uv[0]) === original.signs[0] && Math.sign(face.uv[3] - face.uv[1]) === original.signs[1];
    })), 'Preparation preserves every face pixel and mirror orientation');
    await page.getByRole('button', {name: 'Deshacer', exact: true}).click(); await waitTexture();
    check(await page.evaluate(() => eduState() === eduOriginal), 'Preparation undo restores original geometry and texture exactly');
    await page.getByRole('button', {name: 'Rehacer', exact: true}).click(); await waitTexture();
    // Native paint transaction with a deliberately asymmetric RGBA pattern on the head.
    await page.evaluate(() => {
        const texture = Texture.all[0], head = Cube.all.find(c => c.parent.name === 'head' && c.size(0) === 8);
        Undo.initEdit({textures: [texture], bitmap: true});
        const uv = head.faces.north.uv, x = Math.min(uv[0], uv[2]), y = Math.min(uv[1], uv[3]);
        const pixels = new ImageData(8, 8);
        for (let py = 0; py < 8; py++) for (let px = 0; px < 8; px++) pixels.data.set([px * 31, py * 29, px * 13 + py, px === 0 ? 128 : 255], (py * 8 + px) * 4);
        texture.ctx.putImageData(pixels, x, y); texture.updateChangesAfterEdit(); Undo.finishEdit('Patrón de prueba');
        window.eduPainted = eduState(); window.eduBaselineCount = Undo.index;
    });
    const labels = ['Ancho', 'Alto', 'Profundidad'];
    for (let axis = 0; axis < 3; axis++) {
        for (let count = 1; count <= 4; count++) await page.getByRole('button', {name: 'Aumentar ' + labels[axis], exact: true}).click();
        await waitTexture();
        check(await page.evaluate(axis => {
            const head = Cube.all.find(c => c.parent.name === 'head' && c.size(axis) === 12);
            return !!head && head.from.every((v, i) => (v + head.to[i]) / 2 === [0, 12, -10][i]) && Undo.index === eduBaselineCount + 4;
        }, axis), labels[axis] + ': +4 total pixels preserves center and makes four undo entries');
        const grown = await page.evaluate(() => eduState());
        await page.getByRole('button', {name: 'Deshacer', exact: true}).click(); await waitTexture();
        await page.getByRole('button', {name: 'Rehacer', exact: true}).click(); await waitTexture();
        check(await page.evaluate(state => eduState() === state, grown), labels[axis] + ': redo restores exact grown bitmap and geometry');
        for (let count = 0; count < 4; count++) { await page.getByRole('button', {name: 'Deshacer', exact: true}).click(); await waitTexture(); }
        check(await page.evaluate(() => eduState() === eduPainted), labels[axis] + ': undo restores all original paint and UVs');
        for (let count = 0; count < 7; count++) await page.getByRole('button', {name: 'Reducir ' + labels[axis], exact: true}).click();
        await waitTexture();
        check(await page.getByRole('button', {name: 'Reducir ' + labels[axis], exact: true}).isDisabled(), labels[axis] + ': minimum dimension is 1');
        for (let count = 0; count < 7; count++) { await page.getByRole('button', {name: 'Deshacer', exact: true}).click(); await waitTexture(); }
        check(await page.evaluate(() => eduState() === eduPainted), labels[axis] + ': undo after crop recovers all removed pixels');
    }
    await page.getByRole('button', {name: 'Frente', exact: true}).click();
    await page.getByRole('button', {name: 'Costado', exact: true}).click();
    await page.getByRole('button', {name: 'Encuadrar', exact: true}).click();
    await page.getByRole('button', {name: 'Pintar', exact: true}).click();
    check(await page.evaluate(() => Modes.selected.id === 'paint'), 'Native painting mode opens');
    await page.getByRole('button', {name: 'Forma', exact: true}).click();
    check(await page.evaluate(() => Modes.selected.id === 'edit'), 'Native editing mode opens');
    return {passed: results.length, results, atlas: await page.evaluate(() => [Project.texture_width, Project.texture_height])};
}
