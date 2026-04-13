DROP TABLE IF EXISTS login_events;

CREATE TABLE IF NOT EXISTS login_events (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  logged_in_at TIMESTAMP DEFAULT NOW()
);

-- Migrate existing column from TIMESTAMPTZ to TIMESTAMP (idempotent via text cast)
ALTER TABLE login_events ALTER COLUMN logged_in_at TYPE TIMESTAMP USING logged_in_at::text::TIMESTAMP;
