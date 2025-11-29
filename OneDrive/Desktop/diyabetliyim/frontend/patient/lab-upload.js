document.addEventListener('DOMContentLoaded', function() {
    loadI18n();
    const backBtn = document.getElementById('backBtn');
    backBtn.addEventListener('click', function() {
        window.location.href = 'patient-dashboard.html';
    });
    loadLabRequests();
});

async function loadLabRequests() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/patient/labs', {
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
            card.innerHTML = `
                <h3>${req.tests.join(', ')}</h3>
                <p><strong data-i18n="labs.status">Status:</strong> <span class="${statusClass}" data-i18n="labs.${req.status}">${req.status}</span></p>
                <p><strong data-i18n="labs.requestedBy">Requested by:</strong> ${req.doctorId.fullName}</p>
                <p><strong data-i18n="labs.date">Date:</strong> ${new Date(req.createdAt).toLocaleDateString()}</p>
                ${req.notes ? `<p><strong data-i18n="labs.notes">Notes:</strong> ${req.notes}</p>` : ''}
                ${req.status === 'pending' ? `<input type="file" id="file-${req._id}" accept=".pdf,.jpg,.jpeg,.png"> <button onclick="uploadResult('${req._id}')" data-i18n="labs.uploadResult">Upload Result</button>` : ''}
                ${req.resultFile ? `<button onclick="viewResult('${req.resultFile}')" data-i18n="labs.viewResult">View Result</button>` : ''}
                ${req.status === 'reviewed' ? `<p><strong data-i18n="labs.reviewNotes">Review Notes:</strong> ${req.reviewNotes}</p><p><strong data-i18n="labs.reviewedAt">Reviewed At:</strong> ${new Date(req.reviewedAt).toLocaleDateString()}</p>` : ''}
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
        alert(getI18nText('labs.chooseFile'));
        return;
    }
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/patient/labs/upload/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (response.ok) {
            alert(getI18nText('labs.uploadSuccess'));
            loadLabRequests();
        } else {
            alert('Upload failed');
        }
    } catch (err) {
        console.error(err);
    }
}

function viewResult(path) {
    window.open(`/${path}`, '_blank');
}