# Blockbench Edu web

GitHub Pages: https://nchiari.github.io/blockbench-edu-web/

This independent classroom adaptation builds Blockbench 5.2.2 at the exact commit in `upstream.json`. The root `blockbench_edu.js` is the only Edu plugin source. `edu-web.js` loads it automatically after native setup and opens the assistant; the plugin's web-only callbacks return to the start screen on cancellation. The manual plugin has no automatic startup.

## Rebuild

Use Node 22.15.0 and npm. From the repository root:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm test
npm run build:web
```

The builder downloads the pinned upstream source, installs its locked dependencies without lifecycle scripts, applies host-specific guards for PWA registration and official-site telemetry, invokes the upstream web build, and assembles `web/dist/`. Upstream files and dependencies are cached under ignored `output/web-build/`. All guards are recorded in `build.mjs`. The generated HTML adds Edu's loading screen and bootstrap, uses Spanish, and omits the upstream PWA manifest. The site does not register a service worker. Upstream third-party license notices remain in the bundle and assets.

For a local preview under the same subpath as Pages, run `npm run preview:web`, then open http://localhost:4173/blockbench-edu-web/.

## Publish

The public repository uses GitHub Pages with GitHub Actions. Push source changes, then manually run **Publish Blockbench Edu** in Actions. Publishing is not triggered by pushes. The workflow checks, builds and deploys the site. For rollback, run that workflow on a branch containing the previously working revision. Visitors already editing do not reload automatically.

No server, student account or database is required. Models and addons are processed in the browser. Education sessions remain in memory; closing the tab does not preserve the complete Edu session.

Edu assets use content-derived filenames: the generated HTML references hashed host JavaScript and CSS, and that host references the hashed plugin. The canonical `blockbench_edu.js` remains available for manual installation. Each changed plugin produces a new host filename too, preventing reuse of an older plugin from the browser cache. Existing open editing sessions do not reload automatically.
