// Frontend auth helper for login & register
// Handles form submission, token storage, redirects and logout

const API_PREFIX = '/auth';

// Compute API base so frontend served on another port (eg Live Server :5500)
const API_BASE = window.__API_BASE__ || ((location.port && location.port !== '5000') ? `http://${location.hostname}:5000` : '');
// APP_BASE: where the app HTML is served from. If frontend is on Live Server, set window.__APP_BASE__ = 'http://127.0.0.1:5000' to force redirects
const APP_BASE = window.__APP_BASE__ || API_BASE || '';

async function postJSON(url, body) {
  const fullUrl = url.startsWith('/') && API_BASE ? `${API_BASE}${url}` : url;
  const res = await fetch(fullUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

function showFormError(formEl, message) {
  if (!formEl) return;
  const err = formEl.querySelector('#form-error') || formEl.querySelector('.form-error');
  if (err) err.textContent = message || '';
}

function clearFieldErrors(formEl) {
  if (!formEl) return;
  const els = formEl.querySelectorAll('.error');
  els.forEach(e => { e.textContent = ''; });
}

function saveAuth(token, role) {
  if (token) localStorage.setItem('authToken', token);
  if (role) localStorage.setItem('userRole', role);
}

function redirectByRole(role) {
  if (!role) return;
  role = role.toLowerCase();
  const base = APP_BASE;
  const p = base ? `${base}/patient/patient-dashboard.html` : '/patient/patient-dashboard.html';
  const d = base ? `${base}/doctor/dashboard.html` : '/doctor/dashboard.html';
  const a = base ? `${base}/admin/dashboard.html` : '/admin/dashboard.html';
  if (role === 'patient') window.location.href = p;
  else if (role === 'doctor') window.location.href = d;
  else if (role === 'admin') window.location.href = a;
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const form = e.target;
  clearFieldErrors(form);
  showFormError(form, '');

  const fullName = (form.querySelector('#name') || {}).value || '';
  const identityNumber = (form.querySelector('#nationalId') || {}).value || '';
  const birthdate = (form.querySelector('#dob') || {}).value || '';
  const address = (form.querySelector('#address') || {}).value || '';
  const doctorName = (form.querySelector('#doctor') || {}).value || '';
  const email = (form.querySelector('#email') || {}).value || '';
  const password = (form.querySelector('#password') || {}).value || '';
  const confirm = (form.querySelector('#confirm') || {}).value || '';

  if (password !== confirm) {
    showFormError(form, 'Passwords do not match');
    return;
  }

  const payload = { fullName, identityNumber, birthdate, address, doctorName, email, password };

  try {
    const { ok, data, status } = await postJSON(`${API_PREFIX}/register`, payload);
    if (!ok) {
      const msg = data && (data.message || data.error) ? (data.message || data.error) : 'Registration failed';
      showFormError(form, msg);
      return;
    }

    const token = data.token || (data.data && data.data.token) || null;
    const role = data.role || (data.user && data.user.role) || (data.data && data.data.user && data.data.user.role) || 'patient';
    if (token) saveAuth(token, role);
    redirectByRole(role);
  } catch (err) {
    showFormError(form, 'Registration failed');
    console.error('register error', err);
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const form = e.target;
  clearFieldErrors(form);
  showFormError(form, '');

  const identifier = (form.querySelector('#identifier') || {}).value || '';
  const password = (form.querySelector('#password') || {}).value || '';

  if (!identifier || !password) {
    showFormError(form, 'Please enter identity number and password');
    return;
  }

  const payload = { identityNumber: identifier, password };

  try {
    const { ok, data } = await postJSON(`${API_PREFIX}/login`, payload);
    if (!ok) {
      const msg = data && (data.message || data.error) ? (data.message || data.error) : 'Login failed';
      showFormError(form, msg);
      return;
    }

    const token = data.token || data.data?.token || null;
    const role = data.role || data.user?.role || data.data?.user?.role || 'patient';
    if (token) saveAuth(token, role);
    redirectByRole(role);
  } catch (err) {
    showFormError(form, 'Login failed');
    console.error('login error', err);
  }
}

function initAuth() {
  // auto-redirect if already logged in
  const existingToken = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
  const existingRole = localStorage.getItem('userRole');
  // Allow explicitly visiting the login/register pages even if a token exists so
  // a user can re-authenticate. Only auto-redirect from non-auth pages.
  const currentPage = (location.pathname || '').split('/').pop();
  const authPages = ['login.html', 'register.html'];
  if (existingToken && existingRole && !authPages.includes(currentPage)) {
    redirectByRole(existingRole);
    return;
  }

  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');

  if (registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);
  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  window.location.href = '/login.html';
}

// expose logout globally
window.logout = logout;

// initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}

export { logout };
// auth.js - helpers for auth session and redirects
const AUTH = {
  saveSession({ token, user }) {
    // write both legacy and new keys so other modules find the token/user
    if (token) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('authToken', token);
    }
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_user_readable', JSON.stringify(user));
      try {
        // also write userRole for older code paths
        if (user.role) localStorage.setItem('userRole', user.role);
      } catch (e) {}
    }
  },
  clearSession() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_user_readable');
    localStorage.removeItem('userRole');
  },
  getToken() {
    return localStorage.getItem('auth_token') || localStorage.getItem('authToken');
  },
  getUser() {
    const u = localStorage.getItem('auth_user');
    if (u) return JSON.parse(u);
    const alt = localStorage.getItem('auth_user_readable');
    return alt ? JSON.parse(alt) : null;
  },
  logout() {
    this.clearSession();
    window.location.href = 'login.html';
  },
  redirectByRole() {
    const user = this.getUser();
    if (!user) return window.location.href = 'login.html';
    const base = APP_BASE;
    const p = base ? `${base}/patient/patient-dashboard.html` : 'patient/patient-dashboard.html';
    const d = base ? `${base}/doctor/dashboard.html` : 'doctor/dashboard.html';
    const a = base ? `${base}/admin/dashboard.html` : 'admin/dashboard.html';
    if (user.role === 'patient') return window.location.href = p;
    if (user.role === 'doctor') return window.location.href = d;
    if (user.role === 'admin') return window.location.href = a;
    // default
    window.location.href = 'login.html';
  }
};

export default AUTH;
