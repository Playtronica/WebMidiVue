# Biotron private beta recruitment and test handoff

The first message recruits a willing tester. It is not a product-validation
exposure and must not contain the beta link. The exact link, build and one task
are sent only after the person says yes.

Use reviewed context for one-to-one messages. Broad email may recruit people,
but opens and clicks never count as a product test. Preview every email on
desktop and phone. Do not send until the exact recipient count, subject and
body receive explicit final confirmation.

## First message: ask permission

### Subject

We made Biotron harder than it should be

### Body

Hi {{ customer.first_name | default: "there" }},

I’m Andrey from Playtronica. We put most of our attention into making Biotron
as a MIDI device and did not take enough care of the web experience around it.

I’ve rebuilt the first-use flow: sound is inside the page, calibration is
guided, settings are clearer and the page can work offline after the first
visit. It is still a private beta, and I want real complaints and strange ideas
before deciding what it becomes.

Would you be willing to try one five-minute task? Reply **YES** and I’ll send
one private link and one thing to check. Reply **NO** if you do not want beta
messages; that is completely fine.

Andrey<br>
Playtronica

Keep the provider’s unsubscribe control enabled. A reply of NO or an
unsubscribe suppresses further beta invitations.

## Second message: one exact test after YES

Replace every bracket from the frozen release record and the person’s reviewed
context. Do not combine firmware, sound, Settings, offline and mobile into one
test.

> Thank you — this test is only about **[ONE USER TASK]**.
>
> Open **[IMMUTABLE PRIVATE URL]** in **[VERIFIED BROWSER/APP]** and confirm the
> page shows build **[BUILD ID]**. **[ONE SHORT ACTION SEQUENCE]**
>
> Reply **[TWO OR THREE UNAMBIGUOUS RESULT TOKENS]**. If it stops, send the
> first message you see and do not repeat or repair anything.

The result tokens must answer the hypothesis. Examples:

- First sound: `HEARD IT` / `SILENT` / `STUCK + step`.
- Settings persistence: `SAVED` / `REVERTED` / `FROZE`.
- Firmware update: `UPDATED` / `STOPPED + message` / `DID NOT TRY`.
- iPhone connection: `CONNECTED` / `NOT FOUND` / `PERMISSION STOP`.

## Reply discipline

- Acknowledge an active tester promptly.
- State exactly what their answer proved and what is still unknown.
- Ask at most one discriminating follow-up question.
- Do not describe a firmware-only success as “the beta works”.
- Do not ask for a screenshot or video unless the written failure is
  insufficient.
- Use at most one reminder for the same task unless the person re-engages.

## Cohort gate

- Select people for a problem evidenced in their own Biotron history; an issue
  with another product or a purchase alone is not sufficient relevance.
- Record an exposure only after the exact second message was delivered.
- Expand only after prior exact outcomes are reviewed.
- Firmware-enabled tests remain a separate hardware-screened lane.
- Production publication always requires a separate explicit decision.
