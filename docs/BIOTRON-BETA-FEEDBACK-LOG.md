# Biotron beta feedback log

Keep customer-identifying data in the authorized customer system, not in Git.
This file defines the shared structure and decision rhythm; record only an
anonymous participant code here if the team needs a repository summary.

## One row per test

| Participant code | Wave | Build | Date | Device / OS / browser | Real task | Completed end to end | Hesitation or failure | Requested change | Severity | Follow-up state |
|---|---:|---|---|---|---|---|---|---|---|---|
| B-001 | 1 | `[build]` | `[date]` | `[exact configuration]` | `[task]` | yes / no | `[observation]` | `[verbatim request]` | P0 / P1 / P2 / insight | new / replied / fixed / retest |

Severity means: P0 risks device/data/firmware or makes the beta unsafe; P1
blocks the core Connect → task → saved result journey for a supported path; P2
has a workaround; an insight is a desired outcome or improvement, not a defect.

## Daily synthesis during an active wave

- Count invitations, completed real tasks, replies, P0, P1 and distinct
  requested outcomes. Use opens only if they are already available in Shopify.
- Cluster by customer task, not by proposed feature. Preserve one short
  verbatim phrase per cluster in the authorized feedback system.
- Reply personally to concrete reports within two working days. On Friday tell
  participants what changed, what will be tested next and what is still unknown.
- Every fix records the new build ID and which participants need a retest.
- Expansion decisions use the release checklist; message volume alone never
  overrides a safety or compatibility blocker.
