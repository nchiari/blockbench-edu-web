# Blockbench Edu web

Primary website: [Blockbench Edu](https://blockbench-edu.pages.dev/) (Cloudflare Pages project: `blockbench-edu`).

This independent classroom adaptation builds Blockbench 5.2.2 at the exact commit in `upstream.json`. The root `blockbench_edu.js` is the only Edu plugin source. `edu-web.js` loads it automatically after native setup and opens the assistant; the plugin's web-only callbacks return to the start screen on cancellation. The manual plugin has no automatic startup.

## Student and teacher entries

The build generates two entry pages in the same Cloudflare Pages deployment:

| Path | Experience |
| --- | --- |
| `/` | Student: the assistant opens the classroom editor, without the teacher switch or native Blockbench header. Cancelling returns to the Edu home screen. |
| `/docente/` | Teacher: the assistant opens the full editor with the Edu panel. Cancelling exposes the native start screen. The teacher can preview the classroom and return to the full editor. |

The role comes from the generated HTML, defaults to student, and is not remembered in browser settings. Teacher use does not change subsequent student visits. Both entries share content-hashed assets. The teacher page uses a relative base URL so resources and generated student class links resolve to the deployment root, including when previewing under the GitHub Pages subpath. Classroom links always use the student entry and retain `#clase=…`.

These are separate interfaces, not authenticated accounts. Sessions stay in their own tabs; opening another entry does not transfer an in-memory creature. Actual subdomains can be configured later with an owned domain and corresponding entry routing; this change does not create DNS records or new Cloudflare projects.

## Rebuild

The student's third step is **3 · Dale vida** (behavior setup); **4 · Guardar y exportar** opens the save/export choices. It opens a chooser with **Guardar para seguir editando** (`.bbedu`) and **Llevar a Minecraft** (`.mcaddon`). A configured classroom adds **Entregar al profe** to the same chooser. Opening or closing the chooser does not generate a download or change the creature; the student selects an action explicitly. The sidebar save/open shortcuts remain available.

Use Node 22.15.0 and npm. From the repository root:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm test
npm run build:web
```

The builder downloads the pinned upstream source, installs its locked dependencies without lifecycle scripts, applies host-specific guards for PWA registration and official-site telemetry, invokes the upstream web build, and assembles `web/dist/`. Upstream files and dependencies are cached under ignored `output/web-build/`. All guards are recorded in `build.mjs`. The generated HTML adds Edu's loading screen and bootstrap, uses Spanish, and omits the upstream PWA manifest. The site does not register a service worker. Upstream third-party license notices remain in the bundle and assets.

For a local preview, run `npm run preview:web`, then open http://localhost:4173/blockbench-edu-web/. The preview server retains the original GitHub Pages subpath; Cloudflare serves the generated site at the domain root.

The local teacher entry is http://localhost:4173/blockbench-edu-web/docente/. If the default port is already occupied, set `PORT` before starting the preview. `tests/web-entry-probe.js` checks both entries, student cancellation and reload, teacher classroom preview, and classroom links using `playwright-cli run-code --filename tests/web-entry-probe.js` from a fresh student preview tab. The probe uses temporary unsaved creatures and does not submit files to Drive.

## Publish

### Test environment

Use branch `codex/pruebas` for development and classroom review before release.
Cloudflare Pages preview branch control includes only `codex/pruebas`; production
remains on `main`. The preview branch alias is
https://codex-pruebas.blockbench-edu.pages.dev/ and its teacher entry is
https://codex-pruebas.blockbench-edu.pages.dev/docente/.

Run `npm run check` and `npm test` before pushing to the test branch, and verify
the resulting Preview deployment in Cloudflare and in the browser. Preview URLs
are public. The Drive receiver currently rejects preview origins, so classroom
delivery is not enabled for this environment. Model editing and local downloads
can be tested without Drive. Delivery testing would require separately setting
up a test classroom/inbox and allowing this exact preview origin in its receiver.
Do not merge into or push development changes to `main` until the user explicitly
requests the production release.

The preview includes the first behavior setup: Original, Animal tranquilo,
Animal asustadizo, Compañero, Guardián, and Enemigo. Custom bases are enabled only
for compatible walking templates. They replace the original AI and special
abilities, using an adult walking base with the original physical dimensions.
They expose health (1–200), speed (four choices), attraction/taming item,
attraction toggle, melee damage (1–20), and detection range (4–32) as applicable.
Companions follow their owner after guaranteed one-item taming; guardians also
retaliate against whoever attacks their owner. Enemies target players; test
combat in Survival or Adventure. Original keeps the BP entity file untouched.
No simulation or additional animations are provided by the 3D preview.

Behavior settings have their own undo/redo history while in step 3, including
Ctrl/Cmd+Z and redo outside inputs. Changing modes retains settings. Portable
projects now write format version 2, which preserves behavior settings and the
untouched source addon; version 1 files still open with Original. Earlier Edu
versions reject version 2 rather than silently discarding the behavior setup.
These bases still require Minecraft Education validation before production.

The pig now pilots category buttons with individual submenus: Base, Movimiento,
Reacción al jugador, Amistad, Vida y cuidados, and Combate. Its optional `pig`
settings combine wandering, panic, neutral/flee/enemy/retaliation reactions,
taming, optional following and owner defense, following start/stop distances,
temptation radius, and item healing. Dependencies are resolved when a control
changes and validated again on import/export. Following and defense controls require taming; taming requires a neutral
reaction. Enemy/flee/retaliation choices disable taming, following and defense.
The UI disables incompatible controls and explains automatic adjustments. Panic and
combat responses are mutually exclusive. The selected item is shared by
temptation, taming and healing. Editing activates a custom adult walking base;
choosing a starting preset resets behavior settings with undo available.
Pig category projects use portable format 3; formats 1 and 2 remain readable.
Other templates keep the initial behavior interface.

### Production

The primary website uses Cloudflare Pages with Git integration connected to `nchiari/blockbench-edu-web`. The Cloudflare project name is `blockbench-edu`; the repository keeps its existing name. Pushes to `main` trigger a production build and deployment, unless automatic deployments are disabled in Cloudflare. Local edits are published only after they are committed and pushed.

The Cloudflare Pages build settings are:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | `None` |
| Root directory | Leave empty (repository root) |
| Build command | `npm run build:web` |
| Build output directory | `web/dist` |
| Environment variable | `NODE_VERSION` = `22.15.0` |

Cloudflare installs the repository dependencies before running the build command. This command only builds the website; run `npm run check` and `npm test` before pushing changes that affect the application. Check the deployment status and build logs under **Workers & Pages > blockbench-edu > Deployments**, then open the production website to verify the change. Visitors already editing do not reload automatically.

For an immediate rollback, open **Deployments**, find a previously successful production deployment, and choose **Rollback to this deployment** from its actions menu. Update the source before the next push so that a later deployment does not reintroduce the problem. See Cloudflare's [Git integration guide](https://developers.cloudflare.com/pages/get-started/git-integration/) and [rollback instructions](https://developers.cloudflare.com/pages/configuration/rollbacks/).

The existing **Publish Blockbench Edu** GitHub Actions workflow remains a manual publishing route for the previous GitHub Pages address, https://nchiari.github.io/blockbench-edu-web/. It does not publish to Cloudflare. Historical validation records retain the URLs where those checks were performed.

Local creation needs no student account or database. Models and addons are processed in the browser. Optional classroom delivery uses the owner's Apps Script receiver and private Drive folder; see `../infrastructure/drive/README.md`. `drive-inbox.js` is included in the content-hashed host bundle. Classroom codes are supplied by the teacher through a fragment link and are not embedded in the published source. The Apps Script editor transport must be deployed before enabling a class for students. Students can download portable `.bbedu` projects with “Guardar mi criatura” and reopen them with “Abrir una criatura” from the wizard, home screen or editor. The teacher panel provides the same actions. These files contain the embedded model/PNG, untouched source addon and versioned Edu editing metadata, without classroom codes. Opening preserves existing projects in separate tabs; undo history and temporary view/tool state restart. There is no automatic persistence after closing the tab. Classroom delivery sends the `.mcaddon` and a companion `.bbmodel` for the teacher; portable `.bbedu` projects are shared separately.

Edu assets use content-derived filenames: the generated HTML references hashed host JavaScript and CSS, and that host references the hashed plugin. The canonical `blockbench_edu.js` remains available for manual installation. Each changed plugin produces a new host filename too, preventing reuse of an older plugin from the browser cache. Existing open editing sessions do not reload automatically.
