// history.js
// Patient Measurement History page logic
// - Auth guard: requires auth token and role === 'patient'
// - Loads timeline via GET /api/patient/timeline
// - DELETE /api/patient/records/:id to remove
// - Edit redirects to ./dashboard.html?editId=RECORD_ID
// Note: all visible text must be provided via data-i18n attributes in HTML (no hardcoded text below).

// Use explicit window.API_BASE if provided, else window.__API_BASE__,
// otherwise when frontend served on port 5000 assume backend runs on 3000.

const API_BASE = window.API_BASE || '/api';

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
const tplConfirmDelete = 'هل أنت متأكد من حذف السجل؟';
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

// Fetch timeline from API (doctor notes, labs, records, etc)
async function fetchTimeline(){
  const url = `${API_BASE}/patient/timeline`;
  const res = await fetch(url, {
    method: 'GET',
    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
  });
  if (!res.ok) {
    console.error('failed to load timeline', res.status);
    return [];
  }
  const data = await res.json().catch(() => ({}));
  // expected: { timeline: [...] }
  return Array.isArray(data.timeline) ? data.timeline : [];
}

function clearResults(){
  if (tbody) tbody.innerHTML = '';
  if (cardsWrap) cardsWrap.innerHTML = '';
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

function renderTableRows(timeline){
  // Gather all doctor notes and instructions by date for quick lookup
  const doctorNotesByDate = {};
  clearResults();
  // Collect all doctor notes for the patient
  const allDoctorNotes = [];

  const allNotes = timeline.filter(item => item.type === 'note');
  const allInstructions = timeline.filter(item => item.type === 'instruction');
  // Map notes by day using strict date string comparison
  allNotes.forEach(note => {
    if (note.day) {
      if (!doctorNotesByDate[note.day]) doctorNotesByDate[note.day] = [];
      doctorNotesByDate[note.day].push(note);
    }
  });
  allInstructions.forEach(instr => {
    if (instr.day) {
      if (!doctorNotesByDate[instr.day]) doctorNotesByDate[instr.day] = [];
      doctorNotesByDate[instr.day].push(instr);
    }
  });
  // Collect all doctor notes for the patient (for all-notes section)
  allDoctorNotes.push(...allNotes);
  // Debug: log timeline and doctorNotesByDate for inspection
  console.log('TIMELINE:', timeline);
  console.log('doctorNotesByDate:', doctorNotesByDate);
  // Render all doctor notes in the new section (always show if any exist)
  const notesSection = document.getElementById('all-doctor-notes');
  const notesList = document.getElementById('doctor-notes-list');
  if (notesSection && notesList) {
    if (allDoctorNotes.length > 0) {
      notesSection.style.display = '';
      notesList.innerHTML = allDoctorNotes.map(n => {
        const date = n.timestamp ? new Date(n.timestamp).toLocaleDateString('ar-SA') : '';
        return `<li><strong>${date}</strong>: ${n.text ? n.text : ''}</li>`;
      }).join('');
    } else {
      notesSection.style.display = 'none';
      notesList.innerHTML = '';
    }
  }

  timeline.forEach(item => {
    if(item.type === 'glucose') {
      const tr = document.createElement('tr');
      tr.appendChild(makeCell(item.day || ''));
      tr.appendChild(makeCell(item.fastingBS ?? ''));
      tr.appendChild(makeCell(item.beforeBreakfastBS ?? ''));
      tr.appendChild(makeCell(item.afterBreakfastBS ?? ''));
      tr.appendChild(makeCell(item.breakfastCarbs ?? ''));
      tr.appendChild(makeCell(item.breakfastInsulin ?? ''));
      tr.appendChild(makeCell(item.snack1 ?? ''));
      tr.appendChild(makeCell(item.beforeLunchBS ?? ''));
      tr.appendChild(makeCell(item.afterLunchBS ?? ''));
      tr.appendChild(makeCell(item.lunchCarbs ?? ''));
      tr.appendChild(makeCell(item.lunchInsulin ?? ''));
      tr.appendChild(makeCell(item.snack2 ?? ''));
      tr.appendChild(makeCell(item.beforeDinnerBS ?? ''));
      tr.appendChild(makeCell(item.afterDinnerBS ?? ''));
      tr.appendChild(makeCell(item.dinnerCarbs ?? ''));
      tr.appendChild(makeCell(item.dinnerInsulin ?? ''));
      tr.appendChild(makeCell(item.snack3 ?? ''));
      tr.appendChild(makeCell(item.lantus ?? ''));
      tr.appendChild(makeCell(item.measurement_12am ?? ''));
      tr.appendChild(makeCell(item.measurement_3am ?? ''));
      // Notlar hücresine: show only doctor notes for this day
      let notesArr = [];
      if (doctorNotesByDate[item.day] && doctorNotesByDate[item.day].length > 0) {
        notesArr = doctorNotesByDate[item.day]
          .filter(n => n.type === 'note')
          .map(n => (n.text || n));
      } else {
        // Fallback: if no notes for this day, show any note with matching relatedRecordId (robust string comparison)
        const itemIdStr = (item.id || item._id || '').toString();
        // Debug output for mapping
        console.log('Checking glucose record for Notlar:', { day: item.day, id: item.id, _id: item._id });
        notesArr = allNotes.filter(n => {
          const relId = (n.relatedRecordId || '').toString();
          console.log('Comparing relatedRecordId:', relId, 'with glucose id:', itemIdStr, 'note:', n.text);
          return relId === itemIdStr;
        }).map(n => (n.text || n));
      }
      const tdNotes = document.createElement('td');
      if (notesArr.length > 0) {
        notesArr.forEach((line, idx, arr) => {
          tdNotes.appendChild(document.createTextNode(line));
          if (idx < arr.length - 1) tdNotes.appendChild(document.createElement('br'));
        });
      }
      tr.appendChild(tdNotes);
      // Actions (edit/delete)
      const tdActions = document.createElement('td');
      tdActions.className = 'actions-cell';
      const btnEdit = document.createElement('button');
      btnEdit.className = 'action-btn action-edit';
      btnEdit.type = 'button';
      btnEdit.dataset.id = item._id || item.id || '';
      btnEdit.setAttribute('data-i18n','edit');
      btnEdit.textContent = 'تعديل';
      btnEdit.addEventListener('click', () => onEdit(item));
      const btnDelete = document.createElement('button');
      btnDelete.className = 'action-btn action-delete';
      btnDelete.type = 'button';
      btnDelete.dataset.id = item._id || item.id || '';
      btnDelete.setAttribute('data-i18n','delete');
      btnDelete.textContent = 'حذف';
      btnDelete.addEventListener('click', () => onDelete(item));
      tdActions.appendChild(btnEdit);
      tdActions.appendChild(btnDelete);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    }
  });

  // Modal logic for Talimat Ekle
  window.openInstructionModalForDay = function(day, recordId) {
    let modal = document.getElementById('doctor-note-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'doctor-note-modal';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100vw';
      modal.style.height = '100vh';
      modal.style.background = 'rgba(0,0,0,0.5)';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.innerHTML = `
        <div style="background:#fff;padding:32px 24px;border-radius:12px;min-width:320px;max-width:90vw;">
          <h3>إضافة تعليمات</h3>
          <textarea id="doctor-note-text" rows="4" style="width:100%;margin-bottom:16px;"></textarea>
          <div style="text-align:right;">
            <button id="doctor-note-cancel" class="btn" style="margin-right:8px;">إلغاء</button>
            <button id="doctor-note-save" class="btn btn-primary">حفظ</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } else {
      modal.style.display = 'flex';
    }
    document.getElementById('doctor-note-text').value = '';
    document.getElementById('doctor-note-cancel').onclick = () => { modal.style.display = 'none'; };
    document.getElementById('doctor-note-save').onclick = async () => {
      const text = document.getElementById('doctor-note-text').value.trim();
      if (!text) { alert('يرجى إدخال ملاحظة.'); return; }
      // API: POST /api/doctor/patient/:patientId/note
      const patientId = new URLSearchParams(window.location.search).get('patientId');
      const res = await fetch(`${API_BASE}/doctor/patient/${patientId}/note`, {
        method: 'POST',
        headers: Object.assign({'Content-Type':'application/json'}, authHeaders()),
        body: JSON.stringify({ text, recordId })
      });
      if (res.ok) {
        modal.style.display = 'none';
        await loadAndRender();
      } else {
        alert('تعذر حفظ الملاحظة.');
      }
    };
  };
  if (window.loadI18n) window.loadI18n();
}

function renderCards(records){
  cardsWrap.innerHTML = '';
  records.forEach(rec => {
    // Card for glucose record
    if (rec.type === 'glucose') {
      const root = document.createElement('article');
      root.className = 'card-item';
      // row: day and actions
      const r1 = document.createElement('div'); r1.className='row';
      const dlabel = document.createElement('div'); dlabel.innerHTML = `<div class="label">اليوم</div><div class="value">${rec.day || ''}</div>`;
      const actions = document.createElement('div');
      const e = document.createElement('button'); e.className='action-btn action-edit'; e.type='button'; e.dataset.id = rec._id || rec.id || ''; e.textContent='تعديل'; e.addEventListener('click',()=>onEdit(rec));
      const d = document.createElement('button'); d.className='action-btn action-delete'; d.type='button'; d.dataset.id = rec._id || rec.id || ''; d.textContent='حذف'; d.addEventListener('click',()=>onDelete(rec));
      actions.appendChild(e); actions.appendChild(d);
      r1.appendChild(dlabel); r1.appendChild(actions);
      root.appendChild(r1);

      const fields = [
        ['daily.fasting','Fasting', rec.fastingBS],
        ['daily.beforeBreakfast','Before Breakfast', rec.beforeBreakfastBS],
        ['daily.afterBreakfast','After Breakfast', rec.afterBreakfastBS],
        ['daily.beforeLunch','Before Lunch', rec.beforeLunchBS],
        ['daily.afterLunch','After Lunch', rec.afterLunchBS],
        ['daily.beforeDinner','Before Dinner', rec.beforeDinnerBS],
        ['daily.afterDinner','After Dinner', rec.afterDinnerBS],
      ];
      fields.forEach(([key, label, val]) => {
        const row = document.createElement('div'); row.className='row';
        const lab = document.createElement('div'); lab.className='label'; lab.textContent = key;
        const value = document.createElement('div'); value.className='value'; value.textContent = val ?? '';
        const cls = valueHighlightClass(val);
        if (cls) value.classList.add(cls);
        row.appendChild(lab); row.appendChild(value);
        root.appendChild(row);
      });

      // notes
      const notesRow = document.createElement('div'); notesRow.className='row';
      const labN = document.createElement('div'); labN.className='label'; labN.textContent = 'ملاحظات';
      const valN = document.createElement('div'); valN.className='value'; valN.textContent = rec.notes ?? '';
      notesRow.appendChild(labN); notesRow.appendChild(valN);
      root.appendChild(notesRow);

      cardsWrap.appendChild(root);
    }
    // Card for insulin adjustment
    else if (rec.type === 'insulin_adjustment') {
      const root = document.createElement('article');
      root.className = 'card-item insulin-adjustment';
      const row = document.createElement('div'); row.className = 'row';
      row.innerHTML = `<div class="label">🩸 تعديل الأنسولين</div><div class="value">${rec.insulinType || ''} - ${rec.dose || ''}U (${rec.reason || ''})</div>`;
      root.appendChild(row);
      if (rec.notes) {
        const notesRow = document.createElement('div'); notesRow.className = 'row';
        notesRow.innerHTML = `<div class="label">وصف</div><div class="value">${rec.notes}</div>`;
        root.appendChild(notesRow);
      }
      if (rec.doctorName) {
        const docRow = document.createElement('div'); docRow.className = 'row';
        docRow.innerHTML = `<div class="label">الطبيب</div><div class="value">${rec.doctorName}</div>`;
        root.appendChild(docRow);
      }
      const dateRow = document.createElement('div'); dateRow.className = 'row';
      dateRow.innerHTML = `<div class="label">التاريخ</div><div class="value">${rec.timestamp ? new Date(rec.timestamp).toLocaleString('ar-SA') : ''}</div>`;
      root.appendChild(dateRow);
      cardsWrap.appendChild(root);
    }
    // Card for doctor instruction
    else if (rec.type === 'instruction') {
      const root = document.createElement('article');
      root.className = 'card-item doctor-instruction';
      const row = document.createElement('div'); row.className = 'row';
      row.innerHTML = `<div class="label">📋 تعليمات الطبيب</div><div class="value">${rec.text || ''}</div>`;
      root.appendChild(row);
      if (rec.doctorName) {
        const docRow = document.createElement('div'); docRow.className = 'row';
        docRow.innerHTML = `<div class="label">الطبيب</div><div class="value">${rec.doctorName}</div>`;
        root.appendChild(docRow);
      }
      const dateRow = document.createElement('div'); dateRow.className = 'row';
      dateRow.innerHTML = `<div class="label">التاريخ</div><div class="value">${rec.timestamp ? new Date(rec.timestamp).toLocaleString('ar-SA') : ''}</div>`;
      root.appendChild(dateRow);
      cardsWrap.appendChild(root);
    }
    // Optionally, add cards for other types if needed
  });

  if (window.loadI18n) window.loadI18n();
}

async function loadAndRender(){

  const tbody = document.getElementById('records-tbody');
  if (!tbody) return;

  const timeline = await fetchTimeline();
  if (!Array.isArray(timeline)) return;

  // Split timeline by type
  const measurements = timeline.filter(item => item.type === 'glucose');
  const doctorNotes = timeline.filter(item => item.type === 'note');


  // Measurements section
if (resultsCount) {
  resultsCount.textContent = String(measurements.length || 0);
}
  if (!measurements || measurements.length === 0){
if (noResults) {
  noResults.hidden = false;
}
    document.getElementById('records-table').style.display = 'none';
    cardsWrap.style.display = 'none';
  } else {
    if (noResults) {
      noResults.hidden = true;
    }
    renderTableRows(timeline);
    renderCards(measurements);
    document.getElementById('records-table').style.display = '';
    cardsWrap.style.display = '';
  }

  // Doctor comments section removed
}

  

function onEdit(rec){
  const id = rec._id || rec.id || '';
  // Redirect to patient-dashboard with editId query parameter
  window.location.href = `./patient-dashboard.html?editId=${id}`;
}

async function onDelete(rec){
  const id = rec._id || rec.id || '';
  const ok = window.confirm(tplConfirmDelete);
  if (!ok) return;

  const url = `${API_BASE}/patient/records/${id}`;
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

  // Listen for language changes and re-render
  document.addEventListener('languageChanged', (e) => {
    loadAndRender().catch(err=>console.error(err));
  });
})();
