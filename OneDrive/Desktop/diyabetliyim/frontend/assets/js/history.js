// history.js
// Patient Measurement History page logic
// - Auth guard: requires auth token and role === 'patient'
// - Loads records via GET /api/patient/records?start=YYYY-MM-DD&end=YYYY-MM-DD
// - DELETE /api/patient/records/:id to remove
// - Edit redirects to ./dashboard.html?editId=RECORD_ID
// Note: all visible text must be provided via data-i18n attributes in HTML (no hardcoded text below).

const API_BASE = window.__API_BASE__ || ((location.port && location.port !== '5000') ? `http://${location.hostname}:5000` : '');

function getStoredToken(){
  return localStorage.getItem('authToken') || localStorage.getItem('auth_token');
}

function getUserRole(){
  return localStorage.getItem('userRole') || null;
}

function guard(){
  const token = getStoredToken();
  const role = getUserRole();
  if (!token || role !== 'patient') {
    // redirect to login if not authorized
    window.location.href = '../login.html';
    return false;
  }
  return true;
}

if (!guard()) {
  // stop further JS execution if not authorized
  throw new Error('unauthorized');
}

// DOM refs
const form = document.getElementById('filter-form');
const startEl = document.getElementById('start');
const endEl = document.getElementById('end');
const tbody = document.getElementById('records-tbody');
const cardsWrap = document.getElementById('records-cards');
const noResults = document.getElementById('no-results');
const resultsCount = document.getElementById('results-count');
const btnClear = document.getElementById('btn-clear');
const btnPrint = document.getElementById('btn-print');

// i18n templates (texts used by JS, provided in HTML via data-i18n)
const tplConfirmDelete = t('confirm.delete');
const tplDeleteSuccess = ''; // Not used, but could be 'delete.success'

// Helpers
function authHeaders(){
  const token = getStoredToken();
  return token ? { 'Authorization': 'Bearer ' + token } : {};
}

function isoDate(d){
  if (!d) return '';
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth()+1).padStart(2,'0');
  const dd = String(dt.getDate()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd}`;
}

// Fetch records from API. Comment indicates where to inject real API call.
async function fetchRecords(){
  const start = startEl.value ? isoDate(startEl.value) : '';
  const end = endEl.value ? isoDate(endEl.value) : '';

  // Build URL
  const params = new URLSearchParams();
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  const url = (API_BASE ? `${API_BASE}/api/patient/records` : '/api/patient/records') + (params.toString() ? `?${params.toString()}` : '');

  // --- API CALL: GET records ---
  // Replace/follow this fetch call to integrate with your backend
  const res = await fetch(url, {
    method: 'GET',
    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
  });
  if (!res.ok) {
    console.error('failed to load records', res.status);
    // optionally show UI error (not implemented here)
    return [];
  }
  const data = await res.json().catch(() => ([]));
  // expected: array of records
  return Array.isArray(data) ? data : (data.records || []);
}

function clearResults(){
  tbody.innerHTML = '';
  cardsWrap.innerHTML = '';
}

function makeCell(value, classes=''){
  const td = document.createElement('td');
  td.className = classes;
  td.textContent = (value === null || value === undefined) ? '' : String(value);
  return td;
}

function valueHighlightClass(val){
  if (val === null || val === undefined || val === '') return '';
  const n = Number(val);
  if (isNaN(n)) return '';
  if (n > 300) return 'highlight-high';
  if (n < 60) return 'highlight-low';
  return '';
}

function renderTableRows(records){
  clearResults();
  records.forEach(rec => {
    const tr = document.createElement('tr');
    tr.appendChild(makeCell(rec.day || ''));
    const fClass = valueHighlightClass(rec.fasting);
    const tdF = makeCell(rec.fasting ?? ''); if (fClass) tdF.classList.add(fClass); tr.appendChild(tdF);
    const bfClass = valueHighlightClass(rec.beforeBreakfast);
    const tdBf = makeCell(rec.beforeBreakfast ?? ''); if (bfClass) tdBf.classList.add(bfClass); tr.appendChild(tdBf);
    const afClass = valueHighlightClass(rec.afterBreakfast);
    const tdAf = makeCell(rec.afterBreakfast ?? ''); if (afClass) tdAf.classList.add(afClass); tr.appendChild(tdAf);
    const blClass = valueHighlightClass(rec.beforeLunch);
    const tdBl = makeCell(rec.beforeLunch ?? ''); if (blClass) tdBl.classList.add(blClass); tr.appendChild(tdBl);
    const alClass = valueHighlightClass(rec.afterLunch);
    const tdAl = makeCell(rec.afterLunch ?? ''); if (alClass) tdAl.classList.add(alClass); tr.appendChild(tdAl);
    const bdClass = valueHighlightClass(rec.beforeDinner);
    const tdBd = makeCell(rec.beforeDinner ?? ''); if (bdClass) tdBd.classList.add(bdClass); tr.appendChild(tdBd);
    const adClass = valueHighlightClass(rec.afterDinner);
    const tdAd = makeCell(rec.afterDinner ?? ''); if (adClass) tdAd.classList.add(adClass); tr.appendChild(tdAd);
    tr.appendChild(makeCell(rec.notes ?? ''));

    // Actions
    const tdActions = document.createElement('td');
    tdActions.className = 'actions-cell';
    const btnEdit = document.createElement('button');
    btnEdit.className = 'action-btn action-edit';
    btnEdit.type = 'button';
    btnEdit.dataset.id = rec._id || rec.id || '';
    btnEdit.textContent = t('edit');
    btnEdit.addEventListener('click', () => onEdit(rec));

    const btnDelete = document.createElement('button');
    btnDelete.className = 'action-btn action-delete';
    btnDelete.type = 'button';
    btnDelete.dataset.id = rec._id || rec.id || '';
    btnDelete.setAttribute('data-i18n','delete');
    btnDelete.textContent = t('delete');
    btnDelete.addEventListener('click', () => onDelete(rec));

    tdActions.appendChild(btnEdit);
    tdActions.appendChild(btnDelete);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });

  // invoke i18n loader on newly created action buttons if your loader supports scanning the DOM
  if (window.loadI18n) window.loadI18n();
}

function renderCards(records){
  cardsWrap.innerHTML = '';
  records.forEach(rec => {
    const root = document.createElement('article');
    root.className = 'card-item';
    // row: day and actions
    const r1 = document.createElement('div'); r1.className='row';
    const dlabel = document.createElement('div'); dlabel.innerHTML = `<div class="label">${t('day')}</div><div class="value">${rec.day || ''}</div>`;
    const actions = document.createElement('div');
    const e = document.createElement('button'); e.className='action-btn action-edit'; e.type='button'; e.dataset.id = rec._id || rec.id || ''; e.setAttribute('data-i18n','edit'); e.textContent=t('edit'); e.addEventListener('click',()=>onEdit(rec));
    const d = document.createElement('button'); d.className='action-btn action-delete'; d.type='button'; d.dataset.id = rec._id || rec.id || ''; d.setAttribute('data-i18n','delete'); d.textContent=t('delete'); d.addEventListener('click',()=>onDelete(rec));
    actions.appendChild(e); actions.appendChild(d);
    r1.appendChild(dlabel); r1.appendChild(actions);
    root.appendChild(r1);

    const fields = [
      ['daily.fasting','Fasting', rec.fasting],
      ['daily.beforeBreakfast','Before Breakfast', rec.beforeBreakfast],
      ['daily.afterBreakfast','After Breakfast', rec.afterBreakfast],
      ['daily.beforeLunch','Before Lunch', rec.beforeLunch],
      ['daily.afterLunch','After Lunch', rec.afterLunch],
      ['daily.beforeDinner','Before Dinner', rec.beforeDinner],
      ['daily.afterDinner','After Dinner', rec.afterDinner],
    ];
    fields.forEach(([key, label, val]) => {
      const row = document.createElement('div'); row.className='row';
      const lab = document.createElement('div'); lab.className='label'; lab.textContent = t(key);
      const value = document.createElement('div'); value.className='value'; value.textContent = val ?? '';
      const cls = valueHighlightClass(val);
      if (cls) value.classList.add(cls);
      row.appendChild(lab); row.appendChild(value);
      root.appendChild(row);
    });

    // notes
    const notesRow = document.createElement('div'); notesRow.className='row';
    const labN = document.createElement('div'); labN.className='label'; labN.textContent = t('notes');
    const valN = document.createElement('div'); valN.className='value'; valN.textContent = rec.notes ?? '';
    notesRow.appendChild(labN); notesRow.appendChild(valN);
    root.appendChild(notesRow);

    cardsWrap.appendChild(root);
  });

  if (window.loadI18n) window.loadI18n();
}

async function loadAndRender(){
  const records = await fetchRecords();
  resultsCount.textContent = String(records.length || 0);
  if (!records || records.length === 0){
    noResults.hidden = false;
    document.getElementById('records-table').style.display = 'none';
    cardsWrap.style.display = 'none';
    return;
  }
  noResults.hidden = true;
  // choose view by CSS: table visible on desktop, cards on mobile; render both and let CSS hide one
  renderTableRows(records);
  renderCards(records);
  document.getElementById('records-table').style.display = '';
  cardsWrap.style.display = '';
}

function onEdit(rec){
  const id = rec._id || rec.id || '';
  // Redirect to dashboard with editId query parameter
  window.location.href = `./dashboard.html?editId=${id}`;
}

async function onDelete(rec){
  const id = rec._id || rec.id || '';
  const ok = window.confirm(tplConfirmDelete);
  if (!ok) return;

  const url = (API_BASE ? `${API_BASE}/api/patient/records/${id}` : `/api/patient/records/${id}`);
  // --- API CALL: DELETE record ---
  const res = await fetch(url, { method: 'DELETE', headers: Object.assign({'Content-Type':'application/json'}, authHeaders()) });
  if (!res.ok) {
    console.error('delete failed', res.status);
    return;
  }
  // Optionally show delete success (text from i18n template)
  if (tplDeleteSuccess) console.info(tplDeleteSuccess);
  // Refresh list
  await loadAndRender();
}

// Event listeners
form?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  await loadAndRender();
});

btnClear?.addEventListener('click', (e)=>{
  startEl.value = '';
  endEl.value = '';
  loadAndRender();
});

btnPrint?.addEventListener('click', ()=>{
  window.print();
});

// Initial load
(function(){
  // if dates not set, default to last 30 days
  if (!startEl.value && !endEl.value){
    const end = new Date();
    const start = new Date(); start.setDate(end.getDate()-30);
    startEl.value = start.toISOString().slice(0,10);
    endEl.value = end.toISOString().slice(0,10);
  }
  loadAndRender().catch(err=>console.error(err));
})();
