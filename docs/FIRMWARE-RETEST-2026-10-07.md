# Firmware retest — 7 October 2026

Build source: codex/biotron-updater-layout @42043c8; browser localhost:49291/#/biotron.

## Verified again

- Firmware contract suite: PASS (artifact validation before BOOT, write destination,
  error handling, manual legacy BOOT and downgrade guard).
- Settings readback and initial-read/retry suites: PASS.
- MIDI lifecycle suite: PASS.
- Diagnostics contract suite: PASS.
- Real browser: connected Biotron Port 1 v1.10.8, Settings loaded. Bundled firmware
  1.9.8 beta08 is correctly unavailable as an update to a newer installed version.

## Physical acceptance: NOT RUN

User authorized firmware update/rollback testing. No device flash, restart or
rollback was performed: a provenance-checked compatible return image is missing.
The required update → rollback → reflash cycle remains incomplete.

Search covered official GitHub release APIs for Playtronica/biotron-firmware and
Playtronica/biotron-releases, the former's Actions artifacts API, local Projects,
ProjectData firmware history, Downloads and /private/tmp UF2 files. Official release
responses included 1.8.2 and older, but no 1.10.8 image. Local available candidate is
1.9.8 beta08; historical images exist through 1.8.2. Personal lab repo API returned
404 (unavailable through this access, not proof it never existed).

Next: establish the installed 1.10.8 image/source and board compatibility, obtain a
verified return/recovery image, export device settings, then execute the physical
cycle. Do not silently replace this requirement with simulated tests or leave the
bench unit on an older image without a defined restoration path.

## Simplification finding

The updater build is pinned to an older artifact than the attached test unit.
One tested target manifest (version, board, source SHA, hash, recovery image) should
feed both the build and acceptance checklist. This avoids having to discover which
image can return the bench unit after rollback. Implementation awaits the artifacts.
