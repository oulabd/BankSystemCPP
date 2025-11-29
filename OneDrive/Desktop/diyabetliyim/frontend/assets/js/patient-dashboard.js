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
      { k: 'fasting', label: 'daily.fasting' },
      { k: 'beforeBreakfast', label: 'daily.beforeBreakfast' },
      { k: 'afterBreakfast', label: 'daily.afterBreakfast' },
      { k: 'breakfastCarbs', label: 'daily.breakfastCarbs' },
      { k: 'breakfastInsulin', label: 'daily.breakfastInsulin' },
      { k: 'snack1', label: 'daily.snack1' },
      { k: 'beforeLunch', label: 'daily.beforeLunch' },
      { k: 'afterLunch', label: 'daily.afterLunch' },
      { k: 'lunchCarbs', label: 'daily.lunchCarbs' },
      { k: 'lunchInsulin', label: 'daily.lunchInsulin' },
      { k: 'snack2', label: 'daily.snack2' },
      { k: 'beforeDinner', label: 'daily.beforeDinner' },
      { k: 'afterDinner', label: 'daily.afterDinner' },
      { k: 'dinnerCarbs', label: 'daily.dinnerCarbs' },
      { k: 'dinnerInsulin', label: 'daily.dinnerInsulin' },
      { k: 'snack3', label: 'daily.snack3' },
      { k: 'lantus', label: 'daily.lantus' },
      { k: 'measurement_12am', label: 'daily.measurement_12am' },
      { k: 'measurement_3am', label: 'daily.measurement_3am' }
    ];

    fields.forEach((f) => {
      const row = document.createElement('div');
      row.className = 'form-row';
      const label = document.createElement('label');
      label.textContent = t(f.label);
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

    // notes
    const notesRow = document.createElement('div');
    notesRow.className = 'form-row';
    const notesLabel = document.createElement('label');
    notesLabel.textContent = t('daily.notes');
    const textarea = document.createElement('textarea');
    textarea.name = 'notes';
    textarea.rows = 3;
    if (data && data.notes) textarea.value = data.notes;
    notesRow.appendChild(notesLabel);
    notesRow.appendChild(textarea);
    form.appendChild(notesRow);

    const actions = document.createElement('div');
    actions.className = 'form-actions';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn';
    saveBtn.type = 'button';
    saveBtn.textContent = t('daily.save');
    saveBtn.addEventListener('click', () => saveMeasurement(form));

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn secondary';
    cancelBtn.type = 'button';
    cancelBtn.textContent = t('daily.edit');
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
    messages.forEach(m=>{
      const div = document.createElement('div');
      div.className = m.type === 'critical' ? 'critical' : 'warning';
      div.textContent = t(m.key);
      area.appendChild(div);
    });
  }

  function renderTodayView(record) {
    const container = el('#todayRecordArea');
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

    const fields = ['fasting','beforeBreakfast','afterBreakfast','breakfastCarbs','breakfastInsulin','snack1','beforeLunch','afterLunch','lunchCarbs','lunchInsulin','snack2','beforeDinner','afterDinner','dinnerCarbs','dinnerInsulin','snack3','lantus','measurement_12am','measurement_3am'];
    const row = document.createElement('div');
    row.className = 'today-row';
    fields.forEach(k=>{
      const cell = document.createElement('div');
      cell.className = 'cell';
      const title = document.createElement('div');
      title.className = 'small-muted';
      const keyMap = {
        fasting:'daily.fasting',beforeBreakfast:'daily.beforeBreakfast',afterBreakfast:'daily.afterBreakfast',
        breakfastCarbs: 'daily.breakfastCarbs', breakfastInsulin: 'daily.breakfastInsulin', snack1: 'daily.snack1',
        beforeLunch:'daily.beforeLunch',afterLunch:'daily.afterLunch',
        lunchCarbs: 'daily.lunchCarbs', lunchInsulin: 'daily.lunchInsulin', snack2: 'daily.snack2',
        beforeDinner:'daily.beforeDinner',afterDinner:'daily.afterDinner',
        dinnerCarbs: 'daily.dinnerCarbs', dinnerInsulin: 'daily.dinnerInsulin', snack3: 'daily.snack3',
        lantus: 'daily.lantus', measurement_12am: 'daily.measurement_12am', measurement_3am: 'daily.measurement_3am'
      };
      title.textContent = t(keyMap[k]);
      const val = document.createElement('div');
      val.textContent = record[k] !== undefined && record[k] !== null ? record[k] : '-';
      cell.appendChild(title);cell.appendChild(val);row.appendChild(cell);
    });
    view.appendChild(row);

    if (record.notes) {
      const notes = document.createElement('div');
      notes.className = 'small-muted';
      notes.textContent = record.notes;
      view.appendChild(notes);
    }

    const actions = document.createElement('div');
    actions.className = 'form-actions';
    const editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.textContent = t('edit');
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
    // Placeholder: integrate with backend endpoint to fetch today's record
    // Example endpoint: GET /api/daily-records/today  (Authorization: Bearer token)
    // const resp = await fetch('/api/daily-records/today',{headers:{Authorization:`Bearer ${token}`}});
    // const data = await resp.json();
    // return data.data;

    // For now return null (no record) or a mocked example
    return null;
  }

  async function saveMeasurement(form) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const payload = {};
    new FormData(form).forEach((v,k)=>payload[k]=v);

    // Basic client validation
    // Add timestamp or date as needed

    try {
      // Placeholder: send to backend
      // If today record exists -> PUT /api/daily-records/:id
      // Else -> POST /api/daily-records
      // Example:
      // await fetch('/api/daily-records', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify(payload) });

      // For demo, show saved state locally
      const saved = Object.assign({}, payload);
      renderTodayView(saved);

      // check warnings on saved
      const allVals = ['fasting','beforeBreakfast','afterBreakfast','snack1','beforeLunch','afterLunch','snack2','beforeDinner','afterDinner','snack3','measurement_12am','measurement_3am'].map(k=>Number(saved[k])).filter(v=>!isNaN(v));
      if (allVals.some(v=>v>300)) renderWarning([{type:'critical',key:'warning.high'}]);
      else if (allVals.some(v=>v<60)) renderWarning([{type:'warning',key:'warning.low'}]);

    } catch (err) {
      alert('Error saving measurement: '+err.message);
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
        if (name === 'labs') { e.preventDefault(); return window.location.href = './lab-upload.html'; }
        if (name === 'maps') { e.preventDefault(); return window.location.href = './maps.html'; }
        if (name === 'charts') { e.preventDefault(); return window.location.href = './history.html'; }
        if (name === 'analyses') { e.preventDefault(); return window.location.href = './history.html'; }
      }
    }, { capture: true });
  }

  function setupHeader() {
    const langBtn = el('#langBtn');
    if (langBtn) {
      const langMenu = langBtn.nextElementSibling;
      langBtn.addEventListener('click', () => { if (langMenu) langMenu.classList.toggle('show'); });
    }

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
    const today = await fetchTodayRecord();
    renderTodayView(today);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
