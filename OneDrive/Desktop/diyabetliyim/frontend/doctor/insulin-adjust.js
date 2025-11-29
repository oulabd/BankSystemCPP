document.addEventListener('DOMContentLoaded', function() {
    loadI18n();
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    if (!patientId) {
        alert('Patient ID required');
        window.location.href = 'doctor-dashboard.html';
        return;
    }

    const form = document.getElementById('insulinForm');
    const backBtn = document.getElementById('backBtn');

    backBtn.addEventListener('click', function() {
        window.location.href = `doctor-patient-details.html?patientId=${patientId}`;
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        const data = {
            patientId,
            type: formData.get('type'),
            dose: parseInt(formData.get('dose')),
            notes: formData.get('notes'),
            reason: formData.get('reason')
        };

        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/doctor/insulin-adjust', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                alert(getI18nText('insulin.saveSuccess'));
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