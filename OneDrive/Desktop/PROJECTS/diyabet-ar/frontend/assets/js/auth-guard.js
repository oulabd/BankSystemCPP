// auth-guard.js
// Protect frontend pages by verifying token and role in localStorage
// Exposes:
//   - protectPage(requiredRole)
//   - getCurrentUser()

(function () {
  'use strict';

  function getStoredAuth() {
    try {
      // accept legacy token keys and role stored in auth_user
      let token = localStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
      // normalize token if stored as 'Bearer ...' or as JSON string
      if (token && typeof token === 'string') {
        token = token.trim();
        if (token.toLowerCase().startsWith('bearer ')) token = token.split(' ')[1];
        if (token.startsWith('{') || token.startsWith('"{')) {
          try {
            const parsed = JSON.parse(token.replace(/^"|"$/g, ''));
            token = parsed.token || parsed.accessToken || parsed.authToken || token;
          } catch (e) {
            // leave token as-is
          }
        }
      }
      let role = localStorage.getItem('userRole');
      if (!role) {
        const raw = localStorage.getItem('auth_user') || localStorage.getItem('auth_user_readable');
        if (raw) {
          try { role = JSON.parse(raw).role || null; } catch (e) { role = null; }
        }
      }
      // normalize role to lowercase for case-insensitive checks
      if (role && typeof role === 'string') role = role.toLowerCase();
      return { token, role };
    } catch (e) {
      return { token: null, role: null };
    }
  }

  function parseJwt(token) {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  function getCurrentUser() {
    const { token, role } = getStoredAuth();
    const payload = parseJwt(token);
    return { token, role, payload };
  }

  function redirectToLogin() {
    try {
      // Hide document to avoid flash
      if (document && document.documentElement) {
        document.documentElement.style.visibility = 'hidden';
      }
    } catch (e) {
      // ignore
    }
    // use replace so history isn't polluted
    window.location.replace('/login.html');
  }

  function roleAllowed(requiredRole, currentRole) {
    if (!requiredRole) return true; // no restriction
    if (!currentRole) return false;
    const cur = String(currentRole).toLowerCase();
    if (Array.isArray(requiredRole)) {
      return requiredRole.map(r => String(r).toLowerCase()).includes(cur);
    }
    return cur === String(requiredRole).toLowerCase();
  }

  function protectPage(requiredRole) {
      let { token, role } = getStoredAuth();
      console.log('[auth-guard] protectPage استدعيت:', { token, role, requiredRole });
      // if token exists but role missing, try to extract role from JWT payload
      if (token && !role) {
        const payload = parseJwt(token);
        if (payload) {
          // common fields where role may be present
          role = payload.role || (payload.user && payload.user.role) || (payload.data && payload.data.user && payload.data.user.role) || null;
          if (role && typeof role === 'string') role = role.toLowerCase();
        }
      }
      if (!token || !role) {
        console.warn('[auth-guard] إعادة التوجيه لتسجيل الدخول: الرمز أو الدور مفقود', { token, role });
        redirectToLogin();
        return false;
      }
      if (!roleAllowed(requiredRole, role)) {
        console.warn('[auth-guard] إعادة التوجيه لتسجيل الدخول: الدور غير مسموح', { requiredRole, role });
        redirectToLogin();
        return false;
      }
      console.log('[auth-guard] تم منح الوصول', { token, role, requiredRole });
      return true;
    }

  // expose globally
  window.protectPage = protectPage;
  window.getCurrentUser = getCurrentUser;

  // If this script is included and an inline caller immediately invokes protectPage,
  // the check will run synchronously (recommended to place this script in <head>). 
})();
