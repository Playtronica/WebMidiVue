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

The primary beta test path is current Chrome/Edge on a Windows, macOS or Linux
computer. It is not an `.exe`: the browser installs a standalone app after the
first online visit. Android Chrome is an experimental field-test path and also
needs USB host/OTG support plus a data-capable cable. No exact phone model is a
release-certified target yet. Standard browsers on iPhone/iPad, desktop Safari
and Firefox do not provide the Web MIDI path required by device Settings.
No computer/OS combination becomes release-certified without the physical
check below. On iOS/iPadOS 17.6+, [MIDIWeb Browser by 5of12
LLP](https://apps.apple.com/us/app/midiweb-browser/id6757226617) is the preferred
experimental research path because it bridges Core MIDI to WebMIDI and supports
the SysEx flow required by Settings. It remains unverified with Biotron until it
passes the same physical evidence gate. Deploy this build only on a dedicated beta origin;
never under the production service-worker scope.

The beta shell deliberately exposes only Biotron's `Play` and `Settings`
tasks. The normal production device navigation remains unchanged. Settings,
presets and live controls stay hidden until the selected Biotron answers with
its saved state; firmware recovery remains reachable when the device is
already mounted as `RPI-RP2`. This prevents a tester from editing an
unverified placeholder state.

Beta routes declare their required capabilities in `src/main.js`. One shared
compatibility gate checks secure context, Web MIDI and Web Audio before mounting
a device page. Unsupported phones and browsers get one
plain-language recovery card; permission denial remains a separate retryable
state. The generic Sound route keeps its on-screen/keyboard audio mode when MIDI
is unavailable and hides the unusable USB controls.

Responsive layout is not evidence that USB control works. Firmware update is
computer-only and online-only; it must remain unavailable on phones. The current
support and evidence boundaries are recorded in:

- [`docs/BIOTRON-BETA-COMPUTER-15MIN.md`](docs/BIOTRON-BETA-COMPUTER-15MIN.md)
- [`docs/BIOTRON-BETA-PHONE-15MIN.md`](docs/BIOTRON-BETA-PHONE-15MIN.md)
- [`docs/BIOTRON-BETA-RELEASE-CHECKLIST.md`](docs/BIOTRON-BETA-RELEASE-CHECKLIST.md)

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
The beta build also emits a Cloudflare Pages `_headers` file that blocks
framing, limits powerful browser permissions, removes referrer leakage and
keeps the private beta out of search indexing. Production does not receive this
file.

Verify the generated service worker, revisioned app shell and manifest:

```
npm run build:biotron-beta
npm run test:pwa
npm run test:firmware
npm run test:pwa:browser
```

Use the smallest test lane that can answer the current question:

```bash
npm run test:quick       # lint, architecture and deterministic module contracts
npm run test:beta-build  # beta build plus artifact/protocol/PWA checks
npm run test:browser     # sound, PWA restart and responsive quality in Chromium
npm run test:biotron     # exact release gate: every lane plus production isolation
```

The responsive quality gate covers desktop, Pixel 7, a compact 320 px viewport
and the iPhone no-MIDI path. It blocks global horizontal overflow, CLS above
0.1, duplicate IDs, visible unlabeled controls, undersized sliders and primary
tap targets below 44 px. These emulated profiles prove layout and browser
behavior, not a physical USB connection. The complete strategy and remaining
manual gates are in
[`docs/WEB-TEST-STRATEGY.md`](docs/WEB-TEST-STRATEGY.md).

Use scripts and the local browser tests before asking for human review; reserve
model review for architecture, customer claims and release decisions. No test
or automation in this branch pushes, deploys, publishes firmware, or touches
production.

`npm run audit:web` prints the current architectural debt and largest files.
`npm run test:architecture` is a ratchet inside the full gate: eager routes and
unmanaged component listeners cannot return, CPU-blocking MIDI waits cannot
return, and source/file-size caps cannot grow silently. The normative
anti-slop review contract (single state owner, bounded async work, no speculative
layers, explicit change budget) lives at the top of
[`docs/WEB-SIMPLIFICATION-REVIEW.md`](docs/WEB-SIMPLIFICATION-REVIEW.md).
`npm run test:midi-timing` proves delays yield to the event loop and
writes stop after device switch, disconnect or close; the browser PWA gate
measures responsiveness during a complete settings write. The
same document records the staged simplification plan and rejected rewrites.

The browser lifecycle test uses an installed Chrome/Chromium (`CHROME_PATH` can
override discovery) and covers service-worker install/control, offline direct
navigation, the offline firmware guard, and a non-disruptive waiting update.

The older Windows/REAPER-specific gate remains in
[`docs/BIOTRON-PWA-WINDOWS-12MIN.md`](docs/BIOTRON-PWA-WINDOWS-12MIN.md).

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
 
