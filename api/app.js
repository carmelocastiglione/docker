const express = require('express');
const mysql = require('mysql2/promise');
const app = express();

// Middleware
app.use(express.json());

// Pool di connessioni MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'scuola_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ============== STUDENTI ==============

// GET - Lista tutti gli studenti
app.get('/api/studenti', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM studenti');
    connection.release();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
});

// GET - Uno studente per ID
app.get('/api/studenti/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM studenti WHERE id = ?',
      [req.params.id]
    );
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({ errore: 'Studente non trovato' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
});

// POST - Crea nuovo studente
app.post('/api/studenti', async (req, res) => {
  const { nome, cognome, email, data_nascita } = req.body;
  
  if (!nome || !cognome || !email) {
    return res.status(400).json({ errore: 'Nome, cognome ed email sono obbligatori' });
  }
  
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO studenti (nome, cognome, email, data_nascita) VALUES (?, ?, ?, ?)',
      [nome, cognome, email, data_nascita || null]
    );
    connection.release();
    
    res.status(201).json({
      id: result.insertId,
      nome,
      cognome,
      email,
      data_nascita: data_nascita || null,
      created_at: new Date()
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ errore: 'Email già esistente' });
    }
    res.status(500).json({ errore: err.message });
  }
});

// PUT - Aggiorna studente
app.put('/api/studenti/:id', async (req, res) => {
  const { nome, cognome, email, data_nascita } = req.body;
  
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'UPDATE studenti SET nome = ?, cognome = ?, email = ?, data_nascita = ? WHERE id = ?',
      [nome, cognome, email, data_nascita || null, req.params.id]
    );
    connection.release();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ errore: 'Studente non trovato' });
    }
    
    res.json({ messaggio: 'Studente aggiornato', id: req.params.id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ errore: 'Email già esistente' });
    }
    res.status(500).json({ errore: err.message });
  }
});

// DELETE - Elimina studente
app.delete('/api/studenti/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'DELETE FROM studenti WHERE id = ?',
      [req.params.id]
    );
    connection.release();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ errore: 'Studente non trovato' });
    }
    
    res.json({ messaggio: 'Studente eliminato', id: req.params.id });
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
});

// ============== CORSI ==============

// GET - Lista tutti i corsi
app.get('/api/corsi', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM corsi');
    connection.release();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
});

// ============== ISCRIZIONI ==============

// GET - Corsi di uno studente
app.get('/api/iscrizioni/:id_studente', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT c.*, i.voto FROM corsi c 
       INNER JOIN iscrizioni i ON c.id = i.id_corso 
       WHERE i.id_studente = ?`,
      [req.params.id_studente]
    );
    connection.release();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
});

// POST - Iscrivi studente a corso
app.post('/api/iscrizioni', async (req, res) => {
  const { id_studente, id_corso } = req.body;
  
  if (!id_studente || !id_corso) {
    return res.status(400).json({ errore: 'id_studente e id_corso sono obbligatori' });
  }
  
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO iscrizioni (id_studente, id_corso) VALUES (?, ?)',
      [id_studente, id_corso]
    );
    connection.release();
    
    res.status(201).json({
      id: result.insertId,
      id_studente,
      id_corso,
      created_at: new Date()
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ errore: 'Studente già iscritto a questo corso' });
    }
    res.status(500).json({ errore: err.message });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// 404 - Rotta non trovata
app.use((req, res) => {
  res.status(404).json({ errore: 'Rotta non trovata' });
});

// Avvia server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server in esecuzione sulla porta ${PORT}`);
});