# Web Settings simplification review

Status: local review branch; no production deploy. Updated 2026-08-30.

## Outcome first

Keep Vue 3 and the current Vue CLI build for now. The safest high-value path is
to extract a small framework-independent core while reducing the existing app
in measured steps. A rewrite to Vite, TypeScript, React, Electron or Tauri would
increase release risk before it fixes the known lifecycle and protocol debt.

This pass removes unused browser dependencies and dead app state, loads each
device only when its route opens, and scopes legacy global listeners to their
Vue component lifetime. The complete beta gate remains the release contract.
No production deployment is part of this branch.

## Evidence

- The complete deterministic beta gate passed before this review.
- The app has about 10k source lines and 2k test-script lines.
- Device routes were imported eagerly, so opening one device downloaded every
  device page.
- Eight direct dependencies had no repository reference. `cors` was incorrectly
  installed as a Vue browser plugin; CORS can only be granted by the server.
- Bootstrap JavaScript is limited to Collapse and Modal. A native accessible
  title replaces the 100+ KiB Tooltip/Popper path for one information icon.
- Font Awesome is imported as nine individual SVG assets instead of shipping
  seven font files and its complete global stylesheet for nine icons.
- The old MIDI send path calls a CPU-blocking `sleep()` about 40 times.
- Multiple legacy device pages added global document listeners without removing
  them. This pass routes them through one tested scope that clears on unmount.
- Two MIDI lifecycle implementations exist: device settings and the Sound Lab.
- Several page families keep near-duplicate Release/Test/Standalone variants.

Run `npm run audit:web` for the current mechanical inventory. The full test gate
also runs `npm run test:architecture`: known debt may decrease but cannot grow.

## Measured result of S0

Measured from clean production builds on 2026-08-30:

- Initial entry assets fell from about 719 KiB to 382 KiB (47% smaller).
- Initial compressed JS+CSS fell from about 171 KiB to 86 KiB (50% smaller).
- App JS fell from 152.5 KiB to 15.0 KiB; device code is loaded by route.
- The lockfile contains 1,109 package entries instead of 1,140.
- Seven Font Awesome font assets (about 1 MiB unpacked) no longer ship.
- Unmanaged component-listener files fell from 11 to zero.

The largest remaining first-load asset is Bootstrap CSS at about 222 KiB. Do
not purge it heuristically: 361 template references use Bootstrap-style classes.
A later visual-regression slice can compile a reviewed SCSS subset one component
family at a time.

## Toolchain security and migration boundary

`npm audit --omit=dev --package-lock-only` reported zero production dependency
vulnerabilities on 2026-08-30. The full development lockfile reported 21 issues
(10 high, 11 moderate) through the legacy Vue CLI build chain. Its automatic
`--force` proposal would downgrade the CLI plugin and is rejected.

Vue officially places Vue CLI in maintenance mode and recommends Vite for new
Vue projects: <https://vuejs.org/guide/scaling-up/tooling>. That makes a bounded
Vite equivalence spike sensible after S2, not a reason to mix a toolchain rewrite
with MIDI lifecycle changes. The migration must reproduce normal/beta isolation,
Workbox update behavior, all lazy offline chunks and every current browser test
before the old build can be removed.

## Recommended target

```text
App shell + lazy router + beta PWA
  └─ device registry (name, routes, capabilities)
      └─ thin Vue pages
          ├─ settings controller
          └─ sound controller
              └─ pure browser-independent core
                  ├─ MIDI session and port policy
                  ├─ protocol/version negotiation
                  ├─ paced, cancellable command queue
                  ├─ presets and validation
                  └─ firmware manifest validation
```

The core should use plain JavaScript modules and `node:test`. Vue remains a view
layer. Browser and hardware adapters stay at the edge, which makes most behavior
testable without Chrome or a connected instrument.

## Alternatives considered

1. **Ratchet the current app — do now.** Lazy routes, remove dead dependencies,
   manage every listener, replace blocking waits, share test infrastructure.
   Lowest risk and immediately useful.
2. **Pure core + thin Vue adapters — recommended target.** Extract behavior one
   module at a time while old pages remain operational. Best reliability-to-risk
   ratio.
3. **Device manifest + generic settings renderer — later.** Can remove most page
   duplication, but only after protocol/value semantics have golden tests for
   every device.
4. **Separate beta app entry — optional.** Stronger product isolation than build
   aliases, but creates a second shell to maintain. Consider only if beta and
   production navigation continue diverging.
5. **Toolchain/framework rewrite — reject for this incident.** Vite/TypeScript or
   another UI framework can improve developer ergonomics later, but a rewrite
   does not solve MIDI ownership, stale listeners or firmware compatibility.
6. **Desktop wrapper — separate product.** Packaging Web MIDI does not remove OS
   port ownership. Only revisit with a proven native MIDI/UF2 advantage.

## Staged plan and gates

| Priority | Change | Size | Risk | Proof required |
|---|---|---:|---:|---|
| P0 next | Cancellable MIDI command queue; keep 100 ms pacing | M | medium | fake timers + old/current firmware |
| P0 next | Version/capability negotiation; one wire protocol per session | M | high | released-firmware matrix + real device |
| P1 | Shared Chrome/static-server test harness | S | low | identical browser scenarios before/after |
| P1 | Bootstrap SCSS subset, one component family at a time | M | medium | screenshots at desktop/mobile/200% zoom |
| P1 | Shared MIDI session core for Settings and Sound | M | medium | existing race suite + 100 reconnect cycles |
| P2 | Merge 90%+ duplicate Release/Test pages via route mode | L | high | golden presets/MIDI for every device |
| P2 | Isolated Vite build-equivalence spike | M | medium | byte/routes/PWA/update parity; no runtime diff |

Do not combine the first two rows: the queue is transport mechanics; protocol
selection is a firmware compatibility decision and needs its own rollback.

### S0 — mechanical reduction (this branch)

- Lazy-load device routes.
- Remove dead App state and unused direct dependencies.
- Keep normal-production/PWA isolation tests green.
- Record entry bundle and route chunks before/after.

### S1 — lifecycle safety (listener slice completed)

- Keep every component-owned global listener inside the scoped-listener utility.
- Add a navigation stress test: visit A→B→A 100 times; one event must trigger
  exactly one handler and heap growth must remain bounded.
- Extract one shared browser-test server/profile helper.

### S2 — non-blocking MIDI transport

- Replace the busy loop with a cancellable FIFO command queue.
- Preserve the released 100 ms pacing until firmware/version tests authorize a
  faster rate.
- Stop sending both current and deprecated protocols blindly. Negotiate once,
  cache the result for the connection, and fail visibly on ambiguity.
- Test cancellation, unplug, route change, queue saturation and old firmware.

### S3 — pure device core

- Extract MIDI session state, presets and protocol encoding from Vue components.
- Characterize each released device before combining duplicate pages.
- Remove a legacy page only after route, preset and MIDI golden tests pass.

### Release gate

Every stage must pass lint, normal production isolation, beta build/PWA tests,
fake-Web-MIDI lifecycle tests and browser tests. Windows Chrome/Edge with real
hardware remains required for MIDI ownership, reconnect and offline acceptance.

## Rules that keep the project easy for the firmware developer

- One behavior change per commit; tests and reason in the same commit.
- No repository-wide formatting and no force-push.
- Keep released wire bytes and pacing unless a golden test names the change.
- Prefer deletion and pure modules over a new framework or abstraction layer.
- A new helper must replace at least two copies or close a proven failure mode.
- Production and beta remain separate build contracts; neither deploys itself.
