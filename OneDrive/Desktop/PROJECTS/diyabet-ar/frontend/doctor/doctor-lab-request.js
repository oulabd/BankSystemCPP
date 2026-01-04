
document.addEventListener('DOMContentLoaded', function() {
    // i18n kaldırıldı
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    if (!patientId) {
        alert('معرف المريض مطلوب');
        window.location.href = 'doctor-dashboard.html';
        return;
    }


        const form = document.getElementById('labRequestForm');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        // testName is now the backend enum value (e.g., 'lipidProfile')
        const testName = document.getElementById('testName').value;
        // const dueDate = document.getElementById('dueDate') ? document.getElementById('dueDate').value : undefined;
        const notes = document.getElementById('notes').value;

        if (!testName) {
            alert('الرجاء اختيار فحص');
            return;
        }

        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        try {
            const response = await fetch(`/api/doctor/labs/request/${patientId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ testName, notes })
            });
            if (response.ok) {
                alert('تم إنشاء طلب المختبر بنجاح');
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