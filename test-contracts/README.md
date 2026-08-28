# Web Settings all-device contract

`device-matrix.json` is the executable inventory for every Settings surface in
this repository. `npm run test:all-devices` fails when a route, component,
command codec, range or SysEx frame drifts without an explicit matrix update.

Current automated boundary:

- Biotron, TouchMe, Playtron, Scales and Circle;
- 11 routes;
- all 107 declared MIDI/SysEx command codecs at minimum, middle, maximum and
  rejected out-of-range values;
- production build and real Chrome render with mocked Playtronica MIDI ports;
- explicit SysEx permission request and zero browser runtime errors.

Orbita is intentionally listed as an external Settings surface. Its separate
repository must gain an equivalent command before the central Playtronica
runner can call it green.

This test never proves physical USB, sensors, audio, persistent flash, firmware
update, Windows/DAW ownership or rollback. Those lanes live in
`projects/firmware-engineering/devices/product-matrix.json` and remain manual or
`BLOCKED` until real-device evidence exists.

When adding a device or function, update source and this matrix in the same PR.
Do not reduce an expected command count to hide an accidentally removed UI
control; explain the intentional compatibility change in the PR.
