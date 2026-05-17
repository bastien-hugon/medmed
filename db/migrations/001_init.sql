CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  prompt TEXT NOT NULL,
  expected JSONB NOT NULL,
  rationale TEXT NOT NULL,
  tags JSONB NOT NULL,
  difficulty INTEGER NOT NULL,
  source JSONB NOT NULL,
  illness_script_id TEXT,
  extra JSONB,
  status TEXT NOT NULL DEFAULT 'active',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS fsrs_state (
  card_id TEXT PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
  state JSONB NOT NULL,
  due BIGINT NOT NULL,
  last_reviewed BIGINT,
  lapses INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_fsrs_due ON fsrs_state(due);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  confidence INTEGER,
  correct INTEGER,
  duration_ms INTEGER NOT NULL,
  reviewed_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_session ON reviews(session_id);

CREATE INDEX IF NOT EXISTS idx_reviews_card ON reviews(card_id);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  started_at BIGINT NOT NULL,
  ended_at BIGINT,
  metrics JSONB,
  llm_notes TEXT
);

CREATE TABLE IF NOT EXISTS illness_scripts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icd10 TEXT,
  body JSONB NOT NULL,
  sources JSONB NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS decision_trees (
  id TEXT PRIMARY KEY,
  trigger_motif TEXT NOT NULL,
  body JSONB NOT NULL,
  source JSONB NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  body JSONB NOT NULL,
  difficulty INTEGER NOT NULL,
  family_tags JSONB NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);
