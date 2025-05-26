
CREATE DATABASE IF NOT EXISTS library_db;
USE library_db;

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin') NOT NULL DEFAULT 'admin',
  otp VARCHAR(10)
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student') NOT NULL DEFAULT 'student',
  otp VARCHAR(10)
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id VARCHAR(64),
  title VARCHAR(255),
  authors VARCHAR(255),
  genre VARCHAR(100),
  available INT,
  price DECIMAL(10,2)
);

-- Issued books table (students)
CREATE TABLE IF NOT EXISTS issued_books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  book_id VARCHAR(50) NOT NULL,
  issued_date DATE NOT NULL,
  return_date DATE NOT NULL,
  payment DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id)
);
