CREATE TABLE IF NOT EXISTS drill_attempts (
  id TEXT PRIMARY KEY,
  drill_session_id TEXT NOT NULL,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  correct INTEGER NOT NULL,
  duration_ms INTEGER,
  attempted_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_drill_attempts_card ON drill_attempts(card_id);

CREATE INDEX IF NOT EXISTS idx_drill_attempts_session ON drill_attempts(drill_session_id);

CREATE INDEX IF NOT EXISTS idx_drill_attempts_time ON drill_attempts(attempted_at);
