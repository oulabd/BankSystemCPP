// --- Dynamic Daily Measurements Table Rendering ---
// Example: Call this function with your daily measurements data array

function renderDailyMeasurementsTable(data) {
  const table = document.getElementById('dailyMeasurementsTable');
  if (!table) return;
  const tbody = table.querySelector('tbody');
  if (!tbody) return;
  tbody.innerHTML = data.map(row => `
    <tr>
      <td>${row.date || ''}</td>
      <td>${row.fasting ?? ''}</td>
      <td>${row.beforeBreakfast ?? ''}</td>
      <td>${row.afterBreakfast ?? ''}</td>
      <td>${row.breakfastCarbs ?? ''}</td>
      <td>${row.breakfastInsulin ?? ''}</td>
      <td>${row.snack1 ?? ''}</td>
      <td>${row.beforeLunch ?? ''}</td>
      <td>${row.afterLunch ?? ''}</td>
      <td>${row.lunchCarbs ?? ''}</td>
      <td>${row.lunchInsulin ?? ''}</td>
      <td>${row.snack2 ?? ''}</td>
      <td>${row.beforeDinner ?? ''}</td>
      <td>${row.afterDinner ?? ''}</td>
      <td>${row.dinnerCarbs ?? ''}</td>
      <td>${row.dinnerInsulin ?? ''}</td>
      <td>${row.snack3 ?? ''}</td>
      <td>${row.lantus ?? ''}</td>
      <td>${row.measurement_12am ?? ''}</td>
      <td>${row.measurement_3am ?? ''}</td>
    </tr>
  `).join('');
}



  // @ts-nocheck
  class LabsManager {
    

  renderUI() {
    this.container.innerHTML = `
      <div class="labs-container">
        <div class=\"labs-section-header-box\" style=\"margin-bottom:28px;\"> 
          <div class=\"labs-section-title\" style=\"font-size:2.1em;\">نتائج المختبرات</div>
        </div>
        <div id="labsList"></div>
      </div>
    `;
  }
  async loadLabReports() {
    if (!document.getElementById('labsList')) {
      this.renderUI();
    }
    const labsList = document.getElementById('labsList') || this.container;
    labsList.innerHTML = `<div class="labs-loading"><i class="fas fa-spinner fa-spin"></i><p>يتم تحميل المختبرات...</p></div>`;
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      let requestsUrl, reportsUrl;
      if (this.userRole === 'doctor') {
        if (!this.currentPatientId) {
          labsList.innerHTML = `<div class=\"labs-empty\"><i class=\"fas fa-exclamation-circle\"></i><p>لم يتم اختيار مريض. يرجى اختيار مريض.</p></div>`;
          return;
        }
        requestsUrl = `${window.API_BASE}/doctor/labs?patientId=${encodeURIComponent(this.currentPatientId)}`;
        reportsUrl = `${window.API_BASE}/doctor/labs/reports?patientId=${encodeURIComponent(this.currentPatientId)}`;
      } else {
        requestsUrl = `${window.API_BASE}/patient/labs`;
        reportsUrl = `${window.API_BASE}/patient/labs/reports`;
      }
      const [requestsRes, reportsRes] = await Promise.all([
        fetch(requestsUrl, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(reportsUrl, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (!requestsRes.ok && !reportsRes.ok) throw new Error('خطأ في واجهة برمجة التطبيقات');
      const [requests, reports] = await Promise.all([
        requestsRes.ok ? requestsRes.json() : [],
        reportsRes.ok ? reportsRes.json() : []
      ]);
      // Show both requests (pending/uploaded/reviewed) and uploaded reports
      let html = '';
      if (Array.isArray(requests) && requests.length > 0) {
        html += `<div class\="labs-section-header-box\">`;
        html += `<div class\="labs-section-title">طلبات الطبيب</div>`;
        html += `<div class\="labs-section-desc">يتم سرد اختبارات المختبر التي طلبها طبيبك هنا.</div>`;
        html += `</div>`;
        html += `<div class\="labs-section">`;
        html += requests.map(req => this.renderLabRequestCard(req)).join('');
        html += `</div>`;
      }
      if (Array.isArray(reports) && reports.length > 0) {
        html += `<div class\="labs-section-header-box\" style=\"margin-bottom:28px;\">`;
        html += `<div class\="labs-section-title">النتائج المحملة</div>`;
        html += `<div class\="labs-section-desc">يتم عرض نتائج المختبر التي قمت بتحميلها أو التي قام طبيبك بتحميلها هنا.</div>`;
        html += `</div>`;
        html += `<div class\="labs-section">`;
        html += reports.map(lab => this.renderLabReportCard(lab)).join('');
        html += `</div>`;
      }
      if (!html) {
        html = `<div class=\"labs-empty\"><i class=\"fas fa-exclamation-circle\"></i><p>لم يتم العثور على أي نتائج أو طلبات مختبر.</p></div>`;
      }
      labsList.innerHTML = html;
    } catch (err) {
      labsList.innerHTML = `<div class=\"labs-empty\"><i class=\"fas fa-exclamation-circle\"></i><p>تعذر تحميل المختبرات</p></div>`;
    }
  }
  
    setupEventListeners() {
      const uploadBtn = document.getElementById('uploadLabBtn');
      const uploadModal = document.getElementById('uploadModal');
      const closeUploadModal = document.getElementById('closeUploadModal');
      const fileUploadArea = document.getElementById('fileUploadArea');
      const fileInput = document.getElementById('labFileInput');
      const fileName = document.getElementById('fileName');
      const filePreview = document.getElementById('filePreview');
      const uploadForm = document.getElementById('uploadForm');

      if (uploadBtn && uploadModal) {
        uploadBtn.addEventListener('click', () => {
          uploadModal.style.display = 'block';
          uploadModal.classList.add('active');
        });
      }
      if (closeUploadModal && uploadModal) {
        closeUploadModal.addEventListener('click', () => {
          uploadModal.style.display = 'none';
          uploadModal.classList.remove('active');
          if (fileInput) fileInput.value = '';
          if (fileName) fileName.textContent = '';
          if (filePreview) filePreview.style.display = 'none';
        });
      }
      if (uploadModal) {
        uploadModal.addEventListener('click', (e) => {
          if (e.target === uploadModal) {
            uploadModal.style.display = 'none';
            uploadModal.classList.remove('active');
          }
        });
      }
      if (fileUploadArea && fileInput) {
        fileUploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
          if (fileInput.files && fileInput.files[0]) {
            fileName.textContent = fileInput.files[0].name;
            filePreview.style.display = 'flex';
          } else {
            fileName.textContent = '';
            filePreview.style.display = 'none';
          }
        });
      }
      try {
        if (uploadForm) {
          uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const labType = document.getElementById('labType') ? document.getElementById('labType').value : '';
            if (!fileInput.files[0]) {
              alert('يرجى اختيار ملف.');
              return;
            }
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            if (labType) formData.append('type', labType);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            let uploadUrl = '/api/patient/labs/upload';
            if (this.userRole === 'doctor' && this.currentPatientId) {
              uploadUrl = '/api/labs/upload';
              formData.append('patientId', this.currentPatientId);
            }
            try {
              const res = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
              });
              if (res.ok) {
                alert('تم تحميل الملف بنجاح');
                uploadModal.style.display = 'none';
                uploadModal.classList.remove('active');
                fileInput.value = '';
                fileName.textContent = '';
                filePreview.style.display = 'none';
                this.loadLabReports();
              } else {
                alert('فشل التحميل');
              }
            } catch (err) {
              alert('حدث خطأ أثناء التحميل');
            }
          });
        }
      } catch (err) {
        alert('حدث خطأ أثناء التحميل');
      }
    }
    
  renderLabRequestCard(req) {
    // Professional card for a lab request (pending/uploaded/reviewed)
    const statusMap = {
      pending: { label: 'تم الطلب', class: 'pending' },
      uploaded: { label: 'تم التحميل', class: 'uploaded' },
      reviewed: { label: 'تم المراجعة', class: 'reviewed' }
    };
    const status = statusMap[req.status] || { label: req.status || '', class: '' };
    // Upload/download logic
    let uploadInput = '';
    let uploadBtn = '';
    let downloadBtn = '';
    if (req.status === 'pending' || req.status === 'uploaded') {
      uploadInput = `<input type="file" id="file-${req._id}" accept="application/pdf,image/*" style="display:none;" onchange="handleUploadFileChange('${req._id}')">`;
      uploadBtn = `<button class="action-view" onclick="document.getElementById('file-${req._id}').click()"><i class='fas fa-upload'></i>تحميل النتيجة</button>`;
    }
    if (req.resultFile) {
      downloadBtn = `<button class="action-view" onclick="labsManager.downloadLabFile('${req._id}', event)"><i class='fas fa-download'></i>تنزيل النتيجة</button>`;
    }
    return `
      <div class="lab-card">
        <div class="lab-card-header">
          <div class="lab-type">
            <div class="lab-icon"><i class="fas fa-vial"></i></div>
            <div class="lab-type-info">
              <h3>${Array.isArray(req.tests) ? req.tests.join(', ') : req.testName || ''}</h3>
              <div class="lab-date"><i class="far fa-calendar-alt"></i> ${req.createdAt ? new Date(req.createdAt).toLocaleDateString('ar-SA') : ''}</div>
            </div>
          </div>
          <span class="lab-status-badge ${status.class}">${status.label}</span>
        </div>
        <div class="lab-details">
          ${req.notes ? `<div class="lab-detail-row"><span><strong>Not:</strong></span> <span>${req.notes}</span></div>` : ''}
        </div>
        <div class="lab-actions">
          ${uploadInput}
          ${uploadBtn}
          ${downloadBtn}
        </div>
        ${req.reviewNotes ? `<div class="lab-comment"><span class="lab-comment-label">تعليق الطبيب:</span><div class="lab-comment-text">${req.reviewNotes}</div></div>` : ''}
      </div>
    `;
  }

// ...existing class methods...
  renderLabReportCard(lab) {
    // Professional card for an uploaded lab report
    const statusMap = {
      reviewed: { label: 'تمت المراجعة', class: 'reviewed' },
      pending: { label: 'قيد الانتظار', class: 'pending' },
      uploaded: { label: 'تم التحميل', class: 'uploaded' }
    };
    const status = statusMap[lab.status] || { label: lab.status || '', class: '' };
    return `
      <div class="lab-card">
        <div class="lab-card-header">
          <div class="lab-type">
            <div class="lab-icon"><i class="fas fa-vial"></i></div>
            <div class="lab-type-info">
              <h3>${lab.type || ''}</h3>
              <div class="lab-date"><i class="far fa-calendar-alt"></i> ${lab.uploadedAt ? new Date(lab.uploadedAt).toLocaleDateString('ar-SA') : ''}</div>
            </div>
          </div>
          <span class="lab-status-badge ${status.class}">${status.label}</span>
        </div>
        <div class="lab-actions">
          ${lab._id ? `<button class="action-view" onclick="labsManager.downloadLabFile('${lab._id}', event)"><i class='fas fa-file-medical-alt'></i>عرض</button>` : ''}
          <button class="action-delete" onclick="labsManager.deleteLabReport('${lab._id}')"><i class='fas fa-trash-alt'></i>حذف</button>
        </div>
        ${lab.patientComment ? `<div class="lab-comment"><span class="lab-comment-label">تعليق المريض:</span><div class="lab-comment-text">${lab.patientComment}</div></div>` : ''}
        ${lab.doctorComment ? `<div class="lab-comment"><span class="lab-comment-label">تعليق الطبيب:</span><div class="lab-comment-text">${lab.doctorComment}</div></div>` : ''}
      </div>
    `;
  }

  async downloadLabFile(id, event) {
    event.preventDefault();
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      let url;
      if (this.userRole === 'doctor') {
        url = `/api/doctor/labs/file/${id}`;
        if (this.currentPatientId) {
          url += `?patientId=${encodeURIComponent(this.currentPatientId)}`;
        }
      } else {
        url = `/api/labs/file/${id}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 404) {
          alert('الملف غير موجود. يرجى إعادة تحميل النتيجة.');
        } else {
          alert('تعذر تنزيل الملف.');
        }
        return;
      }
      const blob = await res.blob();
      const urlObj = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObj;
      a.download = 'lab-result';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlObj);
    } catch (err) {
      alert('تعذر تنزيل الملف.');
    }
  }

    async deleteLabReport(id, event) {
    if (event) event.preventDefault();
    if (!confirm('هل أنت متأكد من حذف النتيجة؟ ')) return;
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      let url;
      if (this.userRole === 'doctor') {
        url = `/api/doctor/labs/${id}`;
        if (this.currentPatientId) {
          url += `?patientId=${encodeURIComponent(this.currentPatientId)}`;
        }
      } else {
        url = `/api/labs/${id}`;
      }
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('تم حذف النتيجة بنجاح.');
        this.loadLabReports();
      } else {
        alert('فشل في عملية الحذف.');
      }
    } catch (err) {
      alert('حدث خطأ أثناء الحذف.');
    }
  }
}

// Add a handler for file input change for lab uploads
LabsManager.prototype.handleUploadFileChange = function(id) {
  const input = document.getElementById('file-' + id);
  if (!input || !input.files || !input.files[0]) return;
  // Optionally show file name or preview
  // Example: alert('Selected file: ' + input.files[0].name);
  // You can trigger upload here or just update UI
  // For now, just show the file name in an alert
  alert('الملف المختار: ' + input.files[0].name);
  // You can implement auto-upload or UI update here if needed
};

// Global function for inline HTML usage
window.handleUploadFileChange = function(id) {
  if (window.labsManager && typeof window.labsManager.handleUploadFileChange === 'function') {
    window.labsManager.handleUploadFileChange(id);
  }
};

window.LabsManager = LabsManager;
