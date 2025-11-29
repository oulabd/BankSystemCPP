// frontend/doctor/doctor-patient-details.js
class PatientDetails {
  constructor() {
    this.patientId = new URLSearchParams(window.location.search).get('id');
    if (!this.patientId) {
      alert('No patient ID provided');
      window.history.back();
      return;
    }
    this.init();
  }

  async init() {
    await this.loadPatientDetails();
    this.bindEvents();
  }

  async loadPatientDetails() {
    try {
      const response = await fetch(`/api/doctor/patient/${this.patientId}/details`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        this.renderPatientInfo(data.patient);
        this.renderLastRecord(data.lastRecord);
        this.renderHistory(data.history);
        await this.loadPrescriptions();
      } else {
        document.getElementById('patientInfo').textContent = 'Failed to load patient details';
      }
    } catch (err) {
      console.error('Failed to load patient details', err);
      document.getElementById('patientInfo').textContent = 'Error loading data';
    }
  }

  renderPatientInfo(patient) {
    const infoDiv = document.getElementById('patientInfo');
    infoDiv.innerHTML = `
      <p><strong>Name:</strong> ${patient.fullName}</p>
      <p><strong>Identity Number:</strong> ${patient.identityNumber}</p>
      <p><strong>Birth Date:</strong> ${patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : 'N/A'}</p>
      <p><strong>Phone:</strong> ${patient.phone}</p>
      <p><strong>Address:</strong> ${patient.address}</p>
    `;
  }

  renderLastRecord(lastRecord) {
    const recordDiv = document.getElementById('lastRecord');
    const statusClass = lastRecord.status === 'critical_high' ? 'critical_high' :
                        lastRecord.status === 'risk_low' ? 'risk_low' :
                        lastRecord.status === 'normal' ? 'normal' : 'none';
    const statusText = lastRecord.status === 'critical_high' ? 'High' :
                       lastRecord.status === 'risk_low' ? 'Low' :
                       lastRecord.status === 'normal' ? 'Normal' : 'No Data';
    recordDiv.innerHTML = `
      <p><strong>Value:</strong> ${lastRecord.value ? lastRecord.value + ' mg/dL' : 'N/A'}</p>
      <p><strong>Timestamp:</strong> ${lastRecord.timestamp ? new Date(lastRecord.timestamp).toLocaleString() : 'N/A'}</p>
      <span class="status ${statusClass}">${statusText}</span>
    `;
  }

  renderHistory(history) {
    const tableDiv = document.getElementById('historyTable');
    if (history.length === 0) {
      tableDiv.innerHTML = '<p>No records found</p>';
      return;
    }
    let tableHTML = `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Fasting</th>
            <th>Before Breakfast</th>
            <th>After Breakfast</th>
            <th>Before Lunch</th>
            <th>After Lunch</th>
            <th>Before Dinner</th>
            <th>After Dinner</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
    `;
    history.forEach(record => {
      tableHTML += `
        <tr>
          <td>${new Date(record.date).toLocaleDateString()}</td>
          <td>${record.fasting || '-'}</td>
          <td>${record.beforeBreakfast || '-'}</td>
          <td>${record.afterBreakfast || '-'}</td>
          <td>${record.beforeLunch || '-'}</td>
          <td>${record.afterLunch || '-'}</td>
          <td>${record.beforeDinner || '-'}</td>
          <td>${record.afterDinner || '-'}</td>
          <td>${record.notes || '-'}</td>
        </tr>
      `;
    });
    tableHTML += '</tbody></table>';
    tableDiv.innerHTML = tableHTML;
  }

  async loadPrescriptions() {
    try {
      const response = await fetch(`/api/doctor/prescriptions/${this.patientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const prescriptions = await response.json();
        this.renderPrescriptions(prescriptions);
      } else {
        document.getElementById('prescriptionsList').textContent = 'Failed to load prescriptions';
      }
    } catch (err) {
      console.error('Failed to load prescriptions', err);
      document.getElementById('prescriptionsList').textContent = 'Error loading prescriptions';
    }
  }

  renderPrescriptions(prescriptions) {
    const listDiv = document.getElementById('prescriptionsList');
    if (prescriptions.length === 0) {
      listDiv.innerHTML = '<p>No prescriptions found</p>';
      return;
    }
    let tableHTML = `
      <table>
        <thead>
          <tr>
            <th>Medicine Name</th>
            <th>Type</th>
            <th>Dose</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;
    prescriptions.forEach(prescription => {
      tableHTML += `
        <tr>
          <td>${prescription.name}</td>
          <td>${prescription.type}</td>
          <td>${prescription.dose}</td>
          <td>${prescription.duration}</td>
          <td>
            <button onclick="editPrescription('${prescription._id}')">Edit</button>
            <button onclick="deletePrescription('${prescription._id}')">Delete</button>
          </td>
        </tr>
      `;
    });
    tableHTML += '</tbody></table>';
    listDiv.innerHTML = tableHTML;
  }

  downloadReport() {
    const lang = localStorage.getItem('lang') || 'tr';
    const url = `/api/patient/${this.patientId}/export?lang=${lang}`;
    window.open(url, '_blank');
  }

  bindEvents() {
    document.getElementById('addInstructionBtn').onclick = () => alert('Add Instruction - Placeholder');
    document.getElementById('requestLabBtn').onclick = () => window.location.href = `doctor-lab-request.html?patientId=${this.patientId}`;
    document.getElementById('reviewLabBtn').onclick = () => window.location.href = `lab-review.html?patientId=${this.patientId}`;
    document.getElementById('adjustInsulinBtn').onclick = () => window.location.href = `insulin-adjust.html?patientId=${this.patientId}`;
    document.getElementById('createPrescriptionBtn').onclick = () => window.location.href = `doctor-prescription.html?patientId=${this.patientId}`;
    document.getElementById('medicalLogsBtn').onclick = () => window.location.href = `doctor-medical-logs.html?patientId=${this.patientId}`;
    document.getElementById('downloadReportBtn').onclick = () => this.downloadReport();
  }
}

// Global functions for prescription actions
async function editPrescription(id) {
  // For now, just alert. In future, open edit modal or redirect
  alert('Edit prescription ' + id + ' - Feature coming soon');
}

async function deletePrescription(id) {
  if (!confirm('Are you sure you want to delete this prescription?')) return;
  
  try {
    const response = await fetch(`/api/doctor/prescriptions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (response.ok) {
      alert('Prescription deleted successfully');
      location.reload(); // Refresh to update the list
    } else {
      alert('Failed to delete prescription');
    }
  } catch (err) {
    console.error('Error deleting prescription', err);
    alert('Error deleting prescription');
  }
}

const patientDetails = new PatientDetails();