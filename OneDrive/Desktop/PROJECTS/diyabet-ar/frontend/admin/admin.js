const API_BASE = window.API_BASE || 'http://localhost:3001';

// Check authentication
function checkAuth() {
  const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
  const role = localStorage.getItem('userRole');
  
  console.log('🔑 التحقق من الصلاحيات:', { hasToken: !!token, role });
  
  if (!token) {
    console.log('❌ لا يوجد رمز، سيتم التحويل إلى تسجيل الدخول');
    window.location.href = '../login.html';
    return false;
  }
  
  if (role !== 'admin') {
    console.log(`❌ دور غير صحيح: ${role} (المطلوب: admin)`);
    window.location.href = '../login.html';
    return false;
  }
  
  console.log('✅ تم اجتياز التحقق من الصلاحيات');
  return true;
}

// API helper
async function apiCall(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
  console.log(`🔐 استدعاء API: ${method} ${endpoint}`, { hasToken: !!token });
  
  if (!token) {
    console.error('❌ لا يوجد رمز في التخزين المحلي');
    throw new Error('المصادقة مطلوبة. يرجى تسجيل الدخول مجدداً.');
  }
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  if (body) options.body = JSON.stringify(body);
  
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    console.log(`📡 حالة الاستجابة: ${res.status} للمسار ${endpoint}`);
    
    const data = await res.json();
    
    if (!res.ok) {
      console.error(`❌ خطأ في API: ${res.status}`, data);
      if (res.status === 401) {
        // Token expired or invalid, redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('userRole');
        window.location.href = '../login.html';
      }
      throw new Error(data.message || data.error || `Request failed with status ${res.status}`);
    }
    
    console.log(`✅ نجاح: ${endpoint}`, data);
    return data;
  } catch (error) {
    console.error(`🔥 خطأ في الجلب: ${endpoint}`, error);
    throw error;
  }
}

// Tab switching
document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const tab = item.dataset.tab;
    
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    
    // Update active tab
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`${tab}-tab`).classList.add('active');
    
    // Load data
    if (tab === 'doctors') loadDoctors();
    if (tab === 'patients') loadPatients();
    if (tab === 'users') loadUsers();
  });
});

// Doctors Management
let editingDoctorId = null;

document.getElementById('showAddDoctorBtn').addEventListener('click', () => {
  document.getElementById('addDoctorForm').style.display = 'block';
  document.getElementById('doctorForm').reset();
  editingDoctorId = null;
});

document.getElementById('cancelDoctorBtn').addEventListener('click', () => {
  document.getElementById('addDoctorForm').style.display = 'none';
  document.getElementById('doctorForm').reset();
  editingDoctorId = null;
});

document.getElementById('doctorForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const data = {
    fullName: document.getElementById('doctorName').value,
    email: document.getElementById('doctorEmail').value,
    phone: document.getElementById('doctorPhone').value,
    identityNumber: document.getElementById('doctorNationalId').value,
    password: document.getElementById('doctorPassword').value
  };
  
  try {
    if (editingDoctorId) {
      await apiCall(`/admin/doctors/${editingDoctorId}`, 'PUT', data);
      alert('تم تحديث بيانات الطبيب بنجاح');
    } else {
      await apiCall('/admin/doctors', 'POST', data);
      alert('تم إنشاء الطبيب بنجاح');
    }
    
    document.getElementById('addDoctorForm').style.display = 'none';
    document.getElementById('doctorForm').reset();
    editingDoctorId = null;
    loadDoctors();
  } catch (err) {
    alert(err.message);
  }
});

async function loadDoctors() {
  try {
    const { doctors } = await apiCall('/admin/doctors');
    const container = document.getElementById('doctorsList');
    // Filter out demo doctor by email
    const filteredDoctors = doctors.filter(doc => doc.email !== 'daktor@example.com');
    container.innerHTML = filteredDoctors.map(doc => `
      <div class="doctor-card">
        <h4>👨‍⚕️ <span>${doc.fullName || doc.name}</span></h4>
        <p><i class="fas fa-envelope"></i> <span>${doc.email}</span></p>
        <p><i class="fas fa-phone"></i> <span>${doc.phone || 'غير متوفر'}</span></p>
        <div class="actions">
          <button class="btn-warning" onclick="editDoctor('${doc._id}')"><i class="fas fa-edit"></i> <span>تعديل</span></button>
          <button class="btn-danger" onclick="deleteDoctor('${doc._id}')"><i class="fas fa-trash"></i> <span>حذف</span></button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    alert(err.message);
  }
}

async function editDoctor(id) {
  try {
    const { doctors } = await apiCall('/admin/doctors');
    const doctor = doctors.find(d => d._id === id);
    
    if (doctor) {
      document.getElementById('doctorName').value = doctor.fullName || doctor.name || '';
      document.getElementById('doctorEmail').value = doctor.email;
      document.getElementById('doctorPhone').value = doctor.phone || '';
      document.getElementById('doctorNationalId').value = doctor.identityNumber || doctor.nationalId || '';
      document.getElementById('doctorPassword').value = '';
      document.getElementById('addDoctorForm').style.display = 'block';
      editingDoctorId = id;
    }
  } catch (err) {
    alert(err.message);
  }
}

async function deleteDoctor(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الطبيب؟')) return;
  
  try {
    await apiCall(`/admin/doctors/${id}`, 'DELETE');
    alert('تم حذف الطبيب بنجاح');
    loadDoctors();
  } catch (err) {
    alert(err.message);
  }
}

// Patients Management
async function loadPatients() {
  try {
    const { patients } = await apiCall('/admin/patients');
    const { doctors } = await apiCall('/admin/doctors');
    const container = document.getElementById('patientsList');
    // Filter out demo patient by email
    const filteredPatients = patients.filter(patient => patient.email !== 'hasta@example.com');
    container.innerHTML = filteredPatients.map(patient => `
      <div class="patient-card">
        <h4>👤 <span>${patient.fullName}</span></h4>
        <p><i class="fas fa-envelope"></i> <span>${patient.email}</span></p>
        <p><i class="fas fa-phone"></i> <span>${patient.phone || 'غير متوفر'}</span></p>
        <div class="doctor-assignment">
          <label><i class="fas fa-user-md"></i> الطبيب المعالج:</label>
          <select id="doctor-select-${patient._id}" onchange="assignPatient('${patient._id}', this.value)">
            <option value="">-- غير معين --</option>
            ${doctors.map(doc => `
              <option value="${doc._id}" ${patient.assignedDoctor?._id === doc._id ? 'selected' : ''}>
                ${doc.fullName}
              </option>
            `).join('')}
          </select>
        </div>
      </div>
    `).join('');
  } catch (err) {
    alert(err.message);
  }
}

async function assignPatient(patientId, doctorId) {
  try {
    await apiCall('/admin/patient/assign', 'PUT', { patientId, doctorId: doctorId || null });
    alert('تم تحديث تعيين المريض');
    loadPatients();
  } catch (err) {
    alert(err.message);
  }
}

// Users Management
async function loadUsers() {
  try {
    const { users } = await apiCall('/admin/users');
    const container = document.getElementById('usersList');
    // Filter out demo doctor and patient by email
    const filteredUsers = users.filter(user => user.email !== 'daktor@example.com' && user.email !== 'hasta@example.com');
    container.innerHTML = filteredUsers.map(user => `
      <div class="user-card">
        <h4>
          ${user.role === 'admin' ? '👑' : user.role === 'doctor' ? '👨‍⚕️' : '👤'} 
          <span>${user.fullName || user.name}</span>
        </h4>
        <p><i class="fas fa-envelope"></i> <span>${user.email}</span></p>
        <p><i class="fas fa-id-badge"></i> <span>الدور: ${user.role}</span></p>
        <p>
          <i class="fas fa-circle" style="color: ${user.isActive ? '#10b981' : '#ef4444'}; font-size: 10px;"></i> 
          <span>${user.isActive ? 'نشط' : 'غير نشط'}</span>
        </p>
        <div class="actions">
          <button class="btn-warning" onclick="disableUser('${user._id}')"><i class="fas fa-ban"></i> <span>تعطيل</span></button>
          <button class="btn-danger" onclick="deleteUser('${user._id}')"><i class="fas fa-trash"></i> <span>حذف</span></button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    alert(err.message);
  }
}


async function toggleUser(id, isActive) {
  try {
    await apiCall(`/admin/user/${id}`, 'PUT', { isActive });
    alert(`تم ${isActive ? 'تفعيل' : 'تعطيل'} المستخدم`);
    loadUsers();
  } catch (err) {
    alert(err.message);
  }
}

// Pasifleştir (Deactivate) user
async function disableUser(id) {
  await toggleUser(id, false);
}

async function deleteUser(id) {
  if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
  
  try {
    await apiCall(`/admin/user/${id}`, 'DELETE');
    alert('تم حذف المستخدم بنجاح');
    loadUsers();
  } catch (err) {
    alert(err.message);
  }
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('authToken');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('userRole');
  window.location.href = '../login.html';
});

// Mobile Menu Toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.getElementById('sidebar');
let mobileOverlay = null;

if (mobileMenuToggle) {
  mobileMenuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMobileMenu();
  });
}

function toggleMobileMenu() {
  const isOpen = sidebar.classList.contains('mobile-open');
  
  if (isOpen) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
}

function openMobileMenu() {
  sidebar.classList.add('mobile-open');
  mobileMenuToggle.classList.add('active');
  
  // Create overlay
  if (!mobileOverlay) {
    mobileOverlay = document.createElement('div');
    mobileOverlay.className = 'mobile-overlay';
    document.body.appendChild(mobileOverlay);
    
    mobileOverlay.addEventListener('click', closeMobileMenu);
  }
  
  setTimeout(() => {
    mobileOverlay.classList.add('active');
  }, 10);
}

function closeMobileMenu() {
  sidebar.classList.remove('mobile-open');
  mobileMenuToggle.classList.remove('active');
  
  if (mobileOverlay) {
    mobileOverlay.classList.remove('active');
    setTimeout(() => {
      if (mobileOverlay && mobileOverlay.parentNode) {
        mobileOverlay.parentNode.removeChild(mobileOverlay);
        mobileOverlay = null;
      }
    }, 300);
  }
}

// Close mobile menu when clicking nav items
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      closeMobileMenu();
    }
  });
});

// Language switcher logic
// Başlatıcı
if (checkAuth()) {
  loadDoctors();
}
