// appointments.js
// Patient Appointments Booking page
// - Auth guard: requires authToken and userRole === 'patient'
// - Language selector: saves lang to localStorage and reloads
// - Notifications and profile dropdown toggles
// - Booking form validation (no backend call yet)
// - Upcoming appointments rendering (placeholder) and TODO markers for API

const API_BASE = window.__API_BASE__ || ((location.port && location.port !== '5000') ? `http://${location.hostname}:5000` : '');

// Auth guard
const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
const role = localStorage.getItem('userRole');
if (!token || role !== 'patient') {
  window.location.href = '../login.html';
  throw new Error('unauthorized');
}

document.addEventListener('DOMContentLoaded', () => {
  // Booking form
  const form = document.getElementById('appointment-form');
  if (form) {
    const dateEl = document.getElementById('appointment-date');
    const reasonEl = document.getElementById('appointment-reason');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const date = dateEl.value;
      const reason = reasonEl.value;

      if (!date || !reason) {
        alert('Please fill all fields');
        return;
      }

      try {
        const res = await fetch(API_BASE + '/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ date, reason })
        });
        if (res.ok) {
          alert('Appointment requested successfully');
          form.reset();
          loadAppointments();
        } else {
          alert('Error requesting appointment');
        }
      } catch (err) {
        console.error('Error:', err);
        alert('Error requesting appointment');
      }
    });
  }

  // Appointments list
  const listWrap = document.getElementById('appointments-list');
  const noAppointments = document.getElementById('no-appointments');

  async function loadAppointments() {
    try {
      const res = await fetch(API_BASE + '/api/appointments/my', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const appointments = await res.json();
      renderAppointments(appointments);
    } catch (err) {
      console.error('Error loading appointments:', err);
    }
  }

  function renderAppointments(items) {
    if (!listWrap) return;
    listWrap.innerHTML = '';
    if (!items || items.length === 0) {
      if (noAppointments) noAppointments.style.display = 'block';
      return;
    }
    if (noAppointments) noAppointments.style.display = 'none';

    items.forEach(it => {
      const card = document.createElement('div');
      card.className = 'appointment-card';
      const statusClass = `status-${it.status}`;
      const statusText = t(`appointments.status.${it.status}`);
      card.innerHTML = `
        <div><strong>${t('appointments.date')}:</strong> ${new Date(it.date).toLocaleString()}</div>
        <div><strong>${t('appointments.reason')}:</strong> ${it.reason}</div>
        <div><strong>${t('appointments.status.pending')}:</strong> <span class="${statusClass}">${statusText}</span></div>
        ${it.messageFromDoctor ? `<div><strong>Message:</strong> ${it.messageFromDoctor}</div>` : ''}
        <div style="margin-top:8px">
          ${it.status === 'pending' ? `<button class='action-btn action-cancel' data-id="${it._id}">${t('appointments.cancel')}</button>` : ''}
          ${it.status === 'approved' ? `<button class='action-btn action-print' data-id="${it._id}">${t('appointments.print')}</button>` : ''}
        </div>
      `;
      listWrap.appendChild(card);
    });

    // Add event listeners
    document.querySelectorAll('.action-cancel').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to cancel this appointment?')) {
          try {
            const res = await fetch(API_BASE + `/api/appointments/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
              loadAppointments();
            } else {
              alert('Error canceling appointment');
            }
          } catch (err) {
            console.error('Error:', err);
          }
        }
      });
    });

    document.querySelectorAll('.action-print').forEach(btn => {
      btn.addEventListener('click', () => {
        // TODO: implement print
        alert('Print functionality coming soon');
      });
    });

    applyTranslations();
  }

  // Initial load
  loadAppointments();
});