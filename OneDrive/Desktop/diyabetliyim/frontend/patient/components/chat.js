// frontend/patient/components/chat.js
class ChatSystem {
  constructor() {
    this.patientId = localStorage.getItem('patientId'); // Assume stored on login
    this.doctorId = localStorage.getItem('doctorId'); // Assume stored
    this.messages = [];
    this.unreadCount = 0;
    this.init();
  }

  init() {
    this.createFloatingButton();
    this.createModal();
    this.loadMessages();
    this.startPolling();
  }

  createFloatingButton() {
    const btn = document.createElement('button');
    btn.className = 'chat-floating-btn';
    btn.innerHTML = '💬';
    btn.onclick = () => this.openModal();
    document.body.appendChild(btn);
    this.floatingBtn = btn;
    this.updateUnreadBadge();
  }

  createModal() {
    const modal = document.createElement('div');
    modal.className = 'chat-modal';
    modal.innerHTML = `
      <div class="chat-modal-content">
        <div class="chat-header" data-i18n="chat.title">Doctor Communication</div>
        <div class="chat-messages" id="chatMessages"></div>
        <div class="chat-input-area">
          <input type="text" class="chat-input" id="chatInput" placeholder="Write your message..." data-i18n="chat.placeholder">
          <button class="chat-send-btn" id="chatSendBtn" data-i18n="chat.send">Send</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.modal = modal;
    this.messagesContainer = modal.querySelector('#chatMessages');
    this.input = modal.querySelector('#chatInput');
    this.sendBtn = modal.querySelector('#chatSendBtn');

    // Close modal on outside click
    modal.onclick = (e) => {
      if (e.target === modal) this.closeModal();
    };

    // Send message
    this.sendBtn.onclick = () => this.sendMessage();
    this.input.onkeypress = (e) => {
      if (e.key === 'Enter') this.sendMessage();
    };
  }

  openModal() {
    this.modal.classList.add('show');
    this.unreadCount = 0;
    this.updateUnreadBadge();
    this.scrollToBottom();
  }

  closeModal() {
    this.modal.classList.remove('show');
  }

  async loadMessages() {
    try {
      const response = await fetch(`/api/chat/${this.patientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        this.messages = await response.json();
        this.renderMessages();
        this.updateUnreadCount();
      }
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  }

  renderMessages() {
    this.messagesContainer.innerHTML = '';
    if (this.messages.length === 0) {
      this.messagesContainer.innerHTML = '<div class="chat-no-messages" data-i18n="chat.no_messages">No messages yet</div>';
      return;
    }
    this.messages.forEach(msg => {
      const msgEl = document.createElement('div');
      msgEl.className = `chat-message ${msg.sender}`;
      msgEl.innerHTML = `
        <div class="chat-bubble ${msg.sender}">${msg.message}</div>
        <div class="chat-meta">${new Date(msg.timestamp).toLocaleString()}</div>
      `;
      this.messagesContainer.appendChild(msgEl);
    });
    this.scrollToBottom();
  }

  async sendMessage() {
    const message = this.input.value.trim();
    if (!message) return;
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ patientId: this.patientId, message })
      });
      if (response.ok) {
        this.input.value = '';
        this.loadMessages(); // Reload to show new message
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  }

  updateUnreadCount() {
    this.unreadCount = this.messages.filter(m => !m.read && m.sender === 'doctor').length;
    this.updateUnreadBadge();
  }

  updateUnreadBadge() {
    let badge = this.floatingBtn.querySelector('.chat-unread-badge');
    if (this.unreadCount > 0) {
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'chat-unread-badge';
        this.floatingBtn.appendChild(badge);
      }
      badge.textContent = this.unreadCount;
    } else if (badge) {
      badge.remove();
    }
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  startPolling() {
    setInterval(() => this.loadMessages(), 10000); // Poll every 10 seconds
  }
}

// Initialize when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  new ChatSystem();
});