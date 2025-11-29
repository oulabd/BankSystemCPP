// prescriptions-doctor.js - Doctor Prescriptions page
(function(){
  const AUTH_TOKEN_KEY = 'authToken';
  const ROLE_KEY = 'userRole';

  function authGuard(){
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('auth_token');
    const role = localStorage.getItem(ROLE_KEY);
    if(!token || role !== 'doctor'){
      window.location.href = '../login.html';
      return false;
    }
    return true;
  }

  if(!authGuard()) return;

  const el = sel => document.querySelector(sel);
  const els = sel => Array.from(document.querySelectorAll(sel));

  async function loadPrescriptions(){
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    try{
      const res = await fetch('/api/doctor/prescriptions', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if(!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      renderPrescriptions(data);
    }catch(err){
      console.error('Failed to fetch prescriptions', err);
      el('#prescriptions-list').innerHTML = '<div class="error">Failed to load prescriptions</div>';
    }
  }

  function renderPrescriptions(prescriptions){
    const container = el('#prescriptions-list');
    const noResults = el('#no-prescriptions');
    
    if(prescriptions.length === 0){
      container.innerHTML = '';
      noResults.style.display = 'block';
      return;
    }
    
    noResults.style.display = 'none';
    container.innerHTML = '';
    
    prescriptions.forEach(pres => {
      const card = document.createElement('div');
      card.className = 'prescription-card';
      
      const itemsText = pres.items.map(item => `${item.name} (${item.dose})`).join(', ');
      
      card.innerHTML = `
        <div class="prescription-header">
          <h3>${pres.patient.fullName}</h3>
          <span class="date">${new Date(pres.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="prescription-details">
          <p><strong>Items:</strong> ${itemsText}</p>
          ${pres.notes ? `<p><strong>Notes:</strong> ${pres.notes}</p>` : ''}
        </div>
        <div class="prescription-actions">
          <button onclick="downloadPDF('${pres._id}')" class="btn btn-outline">Download PDF</button>
          <button onclick="deletePrescription('${pres._id}')" class="btn btn-danger">Delete</button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  window.downloadPDF = async function(id){
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const link = document.createElement('a');
    link.href = `/api/doctor/prescriptions/pdf/${id}`;
    link.setAttribute('Authorization', 'Bearer ' + token);
    link.download = `prescription-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  window.deletePrescription = async function(id){
    if(!confirm('Are you sure you want to delete this prescription?')) return;
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    try{
      const res = await fetch(`/api/doctor/prescriptions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if(res.ok){
        loadPrescriptions();
      } else {
        alert('Delete failed');
      }
    }catch(err){
      console.error('Delete failed', err);
    }
  };

  // Modal handling
  const modal = el('#createModal');
  const createBtn = el('#createBtn');
  const closeBtn = el('.close');

  createBtn.onclick = () => {
    loadPatients();
    modal.style.display = 'block';
  };
  closeBtn.onclick = () => modal.style.display = 'none';
  window.onclick = (event) => {
    if (event.target == modal) modal.style.display = 'none';
  };

  async function loadPatients(){
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    try{
      const res = await fetch('/api/doctor/patients', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const patients = await res.json();
      const select = el('#patientSelect');
      select.innerHTML = '<option value="">Select Patient</option>';
      patients.forEach(p => {
        const option = document.createElement('option');
        option.value = p._id;
        option.textContent = p.fullName;
        select.appendChild(option);
      });
    }catch(err){
      console.error('Failed to load patients', err);
    }
  }

  // Form handling
  const form = el('#prescriptionForm');
  const addItemBtn = el('#addItemBtn');

  addItemBtn.onclick = () => {
    const container = el('#itemsContainer');
    const itemGroup = document.createElement('div');
    itemGroup.className = 'item-group';
    itemGroup.innerHTML = `
      <label>Item:</label>
      <input type="text" class="item-name" placeholder="e.g. Lantus" required>
      <input type="text" class="item-dose" placeholder="e.g. 12 units morning" required>
      <input type="text" class="item-frequency" placeholder="e.g. daily" required>
      <select class="item-type" required>
        <option value="medication">Medication</option>
        <option value="insulin">Insulin</option>
        <option value="sensor">Sensor</option>
        <option value="device">Device</option>
      </select>
      <button type="button" class="remove-item">Remove</button>
    `;
    container.appendChild(itemGroup);
    itemGroup.querySelector('.remove-item').onclick = () => itemGroup.remove();
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const patientId = el('#patientSelect').value;
    const notes = el('#notes').value;
    const items = [];
    els('.item-group').forEach(group => {
      const name = group.querySelector('.item-name').value;
      const dose = group.querySelector('.item-dose').value;
      const frequency = group.querySelector('.item-frequency').value;
      const type = group.querySelector('.item-type').value;
      if(name && dose && frequency && type) items.push({ name, dose, frequency, type });
    });

    if(!patientId || items.length === 0) return alert('Please fill all fields');

    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    try{
      const res = await fetch('/api/doctor/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ patientId, items, notes })
      });
      if(res.ok){
        modal.style.display = 'none';
        form.reset();
        loadPrescriptions();
      } else {
        alert('Create failed');
      }
    }catch(err){
      console.error('Create failed', err);
    }
  };

  // Load on page load
  loadPrescriptions();
})();