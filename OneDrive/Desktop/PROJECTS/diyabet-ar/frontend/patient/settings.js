// Ensure phone label is set using i18n

// Helper function to get normalized API_BASE
function getAPIBase() {
  let base = window.API_BASE || 'http://localhost:3001';
  if (!base.endsWith('/api')) {
    base = base + '/api';
  }
  return base;
}

// Ensure delete button label is set using i18n
document.addEventListener('DOMContentLoaded', function () {
  const deleteBtn = document.getElementById('deleteBtn');
  if (deleteBtn) {
    deleteBtn.textContent = 'حذف الحساب';
  }
});
// Account Deletion Logic
document.addEventListener('DOMContentLoaded', function () {
  const deleteBtn = document.getElementById('deleteBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async function () {
      const confirmDelete = confirm('هل أنت متأكد من رغبتك في حذف حسابك؟');
      if (!confirmDelete) return;
      const API_BASE = getAPIBase();
      const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
      try {
        const res = await fetch(`${API_BASE}/patient/profile`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          alert('تم حذف الحساب بنجاح.');
          localStorage.clear();
          window.location.href = '/login.html';
        } else {
          const error = await res.json();
          alert(error.message || 'تعذر حذف الحساب.');
        }
      } catch (err) {
        alert('تعذر حذف الحساب.');
      }
    });
  }
});

// Personal Settings Auto-Loader
async function loadPersonalSettings() {
  const form = document.getElementById('personalSettingsForm');
  if (!form) return;
  try {
    const API_BASE = getAPIBase();
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(`${API_BASE}/patient/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('تعذر الحصول على معلومات المستخدم');
    const user = await res.json();
    document.getElementById('fullName').value = user.fullName || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('address').value = user.address || '';
    document.getElementById('mobile').value = user.phone || '';
    document.getElementById('dob').value = (user.dob || user.birthdate || '').slice(0, 10);
    document.getElementById('identityNumber').value = (user.identityNumber && user.identityNumber !== 'null' && user.identityNumber !== '') ? user.identityNumber : 'غير محدد';
  } catch (err) {
    console.error('تعذر تحميل الإعدادات الشخصية:', err);
  }
}

// Personal Settings Edit Mode Logic (Professional UI)
document.addEventListener('DOMContentLoaded', function () {
  const editBtn = document.getElementById('editBtn');
  const saveBtn = document.getElementById('saveBtn');
  const form = document.getElementById('personalSettingsForm');
  const formCard = form ? form.closest('.form-card') : null;
  if (editBtn && saveBtn && form) {
    editBtn.addEventListener('click', function () {
      // Enable all inputs for editing, add visual cues
      form.querySelectorAll('input.personal-input').forEach(input => {
        if (input.id !== 'email') input.removeAttribute('readonly');
        input.classList.add('editing');
      });
      saveBtn.style.display = '';
      editBtn.style.display = 'none';
      if (formCard) formCard.classList.add('edit-mode');
    });
    // On save, restore readonly and button states (actual save logic can be added here)
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const API_BASE = getAPIBase();
      const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
      const data = {
        fullName: document.getElementById('fullName').value,
        address: document.getElementById('address').value,
        phone: document.getElementById('mobile').value,
        birthDate: document.getElementById('dob').value,
        // identityNumber: document.getElementById('identityNumber').value
      };
      fetch(`${API_BASE}/patient/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(result => {
        // Optionally show a success message
      })
      .catch(err => {
        alert('فشل الحفظ: ' + (err.message || err));
      })
      .finally(() => {
        setTimeout(() => {
          form.querySelectorAll('input.personal-input').forEach(input => {
            input.setAttribute('readonly', '');
            input.classList.remove('editing');
          });
          saveBtn.style.display = 'none';
          editBtn.style.display = '';
          if (formCard) formCard.classList.remove('edit-mode');
        }, 100);
      });
    });
  }
});
/**
 * Patient Personal Settings Module
 */

function initializeSettings() {
  console.log('✅ Settings.js initialized');
  // Setup Chat Button
  const chatBtn = document.getElementById('chatBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', (e) => {
      // Don't prevent default or stop propagation - just navigate
      window.location.href = 'chat.html';
    });
  }

  // Setup Profile Dropdown with direct link handlers
  const profileBtn = document.getElementById('profileBtn');
  const profileMenu = document.querySelector('.profile-dropdown .dropdown-menu');
  const logoutBtn = document.getElementById('logoutBtn');

  // Only run dropdown/profile menu logic if both elements exist
  if (profileBtn && profileMenu) {
    // ✅ ADD TOGGLE LISTENER TO PROFILE BUTTON
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.profile-dropdown')) {
        profileMenu.classList.remove('show');
      }
    });

    // Find the profile menu items (now buttons instead of links)
    const profileMenuItems = profileMenu.querySelectorAll('button.profile-menu-item');

    // Attach listeners to the profile menu items
    profileMenuItems.forEach((button) => {
      const action = button.getAttribute('data-action');

      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (action === 'view') {
          showProfileModal('view');
        } else if (action === 'edit') {
          showProfileModal('edit');
        }

        // Close menu after brief delay
        setTimeout(() => {
          profileMenu.classList.remove('show');
        }, 100);

        return false;
      });
    });

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          const API_BASE = getAPIBase();
          const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
          await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          localStorage.removeItem('authToken');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userRole');
          window.location.href = '/login.html';
        } catch (err) {
          console.error('Logout error:', err);
          localStorage.removeItem('authToken');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('token');
          window.location.href = '/login.html';
        }
      });
    }
  }
}

// Personal Settings Auto-Loader
async function loadPersonalSettings() {
  const form = document.getElementById('personalSettingsForm');
  if (!form) return;
  try {
    const API_BASE = getAPIBase();
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(`${API_BASE}/patient/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('تعذر الحصول على معلومات المستخدم');
    const user = await res.json();
    // Map backend fields to form fields
    document.getElementById('fullName').value = user.fullName || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('address').value = user.address || '';
    document.getElementById('mobile').value = user.phone || '';
    document.getElementById('dob').value = (user.dob || user.birthdate || '').slice(0, 10);
  } catch (err) {
    console.error('تعذر تحميل الإعدادات الشخصية:', err);
  }
}

// Initialize immediately if DOM is ready, or wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeSettings();
    loadPersonalSettings();
  });
} else {
  // DOM is already loaded
  initializeSettings();
  loadPersonalSettings();
}

/**
 * Show Profile Modal (View/Edit)
 */
async function showProfileModal(mode) {
  try {
    const API_BASE = getAPIBase();
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    
    if (!token) {
      alert('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
      return;
    }
    // ...existing code...
    // (Remove misplaced code that was inside the if (!token) block)
    // ...existing code...
    // Show saved settings when personal settings button is clicked
    const personalSettingsBtn = document.querySelector('a[href="personal-settings.html"]');
    if (personalSettingsBtn) {
      personalSettingsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'personal-settings.html';
        // Optionally, you can trigger a function here to fetch and display saved settings in the background
        // Example: loadPersonalSettings();
      });
    }
  } catch (err) {
    console.error('Show profile modal error:', err);
  }
}

/**
 * Save Profile Changes
 */
async function saveProfile(userId) {
  try {
    const API_BASE = getAPIBase();
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    
    const data = {
      fullName: document.getElementById('fullName').value,
      phone: document.getElementById('phone').value,
      address: document.getElementById('address').value,
      birthDate: document.getElementById('birthDate').value
    };
    
    const response = await fetch(`${API_BASE}/patient/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || error.error || `Server error: ${response.status}`);
    }
    
    alert('تم تحديث الملف الشخصي بنجاح.');
  } catch (err) {
    console.error('Save profile error:', err);
    alert(`تعذر تحديث الملف الشخصي: ${err.message}`);
  }
}

/**
 * Change Password
 */
async function changePassword(currentPassword, newPassword) {
  try {
    const API_BASE = getAPIBase();
    const token = localStorage.getItem('token');

    if (!token) {
      return { ok: false, message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.' };
    }

    const response = await fetch(`${API_BASE}/patient/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json().catch(() => ({}))
      : await response.text();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
        return { ok: false, message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.' };
      }

      const message = typeof payload === 'string'
        ? (payload.trim().startsWith('<') ? 'أرسل الخادم استجابة غير متوقعة' : payload)
        : (payload.message || payload.error || 'تعذر تغيير كلمة المرور');

      return { ok: false, message };
    }

    return { ok: true };
  } catch (err) {
    console.error('Change password error:', err);
    return { ok: false, message: 'تعذر تغيير كلمة المرور. يرجى المحاولة مرة أخرى.' };
  }
}

/**
 * Create Modal Overlay
 */
function createModalOverlay(id) {
  const modal = document.createElement('div');
  modal.id = id;
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <!-- content will be inserted here -->
    </div>
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease;
      backdrop-filter: blur(2px);
      padding: 20px;
      overflow-y: auto;
    }
    
    .modal-content {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 16px;
      padding: 35px;
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.8);
    }
    
    .modal-content::-webkit-scrollbar {
      width: 8px;
    }
    
    .modal-content::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .modal-content::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 4px;
    }
    
    .modal-content::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
    
    .settings-form h2 {
      margin-bottom: 25px;
      color: #0f172a;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #20caa8 0%, #1ba58f 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #1f2937;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.8;
    }
    
    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 10px 14px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      transition: all 0.3s ease;
      background-color: #ffffff;
      box-sizing: border-box;
    }
    
    .form-group textarea {
      resize: vertical;
      min-height: 80px;
      max-height: 150px;
    }
    
    .form-group input:readonly,
    .form-group textarea:readonly {
      background-color: #f0f9f7;
      color: #1f2937;
      cursor: default;
      border-color: #d1fae5;
    }
    
    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #20caa8;
      box-shadow: 0 0 0 4px rgba(32, 202, 168, 0.15);
      background-color: #ffffff;
    }
    
    .form-actions {
      display: flex;
      gap: 10px;
      margin-top: 30px;
    }
    
    .btn {
      flex: 1;
      padding: 12px 16px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      letter-spacing: 0.3px;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #20caa8 0%, #1ba58f 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(32, 202, 168, 0.4);
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(32, 202, 168, 0.5);
    }
    
    .btn-primary:active {
      transform: translateY(0);
    }
    
    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 2px solid #e5e7eb;
    }
    
    .btn-secondary:hover {
      background: #e5e7eb;
      border-color: #d1d5db;
    }
    
    .error-message {
      color: #dc2626;
      font-size: 13px;
      margin-bottom: 15px;
      padding: 10px 12px;
      background-color: #fee2e2;
      border-radius: 8px;
      border-left: 4px solid #dc2626;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    @media (max-width: 600px) {
      .modal-content {
        max-height: 95vh;
        padding: 25px;
      }
      
      .settings-form h2 {
        font-size: 20px;
        margin-bottom: 20px;
      }
      
      .form-group {
        margin-bottom: 16px;
      }
      
      .form-group input,
      .form-group textarea {
        padding: 9px 12px;
        font-size: 13px;
      }
      
      .btn {
        padding: 10px 12px;
        font-size: 13px;
      }
    }
  `;
  
  document.head.appendChild(style);
  return modal;
}

document.addEventListener('DOMContentLoaded', function () {
  const mobileLabel = document.querySelector('label[for="mobile"]');
  if (mobileLabel) {
    mobileLabel.setAttribute('data-i18n', 'phone');
    mobileLabel.style.fontWeight = '600';
  }
});
