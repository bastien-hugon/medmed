ALTER TABLE cards ADD COLUMN IF NOT EXISTS concept_key TEXT;

CREATE INDEX IF NOT EXISTS idx_cards_concept_key ON cards(concept_key);
