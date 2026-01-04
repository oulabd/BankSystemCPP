
// prescriptions.js
// Auth guard: require patient
const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
const role = localStorage.getItem('userRole');
const API_BASE = window.API_BASE || '/api';
if (!token || role !== 'patient') {
  window.location.href = '../login.html';
  throw new Error('unauthorized');
}

document.addEventListener('DOMContentLoaded', () => {
  // Load insulin adjustments
  loadInsulin();
  // Load electronic prescriptions
  loadPrescriptions();

  const insulinCard = document.getElementById('insulin-prescription') || document.getElementById('insulin-card');
  const sensorCard = document.getElementById('sensor-prescription') || document.getElementById('sensor-card');

  const insulinType = document.getElementById('insulin-type');
  const insulinDose = document.getElementById('insulin-dose');
  const insulinReason = document.getElementById('insulin-reason');
  const insulinDate = document.getElementById('insulin-date');
  const insulinNotes = document.getElementById('insulin-notes');

  const sensorType = document.getElementById('sensor-type');
  const sensorDate = document.getElementById('sensor-date');
  const sensorWarn = document.getElementById('sensor-warn');

  const printInsBtn = document.getElementById('print-insulin');
  const printSensorBtn = document.getElementById('print-sensor');
  const requestInsBtn = document.getElementById('request-insulin');
  const requestSensorBtn = document.getElementById('request-sensor');

  // Optional legacy controls (guarded)
  const insulinViewBtn = document.getElementById('insulin-view');
  const sensorViewBtn = document.getElementById('sensor-view');
  const toggleHistory = document.getElementById('toggle-history');
  const historyPanel = document.getElementById('insulin-history');
  const historyList = document.getElementById('history-list');
  const downloadAll = document.getElementById('download-all');
  const printAll = document.getElementById('print-all');

  async function loadInsulin() {
    try {
      const response = await fetch(`${API_BASE}/patient/insulin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      renderInsulin(data.current, data.history);
    } catch (err) {
      console.error('Failed to load insulin', err);
    }
  }

  async function loadPrescriptions() {
    try {
      const response = await fetch(`${API_BASE}/patient/prescriptions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      renderPrescriptions(data.prescriptions);
    } catch (err) {
      console.error('Failed to load prescriptions', err);
    }
  }

  function renderInsulin(current, history) {
    if (current) {
      if (insulinType) insulinType.textContent = current.type;
      if (insulinDose) insulinDose.textContent = current.dose;
      if (insulinReason) insulinReason.textContent = current.reason;
      if (insulinDate) insulinDate.textContent = new Date(current.createdAt).toLocaleDateString('ar-SA');
      if (insulinNotes) insulinNotes.textContent = current.notes || '';
    } else {
      if (insulinType) insulinType.textContent = '---';
      if (insulinDose) insulinDose.textContent = '---';
      if (insulinReason) insulinReason.textContent = '---';
      if (insulinDate) insulinDate.textContent = '---';
      if (insulinNotes) insulinNotes.textContent = '---';
    }

    if (historyList) {
      historyList.innerHTML = '';
      history.forEach(adj => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
          <div><strong>${adj.type}</strong> - ${adj.dose} وحدات</div>
          <div>السبب: ${adj.reason}</div>
          <div>التاريخ: ${new Date(adj.createdAt).toLocaleDateString('ar-SA')}</div>
          <div>ملاحظات: ${adj.notes || ''}</div>
        `;
        historyList.appendChild(item);
      });
    }
  }

  function renderPrescriptions(prescriptions) {
    const list = document.getElementById('prescription-list');
    list.innerHTML = '';
    if (!prescriptions || prescriptions.length === 0) {
      list.innerHTML = '<p>لا توجد وصفات</p>';
      return;
    }
    prescriptions.forEach(presc => {
      const card = document.createElement('div');
      card.className = 'prescription-card';
      card.innerHTML = `
        <div class="prescription-header">
          <h3>💊 ${presc.name}</h3>
          <span class="type">${presc.type}</span>
        </div>
        <div class="prescription-body">
          <div class="row">
            <span class="label">الجرعة:</span>
            <span class="value">${presc.dose}</span>
          </div>
          <div class="row">
            <span class="label">التكرار:</span>
            <span class="value">${presc.frequency}</span>
          </div>
          <div class="row">
            <span class="label">المدة:</span>
            <span class="value">${presc.duration}</span>
          </div>
          <div class="row">
            <span class="label">الملاحظات:</span>
            <span class="value">${presc.notes || 'لا يوجد'}</span>
          </div>
        </div>
        <div class="prescription-actions">
          <button onclick="printPrescription('${presc._id}')" class="btn btn-primary">طباعة PDF</button>
          <button onclick="requestRenewal('${presc._id}')" class="btn btn-outline">طلب تجديد</button>
        </div>
      `;
      list.appendChild(card);
    });
  }

  window.printPrescription = function(id) {
    // Find the prescription card and print it
    const cards = document.querySelectorAll('.prescription-card');
    cards.forEach(card => {
      if (card.querySelector('button[onclick*="printPrescription(\'' + id + '\')"]')) {
        card.classList.add('print-target');
        window.print();
        card.classList.remove('print-target');
      }
    });
  };

  window.requestRenewal = async function(id) {
    try {
      const response = await fetch(`${API_BASE}/patient/prescriptions/renew/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert('تم إرسال طلب التجديد بنجاح');
      } else {
        alert('تعذر إرسال طلب التجديد');
      }
    } catch (err) {
      console.error('خطأ في طلب التجديد', err);
      alert('حدث خطأ في طلب التجديد');
    }
  };

  function daysUntil(dateStr){
    if (!dateStr) return Infinity;
    const now = new Date();
    const d = new Date(dateStr + 'T00:00:00');
    const diff = Math.ceil((d - now) / (1000*60*60*24));
    return diff;
  }

  function renderActive(pres){
    if (pres && pres.insulin) {
      if (insulinType) insulinType.textContent = pres.insulin.type || '';
      if (insulinDose) insulinDose.textContent = pres.insulin.dose != null ? String(pres.insulin.dose) : '';
      if (insulinDate) insulinDate.textContent = pres.insulin.date || (pres.insulin.start || '') || '';
      const end = pres.insulin.end || pres.insulin.date || null;
      const days = daysUntil(end);
      if (insulinWarn) insulinWarn.hidden = !(days <= 5);
    } else {
      if (insulinType) insulinType.textContent = '';
      if (insulinDose) insulinDose.textContent = '';
      if (insulinDate) insulinDate.textContent = '';
      if (insulinWarn) insulinWarn.hidden = true;
    }

    // Sensor
    if (pres && pres.sensor) {
      if (sensorType) sensorType.textContent = pres.sensor.type || '';
      if (sensorDate) sensorDate.textContent = pres.sensor.date || (pres.sensor.start || '') || '';
      const end = pres.sensor.end || pres.sensor.date || null;
      const days = daysUntil(end);
      if (sensorWarn) sensorWarn.hidden = !(days <= 5);
    } else {
      if (sensorType) sensorType.textContent = '';
      if (sensorDate) sensorDate.textContent = '';
      if (sensorWarn) sensorWarn.hidden = true;
    }
  }

  function renderHistory(items){
    historyList.innerHTML = '';
    if (!items || !items.length){
      historyList.innerHTML = `<div class="no-appointments">لا توجد وصفات سابقة</div>`;
      return;
    }
    items.forEach(it => {
      const el = document.createElement('div');
      el.className = 'history-item';
      const meta = document.createElement('div'); meta.className = 'history-meta';
      const title = document.createElement('div'); title.textContent = `${it.kind} — ${it.type}`;
      const range = document.createElement('div'); range.textContent = `${it.start} → ${it.end}`;
      meta.appendChild(title); meta.appendChild(range);

      const controls = document.createElement('div');
      const status = document.createElement('div'); status.className = 'status ' + (it.status || '');
      status.textContent = it.status === 'active' ? 'سارية' : it.status === 'expired' ? 'منتهية' : it.status;
      const btnDl = document.createElement('button'); btnDl.className = 'btn btn-outline';
      btnDl.textContent = 'تنزيل PDF';
      btnDl.addEventListener('click', ()=>{
        console.log('PDF indirilecek', it.id);
        // TODO: GET file (PDF) → /api/patient/prescriptions/:id/download
      });
      const btnPrint = document.createElement('button'); btnPrint.className = 'btn btn-primary';
      btnPrint.textContent = 'طباعة';
      btnPrint.addEventListener('click', ()=>{
        // TODO: Print button → print only card container
        window.print();
      });
      controls.appendChild(status); controls.appendChild(btnDl); controls.appendChild(btnPrint);

      el.appendChild(meta); el.appendChild(controls);
      historyList.appendChild(el);
    });
  }

  // Wire print buttons using print-target so only card prints
  function doPrintFor(cardEl) {
    if (!cardEl) return;
    cardEl.classList.add('print-target');
    const removePrint = () => { cardEl.classList.remove('print-target'); window.removeEventListener('afterprint', removePrint); };
    requestAnimationFrame(() => {
      window.print();
      window.addEventListener('afterprint', removePrint);
      setTimeout(removePrint, 1000);
    });
  }

  if (printInsBtn) printInsBtn.addEventListener('click', (e) => { e.preventDefault(); doPrintFor(insulinCard); });
  if (printSensorBtn) printSensorBtn.addEventListener('click', (e) => { e.preventDefault(); doPrintFor(sensorCard); });

  // Request buttons
  function dispatchRequest(type) { document.dispatchEvent(new CustomEvent('prescription:request', { detail: { type } })); }
  if (requestInsBtn) requestInsBtn.addEventListener('click', (e) => { e.preventDefault(); dispatchRequest('insulin'); });
  if (requestSensorBtn) requestSensorBtn.addEventListener('click', (e) => { e.preventDefault(); dispatchRequest('sensor'); });

  // Legacy view buttons (guarded): expand history if present
  if (insulinViewBtn) insulinViewBtn.addEventListener('click', ()=>{ if (historyPanel) { historyPanel.hidden = false; historyPanel.scrollIntoView({behavior:'smooth'}); renderHistory && renderHistory(mockHistory); } });
  if (sensorViewBtn) sensorViewBtn.addEventListener('click', ()=>{ if (historyPanel) { historyPanel.hidden = false; historyPanel.scrollIntoView({behavior:'smooth'}); renderHistory && renderHistory(mockHistory); } });

  if (toggleHistory && historyPanel) {
    toggleHistory.addEventListener('click', ()=>{
      historyPanel.style.display = historyPanel.style.display === 'none' ? 'block' : 'none';
    });
  }

  if (downloadAll) downloadAll.addEventListener('click', ()=>{ console.log('Would download all prescriptions as PDF'); });
  if (printAll) printAll.addEventListener('click', ()=>{ window.print(); });

  // Initial render using mock
  renderActive(mockPrescription);
});
