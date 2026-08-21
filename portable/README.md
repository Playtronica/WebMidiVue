# Biotron Settings Offline — portable Windows beta

This folder builds a single Windows executable containing the production Vue
application and a loopback-only HTTP server. It is a clean-offline beta: the
machine needs Chrome or Edge, but it does not need internet, Node, CMD,
PowerShell, administrator access, an installer, or a service worker.

Pipeline:

`production dist → Go embed → 127.0.0.1:17673 → dedicated Chrome/Edge app profile → Web MIDI/SysEx`

The fixed loopback origin and persistent current-user browser profile preserve
the MIDI/SysEx permission between runs. Closing the dedicated browser window
stops the embedded server. A second launch reopens the already-running local
app instead of starting another server.

Build from the repository root:

```text
npm ci
npm run build:portable:windows
```

Output is written to `artifacts/portable/` and is intentionally ignored by
Git. The build emits the `.exe` plus a SHA-256 sidecar.

Run `npm run test:portable` before publishing an artifact. It performs the
clean-offline browser contract, rebuilds the production UI twice and requires
both resulting Windows executables to have the same SHA-256. Source maps are
deliberately excluded from the executable: the runtime does not use them, and
webpack service-worker maps contain non-reproducible build metadata.

Safety rails:

- The server listens only on `127.0.0.1`, never on the LAN.
- The executable never requests elevation or changes the registry.
- Firmware download/update remains online-only and disabled when Windows is
  offline.
- This does not make Chrome and a DAW share an exclusive MIDI port. Use
  **Release device for DAW** or close the portable window first.
- The unsigned beta is for team testing. A customer artifact requires Windows
  signing and a physical Windows/Biotron acceptance run.
