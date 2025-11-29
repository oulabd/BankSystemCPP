// prescriptions-patient.js - Patient Prescriptions page
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

  if(!authGuard()) return;

  const el = sel => document.querySelector(sel);
  const els = sel => Array.from(document.querySelectorAll(sel));

  async function loadPrescriptions(){
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    try{
      const res = await fetch('/api/patient/prescriptions', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if(!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      renderPrescriptions(data.prescriptions || []);
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
      const status = pres.createdAt > new Date(Date.now() - 7*24*60*60*1000) ? 'New' : 'Active'; // New if within 7 days
      const statusClass = status === 'New' ? 'status-new' : 'status-active';
      
      card.innerHTML = `
        <div class="prescription-header">
          <h3>Prescription</h3>
          <span class="status ${statusClass}">${status}</span>
        </div>
        <div class="prescription-details">
          <p><strong>Doctor:</strong> ${pres.doctor.fullName}</p>
          <p><strong>Date:</strong> ${new Date(pres.createdAt).toLocaleDateString()}</p>
          <p><strong>Items:</strong> ${itemsText}</p>
          ${pres.notes ? `<p><strong>Notes:</strong> ${pres.notes}</p>` : ''}
        </div>
        <div class="prescription-actions">
          <button onclick="downloadPDF('${pres._id}')" class="btn btn-primary">Download PDF</button>
          <button onclick="showQR('${pres.verifyCode}')" class="btn btn-outline">Show QR</button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  window.downloadPDF = async function(id){
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const link = document.createElement('a');
    link.href = `/api/patient/prescriptions/pdf/${id}`;
    link.setAttribute('Authorization', 'Bearer ' + token);
    link.download = `prescription-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  window.showQR = function(code){
    // For simplicity, just alert the code. In real app, show QR modal
    alert(`Verification Code: ${code}\nScan QR at /verify-prescription.html?code=${code}`);
  };

  // Load on page load
  loadPrescriptions();
})();