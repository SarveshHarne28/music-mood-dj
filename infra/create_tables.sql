CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_name TEXT,
  duration_seconds INT,
  mime_type TEXT,
  size_bytes BIGINT,
  selected_count BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mixes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mood TEXT NOT NULL,
  prompt TEXT,
  generated_by TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mix_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mix_id uuid REFERENCES mixes(id) ON DELETE CASCADE,
  track_id uuid REFERENCES tracks(id),
  position INT,
  weight FLOAT,
  created_at TIMESTAMP DEFAULT now()
);
