const express = require('express');
const pool = require('../db');
const nodemailer = require('nodemailer');
const router = express.Router();

router.post('/issue', async (req, res) => {
  const { studentId, bookId, issuedDate, returnDate, payment, email } = req.body;
  console.log('Issue book request body:', req.body);
  if (!email) {
    return res.status(400).json({ message: 'Email is required to send notification.' });
  }
  if (!studentId || !bookId || !issuedDate || !returnDate || !payment) {
    return res.status(400).json({ message: 'All fields are required.' });
  }


  const [students] = await pool.execute('SELECT * FROM students WHERE id = ?', [studentId]);
  if (!students[0]) {
    return res.status(404).json({ message: 'Student not found.' });
  }


  let [bookRows] = await pool.execute('SELECT * FROM books WHERE book_id = ?', [bookId]);
  if (!bookRows[0]) {
    [bookRows] = await pool.execute('SELECT * FROM books WHERE id = ?', [bookId]);
  }
  const book = bookRows[0];
  if (!book) {
    return res.status(404).json({ message: 'Book not found in database.' });
  }
  if (Number(book.available) <= 0) {
    return res.status(400).json({ message: 'Book is not available.' });
  }

  try {

    await pool.execute('UPDATE books SET available = available - 1 WHERE id = ?', [book.id]);


    await pool.execute(
      'INSERT INTO issued_books (student_id, book_id, issued_date, return_date, payment) VALUES (?, ?, ?, ?, ?)',
      [studentId, book.book_id, issuedDate, returnDate, payment]
    );

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    const daysLeft = Math.ceil((new Date(returnDate) - new Date(issuedDate)) / (1000 * 60 * 60 * 24));
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Book Issued - Library Management System',
      text: `Book issued successfully.\nBook ID: ${book.book_id}\nIssued Date: ${issuedDate}\nReturn Date: ${returnDate}\nDays Left: ${daysLeft}\nPayment: ${payment}`
    });
    res.json({ message: 'Book issued and email sent.' });
  } catch (err) {
    console.error('Error issuing book:', err);
    res.status(500).json({ message: 'Failed to issue book.' });
  }
});

router.get('/issued/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const [rows] = await pool.execute(
    'SELECT * FROM issued_books WHERE student_id = ?',
    [studentId]
  );
  res.json(rows);
});

router.post('/return', async (req, res) => {
  const { studentId, bookId, issueId } = req.body;
  
  if (!studentId || !bookId || !issueId) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [issueRows] = await connection.execute(
        'SELECT * FROM issued_books WHERE id = ? AND student_id = ? AND book_id = ?',
        [issueId, studentId, bookId]
      );

      if (!issueRows[0]) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ message: 'Book issue record not found.' });
      }

      await connection.execute(
        'UPDATE books SET available = available + 1 WHERE book_id = ?',
        [bookId]
      );

      await connection.execute(
        'DELETE FROM issued_books WHERE id = ?',
        [issueId]
      );

      await connection.commit();
      connection.release();

      res.json({ message: 'Book returned successfully.' });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error('Error returning book:', err);
    res.status(500).json({ message: 'Failed to return book.' });
  }
});

module.exports = router;
