/**
 * Password Visibility Toggle Module
 * Handles showing/hiding password with eye icon
 */

document.addEventListener('DOMContentLoaded', () => {
  const passwordInput = document.getElementById('password');
  const passwordToggle = document.getElementById('password-toggle');
  const labelSpan = passwordToggle ? passwordToggle.querySelector('.password-toggle-label') : null;

  if (!passwordInput || !passwordToggle) {
    console.warn('[PasswordToggle] العناصر المطلوبة غير موجودة');
    return;
  }

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = (e) => {
    e.preventDefault();
    
    const isHidden = passwordInput.type === 'password';
    const icon = passwordToggle.querySelector('i, svg');

    if (isHidden) {
      // Show password
      passwordInput.type = 'text';
      if (icon && icon.classList) {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      }
      passwordToggle.setAttribute('aria-label', 'إخفاء كلمة المرور');
      if (labelSpan) labelSpan.textContent = 'إخفاء';
    } else {
      // Hide password
      passwordInput.type = 'password';
      if (icon && icon.classList) {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
      passwordToggle.setAttribute('aria-label', 'إظهار كلمة المرور');
      if (labelSpan) labelSpan.textContent = 'إظهار';
    }
  };

  // Event listener
  passwordToggle.addEventListener('click', togglePasswordVisibility);
  // Keyboard accessibility: allow Enter / Space to toggle
  passwordToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePasswordVisibility(e);
    }
  });

  console.log('[PasswordToggle] تم تهيئة الوحدة بنجاح');
});
