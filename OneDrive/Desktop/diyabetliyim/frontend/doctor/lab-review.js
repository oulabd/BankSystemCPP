document.addEventListener('DOMContentLoaded', function() {
    loadI18n();
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    if (!patientId) {
        alert('Patient ID required');
        window.location.href = 'doctor-dashboard.html';
        return;
    }
    const backBtn = document.getElementById('backBtn');
    backBtn.addEventListener('click', function() {
        window.location.href = `doctor-patient-details.html?patientId=${patientId}`;
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
            if (req.status === 'uploaded') {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h3>${req.testName}</h3>
                    <p><strong data-i18n="labs.date">Date:</strong> ${new Date(req.requestedAt).toLocaleDateString()}</p>
                    ${req.dueDate ? `<p><strong data-i18n="lab.due">Due:</strong> ${new Date(req.dueDate).toLocaleDateString()}</p>` : ''}
                    ${req.notes ? `<p><strong data-i18n="labs.notes">Notes:</strong> ${req.notes}</p>` : ''}
                    <button onclick="viewResult('${req.resultFile}')" data-i18n="labs.viewResult">View Result</button>
                    <textarea id="notes-${req._id}" placeholder="Enter review comments" data-i18n-placeholder="labs.reviewNotesPlaceholder"></textarea>
                    <button onclick="reviewResult('${req._id}')" data-i18n="lab.review">Review Result</button>
                `;
                container.appendChild(card);
            }
        });
    } catch (err) {
        console.error(err);
    }
}

function viewResult(path) {
    window.open(`/${path}`, '_blank');
}

async function reviewResult(id) {
    const doctorComment = document.getElementById(`notes-${id}`).value;
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/doctor/labs/review/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ doctorComment })
        });
        if (response.ok) {
            alert('Review submitted successfully');
            location.reload();
        } else {
            alert('Review failed');
        }
    } catch (err) {
        console.error(err);
    }
}