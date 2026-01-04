
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
            جرعات الأدوية والأنسولين
          </h1>
          <div class="medication-actions">
            ${this.userRole === 'patient' ? `
              <button class="btn-add-medication" id="addMedicationBtn">
                <i class="fas fa-plus"></i>
                إضافة جرعة
              </button>
            ` : ''}
            ${this.userRole === 'doctor' ? `
              <button class="btn-recommend-medication" id="recommendMedicationBtn">
                <i class="fas fa-prescription"></i>
                اقتراح دواء
              </button>
            ` : ''}
          </div>
        </div>

        <div class="medication-filters">
          <div class="filter-group">
            <label>النوع</label>
            <select id="medicationTypeFilter">
              <option value="">الكل</option>
              <option value="insulin">الأنسولين</option>
              <option value="oral">دواء عن طريق الفم</option>
            </select>
          </div>
          <div class="filter-group">
            <label>تاريخ البدء</label>
            <input type="date" id="startDateFilter">
          </div>
          <div class="filter-group">
            <label>تاريخ الانتهاء</label>
            <input type="date" id="endDateFilter">
          </div>
        </div>

        <div class="medication-timeline">
          <div class="timeline-header">
            <h2>تاريخ الجرعات</h2>
            <div class="timeline-stats" id="timelineStats"></div>
          </div>
          <div id="medicationList">
            <div class="medication-loading">
              <i class="fas fa-spinner fa-spin"></i>
              <p>يتم تحميل سجلات الأدوية...</p>
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
            <h2 id="modalTitle">إضافة جرعة</h2>
            <button class="close-modal" id="closeMedicationModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form class="medication-form" id="medicationForm">
            <div class="form-group">
              <label>النوع *</label>
              <select id="medicationType" required>
                <option value="">اختر النوع...</option>
                <option value="insulin">الأنسولين</option>
                <option value="oral">دواء عن طريق الفم</option>
              </select>
            </div>

            <div class="form-group">
              <label>اسم الدواء *</label>
              <input type="text" id="medicationName" required placeholder="مثال: Metformin">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>الجرعة *</label>
                <input type="number" id="medicationDose" min="0" step="0.01" required>
              </div>
              <div class="form-group">
                <label>الوحدة *</label>
                <select id="medicationUnit" required>
                  <option value="IU">IU</option>
                  <option value="mg">mg</option>
                  <option value="mcg">mcg</option>
                  <option value="mL">mL</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>التوقيت *</label>
              <select id="medicationTiming" required>
                <option value="before_breakfast">قبل الإفطار</option>
                <option value="after_breakfast">بعد الإفطار</option>
                <option value="before_lunch">قبل الغداء</option>
                <option value="after_lunch">بعد الغداء</option>
                <option value="before_dinner">قبل العشاء</option>
                <option value="after_dinner">بعد العشاء</option>
                <option value="bedtime">قبل النوم</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            <div class="form-group">
              <label>ملاحظات</label>
              <textarea id="medicationNotes" placeholder="ملاحظات إضافية..."></textarea>
            </div>

            <input type="hidden" id="editMedicationId">
            <input type="hidden" id="patientIdField">

            <button type="submit" class="btn-submit-medication">
              <i class="fas fa-save"></i>
              حفظ الجرعة
            </button>
          </form>
        </div>
      </div>
    `;
  }

  renderError() {
    document.getElementById('medicationList').innerHTML = `
      <div class="medication-empty">
        <i class="fas fa-exclamation-circle"></i>
        <p>تعذر تحميل سجلات الأدوية</p>
      </div>
    `;
  }

  showNotification(message) {
    alert(message);
  }
}

let medicationManager;
