const pool = require('../db');

const createAdmin = async (admin) => {
  const { name, email, password, otp } = admin;
  const [result] = await pool.execute(
    'INSERT INTO admins (name, email, password, role, otp) VALUES (?, ?, ?, ?, ?)',
    [name, email, password, 'admin', otp]
  );
  return result;
};

const findAdminByEmail = async (email) => {
  const [rows] = await pool.execute('SELECT * FROM admins WHERE email = ?', [email]);
  return rows[0];
};

module.exports = { createAdmin, findAdminByEmail };
