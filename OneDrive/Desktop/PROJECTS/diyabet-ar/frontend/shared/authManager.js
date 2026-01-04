
class AuthManager {
  constructor() {
    this.refreshInterval = null;
    this.init();
  }

  init() {
    // Auto-refresh token every 25 minutes (before 30min expiry)
    this.startAutoRefresh();
    
    // Intercept 401 errors globally
    this.setupInterceptor();
  }

  startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.refreshToken();
    }, 25 * 60 * 1000); // 25 minutes
  }

  async refreshToken() {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include' // Send cookies
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.accessToken);
        console.log('تم تحديث الرمز بنجاح.');
      } else {
        // Refresh failed - redirect to login
        this.handleLogout();
      }
    } catch (err) {
      console.error('فشل تحديث الرمز:', err);
    }
  }

  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('خطأ في تسجيل الخروج:', err);
    } finally {
      this.handleLogout();
    }
  }

  handleLogout() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login.html';
  }

  setupInterceptor() {
    // Override fetch to handle 401 errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      if (response.status === 401) {
        // Try to refresh token once
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request with new token
          const token = localStorage.getItem('token');
          if (args[1] && args[1].headers) {
            args[1].headers['Authorization'] = `Bearer ${token}`;
          }
          return originalFetch(...args);
        }
      }
      
      return response;
    };
  }
}

// Initialize auth manager globally
const authManager = new AuthManager();
