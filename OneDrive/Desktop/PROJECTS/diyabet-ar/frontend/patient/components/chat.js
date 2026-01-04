// frontend/patient/components/chat.js

class ChatSystem {
  constructor() {
    this.patientId = localStorage.getItem('userId');
    this.doctorId  = localStorage.getItem('doctorId');
    this.messages = [];
    this.init();
  }

  init() {
    if (!this.doctorId) {
      // Doctor ID not available - chat feature disabled for now
      return;
    }
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
  }

  createModal() {
    const modal = document.createElement('div');
    modal.className = 'chat-modal';
    modal.innerHTML = `
      <div class="chat-modal-content">
        <div class="chat-header" data-i18n="chat.title">
          محادثة مع الطبيب
        </div>

        <div class="chat-messages" id="chatMessages"></div>

        <div class="chat-input-area">
          <input
            type="text"
            class="chat-input"
            id="chatInput"
            placeholder="اكتب رسالتك..."
          >
          <button class="chat-send-btn" id="chatSendBtn">
            إرسال
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    this.modal = modal;
    this.messagesContainer = modal.querySelector('#chatMessages');
    this.input = modal.querySelector('#chatInput');
    this.sendBtn = modal.querySelector('#chatSendBtn');

    modal.onclick = (e) => {
      if (e.target === modal) this.closeModal();
    };

    this.sendBtn.onclick = () => this.sendMessage();
    this.input.onkeypress = (e) => {
      if (e.key === 'Enter') this.sendMessage();
    };
  }

  openModal() {
    this.modal.classList.add('show');
    this.scrollToBottom();
  }

  closeModal() {
    this.modal.classList.remove('show');
  }

  async loadMessages() {
    if (!this.doctorId) return;

    try {
      const res = await fetch(
        `/api/patient/chat/${this.doctorId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      if (!res.ok) throw new Error('Failed fetching messages');

      const data = await res.json();
      this.messages = data.messages || data;

      this.renderMessages();
    } catch (err) {
      console.error('Load messages error:', err);
    }
  }

  renderMessages() {
    this.messagesContainer.innerHTML = '';

    if (!this.messages.length) {
      this.messagesContainer.innerHTML =
  '<div class="chat-no-messages">لا توجد رسائل بعد</div>';

      return;
    }

    this.messages.forEach(msg => {
      const isMine = msg.senderId === this.patientId;
      const side   = isMine ? 'sent' : 'received';

      const el = document.createElement('div');
      el.className = `chat-message ${side}`;
      el.innerHTML = `
        <div class="chat-bubble ${side}">
          ${msg.messageText || ''}
        </div>
        <div class="chat-meta">
          ${new Date(msg.createdAt).toLocaleString()}
        </div>
      `;

      this.messagesContainer.appendChild(el);
    });

    this.scrollToBottom();
  }

  async sendMessage() {
    const message = this.input.value.trim();
    if (!message) return;

    try {
      const res = await fetch(
        '/api/patient/chat/send',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            receiverId: this.doctorId,
            messageText: message
          })
        }
      );

      if (!res.ok)
        throw new Error('Message not sent');

      this.input.value = '';
      this.loadMessages();
    } catch (err) {
      console.error('Send message error:', err);
    }
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop =
      this.messagesContainer.scrollHeight;
  }

  startPolling() {
    setInterval(() => this.loadMessages(), 10000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ChatSystem();
});
