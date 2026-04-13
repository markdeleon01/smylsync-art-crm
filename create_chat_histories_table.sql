DROP TABLE IF EXISTS chat_histories;

CREATE TABLE IF NOT EXISTS chat_histories (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  messages JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Migrate existing column from TIMESTAMPTZ to TIMESTAMP (idempotent via text cast)
ALTER TABLE chat_histories ALTER COLUMN created_at TYPE TIMESTAMP USING created_at::text::TIMESTAMP;
