const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const pool = require('./db');

if (process.argv.length < 3) {
  console.error('Usage: node import_books_from_csv.js path/to/books.csv');
  process.exit(1);
}

const csvFilePath = process.argv[2];

async function insertBook(book) {
  const { book_id, title, genre, price } = book;
  const authors = book.authors || book.author || '';
  await pool.execute(
    'INSERT INTO books (book_id, title, authors, genre, available, price) VALUES (?, ?, ?, ?, ?, ?)',
    [book_id, title, authors, genre, 15, parseFloat(price) || 0]
  );
}

async function importBooks(csvFilePath) {
  const books = [];
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      books.push(row);
    })
    .on('end', async () => {
      console.log(`Read ${books.length} books from CSV. Inserting into DB...`);
      for (const book of books) {
        try {
          await insertBook(book);
        } catch (err) {
          console.error('Error inserting book:', book, err.message);
        }
      }
      console.log('Import complete.');
      process.exit(0);
    });
}

importBooks(csvFilePath);
