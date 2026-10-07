# Firmware QA logging — 7 October 2026

## Existing logging and gaps

`src/biotron/telemetry.mjs` sends allowlisted MIDI/audio/settings/calibration events
best-effort to `/api/telemetry`, at most 80 events per session. It drops offline
traffic and does not wait for or verify delivery. A Python static localhost server
has no telemetry POST receiver, so it cannot establish server persistence.
`beta-assets/telemetry-worker.mjs` supports D1 persistence on a configured deployment;
this session did not verify the production database. Firmware phases were absent
from the remote event allowlist. Therefore "everything is logged" was not true.

## Added logging

Firmware component phase transitions now use the existing telemetry module's
local-only journal, `biotron.firmware-journal.v1`. Storage is bounded to 200 events;
only timestamp, allowlisted phase, validated installed/target version and build
identity are stored. No serial, raw MIDI, directory path or error message is sent.
Storage failure never interrupts update. Export at `/firmware-journal.html` on the
same browser origin; other origins have separate journals. Storage is best-effort,
not guaranteed persistence after browser clearing or quota failure.

`python3 scripts/run-biotron-qa.py --output <evidence-directory>` writes one JSONL
result per software suite and its full stdout/stderr to separate files. A failed
suite makes the runner fail. Native hardware actions use the existing Mac bench
JSON evidence. A phase log alone does not prove successful flash or rollback.

Private physical evidence and device backups:
`~/ProjectData/playtronica-firmware/biotron/2026-10-07-web-retest/`.
Do not commit raw settings, serials or backups. Copy any remaining temporary
records there before closing the physical test.

## Physical observations so far

User identified the unit as Fibonacci. Installed 1.10.8 was queried on both MIDI
paths. Direct flash read with picotool save -r and -v made a verified program backup
(up to settings sector 0x10080000) and separate 4096-byte settings backup. Software
BOOT and application return passed twice without writing firmware.
Program backup SHA-256: 18c51ed359479def2bfa3f0bc6d7ac464fe4da861abc4824e67eac7772c328f4.
`picotool info` crashed (exit 139); range save/verify and reboot succeeded.

Pinned 1.9.8 beta08 was hash-verified, written via picotool with flash verification,
and queried as exact 1.9.8. Settings readback passed both cables. Note capture
reported 49 On/50 Off, one unmatched Off, no active notes. This remains FAIL/
inconclusive pending a capture with controlled start; do not claim balanced pass.

Official rollback 1.8.2 hash matches GitHub release digest:
d2406d66225f76779331714b0a9df814d1c72d7f3640178f29adc9d3b45b4251.
Write verification and settled exact-version query passed. An immediate version
query before USB enumeration failed; a later query passed. 1.8.2 has no modern
settings-readback protocol, so the web's repeated Retry instruction is misleading.
Record this as a legacy UX issue, not evidence of broken settings storage.

The web offered 1.9.8, verified bytes and sent BOOT. The actual system directory
picker is pending user selection; automation cannot access its native IAB window.
Do not claim completed web reflash or restore 1.10.8 while that write is pending.

## Validation

All ten suites in the logged QA runner pass. Journal tests pass (allowlist, bound,
version sanitization, quota isolation); firmware and telemetry contracts pass.
Architecture cap unchanged, lint and firmware-beta build pass. Existing webpack
asset-size warnings remain. Initial test harness failed on the new import; its
explicit module mock was updated and the real journal tested separately.
