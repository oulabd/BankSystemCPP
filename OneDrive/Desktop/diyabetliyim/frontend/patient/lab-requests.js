// lab-requests.js - Patient Lab Requests page
// Features:
// - Auth guard (patient only)
// - Fetch lab requests: GET /api/patient/labs
// - Upload result: POST /api/patient/labs/upload/:id (multipart)
// - View result file

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

  async function loadLabRequests(){
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    try{
      const res = await fetch('/api/patient/labs', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if(!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      renderLabRequests(data.requests || []);
    }catch(err){
      console.error('Failed to fetch lab requests', err);
      el('#lab-requests-list').innerHTML = '<div class="error">Failed to load lab requests</div>';
    }
  }

  function renderLabRequests(requests){
    const container = el('#lab-requests-list');
    const noResults = el('#no-lab-requests');
    
    if(requests.length === 0){
      container.innerHTML = '';
      noResults.style.display = 'block';
      return;
    }
    
    noResults.style.display = 'none';
    container.innerHTML = '';
    
    requests.forEach(req => {
      const card = document.createElement('div');
      card.className = 'lab-request-card';
      
      const statusClass = req.status === 'requested' ? 'status-requested' :
                          req.status === 'uploaded' ? 'status-uploaded' :
                          req.status === 'reviewed' ? 'status-reviewed' : '';
      const statusText = req.status === 'requested' ? 'Requested' :
                         req.status === 'uploaded' ? 'Uploaded' :
                         req.status === 'reviewed' ? 'Reviewed' : req.status;
      
      let actions = '';
      if(req.status === 'requested'){
        actions = `<input type="file" id="file-${req._id}" accept="application/pdf,image/*" style="display: none;">
                   <button onclick="document.getElementById('file-${req._id}').click()" class="btn btn-primary">Upload Result</button>
                   <button onclick="uploadResult('${req._id}')" id="upload-btn-${req._id}" class="btn btn-outline" style="display: none;">Submit</button>`;
      } else if(req.status === 'uploaded' || req.status === 'reviewed'){
        actions = `<button onclick="viewResult('${req.resultFile}')" class="btn btn-outline">View Result</button>`;
        if(req.status === 'reviewed' && req.doctorComment){
          actions += `<div class="doctor-comment"><strong>Doctor Comment:</strong> ${req.doctorComment}</div>`;
        }
      }
      
      card.innerHTML = `
        <div class="request-header">
          <h3>${req.testName}</h3>
          <span class="status ${statusClass}">${statusText}</span>
        </div>
        <div class="request-details">
          <p><strong>Requested:</strong> ${new Date(req.requestedAt).toLocaleDateString()}</p>
          ${req.dueDate ? `<p><strong>Due:</strong> ${new Date(req.dueDate).toLocaleDateString()}</p>` : ''}
          ${req.notes ? `<p><strong>Notes:</strong> ${req.notes}</p>` : ''}
        </div>
        <div class="request-actions">
          ${actions}
        </div>
      `;
      container.appendChild(card);
    });
  }

  window.uploadResult = async function(id){
    const fileInput = document.getElementById(`file-${id}`);
    const file = fileInput.files[0];
    if(!file){
      alert('Please select a file');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const uploadBtn = document.getElementById(`upload-btn-${id}`);
    uploadBtn.textContent = 'Uploading...';
    uploadBtn.disabled = true;
    
    try{
      const res = await fetch(`/api/patient/labs/upload/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
      });
      if(res.ok){
        alert('Result uploaded successfully');
        loadLabRequests(); // Reload the list
      } else {
        const error = await res.json();
        alert(error.error || 'Upload failed');
      }
    }catch(err){
      console.error('Upload failed', err);
      alert('Upload failed');
    } finally {
      uploadBtn.textContent = 'Submit';
      uploadBtn.disabled = false;
    }
  };

  window.viewResult = function(fileUrl){
    window.open(`/${fileUrl}`, '_blank');
  };

  // Handle file selection
  document.addEventListener('change', function(e){
    if(e.target.type === 'file' && e.target.id.startsWith('file-')){
      const id = e.target.id.replace('file-', '');
      const uploadBtn = document.getElementById(`upload-btn-${id}`);
      if(e.target.files.length > 0){
        uploadBtn.style.display = 'inline-block';
      } else {
        uploadBtn.style.display = 'none';
      }
    }
  });

  // Load on page load
  loadLabRequests();
})();