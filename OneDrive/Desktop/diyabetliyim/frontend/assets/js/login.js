import AUTH from './auth.js';

// i18n loader (simple) - uses existing assets/i18n JSON files
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
  const form = document.getElementById('login-form');
  const langSelect = document.getElementById('lang-select');
  const saved = localStorage.getItem('lang') || 'tr';
  if (langSelect) {
    langSelect.value = saved;
    loadLanguage(saved);
    langSelect.addEventListener('change', (e) => {
      localStorage.setItem('lang', e.target.value);
      loadLanguage(e.target.value);
    });
  } else {
    loadLanguage(saved);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    const identifier = form['identifier'].value.trim();
    const password = form['password'].value;
    const remember = form['remember'].checked;

    // client validation
    let hasErr = false;
    if (!identifier) { showError('identifier', 'Please enter email or national ID'); hasErr = true; }
    if (!password) { showError('password', 'Please enter password'); hasErr = true; }
    if (hasErr) return;

    // --- reCAPTCHA v2 validation ---
    // Skip client-side captcha enforcement for local development (localhost/127.0.0.1)
    let captchaToken = '';
    const isLocal = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
    try {
      if (!isLocal && typeof grecaptcha !== 'undefined') {
        captchaToken = grecaptcha.getResponse();
      }
    } catch (err) {
      console.warn('grecaptcha not available', err);
    }
    if (!isLocal && !captchaToken) {
      showFormError('Please confirm you are not a robot');
      const capEl = document.getElementById('captcha-error'); if (capEl) capEl.textContent = 'Please confirm you are not a robot';
      return;
    }

    // Support a configurable API base so frontend served from Live Server (:5500) can reach backend (:5000)
    const API_BASE = window.__API_BASE__ || ((location.port && location.port !== '5000') ? `http://${location.hostname}:5000` : '');
    try {
      const url = API_BASE ? `${API_BASE}/api/auth/login` : '/api/auth/login';
      const payload = { identifier, password };
      if (captchaToken) payload.captcha = captchaToken;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        // show server error
        if (data.errors) {
          // multi errors
          Object.keys(data.errors).forEach(k => showError(k, data.errors[k]));
        } else if (data.message) {
          showFormError(data.message);
        }
        return;
      }

      AUTH.saveSession({ token: data.token, user: data.user });
      // optionally remember in localStorage longer
      if (remember) localStorage.setItem('remember', '1');
      AUTH.redirectByRole();
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
