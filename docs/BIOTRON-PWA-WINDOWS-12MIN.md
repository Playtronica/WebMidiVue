# Biotron offline PWA — Windows test (12 minutes)

Use one Biotron, a normal Windows account, current Chrome or Edge, and REAPER.
Do not flash firmware, run as administrator, change browser flags, or debug past
the time limit. The beta URL must be on a dedicated non-production origin.

## 0:00–2:00 — install once online

1. Close REAPER. Connect one Biotron directly by a known data-capable USB cable.
2. Open the beta URL. Confirm the page says **Biotron offline beta** and record
   the short source revision shown beside it.
3. Allow MIDI and SysEx. Select a Biotron entry. If Windows lists Port 1 and
   Port 2, record which one you selected; do not connect a second Biotron.
4. Wait for **Ready offline**, then install from the page button or the
   Chrome/Edge address bar. Launch the installed app once.

## 2:00–5:00 — real device write

1. Toggle **MUTE** on, press **Send to Device**, and confirm plant notes stop.
2. Toggle **MUTE** off, send again, and confirm plant notes return.
3. Stop immediately if the device disappears, the page reports success after a
   visible error, or Windows becomes unstable.

## 5:00–8:00 — true offline restart

1. Close every beta, Chrome and Edge window. Turn Wi-Fi off and unplug Ethernet.
2. Launch **Biotron Settings Offline Beta** from the Windows Start menu, not from
   browser history.
3. Confirm **Offline — Settings are available** appears and repeat one reversible
   MUTE on/off write.
4. Press **Update Firmware**. PASS only if it says internet is required and the
   Biotron stays in normal mode; it must not enter BOOT.

## 8:00–11:00 — hand the port to REAPER

1. In the offline app press **Release device for DAW**. PASS only if the app says
   the selected device was released.
2. Open REAPER → Preferences → MIDI Devices. Enable the same Biotron input and
   output. They must open without reconnecting USB.
3. Close REAPER. Return to the beta and press **Reconnect**. Repeat Release →
   REAPER → Reconnect once more.

## 11:00–12:00 — report only facts

Reply with exactly these lines:

```text
Windows / Chrome or Edge / REAPER versions:
Beta source revision:
Install + offline Start-menu restart: PASS / FAIL
MUTE changed the real Biotron offline: PASS / FAIL
Release → REAPER → Reconnect 2/2: PASS / FAIL
Anything disappeared, froze, entered BOOT, or required admin: NO / YES + where
```

Any FAIL means the beta stays unshipped. A screen recording and the exact first
error are useful; no extra troubleshooting is required from the tester.
