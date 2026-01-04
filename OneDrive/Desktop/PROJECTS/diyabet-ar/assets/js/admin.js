const token = localStorage.getItem('token');
const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

async function fetchJSON(url, opts={}) {
  const res = await fetch(url, { ...opts, headers: { ...headers, ...(opts.headers||{}) } });
  if (!res.ok) throw new Error(res.status);
  return res.json();
}

async function loadDoctors() {
  const data = await fetchJSON('/api/admin/doctors');
  const grid = document.getElementById('doctorsGrid');
  grid.innerHTML = data.map(d => `
    <div class="card" data-id="${d._id}">
      <div class="title">👨‍⚕️ ${d.fullName}</div>
      <small>${d.specialty || ''} • ${d.city || ''}</small>
      <div class="switch-row">
        <label>Active</label>
        <input type="checkbox" class="doc-active" ${d.isActive ? 'checked':''} data-id="${d._id}">
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="action-btn edit" data-id="${d._id}">Edit</button>
        <button class="action-btn delete" data-id="${d._id}">Delete</button>
      </div>
    </div>
  `).join('');
}

async function loadPatientsForAssign() {
  const patients = await fetchJSON('/api/doctor/patients'); // reuse existing endpoint listing assigned; need all patients, fallback
  const allPatients = await fetchJSON('/api/admin/patients').catch(()=>patients); // optional if implemented
  const doctors = await fetchJSON('/api/admin/doctors');
  const tbody = document.getElementById('assignBody');
  tbody.innerHTML = (allPatients || []).map(p => `
    <tr data-id="${p._id}">
      <td>${p.fullName || p.name}</td>
      <td>${p.city || '-'}</td>
      <td>${p.assignedDoctorName || p.assignedDoctorFullName || p.assignedDoctor ? 'Assigned' : '—'}</td>
      <td>
        <select class="select assign-select" data-pid="${p._id}">
          <option value="">Select</option>
          ${doctors.map(d => `<option value="${d._id}">${d.fullName}</option>`).join('')}
        </select>
        <button class="action-btn assign-btn" data-pid="${p._id}">Assign</button>
      </td>
    </tr>
  `).join('');
}

document.getElementById('create-doctor-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = Object.fromEntries(fd.entries());
  await fetchJSON('/api/admin/doctors', { method: 'POST', body: JSON.stringify(payload) });
  e.target.reset();
  loadDoctors();
});

document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('doc-active')) {
    const id = e.target.dataset.id;
    await fetchJSON(`/api/admin/doctor/${id}`, { method: 'PUT', body: JSON.stringify({ isActive: e.target.checked }) });
  }
  if (e.target.classList.contains('delete')) {
    const id = e.target.dataset.id;
    if (!confirm('Delete doctor?')) return;
    await fetchJSON(`/api/admin/doctor/${id}`, { method: 'DELETE' });
    loadDoctors();
  }
  if (e.target.classList.contains('assign-btn')) {
    const pid = e.target.dataset.pid;
    const select = document.querySelector(`.assign-select[data-pid="${pid}"]`);
    const did = select.value;
    if (!did) return alert('Select doctor');
    await fetchJSON('/api/admin/assign-patient', { method: 'PUT', body: JSON.stringify({ patientId: pid, doctorId: did }) });
    showToast();
    loadPatientsForAssign();
  }
});

function showToast() {
  const t = document.getElementById('toast');
  t.classList.remove('hidden');
  setTimeout(()=>t.classList.add('hidden'), 3000);
}

(async function init() {
  try {
    await loadDoctors();
    await loadPatientsForAssign();
  } catch (e) {
    console.error(e);
    document.body.insertAdjacentHTML('beforeend','<div style="color:red;padding:20px">Admin API error</div>');
  }
})();
