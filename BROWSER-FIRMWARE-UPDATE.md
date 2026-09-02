# Biotron browser firmware update

Internal beta contract. This is not a production release.

## User flow

1. Settings reads the installed firmware version over MIDI.
2. `Download & verify` fetches the complete UF2 while Biotron is still running.
3. The browser verifies exact size, SHA-256, UF2 block sequence, RP2040 family
   and that every block stays below Biotron's settings sector.
4. Only after those checks, `Restart Biotron` sends the existing software BOOT
   command. User settings are not erased.
5. `Choose RPI-RP2 & install` opens the browser's system directory picker and
   writes the already verified bytes directly to that drive. There is no
   downloaded file to drag manually.
6. Success is shown only after the MIDI device reconnects and reports the exact
   expected version.

Chrome and Edge require a user gesture for filesystem access. The system drive
picker is therefore an intentional security boundary, not a removable UX step.
[Chrome documents `showDirectoryPicker()` and writable file streams](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access).

## Beta 1.9.8 identity

- Source: `biotron-firmware` commit `7471707`
- UF2: `biotron-1.9.8-beta08-organic-led.uf2`
- Size: `110592` bytes
- SHA-256: `38c7fd35ef5e456d86b03f50f380d499519835fa84b7516fbd7b1cd1012b91da`
- RP2040 family: `0xe48bff56`
- Biotron settings sector begins at `0x10080000` and is rejected as a write target

The file lives in `beta-assets/firmware/` and is copied only by
`npm run build:biotron-beta`. A normal production build contains neither this
file nor the beta PWA/service worker. GitHub's release API also exposes a
SHA-256 digest for release assets; public release lookup now fails closed when
that digest is absent: [GitHub release asset schema](https://docs.github.com/en/rest/releases/assets).

## Failure rules

- Offline, missing digest, bad size/hash/UF2, wrong family or settings overlap:
  do not send BOOT.
- Wrong directory: write nothing.
- Cancelled picker: keep the device in BOOT and let the user choose RPI-RP2
  again.
- Copy error or reconnect timeout: never display success; ask for USB reconnect
  and version inspection before retrying.
- Never infer success from the file copy alone.

## Tests

`npm run test:biotron` covers production isolation, exact artifact identity,
malformed/unsafe UF2 rejection, wrong drive, browser state transitions, MIDI
lifecycle, PWA offline/update behavior and real headless-Chrome sound tests.
Physical acceptance still requires a known Fibonacci/A08 unit, exact rollback,
one browser update, settings comparison and version readback.
