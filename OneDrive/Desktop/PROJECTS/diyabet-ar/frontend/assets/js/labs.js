// labs.js - Patient Lab Results page
// Features:
// - Auth guard (patient only)
// - Fetch labs: GET /api/patient/labs?start=&end=&type=
// - Create lab: POST /api/patient/labs (multipart if file)
// - Delete lab: DELETE /api/patient/labs/:id
// - View / Download file, Print, Render table + mobile cards

const API_BASE = window.API_BASE || 'http://localhost:3001/api';

(function(){
  const AUTH_TOKEN_KEY = 'authToken';
  const ROLE_KEY = 'userRole';

  function authGuard(){
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('auth_token');
    const role = localStorage.getItem(ROLE_KEY);
    if(!token || role !== 'patient'){
      window.location.href = '../login.html';
      return false;
    }
    return true;
  }

  // helpers
  const el = sel => document.querySelector(sel);
  const els = sel => Array.from(document.querySelectorAll(sel));

  function qs(id){ return document.getElementById(id); }

  async function fetchLabs({start='', end='', type='' } = {}){
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const role = localStorage.getItem(ROLE_KEY);
    const qsParts = [];
    if(start) qsParts.push('start='+encodeURIComponent(start));
    if(end) qsParts.push('end='+encodeURIComponent(end));
    if(type) qsParts.push('type='+encodeURIComponent(type));
    let labsUrl, reportsUrl;
    if (role === 'doctor') {
      labsUrl = `${API_BASE}/doctor/labs${qsParts.length ? ('?' + qsParts.join('&')) : ''}`;
      reportsUrl = `${API_BASE}/doctor/labs/reports${qsParts.length ? ('?' + qsParts.join('&')) : ''}`;
    } else {
      labsUrl = `${API_BASE}/patient/labs${qsParts.length ? ('?' + qsParts.join('&')) : ''}`;
      reportsUrl = `${API_BASE}/patient/labs/reports${qsParts.length ? ('?' + qsParts.join('&')) : ''}`;
    }
    try{
      // Fetch both lab requests and lab reports in parallel
      const [labsRes, reportsRes] = await Promise.all([
        fetch(labsUrl, { headers: { 'Authorization': 'Bearer ' + token }}),
        fetch(reportsUrl, { headers: { 'Authorization': 'Bearer ' + token }})
      ]);
      if (!labsRes.ok && !reportsRes.ok) throw new Error('fetch failed');
      const [labs, reports] = await Promise.all([
        labsRes.ok ? labsRes.json() : [],
        reportsRes.ok ? reportsRes.json() : []
      ]);
      // Merge or return as needed (here, just return labs for compatibility)
      // You may want to merge or display both in your UI
      return (labs.data || []).concat(reports.data || []);
    }catch(err){
      console.error('Failed to fetch labs', err);
      return [];
    }
  }

  async function createLab(formData){
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const role = localStorage.getItem(ROLE_KEY);
    let url;
    if (role === 'doctor') {
      url = `${API_BASE}/doctor/labs`;
    } else {
      url = `${API_BASE}/patient/labs`;
    }
    try{
      const res = await fetch(url, { method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, body: formData });
      if(!res.ok) throw new Error('create failed');
      const json = await res.json();
      return json.data;
    }catch(err){
      console.error('Failed to create lab', err);
      throw err;
    }
  }

  async function deleteLab(id){
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const role = localStorage.getItem(ROLE_KEY);
    let url;
    if (role === 'doctor') {
      url = `${API_BASE}/doctor/labs/${encodeURIComponent(id)}`;
    } else {
      url = `${API_BASE}/patient/labs/${encodeURIComponent(id)}`;
    }
    try{
      const res = await fetch(url, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token }});
      if(!res.ok) throw new Error('delete failed');
      return true;
    }catch(err){
      console.error('Failed to delete lab', err);
      return false;
    }
  }

  function createTable(items){
    const table = document.createElement('table');
    table.className = 'records-table';
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th data-i18n="labs.table.header.testName">اسم الفحص</th>
        <th data-i18n="labs.table.header.result">النتيجة</th>
        <th data-i18n="labs.table.header.refRange">النطاق المرجعي</th>
        <th data-i18n="labs.table.header.date">التاريخ</th>
        <th data-i18n="labs.table.header.notes">الملاحظات</th>
        <th data-i18n="actions">الإجراءات</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    items.forEach(item => {
      const tr = document.createElement('tr');
      const statusClass = computeStatusClass(item);

      const nameTd = document.createElement('td'); nameTd.textContent = item.type || '';

      const resultTd = document.createElement('td');
      const spanVal = document.createElement('span'); spanVal.className = 'lab-value '+statusClass; spanVal.textContent = item.value != null ? (item.value + (item.units?(' ' + item.units):'') ) : '';
      resultTd.appendChild(spanVal);

      const refTd = document.createElement('td');
      const low = item.refLow != null ? item.refLow : '';
      const high = item.refHigh != null ? item.refHigh : '';
      refTd.textContent = (low || high) ? `${low} - ${high}` : '';

      const dateTd = document.createElement('td'); dateTd.textContent = item.date || '';
      const notesTd = document.createElement('td'); notesTd.textContent = item.notes || '';

      const actionsTd = document.createElement('td'); actionsTd.className = 'actions-cell';

      const btnView = document.createElement('button'); btnView.className='action-view'; btnView.setAttribute('data-i18n','labs.actions.view'); btnView.addEventListener('click', ()=>{
        if(item.fileUrl) window.open(item.fileUrl, '_blank');
      });

      const btnDownload = document.createElement('button'); btnDownload.className='action-download'; btnDownload.setAttribute('data-i18n','labs.actions.download'); btnDownload.addEventListener('click', async ()=>{
        if(!item.fileUrl) return;
        try{
          const resp = await fetch(item.fileUrl);
          const blob = await resp.blob();
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = item.fileName || 'lab-result';
          document.body.appendChild(a); a.click(); a.remove();
        }catch(err){ console.error('download failed', err); }
      });

      const btnDelete = document.createElement('button'); btnDelete.className='action-delete'; btnDelete.setAttribute('data-i18n','labs.actions.delete'); btnDelete.addEventListener('click', async ()=>{
        const ok = confirm(t('confirm.delete_lab'));
        if(!ok) return;
        const ok2 = await deleteLab(item._id);
        if(ok2) loadAndRender();
      });

      actionsTd.appendChild(btnView); actionsTd.appendChild(btnDownload); actionsTd.appendChild(btnDelete);

      tr.appendChild(nameTd); tr.appendChild(resultTd); tr.appendChild(refTd); tr.appendChild(dateTd); tr.appendChild(notesTd); tr.appendChild(actionsTd);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    return table;
  }

  function createCards(items){
    const wrap = document.createElement('div');
    wrap.className = 'cards-grid-list';

    items.forEach(item => {
      const card = document.createElement('div'); card.className = 'card-item';

      // Test name (prominent)
      const testName = document.createElement('div'); testName.className = 'test-name'; testName.textContent = item.type || '';

      // result + reference row
      const resultRow = document.createElement('div'); resultRow.className = 'result-row';
      const resultLeft = document.createElement('div'); resultLeft.className = 'result-value';
      const statusClass = computeStatusClass(item);
      const spanVal = document.createElement('span'); spanVal.className = 'lab-value '+statusClass; spanVal.textContent = item.value != null ? (item.value + (item.units?(' ' + item.units):'')) : '';
      resultLeft.appendChild(spanVal);
      const resultRight = document.createElement('div'); resultRight.className = 'result-ref'; resultRight.textContent = (item.refLow || item.refHigh) ? `${item.refLow || ''} - ${item.refHigh || ''}` : '';
      resultRow.appendChild(resultLeft); resultRow.appendChild(resultRight);

      const meta = document.createElement('div'); meta.className = 'card-meta'; meta.innerHTML = `<div class='muted'>${item.date||''}</div>`;

      const notes = document.createElement('div'); notes.className = 'card-notes'; notes.textContent = item.notes || '';

      const actions = document.createElement('div'); actions.className = 'card-actions';
      const vbtn = document.createElement('button'); vbtn.className='action-view'; vbtn.setAttribute('data-i18n','labs.actions.view'); vbtn.addEventListener('click', ()=>{ if(item.fileUrl) window.open(item.fileUrl,'_blank'); });
      const dbtn = document.createElement('button'); dbtn.className='action-download'; dbtn.setAttribute('data-i18n','labs.actions.download'); dbtn.addEventListener('click', async ()=>{ if(!item.fileUrl) return; try{ const resp = await fetch(item.fileUrl); const blob = await resp.blob(); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=item.fileName||'lab-result'; document.body.appendChild(a); a.click(); a.remove(); }catch(err){console.error(err);} });
      const del = document.createElement('button'); del.className='action-delete'; del.setAttribute('data-i18n','labs.actions.delete'); del.addEventListener('click', async ()=>{ if(confirm(t('confirm.delete_lab'))){ await deleteLab(item._id); loadAndRender(); } });
      actions.appendChild(vbtn); actions.appendChild(dbtn); actions.appendChild(del);

      card.appendChild(testName); card.appendChild(resultRow); card.appendChild(meta); if(notes && notes.textContent) card.appendChild(notes); card.appendChild(actions);
      wrap.appendChild(card);
    });

    return wrap;
  }

  function computeStatusClass(item){
    const low = item.refLow != null ? Number(item.refLow) : null;
    const high = item.refHigh != null ? Number(item.refHigh) : null;
    const val = item.value != null ? Number(item.value) : null;
    if(val==null) return 'lab-normal';
    if(high!=null && val>high) return 'lab-high';
    if(low!=null && val<low) return 'lab-low';
    return 'lab-normal';
  }

  function statusTextKey(item){
    const cls = computeStatusClass(item);
    if(cls==='lab-high') return 'labs.status.high';
    if(cls==='lab-low') return 'labs.status.low';
    return 'labs.status.normal';
  }

  async function printSingle(item){
    const html = `<!doctype html><html><head><title>${t('labs.title')}</title><style>body{font-family:Inter,Arial,sans-serif;padding:20px} .card{border:0}</style></head><body><h2>${item.type||''} - ${item.date||''}</h2><div>${t('labs.table.header.value')}: ${item.value||''} ${item.units||''}</div><div>${item.notes||''}</div></body></html>`;
    const w = window.open('', '_blank');
    if(!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
  }

  // Render wrapper
  async function render(items){
    const wrap = qs('labs-list') || qs('labs-list') ;
    const container = document.getElementById('labs-list');
    if(!container) return;
    container.innerHTML = '';

    if(!items || items.length===0){
      qs('labs-no-results').style.display = 'block';
      qs('labs-count').textContent = '0';
      return;
    }
    qs('labs-no-results').style.display = 'none';
    qs('labs-count').textContent = String(items.length);

    // Desktop table
    const table = createTable(items);
    container.appendChild(table);

    // Mobile cards
    const cards = createCards(items);
    container.appendChild(cards);

    // Apply translations for dynamic elements
    if(typeof applyTranslations === 'function') applyTranslations();
  }

  async function loadAndRender(){
    const start = qs('lab-filter-start').value || '';
    const end = qs('lab-filter-end').value || '';
    const type = qs('lab-filter-type').value || '';
    const items = await fetchLabs({start,end,type});
    await render(items);
  }

  function setupFilters(){
    qs('labs-apply').addEventListener('click', (e)=>{ e.preventDefault(); loadAndRender(); });
    qs('labs-clear').addEventListener('click', (e)=>{ e.preventDefault(); qs('lab-filter-start').value=''; qs('lab-filter-end').value=''; qs('lab-filter-type').value=''; loadAndRender(); });
  }

  function setupAddModal(){
    const btnAdd = qs('btn-add');
    const modal = qs('lab-modal');
    const form = qs('lab-form');
    const btnCancel = qs('lab-cancel');

    btnAdd.addEventListener('click', ()=>{ modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false'); });
    btnCancel.addEventListener('click', ()=>{ modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); });

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData();
      fd.append('date', qs('lab-date').value || '');
      fd.append('type', qs('lab-type').value || '');
      fd.append('value', qs('lab-value').value || '');
      fd.append('units', qs('lab-units').value || '');
      fd.append('refLow', qs('lab-ref-low').value || '');
      fd.append('refHigh', qs('lab-ref-high').value || '');
      fd.append('notes', qs('lab-notes').value || '');
      const fileEl = qs('lab-file');
      if(fileEl && fileEl.files && fileEl.files.length) fd.append('file', fileEl.files[0]);

      try{
        await createLab(fd);
        modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true');
        form.reset();
        loadAndRender();
      }catch(err){
        alert(t('labs.msg.uploadError'));
      }
    });
  }

  function setupPrintAll(){
    qs('btn-print-all').addEventListener('click', ()=>{ window.print(); });
  }

  async function init(){
    if(!authGuard()) return;
    setupFilters();
    setupAddModal();
    setupPrintAll();
    // populate types (example) - in real app this comes from backend
    // Use i18n keys for labels; avoid hard-coded visible text in JS
    const types = [
      { key: 'labs.type.hba1c', value: 'hba1c' },
      { key: 'labs.type.chol_total', value: 'chol_total' },
      { key: 'labs.type.chol_ldl', value: 'chol_ldl' },
      { key: 'labs.type.chol_hdl', value: 'chol_hdl' },
      { key: 'labs.type.triglycerides', value: 'triglycerides' },
      { key: 'labs.type.acr', value: 'acr' },
      { key: 'labs.type.cbc', value: 'cbc' },
      { key: 'labs.type.fasting_glucose', value: 'fasting_glucose' },
      { key: 'labs.type.random_glucose', value: 'random_glucose' }
    ];
    const sel = qs('lab-filter-type');
    const sel2 = qs('lab-type');
    if(sel){
      types.forEach(ti=>{ const o=document.createElement('option'); o.value=ti.value; o.setAttribute('data-i18n', ti.key); o.textContent = ti.value; sel.appendChild(o); });
    }
    if(sel2){
      types.forEach(ti=>{ const o=document.createElement('option'); o.value=ti.value; o.setAttribute('data-i18n', ti.key); o.textContent = ti.value; sel2.appendChild(o); });
    }

    await loadAndRender();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
