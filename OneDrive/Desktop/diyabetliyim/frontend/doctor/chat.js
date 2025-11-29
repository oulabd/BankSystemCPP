// frontend/doctor/chat.js
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
      const response = await fetch('/api/doctor/patients', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
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
        <span>${patient.name} (${patient.email})</span>
        <button onclick="doctorChat.openChat('${patient.id}', '${patient.name}')" data-i18n="chat.open">Open Chat</button>
      `;
      list.appendChild(li);
    });
  }

  openChat(patientId, patientName) {
    this.currentPatientId = patientId;
    document.getElementById('chatPatientName').textContent = patientName;
    document.getElementById('chatSection').style.display = 'block';
    this.loadMessages();
  }

  closeChat() {
    this.currentPatientId = null;
    document.getElementById('chatSection').style.display = 'none';
  }

  async loadMessages() {
    if (!this.currentPatientId) return;
    try {
      const response = await fetch(`/api/chat/${this.currentPatientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        this.messages = await response.json();
        this.renderMessages();
      }
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  }

  renderMessages() {
    const container = document.getElementById('doctorChatMessages');
    container.innerHTML = '';
    if (this.messages.length === 0) {
      container.innerHTML = '<div class="chat-no-messages" data-i18n="chat.no_messages">No messages yet</div>';
      return;
    }
    this.messages.forEach(msg => {
      const msgEl = document.createElement('div');
      msgEl.className = `chat-message ${msg.sender}`;
      msgEl.innerHTML = `
        <div class="chat-bubble ${msg.sender}">${msg.message}</div>
        <div class="chat-meta">${new Date(msg.timestamp).toLocaleString()}</div>
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
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ patientId: this.currentPatientId, message })
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