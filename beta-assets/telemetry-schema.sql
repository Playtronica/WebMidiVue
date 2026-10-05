CREATE TABLE IF NOT EXISTS session_events (
  event_id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL DEFAULT (datetime('now')),
  session_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  service_version TEXT NOT NULL,
  event_name TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  browser_family TEXT,
  os_family TEXT,
  web_midi_available INTEGER NOT NULL,
  mobile INTEGER NOT NULL,
  result TEXT,
  stage TEXT,
  audio_state TEXT,
  error_type TEXT,
  visibility TEXT,
  port_count INTEGER,
  last_midi_age TEXT,
  firmware_version TEXT
);
CREATE INDEX IF NOT EXISTS session_events_build_stage ON session_events(service_version, event_name, received_at);
CREATE INDEX IF NOT EXISTS session_events_session ON session_events(session_id, received_at);
CREATE INDEX IF NOT EXISTS session_events_retention ON session_events(received_at);
