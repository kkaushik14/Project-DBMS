# Library Management System

A full-featured Library Management System with separate Admin and Student sections, built using Node.js, Express, MySQL, HTML, Tailwind CSS, and JavaScript.

## Features

- **Separate Admin and Student authentication**
  - Login/Signup with password confirmation and OTP verification
- **Dashboards** for both Admin and Student after login
- **Student Section:**
  - Issue books (track issued date, payment, return date, days left)
  - Receive email notifications after issuing a book
- **Admin Section:**
  - View and manage student records
  - Track all issued books and related info

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** MySQL
- **Frontend:** HTML, Tailwind CSS, JavaScript

## Project Structure

- `server.js` – Main server file
- `db.js` – Database connection
- `models/` – Data models for Admin and Student
- `routes/` – Express routes for admin, student, books, authentication, and OTP
- `assets/` – Static assets (e.g., favicon)
- `test/` – Testing scripts and HTML
- `output.css`, `styles.css`, `tailwind.config.js`, `postcss.config.js` – Tailwind CSS setup

## Installation

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd "Project DBMS"
   ```

2. **Install Node.js dependencies:**
   ```sh
   npm install
   ```

3. **Install MySQL and set up the database:**
   - Ensure MySQL is installed and running.
   - Create a database and import the schema:
     ```sh
     mysql -u <username> -p < database_name < schema.sql
     ```
   - Update your MySQL credentials in `db.js` or the relevant config file.

4. **Configure environment variables:**
   - Set up SMTP credentials for OTP and email notifications (e.g., in a `.env` file or directly in config).
   - Example variables:
     ```
     DB_HOST=localhost
     DB_USER=your_mysql_user
     DB_PASSWORD=your_mysql_password
     DB_NAME=your_db_name
     SMTP_HOST=smtp.example.com
     SMTP_PORT=587
     SMTP_USER=your_email@example.com
     SMTP_PASS=your_email_password
     ```

5. **Build Tailwind CSS (if needed):**
   ```sh
   npx tailwindcss -i ./styles.css -o ./output.css --watch
   ```

6. **Start the server:**
   ```sh
   npm start
   ```

7. **Access the application:**
   - Open your browser and go to `http://localhost:${PORT}`

## Library Dependencies

- express
- mysql
- nodemailer (for email/OTP)
- dotenv (for environment variables)
- tailwindcss (for styling)
- postcss, autoprefixer (for Tailwind build)
- (Add any other dependencies as listed in your `package.json`)

Install all dependencies with:
```sh
npm install
```

## Notes

- OTP login and email notifications require SMTP configuration.
- Replace all placeholder values in config files and environment variables.
- For development, use the Tailwind CLI in watch mode to auto-build CSS.

## Testing

- Test scripts are available in the `test/` directory.
- You can run API tests using:
  ```sh
  node test/apiTesting.js
  ```
