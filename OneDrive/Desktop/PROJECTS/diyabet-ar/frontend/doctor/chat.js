

// frontend/doctor/chat.js
function getToken() {
  return (
    localStorage.getItem('authToken') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token') ||
    ''
  );
}

class DoctorChatSystem {
  constructor() {
    this.currentPatientId = null;
    this.messages = [];
    this.patients = [];
    this.init();
  }

  init() {
    this.loadPatients();
    this.bindEvents();
    this.startPolling();
  }

  bindEvents() {
    document.getElementById('backBtn').onclick = () => window.history.back();
    document.getElementById('closeChatBtn').onclick = () => this.closeChat();
    document.getElementById('doctorChatSendBtn').onclick = () => this.sendMessage();
    document.getElementById('doctorChatInput').onkeypress = (e) => {
      if (e.key === 'Enter') this.sendMessage();
    };
  }

  async loadPatients() {
    try {
      const response = await fetch(`${window.API_BASE}/doctor/patients`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      if (response.ok) {
        this.patients = await response.json();
        this.renderPatients();
      }
    } catch (err) {
      console.error('Failed to load patients', err);
    }
  }

  renderPatients() {
    const list = document.getElementById('patientsList');
    list.innerHTML = '';

    this.patients.forEach(patient => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${patient.fullName} (${patient.email})</span>
        <button onclick="doctorChat.openChat('${patient._id}','${patient.fullName}')">
          فتح المحادثة
        </button>
      `;
      list.appendChild(li);
    });
  }


  openChat(patientId, patientName) {
    this.currentPatientId = patientId;
    document.getElementById('chatPatientName').textContent = patientName;
    // Show chat-main section instead of non-existent chatSection
    document.querySelector('.chat-main').style.display = 'flex';
    document.getElementById('chatHeader').style.display = '';
    document.getElementById('chatInputRow').style.display = '';
    this.loadMessages();
  }

  closeChat() {
    this.currentPatientId = null;
    // Hide chat-main section
    document.querySelector('.chat-main').style.display = 'none';
  }

  async loadMessages() {
    if (!this.currentPatientId) return;

    try {
      const response = await fetch(`${window.API_BASE}/doctor/chat/${this.currentPatientId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      if (response.ok) {
        const data = await response.json();
        this.messages = data.messages || data;
        this.renderMessages();
      }
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  }

  renderMessages() {
    const container = document.getElementById('doctorChatMessages');
    container.innerHTML = '';

    if (!this.messages.length) {
      container.innerHTML = '<div class="chat-no-messages">لا توجد رسائل بعد</div>';
      return;
    }

    const myId = localStorage.getItem('userId');
    this.messages.forEach(msg => {
      const isMine = (msg.sender && (msg.sender._id || msg.sender) === myId);
      const side = isMine ? 'sent' : 'received';

      const msgEl = document.createElement('div');
      msgEl.className = `chat-message ${side}`;
      msgEl.innerHTML = `
        <div class="chat-bubble ${side}">${msg.text || ''}</div>
        <div class="chat-meta">${new Date(msg.createdAt).toLocaleString('ar-SA')}</div>
      `;

      container.appendChild(msgEl);
    });

    this.scrollToBottom();
  }

  async sendMessage() {
    const input = document.getElementById('doctorChatInput');
    const message = input.value.trim();
    if (!message || !this.currentPatientId) return;

    try {
      const response = await fetch(`${window.API_BASE}/doctor/chat/${this.currentPatientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          messageText: message
        })
      });

      if (response.ok) {
        input.value = '';
        this.loadMessages();
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  }

  scrollToBottom() {
    const container = document.getElementById('doctorChatMessages');
    container.scrollTop = container.scrollHeight;
  }

  startPolling() {
    setInterval(() => {
      if (this.currentPatientId) this.loadMessages();
    }, 10000);
  }
}

const doctorChat = new DoctorChatSystem();
