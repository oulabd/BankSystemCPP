
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
      const res = await fetch(`${window.API_BASE}/doctor/prescriptions`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if(!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      console.log('[Doctor] /doctor/prescriptions response:', data);
      renderPrescriptions(data.prescriptions || data || []);
    }catch(err){
      console.error('Failed to fetch prescriptions', err);
      el('#prescriptions-list').innerHTML = '<div class="error">تعذر تحميل الوصفات</div>';
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
          <span class="date">${new Date(pres.createdAt).toLocaleDateString('ar-SA')}</span>
        </div>
        <div class="prescription-details">
          <p><strong>المنتجات:</strong> ${itemsText}</p>
          ${pres.notes ? `<p><strong>ملاحظات:</strong> ${pres.notes}</p>` : ''}
        </div>
        <div class="prescription-actions">
          <button onclick="downloadPDF('${pres._id}')" class="btn btn-outline">تحميل PDF</button>
          <button onclick="showQR('${pres.verificationCode}')" class="btn btn-outline">عرض رمز QR</button>
          <button onclick="deletePrescription('${pres._id}')" class="btn btn-danger">حذف</button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  window.downloadPDF = async function(id){
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const link = document.createElement('a');
    link.href = `${window.API_BASE}/doctor/prescriptions/pdf/${id}`;
    link.setAttribute('Authorization', 'Bearer ' + token);
    link.download = `recete-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  window.deletePrescription = async function(id){
    if(!confirm('هل أنت متأكد من رغبتك في حذف هذه الوصفة؟')) return;
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    try{
      const res = await fetch(`${window.API_BASE}/doctor/prescriptions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if(res.ok){
        loadPrescriptions();
      } else {
        alert('فشلت عملية الحذف');
      }
    }catch(err){
      console.error('فشلت عملية الحذف', err);
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
      select.innerHTML = '<option value="">اختر المريض</option>';
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
      <label>المنتج:</label>
      <input type="text" class="item-name" placeholder="مثال: لانتوس" required>
      <input type="text" class="item-dose" placeholder="مثال: 12 وحدة صباحاً" required>
      <input type="text" class="item-frequency" placeholder="مثال: يومياً" required>
      <select class="item-type" required>
        <option value="medication">دواء</option>
        <option value="insulin">أنسولين</option>
        <option value="sensor">جهاز استشعار</option>
        <option value="device">جهاز</option>
      </select>
      <button type="button" class="remove-item">إزالة</button>
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

    if(!patientId || items.length === 0) return alert('يرجى ملء جميع الحقول');

    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    try{
      const res = await fetch(`${window.API_BASE}/doctor/prescriptions`, {
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
        alert('فشل الإنشاء');
      }
    }catch(err){
      console.error('Create failed', err);
    }
  };

  // Load on page load
  loadPrescriptions();
  })();
  
    window.showQR = function(code){
      if (!code) {
        alert('لم يتم العثور على رمز التحقق!');
        return;
      }
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
            <div id="qrCodeContainer"></div>
            <div style="margin:12px 0;font-size:16px;"><b>الرمز:</b> <span id="qrCodeValue"></span></div>
            <button id="printQRBtn" style="margin-top:8px;">طباعة</button>
          </div>
        `;
        document.body.appendChild(modal);
      }
      document.getElementById('qrCodeValue').textContent = code;
      // Generate QR code using Google Chart API (no dependency)
      const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(window.location.origin + '/verify-prescription.html?code=' + code)}`;
      document.getElementById('qrCodeContainer').innerHTML = `<img src="${qrUrl}" alt="QR Code" style="width:200px;height:200px;">`;
      modal.style.display = 'flex';
      document.getElementById('closeQRModal').onclick = () => { modal.style.display = 'none'; };
      document.getElementById('printQRBtn').onclick = () => {
        const printWindow = window.open('', '', 'width=400,height=500');
        printWindow.document.write(`<html><head><title>طباعة رمز QR</title></head><body style='text-align:center;'>` +
          `<h2>رمز التحقق من الوصفة</h2>` +
          `<img src='${qrUrl}' style='width:200px;height:200px;'><br>` +
          `<div style='margin:12px 0;font-size:16px;'><b>الرمز:</b> ${code}</div>` +
          `<div>للتحقق من رمز QR: <br>${window.location.origin}/verify-prescription.html?code=${code}</div>` +
          `</body></html>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      };
    };