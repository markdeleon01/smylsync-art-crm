DROP INDEX IF EXISTS idx_appointments_status;
DROP INDEX IF EXISTS idx_appointments_start_time;
DROP INDEX IF EXISTS idx_appointments_patient_id;
DROP TABLE IF EXISTS appointments;

ALTER TABLE patients ADD COLUMN IF NOT EXISTS recall_interval_months INT DEFAULT 6;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_visit_date DATE;

CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(255) PRIMARY KEY,
  patient_id VARCHAR(255) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  appointment_type VARCHAR(100) NOT NULL DEFAULT 'checkup',
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments (start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments (status);
