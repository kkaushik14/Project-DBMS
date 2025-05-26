const express = require('express');
const { findStudentByEmail } = require('../models/student');
const { findAdminByEmail } = require('../models/admin');
const pool = require('../db');
const nodemailer = require('nodemailer');
const router = express.Router();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); //6-digit OTP
}

router.post('/send-otp', async (req, res) => {
  const { email, role } = req.body;
  console.log('OTP send-otp request body:', req.body);
  if (!email || !role) {
    return res.status(400).json({ message: 'Email and role are required.' });
  }
  let user;
  if (role === 'student') {
    user = await findStudentByEmail(email);
    if (!user) return res.status(404).json({ message: 'Student not found.' });
    const otp = generateOTP();
    await pool.execute('UPDATE students SET otp = ? WHERE email = ?', [otp, email]);
    await sendOtpMail(email, otp);
    return res.json({ message: 'OTP sent to student email.' });
  } else if (role === 'admin') {
    user = await findAdminByEmail(email);
    if (!user) return res.status(404).json({ message: 'Admin not found.' });
    const otp = generateOTP();
    await pool.execute('UPDATE admins SET otp = ? WHERE email = ?', [otp, email]);
    await sendOtpMail(email, otp);
    return res.json({ message: 'OTP sent to admin email.' });
  } else {
    return res.status(400).json({ message: 'Invalid role.' });
  }
});

async function sendOtpMail(email, otp) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for Library Management System',
    text: `Your OTP is: ${otp}`
  });
}

router.post('/verify-otp', async (req, res) => {
  const { email, otp, role } = req.body;
  let user;
  if (role === 'student') {
    user = await findStudentByEmail(email);
    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }
    await pool.execute('UPDATE students SET otp = NULL WHERE email = ?', [email]);
  } else if (role === 'admin') {
    user = await findAdminByEmail(email);
    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }
    await pool.execute('UPDATE admins SET otp = NULL WHERE email = ?', [email]);
  } else {
    return res.status(400).json({ message: 'Invalid role.' });
  }
  res.json({
    message: 'OTP verified.',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

module.exports = router;
