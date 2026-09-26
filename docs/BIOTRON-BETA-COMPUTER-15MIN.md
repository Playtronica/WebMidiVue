# Biotron beta — physical computer test (15 minutes)

Use one Biotron, one known data-capable USB cable and current Chrome or Edge on
the exact computer you normally use. Start with every DAW and other MIDI app
closed. Do not flash firmware, change browser flags, use production Settings or
debug beyond the time box. Test only the dedicated beta URL supplied with the
candidate.

Stop immediately if Biotron enters BOOT unexpectedly, disappears repeatedly,
the page reports success after a visible error, or the computer becomes
unstable. A stopped test is a failed candidate, not a request to experiment.

## 0:00–3:00 — identify the candidate

1. Record computer model, OS version, browser and version, beta URL and the
   short build revision displayed beside **Biotron offline beta**.
2. Connect Biotron directly where possible and open `/#/biotron`.
3. Allow MIDI and SysEx if Chrome asks. Confirm Settings appears and exactly one
   intended Biotron can be selected. Record duplicate or ambiguous port names.

## 3:00–7:00 — prove a reversible real-device write

1. Note the current MUTE value.
2. Turn MUTE on, choose **Send to Device**, and confirm plant notes stop.
3. Turn MUTE off, send again, and confirm plant notes return.
4. Disconnect USB, reconnect it once, and confirm Settings can reconnect and
   read/use the device again without reloading into a false success state.

Restore MUTE to its starting value before continuing.

## 7:00–11:00 — install and reopen offline

1. While online, wait for **Offline mode is ready** and choose **Install app**.
2. Close every beta window. Disconnect the computer from the internet.
3. Launch the installed beta from the operating system, not browser history.
4. Confirm the offline message appears and repeat one MUTE on/off cycle.
5. Open firmware update. PASS only if it says internet is required and Biotron
   stays in normal mode; it must not enter BOOT.

## 11:00–14:00 — sound and port handoff

1. Return online if needed, open `/#/biotron/play`, start sound and make one
   plant gesture. Confirm visible note activity and audible sound.
2. Stop sound. In Settings choose **Release device for DAW**.
3. If your normal DAW is installed, open the same Biotron port, close the DAW,
   then reconnect Settings. If no DAW is available, record this step as NOT RUN.

## 14:00–15:00 — report facts

```text
Computer / OS:
Browser / version:
Beta URL / build revision:
Biotron firmware shown (or NOT SHOWN):
MIDI + SysEx permission and one intended device: PASS / FAIL
MUTE changed the real Biotron and was restored: PASS / FAIL
USB disconnect → reconnect: PASS / FAIL
Install → offline launch → MUTE write: PASS / FAIL
Offline firmware guard; never entered BOOT: PASS / FAIL
First-play sound and note activity: PASS / FAIL
Release → DAW → reconnect: PASS / FAIL / NOT RUN
First failure, ambiguity, freeze or unexpected BOOT: NONE / exact step
```

Any FAIL blocks this candidate. Keep the first screenshot or short recording
that shows the failure together with this report; do not replace facts with a
general “works for me”.
