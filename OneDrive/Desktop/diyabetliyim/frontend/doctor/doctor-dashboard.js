// frontend/doctor/doctor-dashboard.js
class DoctorDashboard {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.init();
  }

  init() {
    this.loadNotifications();
    this.loadPatients();
    this.loadLabRequests();
    this.loadAppointments();
    this.bindEvents();
    this.startPolling();
  }

  bindEvents() {
    document.getElementById('notifBtn').onclick = () => this.toggleNotifDropdown();
    document.getElementById('logoutBtn').onclick = () => this.logout();
  }

  async loadPatients() {
    try {
      const response = await fetch('/api/doctor/patients', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const patients = await response.json();
        // Load last messages for each patient
        const patientsWithMessages = await Promise.all(patients.map(async (patient) => {
          try {
            const msgResponse = await fetch(`/api/doctor/chat/${patient._id}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (msgResponse.ok) {
              const msgData = await msgResponse.json();
              const messages = msgData.messages || [];
              const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
              const unreadCount = messages.filter(m => !m.read && m.senderId._id === patient._id).length;
              return { ...patient, lastMessage, unreadCount };
            }
          } catch (err) {
            console.error('Failed to load messages for patient', patient._id, err);
          }
          return { ...patient, lastMessage: null, unreadCount: 0 };
        }));
        this.renderPatients(patientsWithMessages);
        document.getElementById('patientCount').textContent = patients.length;
      }
    } catch (err) {
      console.error('Failed to load patients', err);
    }
  }

  renderPatients(patients) {
    const container = document.getElementById('patientCards');
    container.innerHTML = '';
    if (patients.length === 0) {
      container.innerHTML = '<div class="empty" data-i18n="no_patients">No patients assigned</div>';
      return;
    }
    patients.forEach(patient => {
      const card = document.createElement('div');
      card.className = 'patient-card';
      const statusClass = patient.lastRecord.status === 'critical_high' ? 'critical_high' :
                          patient.lastRecord.status === 'risk_low' ? 'risk_low' :
                          patient.lastRecord.status === 'normal' ? 'normal' : 'none';
      const statusText = patient.lastRecord.status === 'critical_high' ? 'High' :
                         patient.lastRecord.status === 'risk_low' ? 'Low' :
                         patient.lastRecord.status === 'normal' ? 'Normal' : 'No Data';
      const lastValue = patient.lastRecord.value ? `${patient.lastRecord.value} mg/dL` : 'N/A';
      
      const lastMessageText = patient.lastMessage ? 
        (patient.lastMessage.messageText || 'Image') : 'No messages';
      const lastMessageTime = patient.lastMessage ? 
        new Date(patient.lastMessage.createdAt).toLocaleDateString() : '';
      
      card.innerHTML = `
        <h3>${patient.fullName}</h3>
        <p><strong data-i18n="doctor.id">Identity Number:</strong> ${patient.identityNumber}</p>
        <p><strong data-i18n="doctor.phone">Phone:</strong> ${patient.phone}</p>
        <p><strong data-i18n="doctor.last_record">Last Measurement:</strong> ${lastValue}</p>
        <p><strong>Last Message:</strong> ${lastMessageText}</p>
        <p><small>${lastMessageTime}</small></p>
        <span class="status ${statusClass}">${statusText}</span>
        ${patient.unreadCount > 0 ? `<span class="unread-badge">${patient.unreadCount}</span>` : ''}
        <button onclick="doctorDashboard.viewPatient('${patient._id}')" data-i18n="doctor.view_details">View Details</button>
        <button onclick="doctorDashboard.chatWithPatient('${patient._id}')" style="background: #20caa8;">Chat</button>
      `;
      container.appendChild(card);
    });
  }

  async loadLabRequests() {
    try {
      const response = await fetch('/api/doctor/labs', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
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
      const response = await fetch('/api/doctor/appointments', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
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
      container.innerHTML = '<div class="empty">No lab requests</div>';
      return;
    }
    labRequests.forEach(req => {
      const card = document.createElement('div');
      card.className = 'lab-request-card';
      const statusClass = req.status === 'requested' ? 'requested' :
                          req.status === 'uploaded' ? 'uploaded' :
                          req.status === 'reviewed' ? 'reviewed' : '';
      const statusText = req.status === 'requested' ? 'Requested' :
                         req.status === 'uploaded' ? 'Uploaded' :
                         req.status === 'reviewed' ? 'Reviewed' : req.status;
      card.innerHTML = `
        <h3>${req.testName}</h3>
        <p><strong>Patient:</strong> ${req.patientId.fullName}</p>
        <p><strong>Due:</strong> ${req.dueDate ? new Date(req.dueDate).toLocaleDateString() : 'N/A'}</p>
        <span class="status ${statusClass}">${statusText}</span>
        ${req.status === 'uploaded' ? `<button onclick="doctorDashboard.reviewLab('${req._id}')">Review</button>` : ''}
      `;
      container.appendChild(card);
    });
  }

  renderAppointments(appointments) {
    const container = document.getElementById('appointmentsList');
    container.innerHTML = '';
    if (appointments.length === 0) {
      container.innerHTML = '<div class="empty">No appointments</div>';
      return;
    }

    // Group by status
    const grouped = {
      pending: appointments.filter(a => a.status === 'pending'),
      approved: appointments.filter(a => a.status === 'approved'),
      rejected: appointments.filter(a => a.status === 'rejected'),
      rescheduled: appointments.filter(a => a.status === 'rescheduled')
    };

    Object.keys(grouped).forEach(status => {
      if (grouped[status].length > 0) {
        const section = document.createElement('div');
        section.className = 'appointment-section';
        section.innerHTML = `<h3>${status.charAt(0).toUpperCase() + status.slice(1)} Appointments</h3>`;
        grouped[status].forEach(app => {
          const card = document.createElement('div');
          card.className = 'appointment-card';
          card.innerHTML = `
            <h4>${app.patient.fullName}</h4>
            <p><strong>Date:</strong> ${new Date(app.date).toLocaleString()}</p>
            <p><strong>Reason:</strong> ${app.reason}</p>
            ${app.messageFromDoctor ? `<p><strong>Message:</strong> ${app.messageFromDoctor}</p>` : ''}
            <div class="actions">
              ${status === 'pending' ? `
                <button onclick="doctorDashboard.approveAppointment('${app._id}')">Approve</button>
                <button onclick="doctorDashboard.rejectAppointment('${app._id}')">Reject</button>
              ` : ''}
              <button onclick="doctorDashboard.rescheduleAppointment('${app._id}')">Reschedule</button>
              <button onclick="doctorDashboard.viewPatient('${app.patient._id}')">View Patient</button>
            </div>
          `;
          section.appendChild(card);
        });
        container.appendChild(section);
      }
    });
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
      dropdown.innerHTML = '<div class="empty" data-i18n="notif.empty">No notifications</div>';
      return;
    }
    this.notifications.forEach(notif => {
      const item = document.createElement('div');
      item.className = `notif-item ${notif.read ? '' : 'unread'}`;
      item.innerHTML = `
        <div class="notif-message">${notif.message}</div>
        <div class="notif-meta">${new Date(notif.createdAt).toLocaleString()}</div>
        <div class="notif-actions">
          <button onclick="doctorDashboard.markAsRead('${notif._id}')" data-i18n="notif.mark_read">Mark as read</button>
          <button onclick="doctorDashboard.viewRecord('${notif.relatedId}')" data-i18n="notif.view">View</button>
          <button onclick="doctorDashboard.deleteNotif('${notif._id}')" data-i18n="delete">Delete</button>
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
      await fetch(`/api/notifications/read/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
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
    const newDate = prompt('Enter new date and time (YYYY-MM-DDTHH:MM):');
    const message = prompt('Enter message for patient:');
    if (newDate) {
      await this.updateAppointmentStatus(id, 'rescheduled', message, newDate);
    }
  }

  async updateAppointmentStatus(id, status, message = '', newDate = '') {
    try {
      const body = { status };
      if (message) body.messageFromDoctor = message;
      if (newDate) body.newDate = newDate;
      const response = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        this.loadAppointments();
      } else {
        alert('Error updating appointment');
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
    }
  }

  async deleteNotif(id) {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      this.loadNotifications();
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  }

  logout() {
    localStorage.clear();
    window.location.href = '/login.html';
  }

  startPolling() {
    setInterval(() => this.loadNotifications(), 10000);
  }
}

const doctorDashboard = new DoctorDashboard();