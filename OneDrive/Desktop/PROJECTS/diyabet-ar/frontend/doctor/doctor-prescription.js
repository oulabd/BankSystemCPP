// frontend/doctor/doctor-prescription.js


class PrescriptionForm {
  constructor() {
    this.patientId = new URLSearchParams(window.location.search).get('patientId');
    if (!this.patientId) {
      alert('لم يتم العثور على معرف المريض');
      window.history.back();
      return;
    }
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('prescriptionForm').addEventListener('submit', (e) => this.generatePrescription(e));
  }

  async generatePrescription(e) {
    e.preventDefault();
    const type = document.getElementById('type').value;
    const name = document.getElementById('name').value;
    const dose = document.getElementById('dose').value;
    const frequency = document.getElementById('frequency').value;
    const duration = document.getElementById('duration').value;
    const notes = document.getElementById('notes').value;

    console.log('Creating prescription...', { patientId: this.patientId, type, name, dose, frequency, duration, notes });

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      console.log('Token:', token ? 'Found' : 'Not found');
      
      const payload = {
        patientId: this.patientId,
        items: [{ type, name, dose, frequency, duration }],
        notes
      };
      console.log('Payload:', JSON.stringify(payload));
      
      const response = await fetch(`${window.API_BASE}/doctor/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const prescription = await response.json();
        console.log('Prescription created:', prescription);
        alert('تم إنشاء الوصفة بنجاح');
        window.location.href = `doctor-patient-details.html?patientId=${this.patientId}`;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error:', errorData);
        alert('فشل إنشاء الوصفة: ' + (errorData.error || errorData.message || response.status));
      }
    } catch (err) {
      console.error('Error creating prescription', err);
      alert('خطأ أثناء إنشاء الوصفة: ' + err.message);
    }
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.prescriptionForm = new PrescriptionForm();
});