// verify-prescription.js
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (!code) {
        showError('No verification code provided');
        return;
    }

    verifyPrescription(code);
});

async function verifyPrescription(code) {
    try {
        const response = await fetch(`/api/prescriptions/verify/${code}`);
        const data = await response.json();

        if (response.ok) {
            displayPrescription(data.prescription);
        } else {
            showError(data.message || 'Verification failed');
        }
    } catch (error) {
        console.error('Verification error:', error);
        showError('Network error occurred during verification');
    }
}

function displayPrescription(prescription) {
    document.getElementById('verification-result').style.display = 'none';
    document.getElementById('prescription-details').style.display = 'block';

    // Set status
    const statusElement = document.getElementById('verification-status');
    statusElement.textContent = i18n.t('prescriptions.valid');
    statusElement.className = 'status valid';

    // Set basic info
    document.getElementById('patient-name').textContent = prescription.patient.name;
    document.getElementById('doctor-name').textContent = prescription.doctor.name;
    document.getElementById('prescription-date').textContent = new Date(prescription.createdAt).toLocaleDateString();
    document.getElementById('verify-code').textContent = prescription.verifyCode;

    // Set verification time
    document.getElementById('verification-time').textContent = new Date().toLocaleString();

    // Display items
    const itemsList = document.getElementById('items-list');
    itemsList.innerHTML = '';

    prescription.items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-entry';
        itemDiv.innerHTML = `
            <div class="row">
                <span class="label">${i18n.t('prescriptions.itemName')}:</span>
                <span class="value">${item.name}</span>
            </div>
            <div class="row">
                <span class="label">${i18n.t('prescriptions.dose')}:</span>
                <span class="value">${item.dose}</span>
            </div>
            <div class="row">
                <span class="label">${i18n.t('prescriptions.frequency')}:</span>
                <span class="value">${item.frequency}</span>
            </div>
            <div class="row">
                <span class="label">${i18n.t('prescriptions.type')}:</span>
                <span class="value">${item.type}</span>
            </div>
        `;
        itemsList.appendChild(itemDiv);
    });

    // Display notes if present
    if (prescription.notes) {
        document.getElementById('notes-section').style.display = 'block';
        document.getElementById('prescription-notes').textContent = prescription.notes;
    }
}

function showError(message) {
    document.getElementById('verification-result').style.display = 'none';
    document.getElementById('error-message').style.display = 'block';
    document.getElementById('error-text').textContent = message;
}