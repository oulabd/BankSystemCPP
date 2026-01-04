document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (!code) {
        showResult(false, 'رمز التحقق غير صالح');
        return;
    }
    verifyPrescription(code);
});

async function verifyPrescription(code) {
    try {
        const response = await fetch(`/api/prescriptions/verify/${code}`);
        const data = await response.json();
        if (data.valid) {
            showResult(true, 'الوصفة الطبية صالحة', data.prescription);
        } else {
            showResult(false, 'وصفة طبية غير صالحة أو منتهية الصلاحية');
        }
    } catch (err) {
        console.error(err);
        showResult(false, 'فشل التحقق');
    }
}

function showResult(valid, message, prescription = null) {
    document.getElementById('loading').style.display = 'none';
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    document.getElementById('status').textContent = message;
    if (valid && prescription) {
        const details = document.getElementById('prescription-details');
        details.innerHTML = `
            <p><strong>الطبيب:</strong> ${prescription.doctor}</p>
            <p><strong>المريض:</strong> ${prescription.patient}</p>
            <p><strong>التاريخ:</strong> ${new Date(prescription.createdAt).toLocaleDateString()}</p>
            <h3>الأدوية:</h3>
            <ul>
                ${prescription.items.map(item => `<li>${item.name} - ${item.dose} - ${item.frequency} (${item.type})</li>`).join('')}
            </ul>
            ${prescription.notes ? `<p><strong>ملاحظات:</strong> ${prescription.notes}</p>` : ''}
        `;
    }
}