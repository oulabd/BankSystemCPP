

document.addEventListener('DOMContentLoaded', function() {
    // i18n kaldırıldı
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    if (!patientId) {
        alert('معرف المريض مطلوب');
        window.location.href = 'doctor-dashboard.html';
        return;
    }
    const backBtn = document.getElementById('backBtn');
    backBtn.addEventListener('click', function() {
        window.history.back();
    });
    loadLabRequests(patientId);
});

async function loadLabRequests(patientId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/doctor/labs/${patientId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const requests = await response.json();
        const container = document.getElementById('labRequests');
        container.innerHTML = '';
        requests.forEach(req => {
            // Show all lab requests for debugging (remove status check)
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3>${req.testName}</h3>
                <p><strong>التاريخ:</strong> ${new Date(req.requestedAt).toLocaleDateString('ar-SA')}</p>
                ${req.dueDate ? `<p><strong>تاريخ الاستحقاق:</strong> ${new Date(req.dueDate).toLocaleDateString('ar-SA')}</p>` : ''}
                ${req.notes ? `<p><strong>ملاحظات:</strong> ${req.notes}</p>` : ''}
                ${req.patientComment ? `<p><strong>تعليق المريض:</strong> ${req.patientComment}</p>` : ''}
                ${req.analysis ? `<p><strong>التحليل:</strong> ${req.analysis}</p>` : ''}
                <button onclick="viewResult('${req.resultFile}')">عرض النتيجة</button>
                <textarea id="notes-${req._id}" placeholder="أدخل ملاحظة المراجعة"></textarea>
                <button onclick="reviewResult('${req._id}')">مراجعة النتيجة</button>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error(err);
    }
}

function viewResult(path) {
    // Open the file in a new tab without triggering download or reload
    const url = path.startsWith('/') ? path : `/${path}`;
    window.open(url, '_blank', 'noopener');
}

async function reviewResult(id) {
    const doctorComment = document.getElementById(`notes-${id}`).value;
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/labs/${id}/review`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ doctorComment })
        });
        if (response.ok) {
            alert('تم إرسال المراجعة بنجاح');
            location.reload();
        } else {
            alert('فشلت المراجعة');
        }
    } catch (err) {
        console.error(err);
    }
}