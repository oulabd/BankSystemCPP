
function renderMockPrescriptions() {
  const area = document.getElementById('prescriptionsArea') || document.body;
  area.innerHTML = '<h3>الوصفات (تجريبي)</h3>' +
    MOCK_PRESCRIPTIONS.map(rx => `
      <div class="prescription-row">
        <strong>${rx.medication}</strong> – ${rx.dosage} – ${rx.frequency} – ${rx.duration}<br>
        <em>${rx.notes}</em> <span class="rx-date">${rx.date}</span>
      </div>
    `).join('');
}

function renderMockDoctorNotes() {
  const area = document.getElementById('doctorNotesArea') || document.body;
  area.innerHTML = '<h3>ملاحظات الطبيب (تجريبي)</h3>' +
    MOCK_DOCTOR_COMMENTS.map(note => `
      <div class="doctor-note-row">
        <strong>${note.doctor}:</strong> "${note.comment}" <span class="note-date">${note.date}</span>
      </div>
    `).join('');
}

(function () {
  const AUTH_TOKEN_KEY = 'authToken';
  const USER_ROLE_KEY = 'userRole';


  function authGuard() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const role = localStorage.getItem(USER_ROLE_KEY);
    if (!token || role !== 'patient') {
      // redirect to login
      window.location.href = '../login.html';
      return false;
    }
    return true;
  }

  // UI helpers
  function el(sel) { return document.querySelector(sel); }
  function els(sel) { return Array.from(document.querySelectorAll(sel)); }

  // Build measurement form HTML
  function buildMeasurementForm(data) {
    const container = document.createElement('div');
    container.className = 'measure-form-wrapper';
    const form = document.createElement('form');
    form.className = 'measure-form';

    const fields = [
      { k: 'fasting', label: 'صائم' },
      { k: 'beforeBreakfast', label: 'قبل الإفطار' },
      { k: 'afterBreakfast', label: 'بعد الإفطار' },
      { k: 'breakfastCarbs', label: 'كربوهيدرات الإفطار (جم)' },
      { k: 'breakfastInsulin', label: 'أنسولين الإفطار (وحدة)' },
      { k: 'snack1', label: 'وجبة خفيفة 1' },
      { k: 'beforeLunch', label: 'قبل الغداء' },
      { k: 'afterLunch', label: 'بعد الغداء' },
      { k: 'lunchCarbs', label: 'كربوهيدرات الغداء (جم)' },
      { k: 'lunchInsulin', label: 'أنسولين الغداء (وحدة)' },
      { k: 'snack2', label: 'وجبة خفيفة 2' },
      { k: 'beforeDinner', label: 'قبل العشاء' },
      { k: 'afterDinner', label: 'بعد العشاء' },
      { k: 'dinnerCarbs', label: 'كربوهيدرات العشاء (جم)' },
      { k: 'dinnerInsulin', label: 'أنسولين العشاء (وحدة)' },
      { k: 'snack3', label: 'وجبة خفيفة 3' },
      { k: 'lantus', label: 'لانتوس (وحدة)' },
      { k: 'measurement_12am', label: 'قياس 00:00' },
      { k: 'measurement_3am', label: 'قياس 03:00' }
    ];

    fields.forEach((f) => {
      const row = document.createElement('div');
      row.className = 'form-row';
      const label = document.createElement('label');
      label.textContent = f.label;
      const input = document.createElement('input');
      input.type = 'number';
      input.step = '0.1';
      input.name = f.k;
      input.min = '0';
      if (data && data[f.k] !== undefined) input.value = data[f.k];
      row.appendChild(label);
      row.appendChild(input);
      form.appendChild(row);
    });

    // ...removed notes field...

    const actions = document.createElement('div');
    actions.className = 'form-actions';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn';
    saveBtn.type = 'button';
    saveBtn.textContent = 'حفظ';
    saveBtn.addEventListener('click', () => saveMeasurement(form));

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn secondary';
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'تعديل';
    cancelBtn.addEventListener('click', () => renderTodayView());

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);
    form.appendChild(actions);

    container.appendChild(form);
    return container;
  }

  function renderWarning(messages) {
    const area = el('#todayRecordArea');
    area.querySelectorAll('.warning,.critical').forEach(n=>n.remove());
    const keyToTurkish = {
      'warning.high': 'حرج: القياس مرتفع جدًا!',
      'warning.low': 'تحذير: القياس منخفض جدًا!'
    };
    messages.forEach(m => {
      const div = document.createElement('div');
      div.className = m.type === 'critical' ? 'critical' : 'warning';
      div.textContent = keyToTurkish[m.key] || 'تحذير';
      area.appendChild(div);
    });
  }

  function renderTodayView(record) {
    const container = el('#todayRecordArea');
    if (!container) return; // Element doesn't exist on this page
    
    container.innerHTML = '';
    if (!record) {
      // show empty form
      const form = buildMeasurementForm();
      container.appendChild(form);
      return;
    }

    // show record in read-only view with Edit button
    const view = document.createElement('div');
    view.className = 'today-view';

    const fields = [
      { k: 'fasting', label: 'صائم' },
      { k: 'beforeBreakfast', label: 'قبل الإفطار' },
      { k: 'afterBreakfast', label: 'بعد الإفطار' },
      { k: 'breakfastCarbs', label: 'كربوهيدرات الإفطار (جم)' },
      { k: 'breakfastInsulin', label: 'أنسولين الإفطار (وحدة)' },
      { k: 'snack1', label: 'وجبة خفيفة 1' },
      { k: 'beforeLunch', label: 'قبل الغداء' },
      { k: 'afterLunch', label: 'بعد الغداء' },
      { k: 'lunchCarbs', label: 'كربوهيدرات الغداء (جم)' },
      { k: 'lunchInsulin', label: 'أنسولين الغداء (وحدة)' },
      { k: 'snack2', label: 'وجبة خفيفة 2' },
      { k: 'beforeDinner', label: 'قبل العشاء' },
      { k: 'afterDinner', label: 'بعد العشاء' },
      { k: 'dinnerCarbs', label: 'كربوهيدرات العشاء (جم)' },
      { k: 'dinnerInsulin', label: 'أنسولين العشاء (وحدة)' },
      { k: 'snack3', label: 'وجبة خفيفة 3' },
      { k: 'lantus', label: 'لانتوس (وحدة)' },
      { k: 'measurement_12am', label: 'قياس 00:00' },
      { k: 'measurement_3am', label: 'قياس 03:00' }
    ];
    const row = document.createElement('div');
    row.className = 'today-row';
    fields.forEach(f => {
      const cell = document.createElement('div');
      cell.className = 'cell';
      const title = document.createElement('div');
      title.className = 'small-muted';
      title.textContent = f.label;
      const val = document.createElement('div');
      val.textContent = record[f.k] !== undefined && record[f.k] !== null ? record[f.k] : '-';
      cell.appendChild(title);
      cell.appendChild(val);
      row.appendChild(cell);
    });
    view.appendChild(row);

    // ...removed notes display...

    const actions = document.createElement('div');
    actions.className = 'form-actions';
    const editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.textContent = 'تعديل';
    editBtn.addEventListener('click', ()=>{
      const form = buildMeasurementForm(record);
      container.innerHTML = '';
      container.appendChild(form);
    });
    actions.appendChild(editBtn);
    view.appendChild(actions);

    container.appendChild(view);

    // check warnings
    const warnings = [];
    const allVals = [record.fasting, record.beforeBreakfast, record.afterBreakfast, record.beforeLunch, record.afterLunch, record.beforeDinner, record.afterDinner, record.snack1, record.snack2, record.snack3, record.measurement_12am, record.measurement_3am].map(v=>Number(v)).filter(v=>!isNaN(v));
    if (allVals.some(v=>v>300)) warnings.push({type:'critical',key:'warning.high'});
    else if (allVals.some(v=>v<60)) warnings.push({type:'warning',key:'warning.low'});
    if (warnings.length) renderWarning(warnings);
  }

  async function fetchTodayRecord() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    try {
      const res = await fetch(
        `${window.API_BASE}/patient/records`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (!res.ok) {
        console.error('Failed to fetch records:', res.statusText);
        return null;
      }
      const data = await res.json();
      // If backend returns an array, use it directly
      if (Array.isArray(data) && data.length > 0) {
        const today = new Date().toDateString();
        return data.find(r => new Date(r.day).toDateString() === today) || null;
      }
      // If backend returns {records: [...]}, fallback
      if (data.records && data.records.length > 0) {
        const today = new Date().toDateString();
        return data.records.find(r => new Date(r.day).toDateString() === today) || null;
      }
      return null;
    } catch (err) {
      console.error('Error fetching today record:', err);
      return null;
    }
  }

  async function saveMeasurement(form) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const payload = {};
    new FormData(form).forEach((v,k)=>payload[k]=v);

    // Convert numeric strings to numbers
    ['fasting','beforeBreakfast','afterBreakfast','beforeLunch','afterLunch','beforeDinner','afterDinner','snack1','snack2','snack3','lantus','measurement_12am','measurement_3am','breakfastCarbs','lunchCarbs','dinnerCarbs','breakfastInsulin','lunchInsulin','dinnerInsulin'].forEach(k=>{
      if (payload[k]) payload[k] = Number(payload[k]);
    });

    try {
      // Check if record exists for today
      const today = await fetchTodayRecord();
      const token = localStorage.getItem('authToken');
      if (today) {
        // Update existing record
        const response = await fetch(`${window.API_BASE}/patient/records/${today._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to update record');
      } else {
        // Create new record
        const response = await fetch(`${window.API_BASE}/patient/records`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to save record');
      }

      // Fetch and render updated record
      const updatedRecord = await fetchTodayRecord();
      renderTodayView(updatedRecord);

      // Check warnings
      const allVals = ['fasting','beforeBreakfast','afterBreakfast','snack1','beforeLunch','afterLunch','snack2','beforeDinner','afterDinner','snack3','measurement_12am','measurement_3am'].map(k=>Number(payload[k])).filter(v=>!isNaN(v));
      if (allVals.some(v=>v>300)) renderWarning([{type:'critical',key:'warning.high'}]);
      else if (allVals.some(v=>v<60)) renderWarning([{type:'warning',key:'warning.low'}]);

    } catch (err) {
      console.error('Error saving measurement:', err);
      alert('حدث خطأ أثناء حفظ القياس: ' + err.message);
    }
  }

  function setupMenuNavigation() {
    // Delegated click handler: catches clicks on child elements and on elements that may be added later
    document.addEventListener('click', (e) => {
      const card = e.target.closest('[data-target]');
      if (card) {
        const t = card.getAttribute('data-target');
        if (t === 'history') { e.preventDefault(); return window.location.href = './history.html'; }
        if (t === 'appointments') { e.preventDefault(); return window.location.href = './appointments.html'; }
        if (t === 'prescriptions') { e.preventDefault(); return window.location.href = './prescriptions.html'; }
        if (t === 'carb') { e.preventDefault(); return window.location.href = './carb.html'; }
        if (t === 'labs') { e.preventDefault(); return window.location.href = './labs.html'; }
        if (t === 'maps') { e.preventDefault(); return window.location.href = './maps.html'; }
        if (t === 'charts') { e.preventDefault(); return window.location.href = './history.html'; }
        if (t === 'analyses') { e.preventDefault(); return window.location.href = './history.html'; }
        // allow existing handlers to show content for other targets
      }

      const nav = e.target.closest('[data-nav]');
      if (nav) {
        const name = nav.getAttribute('data-nav');
        if (name === 'history') { e.preventDefault(); return window.location.href = './history.html'; }
        if (name === 'appointments') { e.preventDefault(); return window.location.href = './appointments.html'; }
        if (name === 'prescriptions') { e.preventDefault(); return window.location.href = './prescriptions.html'; }
        if (name === 'carb') { e.preventDefault(); return window.location.href = './carb.html'; }
        if (name === 'labs') { e.preventDefault(); return window.location.href = './labs.html'; }
        if (name === 'maps') { e.preventDefault(); return window.location.href = './maps.html'; }
        if (name === 'chat') { e.preventDefault(); return window.location.href = './chat.html'; }
        if (name === 'charts') { e.preventDefault(); return window.location.href = './history.html'; }
        if (name === 'analyses') { e.preventDefault(); return window.location.href = './history.html'; }
      }
    }, { capture: true });
  }

  function setupHeader() {

    const langItems = els('.lang-item');
    if (langItems && langItems.length) {
      langItems.forEach(item => {
        item.addEventListener('click', (e) => {
          const lang = e.target.getAttribute('data-lang');
          if (!lang) return;
          localStorage.setItem('lang', lang);
          location.reload();
        });
      });
    }

    const notifBtn = el('#notifBtn');
    if (notifBtn) {
      const notifMenu = notifBtn.nextElementSibling;
      notifBtn.addEventListener('click', () => { if (notifMenu) notifMenu.classList.toggle('show'); });
    }

    const profileBtn = el('#profileBtn');
    if (profileBtn) {
      const profileMenu = profileBtn.nextElementSibling;
      profileBtn.addEventListener('click', () => { if (profileMenu) profileMenu.classList.toggle('show'); });
    }
    
    const chatBtn = el('#chatBtn');
    if (chatBtn) {
      chatBtn.addEventListener('click', () => {
        window.location.href = 'chat.html';
      });
    }
    
    const logoutBtn = el('#logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', ()=>{
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_ROLE_KEY);
        window.location.href = '../login.html';
      });
    }
  }

  async function init() {
    if (!authGuard()) return;
    
    setupHeader();
    setupMenuNavigation();

    // default show daily measurements
    let today = await fetchTodayRecord();
    renderTodayView(today);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
