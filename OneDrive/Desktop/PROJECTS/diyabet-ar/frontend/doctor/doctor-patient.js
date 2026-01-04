
class DoctorPatientDashboard {
  constructor() {
    this.patientId = null;
    this.init();
  }

  getToken() {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  }

  async init() {
    // Get patient ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    this.patientId = urlParams.get('id');
    
    if (!this.patientId) {
      alert('لم يتم العثور على معرف المريض');
      window.location.href = '/doctor/patients.html';
      return;
    }
    
    // Setup tab navigation
    this.setupTabs();
    
    // Load patient info
    await this.loadPatientInfo();
    
    // Load initial section
    await this.loadGlucoseHistory();
    
    // Setup event listeners
    this.setupEventListeners();
  }

  setupTabs() {
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.preventDefault();
        const tab = e.currentTarget.dataset.tab;
        
        // Update active states
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        // Show section
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`${tab}-section`).classList.add('active');
        
        // Load section data
        await this.loadSection(tab);
      });
    });
  }

  async loadSection(tab) {
    switch(tab) {
      case 'glucose':
        await this.loadGlucoseHistory();
        break;
      case 'notes':
        await this.loadNotes();
        break;
      case 'prescriptions':
        await this.loadPrescriptions();
        break;
      case 'labs':
        await this.loadLabs();
        break;
      case 'appointments':
        await this.loadAppointments();
        break;
      case 'timeline':
        await this.loadTimeline();
        break;
    }
  }

  async loadPatientInfo() {
    try {
      const token = this.getToken();
      const res = await fetch(`/api/doctor/patient/${this.patientId}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to load patient');
      
      const data = await res.json();
      document.getElementById('patientName').textContent = data.patient.fullName;
      document.getElementById('patientId').textContent = `ID: ${data.patient.identityNumber}`;
    } catch (err) {
      console.error('loadPatientInfo error:', err);
    }
  }

  async loadGlucoseHistory() {
    try {
      const token = this.getToken();
      const res = await fetch(`/api/doctor/patient/${this.patientId}/records`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to load records');
      
      const records = await res.json();
      this.renderGlucoseTable(records);
    } catch (err) {
      console.error('loadGlucoseHistory error:', err);
    }
  }

  renderGlucoseTable(records) {
    const tbody = document.getElementById('glucoseTableBody');
    
    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="loading">لم يتم العثور على سجل الجلوكوز</td></tr>';
      return;
    }
    
    tbody.innerHTML = records.map(record => {
      let status = 'normal';
      if (record.value >= 300) status = 'critical';
      else if (record.value > 180) status = 'high';
      else if (record.value < 70) status = 'low';
      
      return `
        <tr>
          <td>${new Date(record.date).toLocaleString()}</td>
          <td>${record.value}</td>
          <td><span class="status-badge ${status}">${status.toUpperCase()}</span></td>
          <td>${record.notes || '-'}</td>
        </tr>
      `;
    }).join('');
  }

  async loadNotes() {
    try {
      const token = this.getToken();
      const res = await fetch(`/api/doctor/medical-logs/${this.patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to load notes');
      
      const logs = await res.json();
      this.renderNotes(logs.filter(log => log.type === 'note'));
    } catch (err) {
      console.error('loadNotes error:', err);
    }
  }

  renderNotes(notes) {
    const container = document.getElementById('notesHistory');
    
    if (notes.length === 0) {
      container.innerHTML = '<p class="loading">لم يتم العثور على ملاحظات</p>';
      return;
    }
    
    container.innerHTML = notes.map(note => `
      <div class="note-card">
        <div class="note-header">
          <span class="note-date">${new Date(note.createdAt).toLocaleString()}</span>
        </div>
        <div class="note-text">${note.description}</div>
      </div>
    `).join('');
  }

  async loadPrescriptions() {
    try {
      const token = this.getToken();
      const res = await fetch(`${window.API_BASE}/doctor/prescriptions?patientId=${this.patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to load prescriptions');
      
      const prescriptions = await res.json();
      this.renderPrescriptions(prescriptions);
    } catch (err) {
      console.error('loadPrescriptions error:', err);
    }
  }

  renderPrescriptions(prescriptions) {
    const container = document.getElementById('prescriptionsList');
    
    if (prescriptions.length === 0) {
      container.innerHTML = '<p class="loading">لم يتم العثور على وصفة</p>';
      return;
    }
    
    container.innerHTML = prescriptions.map(prescription => `
      <div class="prescription-card">
        <div class="prescription-header">
          <div class="prescription-title">وصفة #${prescription._id.slice(-6)}</div>
          <div class="prescription-date">${new Date(prescription.createdAt).toLocaleDateString()}</div>
        </div>
        <div class="prescription-items">
          ${prescription.items.map(item => `
            <div class="prescription-item">
              <strong>${item.name}</strong> - ${item.dose} - ${item.frequency}
            </div>
          `).join('')}
        </div>
        ${prescription.notes ? `<p style="margin-top: 12px; color: #6b7280; font-size: 13px;">${prescription.notes}</p>` : ''}
      </div>
    `).join('');
  }

  async loadLabs() {
    try {
      const token = this.getToken();
      const res = await fetch(`/api/labs/patient/${this.patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to load labs');
      
      const data = await res.json();
      const labs = data.labReports || [];
      this.renderLabs(labs);
    } catch (err) {
      console.error('loadLabs error:', err);
      const container = document.getElementById('labsList');
      if (container) {
        container.innerHTML = '<p class="loading">Failed to load lab reports</p>';
      }
    }
  }

  renderLabs(labs) {
    const container = document.getElementById('labsList');
    
    if (!container) return;
    if (!Array.isArray(labs) || labs.length === 0) {
      container.innerHTML = '<p class="loading">لم يتم العثور على نتيجة المختبر</p>';
      return;
    }
    
    container.innerHTML = labs.map(lab => `
      <div class="lab-card">
        <div class="lab-info">
          <h4>${lab.type || lab.testName || 'مختبر'}</h4>
          <p>تم التحميل: ${lab.uploadedAt ? new Date(lab.uploadedAt).toLocaleDateString('ar-SA') : '-'}</p>
          ${lab.doctorComment ? `<p>${lab.doctorComment}</p>` : ''}
          <p><strong>الحالة:</strong> ${lab.status && lab.status !== 'pending' ? lab.status : ''}</p>
        </div>
        <div class="lab-actions">
          <button class="btn-view" onclick="doctorDashboard.viewLab('${lab._id}')">عرض</button>
          <button class="btn-review" onclick="doctorDashboard.reviewLab('${lab._id}')">مراجعة</button>
        </div>
      </div>
    `).join('');
  }

  viewLab(labId) {
    const token = this.getToken();
    window.open(`/api/labs/file/${labId}?token=${token}`, '_blank');
  }

  async reviewLab(labId) {
    const status = prompt('أدخل الحالة (تمت المراجعة / إعادة / متابعة):', 'تمت المراجعة');
    if (!status) return;
    const doctorComment = prompt('تعليق الطبيب (اختياري):', '') || '';

    try {
      const token = this.getToken();
      const res = await fetch(`/api/labs/review/${labId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, doctorComment })
      });
      if (!res.ok) throw new Error('فشلت المراجعة');
      await this.loadLabs();
      alert('تم حفظ المراجعة');
    } catch (err) {
      console.error('reviewLab error:', err);
      alert('فشلت مراجعة المختبر');
    }
  }

  async loadAppointments() {
    try {
      const token = this.getToken();
      const res = await fetch(`/api/doctor/appointments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to load appointments');
      
      const appointments = await res.json();
      this.renderAppointments(appointments.filter(a => a.patient._id === this.patientId));
    } catch (err) {
      console.error('loadAppointments error:', err);
    }
  }

  renderAppointments(appointments) {
    const tbody = document.getElementById('appointmentsTableBody');
    
    if (appointments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="loading">لم يتم العثور على موعد</td></tr>';
      return;
    }
    
    tbody.innerHTML = appointments.map(appointment => `
      <tr>
        <td>${new Date(appointment.date).toLocaleString()}</td>
        <td>${appointment.reason || '-'}</td>
        <td><span class="status-badge ${appointment.status}">${appointment.status.toUpperCase() === 'PENDING' ? 'قيد الانتظار' : appointment.status.toUpperCase() === 'APPROVED' ? 'موافق عليه' : appointment.status.toUpperCase() === 'REJECTED' ? 'مرفوض' : appointment.status.toUpperCase()}</span></td>
        <td>
          ${appointment.status === 'pending' ? `
            <div class="appointment-actions">
              <button class="btn-approve" onclick="doctorDashboard.updateAppointment('${appointment._id}', 'approved')">
                <i class="fas fa-check"></i> موافقة
              </button>
              <button class="btn-reject" onclick="doctorDashboard.updateAppointment('${appointment._id}', 'rejected')">
                <i class="fas fa-times"></i> رفض
              </button>
            </div>
          ` : '-'}
        </td>
      </tr>
    `).join('');
  }

  async loadTimeline() {
    try {
      const token = this.getToken();
      const res = await fetch(`/api/doctor/patient/${this.patientId}/timeline`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to load timeline');
      
      const data = await res.json();
      this.renderTimeline(data.timeline);
    } catch (err) {
      console.error('loadTimeline error:', err);
    }
  }

  renderTimeline(timeline) {
    const container = document.getElementById('timelineContainer');
    
    if (timeline.length === 0) {
      container.innerHTML = '<p class="loading">لم يتم العثور على حدث في الجدول الزمني</p>';
      return;
    }
    
    container.innerHTML = timeline.map(event => `
      <div class="timeline-item">
        <div class="timeline-icon ${event.type}">
          ${event.icon}
        </div>
        <div class="timeline-content">
          <div class="timeline-title">${event.title}</div>
          <div class="timeline-description">${event.description}</div>
          <div class="timeline-date">${new Date(event.timestamp).toLocaleString()}</div>
        </div>
      </div>
    `).join('');
  }

  setupEventListeners() {
    // Note form
    document.getElementById('noteForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.addNote();
    });
    
    // Prescription form
    document.getElementById('prescriptionForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.createPrescription();
    });
    
    // Lab request form
    document.getElementById('labRequestForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.requestLab();
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    });
  }

  async addNote() {
    try {
      const noteText = document.getElementById('noteText').value;
      const token = localStorage.getItem('token');
      
      const res = await fetch('/api/doctor/note', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: this.patientId,
          noteText
        })
      });
      
      if (!res.ok) throw new Error('Failed to add note');
      
      alert('تم حفظ الملاحظة بنجاح!');
      document.getElementById('noteForm').reset();
      await this.loadNotes();
    } catch (err) {
      console.error('addNote error:', err);
      alert('فشل حفظ الملاحظة');
    }
  }

  async createPrescription() {
    try {
      const token = localStorage.getItem('token');
      
      const data = {
        patientId: this.patientId,
        insulinType: document.getElementById('prescriptionName').value,
        dosage: document.getElementById('prescriptionDose').value,
        notes: document.getElementById('prescriptionNotes').value
      };
      
      const res = await fetch('/api/doctor/prescription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) throw new Error('Failed to create prescription');
      
      alert('تم إنشاء الوصفة بنجاح!');
      document.getElementById('prescriptionForm').reset();
      await this.loadPrescriptions();
    } catch (err) {
      console.error('createPrescription error:', err);
      alert('فشل إنشاء الوصفة');
    }
  }

  async requestLab() {
    try {
      const token = localStorage.getItem('token');
      
      const data = {
        patientId: this.patientId,
        testType: document.getElementById('labTestType').value,
        instructions: document.getElementById('labInstructions').value
      };
      
      const res = await fetch('/api/doctor/lab-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) throw new Error('Failed to request lab');
      
      alert('تم طلب فحص المختبر بنجاح!');
      document.getElementById('labRequestForm').reset();
      await this.loadLabs();
    } catch (err) {
      console.error('requestLab error:', err);
      alert('فشل طلب فحص المختبر');
    }
  }

  async updateAppointment(appointmentId, status) {
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`/api/doctor/appointment/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!res.ok) throw new Error('Failed to update appointment');
      
      alert('تم تحديث الموعد بنجاح!');
      await this.loadAppointments();
    } catch (err) {
      console.error('updateAppointment error:', err);
      alert('فشل تحديث الموعد');
    }
  }
}

// Initialize
let doctorDashboard;
document.addEventListener('DOMContentLoaded', () => {
  doctorDashboard = new DoctorPatientDashboard();
});
