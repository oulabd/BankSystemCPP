class NotificationManager {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.dropdownOpen = false;
    this.init();
  }

  async init() {
    this.createUI();
    await this.fetchUnreadCount();
    await this.fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    setInterval(() => this.fetchUnreadCount(), 30000);
  }

  createUI() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    container.innerHTML = `
      <button class="notification-bell" id="notificationBell">
        <i class="fas fa-bell"></i>
        <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
      </button>
      <div class="notification-dropdown" id="notificationDropdown" style="display: none;">
        <div class="notification-header">
          <h3 data-i18n="notifications.title">Notifications</h3>
          <button class="mark-all-read" id="markAllRead" data-i18n="notifications.mark_all">Mark all as read</button>
        </div>
        <div class="notification-list" id="notificationList">
          <div class="loading">Loading...</div>
        </div>
      </div>
    `;

    // Find navbar or header and append
    const navbar = document.querySelector('.navbar') || document.querySelector('header') || document.body;
    navbar.appendChild(container);

    // Event listeners
    document.getElementById('notificationBell').addEventListener('click', () => this.toggleDropdown());
    document.getElementById('markAllRead').addEventListener('click', () => this.markAllAsRead());
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.notification-container')) {
        this.closeDropdown();
      }
    });
  }

  async fetchUnreadCount() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/notifications/unread-count', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      this.unreadCount = data.count || 0;
      this.updateBadge();
    } catch (err) {
      console.error('fetchUnreadCount error:', err);
    }
  }

  async fetchNotifications() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      this.notifications = data.notifications || [];
      this.renderNotifications();
    } catch (err) {
      console.error('fetchNotifications error:', err);
      this.renderError();
    }
  }

  updateBadge() {
    const badge = document.getElementById('notificationBadge');
    if (this.unreadCount > 0) {
      badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  renderNotifications() {
    const list = document.getElementById('notificationList');
    
    if (this.notifications.length === 0) {
      list.innerHTML = `<div class="no-notifications" data-i18n="notifications.no_notifications">No notifications</div>`;
      return;
    }

    list.innerHTML = this.notifications.map(n => `
      <div class="notification-item ${!n.read ? 'unread' : ''}" data-id="${n._id}">
        <div class="notification-content" onclick="notificationManager.handleNotificationClick('${n._id}', '${n.link || ''}')">
          <div class="notification-icon">
            ${this.getIcon(n.type)}
          </div>
          <div class="notification-text">
            <p class="notification-message">${n.message}</p>
            <span class="notification-time">${this.formatTime(n.createdAt)}</span>
          </div>
        </div>
        <button class="notification-delete" onclick="notificationManager.deleteNotification('${n._id}')" title="Delete">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `).join('');
  }

  renderError() {
    const list = document.getElementById('notificationList');
    list.innerHTML = `<div class="notification-error">Failed to load notifications</div>`;
  }

  getIcon(type) {
    const icons = {
      record_high: '<i class="fas fa-exclamation-triangle" style="color: #e11d48;"></i>',
      record_low: '<i class="fas fa-exclamation-circle" style="color: #f59e0b;"></i>',
      prescription_new: '<i class="fas fa-prescription" style="color: #20caa8;"></i>',
      lab_request: '<i class="fas fa-flask" style="color: #3b82f6;"></i>',
      lab_result: '<i class="fas fa-file-medical" style="color: #8b5cf6;"></i>',
      comment: '<i class="fas fa-comment" style="color: #10b981;"></i>',
      message: '<i class="fas fa-envelope" style="color: #6366f1;"></i>',
      appointment: '<i class="fas fa-calendar" style="color: #ec4899;"></i>'
    };
    return icons[type] || '<i class="fas fa-bell"></i>';
  }

  formatTime(date) {
    const now = new Date();
    const notificationDate = new Date(date);
    const diff = now - notificationDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return notificationDate.toLocaleDateString();
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.style.display = this.dropdownOpen ? 'block' : 'none';
    
    if (this.dropdownOpen) {
      this.fetchNotifications();
    }
  }

  closeDropdown() {
    this.dropdownOpen = false;
    document.getElementById('notificationDropdown').style.display = 'none';
  }

  async handleNotificationClick(id, link) {
    await this.markAsRead(id);
    if (link) {
      window.location.href = link;
    }
  }

  async markAsRead(id) {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/read/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Update local state
      const notification = this.notifications.find(n => n._id === id);
      if (notification && !notification.read) {
        notification.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.updateBadge();
        this.renderNotifications();
      }
    } catch (err) {
      console.error('markAsRead error:', err);
    }
  }

  async markAllAsRead() {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      this.notifications.forEach(n => n.read = true);
      this.unreadCount = 0;
      this.updateBadge();
      this.renderNotifications();
    } catch (err) {
      console.error('markAllAsRead error:', err);
    }
  }

  async deleteNotification(id) {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const notification = this.notifications.find(n => n._id === id);
      if (notification && !notification.read) {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
      
      this.notifications = this.notifications.filter(n => n._id !== id);
      this.updateBadge();
      this.renderNotifications();
    } catch (err) {
      console.error('deleteNotification error:', err);
    }
  }
}

// Initialize when DOM is ready
let notificationManager;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    notificationManager = new NotificationManager();
  });
} else {
  notificationManager = new NotificationManager();
}
