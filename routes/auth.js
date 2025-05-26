const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createStudent, findStudentByEmail } = require('../models/student');
const { createAdmin, findAdminByEmail } = require('../models/admin');
const router = express.Router();

router.post('/signup', async (req, res) => {
  const { name, email, password, confirmPassword, role } = req.body;
  if (!name || !email || !password || !confirmPassword || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }
  let existingUser;
  if (role === 'student') {
    existingUser = await findStudentByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await createStudent({ name, email, password: hashedPassword, otp: null });
    return res.status(201).json({ message: 'Student registered successfully.' });
  } else if (role === 'admin') {
    existingUser = await findAdminByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await createAdmin({ name, email, password: hashedPassword, otp: null });
    return res.status(201).json({ message: 'Admin registered successfully.' });
  } else {
    return res.status(400).json({ message: 'Invalid role.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  let user;
  if (role === 'student') {
    user = await findStudentByEmail(email);
  } else if (role === 'admin') {
    user = await findAdminByEmail(email);
  } else {
    return res.status(400).json({ message: 'Invalid role.' });
  }
  if (!user || user.role !== role) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

module.exports = router;
