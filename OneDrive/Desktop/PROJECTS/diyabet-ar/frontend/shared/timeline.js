
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
      this.showError('لم يتم تحديد المريض');
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
            الجدول الزمني الطبي للمريض
          </h1>
        </div>

        <div class="patient-info" id="patientInfo">
          <div class="timeline-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>يتم تحميل معلومات المريض...</p>
          </div>
        </div>

        <div class="timeline-filters">
          <div class="filter-group">
            <label>Olay Türü</label>
            <select id="eventTypeFilter">
              <option value="">جميع الأحداث</option>
              <option value="glucose">🩸 جلوكوز</option>
              <option value="prescription">💊 الوصفات الطبية</option>
              <option value="lab">🔬 المختبر</option>
              <option value="note">📝 ملاحظات الطبيب</option>
              <option value="appointment">📅 المواعيد</option>
              <option value="medication">💉 الأدوية</option>
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

        <div class="timeline-wrapper">
          <div class="timeline" id="timelineList">
            <div class="timeline-loading">
              <i class="fas fa-spinner fa-spin"></i>
              <p>يتم تحميل الجدول الزمني...</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async loadTimeline() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/doctor/patient/${this.patientId}/timeline`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('تعذر تحميل الجدول الزمني');
      const data = await res.json();
      this.timeline = data.timeline || [];
      this.patient = data.patient;
      this.summary = data.summary;

      this.renderPatientInfo();
      this.renderTimeline();
    } catch (err) {
      console.error(err);
      this.showError('تعذر تحميل الجدول الزمني');
    }
  }

  renderPatientInfo() {
    const infoEl = document.getElementById('patientInfo');
    infoEl.innerHTML = `
      <h2>${this.patient.name}</h2>
      <p style="color:#6b7280;font-size:14px;">ID: ${this.patient.identityNumber}</p>

      <div class="patient-stats">
        <div class="stat-item"><div class="stat-value">${this.summary.glucoseRecords}</div><div class="stat-label">Glikoz Kayıtları</div></div>
        <div class="stat-item"><div class="stat-value">${this.summary.prescriptions}</div><div class="stat-label">الوصفات الطبية</div></div>
        <div class="stat-item"><div class="stat-value">${this.summary.labReports}</div><div class="stat-label">تقارير المختبر</div></div>
        <div class="stat-item"><div class="stat-value">${this.summary.doctorNotes}</div><div class="stat-label">ملاحظات الطبيب</div></div>
        <div class="stat-item"><div class="stat-value">${this.summary.appointments}</div><div class="stat-label">المواعيد</div></div>
        <div class="stat-item"><div class="stat-value">${this.summary.medications}</div><div class="stat-label">الأدوية</div></div>
      </div>
    `;
  }

  formatTimeAgo(date) {
    const diff = new Date() - date;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);

    if (m < 1) return 'قبل قليل';
    if (m < 60) return `قبل ${m} دقيقة`;
    if (h < 24) return `قبل ${h} ساعة`;
    if (d < 7) return `قبل ${d} يوم`;
    return date.toLocaleDateString('ar-EG');
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
