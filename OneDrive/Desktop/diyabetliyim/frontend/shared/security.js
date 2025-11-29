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
          <h1 data-i18n="security.title">Account Security</h1>
          <p data-i18n="security.manage_sessions">Manage your active sessions and devices</p>
        </div>
        
        <div class="security-section">
          <h2>
            <i class="fas fa-devices"></i>
            <span data-i18n="security.active_sessions">Active Sessions</span>
          </h2>
          
          <div id="sessionsList">
            <div class="sessions-loading">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Loading sessions...</p>
            </div>
          </div>
          
          <div class="logout-all-section" id="logoutAllSection" style="display: none;">
            <div class="logout-all-warning">
              <i class="fas fa-exclamation-triangle"></i>
              <span data-i18n="security.logout_all_warning">
                This will log you out from all devices including this one.
              </span>
            </div>
            <button class="btn-logout-all" id="logoutAllBtn">
              <i class="fas fa-sign-out-alt"></i>
              <span data-i18n="security.logout_all">Logout All Devices</span>
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
      
      if (!res.ok) throw new Error('Failed to load sessions');
      
      const data = await res.json();
      this.sessions = data.sessions || [];
      this.renderSessions();
    } catch (err) {
      console.error('loadSessions error:', err);
      this.renderError();
    }
  }

  renderSessions() {
    const listEl = document.getElementById('sessionsList');
    
    if (this.sessions.length === 0) {
      listEl.innerHTML = `
        <div class="sessions-empty">
          <i class="fas fa-shield-alt"></i>
          <p data-i18n="security.no_sessions">No active sessions</p>
        </div>
      `;
      document.getElementById('logoutAllSection').style.display = 'none';
      return;
    }
    
    document.getElementById('logoutAllSection').style.display = 'block';
    
    listEl.innerHTML = `
      <div class="sessions-list">
        ${this.sessions.map(session => this.renderSession(session)).join('')}
      </div>
    `;
    
    // Attach event listeners
    this.sessions.forEach(session => {
      const btn = document.getElementById(`logout-${session.id}`);
      if (btn) {
        btn.addEventListener('click', () => this.logoutSession(session.id));
      }
    });
  }

  renderSession(session) {
    const isDesktop = session.device.includes('Windows') || session.device.includes('macOS') || session.device.includes('Linux');
    const icon = isDesktop ? 'fa-desktop' : 'fa-mobile-alt';
    
    return `
      <div class="session-card ${session.isCurrent ? 'current' : ''}" id="session-${session.id}">
        <div class="session-header">
          <div class="session-device">
            <div class="session-icon">
              <i class="fas ${icon}"></i>
            </div>
            <div class="session-info">
              <h3>${session.device}</h3>
              <div class="session-ip">
                <i class="fas fa-map-marker-alt"></i>
                ${session.ip}
              </div>
            </div>
          </div>
          
          ${!session.isCurrent ? `
            <div class="session-actions">
              <button class="btn-logout-session" id="logout-${session.id}">
                <i class="fas fa-sign-out-alt"></i>
                <span data-i18n="security.logout_device">Logout</span>
              </button>
            </div>
          ` : ''}
        </div>
        
        <div class="session-meta">
          <div class="session-meta-item">
            <i class="fas fa-clock"></i>
            <span>
              <span data-i18n="security.last_login">Last Login:</span>
              ${this.formatDate(session.createdAt)}
            </span>
          </div>
          <div class="session-meta-item">
            <i class="fas fa-hourglass-end"></i>
            <span>
              <span data-i18n="security.expire">Expires:</span>
              ${this.formatDate(session.expiresAt)}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  renderError() {
    const listEl = document.getElementById('sessionsList');
    listEl.innerHTML = `
      <div class="sessions-empty">
        <i class="fas fa-exclamation-circle"></i>
        <p>Failed to load sessions</p>
      </div>
    `;
  }

  async logoutSession(sessionId) {
    if (!confirm(this.getTranslation('security.confirm_logout_device'))) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to logout session');
      
      // Remove from UI
      this.sessions = this.sessions.filter(s => s.id !== sessionId);
      this.renderSessions();
      
      this.showNotification('Session terminated successfully', 'success');
    } catch (err) {
      console.error('logoutSession error:', err);
      this.showNotification('Failed to logout session', 'error');
    }
  }

  async logoutAll() {
    if (!confirm(this.getTranslation('security.confirm_logout_all'))) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to logout all sessions');
      
      // Clear local storage and redirect to login
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login.html';
    } catch (err) {
      console.error('logoutAll error:', err);
      this.showNotification('Failed to logout all sessions', 'error');
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes} minutes ago`;
      }
      return `${hours} hours ago`;
    }
    
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString();
  }

  getTranslation(key) {
    const translations = {
      'security.confirm_logout_device': 'Are you sure you want to logout this device?',
      'security.confirm_logout_all': 'Are you sure you want to logout from ALL devices? You will be logged out immediately.'
    };
    return translations[key] || key;
  }

  showNotification(message, type = 'info') {
    // Simple notification - you can integrate with your existing notification system
    alert(message);
  }
}

let securityManager;
