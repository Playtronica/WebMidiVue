# WebMidiVue

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

The production build is an installable PWA. After one successful online visit,
the settings UI and hash routes are cached for offline use. Firmware updates are
intentionally online-only because the latest `.uf2` file is fetched from GitHub.

Build the isolated Biotron beta (direct Biotron launch, visible source revision,
and a separate PWA identity) with:

```
npm run build:biotron-beta
```

The PWA works in current desktop Chrome/Edge on Windows, macOS and Linux. It is
not an `.exe`: the browser installs a standalone shortcut after the first online
visit. Safari and Firefox are outside this beta because the Settings UI requires
Web MIDI. Deploy this build only on a dedicated beta origin; never under the
production service-worker scope.

The ordinary `npm run build` deliberately contains no manifest, service worker,
or registration. `npm run test:production-isolation` enforces that boundary so
this beta cannot silently alter the existing production Settings lifecycle.

Verify the generated service worker, revisioned app shell and manifest:

```
npm run build:biotron-beta
npm run test:pwa
npm run test:firmware
npm run test:pwa:browser
```

`npm run test:biotron` runs the complete deterministic beta gate. Use scripts
and the local browser test before asking for human review; reserve model review
for architecture, customer claims and release decisions. No test or automation
in this branch pushes, deploys, publishes firmware, or touches production.

The browser lifecycle test uses an installed Chrome/Chromium (`CHROME_PATH` can
override discovery) and covers service-worker install/control, offline direct
navigation, the offline firmware guard, and a non-disruptive waiting update.

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
 
