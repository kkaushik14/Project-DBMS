const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/dashboard', async (req, res) => {
  try {
    const [students] = await pool.execute('SELECT COUNT(*) AS totalStudents FROM students');
    const [admins] = await pool.execute('SELECT COUNT(*) AS totalAdmins FROM admins');
    const [issuedBooks] = await pool.execute('SELECT COUNT(*) AS totalIssuedBooks FROM issued_books');
    res.json({
      totalUsers: students[0].totalStudents + admins[0].totalAdmins,
      totalStudents: students[0].totalStudents,
      totalAdmins: admins[0].totalAdmins,
      totalIssuedBooks: issuedBooks[0].totalIssuedBooks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/students', async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT s.id, s.name, s.email, ib.book_id, ib.issued_date, ib.return_date, ib.payment
     FROM students s
     JOIN issued_books ib ON s.id = ib.student_id`
  );
  res.json(rows);
});

router.get('/issued-books', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM issued_books');
  res.json(rows);
});

module.exports = router;
