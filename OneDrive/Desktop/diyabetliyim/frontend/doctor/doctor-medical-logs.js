// frontend/doctor/doctor-medical-logs.js
class MedicalLogsPage {
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
        alert('Medical log created successfully');
        document.getElementById('logForm').reset();
        this.loadLogs();
      } else {
        alert('Failed to create medical log');
      }
    } catch (err) {
      console.error('Error creating medical log', err);
      alert('Error creating medical log');
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
        document.getElementById('logsBody').innerHTML = '<tr><td colspan="4">Failed to load logs</td></tr>';
      }
    } catch (err) {
      console.error('Error loading logs', err);
      document.getElementById('logsBody').innerHTML = '<tr><td colspan="4">Error loading logs</td></tr>';
    }
  }

  renderLogs(logs) {
    const tbody = document.getElementById('logsBody');
    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" data-i18n="logs.no_logs">No logs found</td></tr>';
      return;
    }
    tbody.innerHTML = logs.map(log => `
      <tr>
        <td>${new Date(log.createdAt).toLocaleDateString()}</td>
        <td data-i18n="logs.type.${log.type}">${this.capitalize(log.type.replace('_', ' '))}</td>
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