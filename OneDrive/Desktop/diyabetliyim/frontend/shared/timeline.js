class TimelineManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.patientId = null;
    this.timeline = [];
    this.patient = null;
    this.summary = null;
    this.init();
  }

  async init() {
    const urlParams = new URLSearchParams(window.location.search);
    this.patientId = urlParams.get('patientId');
    
    if (!this.patientId) {
      this.showError('No patient selected');
      return;
    }
    
    this.renderUI();
    await this.loadTimeline();
    this.setupEventListeners();
  }

  renderUI() {
    this.container.innerHTML = `
      <div class="timeline-container">
        <div class="timeline-header">
          <h1>
            <i class="fas fa-history"></i>
            <span data-i18n="timeline.title">Medical Timeline</span>
          </h1>
        </div>
        
        <div class="patient-info" id="patientInfo">
          <div class="timeline-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading patient data...</p>
          </div>
        </div>
        
        <div class="timeline-filters">
          <div class="filter-group">
            <label data-i18n="timeline.event_type">Event Type</label>
            <select id="eventTypeFilter">
              <option value="">All Events</option>
              <option value="glucose">🩸 Glucose</option>
              <option value="prescription">💊 Prescriptions</option>
              <option value="lab">🔬 Lab Reports</option>
              <option value="note">📝 Doctor Notes</option>
              <option value="appointment">📅 Appointments</option>
              <option value="medication">💉 Medications</option>
            </select>
          </div>
          <div class="filter-group">
            <label data-i18n="timeline.start_date">Start Date</label>
            <input type="date" id="startDateFilter">
          </div>
          <div class="filter-group">
            <label data-i18n="timeline.end_date">End Date</label>
            <input type="date" id="endDateFilter">
          </div>
        </div>
        
        <div class="timeline-wrapper">
          <div class="timeline" id="timelineList">
            <div class="timeline-loading">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Loading timeline...</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    document.getElementById('eventTypeFilter').addEventListener('change', () => this.applyFilters());
    document.getElementById('startDateFilter').addEventListener('change', () => this.applyFilters());
    document.getElementById('endDateFilter').addEventListener('change', () => this.applyFilters());
  }

  async loadTimeline() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/doctor/patient/${this.patientId}/timeline`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to load timeline');
      
      const data = await res.json();
      this.timeline = data.timeline || [];
      this.patient = data.patient;
      this.summary = data.summary;
      
      this.renderPatientInfo();
      this.renderTimeline();
    } catch (err) {
      console.error('loadTimeline error:', err);
      this.showError('Failed to load timeline');
    }
  }

  renderPatientInfo() {
    const infoEl = document.getElementById('patientInfo');
    infoEl.innerHTML = `
      <h2>${this.patient.name}</h2>
      <p style="color: #6b7280; font-size: 14px;">ID: ${this.patient.identityNumber}</p>
      
      <div class="patient-stats">
        <div class="stat-item">
          <div class="stat-value">${this.summary.glucoseRecords}</div>
          <div class="stat-label">Glucose Records</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${this.summary.prescriptions}</div>
          <div class="stat-label">Prescriptions</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${this.summary.labReports}</div>
          <div class="stat-label">Lab Reports</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${this.summary.doctorNotes}</div>
          <div class="stat-label">Doctor Notes</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${this.summary.appointments}</div>
          <div class="stat-label">Appointments</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${this.summary.medications}</div>
          <div class="stat-label">Medications</div>
        </div>
      </div>
    `;
  }

  applyFilters() {
    const eventType = document.getElementById('eventTypeFilter').value;
    const startDate = document.getElementById('startDateFilter').value;
    const endDate = document.getElementById('endDateFilter').value;
    
    let filtered = this.timeline;
    
    if (eventType) {
      filtered = filtered.filter(item => item.type === eventType);
    }
    
    if (startDate) {
      filtered = filtered.filter(item => new Date(item.timestamp) >= new Date(startDate));
    }
    
    if (endDate) {
      filtered = filtered.filter(item => new Date(item.timestamp) <= new Date(endDate));
    }
    
    this.renderTimeline(filtered);
  }

  renderTimeline(events = this.timeline) {
    const listEl = document.getElementById('timelineList');
    
    if (events.length === 0) {
      listEl.innerHTML = `
        <div class="timeline-empty">
          <i class="fas fa-calendar-times"></i>
          <p data-i18n="timeline.no_data">No medical data available</p>
        </div>
      `;
      return;
    }
    
    listEl.innerHTML = events.map(item => this.renderTimelineItem(item)).join('');
    
    // Attach event listeners for downloads
    events.forEach(item => {
      if (item.type === 'lab') {
        const btn = document.getElementById(`download-${item.id}`);
        if (btn) {
          btn.addEventListener('click', () => this.downloadLabFile(item));
        }
      }
    });
  }

  renderTimelineItem(item) {
    const date = new Date(item.timestamp);
    const timeAgo = this.formatTimeAgo(date);
    
    return `
      <div class="timeline-item ${item.type}" style="--status-color: ${item.statusColor}">
        <div class="timeline-card ${item.type}" style="--status-color: ${item.statusColor}">
          <div class="timeline-card-header">
            <div style="display: flex; align-items: flex-start;">
              <div class="timeline-icon">${item.icon}</div>
              <div class="timeline-title-group">
                <div class="timeline-title">${item.title}</div>
                <div class="timeline-description">${item.description}</div>
              </div>
            </div>
            <div class="timeline-timestamp">${timeAgo}</div>
          </div>
          
          <div class="timeline-content">
            ${this.renderTimelineContent(item)}
          </div>
        </div>
      </div>
    `;
  }

  renderTimelineContent(item) {
    switch (item.type) {
      case 'glucose':
        return `
          <div class="glucose-value ${item.status.includes('high') ? 'high' : item.status.includes('low') ? 'low' : 'normal'}">
            ${item.value} mg/dL
          </div>
          ${item.notes ? `<div class="note-text">${item.notes}</div>` : ''}
          <span class="status-badge" style="background: ${item.statusColor}22; color: ${item.statusColor}">
            ${item.status.replace('_', ' ').toUpperCase()}
          </span>
        `;
      
      case 'prescription':
        return `
          <div class="prescription-items">
            ${item.items.map(med => `
              <div class="prescription-item">
                <strong>${med.name}</strong> - ${med.dose} ${med.frequency} (${med.type})
              </div>
            `).join('')}
          </div>
          ${item.notes ? `<div class="note-text" style="margin-top: 12px;">${item.notes}</div>` : ''}
          <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">
            Prescribed by: ${item.doctorName}
          </p>
        `;
      
      case 'lab':
        return `
          <div class="lab-file">
            <p style="font-size: 14px; color: #374151; margin-bottom: 8px;">
              <strong>File:</strong> ${item.fileName}
            </p>
            ${item.doctorComment ? `<div class="note-text">${item.doctorComment}</div>` : ''}
            <span class="status-badge" style="background: ${item.statusColor}22; color: ${item.statusColor}; margin-right: 8px;">
              ${item.status.replace('_', ' ').toUpperCase()}
            </span>
            <button class="btn-download" id="download-${item.id}">
              <i class="fas fa-download"></i>
              <span data-i18n="timeline.download">Download</span>
            </button>
          </div>
        `;
      
      case 'note':
        return `
          <div class="note-text">${item.text}</div>
        `;
      
      case 'appointment':
        return `
          <p style="font-size: 14px; color: #374151;">
            <strong>Reason:</strong> ${item.reason}
          </p>
          ${item.message ? `<div class="note-text" style="margin-top: 8px;">${item.message}</div>` : ''}
          <span class="status-badge" style="background: ${item.statusColor}22; color: ${item.statusColor}">
            ${item.status.toUpperCase()}
          </span>
        `;
      
      case 'medication':
        return `
          <p style="font-size: 14px; color: #374151;">
            <strong>Dose:</strong> ${item.dose} ${item.unit}
          </p>
          <p style="font-size: 14px; color: #374151;">
            <strong>Timing:</strong> ${item.timing.replace('_', ' ')}
          </p>
          ${item.notes ? `<div class="note-text" style="margin-top: 8px;">${item.notes}</div>` : ''}
          ${item.isRecommendation ? `
            <span class="status-badge" style="background: #20caa822; color: #20caa8;">
              DOCTOR RECOMMENDATION
            </span>
          ` : ''}
        `;
      
      default:
        return '';
    }
  }

  async downloadLabFile(item) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(item.fileUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Download failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('downloadLabFile error:', err);
      alert('Failed to download file');
    }
  }

  formatTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="timeline-empty">
        <i class="fas fa-exclamation-circle"></i>
        <p>${message}</p>
      </div>
    `;
  }
}

let timelineManager;
