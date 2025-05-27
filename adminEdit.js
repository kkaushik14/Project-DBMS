document.getElementById('year').textContent = new Date().getFullYear();

const API_BASE_URL = 'http://localhost:1954';

async function fetchIssuedBooks() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/issued-books`);
    if (!res.ok) throw new Error("Could not fetch issued books");
    const books = await res.json();
    const list = document.getElementById('issued-books-list');
    if (!books || books.length === 0) {
      list.innerHTML = `<div class="col-span-full text-center text-blue-400/70 text-lg font-medium py-16">No issued books found.</div>`;
      return;
    }
    list.innerHTML = books.map(b => `
      <form class="glass border-2 border-blue-600/50 hover:border-blue-400/90 rounded-2xl shadow-2xl p-8 flex flex-col gap-6 issued-edit-form transition-all duration-200 mt-2 mb-2 mx-2"
            data-id="${b.id}">
        <div class="flex flex-col gap-4">
          <div>
            <label class="text-blue-200 font-semibold field-label mb-1 block">Student Name</label>
            <input type="text" name="name" autocomplete="off" value="${b.student_name ? escapeHtml(b.student_name) : ''}" class="auth-input" required maxlength="100" />
          </div>
          <div>
            <label class="text-blue-200 font-semibold field-label mb-1 block">Payment (₹)</label>
            <input type="number" name="payment" value="${Number(b.payment) || 0}" class="auth-input" required min="0" step="0.01" />
          </div>
          <div>
            <label class="text-blue-200 font-semibold field-label mb-1 block">Return Date</label>
            <input type="date" name="return_date" value="${b.return_date ? b.return_date.split('T')[0] : ''}" class="auth-input" required />
          </div>
        </div>
        <div class="flex flex-col gap-2 mt-2">
          <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-green-300 transition text-lg mb-1">
            Update
          </button>
          <button type="button" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-red-300 transition text-lg delete-btn">
            Delete
          </button>
        </div>
        <div class="flex flex-wrap justify-between items-center text-xs text-blue-400/80 mt-2 gap-2">
          <div class="truncate">Book ID: <span class="font-bold text-blue-200">${escapeHtml(b.book_id)}</span></div>
          <div>Issued on: <span class="font-bold text-blue-200">${formatDate(b.issued_date)}</span></div>
        </div>
        <div class="update-status text-xs mt-1 text-blue-300 font-medium h-4"></div>
      </form>
    `).join('');
    setupEditDeleteHandlers();
  } catch (err) {
    document.getElementById('issued-books-list').innerHTML = `<div class="col-span-full text-center text-red-300 text-lg font-semibold py-16">Error loading issued books</div>`;
  }
}

function setupEditDeleteHandlers() {
  document.querySelectorAll('.issued-edit-form').forEach(form => {
    const id = form.getAttribute('data-id');
    form.onsubmit = async function(e) {
      e.preventDefault();
      const name = form.name.value.trim();
      const payment = form.payment.value;
      const return_date = form.return_date.value;
      const status = form.querySelector('.update-status');
      if (!name || !payment || !return_date) {
        status.textContent = 'Please fill all fields.';
        status.classList.add('text-red-400');
        return;
      }
      status.textContent = 'Updating...';
      status.classList.remove('text-red-400');
      const res = await fetch(`${API_BASE_URL}/api/admin/issued-books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, payment, return_date })
      });
      let result;
      try { result = await res.json(); } catch { result = {}; }
      if (res.ok) {
        status.textContent = result.message || 'Successfully updated!';
        status.classList.remove('text-red-400');
        status.classList.add('text-green-400');
      } else {
        status.textContent = result.message || 'Update failed.';
        status.classList.remove('text-green-400');
        status.classList.add('text-red-400');
      }
    };
    form.querySelector('.delete-btn').onclick = async function() {
      if (!confirm('Are you sure you want to delete this issued book record? This action cannot be undone.')) return;
      const status = form.querySelector('.update-status');
      status.textContent = 'Deleting...';
      status.classList.remove('text-green-400', 'text-red-400');
      const res = await fetch(`${API_BASE_URL}/api/admin/issued-books/${id}`, { method: 'DELETE' });
      let result;
      try { result = await res.json(); } catch { result = {}; }
      if (res.ok) {
        status.textContent = result.message || 'Deleted!';
        status.classList.remove('text-red-400');
        status.classList.add('text-green-400');
        setTimeout(fetchIssuedBooks, 800);
      } else {
        status.textContent = result.message || 'Delete failed.';
        status.classList.remove('text-green-400');
        status.classList.add('text-red-400');
      }
    };
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return escapeHtml(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

fetchIssuedBooks();