# Biotron beta technical events

Status: implementation for the next exact candidate, 5 October 2026. The earlier
`728f69ab9017` archive stays immutable and has no automatic telemetry. No preview
upload is authorized yet.

## Scope

The beta emits a small, explicit set of OTel-shaped events. It does not install
the experimental OpenTelemetry browser auto-instrumentation or capture console
output. This version records: session start, Play attempt/stage, MIDI connection,
AudioContext state, calibration state, saved-settings state, and the answer to
the first-sound question. The answer is a reported outcome; `audio_state=running`
is only an observed engine state. All emitted event names and fields are
allowlisted on both client and server. `event_id` deduplicates writes; a random
`session_id` lasts only in memory for the open page and appears in the manually
copied diagnostic packet so support can match a user report to a timeline.

The beta client is `src/biotron/telemetry.mjs`. It sends same-origin POSTs to
`/api/telemetry`, never awaits them in MIDI/audio/settings flows, drops events
when offline, and caps at 80 events per page session. Failures are swallowed.
The Pages advanced-mode handler is `beta-assets/telemetry-worker.mjs`, copied
into `dist/_worker.js`; all other requests pass through to `env.ASSETS.fetch`.
A read-only GET on the API checks that the `SESSION_EVENTS` D1 binding and table
are ready. The immutable preview guard requires that response after upload.

## Data and privacy

D1 database `playtronica-session-events` (ID
`0d385f91-f646-4f8c-b508-344b4b2f8a6e`) was created in the Cloudflare EU
jurisdiction in the account that owns `biotron-settings-beta`. It is separate
from the existing `puntus-core` database. Schema:
`beta-assets/telemetry-schema.sql`. The only configured Pages binding is
`env.preview.SESSION_EVENTS`; `wrangler.toml` is copied to each candidate as a
hashed sidecar. The production Pages environment has no D1 binding in that
file. Real user events have not been sent yet.

Stored fields: random event/session IDs, receive and event times, exact build,
fixed event/result/error codes, broad browser and OS families, mobile/Web MIDI
booleans, MIDI-port *count*, limited firmware version when the device reports
it, audio/visibility states, and coarse age of the last incoming MIDI message.
The server rejects unknown fields. It does not store names, contacts, port
names/IDs, serials, full User-Agent, URLs, raw MIDI/SysEx, audio, presets,
exception text, or the text of WhatsApp reports. Cloudflare may process network
metadata, including IP, outside this application table. Do not describe the
stream as fully anonymous.

`beta-assets/telemetry.html` is the user-visible notice, linked from the beta
shell. Before sending this candidate to real users, the owner must review that
notice, applicable legal basis, Cloudflare terms and data-subject handling.
The intended individual-event lifetime is 90 days. The handler deletes rows
older than 90 days before each successful insert. If the beta has no traffic,
that alone does not enforce a deadline: an operator must run the SQL in
`beta-assets/telemetry-prune.sql` on the remote DB at least once every 90 days
and after closing the beta, or put an approved retention schedule in place.
This operational gate is still open. It must be closed before preview upload.

## Queries and operation

Use the exact build and event stage for denominators. Examples:

```sql
SELECT service_version, event_name, stage, result, error_type, COUNT(*) AS n
FROM session_events
GROUP BY service_version, event_name, stage, result, error_type
ORDER BY service_version, n DESC;

SELECT received_at, event_name, stage, result, error_type, audio_state,
       last_midi_age, browser_family, os_family, firmware_version
FROM session_events WHERE session_id = ? ORDER BY received_at;
```

Run the retention file only against the named Playtronica DB and confirmed
account. The file deletes old rows and prints the remaining count:

```bash
CLOUDFLARE_ACCOUNT_ID=e5e3da2238cbacdb5f8fd1cceefa99fc \
  wrangler d1 execute playtronica-session-events --remote \
  --file beta-assets/telemetry-prune.sql
```

The browser client is for Biotron only. The table has `service_name` for the
shared Playtronica direction, but the current intake deliberately accepts only
`biotron` until other tools have their own reviewed event dictionaries.

## Release checks

- `npm run test:telemetry` checks allowlisting, no raw device data, offline
  isolation, origin rejection, D1 write and 90-day prune query.
- `npm run test:biotron` is still the complete source/build/browser gate.
- `npm run candidate:biotron` can only package a clean exact commit. The archive
  includes `_worker.js` and the notice; its hashed `wrangler.toml` sidecar binds
  only preview. The preview guard checks remote `/api/telemetry` readiness.
- A local Wrangler Pages runtime accepted a test POST into **local** D1; the
  remote D1 event count was still zero on 5 October 2026. No physical Biotron,
  phone or DAW test has been claimed by this work.
