class LabsManager {
  constructor(containerId, userRole) {
    this.container = document.getElementById(containerId);
    this.userRole = userRole;
    this.labReports = [];
    this.selectedFile = null;
    this.currentPatientId = null;
    this.init();
  }

  async init() {
    this.renderUI();
    
    // Get patient ID from URL if doctor
    if (this.userRole === 'doctor') {
      const urlParams = new URLSearchParams(window.location.search);
      this.currentPatientId = urlParams.get('patientId');
    }
    
    await this.loadLabReports();
    this.setupEventListeners();
  }

  renderUI() {
    this.container.innerHTML = `
      <div class="labs-container">
        <div class="labs-header">
          <h1 data-i18n="labs.title">Lab Results</h1>
          <button class="btn-upload-lab" id="uploadLabBtn">
            <i class="fas fa-upload"></i>
            <span data-i18n="labs.upload">Upload Lab Report</span>
          </button>
        </div>
        
        <div id="labsList">
          <div class="labs-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading lab reports...</p>
          </div>
        </div>
      </div>
      
      ${this.renderUploadModal()}
      ${this.userRole === 'doctor' ? this.renderReviewModal() : ''}
    `;
  }

  renderUploadModal() {
    return `
      <div class="upload-modal" id="uploadModal">
        <div class="upload-modal-content">
          <div class="upload-modal-header">
            <h2 data-i18n="labs.upload">Upload Lab Report</h2>
            <button class="close-modal" id="closeUploadModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <form class="upload-form" id="uploadForm">
            <div class="form-group">
              <label data-i18n="labs.type">Lab Type</label>
              <select id="labType" required>
                <option value="">Select type...</option>
                <option value="HbA1c">HbA1c</option>
                <option value="Glucose Fasting">Glucose Fasting</option>
                <option value="CBC">CBC (Complete Blood Count)</option>
                <option value="Lipid Panel">Lipid Panel</option>
                <option value="Kidney Function">Kidney Function</option>
                <option value="Liver Function">Liver Function</option>
                <option value="Thyroid">Thyroid</option>
                <option value="Urinalysis">Urinalysis</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div class="form-group">
              <label data-i18n="labs.file">File (PDF, JPG, PNG - Max 10MB)</label>
              <div class="file-upload-area" id="fileUploadArea">
                <i class="fas fa-cloud-upload-alt"></i>
                <p class="file-upload-text" data-i18n="labs.drag_drop">
                  Drag & drop file here or click to browse
                </p>
                <input type="file" id="labFileInput" accept=".pdf,.jpg,.jpeg,.png" style="display: none;">
              </div>
              <div class="file-preview" id="filePreview">
                <i class="fas fa-file"></i>
                <span id="fileName"></span>
                <button type="button" class="btn-delete-lab" onclick="labsManager.removeFile()">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <button type="submit" class="btn-submit-upload" id="submitUpload">
              <i class="fas fa-upload"></i>
              <span data-i18n="labs.upload">Upload</span>
            </button>
          </form>
        </div>
      </div>
    `;
  }

  renderReviewModal() {
    return `
      <div class="review-modal" id="reviewModal">
        <div class="review-modal-content">
          <div class="upload-modal-header">
            <h2 data-i18n="labs.review">Review Lab Report</h2>
            <button class="close-modal" id="closeReviewModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <form class="upload-form" id="reviewForm">
            <div class="form-group">
              <label data-i18n="labs.status">Status</label>
              <div class="status-buttons" id="statusButtons">
                <button type="button" class="status-button reviewed" data-status="reviewed">
                  <i class="fas fa-check-circle"></i> Reviewed
                </button>
                <button type="button" class="status-button retest" data-status="retest">
                  <i class="fas fa-redo"></i> Request Retest
                </button>
                <button type="button" class="status-button needs_followup" data-status="needs_followup">
                  <i class="fas fa-exclamation-triangle"></i> Needs Follow-Up
                </button>
              </div>
              <input type="hidden" id="reviewStatus" required>
              <input type="hidden" id="reviewLabId">
            </div>
            
            <div class="form-group">
              <label data-i18n="labs.comment">Doctor Comment</label>
              <textarea id="doctorComment" rows="4" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px;"></textarea>
            </div>
            
            <button type="submit" class="btn-submit-upload">
              <i class="fas fa-save"></i>
              <span data-i18n="labs.save_review">Save Review</span>
            </button>
          </form>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    document.getElementById('uploadLabBtn').addEventListener('click', () => this.openUploadModal());
    document.getElementById('closeUploadModal').addEventListener('click', () => this.closeUploadModal());
    document.getElementById('uploadForm').addEventListener('submit', (e) => this.handleUpload(e));
    
    const fileArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('labFileInput');
    
    fileArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    
    // Drag and drop
    fileArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileArea.classList.add('dragging');
    });
    
    fileArea.addEventListener('dragleave', () => {
      fileArea.classList.remove('dragging');
    });
    
    fileArea.addEventListener('drop', (e) => {
      e.preventDefault();
      fileArea.classList.remove('dragging');
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        this.handleFileSelect({ target: fileInput });
      }
    });
    
    if (this.userRole === 'doctor') {
      document.getElementById('closeReviewModal').addEventListener('click', () => this.closeReviewModal());
      document.getElementById('reviewForm').addEventListener('submit', (e) => this.handleReview(e));
      
      document.querySelectorAll('.status-button').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.status-button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          document.getElementById('reviewStatus').value = btn.dataset.status;
        });
      });
    }
  }

  async loadLabReports() {
    try {
      const token = localStorage.getItem('token');
      let url = '/api/labs/mine';
      
      if (this.userRole === 'doctor' && this.currentPatientId) {
        url = `/api/labs/patient/${this.currentPatientId}`;
      }
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to load lab reports');
      
      const data = await res.json();
      this.labReports = data.labReports || [];
      this.renderLabReports();
    } catch (err) {
      console.error('loadLabReports error:', err);
      this.renderError();
    }
  }

  renderLabReports() {
    const listEl = document.getElementById('labsList');
    
    if (this.labReports.length === 0) {
      listEl.innerHTML = `
        <div class="labs-empty">
          <i class="fas fa-flask"></i>
          <p data-i18n="labs.no_reports">No lab reports yet</p>
        </div>
      `;
      return;
    }
    
    listEl.innerHTML = `
      <div class="labs-grid">
        ${this.labReports.map(lab => this.renderLabCard(lab)).join('')}
      </div>
    `;
    
    // Attach event listeners
    this.labReports.forEach(lab => {
      document.getElementById(`view-${lab._id}`)?.addEventListener('click', () => this.viewLab(lab));
      document.getElementById(`review-${lab._id}`)?.addEventListener('click', () => this.openReviewModal(lab));
      document.getElementById(`delete-${lab._id}`)?.addEventListener('click', () => this.deleteLab(lab._id));
    });
  }

  renderLabCard(lab) {
    const statusText = {
      pending: 'Pending',
      reviewed: 'Reviewed',
      retest: 'Retest Needed',
      needs_followup: 'Needs Follow-Up'
    };
    
    return `
      <div class="lab-card">
        <div class="lab-card-header">
          <div class="lab-type">
            <div class="lab-icon">
              <i class="fas fa-file-medical"></i>
            </div>
            <div class="lab-type-info">
              <h3>${lab.type}</h3>
              <div class="lab-date">
                ${new Date(lab.uploadedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <span class="lab-status-badge ${lab.status}">
            ${statusText[lab.status]}
          </span>
        </div>
        
        <div class="lab-file-info">
          <i class="fas ${lab.fileType.includes('pdf') ? 'fa-file-pdf' : 'fa-image'}"></i>
          <span>${lab.fileName}</span>
        </div>
        
        ${lab.doctorComment ? `
          <div class="lab-comment">
            <div class="lab-comment-label" data-i18n="labs.comment">Doctor Comment</div>
            <p class="lab-comment-text">${lab.doctorComment}</p>
          </div>
        ` : ''}
        
        <div class="lab-actions">
          <button class="btn-view-lab" id="view-${lab._id}">
            <i class="fas fa-eye"></i>
            <span data-i18n="labs.view">View</span>
          </button>
          ${this.userRole === 'doctor' ? `
            <button class="btn-review-lab" id="review-${lab._id}">
              <i class="fas fa-edit"></i>
              <span data-i18n="labs.review">Review</span>
            </button>
            <button class="btn-delete-lab" id="delete-${lab._id}">
              <i class="fas fa-trash"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderError() {
    const listEl = document.getElementById('labsList');
    listEl.innerHTML = `
      <div class="labs-empty">
        <i class="fas fa-exclamation-circle"></i>
        <p>Failed to load lab reports</p>
      </div>
    `;
  }

  openUploadModal() {
    document.getElementById('uploadModal').classList.add('active');
  }

  closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
    document.getElementById('uploadForm').reset();
    this.removeFile();
  }

  openReviewModal(lab) {
    document.getElementById('reviewModal').classList.add('active');
    document.getElementById('reviewLabId').value = lab._id;
    document.getElementById('reviewStatus').value = lab.status;
    document.getElementById('doctorComment').value = lab.doctorComment || '';
    
    // Set active status button
    document.querySelectorAll('.status-button').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.status === lab.status) {
        btn.classList.add('active');
      }
    });
  }

  closeReviewModal() {
    document.getElementById('reviewModal').classList.remove('active');
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF, JPG, and PNG files are allowed');
      return;
    }
    
    this.selectedFile = file;
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('filePreview').classList.add('active');
  }

  removeFile() {
    this.selectedFile = null;
    document.getElementById('labFileInput').value = '';
    document.getElementById('filePreview').classList.remove('active');
  }

  async handleUpload(e) {
    e.preventDefault();
    
    if (!this.selectedFile) {
      alert('Please select a file');
      return;
    }
    
    const type = document.getElementById('labType').value;
    if (!type) {
      alert('Please select a lab type');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('type', type);
      
      if (this.userRole === 'doctor' && this.currentPatientId) {
        formData.append('patientId', this.currentPatientId);
      }
      
      const res = await fetch('/api/labs/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!res.ok) throw new Error('Upload failed');
      
      this.closeUploadModal();
      await this.loadLabReports();
      this.showNotification('Lab report uploaded successfully', 'success');
    } catch (err) {
      console.error('handleUpload error:', err);
      alert('Failed to upload lab report');
    }
  }

  async handleReview(e) {
    e.preventDefault();
    
    const labId = document.getElementById('reviewLabId').value;
    const status = document.getElementById('reviewStatus').value;
    const doctorComment = document.getElementById('doctorComment').value;
    
    if (!status) {
      alert('Please select a status');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/labs/${labId}/review`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, doctorComment })
      });
      
      if (!res.ok) throw new Error('Review failed');
      
      this.closeReviewModal();
      await this.loadLabReports();
      this.showNotification('Lab report reviewed successfully', 'success');
    } catch (err) {
      console.error('handleReview error:', err);
      alert('Failed to review lab report');
    }
  }

  viewLab(lab) {
    // Use secure file download endpoint
    const token = localStorage.getItem('token');
    window.open(`/api/labs/file/${lab._id}?token=${token}`, '_blank');
  }

  async deleteLab(labId) {
    if (!confirm('Are you sure you want to delete this lab report?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/labs/${labId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Delete failed');
      
      await this.loadLabReports();
      this.showNotification('Lab report deleted successfully', 'success');
    } catch (err) {
      console.error('deleteLab error:', err);
      alert('Failed to delete lab report');
    }
  }

  showNotification(message, type = 'info') {
    // Simple notification - integrate with your notification system
    alert(message);
  }
}

let labsManager;
