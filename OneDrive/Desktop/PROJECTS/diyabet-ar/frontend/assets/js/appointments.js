  
  
  // Helper: convert Arabic numerals to Western numerals
    function toWesternNumerals(str) {
      return str.replace(/[\u0660-\u0669]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48))
                .replace(/[\u06F0-\u06F9]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x06F0 + 48));
    }
// appointments.js
// Patient Appointments Booking page
// - Auth guard: requires authToken and userRole === 'patient'
// - Language selector: saves lang to localStorage and reloads
// - Notifications and profile dropdown toggles
// - Booking form validation (no backend call yet)
// - Upcoming appointments rendering (placeholder) and TODO markers for API


let API_BASE = window.API_BASE || window.__API_BASE__ || ((location.port && location.port !== '3000') ? `http://${location.hostname}:3000` : '');
// Normalize API_BASE: if it doesn't end with /api, append it
if (API_BASE && !API_BASE.endsWith('/api')) {
  API_BASE = API_BASE + '/api';
}

document.addEventListener('DOMContentLoaded', () => {
  let linkedDoctorId = null;
    let slotRenderInFlight = false;
    let lastRenderedSlotKey = '';
  // Fetch patient profile to get linked doctorId
  async function fetchDoctorId() {
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
    try {
      const res = await fetch(API_BASE + '/patient/profile', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) return null;
      const data = await res.json();
      // Try doctorId, doctor, or assignedDoctor fields
      linkedDoctorId = data.doctorId || data.doctor || data.assignedDoctor || null;
    } catch (e) { linkedDoctorId = null; }
  }
  // Wait for doctorId to be fetched before enabling slot grid
  let doctorIdReady = false;
  async function ensureDoctorIdAndRenderGrid() {
    await fetchDoctorId();
    doctorIdReady = true;
    if (typeof renderSlotGrid === 'function') renderSlotGrid();
  }
  ensureDoctorIdAndRenderGrid();

  // Auth guard
  const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
  const role = localStorage.getItem('userRole');
  if (!token || role !== 'patient') {
    window.location.href = '../login.html';
    return;
  }
  // Modal elements
  const modal = document.getElementById('request-modal');
  const btnRequest = document.getElementById('btn-request');
  const modalClose = document.getElementById('modal-close');
  const modalCancel = document.getElementById('modal-cancel');
  const form = document.getElementById('appointment-request-form');

  // Open modal
  if (btnRequest) {
    btnRequest.addEventListener('click', () => {
      if (modal) {
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
      }
    });
  }

  // Close modal function
  const closeModal = () => {
    if (modal) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      if (form) form.reset();
    }
  };

  // Close modal on X button
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  // Close modal on Cancel button
  if (modalCancel) {
    modalCancel.addEventListener('click', closeModal);
  }

  // Close modal on outside click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // Booking form submission
  if (form) {

    const dateEl = document.getElementById('requestedDate');
    const timeEl = document.getElementById('requestedTime');
    const noteEl = document.getElementById('note');
    const charCount = document.getElementById('char-count');
    const slotGrid = document.getElementById('slot-grid');

    // Helper: generate all 15-min slots between 09:00 and 16:00
    function generateSlots() {
      const slots = [];
      for (let h = 9; h <= 16; h++) {
        for (let m = 0; m < 60; m += 15) {
          if (h === 16 && m > 0) break;
          const hour = h.toString().padStart(2, '0');
          const min = m.toString().padStart(2, '0');
          slots.push(`${hour}:${min}`);
        }
      }
      return slots;
    }

    // Render slot grid
    async function renderSlotGrid() {
      if (!slotGrid || !dateEl.value || !linkedDoctorId) {
        slotGrid.innerHTML = '<em>يرجى اختيار التاريخ أولاً.</em>';
        return;
      }
      const renderKey = `${dateEl.value}|${linkedDoctorId}`;
      if (slotRenderInFlight || renderKey === lastRenderedSlotKey) {
        return; // avoid duplicate renders that cause flicker
      }
      slotRenderInFlight = true;
      slotGrid.innerHTML = 'جاري التحميل...';
      // Fetch booked slots
      try {
        const res = await fetch(`${API_BASE}/appointments/slots?date=${dateEl.value}&doctorId=${linkedDoctorId}`);
        const data = await res.json();
        const booked = Array.isArray(data.booked) ? data.booked : [];
        const slots = generateSlots();
        let html = '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
        slots.forEach(slot => {
          const isBooked = booked.includes(slot);
          html += `<button type="button" class="slot-btn" data-time="${slot}" style="background:${isBooked ? '#e74c3c':'#27ae60'};color:#fff;border:none;padding:6px 12px;border-radius:5px;cursor:${isBooked?'not-allowed':'pointer'};opacity:${isBooked?'0.6':'1'};">${slot}</button>`;
        });
        html += '</div>';
        slotGrid.innerHTML = html;
        lastRenderedSlotKey = renderKey;
        // Add click listeners
        slotGrid.querySelectorAll('.slot-btn').forEach(btn => {
          if (btn.style.background === 'rgb(39, 174, 96)') { // green
            btn.addEventListener('click', () => {
              timeEl.value = btn.getAttribute('data-time');
              // highlight selected
              slotGrid.querySelectorAll('.slot-btn').forEach(b=>b.style.outline='none');
              btn.style.outline = '2px solid #2980b9';
            });
          }
        });
      } catch (e) {
        slotGrid.innerHTML = '<span style="color:red">تعذر تحميل المواعيد</span>';
      } finally {
        slotRenderInFlight = false;
      }
    }

    // When date changes, update slot grid (only if doctorId is ready)
    if (dateEl) {
      dateEl.addEventListener('change', function() {
        // Convert Arabic numerals to Western numerals in the input
        dateEl.value = toWesternNumerals(dateEl.value);
        if (doctorIdReady) renderSlotGrid();
      });
    }
    // When modal opens, only render slot grid if ready and a date is selected
    if (modal) {
      modal.addEventListener('transitionend', function() {
        if (!modal.classList.contains('hidden')) {
          // Only clear time if modal is being closed
          // Only render slot grid if doctorId is ready and a date is selected
          if (doctorIdReady && dateEl.value) {
            renderSlotGrid();
          } else {
            slotGrid.innerHTML = '<em>يرجى اختيار التاريخ أولاً.</em>';
          }
        } else {
          // Modal is being closed, reset form and slot grid
          timeEl.value = '';
        slotGrid.innerHTML = '<em>يرجى اختيار التاريخ أولاً.</em>';
        }
      });
    }

    // Character counter for note
    if (noteEl && charCount) {
      noteEl.addEventListener('input', () => {
        charCount.textContent = `${noteEl.value.length} / 500`;
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const date = dateEl.value;
      const time = timeEl.value;
      const note = noteEl.value;


      if (!date || !time) {
        alert('يرجى اختيار التاريخ والوقت');
        return;
      }

      // Combine date and time
      const dateTime = `${date}T${time}`;

      const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
      try {
        const res = await fetch(API_BASE + '/patient/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ 
            date: dateTime,
            time: time,
            doctorId: linkedDoctorId,
            reason: note || 'لم يُذكر سبب'
          })
        });
        if (res.ok) {
          alert('تم إرسال طلب الموعد بنجاح');
          closeModal();
          loadAppointments();
        } else {
          const error = await res.json();
          alert(error.message || 'حدث خطأ أثناء طلب الموعد');
        }
      } catch (err) {
        console.error('Error:', err);
        alert('حدث خطأ أثناء طلب الموعد');
      }
    });
  }

  // Appointments list
  const listWrap = document.getElementById('appointments-list');
  const noAppointments = document.getElementById('no-appointments');

  async function loadAppointments() {
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
    try {
      const res = await fetch(API_BASE + '/patient/appointments/my', {
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

    // Separate appointments into upcoming and past
    const now = new Date();
    const upcoming = [];
    const past = [];

    items.forEach(it => {
      const appointmentDate = new Date(it.date);
      if (appointmentDate >= now) {
        upcoming.push(it);
      } else {
        past.push(it);
      }
    });

    // Sort each category by date
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    past.sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first for past

    // Render upcoming appointments
    if (upcoming.length > 0) {
      const upcomingSection = document.createElement('div');
      upcomingSection.className = 'appointments-section';
upcomingSection.innerHTML = `
  <h3 class="section-title">المواعيد القادمة</h3>

`;
      
      upcoming.forEach(it => {
        const card = document.createElement('div');
        card.className = 'appointment-card';
        const statusClass = `status-${it.status}`;
        let statusText = '';
        switch (it.status) {
          case 'pending': statusText = 'قيد الانتظار'; break;
          case 'approved': statusText = 'تمت الموافقة'; break;
          case 'rejected': statusText = 'مرفوض'; break;
          case 'cancelled': statusText = 'أُلغي'; break;
          default: statusText = it.status;
        }
        card.innerHTML = `
          <div><strong>التاريخ:</strong> ${new Date(it.date).toLocaleString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}</div>
          <div><strong>السبب:</strong> ${it.reason || 'لم يُذكر سبب'}</div>
          <div><strong>الحالة:</strong> <span class="${statusClass}">${statusText}</span></div>
          ${it.messageFromDoctor ? `<div><strong>رسالة الطبيب:</strong> ${it.messageFromDoctor}</div>` : ''}
          <div style="margin-top:8px">
            ${it.status === 'pending' ? `<button class='action-btn action-cancel' data-id="${it._id}">إلغاء</button>` : ''}
            ${it.status === 'approved' ? `<button class='action-btn action-print' data-id="${it._id}">طباعة</button>` : ''}
          </div>
        `;
        upcomingSection.appendChild(card);
      });

      listWrap.appendChild(upcomingSection);
    }

    // Render past appointments
    if (past.length > 0) {
      const pastSection = document.createElement('div');
      pastSection.className = 'appointments-section';
      pastSection.innerHTML = `
        <h3 class="section-title">المواعيد السابقة</h3>
`;
      
      past.forEach(it => {
        const card = document.createElement('div');
        card.className = 'appointment-card appointment-card-past';
        const statusClass = `status-${it.status}`;
        let statusText = '';
        switch (it.status) {
          case 'pending': statusText = 'قيد الانتظار'; break;
          case 'approved': statusText = 'تمت الموافقة'; break;
          case 'rejected': statusText = 'مرفوض'; break;
          case 'cancelled': statusText = 'أُلغي'; break;
          default: statusText = it.status;
        }
        card.innerHTML = `
          <div><strong>التاريخ:</strong> ${new Date(it.date).toLocaleString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}</div>
          <div><strong>السبب:</strong> ${it.reason || 'لم يُذكر سبب'}</div>
          <div><strong>الحالة:</strong> <span class="${statusClass}">${statusText}</span></div>
          ${it.messageFromDoctor ? `<div><strong>رسالة الطبيب:</strong> ${it.messageFromDoctor}</div>` : ''}
          <div style="margin-top:8px">
            ${it.status === 'pending' ? `<button class='action-btn action-cancel' data-id="${it._id}">إلغاء</button>` : ''}
            ${it.status === 'approved' ? `<button class='action-btn action-print' data-id="${it._id}">طباعة</button>` : ''}
          </div>
        `;
        pastSection.appendChild(card);
      });

      listWrap.appendChild(pastSection);
    }

    // Add event listeners
    document.querySelectorAll('.action-cancel').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('هل تريد إلغاء الموعد؟')) {


          const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
          try {
            const res = await fetch(API_BASE + `/api/patient/appointments/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
              loadAppointments();
            } else {
              alert('حدث خطأ أثناء إلغاء الموعد');
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
        alert('ميزة الطباعة ستضاف قريباً');


      });
    });

   
  }
  // Initial load
  loadAppointments();

  // Listen for language changes and re-render
  
});