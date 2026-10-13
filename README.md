# WebMidiVue

## Project setup
```
npm ci
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Tests every Settings device

```bash
npm run test:all-devices
```

This fail-closed gate currently covers Biotron, TouchMe, Playtron, Scales and
Circle: 11 internal routes and 107 command codecs. It verifies every declared
command's minimum/middle/maximum and rejected out-of-range values, valid 7-bit
SysEx framing, UI-to-registry references, route/component inventory, a normal
production build, explicit SysEx permission and a real headless-Chrome render
with mocked MIDI ports and zero runtime errors. Orbita stays recorded as an
external Settings surface in `test-contracts/device-matrix.json`.

The browser lane intentionally never opens or changes physical hardware. USB
enumeration, sensor/audio response, persisted readback, firmware update,
Windows DAW ownership and rollback remain separate device-lab gates; a mocked
PASS must never be presented as physical product acceptance.

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
 
