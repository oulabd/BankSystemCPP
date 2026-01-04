// assets/js/patient-dashboard.js
(function() {
  const AUTH_TOKEN_KEY = 'authToken';
  const ROLE_KEY = 'userRole';

  function authGuard() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('auth_token');
    const role = localStorage.getItem(ROLE_KEY);
    if (!token || role !== 'patient') {
      window.location.href = '../login.html';
      return false;
    }
    return true;
  }

  if (!authGuard()) return;

  // Navigation handling
  const navItems = document.querySelectorAll('.pd-nav li');
  const cards = document.querySelectorAll('.card');

  function showCard(cardId) {
    cards.forEach(card => {
      card.style.display = card.id === cardId ? 'block' : 'none';
    });
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const nav = item.getAttribute('data-nav');
      const cardId = nav + 'Card';
      showCard(cardId);

      // Load content based on nav
      if (nav === 'logs') {
        loadMedicalLogs();
      }
      // Add other nav handlers as needed
    });
  });

  // Default to daily card
  showCard('dailyCard');

  async function loadMedicalLogs() {
    try {
      const response = await fetch('/api/patient/logs', {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem(AUTH_TOKEN_KEY) }
      });
      if (response.ok) {
        const data = await response.json();
        renderLogs(data.logs);
      } else {
        document.getElementById('logsBody').innerHTML = '<tr><td colspan="4">Kayıtlar yüklenemedi</td></tr>';
      }
    } catch (err) {
      console.error('Kayıtlar yüklenirken hata oluştu', err);
      document.getElementById('logsBody').innerHTML = '<tr><td colspan="4">Kayıtlar yüklenirken hata oluştu</td></tr>';
    }
  }

  function renderLogs(logs) {
    const tbody = document.getElementById('logsBody');
    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">Kayıt bulunamadı</td></tr>';
      return;
    }
    tbody.innerHTML = logs.map(log => `
      <tr>
        <td>${new Date(log.createdAt).toLocaleDateString()}</td>
        <td>${capitalize(log.type.replace('_', ' '))}</td>
        <td>${log.description}</td>
        <td>${log.doctorId.fullName}</td>
      </tr>
    `).join('');

    // Rapor indir butonu etkinleştir
    document.getElementById('downloadReportBtn').addEventListener('click', downloadReport);
  }

  function downloadReport() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.id;
    const url = `/api/patient/${userId}/export`;
    window.open(url, '_blank');
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Load initial data for daily card
  // Add your daily card loading logic here
})();