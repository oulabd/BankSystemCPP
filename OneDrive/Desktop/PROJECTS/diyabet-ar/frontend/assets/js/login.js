document.addEventListener('DOMContentLoaded', () => {

  // ---------- تسجيل الدخول ----------
  const loginForm = document.getElementById('login-form');
  const loginBtn = document.getElementById('login-btn');
  const loginSpinner = document.getElementById('login-spinner');
  const loginBtnText = document.getElementById('login-btn-text');
  const progressMsg = document.getElementById('login-progress-message');
  if (loginForm && loginBtn && loginSpinner && loginBtnText && progressMsg) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      // واجهة المستخدم: تعطيل الزر وإظهار المؤشر/الرسالة
      loginBtn.disabled = true;
      loginSpinner.style.display = '';
      progressMsg.style.display = '';
      loginBtnText.style.opacity = '0.6';

      const email = document.getElementById('identifier').value.trim();
      const password = document.getElementById('password').value;
      let res, data;
      try {
        res = await fetch(
          `${window.API_BASE}/auth/login`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              identifier: email,
              password: password
            })
          }
        );
        data = await res.json();
      } catch (err) {
        data = { message: 'تعذر الوصول إلى الخادم.' };
        res = { ok: false };
      }

      if (!res.ok) {
        // واجهة المستخدم: إعادة تفعيل الزر وإخفاء المؤشر/الرسالة
        loginBtn.disabled = false;
        loginSpinner.style.display = 'none';
        progressMsg.style.display = 'none';
        loginBtnText.style.opacity = '1';
        if (res.status === 403 && data.message && data.message.includes('aktif değil')) {
          alert('لم يتم تفعيل حسابك بعد. يرجى التحقق من بريدك الإلكتروني والضغط على رابط التفعيل.');
        } else {
          alert(data.message || 'فشل تسجيل الدخول');
        }
        return;
      }

      if (data.accessToken) {
        localStorage.setItem('authToken', data.accessToken);
      } else {
        loginBtn.disabled = false;
        loginSpinner.style.display = 'none';
        progressMsg.style.display = 'none';
        loginBtnText.style.opacity = '1';
        console.error('لم يتم استلام accessToken من الخادم.');
        alert('فشل تسجيل الدخول: لم يتم استلام رمز الدخول.');
        return;
      }
      if (data.user && data.user.role) {
        localStorage.setItem('userRole', data.user.role);
      }
      // Redirect based on user role
      if (data.user && data.user.role === 'admin') {
        window.location.href = '/admin/dashboard.html';
      } else if (data.user && data.user.role === 'doctor') {
        window.location.href = '/doctor/doctor-dashboard.html';
      } else {
        window.location.href = '/patient/patient-dashboard.html';
      }
    });
  }

  // ---------- تسجيل (للاختبار فقط) ----------
  const regForm = document.getElementById('register-form');
  if (regForm) {
    const nameEl = document.getElementById('name');
    const idEl = document.getElementById('nationalId');

    if (!nameEl || !idEl) {
      console.warn(
        '[register] لم يتم العثور على الحقول المتوقعة. أضف #name و #nationalId إلى النموذج.'
      );
    }

    regForm.addEventListener('submit', () => {
      const fullName = nameEl ? nameEl.value : undefined;
      const identityNumber = idEl ? idEl.value : undefined;
      console.debug('[register] إرسال', {
        fullName,
        identityNumber,
        hasFullName: !!fullName,
        hasIdentityNumber: !!identityNumber
      });
    });
  }

});
