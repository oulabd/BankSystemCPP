// frontend/doctor/doctor-medical-logs.js


class MedicalLogsPage {
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
    this.loadLogs();
  }

  bindEvents() {
    document.getElementById('logForm').addEventListener('submit', (e) => this.createLog(e));
    document.getElementById('filterType').addEventListener('change', () => this.loadLogs());
  }

  async createLog(e) {
    e.preventDefault();
    const type = document.getElementById('type').value;
    const description = document.getElementById('description').value;

    try {
      const response = await fetch('/api/doctor/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ patientId: this.patientId, type, description })
      });
      if (response.ok) {
        alert('تم إنشاء السجل الطبي بنجاح');
        document.getElementById('logForm').reset();
        this.loadLogs();
      } else {
        alert('فشل إنشاء السجل الطبي');
      }
    } catch (err) {
      console.error('Error creating medical log', err);
      alert('حدث خطأ أثناء إنشاء السجل الطبي');
    }
  }

  async loadLogs() {
    const filterType = document.getElementById('filterType').value;
    try {
      const response = await fetch(`/api/doctor/logs/${this.patientId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        let logs = data.logs;
        if (filterType) {
          logs = logs.filter(log => log.type === filterType);
        }
        this.renderLogs(logs);
      } else {
        document.getElementById('logsBody').innerHTML = '<tr><td colspan="4">فشل تحميل السجلات</td></tr>';
      }
    } catch (err) {
      console.error('Error loading logs', err);
      document.getElementById('logsBody').innerHTML = '<tr><td colspan="4">حدث خطأ أثناء تحميل السجلات</td></tr>';
    }
  }

  renderLogs(logs) {
    const tbody = document.getElementById('logsBody');
    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">لم يتم العثور على سجلات</td></tr>';
      return;
    }
    tbody.innerHTML = logs.map(log => `
      <tr>
        <td>${new Date(log.createdAt).toLocaleDateString()}</td>
        <td>${this.capitalize(log.type.replace('_', ' '))}</td>
        <td>${log.description}</td>
        <td>${log.doctorId.fullName}</td>
      </tr>
    `).join('');
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

new MedicalLogsPage();