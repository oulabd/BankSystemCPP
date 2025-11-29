// frontend/doctor/doctor-prescription.js
class PrescriptionForm {
  constructor() {
    this.patientId = new URLSearchParams(window.location.search).get('patientId');
    if (!this.patientId) {
      alert('No patient ID provided');
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

    try {
      const response = await fetch('/api/doctor/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ patientId: this.patientId, type, name, dose, frequency, duration, notes })
      });
      if (response.ok) {
        const prescription = await response.json();
        alert('Prescription created successfully');
        window.location.href = `doctor-patient-details.html?patientId=${this.patientId}`;
      } else {
        alert('Failed to create prescription');
      }
    } catch (err) {
      console.error('Error creating prescription', err);
      alert('Error creating prescription');
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

const prescriptionForm = new PrescriptionForm();