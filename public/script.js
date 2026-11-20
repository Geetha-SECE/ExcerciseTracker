const API_BASE = '/api';

const responseOutput = document.getElementById('response-output');
const errorSection = document.getElementById('error-section');

function showResponse(data) {
  responseOutput.textContent = JSON.stringify(data, null, 2);
  errorSection.classList.remove('show');
}

function showError(message) {
  errorSection.textContent = message;
  errorSection.classList.add('show');
}

function clearError() {
  errorSection.classList.remove('show');
}

// Create User Form
document.getElementById('create-user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  const username = document.getElementById('new-username').value.trim();
  try {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `username=${encodeURIComponent(username)}`
    });
    const data = await res.json();
    if (!res.ok) {
      showError(data.error || 'Failed to create user');
      return;
    }
    showResponse(data);
    document.getElementById('new-username').value = '';
  } catch (err) {
    showError('Network error: ' + err.message);
  }
});

// Add Exercise Form
document.getElementById('add-exercise-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  const _id = document.getElementById('exercise-user').value.trim();
  const description = document.getElementById('exercise-description').value.trim();
  const duration = document.getElementById('exercise-duration').value;
  const date = document.getElementById('exercise-date').value;

  if (!_id || !description || duration === '') {
    showError('Please fill in all required fields');
    return;
  }

  const body = new URLSearchParams();
  body.append('_id', _id);
  body.append('description', description);
  body.append('duration', duration);
  if (date) body.append('date', date);

  try {
    const res = await fetch(`${API_BASE}/users/${_id}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    const data = await res.json();
    if (!res.ok) {
      showError(data.error || 'Failed to add exercise');
      return;
    }
    showResponse(data);
    document.getElementById('exercise-description').value = '';
    document.getElementById('exercise-duration').value = '';
    document.getElementById('exercise-date').value = '';
  } catch (err) {
    showError('Network error: ' + err.message);
  }
});

// View Log Form
document.getElementById('view-log-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  const _id = document.getElementById('log-user').value.trim();
  const from = document.getElementById('log-from').value;
  const to = document.getElementById('log-to').value;
  const limit = document.getElementById('log-limit').value;

  if (!_id) {
    showError('User ID is required');
    return;
  }

  let url = `${API_BASE}/users/${_id}/logs`;
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  if (limit) params.append('limit', limit);
  if (params.toString()) url += '?' + params.toString();

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      showError(data.error || 'Failed to fetch log');
      return;
    }
    showResponse(data);
  } catch (err) {
    showError('Network error: ' + err.message);
  }
});