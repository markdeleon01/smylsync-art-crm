DROP TABLE IF EXISTS patients;

CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  firstname VARCHAR(255),
  lastname VARCHAR(255),
  email VARCHAR(255) NOT NULL
);

INSERT INTO patients (id, firstname, lastname, email) VALUES (1, 'John', 'Doe', 'john.doe@example.com');
INSERT INTO patients (id, firstname, lastname, email) VALUES (2, 'Jane', 'Smith', 'jane.smith@example.com');
INSERT INTO patients (id, firstname, lastname, email) VALUES (3, 'Alice', 'Johnson', 'alice.johnson@example.com');
INSERT INTO patients (id, firstname, lastname, email) VALUES (4, 'Bob', 'Brown', 'bob.brown@example.com');
INSERT INTO patients (id, firstname, lastname, email) VALUES (5, 'Charlie', 'Davis', 'charlie.davis@example.com');
