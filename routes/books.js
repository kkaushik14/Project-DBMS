const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  const { book_id } = req.query;
  if (book_id) {
    const [rows] = await pool.execute('SELECT * FROM books WHERE book_id = ?', [book_id]);
    if (rows.length === 1) {
      res.json(rows[0]);
    } else {
      res.json([]);
    }
  } else {
    const [rows] = await pool.execute('SELECT * FROM books');
    res.json(rows);
  }
});

router.get('/suggest', async (req, res) => {
  const q = req.query.q || '';
  const [rows] = await pool.execute(
    'SELECT id, book_id, title FROM books WHERE available > 0 AND title LIKE ? LIMIT 10',
    [`%${q}%`]
  );
  res.json(rows);
});

router.get('/issued', async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT b.id, b.title, b.available, b.total, GROUP_CONCAT(u.name) as taken_by
     FROM books b
     LEFT JOIN issued_books ib ON b.id = ib.book_db_id
     LEFT JOIN users u ON ib.student_id = u.id
     GROUP BY b.id`
  );
  res.json(rows);
});

module.exports = router;