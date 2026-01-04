// Frontend auth helper for login & register
// Handles form submission, token storage, redirects and logout

const API_PREFIX = '/auth'; // ✅ Correct: matches backend app.use("/auth", authRoutes)

// Compute API base so frontend served on another port (eg Live Server :5500) can reach backend.
// Prefer explicit `window.API_BASE` or `window.__API_BASE__`. If frontend is served on port 5000
// assume backend runs on 3000 (development fallback).
const API_BASE =
  window.API_BASE ||
  window.__API_BASE__ ||
  `http://${location.hostname}:3000`;
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

function saveAuth(token, role, user = null) {
  if (token) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('auth_token', token);
    localStorage.setItem('token', token);
  }
  if (role) localStorage.setItem('userRole', role.toLowerCase());
  // Save user object for admin dashboard compatibility
  if (user) {
    // Also force role to lowercase in user object
    if (user.role) user.role = user.role.toLowerCase();
    localStorage.setItem('auth_user', JSON.stringify(user));
    // Save userId and doctorId for chat and other features
    if (user._id || user.id) localStorage.setItem('userId', user._id || user.id);
    if (user.assignedDoctor) localStorage.setItem('doctorId', user.assignedDoctor);
  } else if (role) {
    // Create minimal user object if not provided
    localStorage.setItem('auth_user', JSON.stringify({ role: role.toLowerCase() }));
  }
}

function redirectByRole(role) {
  if (!role) return;
  role = role.toLowerCase();
  // Always redirect to frontend path, not backend API
  if (role === 'patient') window.location.href = '/patient/patient-dashboard.html';
  else if (role === 'doctor') window.location.href = '/doctor/doctor-dashboard.html';
  else if (role === 'admin') window.location.href = '/admin/dashboard.html';
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const form = e.target;
  clearFieldErrors(form);
  showFormError(form, '');

  // Read multiple possible IDs/names and trim
  const fullName = (
    (form.querySelector('#name') ||
     form.querySelector('#fullName') ||
     form.querySelector('input[name="fullName"]') ||
     form.querySelector('input[name="name"]')
    )?.value ||
    [form.querySelector('#firstName')?.value, form.querySelector('#lastName')?.value].filter(Boolean).join(' ')
  || ''
  ).trim();

  const identityNumber = (
    (form.querySelector('#nationalId') ||
     form.querySelector('#identityNumber') ||
     form.querySelector('#identity') ||
     form.querySelector('input[name="identityNumber"]') ||
     form.querySelector('input[name="nationalId"]') ||
     form.querySelector('input[name="identity"]')
    )?.value
  || ''
  ).trim();

  const birthdate = (form.querySelector('#dob') || form.querySelector('#birthdate'))?.value || '';
  const address = (form.querySelector('#address') || {})?.value || '';
  const doctorName = (form.querySelector('#doctor') || form.querySelector('#doctorName'))?.value || '';
  const email = (form.querySelector('#email') || {})?.value?.trim() || '';
  const password = (form.querySelector('#password') || {})?.value || '';
  const confirm = (form.querySelector('#confirm') || {})?.value || '';

  if (!fullName || !identityNumber) {
    showFormError(form, 'الاسم الكامل والهوية الوطنية مطلوبان');
    return;
  }
  if (password !== confirm) {
    showFormError(form, 'كلمتا المرور غير متطابقتين');
    return;
  }

  const payload = { fullName, identityNumber, birthdate, address, doctorName, email, password };
  try {
    const { ok, data, status } = await postJSON(`${API_PREFIX}/register`, payload);
    if (!ok) {
      const msg = data && (data.message || data.error) ? (data.message || data.error) : 'فشل التسجيل';
      showFormError(form, msg);
      return;
    }
    // Clear any existing auth data to prevent auto-login
    localStorage.clear();
    // Don't auto-login - redirect to login page instead
    showFormError(form, 'تم التسجيل بنجاح! يرجى تفعيل بريدك الإلكتروني ثم تسجيل الدخول.');
    setTimeout(() => {
      window.location.href = '/login.html?verify=1';
    }, 2000);
  } catch (err) {
    showFormError(form, 'فشل التسجيل');
    console.error('register error', err);
  }
}

// Note: handleLoginSubmit has been removed - login is handled by login.js

// Initialization logic for auth forms and auto-redirect
function initAuth() {
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

  // Ensure only our register handler runs even if other scripts attached listeners
  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (form && form.id === 'register-form') {
      e.preventDefault();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      handleRegisterSubmit(e);
    }
  }, { capture: true });

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegisterSubmit);
    // Add preview logic
    const previewDiv = document.getElementById('registration-preview');
    const updatePreview = () => {
      if (!previewDiv) return;
      document.getElementById('preview-name').textContent = registerForm.querySelector('#name').value;
      document.getElementById('preview-nationalId').textContent = registerForm.querySelector('#nationalId').value;
      document.getElementById('preview-dob').textContent = registerForm.querySelector('#dob').value;
      document.getElementById('preview-address').textContent = registerForm.querySelector('#address').value;
      document.getElementById('preview-doctor').textContent = registerForm.querySelector('#doctor').value;
      document.getElementById('preview-email').textContent = registerForm.querySelector('#email').value;
      previewDiv.style.display = 'block';
    };
    // Update preview on input change
    ['name','nationalId','dob','address','doctor','email'].forEach(id => {
      const el = registerForm.querySelector(`#${id}`);
      if (el) el.addEventListener('input', updatePreview);
    });
    // Show preview on first input
    registerForm.addEventListener('focusin', updatePreview);
    // Hide preview on submit
    registerForm.addEventListener('submit', () => { if (previewDiv) previewDiv.style.display = 'none'; });
  }
  
  // Note: Login form listener removed - handled by login.js
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('auth_user_readable');
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

// auth.js - helpers for auth session and redirects
const AUTH = {
  saveSession({ token, user }) {
    // write both legacy and new keys so other modules find the token/user
    if (token) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('auth_token', token);
    }
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_user_readable', JSON.stringify(user));
      try {
        // also write userRole for older code paths
        if (user.role) localStorage.setItem('userRole', user.role);
        // Save userId and doctorId for chat and other features
        if (user._id || user.id) localStorage.setItem('userId', user._id || user.id);
        if (user.assignedDoctor) localStorage.setItem('doctorId', user.assignedDoctor);
      } catch (e) {}
    }
  },
  clearSession() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_user_readable');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('doctorId');
  },
  getToken() {
    return localStorage.getItem('authToken') || localStorage.getItem('auth_token');
  },
  getUser() {
    const u = localStorage.getItem('auth_user');
    if (u) return JSON.parse(u);
    const alt = localStorage.getItem('auth_user_readable');
    return alt ? JSON.parse(alt) : null;
  },
  logout() {
    this.clearSession();
    window.location.href = '/login.html';
  },
  redirectByRole() {
    const user = this.getUser();
    if (!user) return window.location.href = 'login.html';
    // Always redirect to frontend path, not backend API
    if (user.role === 'patient') return window.location.href = '/patient/patient-dashboard.html';
    if (user.role === 'doctor') return window.location.href = '/doctor/doctor-dashboard.html';
    if (user.role === 'admin') return window.location.href = '/admin/dashboard.html';
    // default
    window.location.href = 'login.html';
  }
};

export default AUTH;
