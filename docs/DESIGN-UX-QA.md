# Biotron design and UX QA

Role: check the visible hierarchy and measured geometry, not only whether controls work.
Use a read-only reviewer for the first and final passes. Keep implementation with one owner.

## Design contract

- One outer content axis: maximum 760px, page insets 24px desktop and 16px at <=640px.
- All primary cards, navigation and feedback share their left/right border-box edges.
- Card inner padding is 24px desktop / 16px mobile. Nav title shares the card text axis.
- Command labels, fields and ranges share their container edges. Bootstrap row gutters
  and extra margin utilities must not accumulate inside beta command cards.
- Input text has its own 16px inset; select arrows retain space. Paired fields use
  symmetric gaps and min-width:0. Decorative Play illustration columns are intentional.
- Use 8px-based spacing, a clear primary action, quieter diagnostics, consistent type
  and visible focus. Never hide connection/error status to make a screenshot cleaner.

## Repeatable review

1. Identify which build is actually rendered. A cached PWA can display older CSS.
2. Inspect Settings disconnected and connected, all expanded command groups,
   Play before/after notes, feedback, and updater modal.
3. Test 390, 640, 1024 and 1440px; also 320px and browser 200% zoom when applicable.
4. Measure boundingClientRect: outer edges must match within 1px. Inner text/control
   edges must match within 1px except intentional columns, field text inset and arrows.
5. Check scrollWidth <= clientWidth, no clipped action, target size >=44px for primary
   actions, keyboard focus/order, readable line length, and heading/landmark hierarchy.
6. Capture desktop/mobile views. Assess alignment, density, hierarchy, contrast,
   grouping, consistency, feedback and recovery. Report concrete selector + measurement.
7. Label each result PASS / FAIL / NOT RUN; distinguish real device from fixtures.
   A compiled CSS rule or simulated screenshot never proves physical acceptance.

## Mandatory physical firmware acceptance

Added at Andrey's request on 7 October 2026. Every firmware-enabled release must
complete a real-device rollback and reflash cycle; fixtures cannot substitute for it.

1. Record board/model, installed version, web build, settings/preset backup and both
   firmware artifacts' source, version and SHA-256. Confirm both artifacts support
   this board and that a known-good recovery image is available before writing.
2. Install the candidate through the customer-facing web updater. Verify reconnect,
   exact firmware version, MIDI notes, settings read/write, presets and plant/audio
   response. Record any settings reset and whether the UI explained it beforehand.
3. Roll back to a known-good older supported firmware using the documented recovery
   path. Verify reconnect, exact version and basic device operation. Never bypass
   the customer updater's downgrade protection to make this test pass.
4. From that older firmware, install the candidate again through the web updater.
   Include a supported legacy version requiring manual BOOT in the release matrix.
   Repeat the checks above, including settings restoration after a reset.
5. Record PASS / FAIL / NOT RUN separately for initial update, rollback and reflash,
   with versions, hashes, build, date and evidence. Missing compatible images or an
   unperformed physical cycle blocks firmware release acceptance. Do not describe
   build success, simulated writes or a BOOT transition as a successful flash.

## Continuous simplification of flashing

On every updater QA pass, review the entire path from an old device to verified
reconnection. Record required clicks, manual actions, unexplained waits, repeated
instructions and recovery friction. Identify the next concrete simplification,
implement it when within the task scope, and rerun the affected acceptance steps.
If no simplification is justified, record why rather than inventing a change.

Prefer one clear next action per state, automatic supported version detection,
plain model-specific BOOT instructions, visible progress and automatic reconnect
verification. Remove redundant decisions and jargon. Preserve artifact/board
verification, downgrade protection, honest failure states and a usable recovery path.
Compare the before/after action count and real-device result; fewer clicks alone
do not prove a better process. Keep unresolved friction in the QA record.

## 7 October 2026 evidence

Code build `dc05b94`: fresh browser origin localhost:49291 (earlier origin had stale PWA CSS).
Settings disconnected: nav, connection card and global feedback outer edges match
exactly at all four widths. Card padding 16px at 390/640, 24px at 1024/1440.
Play initial state: nav and reveal card edges match exactly at all four widths.
Document overflow was zero in each measurement. Connected command-card geometry,
Play revealed feedback and 200% zoom remain NOT RUN for this new origin: MIDI permission
was pending. Read-only CSS review covered the command gutters and paired inputs.

Primary sources of the previous mismatch: 820px page container vs 760px cards;
DeviceSelector/Slider m-2; Bootstrap negative row gutters and child padding;
Play reveal 20–40px vs feedback 16px vs Settings 24px padding.
