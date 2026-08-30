# Sound Lab beta

Sound Lab is a small browser synthesizer inside the **Biotron offline beta** build of Playtronica Settings. It is not included in production Settings.

## User flow

1. Open **Sound** in the beta navigation.
2. Press **Start sound** once (browser audio requires a user gesture).
3. Choose one of six numbered sound variants by ear. Names remain internal until listening confirms them.
4. Play with the on-screen keys, physical A–K positions in any keyboard layout, or one selected MIDI input.
5. On a slow computer, enable **Low CPU** before Start: it uses four voices, one oscillator per voice and no reverb.
6. Press **Stop & release** before another application needs that MIDI input.

The engine accepts MIDI Note On/Off on every channel and CC 120/123 panic. It requests MIDI input only with `sysex: false`; it never opens an output, changes device settings, sends firmware commands, or writes to the device.

When the Web Locks API is available, Sound Lab holds an exclusive lock while active. A second Settings window stays silent and does not open MIDI until the first window presses **Stop & release**. Browsers without Web Locks can still play, but show an explicit reminder to keep only one Settings window open.

## Pipeline

`Playtronica MIDI input / physical keyboard / screen keys → bounded voice allocator → oscillators + pitch gesture + vibrato → shared filter/delay/reverb → headroom + compressor → browser audio output`

The engine caps active voices at 8 (4 in safe mode), caps retiring voices, suspends in the background, and hard-stops every voice on Panic/Stop.

## Files

- `src/components/SoundLab/SoundLab.vue` — beta UI and lifecycle.
- `src/components/SoundLab/DisabledSoundLab.vue` — production-safe alias target.
- `src/audio/core.mjs` — MIDI parsing, any-layout keyboard map, bounded voice ledger.
- `src/audio/engine.mjs` — dependency-free Web Audio engine.
- `src/audio/midi.mjs` — selected-input-only MIDI lifecycle.
- `src/audio/tabLease.mjs` — one-active-window lease for audio and MIDI.
- `src/audio/presets.mjs` — six validated Glass Flute variants.
- `scripts/test-sound-core.mjs` — deterministic contracts and close-failure retry.
- `scripts/test-sound-browser.js` — real Chrome/Brave audio, keyboard and fake-MIDI flow.
- `scripts/test-production-isolation.js` — proves the synth does not leak into production.

Sound requests are authored through the project skill at `Playtronica Claude/.agents/skills/playtronica-sound-designer/`. The canonical research and render harness live in `Playtronica Claude/projects/web-audio-synth/`.

## Run and test

```bash
npm ci
npm run test:biotron
npm run serve -- --mode biotron-beta
```

Open `/#/sound`. For Brave:

```bash
CHROME_PATH="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm run test:sound:browser
```

## Safety rails

- Beta only: `@sound-lab` points to the real component only when `VUE_APP_BIOTRON_PWA_BETA=true`.
- The Sound route is lazy. Its current beta chunk is under 8.1 KiB gzip, is precached for offline use and must remain below the enforced 25 KiB budget.
- A MIDI close failure must stay visible and retryable; Start remains blocked until the input closes.
- In a background tab, active notes are stopped and incoming MIDI is ignored until the user returns and presses Start sound; this prevents invisible note accumulation.
- Browser/driver AudioContext suspension is reflected in the UI. An unexpected context close blocks Start until Stop & release closes the still-selected MIDI input, preventing an orphaned port.
- The MIDI input list follows Web MIDI state changes and excludes disconnected ports; reconnecting or adding a device refreshes the selector without opening it automatically.
- Losing window focus releases held computer-keyboard notes so a missed `keyup` cannot leave them sounding; hardware MIDI remains connected.
- Navigating away runs the same awaited teardown. If audio or MIDI cannot close, routing is cancelled and the visible Stop button remains available for retry.
- MIDI voice-count diagnostics are coalesced to one Vue update per animation frame; the browser test injects a 1000-message burst and verifies the 8-voice cap and Panic recovery.
- The same browser test runs a 20,000-message soak with garbage collection/heap comparison, then verifies disconnect, reconnect and background suspend/resume.
- The browser test opens two Settings tabs and proves exclusive handoff: tab B cannot start until tab A releases the lease.
- The same real-browser test enables Low CPU, holds eight keyboard notes and proves the active graph remains capped at four voices before returning to Standard mode.
- After injected MIDI-close and AudioContext-close failures with successful retries, the browser test completes 100/100 Start → Stop & release cycles with no page error or stale tab lease.
- Automated rendering proves bounds and stability, not whether a timbre is beautiful. Human listening is a release gate.
- Chrome/Edge/Brave support MIDI. Safari can run Web Audio but does not provide Web MIDI, so device input is not promised there.
- Never merge/deploy this beta branch to production without maintainer review and physical device listening.
