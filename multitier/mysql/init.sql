-- Creare il database
CREATE DATABASE IF NOT EXISTS app_db;

USE app_db;

-- Creare una tabella di esempio
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserire dati di esempio
INSERT INTO users (name, email) VALUES
('Mario Rossi', 'mario@example.com'),
('Luigi Bianchi', 'luigi@example.com'),
('Anna Verdi', 'anna@example.com');