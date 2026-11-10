// Run with playwright-cli run-code --filename tests/web-entry-probe.js on the local preview.
async (page) => {
    const base = new URL('./', page.url()).href;
    const check = (ok, message) => { if (!ok) throw new Error(message); };
    const report = {};
    // Only discard projects created by this probe. Native beforeunload prompts
    // otherwise pause the CLI halfway through a navigation.
    const discardProbeProject = () => page.evaluate(() => { Project.saved = true; });
    const openCreature = async () => {
        await page.getByRole('button', {name: 'Comenzar', exact: true}).click();
        await page.locator('#blockbench_edu_wizard .search_bar input').fill('zombi');
        await page.locator('.edu-catalog>li').filter({hasText: /^Zombi$/}).click();
        await page.getByRole('button', {name: 'Siguiente', exact: true}).click();
        await page.getByRole('button', {name: 'Abrir editor', exact: true}).click();
        await page.waitForFunction(() => !document.body.classList.contains('edu-setup'));
    };
    const waitWizard = () => page.getByRole('heading', {name: 'Crea tu propia criatura', exact: true}).waitFor();

    await waitWizard();
    await page.getByRole('button', {name: 'Cancelar', exact: true}).click();
    check(await page.locator('#edu-web-start').isVisible(), 'Student cancellation returns home');
    await page.locator('#edu-web-start button').click();
    await openCreature();
    check(await page.locator('#edu-classroom').isVisible(), 'Student opens classroom');
    check(await page.locator('.edu-teacher').count() === 0, 'Student has no teacher switch');
    check(await page.locator('body>header').isHidden(), 'Student has no native Blockbench header');
    await page.evaluate(() => document.getElementById('edu-classroom').__vue__.exit());
    check(await page.locator('#edu-classroom').isVisible(), 'Student cannot leave through the old action');
    await page.getByRole('button', {name: '2 · Dale color', exact: true}).click();
    check(await page.getByRole('heading', {name: 'Dale color', exact: true}).isVisible(), 'Student paint mode works');
    await page.screenshot({path: 'output/playwright/entry-student.png'});
    await discardProbeProject(); await page.reload(); await waitWizard(); await openCreature();
    check(await page.locator('.edu-teacher').count() === 0, 'Reload keeps student role');
    report.student = {classroom: true, teacherSwitch: false, nativeHeader: false, reload: true, paint: true};

    await discardProbeProject(); await page.goto(base + 'docente');
    await waitWizard();
    check(page.url().endsWith('/docente/'), 'Preview redirects teacher directory to trailing slash');
    await page.getByRole('button', {name: 'Cancelar', exact: true}).click();
    check(await page.locator('#edu-web-start').isHidden(), 'Teacher cancellation opens native start');
    check(await page.locator('body>header').isVisible(), 'Teacher has native Blockbench header');
    await page.evaluate(() => ModelLoader.loaders.blockbench_edu.onStart());
    await openCreature();
    check(await page.locator('#edu-classroom').count() === 0, 'Teacher opens full editor');
    check(await page.locator('body>header').isVisible(), 'Teacher header stays visible');
    await page.getByText('Entregas de la clase', {exact: true}).click();
    await page.locator('.edu-drive-config input').first().fill('a'.repeat(32));
    await page.getByRole('button', {name: 'Seleccionar clase', exact: true}).click();
    const classLink = await page.locator('.edu-drive-config input[readonly]').inputValue();
    check(classLink === base + '#clase=' + 'a'.repeat(32), 'Teacher shares the student URL');
    await page.locator('#edu-return-students').click();
    check(await page.locator('#edu-classroom').isVisible(), 'Teacher can preview classroom');
    await page.getByRole('button', {name: 'Para el docente', exact: true}).click();
    check(await page.locator('#edu-classroom').count() === 0, 'Teacher preview can return to full editor');
    await page.screenshot({path: 'output/playwright/entry-teacher.png'});
    report.teacher = {fullEditor: true, studentPreview: true, classLink};

    await discardProbeProject(); await page.goto(classLink); await waitWizard(); await openCreature();
    check(await page.getByRole('button', {name: '3 · Entregar al profe', exact: true}).isVisible(), 'Class link enables student delivery');
    check(await page.locator('.edu-teacher').count() === 0, 'Class link stays in student role');
    report.classLink = {student: true, delivery: true};
    return report;
}
