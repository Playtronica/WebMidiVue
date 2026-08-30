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

The ordinary production build keeps the current website behaviour and does not
install a service worker. The dedicated Biotron beta below is an installable
PWA: after one successful online visit, its settings UI and hash routes are
cached for offline use. Firmware updates are intentionally online-only because
the latest `.uf2` file is fetched from GitHub.

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

Beta routes declare their required capabilities in `src/main.js`. One shared
compatibility gate checks secure context, desktop support, Web MIDI and Web
Audio before mounting a device page. Unsupported phones and browsers get one
plain-language recovery card; permission denial remains a separate retryable
state. The generic Sound route keeps its on-screen/keyboard audio mode when MIDI
is unavailable and hides the unusable USB controls.

Biotron first play treats firmware stabilization as its own state. Released
firmware 1.8.2 and the current firmware branch sample the plant every 100 ms,
wait for roughly five seconds of stable signal, then measure a baseline for
roughly five seconds while the green LEDs pulse and MIDI notes 91/92 alternate
at velocity 90. `src/audio/biotronCalibration.mjs` recognizes four quick
alternations and waits for 700 ms of silence before inviting the user to touch
the plant. This is deliberately a bounded MIDI-pattern inference, not a new
firmware status claim; an explicit read-only status message would be stronger.

The beta Settings page also contains an explicit `Calibrate plant again`
control for the matching firmware draft. It sends vendor SysEx command `123`
with a nonce and accepts only nonce-matched progress (`waiting`, `measuring`,
`ready`) reported by the device. Older firmware is left untouched and gets a
clear reconnect fallback after the capability timeout. The command never uses
BOOT and the firmware-side contract forbids settings or flash mutation.

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

The physical Windows release gate is in
[`docs/BIOTRON-PWA-WINDOWS-12MIN.md`](docs/BIOTRON-PWA-WINDOWS-12MIN.md).

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
 
