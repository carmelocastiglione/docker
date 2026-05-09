CREATE DATABASE IF NOT EXISTS scuola_db;
USE scuola_db;

-- Tabella Studenti
CREATE TABLE studenti (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  cognome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  data_nascita DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Corsi
CREATE TABLE corsi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  docente VARCHAR(100),
  crediti INT,
  semestre INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Iscrizioni
CREATE TABLE iscrizioni (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_studente INT NOT NULL,
  id_corso INT NOT NULL,
  voto DECIMAL(3,1),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_studente) REFERENCES studenti(id),
  FOREIGN KEY (id_corso) REFERENCES corsi(id)
);

-- Dati di esempio: Studenti
INSERT INTO studenti (nome, cognome, email, data_nascita) VALUES
('Marco', 'Rossi', 'marco.rossi@example.com', '2005-03-15'),
('Anna', 'Bianchi', 'anna.bianchi@example.com', '2004-07-22'),
('Luigi', 'Verdi', 'luigi.verdi@example.com', '2005-11-08'),
('Giulia', 'Ferrari', 'giulia.ferrari@example.com', '2004-05-30'),
('Paolo', 'Moretti', 'paolo.moretti@example.com', '2005-09-12');

-- Dati di esempio: Corsi
INSERT INTO corsi (nome, docente, crediti, semestre) VALUES
('Matematica', 'Prof. Esposito', 6, 1),
('Informatica', 'Prof. Conti', 9, 1),
('Fisica', 'Prof. Russo', 6, 2),
('Inglese', 'Prof. Gallo', 3, 1),
('Storia', 'Prof. Giordano', 6, 2);

-- Dati di esempio: Iscrizioni
INSERT INTO iscrizioni (id_studente, id_corso, voto) VALUES
(1, 1, 28),
(1, 2, 30),
(2, 1, 25),
(2, 4, 27),
(3, 2, 29),
(3, 3, 26),
(4, 1, 30),
(4, 5, 28),
(5, 2, 27);