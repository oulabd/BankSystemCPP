
class SecurityManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.sessions = [];
    this.init();
  }

  async init() {
    this.renderUI();
    await this.loadSessions();
  }

  renderUI() {
    this.container.innerHTML = `
      <div class="security-container">
        <div class="security-header">
          <h1>أمان الحساب</h1>
          <p>قم بإدارة جلساتك النشطة وأجهزتك</p>
        </div>

        <div class="security-section">
          <h2>
            <i class="fas fa-devices"></i>
            الجلسات النشطة
          </h2>

          <div id="sessionsList">
            <div class="sessions-loading">
              <i class="fas fa-spinner fa-spin"></i>
              <p>يتم تحميل الجلسات...</p>
            </div>
          </div>

          <div class="logout-all-section" id="logoutAllSection" style="display:none;">
            <div class="logout-all-warning">
              <i class="fas fa-exclamation-triangle"></i>
              <span>
                سيؤدي هذا الإجراء إلى تسجيل خروجك من جميع الأجهزة (بما في ذلك هذا الجهاز).
              </span>
            </div>
            <button class="btn-logout-all" id="logoutAllBtn">
              <i class="fas fa-sign-out-alt"></i>
              تسجيل خروج من جميع الأجهزة
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('logoutAllBtn')?.addEventListener('click', () => this.logoutAll());
  }

  async loadSessions() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('تعذر تحميل الجلسات');

      const data = await res.json();
      this.sessions = data.sessions || [];
      this.renderSessions();
    } catch (err) {
      console.error(err);
      this.renderError();
    }
  }

  renderSessions() {
    const listEl = document.getElementById('sessionsList');

    if (this.sessions.length === 0) {
      listEl.innerHTML = `
        <div class="sessions-empty">
          <i class="fas fa-shield-alt"></i>
          <p>لا توجد جلسات نشطة</p>
        </div>
      `;
      document.getElementById('logoutAllSection').style.display = 'none';
      return;
    }

    document.getElementById('logoutAllSection').style.display = 'block';

    listEl.innerHTML = `
      <div class="sessions-list">
        ${this.sessions.map(s => this.renderSession(s)).join('')}
      </div>
    `;

    this.sessions.forEach(s => {
      const btn = document.getElementById(`logout-${s.id}`);
      if (btn) btn.addEventListener('click', () => this.logoutSession(s.id));
    });
  }

  renderSession(session) {
    const isDesktop = /Windows|macOS|Linux/.test(session.device);
    const icon = isDesktop ? 'fa-desktop' : 'fa-mobile-alt';

    return `
      <div class="session-card ${session.isCurrent ? 'current' : ''}">
        <div class="session-header">
          <div class="session-device">
            <i class="fas ${icon}"></i>
            <div>
              <h3>${session.device}</h3>
              <div><i class="fas fa-map-marker-alt"></i> ${session.ip}</div>
            </div>
          </div>

          ${!session.isCurrent ? `
            <button class="btn-logout-session" id="logout-${session.id}">
              <i class="fas fa-sign-out-alt"></i> تسجيل خروج
            </button>
          ` : ''}
        </div>

        <div class="session-meta">
          <div><strong>آخر تسجيل دخول:</strong> ${this.formatDate(session.createdAt)}</div>
          <div><strong>انتهاء الصلاحية:</strong> ${this.formatDate(session.expiresAt)}</div>
        </div>
      </div>
    `;
  }

  renderError() {
    document.getElementById('sessionsList').innerHTML = `
      <div class="sessions-empty">
        <i class="fas fa-exclamation-circle"></i>
        <p>تعذر تحميل الجلسات</p>
      </div>
    `;
  }

  async logoutSession(id) {
    if (!confirm('هل أنت متأكد من رغبتك في تسجيل الخروج من هذا الجهاز؟')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/auth/sessions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      this.sessions = this.sessions.filter(s => s.id !== id);
      this.renderSessions();
      alert('تم إنهاء الجلسة بنجاح');
    } catch {
      alert('تعذر إنهاء الجلسة');
    }
  }

  async logoutAll() {
    if (!confirm('هل أنت متأكد من رغبتك في تسجيل الخروج من جميع الأجهزة؟')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login.html';
    } catch {
      alert('تعذر تسجيل الخروج من جميع الجلسات');
    }
  }

  formatDate(dateStr) {
    const d = new Date(dateStr);
    const diff = new Date() - d;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (m < 60) return `منذ ${m} دقيقة`;
    if (h < 24) return `منذ ${h} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return d.toLocaleDateString('ar-SA');
  }
}

let securityManager;
