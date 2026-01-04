const commentsBox = document.getElementById('doctorCommentsBox');
// Edit Instruction Modal
function openEditInstructionModal(instructionId) {
  const patientId = new URLSearchParams(window.location.search).get('patientId');
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  fetch(`${window.API_BASE}/doctor/patient/${patientId}/instructions`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(instructions => {
      const instr = instructions.find(i => i._id === instructionId);
      if (!instr) return alert('لم يتم العثور على التعليمات');
      let modal = document.getElementById('editInstructionModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'editInstructionModal';
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-content">
            <span class="close" id="closeEditInstructionModal">&times;</span>
            <h3>تعديل التعليمات</h3>
            <textarea id="editInstructionText" rows="4"></textarea>
            <button id="saveEditInstructionBtn" class="action-btn">حفظ</button>
          </div>
        `;
        document.body.appendChild(modal);
      }
      document.getElementById('editInstructionText').value = instr.text;
      modal.style.display = 'flex';
      document.getElementById('closeEditInstructionModal').onclick = () => { modal.style.display = 'none'; };
      document.getElementById('saveEditInstructionBtn').onclick = async () => {
        const newText = document.getElementById('editInstructionText').value.trim();
        if (!newText) return alert('لا يمكن أن تكون التعليمات فارغة');
        try {
          const res = await fetch(`${window.API_BASE}/doctor/patient/${patientId}/instructions/${instructionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ text: newText })
          });
          if (res.ok) {
            modal.style.display = 'none';
            await showInstructionsTable();
          } else {
            alert('فشل تحديث التعليمات');
          }
        } catch (err) {
          alert('حدث خطأ أثناء تحديث التعليمات');
        }
      };
    });
}

// Delete Instruction
async function deleteInstruction(instructionId) {
  if (!confirm('هل أنت متأكد من رغبتك في حذف هذه التعليمات؟')) return;
  const patientId = new URLSearchParams(window.location.search).get('patientId');
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  try {
    const res = await fetch(`${window.API_BASE}/doctor/patient/${patientId}/instructions/${instructionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      await showInstructionsTable();
    } else {
      alert('فشل حذف التعليمات');
    }
  } catch (err) {
    alert('حدث خطأ أثناء حذف التعليمات');
  }
}
// --- Prescription Edit Modal HTML Injection ---
if (!document.getElementById('editPrescriptionModal')) {
  const modalDiv = document.createElement('div');
  modalDiv.id = 'editPrescriptionModal';
  modalDiv.style.display = 'none';
  modalDiv.style.position = 'fixed';
  modalDiv.style.top = '0';
  modalDiv.style.left = '0';
  modalDiv.style.width = '100vw';
  modalDiv.style.height = '100vh';
  modalDiv.style.background = 'rgba(0,0,0,0.5)';
  modalDiv.style.alignItems = 'center';
  modalDiv.style.justifyContent = 'center';
  modalDiv.innerHTML = `
    <div style="background:#fff;padding:24px 32px;border-radius:8px;min-width:320px;max-width:90vw;position:relative;text-align:left;">
      <h2>تعديل الوصفة</h2>
      <form id="editPrescriptionForm">
        <label>اسم الدواء: <input type="text" id="editName" required></label><br><br>
        <label>النوع: <input type="text" id="editType" required></label><br><br>
        <label>الجرعة: <input type="text" id="editDose" required></label><br><br>
        <label>المدة: <input type="text" id="editDuration"></label><br><br>
        <label>ملاحظات: <textarea id="editNotes"></textarea></label><br><br>
        <input type="hidden" id="editPrescriptionId">
        <button type="submit">حفظ</button>
        <button type="button" id="closeEditPrescriptionModal">إلغاء</button>
      </form>
    </div>
  `;
  document.body.appendChild(modalDiv);
}
// --- Edit Modal Logic ---
function openEditPrescriptionModal(prescription) {
  document.getElementById('editPrescriptionId').value = prescription._id;
  document.getElementById('editName').value = prescription.name || '';
  document.getElementById('editType').value = prescription.type || '';
  document.getElementById('editDose').value = prescription.dose || '';
  document.getElementById('editDuration').value = prescription.duration || '';
  document.getElementById('editNotes').value = prescription.notes || '';
  document.getElementById('editPrescriptionModal').style.display = 'flex';
}
document.getElementById('closeEditPrescriptionModal').onclick = function() {
  document.getElementById('editPrescriptionModal').style.display = 'none';
};
document.getElementById('editPrescriptionForm').onsubmit = async function(e) {
  e.preventDefault();
  const id = document.getElementById('editPrescriptionId').value;
  const name = document.getElementById('editName').value;
  const type = document.getElementById('editType').value;
  const dose = document.getElementById('editDose').value;
  const duration = document.getElementById('editDuration').value;
  const notes = document.getElementById('editNotes').value;
  const token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
  const res = await fetch(`${window.API_BASE}/doctor/prescriptions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ name, type, dose, duration, notes })
  });
  if (res.ok) {
    alert('تم تحديث الوصفة');
    document.getElementById('editPrescriptionModal').style.display = 'none';
    location.reload();
  } else {
    alert('فشل تحديث الوصفة');
  }
};
// --- Kimlik No Edit Logic ---
// Instruction modal logic
// i18n kaldırıldı
function openInstructionModal() {
  document.getElementById('instructionModal').style.display = 'flex';
}
function closeInstructionModal() {
  document.getElementById('instructionModal').style.display = 'none';
}

// Fetch and display all instructions in a table
async function showInstructionsTable() {
  const patientId = new URLSearchParams(window.location.search).get('patientId');
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  // Doctor instructions section removed as requested.
}

// ...existing code...

// ...existing code...

async function saveInstruction() {
  const text = document.getElementById('instructionText').value.trim();
  if (!text) {
    alert('الرجاء إدخال تعليمات.');
    return;
  }
  const patientId = new URLSearchParams(window.location.search).get('patientId');
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  try {
    const response = await fetch(`${window.API_BASE}/doctor/patient/${patientId}/instruction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ text })
    });
    if (response.ok) {
      const result = await response.json();
      showInstruction(result.text);
      closeInstructionModal();
    } else {
      alert('فشل حفظ التعليمات.');
    }
  } catch (err) {
    alert('حدث خطأ أثناء حفظ التعليمات.');
  }
}

function showInstruction(text) {
  let container = document.getElementById('instructionDisplay');
  if (!container) {
    container = document.createElement('div');
    container.id = 'instructionDisplay';
    container.className = 'instruction-display';
    const main = document.querySelector('.patient-details-wrapper') || document.body;
    main.insertBefore(container, main.firstChild.nextSibling);
  }
  container.innerHTML = `<div class="instruction-box"><strong>التعليمات:</strong> ${text}</div>`;
}
// frontend/doctor/doctor-patient-details.js

class PatientDetails {
  constructor() {
    const params = new URLSearchParams(window.location.search);
    this.patientId = params.get('patientId') || params.get('id');
    if (!this.patientId) {
      alert('لم يتم العثور على معرف المريض');
      window.history.back();
      return;
    }
    this.init();
  }

  async init() {
    await this.loadPatientDetails();
    await showInstructionsTable(); // Show instructions on page load
    this.bindEvents();
  }

  async loadPatientDetails() {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${window.API_BASE}/doctor/patient/${this.patientId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        window._lastPatientInfo = data.patient; // Store globally for report
        this.renderPatientInfo(data.patient);
        this.renderLastRecord(data.lastRecord);
        this.renderHistory(data.history);
        await this.loadPrescriptions();
      } else {
        console.error('Failed to load patient details:', response.status, response.statusText);
        document.getElementById('patientInfo').textContent = 'فشل تحميل تفاصيل المريض';
      }
    } catch (err) {
      console.error('Failed to load patient details', err);
      document.getElementById('patientInfo').textContent = 'حدث خطأ أثناء تحميل البيانات';
    }
  }

  renderPatientInfo(patient) {
    const infoDiv = document.getElementById('patientInfo');
    const patientNameHeader = document.getElementById('patientName');
    patientNameHeader.textContent = patient.fullName;
    
      const kimlik = patient.identityNumber && patient.identityNumber !== 'null' && patient.identityNumber !== '' ? patient.identityNumber : 'غير محدد';
    const dogum = patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : 'غير محدد';
    const phone = patient.phone && patient.phone !== 'null' && patient.phone !== '' ? patient.phone : 'غير محدد';
    infoDiv.innerHTML = `
      <div class="info-item">
        <strong>الاسم الكامل:</strong>
        <span>${patient.fullName}</span>
      </div>
      <div class="info-item">
        <strong>رقم الهوية:</strong>
          <span id="kimlikValue">${kimlik}</span>
      </div>
      <div class="info-item">
        <strong>تاريخ الميلاد:</strong>
        <span>${dogum}</span>
      </div>
      <div class="info-item">
        <strong>الهاتف:</strong>
        <span>${phone}</span>
      </div>
      <div class="info-item">
        <strong>العنوان:</strong>
        <span>${patient.address || 'لا يوجد'}</span>
      </div>
    `;
  }

  renderLastRecord(lastRecord) {
    const recordDiv = document.getElementById('lastRecord');
    
    if (!lastRecord || !lastRecord.value) {
      recordDiv.innerHTML = '<p class="no-data">لا يوجد سجل قياس بعد</p>';
      return;
    }
    
    const statusClass = lastRecord.status === 'critical_high' ? 'critical_high' :
                        lastRecord.status === 'risk_low' ? 'risk_low' :
                        lastRecord.status === 'normal' ? 'normal' : 'none';
    const statusText = lastRecord.status === 'critical_high' ? 'مرتفع' :
               lastRecord.status === 'risk_low' ? 'منخفض' :
               lastRecord.status === 'normal' ? 'طبيعي' : 'لا توجد بيانات';
    recordDiv.innerHTML = `
      <div class="info-item">
        <strong>متوسط القيمة:</strong>
        <span>${lastRecord.value} mg/dL</span>
      </div>
      <div class="info-item">
        <strong>الوقت:</strong>
        <span>${new Date(lastRecord.timestamp).toLocaleString()}</span>
      </div>
      <div style="margin-top: 12px;">
        <span class="status ${statusClass}">${statusText}</span>
      </div>
    `;
  }

  async renderHistory(history) {
    const tableDiv = document.getElementById('historyTable');
    if (!Array.isArray(history) || history.length === 0) {
      tableDiv.innerHTML = '<p class="no-data">لم يتم العثور على سجلات</p>';
      return;
    }

    // Fetch doctor notes for this patient
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    let doctorNotes = [];
    try {
      const response = await fetch(`${window.API_BASE}/doctor/patient/${this.patientId}/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        doctorNotes = await response.json();
      }
    } catch (err) {
      console.error('Failed to fetch doctor notes', err);
    }

    // Map notes by record id or date
    const notesByDay = {};
    const notesByDayFull = {};
    doctorNotes.forEach(note => {
      if (note.record && note.record.day) {
        const day = new Date(note.record.day).toLocaleDateString();
        if (!notesByDay[day]) notesByDay[day] = [];
        if (!notesByDayFull[day]) notesByDayFull[day] = [];
        notesByDay[day].push(note.text);
        notesByDayFull[day].push(note);
      }
    });

    let tableHTML = `
      <div class="history-table-wrap">
      <table class="history-table">
        <thead>
          <tr>
            <th rowspan="2">التاريخ</th>
            <th rowspan="2">صائم</th>
            <th colspan="3">الإفطار</th>
            <th colspan="3">الغداء</th>
            <th colspan="3">العشاء</th>
            <th colspan="3">وجبات خفيفة</th>
            <th colspan="2">الليل</th>
            <th colspan="4">الأنسولين</th>
            <th rowspan="2">ملاحظة الطبيب</th>
            <th rowspan="2">إجراءات</th>
          </tr>
          <tr>
            <th>قبل</th><th>بعد</th><th>كربوهيدرات</th>
            <th>قبل</th><th>بعد</th><th>كربوهيدرات</th>
            <th>قبل</th><th>بعد</th><th>كربوهيدرات</th>
            <th>1</th><th>2</th><th>3</th>
            <th>00:00</th><th>03:00</th>
            <th>الإفطار</th><th>الغداء</th><th>العشاء</th><th>Lantus</th>
          </tr>
        </thead>
        <tbody>
    `;
    history.forEach(record => {
      const displayDate = record.day || record.createdAt || record.date;
      const dayStr = new Date(displayDate).toLocaleDateString();
      let hasNote = false;
      if (notesByDayFull[dayStr] && notesByDayFull[dayStr].length > 0) {
        hasNote = true;
      }
      tableHTML += `
        <tr>
          <td>${dayStr}</td>
          <td>${record.fasting ?? '-'}</td>
          <td>${record.beforeBreakfast ?? '-'}</td>
          <td>${record.afterBreakfast ?? '-'}</td>
          <td>${record.breakfastCarbs ?? '-'}</td>
          <td>${record.beforeLunch ?? '-'}</td>
          <td>${record.afterLunch ?? '-'}</td>
          <td>${record.lunchCarbs ?? '-'}</td>
          <td>${record.beforeDinner ?? '-'}</td>
          <td>${record.afterDinner ?? '-'}</td>
          <td>${record.dinnerCarbs ?? '-'}</td>
          <td>${record.snack1 ?? '-'}</td>
          <td>${record.snack2 ?? '-'}</td>
          <td>${record.snack3 ?? '-'}</td>
          <td>${record.measurement_12am ?? '-'}</td>
          <td>${record.measurement_3am ?? '-'}</td>
          <td>${record.breakfastInsulin ?? '-'}</td>
          <td>${record.lunchInsulin ?? '-'}</td>
          <td>${record.dinnerInsulin ?? '-'}</td>
          <td>${hasNote ? 'موجود' : '-'}</td>
          <td style="text-align:right;">
            <button class="action-btn add-note-btn" data-record-id="${record._id}" data-record-day="${dayStr}" data-has-note="${hasNote}" style="margin:4px 0 8px 0;">${hasNote ? 'تعديل' : 'إضافة تعليمات'}</button>
          </td>
        </tr>
      `;
    });
    tableHTML += '</tbody></table></div>';
    tableDiv.innerHTML = tableHTML;

    // Add event listeners for Talimat Ekle/Düzenle buttons
    tableDiv.querySelectorAll('.add-note-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const recordId = btn.getAttribute('data-record-id');
        const recordDay = btn.getAttribute('data-record-day');
        const hasNote = btn.getAttribute('data-has-note') === 'true';
        this.openNoteModal(recordId, recordDay, hasNote);
      });
    });
    // Add event listeners for delete note buttons
    // Render all doctor comments in a new box
    if (commentsBox) {
      const allNotes = [];
      Object.values(notesByDayFull).forEach(arr => arr.forEach(note => allNotes.push(note)));
      if (allNotes.length === 0) {
        commentsBox.style.display = 'none';
        commentsBox.innerHTML = '';
      } else {
        commentsBox.style.display = 'block';
        let commentsHTML = '<h3>تعليقات الطبيب</h3>';
        commentsHTML += allNotes.map(note =>
          `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="flex:1;">${note.text}</span>
            <button class="delete-note-btn" data-note-id="${note._id}" style="background:#e74c3c;color:#fff;border:none;padding:2px 8px;border-radius:4px;cursor:pointer;">حذف</button>
          </div>`
        ).join('');
        commentsBox.innerHTML = commentsHTML;
        // Add event listeners for delete note buttons in the box
        commentsBox.querySelectorAll('.delete-note-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const noteId = btn.getAttribute('data-note-id');
            if (!confirm('هل أنت متأكد من رغبتك في حذف التعليق؟')) return;
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            try {
              const response = await fetch(`${window.API_BASE}/doctor/review/${noteId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });
              if (response.ok) {
                btn.disabled = true;
                btn.textContent = 'تم الحذف';
                btn.style.background = '#aaa';
                btn.style.cursor = 'not-allowed';
                setTimeout(() => this.loadPatientDetails(), 500);
              } else {
                alert('فشل حذف التعليق.');
              }
            } catch (err) {
              alert('حدث خطأ أثناء حذف التعليق.');
            }
          });
        });
      }
    }
  }

  openNoteModal(recordId, recordDay, hasNote) {
    // Create modal if not exists
    let modal = document.getElementById('noteModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'noteModal';
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
        <div style="background:#fff;padding:24px 32px;border-radius:8px;min-width:320px;max-width:90vw;position:relative;text-align:left;">
          <h3>${hasNote ? 'تعديل الملاحظة' : 'إضافة ملاحظة'} (${recordDay})</h3>
          <textarea id="noteText" rows="4" style="width:100%;margin-bottom:12px;"></textarea><br>
          <button id="saveNoteBtn" class="action-btn">حفظ</button>
          <button id="closeNoteModalBtn" class="action-btn" style="background:#ccc;color:#222;margin-left:8px;">إلغاء</button>
        </div>
      `;
      document.body.appendChild(modal);
    } else {
      modal.querySelector('h3').textContent = `${hasNote ? 'تعديل الملاحظة' : 'إضافة ملاحظة'} (${recordDay})`;
      modal.querySelector('#noteText').value = '';
    }
    // If editing, fetch and fill the note
    if (hasNote) {
      // Find the note for this day and fill it
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      fetch(`${window.API_BASE}/doctor/patient/${this.patientId}/notes`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : [])
        .then(notes => {
          const note = notes.find(n => n.record && new Date(n.record.day).toLocaleDateString() === recordDay);
          if (note) modal.querySelector('#noteText').value = note.text;
        });
    }
    modal.style.display = 'flex';
    // Close button
    modal.querySelector('#closeNoteModalBtn').onclick = () => { modal.style.display = 'none'; };
    // Save button
    modal.querySelector('#saveNoteBtn').onclick = async () => {
      const text = modal.querySelector('#noteText').value.trim();
      if (!text) { alert('الرجاء إدخال ملاحظة.'); return; }
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      try {
        const response = await fetch(`${window.API_BASE}/doctor/review/${recordId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ text })
        });
        if (response.ok) {
          alert('تم حفظ الملاحظة بنجاح.');
          modal.style.display = 'none';
          // Refresh table to show new note
          this.loadPatientDetails();
        } else {
          alert('فشل حفظ الملاحظة');
        }
      } catch (err) {
        alert('حدث خطأ أثناء حفظ الملاحظة');
      }
    };
  }

  async loadPrescriptions() {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${window.API_BASE}/doctor/prescriptions/patient/${this.patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const prescriptions = await response.json();
        this.renderPrescriptions(prescriptions);
      } else {
        document.getElementById('prescriptionsList').textContent = 'فشل تحميل الوصفات';
      }
    } catch (err) {
      console.error('Failed to load prescriptions', err);
      document.getElementById('prescriptionsList').textContent = 'حدث خطأ أثناء تحميل الوصفات';
    }
  }

  renderPrescriptions(prescriptions) {
    const listDiv = document.getElementById('prescriptionsList');
    if (prescriptions.length === 0) {
      listDiv.innerHTML = '<p>لم يتم العثور على وصفة مسجلة</p>';
      return;
    }
    let tableHTML = `
      <table>
        <thead>
          <tr>
            <th>اسم الدواء</th>
            <th>النوع</th>
            <th>الجرعة</th>
            <th>المدة</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
    `;
    prescriptions.forEach(prescription => {
      tableHTML += `
        <tr>
          <td>${prescription.name}</td>
          <td>${prescription.type}</td>
          <td>${prescription.dose}</td>
          <td>${prescription.duration}</td>
          <td>
            <button onclick="showQRDoctor('${prescription.verificationCode}', '${prescription._id}')" class="btn btn-outline" data-id="${prescription._id}">عرض QR</button>
            <button onclick="deletePrescription('${prescription._id}')">حذف</button>
          </td>
        </tr>
      `;
    });
    // Doctor QR modal logic (reuses patient QR endpoint)
    function showQRDoctor(code, id) {
      if (!code) {
        alert('لم يتم العثور على رمز التحقق!');
        return;
      }
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
      fetch(`${window.API_BASE}/patient/prescriptions/${id}/qr`, {
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
              <div style=\"background:#fff;padding:24px 32px;border-radius:8px;min-width:320px;max-width:90vw;position:relative;text-align:center;\">
                <button id=\"closeQRModal\" style=\"position:absolute;top:8px;right:8px;font-size:18px;\">&times;</button>
                <h2>رمز التحقق من الوصفة</h2>
                <img id=\"qrImg\" alt=\"QR Code\" style=\"width:200px;height:200px;\"><br>
                <div style=\"margin:12px 0;font-size:16px;\"><b>الرمز:</b> <span id=\"qrCodeValue\"></span></div>
                <button id=\"printQRBtn\" style=\"margin-top:8px;\">طباعة</button>
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
    }
    // ...existing code...
    // Make showQRDoctor globally available for button onclick (must be at the very end)
    window.showQRDoctor = showQRDoctor;
    tableHTML += '</tbody></table>';
    listDiv.innerHTML = tableHTML;
  }

  async downloadReport() {
    const lang = localStorage.getItem('lang') || 'tr';
    const url = `${window.API_BASE}/api/patient/${this.patientId}/export?lang=${lang}`;
    const token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'فشل تحميل التقرير');
        return;
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `hasta_raporu.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('فشل تحميل التقرير');
    }
  }

  bindEvents() {
    // Removed addInstructionBtn binding since button is deleted
    document.getElementById('requestLabBtn').onclick = () => window.location.href = `doctor-lab-request.html?patientId=${this.patientId}`;
    document.getElementById('reviewLabBtn').onclick = () => window.location.href = `labs.html?patientId=${this.patientId}`;
    document.getElementById('createPrescriptionBtn').onclick = () => window.location.href = `doctor-prescription.html?patientId=${this.patientId}`;
    // document.getElementById('medicalLogsBtn').onclick = () => window.location.href = `doctor-medical-logs.html?patientId=${this.patientId}`;
    document.getElementById('downloadReportBtn').onclick = () => showPrintableReport();
    // Modal close/print
    document.getElementById('closeReportModal').onclick = () => {
      document.getElementById('reportModal').style.display = 'none';
      document.body.style.overflow = '';
    };
    document.getElementById('printReportBtn').onclick = () => {
      window.print();
    };
  }
} // Close PatientDetails class

// Show printable report modal (global function, not inside class)
function showPrintableReport() {
  const p = window._lastPatientInfo || {};
  const kimlik = p.identityNumber && p.identityNumber !== 'null' && p.identityNumber !== '' ? p.identityNumber : 'غير محدد';
  const dogum = p.birthDate ? new Date(p.birthDate).toLocaleDateString() : 'غير محدد';
  const phone = p.phone && p.phone !== 'null' && p.phone !== '' ? p.phone : 'غير محدد';
  const address = p.address || 'لا يوجد';
  const gender = p.gender || '-';
  const fullName = p.fullName || '-';
  const reportHtml = `
<div class="report">
  <header class="report-header">
    <div>
      <div class="title">التقرير الطبي / التقرير الصحي</div>
      <div class="meta">
        <span>رقم التقرير: <b id="repNo">RP-000123</b></span>
        <span>التاريخ-الوقت: <b id="repDate">${new Date().toLocaleString()}</b></span>
      </div>
      <div class="meta">
        <span>المؤسسة: <b id="repOrg">عيادة صديقي السكر</b></span>
        <span>القسم/العيادة: <b id="repDept">الغدد الصماء</b></span>
      </div>
    </div>
    <div class="qr-box">
      <div class="qr">QR</div>
      <div class="verify">التحقق: <b id="repCode">tdfjlk5j...</b></div>
    </div>
  </header>
  <section class="block">
    <div class="block-title">معلومات المريض</div>
    <div class="grid">
      <div><span>الاسم الكامل</span><b id="pName">${fullName}</b></div>
      <div><span>رقم الهوية/جواز السفر</span><b id="pId">${kimlik}</b></div>
      <div><span>تاريخ الميلاد</span><b id="pDob">${dogum}</b></div>
      <div><span>الجنس</span><b id="pGender">${gender}</b></div>
      <div><span>الهاتف</span><b id="pPhone">${phone}</b></div>
      <div class="full"><span>العنوان</span><b id="pAddress">${address}</b></div>
    </div>
  </section>
  <section class="block">
    <div class="block-title">معلومات الطبيب</div>
    <div class="grid">
      <div><span>الاسم الكامل</span><b id="dName">...</b></div>
      <div><span>التخصص</span><b id="dBranch">...</b></div>
      <div><span>رقم التسجيل</span><b id="dReg">...</b></div>
    </div>
  </section>
  <section class="block">
    <div class="block-title">المراجعة / الشكوى</div>
    <div class="text" id="complaint">...</div>
  </section>
  <section class="block">
    <div class="block-title">التاريخ الطبي</div>
    <div class="text" id="history">...</div>
  </section>
  <section class="block">
    <div class="block-title">نتائج الفحص السريري</div>
    <div class="text" id="exam">...</div>
  </section>
  <section class="block">
    <div class="block-title">التشخيص(ات) (ICD-10)</div>
    <ol class="list" id="diagnoses">
      <li>...</li>
    </ol>
  </section>
  <section class="block">
    <div class="block-title">نتائج الفحوصات / المختبر</div>
    <table class="table" id="labs">
      <thead>
        <tr><th>الفحص</th><th>النتيجة</th><th>الوحدة</th><th>المرجع</th><th>التاريخ</th></tr>
      </thead>
      <tbody>
        <tr><td>HbA1c</td><td>...</td><td>%</td><td>...</td><td>...</td></tr>
      </tbody>
    </table>
  </section>
  <section class="block">
    <div class="block-title">العلاج / الخطة</div>
    <div class="text" id="plan">...</div>
  </section>
  <section class="block">
    <div class="block-title">النتيجة / التقييم</div>
    <div class="text" id="assessment">...</div>
  </section>
  <footer class="report-footer">
    <div class="sign">
      <div>توقيع الطبيب</div>
      <div class="line"></div>
      <div class="small" id="doctorStamp">ختم</div>
    </div>
    <div class="small note">
      تم إعداد هذا التقرير بناءً على الفحص والنتائج الحالية.
    </div>
  </footer>
</div>
`;
  document.getElementById('reportContent').innerHTML = reportHtml;
  document.getElementById('reportModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
// Global functions for prescription actions
async function editPrescription(id) {
  // Fetch prescription details and open modal
  const token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
  const res = await fetch(`${window.API_BASE}/doctor/prescriptions/${id}`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (res.ok) {
    const prescription = await res.json();
    openEditPrescriptionModal(prescription);
  } else {
    alert('فشل الحصول على معلومات الوصفة');
  }
}

async function deletePrescription(id) {
  if (!confirm('هل أنت متأكد من رغبتك في حذف هذه الوصفة؟')) return;
  
  try {
    const response = await fetch(`${window.API_BASE}/doctor/prescriptions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (response.ok) {
      alert('تم حذف الوصفة بنجاح');
      location.reload(); // Refresh to update the list
    } else {
      alert('فشل حذف الوصفة');
    }
  } catch (err) {
    console.error('Error deleting prescription', err);
    alert('حدث خطأ أثناء حذف الوصفة');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new PatientDetails();
});

// New insulin adjustment feature
async function saveInsulinAdjustment() {
  const dose = document.getElementById('insulinDose').value.trim();
  const frequency = document.getElementById('insulinFrequency').value.trim();
  const duration = document.getElementById('insulinDuration').value.trim();
  const notes = document.getElementById('insulinNotes').value.trim();
  
  if (!dose || !frequency || !duration) {
    alert('الرجاء ملء جميع الحقول.');
    return;
  }
  
  const patientId = new URLSearchParams(window.location.search).get('patientId');
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  try {
    const response = await fetch(`${window.API_BASE}/doctor/patient/${patientId}/insulin-adjustment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        patientId: patientId,
        items: [
          {
            type: "insulin_fast",
            name: "apidra",
            dose: dose,
            frequency: frequency,
            duration: duration
          }
        ],
        notes: notes
      })
    });
    if (response.ok) {
      alert('تم حفظ تعديل الأنسولين بنجاح');
      location.reload();
    } else {
      alert('فشل حفظ تعديل الأنسولين');
    }
  } catch (err) {
    alert('حدث خطأ أثناء حفظ تعديل الأنسولين');
  }
}

const saveInsulinBtn = document.getElementById('saveInsulinBtn');
if (saveInsulinBtn) {
  saveInsulinBtn.onclick = () => saveInsulinAdjustment();
}
// End of file