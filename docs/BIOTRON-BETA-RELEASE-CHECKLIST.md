# Biotron Settings beta — release checklist

This beta is shown to selected owners from a dedicated beta origin. It is not
published into the Playtronica production account or production service-worker
scope. A test deployment, customer email or Help draft never authorizes a
production merge.

## 1. Freeze and verify one candidate

- Record the branch and commit; keep the unrelated working tree clean.
- Run `npm run audit:web` and `npm run test:biotron` from that exact commit.
- Confirm `npm run test:production-isolation` passes.
- Build with an explicit visible `VUE_APP_BUILD_ID` matching the commit.
- Deploy only to the isolated beta Pages project and save its immutable URL.

## 2. Physical acceptance

- Complete `BIOTRON-BETA-COMPUTER-15MIN.md` on the owner's real computer.
- Complete the Android or iPhone/iPad branch in
  `BIOTRON-BETA-PHONE-15MIN.md`; do not convert emulation into hardware proof.
- Attach the exact reports to the candidate. A fix creates a new commit, build
  and URL, and reruns the affected checks; evidence does not transfer silently.
- Android stays experimental unless the exact phone combination passes. Normal
  iPhone/iPad browsers stay unsupported even when the responsive layout passes.

## 3. Align claims before inviting anyone

- Update README, tester instructions, email copy and Help from the accepted
  evidence. Separate “layout works”, “Sound works” and “USB Settings works”.
- Verify every firmware/CC statement against the current firmware source.
- Run `./help check --full`. Keep Help changes in draft/review until a human has
  verified the physical claims.
- Confirm the beta page names a reply path and build revision, and promises only
  the response rhythm the team can maintain.

## 4. Controlled release, not production

1. Internal seed: owner plus one known Biotron/computer combination.
2. Small external seed: 3–5 owners, chosen to cover the main computer/browser
   path; Android only as an explicitly experimental subgroup after its own pass.
3. Review replies and hard failures before expanding.
4. Invite the prepared group of 30 only when the candidate and wording still
   pass. Send from Andrey's Playtronica address and identify it as a private
   beta; do not announce it as the public Settings release.

Uploading the 30-customer list to SendPulse or another mail provider is a
separate transfer of customer data and needs Andrey's explicit authorization at
the moment of transfer. Preparing code and copy is not that authorization.

## 5. Go/no-go record

```text
Branch / commit / immutable beta URL:
Automated full gate: PASS / FAIL + timestamp
Computer physical report: PASS / FAIL + exact configuration
Android physical report: PASS / FAIL / NOT RUN + exact configuration
iPhone/iPad negative-path report: PASS / FAIL / NOT RUN
Help check + human claim review: PASS / FAIL
Internal seed: PASS / FAIL + replies reviewed
Decision: HOLD / 3–5 USERS / 30 USERS
Owner and date of decision:
Known limitations included in invitation:
Rollback: stop invitations and retire this beta URL; production remains untouched
```

Public production release is a later decision. It needs evidence across the
target device matrix, resolved release-blocking feedback, a reviewed Help state,
and explicit authorization to merge/deploy production.
