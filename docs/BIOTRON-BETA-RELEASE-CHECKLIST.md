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
- Build the general customer candidate with
  `VUE_APP_BIOTRON_FIRMWARE_TEST_ENABLED=false`; its output must contain no
  firmware directory and the Biotron page must show no updater action.
- Deploy only to the isolated beta Pages project and save its immutable URL.
- Confirm the remote response includes `X-Frame-Options: DENY`,
  `Content-Security-Policy: frame-ancestors 'none'`, the beta
  `Permissions-Policy`, `Referrer-Policy: no-referrer` and
  `X-Robots-Tag: noindex`.

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

## 4. Audience and sender gate

- In Shopify, select owners of the exact Biotron product, then retain only
  customers whose email marketing status is `SUBSCRIBED`. Do not infer consent
  from a purchase alone.
- Remove refunded/cancelled orders, duplicates, staff and anyone already
  participating. Keep the exact query and resulting count in the release
  record; the product ID must come from Shopify, never from a guess here.
- Send from Andrey's authenticated Playtronica address. Check the sender domain
  status in Shopify before any test send; changing DNS needs separate approval.
- Use `BIOTRON-BETA-INVITATION.md`. A draft or preview is not permission to
  send. Confirm the final count, subject and body immediately before sending.

## 5. Controlled release, not production

1. **26 September:** finish the exact automated candidate and Andrey's computer
   plus phone acceptance. If both finish early enough, wave 1 may go the same
   day; there is no reason to wait for 5 October.
2. **Wave 1 — 8 owners:** cover the main computer/browser path and one
   explicitly experimental Android combination only after its own pass. Ask
   each person to try one real task and reply directly.
3. Hold for at least 24 hours. Expand only after at least four owners complete
   the end-to-end task, replies are reviewed, and there is no open P0/P1 issue
   or misleading compatibility claim.
4. **Wave 2 — remaining 22 owners:** earliest 27 September if that gate is
   green. Stop immediately for a destructive setting, firmware risk,
   connection regression or systematic permission failure.
5. **30 September:** synthesize requests by task and frequency; send a short
   update to participants even if the decision is “investigating”.
6. **2 October:** choose beta v2 scope. Re-run affected automated and physical
   checks; every changed candidate gets a new immutable URL and build ID.

Uploading the 30-customer list to SendPulse or another mail provider is a
separate transfer of customer data and needs Andrey's explicit authorization at
the moment of transfer. Preparing code and copy is not that authorization.

## 6. Go/no-go record

```text
Branch / commit / immutable beta URL:
Automated full gate: PASS / FAIL + timestamp
Computer physical report: PASS / FAIL + exact configuration
Android physical report: PASS / FAIL / NOT RUN + exact configuration
iPhone/iPad negative-path report: PASS / FAIL / NOT RUN
Help check + human claim review: PASS / FAIL
Internal seed: PASS / FAIL + replies reviewed
Shopify segment query + subscribed count:
Sender-domain status + preview checked by:
Wave 1: HOLD / 8 USERS + send date
Wave 1 evidence: completed tasks / replies / P0 / P1
Wave 2: HOLD / REMAINING 22 + send date
Owner and date of decision:
Known limitations included in invitation:
Rollback: stop invitations and retire this beta URL; production remains untouched
```

Public production release is a later decision, not the second email wave. The
earliest review date is **12 October 2026**, after two feedback/fix cycles. Ship
to everyone only when the target physical matrix is evidenced, P0/P1 issues are
closed, the candidate has stayed unchanged for at least 72 hours, Help and
email claims match it, and production merge/deploy is explicitly authorized.
Otherwise set a new review date instead of weakening the gate.
