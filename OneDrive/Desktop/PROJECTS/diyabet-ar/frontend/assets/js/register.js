

document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('register-form');

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
    if (!name) { showError('name', 'الاسم مطلوب'); hasErr = true; }
    if (!nationalId || !/^[0-9]+$/.test(nationalId)) { showError('nationalId', 'رقم الهوية غير صالح'); hasErr = true; }
    if (!dob) { showError('dob', 'تاريخ الميلاد مطلوب'); hasErr = true; }
    if (!address) { showError('address', 'العنوان مطلوب'); hasErr = true; }
    if (!email || !email.includes('@')) { showError('email', 'بريد إلكتروني غير صالح'); hasErr = true; }
    if (!password || password.length < 6) { showError('password', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'); hasErr = true; }
    if (password !== confirm) { showError('confirm', 'كلمتا المرور غير متطابقتين'); hasErr = true; }
    if (!agree) {
      showError('agree', 'يرجى تحديد "أوافق على الشروط" أو قراءة الشروط.');
      alert('للمتابعة يرجى تحديد "أوافق على الشروط" أو قراءة الشروط.');
      hasErr = true;
    }
    if (hasErr) return;

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

    // If you serve frontend from a different port (eg. Live Server on :5500)
    // set the backend base URL here so requests reach your API on :5000.
    // You can also set `window.__API_BASE__` before this script runs.
    const API_BASE = window.API_BASE || '/api';

    try {
      const url = `${API_BASE}/auth/register`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) Object.keys(data.errors).forEach(k => showError(k, data.errors[k]));
        else showFormError(data.message || 'فشل التسجيل');
        return;
      }
      // Show a message to check email for verification, do not redirect
      showFormError('تم التسجيل بنجاح! يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.');
      showFormError('تم التسجيل بنجاح! يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.\n\nPlease check your email, we sent a confirmation message.');
      setTimeout(() => {
        window.location.href = 'login.html?verify=1';
      }, 2500);
      form.reset();
      // Optionally, disable the form to prevent resubmission
      Array.from(form.elements).forEach(el => el.disabled = true);
    } catch (err) {
      showFormError('خطأ في الشبكة');
      
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
