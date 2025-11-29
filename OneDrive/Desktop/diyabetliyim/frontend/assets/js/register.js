import AUTH from './auth.js';

async function loadLanguage(lang) {
  try {
    const res = await fetch(`assets/i18n/${lang}.json`);
    const translations = await res.json();
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (translations[key]) el.textContent = translations[key];
    });
  } catch (err) {
    console.warn('i18n load failed', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const langSelect = document.getElementById('lang-select');
  const saved = localStorage.getItem('lang') || 'tr';
  // guard in case the page doesn't render a language select
  if (langSelect) {
    langSelect.value = saved;
    loadLanguage(saved);

    langSelect.addEventListener('change', (e) => {
      localStorage.setItem('lang', e.target.value);
      loadLanguage(e.target.value);
    });
  } else {
    // still load translations into elements that exist
    loadLanguage(saved);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    const name = form['name'].value.trim();
    const nationalId = form['nationalId'].value.trim();
    const dob = form['dob'].value;
    const address = form['address'].value.trim();
    const doctor = form['doctor'].value.trim();
    const email = form['email'].value.trim();
    const password = form['password'].value;
    const confirm = form['confirm'].value;
    const agree = form['agree'].checked;

    let hasErr = false;
    if (!name) { showError('name', 'Required'); hasErr = true; }
    if (!nationalId || !/^[0-9]+$/.test(nationalId)) { showError('nationalId', 'Invalid national ID'); hasErr = true; }
    if (!dob) { showError('dob', 'Required'); hasErr = true; }
    if (!address) { showError('address', 'Required'); hasErr = true; }
    if (!email || !email.includes('@')) { showError('email', 'Invalid email'); hasErr = true; }
    if (!password || password.length < 6) { showError('password', 'Password must be at least 6 characters'); hasErr = true; }
    if (password !== confirm) { showError('confirm', 'Passwords do not match'); hasErr = true; }
    if (!agree) { showError('agree', 'You must agree to terms'); hasErr = true; }
    if (hasErr) return;

    // --- reCAPTCHA v2 validation ---
    let captchaToken = '';
    try {
      if (typeof grecaptcha !== 'undefined') {
        captchaToken = grecaptcha.getResponse();
      }
    } catch (err) {
      console.warn('grecaptcha not available', err);
    }
    if (!captchaToken) {
      showFormError('Please confirm you are not a robot');
      const capEl = document.getElementById('captcha-error'); if (capEl) capEl.textContent = 'Please confirm you are not a robot';
      return;
    }

    // map frontend form fields to backend expected fields
    const payload = {
      fullName: name,
      identityNumber: nationalId,
      birthDate: dob,
      address,
      email,
      password,
      doctorId: doctor || null
    };
    // include captcha if present
    if (captchaToken) payload.captcha = captchaToken;
    payload.captcha = captchaToken;

    // If you serve frontend from a different port (eg. Live Server on :5500)
    // set the backend base URL here so requests reach your API on :5000.
    // You can also set `window.__API_BASE__` before this script runs.
    const API_BASE = window.__API_BASE__ || ((location.port && location.port !== '5000') ? `http://${location.hostname}:5000` : '');

    try {
      const url = API_BASE ? `${API_BASE}/api/auth/register` : '/api/auth/register';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) Object.keys(data.errors).forEach(k => showError(k, data.errors[k]));
        else showFormError(data.message || 'Registration failed');
        return;
      }
      window.location.href = 'login.html';
    } catch (err) {
      showFormError('Network error');
    }
  });
});

function clearErrors() {
  document.querySelectorAll('.error').forEach(e => e.textContent = '');
  const formError = document.getElementById('form-error'); if (formError) formError.textContent = '';
}

function showError(fieldName, msg) {
  const el = document.getElementById(fieldName + '-error');
  if (el) el.textContent = msg;
}

function showFormError(msg) {
  const el = document.getElementById('form-error');
  if (el) el.textContent = msg;
}
