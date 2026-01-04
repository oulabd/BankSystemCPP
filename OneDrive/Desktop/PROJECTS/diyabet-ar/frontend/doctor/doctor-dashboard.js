// --- Mock/demo data and render functions removed: only real patients will be shown. ---

// Modal logic for virtual patient details
window.openVirtualPatientModal = function(idx) {
  const p = MOCK_PATIENTS[idx];
  // Store mock patient data in localStorage for demo page
  localStorage.setItem('demoPatient', JSON.stringify(p));
  localStorage.setItem('demoPatientNotes', JSON.stringify(MOCK_DOCTOR_NOTES.filter(n => n.patient === p.fullName)));
  localStorage.setItem('demoPatientLabs', JSON.stringify(MOCK_PATIENT_LABS.filter(l => l.patient === p.fullName)));
  // Redirect to demo doctor-patient page (create if needed)
  window.location.href = '/doctor/doctor-patient.html?demo=1';
}
document.addEventListener('DOMContentLoaded', function() {
  const closeBtn = document.getElementById('closeVirtualModal');
  if (closeBtn) closeBtn.onclick = function() {
    document.getElementById('virtualPatientModal').style.display = 'none';
  };
  // No demo patients: do nothing here, DoctorDashboard will load real patients
});

function renderMockPatientLabs() {
  const area = document.getElementById('labOverviewArea') || document.body;
  area.innerHTML = '<h3>Laboratuvar Özeti (Demo)</h3>' +
    MOCK_PATIENT_LABS.map(lab => `
      <div class="lab-row">
        <strong>${lab.patient}:</strong> ${lab.test} – ${lab.value} ${lab.unit} (${lab.date}) 
        <span class="lab-status">${lab.status === 'high' ? 'مرتفع' : 'طبيعي'}</span>
      </div>
    `).join('');
}

function renderMockDoctorNotes() {
  const area = document.getElementById('doctorNotesArea') || document.body;
  area.innerHTML = '<h3>ملاحظات الطبيب (تجريبي)</h3>' +
    MOCK_DOCTOR_NOTES.map(note => `
      <div class="doctor-note-row">
        <strong>${note.patient}:</strong> "${note.note}" <span class="note-date">${note.date}</span>
      </div>
    `).join('');
}

// Instruction modal logic
function openInstructionModal() {
  document.getElementById('instructionModal').style.display = 'flex';
}
function closeInstructionModal() {
  document.getElementById('instructionModal').style.display = 'none';
}
function saveInstruction() {
  const text = document.getElementById('instructionText').value.trim();
  if (!text) {
    alert('الرجاء إدخال تعليمات.');
    return;
  }
  // Placeholder: Show instruction below the button
  let container = document.getElementById('instructionDisplay');
  if (!container) {
    container = document.createElement('div');
    container.id = 'instructionDisplay';
    container.className = 'instruction-display';
    document.querySelector('.dashboard-unified-card').insertBefore(container, document.querySelector('.dashboard-card-content'));
  }
  container.innerHTML = `<div class="instruction-box"><strong>التعليمات:</strong> ${text}</div>`;
  closeInstructionModal();
}
// frontend/doctor/doctor-dashboard.js

// Suppress extension-related errors
window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('message channel closed')) {
    e.preventDefault();
    return true;
  }
});



class DoctorDashboard {
  constructor() {
    this.init();
  }

  init() {
    this.loadPatients();
    this.loadLabRequests();
    this.loadAppointments();
    this.bindEvents();
  }

  bindEvents() {
    // Dil simgesi ve açılır menü kaldırıldı
  }

  async loadPatients() {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${window.API_BASE}/doctor/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let patients = [];
      if (response.ok) {
        patients = await response.json();
        if (patients.length === 0) {
          this.renderPatients([]);
          return;
        }
        const patientsWithMessages = await Promise.all(patients.map(async (patient) => {
          try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const msgResponse = await fetch(`${window.API_BASE}/doctor/chat/${patient._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (msgResponse.ok) {
              const msgData = await msgResponse.json();
              const messages = msgData.messages || [];
              const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
              const unreadCount = messages.filter(m => !m.read && m.senderId && m.senderId._id === patient._id).length;
              return { ...patient, lastMessage, unreadCount };
            }
          } catch (err) {
            console.error('Failed to load messages for patient', patient._id, err);
          }
          return { ...patient, lastMessage: null, unreadCount: 0 };
        }));
        this.renderPatients(patientsWithMessages);
        document.getElementById('patientCount').textContent = patients.length;
        const headerPatientCount = document.getElementById('headerPatientCount');
        if (headerPatientCount) headerPatientCount.textContent = patients.length;
      } else {
        // API error (401, 404, etc): show empty
        this.renderPatients([]);
      }
    } catch (err) {
      console.error('Failed to load patients', err);
      this.renderPatients([]);
    }
  }

  renderPatients(patients) {
    const container = document.getElementById('patientCards');
    container.innerHTML = '';
    if (!patients || patients.length === 0) {
      container.innerHTML = '<div class="empty">لم يتم العثور على مرضى مسجلين.</div>';
      return;
    }
    patients.forEach(patient => {
      const card = document.createElement('div');
      card.className = 'patient-card';
      // ...existing code...
      const lastRecord = patient.lastRecord || {};
      const statusClass = lastRecord.status === 'critical_high' ? 'critical_high' :
                          lastRecord.status === 'risk_low' ? 'risk_low' :
                          lastRecord.status === 'normal' ? 'normal' : 'none';
      const statusText = lastRecord.status === 'critical_high' ? 'Yüksek' :
                         lastRecord.status === 'risk_low' ? 'منخفض' :
                         lastRecord.status === 'normal' ? 'طبيعي' : 'لا توجد بيانات';
      const lastValue = lastRecord.value ? `${lastRecord.value} mg/dL` : 'لا يوجد';
      const lastMessageText = patient.lastMessage ? 
        (patient.lastMessage.messageText || 'صورة') : 'لا توجد رسائل';
      const lastMessageTime = patient.lastMessage ? 
        new Date(patient.lastMessage.createdAt).toLocaleDateString('ar-SA') : '';
      // Show placeholder if missing
      const kimlik = patient.identityNumber && patient.identityNumber !== 'null' && patient.identityNumber !== '' ? patient.identityNumber : 'غير محدد';
      const phone = patient.phone && patient.phone !== 'null' && patient.phone !== '' ? patient.phone : 'غير محدد';
      card.innerHTML = `
        <h3>${patient.fullName}</h3>
        <p><strong>رقم الهوية:</strong> ${kimlik}</p>
        <p><strong>الهاتف:</strong> ${phone}</p>
        <p><strong>آخر قياس:</strong> ${lastValue}</p>
        <p><strong>آخر رسالة:</strong> ${lastMessageText}</p>
        <p><small>${lastMessageTime}</small></p>
        <span class="status ${statusClass}">${statusText}</span>
        ${patient.unreadCount > 0 ? `<span class="unread-badge">${patient.unreadCount}</span>` : ''}
        <button onclick="doctorDashboard.viewPatient('${patient._id}')">عرض التفاصيل</button>
        <button onclick="doctorDashboard.chatWithPatient('${patient._id}')" style="background: #20caa8;">محادثة</button>
      `;
      container.appendChild(card);
    });
  }

  async loadLabRequests() {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${window.API_BASE}/doctor/labs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const labRequests = await response.json();
        this.renderLabRequests(labRequests);
      }
    } catch (err) {
      console.error('Failed to load lab requests', err);
    }
  }

  async loadAppointments() {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${window.API_BASE}/doctor/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const appointments = await response.json();
        this.renderAppointments(appointments);
      }
    } catch (err) {
      console.error('Failed to load appointments', err);
    }
  }

  renderLabRequests(labRequests) {
    const container = document.getElementById('labRequestsList');
    container.innerHTML = '';
    if (labRequests.length === 0) {
      container.innerHTML = '<div class="empty">لا توجد طلبات مختبر</div>';
      return;
    }
    // Mapping for Turkish display names
    const testNameMap = {
      bloodGlucose: 'سكر الدم',
      hba1c: 'HbA1c',
      lipidProfile: 'فحص الدهون',
      kidneyFunction: 'وظائف الكلى',
      liverFunction: 'وظائف الكبد',
      thyroid: 'الغدة الدرقية',
      urineAnalysis: 'تحليل البول'
    };
    labRequests.forEach(req => {
      const card = document.createElement('div');
      card.className = 'lab-request-card';
      const statusClass = req.status === 'requested' ? 'requested' :
                          req.status === 'uploaded' ? 'uploaded' :
                          req.status === 'reviewed' ? 'reviewed' : '';
      const statusText = req.status === 'requested' ? 'طُلب' :
                         req.status === 'uploaded' ? 'تم الرفع' :
                         req.status === 'reviewed' ? 'تمت المراجعة' : req.status;
      // Use first test in array for display
      const testKey = Array.isArray(req.tests) && req.tests.length > 0 ? req.tests[0] : undefined;
      const testDisplay = testKey ? (testNameMap[testKey] || testKey) : 'غير معرف';
      card.innerHTML = `
        <h3>${testDisplay}</h3>
        <p><strong>المريض:</strong> ${req.patientId?.fullName || 'غير معروف'}</p>
        <span class="status ${statusClass}">${statusText}</span>
        ${req.status === 'uploaded' ? `<button onclick="doctorDashboard.reviewLab('${req._id}')">مراجعة</button>` : ''}
        <button class="delete-lab-request-btn" data-id="${req._id}" style="margin-top:8px;color:#fff;background:#e74c3c;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:600;">حذف</button>
      `;
      container.appendChild(card);
    });
    // Add event listeners for delete buttons
    container.querySelectorAll('.delete-lab-request-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        if (id) this.deleteLabRequest(id);
      });
    });
  }

  async deleteLabRequest(id) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف طلب المختبر هذا؟')) return;
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    try {
      const response = await fetch(`/api/doctor/labs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        alert('تم حذف طلب المختبر.');
        this.loadLabRequests();
      } else {
        alert('فشلت عملية الحذف.');
      }
    } catch (err) {
      alert('حدث خطأ أثناء الحذف.');
    }
  }

  renderAppointments(appointments) {
    const container = document.getElementById('appointmentsList');
    container.innerHTML = '';

    // Split appointments into upcoming and past
    const now = new Date();
    const upcomingAppts = appointments.filter(app => {
      const date = new Date(app.date || app.requestedDate);
      return date >= now;
    });
    const pastAppts = appointments.filter(app => {
      const date = new Date(app.date || app.requestedDate);
      return date < now;
    });

    // Group by status
    const groupByStatus = (arr) => {
      return {
        pending: arr.filter(a => a.status === 'pending'),
        approved: arr.filter(a => a.status === 'approved'),
        rejected: arr.filter(a => a.status === 'rejected'),
        rescheduled: arr.filter(a => a.status === 'rescheduled')
      };
    };
    const upcomingGrouped = groupByStatus(upcomingAppts);
    const pastGrouped = groupByStatus(pastAppts);

    // Yaklaşan randevuları göster
    if (upcomingAppts.length > 0) {
      const upcomingSection = document.createElement('div');
      upcomingSection.className = 'appointments-category';
      upcomingSection.innerHTML = `<h3 class="category-title upcoming">المواعيد القادمة</h3>`;
      Object.keys(upcomingGrouped).forEach(status => {
        if (upcomingGrouped[status].length > 0) {
          const section = document.createElement('div');
          section.className = 'appointment-section';
          const statusLabel = status === 'pending' ? 'قيد الانتظار' :
                              status === 'approved' ? 'مقبول' :
                              status === 'rejected' ? 'مرفوض' :
                              status === 'rescheduled' ? 'أعيد جدولته' : status;
          section.innerHTML = `<h4>${statusLabel}</h4>`;
          upcomingGrouped[status].forEach(app => {
            const card = document.createElement('div');
            card.className = 'appointment-card';
            const patientName = app.patientId?.fullName || 'مريض غير معروف';
            const appointmentDate = new Date(app.date || app.requestedDate).toLocaleString('ar-SA');
            const reason = app.notes || app.reason || 'لم يتم ذكر السبب';
            card.innerHTML = `
              <h5>${patientName}</h5>
              <p><strong>التاريخ:</strong> ${appointmentDate}</p>
              <p><strong>الوقت:</strong> ${app.time || 'لا يوجد'}</p>
              <p><strong>السبب:</strong> ${reason}</p>
              ${app.messageFromDoctor ? `<p><strong>رسالة:</strong> ${app.messageFromDoctor}</p>` : ''}
              <div class="actions">
                ${status === 'pending' ? `
                  <button onclick="doctorDashboard.approveAppointment('${app._id}')">موافقة</button>
                  <button onclick="doctorDashboard.rejectAppointment('${app._id}')">رفض</button>
                ` : ''}
                <button onclick="doctorDashboard.rescheduleAppointment('${app._id}')">إعادة الجدولة</button>
                <button onclick="doctorDashboard.viewPatient('${app.patientId?._id || ''}')">عرض المريض</button>
              </div>
            `;
            section.appendChild(card);
          });
          upcomingSection.appendChild(section);
        }
      });
      container.appendChild(upcomingSection);
    }

    // Geçmiş randevuları göster
    if (pastAppts.length > 0) {
      const pastSection = document.createElement('div');
      pastSection.className = 'appointments-category';
      pastSection.innerHTML = `<h3 class="category-title past">المواعيد السابقة</h3>`;
      
      // Geçmişi statüye göre gruplandır
      const pastGrouped = {
        pending: pastAppts.filter(a => a.status === 'pending'),
        approved: pastAppts.filter(a => a.status === 'approved'),
        rejected: pastAppts.filter(a => a.status === 'rejected'),
        rescheduled: pastAppts.filter(a => a.status === 'rescheduled')
      };

      Object.keys(pastGrouped).forEach(status => {
        if (pastGrouped[status].length > 0) {
          const section = document.createElement('div');
          section.className = 'appointment-section';
          const statusLabel = status === 'pending' ? 'قيد الانتظار' :
                              status === 'approved' ? 'مقبول' :
                              status === 'rejected' ? 'مرفوض' :
                              status === 'rescheduled' ? 'أعيد جدولته' : status;
          section.innerHTML = `<h4>${statusLabel}</h4>`;
          pastGrouped[status].forEach(app => {
            const card = document.createElement('div');
            card.className = 'appointment-card appointment-card-past';
            const patientName = app.patientId?.fullName || 'مريض غير معروف';
            const appointmentDate = new Date(app.date || app.requestedDate).toLocaleString('ar-SA');
            const reason = app.notes || app.reason || 'لم يتم ذكر السبب';
            
            card.innerHTML = `
              <h5>${patientName}</h5>
              <p><strong>التاريخ:</strong> ${appointmentDate}</p>
              <p><strong>الوقت:</strong> ${app.time || 'لا يوجد'}</p>
              <p><strong>السبب:</strong> ${reason}</p>
              ${app.messageFromDoctor ? `<p><strong>رسالة:</strong> ${app.messageFromDoctor}</p>` : ''}
              <div class="actions">
                ${status === 'pending' ? `
                  <button onclick="doctorDashboard.approveAppointment('${app._id}')">موافقة</button>
                  <button onclick="doctorDashboard.rejectAppointment('${app._id}')">رفض</button>
                ` : ''}
                <button onclick="doctorDashboard.rescheduleAppointment('${app._id}')">إعادة الجدولة</button>
                <button onclick="doctorDashboard.viewPatient('${app.patientId?._id || ''}')">عرض المريض</button>
              </div>
            `;
            section.appendChild(card);
          });
          pastSection.appendChild(section);
        }
      });
      container.appendChild(pastSection);
    }
  }

  updateBadge() {
    const btn = document.getElementById('notifBtn');
    let badge = btn.querySelector('.notif-badge');
    if (this.unreadCount > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'notif-badge';
        btn.appendChild(badge);
      }
      badge.textContent = this.unreadCount;
    } else if (badge) {
      badge.remove();
    }
  }

  renderNotifications() {
    const dropdown = document.getElementById('notifDropdown');
    dropdown.innerHTML = '';
    if (this.notifications.length === 0) {
      dropdown.innerHTML = '<div class="empty">لا توجد إشعارات</div>';
      return;
    }
    this.notifications.forEach(notif => {
      const item = document.createElement('div');
      item.className = `notif-item ${notif.read ? '' : 'unread'}`;
      item.innerHTML = `
        <div class="notif-message">${notif.message}</div>
        <div class="notif-meta">${new Date(notif.createdAt).toLocaleString()}</div>
        <div class="notif-actions">
          <button onclick="doctorDashboard.markAsRead('${notif._id}')">تمت قراءته</button>
          <button onclick="doctorDashboard.viewRecord('${notif.relatedId}')">عرض</button>
          <button onclick="doctorDashboard.deleteNotif('${notif._id}')">حذف</button>
        </div>
      `;
      dropdown.appendChild(item);
    });
  }

  toggleNotifDropdown() {
    const dropdown = document.getElementById('notifDropdown');
    dropdown.classList.toggle('show');
  }

  async markAsRead(id) {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      await fetch(`/api/notifications/read/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      this.loadNotifications();
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  }

  viewPatient(patientId) {
    window.location.href = `doctor-patient-details.html?patientId=${patientId}`;
  }

  chatWithPatient(patientId) {
    window.location.href = `chat.html?patientId=${patientId}`;
  }

  reviewLab(labId) {
    window.location.href = `lab-review.html?labId=${labId}`;
  }

  async approveAppointment(id) {
    await this.updateAppointmentStatus(id, 'approved');
  }

  async rejectAppointment(id) {
    await this.updateAppointmentStatus(id, 'rejected');
  }

  async rescheduleAppointment(id) {
    const newDate = prompt('أدخل التاريخ والوقت الجديدين (YYYY-MM-DDTHH:MM):');
    const message = prompt('أدخل رسالة للمريض:');
    if (newDate) {
      await this.updateAppointmentStatus(id, 'rescheduled', message, newDate);
    }
  }

  async updateAppointmentStatus(id, status, message = '', newDate = '') {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const body = { status };
      if (message) body.messageFromDoctor = message;
      if (newDate) body.newDate = newDate;
      const response = await fetch(`/api/patient/appointments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        this.loadAppointments();
      } else {
        alert('حدث خطأ أثناء تحديث الموعد');
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
    }
  }



  logout() {
    localStorage.clear();
    window.location.href = '/login.html';
  }


}

window.doctorDashboard = new DoctorDashboard();
window.logout = () => window.doctorDashboard.logout();