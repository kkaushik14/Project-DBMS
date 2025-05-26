const pool = require('../db');

const createStudent = async (student) => {
  const { name, email, password, otp } = student;
  const [result] = await pool.execute(
    'INSERT INTO students (name, email, password, role, otp) VALUES (?, ?, ?, ?, ?)',
    [name, email, password, 'student', otp]
  );
  return result;
};

const findStudentByEmail = async (email) => {
  const [rows] = await pool.execute('SELECT * FROM students WHERE email = ?', [email]);
  return rows[0];
};

module.exports = { createStudent, findStudentByEmail };
