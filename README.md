# Library Management System

This project is a Library Management System with two main sections: Admin and Student. Built using Node.js, Express, MySQL, HTML, Tailwind CSS, and JavaScript.

## Features
- **Separate Admin and Student authentication** (login/signup with password confirmation and OTP)
- **Dashboards** for both Admin and Student after login
- **Student Section:**
  - Issue books (track issued date, payment, return date, days left)
  - Receive email notifications after issuing a book
- **Admin Section:**
  - View and manage student records
  - Track all issued books and related info

## Tech Stack
- Node.js + Express (Backend)
- MySQL (Database)
- HTML, Tailwind CSS, JavaScript (Frontend)

## Setup Instructions
1. Install dependencies: `npm install`
2. Configure your MySQL database in the backend config.
3. Start the server: `npm start`

## Notes
- OTP login and email notifications require additional configuration (e.g., SMTP setup).
- Replace placeholder values in config files as needed.
