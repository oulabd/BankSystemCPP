

document.addEventListener('DOMContentLoaded', function() {
    // i18n kaldırıldı
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    if (!patientId) {
        alert('معرف المريض مطلوب');
        window.location.href = 'doctor-dashboard.html';
        return;
    }

    const form = document.getElementById('insulinForm');
    const backBtn = document.getElementById('backBtn');

        backBtn.addEventListener('click', function() {
            window.history.back();
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
                alert('تم الحفظ بنجاح');
                window.location.href = `doctor-patient-details.html?patientId=${patientId}`;
            } else {
                const error = await response.json();
                alert(error.error || 'خطأ');
            }
        } catch (err) {
            console.error(err);
            alert('خطأ في الشبكة');
        }
    });
});