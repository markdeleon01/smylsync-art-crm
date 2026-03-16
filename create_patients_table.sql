DROP TABLE IF EXISTS patients;

CREATE TABLE patients (
  id VARCHAR(255) PRIMARY KEY,
  firstname VARCHAR(255),
  lastname VARCHAR(255),
  email VARCHAR(255) NOT NULL
);

INSERT INTO patients (id, firstname, lastname, email) VALUES ('patient-001', 'John', 'Doe', 'john.doe@example.com');
INSERT INTO patients (id, firstname, lastname, email) VALUES ('patient-002', 'Jane', 'Smith', 'jane.smith@example.com');
INSERT INTO patients (id, firstname, lastname, email) VALUES ('patient-003', 'Alice', 'Johnson', 'alice.johnson@example.com');
INSERT INTO patients (id, firstname, lastname, email) VALUES ('patient-004', 'Bob', 'Brown', 'bob.brown@example.com');
INSERT INTO patients (id, firstname, lastname, email) VALUES ('patient-005', 'Charlie', 'Davis', 'charlie.davis@example.com');
INSERT INTO patients (id, firstname, lastname, email) VALUES ('patient-006', 'Antonio', 'Davis', 'antonio.davis@example.com');
INSERT INTO patients (id, firstname, lastname, email) VALUES ('patient-007', 'Magic', 'Johnson', 'magic.johnson@example.com');
INSERT INTO patients (id, firstname, lastname, email) VALUES ('patient-008', 'Joe', 'Smith', 'joe.smith@example.com');
INSERT INTO patients (id, firstname, lastname, email) VALUES ('patient-009', 'Jane', 'Doe', 'jane.doe@example.com');
INSERT INTO patients (id, firstname, lastname, email) VALUES ('patient-010', 'Bob', 'Dylan', 'bob.dylan@example.com');
