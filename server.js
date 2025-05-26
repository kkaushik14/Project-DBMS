require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use(express.static('assets'));


const authRoutes = require('./routes/auth');
const otpRoutes = require('./routes/otp');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');
const booksRoutes = require('./routes/books');

app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/books', booksRoutes);

app.get('/', (req, res) => {
  res.send('Library Management System API');
});

app.listen(PORT, () => {
  console.log(`Server running on port: http://localhost:${PORT}`);
});