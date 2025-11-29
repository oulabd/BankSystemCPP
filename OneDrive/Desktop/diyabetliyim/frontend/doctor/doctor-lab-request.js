document.addEventListener('DOMContentLoaded', function() {
    loadI18n();
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    if (!patientId) {
        alert('Patient ID required');
        window.location.href = 'doctor-dashboard.html';
        return;
    }

    const form = document.getElementById('labRequestForm');
    const backBtn = document.getElementById('backBtn');

    backBtn.addEventListener('click', function() {
        window.location.href = `doctor-patient-details.html?patientId=${patientId}`;
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const testName = document.getElementById('testName').value;
        const dueDate = document.getElementById('dueDate').value;
        const notes = document.getElementById('notes').value;

        if (!testName) {
            alert('Please select a test');
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/doctor/labs/request/${patientId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ testName, dueDate, notes })
            });
            if (response.ok) {
                alert('Lab request created successfully');
                window.location.href = `doctor-patient-details.html?patientId=${patientId}`;
            } else {
                const error = await response.json();
                alert(error.error || 'Error');
            }
        } catch (err) {
            console.error(err);
            alert('Network error');
        }
    });
});