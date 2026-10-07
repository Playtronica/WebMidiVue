# Biotron updater and layout candidate — 7 October 2026

Based on Claude's firmware-modal fix `7e3e471`. This candidate is built with
`npm run build:biotron-firmware-beta`, so its updater and pinned UF2 are included.
The general beta mode remains isolated and does not contain firmware.

## Firmware boundary

The available pinned artifact is **1.9.8 beta-08**, SHA-256
`38c7fd35ef5e456d86b03f50f380d499519835fa84b7516fbd7b1cd1012b91da`.
It is an internal test artifact, not a newly approved public release. The bench
unit reported **1.10.8** on 7 October; this candidate does not offer it a downgrade.
No exact 1.10.8 UF2 with provenance was found. Customer distribution and physical
flash remain pending the intended target artifact, board compatibility and rollback.

For installed firmware below 1.7.4, no software BOOT is sent. The user follows
the hardware BOOT instructions for their model after verification, with a warning
that old firmware may reset saved settings. A preset export is advised first.

## Changes

- More space between task groups and consistent card padding and button gaps.
- Diagnostics are a secondary disclosure, not an equal-weight primary action.
- Preset actions are three columns on desktop and one column on phones.
- Collapsible sections are native keyboard-focusable buttons.
- Velocity range handles have accessible labels; Play has one main landmark.
- Scrollable updater modal with the three steps visible and consistent padding.
- Newer installed firmware is named honestly; no claim it equals the bundled target.

## Validation

Firmware contracts include verify-before-BOOT, malformed/unsafe UF2 rejection,
wrong drive/cancel/write failure, exact reconnect version, old firmware manual
BOOT without a software command, and no downgrade for 1.10.8.
MIDI lifecycle, readback, diagnostics, navigation, compatibility, listener/timing
and sound-core contracts pass. Local firmware-beta compiles.

This is not a full release verdict: new-candidate hardware acceptance, actual
flash/rollback, Windows and phone tests, offline restart and audio soak remain.

The mandatory release contract is in `docs/DESIGN-UX-QA.md`: physical candidate
update → known-good older firmware rollback → candidate reflash through the web,
with exact-version and device-function verification at every stage. Every updater
QA pass also searches for and records a concrete process simplification.
This candidate's physical cycle remains **NOT RUN**; the contract change is not
evidence that a flash or rollback has occurred.
