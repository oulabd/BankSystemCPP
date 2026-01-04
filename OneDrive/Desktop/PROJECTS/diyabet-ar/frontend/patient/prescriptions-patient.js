
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
      const API_BASE = window.API_BASE || 'http://localhost:3001/api';
      const res = await fetch(API_BASE + '/patient/prescriptions', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if(!res.ok) throw new Error('فشل التحميل');
      const data = await res.json();
      console.log('[Patient] /api/patient/prescriptions response:', data);
      renderPrescriptions(data.prescriptions || data || []);
    }catch(err){
      console.error('تعذر الحصول على الوصفات', err);
      const container = el('#prescriptions-list');
      if(container) {
        container.innerHTML = '<div class="error">تعذر تحميل الوصفات</div>';
      }
    }
  }

  function renderPrescriptions(prescriptions){
    const container = el('#prescriptions-list');
    const noResults = el('#no-prescriptions');
    
    if(!container || !noResults) {
      console.error('Required DOM elements not found: #prescriptions-list or #no-prescriptions');
      return;
    }
    
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

      const itemsText = (pres.items || []).map(item => `${item.name} (${item.dose})`).join(', ');
      const status = pres.createdAt > new Date(Date.now() - 7*24*60*60*1000) ? 'جديد' : 'نشط'; // New if within 7 days
      const statusClass = status === 'جديد' ? 'status-new' : 'status-active';

      let doctorName = 'لا توجد معلومات عن الطبيب';
      if (pres.doctor && pres.doctor.fullName) doctorName = pres.doctor.fullName;
      else if (pres.doctorId && pres.doctorId.fullName) doctorName = pres.doctorId.fullName;
      else if (typeof pres.doctorId === 'string') doctorName = pres.doctorId;

      card.innerHTML = `
        <div class="prescription-header">
          <h3>وصفة طبية</h3>
          <span class="status ${statusClass}">${status}</span>
        </div>
        <div class="prescription-details">
          <p><strong>الطبيب:</strong> ${doctorName}</p>
          <p><strong>التاريخ:</strong> ${new Date(pres.createdAt).toLocaleDateString()}</p>
          <p><strong>الأدوية:</strong> ${itemsText}</p>
          ${pres.notes ? `<p><strong>ملاحظات:</strong> ${pres.notes}</p>` : ''}
        </div>
        <div class="prescription-actions">
          <button onclick="showQR('${pres.verificationCode}', '${pres._id}')" class="btn btn-outline" data-id="${pres._id}">إظهار QR</button>
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
    if (!code) {
      alert('لم يتم العثور على رمز التحقق!');
      return;
    }
    // Support new signature: showQR(code, id)
    let presId = arguments[1];
    if (!presId) {
      // fallback: try to find by data-id
      const btn = document.querySelector(`button.btn-outline[onclick*="showQR('${code}"]`);
      if (btn && btn.dataset.id) presId = btn.dataset.id;
    }
    if (!presId) {
      presId = prompt('لم يتم العثور على معرف الوصفة، يرجى إدخاله:', '');
      if (!presId) return;
    }
      const token = localStorage.getItem('authToken') || '';
      fetch(`/api/patient/prescriptions/${presId}/qr`, {
        headers: { 'Authorization': 'Bearer ' + token }
      })
        .then(res => res.json())
        .then(data => {
          let modal = document.getElementById('qrModal');
          if (!modal) {
            modal = document.createElement('div');
            modal.id = 'qrModal';
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
              <div style="background:#fff;padding:24px 32px;border-radius:8px;min-width:320px;max-width:90vw;position:relative;text-align:center;">
                <button id="closeQRModal" style="position:absolute;top:8px;right:8px;font-size:18px;">&times;</button>
                <h2>رمز التحقق من الوصفة</h2>
                <img id="qrImg" alt="QR Code" style="width:200px;height:200px;"><br>
                <div style="margin:12px 0;font-size:16px;"><b>الرمز:</b> <span id="qrCodeValue"></span></div>
                <button id="printQRBtn" style="margin-top:8px;">طباعة</button>
              </div>
            `;
            document.body.appendChild(modal);
          }
          setTimeout(() => {
            document.getElementById('qrImg').src = data.qrDataUrl;
            document.getElementById('qrCodeValue').textContent = data.code;
          }, 0);
          modal.style.display = 'flex';
          document.getElementById('closeQRModal').onclick = () => { modal.style.display = 'none'; };
          document.getElementById('printQRBtn').onclick = () => {
            const printWindow = window.open('', '', 'width=400,height=500');
            printWindow.document.write(`<html><head><title>طباعة رمز QR</title></head><body style='text-align:center;'>` +
              `<h2>رمز التحقق من الوصفة</h2>` +
              `<img src='${data.qrDataUrl}' style='width:200px;height:200px;'><br>` +
              `<div style='margin:12px 0;font-size:16px;'><b>الرمز:</b> ${data.code}</div>` +
              `</body></html>`);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
          };
        });
  };

  // Load on page load
  loadPrescriptions();

  // Listen for language changes and re-render
 
})();