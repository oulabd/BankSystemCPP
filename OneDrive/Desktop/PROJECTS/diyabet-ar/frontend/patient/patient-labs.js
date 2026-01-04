
class LabsManager {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadLabs();
    this.setupEventListeners();
  }

  async loadLabs() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${window.API_BASE}/patient/labs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('تعذر تحميل المختبرات');

      
      const labs = await res.json();
      this.renderLabs(labs);
    } catch (err) {
      console.error('loadLabs error:', err);
      document.getElementById('labsContainer').innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>تعذر تحميل طلبات المختبر</p>
        </div>
      `;
    }
  }

  renderLabs(labs) {
    const container = document.getElementById('labsContainer');
    
    if (labs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-flask"></i>
        </div>
      `;
      return;
    }
    
    container.innerHTML = labs.map(lab => `
      <div class="lab-card">
        <div class="lab-header">
          <div class="lab-title">
            <div class="lab-icon">
              <i class="fas fa-vial"></i>
            </div>
            <div>
              <h3>🔬 ${lab.testName}</h3>
              <p>تاريخ الطلب: ${new Date(lab.requestedAt).toLocaleDateString('ar-SA')}</p>

            </div>
          </div>
          <span class="status-badge ${lab.status}">${lab.status.toUpperCase()}</span>

        </div>
        
        <div class="lab-details">
          <div class="lab-detail-row">
            <span>مقدم الطلب:</span>
<span>Dr. ${lab.doctor?.fullName || 'غير معروف'}</span>

          </div>
          <div class="lab-detail-row">
            <span>الحالة:</span>
            <span>${lab.status.toUpperCase()}</span>
          </div>
          ${lab.updatedAt ? `
            <div class="lab-detail-row">
              <span>آخر تحديث:</span>
              <span>${new Date(lab.updatedAt).toLocaleDateString('ar-SA')}</span>
            </div>
          ` : ''}
        </div>
        
        ${lab.doctorComment ? `
          <div class="lab-comment">
            <strong>تعليمات الطبيب:</strong><br>
            ${lab.doctorComment}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    });
  }
}

let labsManager;
document.addEventListener('DOMContentLoaded', () => {
  labsManager = new LabsManager();
});



function viewLab(id) {
  // placeholder (if separate endpoint for encrypted file)
  alert('عرض نتيجة المختبر غير متاح بعد.');
}

async function uploadLab(e, id) {
  e.preventDefault();
  const token = localStorage.getItem('token');
  const form = e.target;
  const fd = new FormData(form);
  const res = await fetch(`/api/patient/lab/upload/${id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd
  });
  if (res.ok) location.reload();
  else alert('فشل التحميل');
}
