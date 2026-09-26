# Biotron beta — physical phone test (15 minutes)

Phone layout and USB control are separate claims. This check records both. Use
the same dedicated beta candidate as the computer test; never production
Settings. Firmware update is not a phone feature and Biotron must never enter
BOOT during this test.

## Android Chrome — experimental positive path

Required: current Chrome, a phone with USB host/OTG, a known data-capable cable
or adapter, enough phone power, one Biotron and no other open MIDI app. No phone
model is supported merely because another Android model passes.

1. Record phone model, Android version, Chrome version, cable/adapter and whether
   external power is present.
2. Open the beta `/#/biotron`. Check that headings, controls and the device list
   fit without horizontal page scrolling at normal zoom and that tap targets are
   usable.
3. Connect Biotron. Allow both MIDI and SysEx if Chrome presents two prompts.
   Record the exact port names. PASS only if the intended input/output pair is
   usable and Settings appears without duplicate-device confusion.
4. Note MUTE, turn it on, send, and confirm notes stop. Turn it off, send, and
   confirm notes return. Restore the starting value.
5. Unplug and reconnect once. Confirm the page recovers without a false saved or
   connected state.
6. Wait for offline readiness, add/install the app from Chrome, close Chrome,
   disable Wi-Fi and mobile data, and reopen it from the home screen. Repeat one
   reversible MUTE on/off write.
7. Open firmware update. PASS only if the UI says to use a computer and neither
   a folder picker nor BOOT mode starts.

Report:

```text
Phone / Android / Chrome:
Cable or adapter / external power:
Beta URL / build revision:
Layout and tap targets: PASS / FAIL
MIDI + SysEx prompts and exact port names:
One unambiguous Biotron pair: PASS / FAIL
MUTE write and restore: PASS / FAIL
USB reconnect: PASS / FAIL
Home-screen install → offline reopen → MUTE write: PASS / FAIL
Firmware stayed computer-only; never entered BOOT: PASS / FAIL
First failure, disconnect or confusing screen: NONE / exact step
```

Any FAIL keeps Android labelled experimental. A PASS qualifies only the exact
recorded phone/OS/Chrome/cable combination for the next controlled wave.

## iPhone or iPad — required negative path

Safari, Chrome, Edge and Firefox on iOS/iPadOS use the platform browser engine
and do not expose the Web MIDI path used by this beta. The expected result is an
honest stop before Settings, not device control.

1. Record device model, iOS/iPadOS version and browser/version.
2. Open `/#/biotron` and connect the cable if appropriate.
3. PASS only if the page clearly says MIDI is unavailable, shows no live device
   Settings controls and makes no claim that the connected Biotron was changed.
4. Open `/#/sound`. Screen/keyboard sound may work, but USB input must not be
   presented as working.

```text
iPhone/iPad / OS / browser:
Beta URL / build revision:
Honest no-MIDI gate before Settings: PASS / FAIL
No false USB-connected or saved state: PASS / FAIL
Layout readable without clipped actions: PASS / FAIL
```

Native iOS music apps using Core MIDI are a separate Biotron use case, not proof
that the web Settings beta works. A third-party MIDI browser may be researched
separately, but until its exact build passes this full physical protocol it must
not be named as a supported workaround in product or Help copy.
