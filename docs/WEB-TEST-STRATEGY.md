# Web Settings test strategy

Updated 2026-09-26. This document separates fast feedback, browser evidence,
performance signals and physical MIDI acceptance. One green layer never stands
in for another.

## The four lanes

| Lane | Command | Answers | Does not prove |
|---|---|---|---|
| Quick | `npm run test:quick` | lint, architecture caps, protocol parsing, cancellation, settings readback, sound math and navigation contracts | emitted assets, browser lifecycle or hardware |
| Beta build | `npm run test:beta-build` | the isolated PWA build, precache, manifest, firmware fail-closed contract and fake-MIDI component lifecycle | real browser installation or physical USB |
| Browser | `npm run test:browser` | Chromium sound, persistent-profile PWA restart/update and desktop/mobile responsive quality | Safari Web MIDI, phone USB host behavior or a real Biotron |
| Release | `npm run test:biotron` | every lane plus a normal production build and beta/production isolation | physical acceptance or whether the sounds are musically good |

Run the quick lane while editing, the affected browser script while diagnosing,
and the full release lane once from the exact commit that will be deployed.
Explicit long waits are reserved for behavior with a real product timeout; all
other browser locators fail within five seconds.

On the 2026-09-26 development machine the quick lane took 13.6 seconds and the
complete release lane took 94.7 seconds. Treat these as orientation rather than
performance budgets: the useful contract is the small edit loop versus one
complete pre-deploy gate.

## Browser quality contract

`scripts/test-quality-browser.js` uses the existing `playwright-core` and shared
static server, so it adds no dependency or second runner before beta. It checks:

- desktop 1440×900;
- Playwright's Pixel 7 profile;
- a 320×568 compact touch viewport;
- Playwright's iPhone 15 profile with Web MIDI absent.

Every profile must have one `main` landmark, `lang="en"`, no document-level
horizontal overflow, no unexpected layout shift above CLS 0.1, no duplicate
IDs, no visible unlabeled controls and no recorded page exception. Visible range
inputs must expose at least a 24 px target; primary navigation and feedback
actions keep the product's 44 px touch target.

Playwright recommends user-visible locators, isolated contexts and web-first
waiting. Its device profiles emulate viewport, screen, user agent and touch;
they are not physical-device evidence:

- <https://playwright.dev/docs/best-practices>
- <https://playwright.dev/docs/emulation>

## Visual regression: add after the beta UI settles

The next test-infrastructure slice should move the browser suites to
`@playwright/test`, split the 700+ line sound scenario by user journey and add
traces on the first CI retry. Then add reviewed screenshots for Settings and
first play at desktop, mobile and 200% zoom. Playwright warns that screenshot
baselines depend on the exact OS, browser, headless mode and hardware, so the
baseline belongs in one pinned CI image rather than each developer's laptop:

- <https://playwright.dev/docs/test-snapshots>

Do not add a second runner only for screenshots before the current physical
beta candidate is accepted. The present structural layout gate catches the
largest regressions without a dependency or baseline-review burden.

## Accessibility

The browser gate protects accessible names, landmarks, IDs and touch geometry.
A later `@axe-core/playwright` pass can cover automatically detectable WCAG A/AA
issues. It must not be called complete accessibility testing: Playwright and W3C
both require manual assessment for keyboard flow, focus order, zoom, screen
reader meaning and tasks that automation cannot judge.

- <https://playwright.dev/docs/accessibility-testing>
- <https://www.w3.org/WAI/test-evaluate/preliminary/>

Before the 30-person wave, manually complete one keyboard-only pass and one
VoiceOver or NVDA pass over Connect → change MUTE → save → release → reconnect.

## Performance

Lighthouse 13.5 on the pre-fix candidate measured performance 69,
accessibility 81, best practices 100 and CLS 0.722 on 2026-09-26. After the logo,
layout and form fixes, the same local lab setup measured 96 / 100 / 100 and CLS
0.034. The browser release gate now reports CLS 0.000 at desktop, Pixel 7,
320×568 and the iPhone no-MIDI path. Keep the before/after values as diagnostic
history, not a promise about a customer's phone or network.

Treat Lighthouse as repeatable lab diagnosis, not production truth. Field Core
Web Vitals should be judged at the 75th percentile, separately for mobile and
desktop. The current “good” thresholds are LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1:

- <https://web.dev/articles/vitals>
- <https://developer.chrome.com/docs/lighthouse/overview>

Keep the existing 500 ms event-loop regression ceiling for a complete settings
write, but record the actual result. It protects MIDI safety on constrained
machines; it is not a substitute for field INP.

## Physical evidence remains separate

- Computer: current Chrome/Edge, real USB data cable, permissions, MUTE write,
  reconnect, offline restart, firmware guard and DAW handoff.
- Android: exact phone/OS/Chrome/adapter/cable/power combination; emulation can
  only prove layout and the capability-gate branch.
- iPhone/iPad: normal browsers must stop honestly before Web MIDI Settings.
- Firmware update: computer only; no phone test may enter BOOT.

Use `BIOTRON-BETA-COMPUTER-15MIN.md` and
`BIOTRON-BETA-PHONE-15MIN.md`. A fix creates a new commit, build and immutable
URL; previous physical evidence does not transfer silently.

## Simplification backlog

1. **After physical acceptance:** split `test-sound-browser.js` by user journey
   under Playwright Test, keeping one shared fake-MIDI fixture and trace only on
   retry. This improves failure localization without changing product behavior.
2. **After wave 1:** remove unrelated device routes from the beta router bundle,
   if the change can remain production-isolated. They are now hidden from beta
   navigation and excluded from its offline precache, while the shared
   production router still emits their lazy chunks into `dist`.
3. **Visual slice:** replace Bootstrap's full CSS with a reviewed component
   subset only after pinned screenshots exist. Lighthouse reported about 94% of
   the initial vendor CSS unused on the Biotron route, but route-wide references
   make heuristic purging unsafe.
4. **CI hardening:** replace the production workflow's `actions/checkout@v2`,
   unpinned third-party `@develop` action and `npm install`. Use a reviewed,
   SHA-pinned workflow, explicit Node version, `npm ci`, quick tests on pull
   requests and the full gate before deployment. This is a production-pipeline
   change and must be reviewed separately, not smuggled into the beta UI patch.

Avoid running every suite in every edit loop, adding retries that hide flakes,
or broad cross-browser matrices for a Web MIDI feature the target browser does
not expose. Test the supported capability path deeply and negative paths
honestly.
