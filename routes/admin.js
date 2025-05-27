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

router.put('/issued-books/:id', async (req, res) => {
  const { id } = req.params;
  const { name, payment, return_date } = req.body;
  try {
    const [[issuedBook]] = await pool.execute('SELECT * FROM issued_books WHERE id = ?', [id]);
    if (!issuedBook) return res.status(404).json({ message: 'Issued book not found.' });
    const [[student]] = await pool.execute('SELECT * FROM students WHERE id = ?', [issuedBook.student_id]);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    if (name && name !== student.name) {
      await pool.execute('UPDATE students SET name = ? WHERE id = ?', [name, student.id]);
    }
    await pool.execute('UPDATE issued_books SET payment = ?, return_date = ? WHERE id = ?', [payment, return_date, id]);

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: 'Your Issued Book Details Updated',
      text: `Dear ${name || student.name},\nYour issued book record has been updated.\nPayment: ${payment}\nReturn Date: ${return_date}`
    });

    res.json({ message: 'Issued book updated and student notified.' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating issued book.', error: err.message });
  }
});

router.delete('/issued-books/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [[issuedBook]] = await pool.execute('SELECT * FROM issued_books WHERE id = ?', [id]);
    if (!issuedBook) return res.status(404).json({ message: 'Issued book not found.' });
    await pool.execute('UPDATE books SET available = available + 1 WHERE book_id = ?', [issuedBook.book_id]);
    await pool.execute('DELETE FROM issued_books WHERE id = ?', [id]);
    res.json({ message: 'Issued book deleted (returned).' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting issued book.', error: err.message });
  }
});

module.exports = router;
