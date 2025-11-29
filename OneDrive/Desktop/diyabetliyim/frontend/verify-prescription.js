document.addEventListener('DOMContentLoaded', function() {
    loadI18n();
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (!code) {
        showResult(false, 'Invalid verification code');
        return;
    }
    verifyPrescription(code);
});

async function verifyPrescription(code) {
    try {
        const response = await fetch(`/api/prescriptions/verify/${code}`);
        const data = await response.json();
        if (data.valid) {
            showResult(true, 'Prescription is valid', data.prescription);
        } else {
            showResult(false, 'Invalid or expired prescription');
        }
    } catch (err) {
        console.error(err);
        showResult(false, 'Verification failed');
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
            <p><strong>Doctor:</strong> ${prescription.doctor}</p>
            <p><strong>Patient:</strong> ${prescription.patient}</p>
            <p><strong>Date:</strong> ${new Date(prescription.createdAt).toLocaleDateString()}</p>
            <h3>Items:</h3>
            <ul>
                ${prescription.items.map(item => `<li>${item.name} - ${item.dose} - ${item.frequency} (${item.type})</li>`).join('')}
            </ul>
            ${prescription.notes ? `<p><strong>Notes:</strong> ${prescription.notes}</p>` : ''}
        `;
    }
}