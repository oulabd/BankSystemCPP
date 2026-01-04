
document.addEventListener('DOMContentLoaded', function() {
    const backBtn = document.getElementById('backBtn');
    backBtn.addEventListener('click', function() {
        window.history.back();
    });
    loadLabRequests();
});

async function loadLabRequests() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${window.API_BASE}/patient/labs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const container = document.getElementById('labRequests');
        container.innerHTML = '';
        data.requests.forEach(req => {
            const card = document.createElement('div');
            card.className = 'card';
            let statusClass = 'status-gray';
            if (req.status === 'uploaded') statusClass = 'status-blue';
            else if (req.status === 'reviewed') statusClass = 'status-green';
            ccard.innerHTML = `
  <h3>${req.tests.join(', ')}</h3>

  <p>
    <strong>الحالة:</strong>
    <span class="${statusClass}">
    ${req.status === '' ? '' :
        req.status === 'uploaded' ? 'تم الرفع' :
        req.status === 'reviewed' ? 'تم المراجعة' : req.status}
    </span>
  </p>

  <p><strong>الطبيب الطالب:</strong> ${req.doctorId.fullName}</p>
  <p><strong>التاريخ:</strong> ${new Date(req.createdAt).toLocaleDateString('ar-EG')}</p>

  ${req.notes ? `<p><strong>ملاحظات:</strong> ${req.notes}</p>` : ''}

  ${
    req.status === 'pending'
      ? `<input type="file" id="file-${req._id}" accept=".pdf,.jpg,.jpeg,.png">
         <button onclick="uploadResult('${req._id}')">رفع النتيجة</button>`
      : ''
  }

  ${
    req.resultFile
      ? `<button onclick="viewResult('${req.resultFile}')">عرض النتيجة</button>`
      : ''
  }

  ${
    req.status === 'reviewed'
      ? `<p><strong>ملاحظات المراجعة:</strong> ${req.reviewNotes}</p>
         <p><strong>تاريخ المراجعة:</strong> ${new Date(req.reviewedAt).toLocaleDateString('ar-EG')}</p>`
      : ''
  }
`;

            container.appendChild(card);
        });
    } catch (err) {
        console.error(err);
    }
}

async function uploadResult(id) {
    const fileInput = document.getElementById(`file-${id}`);
    const file = fileInput.files[0];
    if (!file) {
        alert('يرجى اختيار ملف');

        return;
    }
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${window.API_BASE}/patient/labs/upload/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (response.ok) {
            alert('تم تحميل الملف بنجاح');
            loadLabRequests();
        } else {
            alert('فشل التحميل');
        }
    } catch (err) {
        console.error(err);
    }
}

function viewResult(path) {
    window.open(`/${path}`, '_blank');
}