const API_BASE_URL = 'http://localhost:1954';

function showSection(section) {
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('student-section').classList.add('hidden');
  document.getElementById('admin-section').classList.add('hidden');
  if (section === 'student') {
    document.getElementById('student-section').classList.remove('hidden');
    const user = JSON.parse(localStorage.getItem('lms_user'));
    if (user && user.role === 'student') {
      showStudentForm('dashboard');
      loadIssuedBooks(user.id);
    } else {
      showStudentForm('login');
    }
  } else if (section === 'admin') {
    document.getElementById('admin-section').classList.remove('hidden');
    const user = JSON.parse(localStorage.getItem('lms_user'));
    if (user && user.role === 'admin') {
      showAdminForm('dashboard');
    } else {
      showAdminForm('login');
    }
  }
}

function showStudentForm(form) {
  ['login', 'signup', 'otp', 'dashboard'].forEach(f => {
    const el = document.getElementById(`student-${f}`);
    if (el) el.classList.add('hidden');
  });
  if (form === 'dashboard') {
    document.getElementById('student-dashboard').classList.remove('hidden');
  } else {
    document.getElementById(`student-${form}`).classList.remove('hidden');
  }
}

function showAdminForm(form) {
  ['login', 'signup', 'otp', 'dashboard'].forEach(f => {
    const el = document.getElementById(`admin-${f}`);
    if (el) el.classList.add('hidden');
  });
  if (form === 'dashboard') {
    document.getElementById('admin-dashboard').classList.remove('hidden');
  } else {
    document.getElementById(`admin-${form}`).classList.remove('hidden');
  }
}

// Student Signup
document.getElementById('studentSignupForm').onsubmit = async function(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.name.value,
    email: form.email.value,
    password: form.password.value,
    confirmPassword: form.confirmPassword.value,
    role: 'student'
  };
  if (data.password !== data.confirmPassword) {
    if (window.showNotification) showNotification({ message: 'Passwords do not match!', type: 'error' });
    return;
  }
  window.showGlobalLoader && window.showGlobalLoader();
  const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  window.hideGlobalLoader && window.hideGlobalLoader();
  if (window.showNotification) {
    showNotification({
      message: result.message,
      type: res.ok ? 'success' : 'error'
    });
  }
  if (res.ok) showStudentForm('login');
};

// Student Login
document.getElementById('studentLoginForm').onsubmit = async function(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    email: form.email.value,
    password: form.password.value,
    role: 'student'
  };
  window.showGlobalLoader && window.showGlobalLoader();
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  window.hideGlobalLoader && window.hideGlobalLoader();
  if (res.ok) {
    localStorage.setItem('lms_user', JSON.stringify({
      name: result.user.name,
      role: result.user.role,
      email: result.user.email,
      id: result.user.id,
      loginTime: Date.now()
    }));
    showStudentForm('dashboard');
    loadIssuedBooks(result.user.id);
    if (window.showUserAvatar) window.showUserAvatar(result.user.name, result.user.role, result.user.email);
    if (window.showNotification) showNotification({ message: 'Login successful!', type: 'success' });
    updateUIAfterAuthChange();
  } else {
    if (window.showNotification) showNotification({ message: result.message, type: 'error' });
  }
};

// Student OTP
async function sendOtp(role) {
  const email = document.querySelector(`#${role}OtpForm input[name=email]`).value;
  const res = await fetch(`${API_BASE_URL}/api/otp/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role })
  });
  const result = await res.json();
  if (window.showNotification) showNotification({ message: result.message, type: res.ok ? 'success' : 'error' });
}

document.getElementById('studentOtpForm').onsubmit = async function(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value;
  const otp = form.otp.value;
  showLoader(form);
  const res = await fetch(`${API_BASE_URL}/api/otp/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, role: 'student' })
  });
  const result = await res.json();
  hideLoader(form);
  if (res.ok && result.user) {
    localStorage.setItem('lms_user', JSON.stringify({
      name: result.user.name,
      role: result.user.role,
      email: result.user.email,
      id: result.user.id,
      loginTime: Date.now()
    }));
    showStudentForm('dashboard');
    loadIssuedBooks(result.user.id);
    if (window.showUserAvatar) window.showUserAvatar(result.user.name, result.user.role, result.user.email);
    if (window.showNotification) showNotification({ message: 'OTP login successful!', type: 'success' });
    updateUIAfterAuthChange();
  } else {
    if (window.showNotification) showNotification({ message: result.message, type: 'error' });
  }
};

function showIssueBookForm() {
  document.getElementById('issue-book-form').classList.toggle('hidden');
}


// Book Autocomplete
const bookSearchInput = document.getElementById('book-search');
const bookSuggestions = document.getElementById('book-suggestions');
const selectedBookDetails = document.getElementById('selected-book-details');
const selectedBookIdInput = document.getElementById('selected-book-id');
const paymentField = document.getElementById('payment-field');

let bookSearchTimeout = null;
let selectedBook = null;

bookSearchInput.addEventListener('input', function () {
  const query = this.value.trim();
  if (bookSearchTimeout) clearTimeout(bookSearchTimeout);
  if (!query) {
    bookSuggestions.classList.add('hidden');
    return;
  }
  bookSearchTimeout = setTimeout(async () => {
    bookSuggestions.innerHTML = '<div class="px-4 py-2 text-blue-300">Searching...</div>';
    bookSuggestions.classList.remove('hidden');
    const res = await fetch(`${API_BASE_URL}/api/books?search=${encodeURIComponent(query)}`);
    const books = await res.json();
    if (!books.length) {
      bookSuggestions.innerHTML = '<div class="px-4 py-2 text-blue-300">No books found</div>';
      return;
    }
    bookSuggestions.innerHTML = books.map(book =>
      `<div class='px-4 py-2 hover:bg-blue-700 hover:text-white cursor-pointer rounded transition' data-id='${book.book_id}' data-title='${book.title}' data-authors='${book.authors}' data-genre='${book.genre}' data-available='${book.available}' data-price='${book.price}'>
        <span class='font-semibold'>${book.title}</span> <span class='text-xs text-blue-300'>by ${book.authors}</span><br>
        <span class='text-xs text-blue-400'>ID: ${book.book_id} | Genre: ${book.genre} | ₹${book.price} | Available: ${book.available}</span>
      </div>`
    ).join('');

    // Click listeners
    Array.from(bookSuggestions.children).forEach(child => {
      child.onclick = function () {
        selectedBook = {
          book_id: this.getAttribute('data-id'),
          title: this.getAttribute('data-title'),
          authors: this.getAttribute('data-authors'),
          genre: this.getAttribute('data-genre'),
          available: this.getAttribute('data-available'),
          price: this.getAttribute('data-price')
        };
        bookSearchInput.value = `${selectedBook.title} (${selectedBook.book_id})`;
        selectedBookIdInput.value = selectedBook.book_id;
        selectedBookDetails.innerHTML = `
          <div><span class='font-bold'>Title:</span> ${selectedBook.title}</div>
          <div><span class='font-bold'>Author(s):</span> ${selectedBook.authors}</div>
          <div><span class='font-bold'>Genre:</span> ${selectedBook.genre}</div>
          <div><span class='font-bold'>Available:</span> ${selectedBook.available}</div>
          <div><span class='font-bold'>Price:</span> ₹${selectedBook.price}</div>
        `;
        selectedBookDetails.classList.remove('hidden');
        paymentField.value = selectedBook.price;
        bookSuggestions.classList.add('hidden');
      };
    });
  }, 250);
});

document.addEventListener('click', function (e) {
  if (!bookSuggestions.contains(e.target) && e.target !== bookSearchInput) {
    bookSuggestions.classList.add('hidden');
  }
});

// Date Validation Logic
const issueDateInput = document.getElementById('issue-date');
const returnDateInput = document.getElementById('return-date');

function setMinDates() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const minIssue = `${yyyy}-${mm}-${dd}`;
  issueDateInput.min = minIssue;
  if (!issueDateInput.value || issueDateInput.value < minIssue) issueDateInput.value = minIssue;
  returnDateInput.min = issueDateInput.value;
  if (!returnDateInput.value || returnDateInput.value < issueDateInput.value) returnDateInput.value = issueDateInput.value;
}

issueDateInput.addEventListener('change', setMinDates);
returnDateInput.addEventListener('change', setMinDates);
document.addEventListener('DOMContentLoaded', setMinDates);

// Issue Book Form Submission
document.getElementById('issueBookForm').onsubmit = async function(e) {
  e.preventDefault();
  const form = e.target;
  const user = JSON.parse(localStorage.getItem('lms_user'));
  if (!user) return;

  if (!selectedBookIdInput.value) {
    showNotification({ message: 'Please select a book from suggestions.', type: 'error' });
    return;
  }
  if (!issueDateInput.value) {
    showNotification({ message: 'Please select an issue date.', type: 'error' });
    return;
  }
  if (!returnDateInput.value) {
    showNotification({ message: 'Please select a return date.', type: 'error' });
    return;
  }
  if (!paymentField.value) {
    showNotification({ message: 'Payment field is required.', type: 'error' });
    return;
  }

  if (issueDateInput.value < issueDateInput.min) {
    showNotification({ message: 'Issue date cannot be before today.', type: 'error' });
    return;
  }
  if (returnDateInput.value < issueDateInput.value) {
    showNotification({ message: 'Return date cannot be before issue date.', type: 'error' });
    return;
  }

  // Check book availability
  try {
    const availabilityRes = await fetch(`${API_BASE_URL}/api/books/suggest?q=${encodeURIComponent(selectedBook.title)}`);
    const suggestions = await availabilityRes.json();
    const bookDetails = suggestions.find(b => b.book_id === selectedBookIdInput.value);
    if (!bookDetails) {
      showNotification({ message: 'Book not found.', type: 'error' });
      return;
    }

    const data = {
      studentId: user.id,
      bookId: selectedBookIdInput.value,
      issuedDate: issueDateInput.value,
      returnDate: returnDateInput.value,
      payment: paymentField.value,
      email: user.email
    };

    window.showGlobalLoader && window.showGlobalLoader();
    const res = await fetch(`${API_BASE_URL}/api/student/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    window.hideGlobalLoader && window.hideGlobalLoader();
    
    if (window.showNotification) showNotification({ message: result.message, type: res.ok ? 'success' : 'error' });
    if (res.ok) {
      loadIssuedBooks(user.id);
      form.reset();
      selectedBookDetails.classList.add('hidden');
      selectedBookIdInput.value = '';
      selectedBook = null;
      setMinDates();
    }
  } catch (err) {
    window.hideGlobalLoader && window.hideGlobalLoader();
    showNotification({ message: 'Failed to issue book. Please try again.', type: 'error' });
  }
};

async function loadIssuedBooks(studentId) {
  const res = await fetch(`${API_BASE_URL}/api/student/issued/${studentId}`);
  const books = await res.json();
  const list = document.getElementById('issued-books-list');
  list.innerHTML = '<h3 class="font-semibold mb-2">Issued Books</h3>' +
    books.map(b => `
      <div class="border p-2 mb-2 relative">
        <div>Book ID: ${b.book_id}</div>
        <div>Issued: ${b.issued_date}</div>
        <div>Return: ${b.return_date}</div>
        <div>Payment: ${b.payment}</div>
        <button 
          onclick="returnBook(${studentId}, ${b.book_id}, ${b.id})"
          class="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          Return Book
        </button>
      </div>
    `).join('');
}

async function returnBook(studentId, bookId, issueId) {
  if (!confirm('Are you sure you want to return this book?')) return;

  window.showGlobalLoader && window.showGlobalLoader();
  try {
    const res = await fetch(`${API_BASE_URL}/api/student/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, bookId, issueId })
    });
    const result = await res.json();
    
    if (res.ok) {
      showNotification({ message: 'Book returned successfully!', type: 'success' });
      loadIssuedBooks(studentId); // Refresh the list
    } else {
      showNotification({ message: result.message, type: 'error' });
    }
  } catch (err) {
    showNotification({ message: 'Failed to return book. Please try again.', type: 'error' });
  } finally {
    window.hideGlobalLoader && window.hideGlobalLoader();
  }
}

// Admin Signup
document.getElementById('adminSignupForm').onsubmit = async function(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.name.value,
    email: form.email.value,
    password: form.password.value,
    confirmPassword: form.confirmPassword.value,
    role: 'admin'
  };
  if (data.password !== data.confirmPassword) {
    if (window.showNotification) showNotification({ message: 'Passwords do not match!', type: 'error' });
    return;
  }
  window.showGlobalLoader && window.showGlobalLoader();
  const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  window.hideGlobalLoader && window.hideGlobalLoader();
  if (window.showNotification) {
    showNotification({
      message: result.message,
      type: res.ok ? 'success' : 'error'
    });
  }
  if (res.ok) showAdminForm('login');
};

// Admin Login
document.getElementById('adminLoginForm').onsubmit = async function(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    email: form.email.value,
    password: form.password.value,
    role: 'admin'
  };
  window.showGlobalLoader && window.showGlobalLoader();
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  window.hideGlobalLoader && window.hideGlobalLoader();
  if (res.ok) {
    localStorage.setItem('lms_user', JSON.stringify({
      name: result.user.name,
      role: result.user.role,
      email: result.user.email,
      loginTime: Date.now()
    }));
    showAdminForm('dashboard');
    if (window.showUserAvatar) window.showUserAvatar(result.user.name, result.user.role, result.user.email);
    if (window.showNotification) showNotification({ message: 'Login successful!', type: 'success' });
    updateUIAfterAuthChange();
  } else {
    if (window.showNotification) showNotification({ message: result.message, type: 'error' });
  }
};

// Admin OTP
document.getElementById('adminOtpForm').onsubmit = async function(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value;
  const otp = form.otp.value;
  showLoader(form);
  const res = await fetch(`${API_BASE_URL}/api/otp/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, role: 'admin' })
  });
  const result = await res.json();
  hideLoader(form);
  if (res.ok && result.user) {
    localStorage.setItem('lms_user', JSON.stringify({
      name: result.user.name,
      role: result.user.role,
      email: result.user.email,
      id: result.user.id,
      loginTime: Date.now()
    }));
    showAdminForm('dashboard');
    if (window.showUserAvatar) window.showUserAvatar(result.user.name, result.user.role, result.user.email);
    if (window.showNotification) showNotification({ message: 'OTP login successful!', type: 'success' });
    updateUIAfterAuthChange();
  } else {
    if (window.showNotification) showNotification({ message: result.message, type: 'error' });
  }
};

// Loader
function showLoader(form) {
  let loader = form.querySelector('.otp-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.className = 'otp-loader flex justify-center items-center mt-2';
    loader.innerHTML = `<svg class="animate-spin h-6 w-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>`;
    form.appendChild(loader);
  }
  loader.style.display = 'flex';
}

function hideLoader(form) {
  const loader = form.querySelector('.otp-loader');
  if (loader) loader.style.display = 'none';
}

function hideAuthUIIfLoggedIn() {
  const user = JSON.parse(localStorage.getItem('lms_user'));
  const studentBtns = document.getElementById('student-auth-btns');
  const adminBtns = document.getElementById('admin-auth-btns');
  if (user) {
    if (studentBtns) studentBtns.style.display = 'none';
    if (adminBtns) adminBtns.style.display = 'none';
    ['login', 'signup', 'otp'].forEach(f => {
      const s = document.getElementById(`student-${f}`);
      if (s) s.classList.add('hidden');
      const a = document.getElementById(`admin-${f}`);
      if (a) a.classList.add('hidden');
    });
  } else {
    if (studentBtns) studentBtns.style.display = '';
    if (adminBtns) adminBtns.style.display = '';
  }
}

function setupAuthNavigation() {
  const studentToSignup = document.getElementById('student-to-signup');
  const studentToLogin = document.getElementById('student-to-login');
  const studentToOtp = document.getElementById('student-to-otp');
  if (studentToSignup) studentToSignup.onclick = () => showStudentForm('signup');
  if (studentToLogin) studentToLogin.onclick = () => showStudentForm('login');
  if (studentToOtp) studentToOtp.onclick = () => showStudentForm('otp');

  const adminToSignup = document.getElementById('admin-to-signup');
  const adminToLogin = document.getElementById('admin-to-login');
  const adminToOtp = document.getElementById('admin-to-otp');
  if (adminToSignup) adminToSignup.onclick = () => showAdminForm('signup');
  if (adminToLogin) adminToLogin.onclick = () => showAdminForm('login');
  if (adminToOtp) adminToOtp.onclick = () => showAdminForm('otp');
}

// Logout handler
function setupLogout() {
  const studentLogout = document.getElementById('student-logout');
  const adminLogout = document.getElementById('admin-logout');
  if (studentLogout) studentLogout.onclick = function() {
    localStorage.removeItem('lms_user');
    showSection('student');
    showStudentForm('login');
    updateUIAfterAuthChange();
    if (window.showUserAvatar) window.showUserAvatar();
  };
  if (adminLogout) adminLogout.onclick = function() {
    localStorage.removeItem('lms_user');
    showSection('admin');
    showAdminForm('login');
    updateUIAfterAuthChange();
    if (window.showUserAvatar) window.showUserAvatar();
  };
}

document.addEventListener('DOMContentLoaded', function() {
  const user = JSON.parse(localStorage.getItem('lms_user'));
  if (user && user.role) {
    if (user.role === 'student') {
      showSection('student');
      showStudentForm('dashboard');
      loadIssuedBooks(user.id);
      if (window.showUserAvatar) window.showUserAvatar(user.name, user.role, user.email);
    } else if (user.role === 'admin') {
      showSection('admin');
      showAdminForm('dashboard');
      if (window.showUserAvatar) window.showUserAvatar(user.name, user.role, user.email);
    }
  } else {
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('student-section').classList.add('hidden');
    document.getElementById('admin-section').classList.add('hidden');
  }
  hideAuthUIIfLoggedIn();
  setupAuthNavigation();
  setupLogout();
});

function updateUIAfterAuthChange() {
  hideAuthUIIfLoggedIn();
  if (window.renderDashboardOptions) window.renderDashboardOptions();
}

// Admin: View Student Records
async function fetchStudentRecords() {
  window.showGlobalLoader && window.showGlobalLoader();
  const res = await fetch(`${API_BASE_URL}/api/admin/students`);
  const students = await res.json();
  window.hideGlobalLoader && window.hideGlobalLoader();
  const list = document.getElementById('admin-student-records');
  list.innerHTML = '<h3 class="font-semibold mb-2">Student Records</h3>' +
    students.map(s => `<div class="border p-2 mb-2">Name: ${s.name}<br>Email: ${s.email}<br>Book ID: ${s.book_id}<br>Issued: ${s.issued_date}<br>Return: ${s.return_date}<br>Payment: ${s.payment}</div>`).join('');
}

// Admin: View Issued Books
async function fetchIssuedBooks() {
  window.showGlobalLoader && window.showGlobalLoader();
  const res = await fetch(`${API_BASE_URL}/api/admin/issued-books`);
  const books = await res.json();
  window.hideGlobalLoader && window.hideGlobalLoader();
  const list = document.getElementById('admin-issued-books');
  list.innerHTML = '<h3 class="font-semibold mb-2">All Issued Books</h3>' +
    books.map(b => `<div class="border p-2 mb-2">Student ID: ${b.student_id}<br>Book ID: ${b.book_id}<br>Issued: ${b.issued_date}<br>Return: ${b.return_date}<br>Payment: ${b.payment}</div>`).join('');
}
