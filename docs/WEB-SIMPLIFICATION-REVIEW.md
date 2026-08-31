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
| P0 review | Physically verify cancellation during unplug/navigation | S | medium | real device + browser |
| P0 next | Version/capability negotiation; one wire protocol per session | M | high | released-firmware matrix + real device |
| Done | Shared Chrome/static-server test harness | S | low | identical browser scenarios before/after |
| P1 | Bootstrap SCSS subset, one component family at a time | M | medium | screenshots at desktop/mobile/200% zoom |
| P1 | Shared MIDI session core for Settings and Sound | M | medium | existing race suite + 100 reconnect cycles |
| P2 | Merge 90%+ duplicate Release/Test pages via route mode | L | high | golden presets/MIDI for every device |
| P2 | Isolated Vite build-equivalence spike | M | medium | byte/routes/PWA/update parity; no runtime diff |

Do not combine the first two rows: the queue is transport mechanics; protocol
selection is a firmware compatibility decision and needs its own rollback.

### S0 — mechanical reduction (this branch)

- Lazy-load device routes.
- Remove dead App state, two unreachable components and unused direct dependencies.
- Keep normal-production/PWA isolation tests green.
- Record entry bundle and route chunks before/after.

### S1 — lifecycle safety (listener slice completed)

- Keep every component-owned global listener inside the scoped-listener utility.
- Add a navigation stress test: visit A→B→A 100 times; one event must trigger
  exactly one handler and heap growth must remain bounded.
- One shared browser-test server/Chrome locator now serves both sound and PWA
  suites without changing their scenarios.

### S2 — non-blocking MIDI transport (timing slice completed)

- All 44 CPU-blocking waits now yield to the browser event loop while preserving
  released 100 ms pacing (and the Scala loader's 1 s pacing).
- One save operation is single-flight and the loader remains visible until its
  asynchronous sequence finishes.
- The old selector explicitly opens matching outputs instead of sending an
  invalid empty MIDI packet; non-matching inputs no longer receive handlers.
- BOOT waits for both legacy/current reset frames before navigating to firmware.
- Automated Chrome measured a 28.1 ms maximum event-loop gap during a complete
  offline Biotron settings write; the regression budget is 500 ms.
- A shared write session now cancels before the next MIDI message after device
  switch, disconnect, port close or component unmount. Unit tests prove it never
  continues on a replacement output.
- Before merge, verify the same cancellation paths with a real unplug and route
  change. Do not make the released pacing faster without firmware tests.
- Stop sending both current and deprecated protocols blindly. Negotiate once,
  cache the result for the connection, and fail visibly on ambiguity.
- Test queue saturation and old firmware; physical unplug/route tests remain a
  release gate even though deterministic cancellation tests are green.

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

## Completed simplification pass — 2026-08-31

Compared with `a862c25`, the four atomic commits remove 524 net lines:

- source files: 60 → 59;
- product source lines: 10,049 → 9,515 (−534);
- test/script lines: 2,227 → 2,370 (+143 for cancellation, lifecycle and
  legacy-selector contracts);
- direct dev dependencies: −3; clean `npm ci` and the full gate pass;
- CPU-blocking MIDI waits: 44 → 0;
- unmanaged component/global listener files: 0;
- unreachable components: −2 files / −576 lines.

The product runtime was not deployed. Each commit is reviewable independently;
the final branch only stacks already-tested commits.

### Model routing contract

- Deterministic scripts measure reachability, references, bundle size and test
  results before any model judgment.
- SOL may perform one mechanical net-negative change at a time: remove proven
  dead code/dependencies, consolidate exact test-only duplicates, or maintain a
  ratchet. Wire bytes and UX must remain unchanged and the full gate is required.
- Strong review plus hardware evidence is mandatory for MIDI lifecycle,
  protocol/version negotiation, presets, firmware update, device identity,
  sound/LED meaning and any release decision.
- Ambiguity means stop and escalate; no model may turn an assumption into a
  customer claim, merge or deployment.
