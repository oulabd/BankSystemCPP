// auth-guard.js
// Protect frontend pages by verifying token and role in localStorage
// Exposes:
//   - protectPage(requiredRole)
//   - getCurrentUser()

(function () {
  'use strict';

  function getStoredAuth() {
    try {
      const token = localStorage.getItem('authToken');
      const role = localStorage.getItem('userRole');
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
    if (currentRole === 'admin') return true; // admin bypass
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(currentRole);
    }
    return currentRole === requiredRole;
  }

  function protectPage(requiredRole) {
    const { token, role } = getStoredAuth();
    // if missing token or role -> redirect
    if (!token || !role) {
      redirectToLogin();
      return false;
    }

    // check role
    if (!roleAllowed(requiredRole, role)) {
      redirectToLogin();
      return false;
    }

    // allowed
    return true;
  }

  // expose globally
  window.protectPage = protectPage;
  window.getCurrentUser = getCurrentUser;

  // If this script is included and an inline caller immediately invokes protectPage,
  // the check will run synchronously (recommended to place this script in <head>). 
})();
