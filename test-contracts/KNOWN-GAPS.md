# Known gaps that a green web suite does not hide

1. **Shared firmware updater safety is not in this branch.** Current
   `src/assets/js/LoadFirmware.js` sends BOOT immediately after starting the
   GitHub request. It does not first require a successful response, a valid UF2
   asset or an online state. Biotron beta/PWA work contains a safer ordering,
   but it must be integrated and tested for every updater consumer before the
   common gate can cover firmware update.
2. **Physical MIDI is mocked.** The suite does not prove endpoint identity,
   same-name multi-device pairing, Windows exclusive ownership, Release /
   Reconnect, unplug/replug or hardware response.
3. **Orbita is a separate web application.** It is inventoried but not run by
   `npm run test:all-devices` yet.
4. **Codec invocation is below the UI event layer.** Every source codec and
   route is tested, and every codec must have a UI reference, but a real
   pointer/keyboard change through every control still belongs in the physical
   per-device card.

These are release blockers or separate gates, not excuses to weaken the tests
that already pass.
