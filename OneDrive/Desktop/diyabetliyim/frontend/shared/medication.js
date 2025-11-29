class MedicationManager {
  constructor(containerId, userRole) {
    this.container = document.getElementById(containerId);
    this.userRole = userRole;
    this.records = [];
    this.glucoseRecords = [];
    this.currentPatientId = null;
    this.editingRecord = null;
    this.init();
  }

  async init() {
    this.renderUI();
    
    if (this.userRole === 'doctor') {
      const urlParams = new URLSearchParams(window.location.search);
      this.currentPatientId = urlParams.get('patientId');
    }
    
    await this.loadMedicationRecords();
    this.setupEventListeners();
  }

  renderUI() {
    this.container.innerHTML = `
      <div class="medication-container">
        <div class="medication-header">
          <h1>
            <i class="fas fa-pills"></i>
            <span data-i18n="med.title">Medication & Insulin Doses</span>
          </h1>
          <div class="medication-actions">
            ${this.userRole === 'patient' ? `
              <button class="btn-add-medication" id="addMedicationBtn">
                <i class="fas fa-plus"></i>
                <span data-i18n="med.add">Add Dose</span>
              </button>
            ` : ''}
            ${this.userRole === 'doctor' ? `
              <button class="btn-recommend-medication" id="recommendMedicationBtn">
                <i class="fas fa-prescription"></i>
                <span data-i18n="med.recommend">Recommend Medication</span>
              </button>
            ` : ''}
          </div>
        </div>
        
        <div class="medication-filters">
          <div class="filter-group">
            <label data-i18n="med.type">Type</label>
            <select id="medicationTypeFilter">
              <option value="">All Types</option>
              <option value="insulin">Insulin</option>
              <option value="oral">Oral Medication</option>
            </select>
          </div>
          <div class="filter-group">
            <label data-i18n="med.start_date">Start Date</label>
            <input type="date" id="startDateFilter">
          </div>
          <div class="filter-group">
            <label data-i18n="med.end_date">End Date</label>
            <input type="date" id="endDateFilter">
          </div>
        </div>
        
        <div class="medication-timeline">
          <div class="timeline-header">
            <h2 data-i18n="med.log">Dose Log</h2>
            <div class="timeline-stats" id="timelineStats"></div>
          </div>
          <div id="medicationList">
            <div class="medication-loading">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Loading medication records...</p>
            </div>
          </div>
        </div>
      </div>
      
      ${this.renderMedicationModal()}
    `;
  }

  renderMedicationModal() {
    return `
      <div class="medication-modal" id="medicationModal">
        <div class="medication-modal-content">
          <div class="medication-modal-header">
            <h2 id="modalTitle" data-i18n="med.add">Add Dose</h2>
            <button class="close-modal" id="closeMedicationModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <form class="medication-form" id="medicationForm">
            <div class="form-group">
              <label data-i18n="med.type">Type *</label>
              <select id="medicationType" required>
                <option value="">Select type...</option>
                <option value="insulin">Insulin</option>
                <option value="oral">Oral Medication</option>
              </select>
            </div>
            
            <div class="form-group">
              <label data-i18n="med.name">Medication Name *</label>
              <input type="text" id="medicationName" required placeholder="e.g., Metformin, Humalog">
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label data-i18n="med.dose">Dose *</label>
                <input type="number" id="medicationDose" min="0" step="0.01" required>
              </div>
              <div class="form-group">
                <label data-i18n="med.unit">Unit *</label>
                <select id="medicationUnit" required>
                  <option value="IU">IU (International Units)</option>
                  <option value="mg">mg (milligrams)</option>
                  <option value="mcg">mcg (micrograms)</option>
                  <option value="mL">mL (milliliters)</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label data-i18n="med.timing">Timing *</label>
              <select id="medicationTiming" required>
                <option value="before_breakfast">Before Breakfast</option>
                <option value="after_breakfast">After Breakfast</option>
                <option value="before_lunch">Before Lunch</option>
                <option value="after_lunch">After Lunch</option>
                <option value="before_dinner">Before Dinner</option>
                <option value="after_dinner">After Dinner</option>
                <option value="bedtime">Bedtime</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div class="form-group">
              <label data-i18n="med.notes">Notes</label>
              <textarea id="medicationNotes" placeholder="Additional notes..."></textarea>
            </div>
            
            <input type="hidden" id="editMedicationId">
            <input type="hidden" id="patientIdField">
            
            <button type="submit" class="btn-submit-medication">
              <i class="fas fa-save"></i>
              <span data-i18n="med.save">Save</span>
            </button>
          </form>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const addBtn = document.getElementById('addMedicationBtn');
    const recommendBtn = document.getElementById('recommendMedicationBtn');
    
    if (addBtn) addBtn.addEventListener('click', () => this.openMedicationModal());
    if (recommendBtn) recommendBtn.addEventListener('click', () => this.openMedicationModal(true));
    
    document.getElementById('closeMedicationModal').addEventListener('click', () => this.closeMedicationModal());
    document.getElementById('medicationForm').addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Filters
    document.getElementById('medicationTypeFilter').addEventListener('change', () => this.applyFilters());
    document.getElementById('startDateFilter').addEventListener('change', () => this.applyFilters());
    document.getElementById('endDateFilter').addEventListener('change', () => this.applyFilters());
  }

  async loadMedicationRecords() {
    try {
      const token = localStorage.getItem('token');
      let url = '/api/medication/mine';
      
      if (this.userRole === 'doctor' && this.currentPatientId) {
        url = `/api/medication/patient/${this.currentPatientId}`;
      }
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to load medication records');
      
      const data = await res.json();
      this.records = data.records || [];
      this.glucoseRecords = data.glucoseRecords || [];
      this.renderMedicationRecords();
      this.updateStats();
    } catch (err) {
      console.error('loadMedicationRecords error:', err);
      this.renderError();
    }
  }

  applyFilters() {
    const type = document.getElementById('medicationTypeFilter').value;
    const startDate = document.getElementById('startDateFilter').value;
    const endDate = document.getElementById('endDateFilter').value;
    
    let filtered = this.records;
    
    if (type) {
      filtered = filtered.filter(r => r.medicationType === type);
    }
    
    if (startDate) {
      filtered = filtered.filter(r => new Date(r.recordedAt) >= new Date(startDate));
    }
    
    if (endDate) {
      filtered = filtered.filter(r => new Date(r.recordedAt) <= new Date(endDate));
    }
    
    this.renderMedicationRecords(filtered);
  }

  renderMedicationRecords(records = this.records) {
    const listEl = document.getElementById('medicationList');
    
    if (records.length === 0) {
      listEl.innerHTML = `
        <div class="medication-empty">
          <i class="fas fa-pills"></i>
          <p data-i18n="med.no_records">No medication records yet</p>
        </div>
      `;
      return;
    }
    
    listEl.innerHTML = `
      <div class="timeline-list">
        ${records.map(record => this.renderMedicationCard(record)).join('')}
      </div>
    `;
    
    // Attach event listeners
    records.forEach(record => {
      const editBtn = document.getElementById(`edit-${record._id}`);
      const deleteBtn = document.getElementById(`delete-${record._id}`);
      
      if (editBtn) editBtn.addEventListener('click', () => this.editMedication(record));
      if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteMedication(record._id));
    });
  }

  renderMedicationCard(record) {
    const timingLabels = {
      before_breakfast: 'Before Breakfast',
      after_breakfast: 'After Breakfast',
      before_lunch: 'Before Lunch',
      after_lunch: 'After Lunch',
      before_dinner: 'Before Dinner',
      after_dinner: 'After Dinner',
      bedtime: 'Bedtime',
      other: 'Other'
    };
    
    return `
      <div class="medication-card ${record.medicationType} ${record.isRecommendation ? 'recommendation' : ''}">
        <div class="medication-header-row">
          <div class="medication-main-info">
            <div class="medication-name">
              ${record.name}
              <span class="medication-type-badge ${record.medicationType}">
                ${record.medicationType === 'insulin' ? 'Insulin' : 'Oral'}
              </span>
            </div>
            <div class="medication-details">
              <div class="medication-detail-item">
                <i class="fas fa-clock"></i>
                <span>${new Date(record.recordedAt).toLocaleString()}</span>
              </div>
              ${record.doctor ? `
                <div class="medication-detail-item">
                  <i class="fas fa-user-md"></i>
                  <span>${record.doctor.fullName}</span>
                </div>
              ` : ''}
            </div>
          </div>
          <div class="medication-dose">
            ${record.dose} <span class="unit">${record.unit}</span>
          </div>
        </div>
        
        <div class="medication-timing">
          <i class="fas fa-calendar-alt"></i>
          ${timingLabels[record.timing]}
        </div>
        
        ${record.notes ? `
          <div class="medication-notes">
            <strong>Notes:</strong> ${record.notes}
          </div>
        ` : ''}
        
        ${record.linkedGlucoseRecord ? `
          <div class="medication-linked-glucose">
            <i class="fas fa-link"></i>
            <span>Linked glucose:</span>
            <span class="glucose-value">${record.linkedGlucoseRecord.value} mg/dL</span>
          </div>
        ` : ''}
        
        ${this.userRole === 'doctor' || (this.userRole === 'patient' && !record.isRecommendation) ? `
          <div class="medication-actions-row">
            ${this.userRole === 'doctor' ? `
              <button class="btn-edit-medication" id="edit-${record._id}">
                <i class="fas fa-edit"></i>
                <span data-i18n="med.edit">Edit</span>
              </button>
            ` : ''}
            <button class="btn-delete-medication" id="delete-${record._id}">
              <i class="fas fa-trash"></i>
              <span data-i18n="med.delete">Delete</span>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderError() {
    const listEl = document.getElementById('medicationList');
    listEl.innerHTML = `
      <div class="medication-empty">
        <i class="fas fa-exclamation-circle"></i>
        <p>Failed to load medication records</p>
      </div>
    `;
  }

  updateStats() {
    const statsEl = document.getElementById('timelineStats');
    const insulinCount = this.records.filter(r => r.medicationType === 'insulin').length;
    const oralCount = this.records.filter(r => r.medicationType === 'oral').length;
    
    statsEl.innerHTML = `
      <span><i class="fas fa-syringe"></i> Insulin: ${insulinCount}</span>
      <span><i class="fas fa-pills"></i> Oral: ${oralCount}</span>
      <span><i class="fas fa-list"></i> Total: ${this.records.length}</span>
    `;
  }

  openMedicationModal(isRecommendation = false) {
    this.editingRecord = null;
    document.getElementById('medicationModal').classList.add('active');
    document.getElementById('modalTitle').textContent = isRecommendation ? 'Recommend Medication' : 'Add Dose';
    document.getElementById('medicationForm').reset();
    document.getElementById('editMedicationId').value = '';
    
    if (this.userRole === 'doctor' && this.currentPatientId) {
      document.getElementById('patientIdField').value = this.currentPatientId;
    }
  }

  closeMedicationModal() {
    document.getElementById('medicationModal').classList.remove('active');
  }

  editMedication(record) {
    this.editingRecord = record;
    document.getElementById('medicationModal').classList.add('active');
    document.getElementById('modalTitle').textContent = 'Edit Medication';
    
    document.getElementById('medicationType').value = record.medicationType;
    document.getElementById('medicationName').value = record.name;
    document.getElementById('medicationDose').value = record.dose;
    document.getElementById('medicationUnit').value = record.unit;
    document.getElementById('medicationTiming').value = record.timing;
    document.getElementById('medicationNotes').value = record.notes || '';
    document.getElementById('editMedicationId').value = record._id;
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const recordId = document.getElementById('editMedicationId').value;
    const medicationType = document.getElementById('medicationType').value;
    const name = document.getElementById('medicationName').value;
    const dose = parseFloat(document.getElementById('medicationDose').value);
    const unit = document.getElementById('medicationUnit').value;
    const timing = document.getElementById('medicationTiming').value;
    const notes = document.getElementById('medicationNotes').value;
    const patientId = document.getElementById('patientIdField').value;
    
    try {
      const token = localStorage.getItem('token');
      let url, method, body;
      
      if (recordId && this.userRole === 'doctor') {
        // Edit existing record
        url = `/api/medication/${recordId}`;
        method = 'PUT';
        body = { dose, unit, timing, notes };
      } else if (this.userRole === 'doctor' && patientId) {
        // Doctor recommendation
        url = '/api/medication/recommend';
        method = 'POST';
        body = { patientId, medicationType, name, dose, unit, timing, notes };
      } else {
        // Patient adding new record
        url = '/api/medication/add';
        method = 'POST';
        body = { medicationType, name, dose, unit, timing, notes };
      }
      
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) throw new Error('Failed to save medication record');
      
      this.closeMedicationModal();
      await this.loadMedicationRecords();
      this.showNotification('Medication record saved successfully', 'success');
    } catch (err) {
      console.error('handleSubmit error:', err);
      alert('Failed to save medication record');
    }
  }

  async deleteMedication(recordId) {
    if (!confirm('Are you sure you want to delete this medication record?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/medication/${recordId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to delete medication record');
      
      await this.loadMedicationRecords();
      this.showNotification('Medication record deleted successfully', 'success');
    } catch (err) {
      console.error('deleteMedication error:', err);
      alert('Failed to delete medication record');
    }
  }

  showNotification(message, type = 'info') {
    alert(message);
  }
}

let medicationManager;
