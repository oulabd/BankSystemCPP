  
  class ChatManager {
        // Scroll chat to bottom
        scrollToBottom() {
          const el = document.getElementById('chatMessages');
          if (el) el.scrollTop = el.scrollHeight;
        }
      // Safely escape HTML for message rendering
      escapeHtml(text) {
        if (!text) return '';
        return String(text)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      // Dummy file preview handler (no-op for now)
      renderFilePreview() {
        // If you want to show file previews, implement here
        const preview = document.getElementById('attachmentPreview');
        if (preview) preview.innerHTML = '';
      }
    getUserId() {
      // Try to get userId from localStorage (set by login)
      return localStorage.getItem('userId') || localStorage.getItem('authUserId') || null;
    }
    markAllAsRead() {
      // Mark all messages as read for the active contact
      if (!this.activeContact) return;
      const token = this.getToken();
      fetch(`${this.apiBase}/chat/read-all/${this.activeContact._id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(() => {
        // Optimistically clear unread indicators for this contact
        this.contacts = this.contacts.map(c => c._id === this.activeContact._id
          ? { ...c, unreadCount: 0 }
          : c);
        this.renderContacts();

        // Mark in-memory messages as read so the ticks update immediately
        this.messages.forEach(m => { m.read = true; });
        this.renderMessages();
      }).catch(() => {
        // Ignore errors for now
      });
    }

    async sendMessage() {
      const input = document.getElementById('chatInput');
      const text = input.value.trim();
      if (!text && !this.selectedFile) return;
      const token = this.getToken();
      const formData = new FormData();
      formData.append('text', text);
      formData.append('receiverId', this.activeContact._id);
      if (this.selectedFile) formData.append('attachment', this.selectedFile);
      try {
        const res = await fetch(`${this.apiBase}/chat/send`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (!res.ok) {
          let errText = 'لم يتم إرسال الرسالة';
          try {
            const payload = await res.json();
            if (payload && payload.error) errText = payload.error;
          } catch (e) {
            // ignore json parse errors
          }
          console.error('تنبيه خطأ', res.status, errText);
          alert(errText);
          return;
        }

        input.value = '';
        this.selectedFile = null;
        this.renderFilePreview();
        console.debug('تم إرسال الرسالة بنجاح', { status: res.status });
        try {
          await this.loadMessages();
        } catch (e) {
          console.error('فشل تحميل الرسائل بعد الإرسال', e);
        }
        this.scrollToBottom();
      } catch (err) {
        console.error('sendMessage exception', err);
        alert('لم يتم إرسال الرسالة');
      }
    }
  constructor(containerId, userRole) {
    this.container = document.getElementById(containerId);
    this.userRole = userRole;
    // API base can be overridden by setting window.API_BASE in the page.
    this.apiBase = window.API_BASE || '/api';
    this.contacts = [];
    this.messages = [];
    this.activeContact = null;
    this.selectedFile = null;
    this.pollingInterval = null;
    this.init();
  }

  getToken() {
    return localStorage.getItem('authToken') ||
           localStorage.getItem('auth_token') ||
           localStorage.getItem('token');
  }

  async init() {
    this.renderUI();
    await this.loadContacts();
    this.setupEventListeners();

    const urlParams = new URLSearchParams(window.location.search);
    const withUserId = urlParams.get('with');
    if (withUserId) {
      const contact = this.contacts.find(c => c._id === withUserId);
      if (contact) this.selectContact(contact);
    }
  }

  renderUI() {
    this.container.innerHTML = `
      <div class="chat-container">
        <div class="chat-sidebar" id="chatSidebar">
          <div class="chat-sidebar-header">
            <h2>الدردشة</h2>
          </div>
          <div class="chat-contacts" id="chatContacts">
            <div class="chat-loading">يتم تحميل الأشخاص...</div>
          </div>
        </div>
        <div class="chat-main" id="chatMain">
          <div class="chat-empty">
            <i class="fas fa-comments"></i>
            <span>لبدء الدردشة، يرجى اختيار شخص</span>
          </div>
        </div>
      </div>
    `;
  }

  async loadContacts() {
    try {
      const token = this.getToken();
      if (!token) {
        document.getElementById('chatContacts').innerHTML =
          '<div class="chat-error">لم يتم تسجيل الدخول. يرجى تسجيل الدخول.</div>';
        return;
      }

      const res = await fetch(`${this.apiBase}/chat/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        let errorMsg = `تعذر تحميل الأشخاص (HTTP ${res.status})`;
        try {
          const payload = await res.json();
          if (payload && payload.error) errorMsg += `: ${payload.error}`;
        } catch (e) {}
        document.getElementById('chatContacts').innerHTML = `<div class="chat-error">${errorMsg}</div>`;
        console.error('تنبيه خطأ', res.status, errorMsg);
        return;
      }

      const data = await res.json();
      this.contacts = data.contacts || [];
      this.renderContacts();
    } catch (err) {
      document.getElementById('chatContacts').innerHTML =
        `<div class="chat-error">تعذر تحميل الأشخاص: ${err.message}</div>`;
      console.error('تنبيه خطأ ', err);
    }
  }

  renderContacts() {
    const contactsEl = document.getElementById('chatContacts');

    if (this.contacts.length === 0) {
      contactsEl.innerHTML = `<div class="chat-empty">لم يتم العثور على أي شخص</div>`;
      return;
    }

    contactsEl.innerHTML = this.contacts.map(contact => `
      <div class="chat-contact ${this.activeContact && this.activeContact._id === contact._id ? 'active' : ''}"
           data-id="${contact._id}">
        <div class="contact-info">
          <div>
            <div class="contact-name">${contact.fullName}</div>
            ${contact.lastMessage ? `
              <div class="contact-last-message">
                ${contact.lastMessage.isOwn ? 'انت: ' : ''}
                ${this.truncateText(contact.lastMessage.text, 30)}
              </div>` : ''}
          </div>
          <div style="text-align:right;">
            ${contact.lastMessage ? `<div class="contact-time">${this.formatTime(contact.lastMessage.createdAt)}</div>` : ''}
            ${contact.unreadCount > 0 ? `<div class="contact-unread-badge">${contact.unreadCount}</div>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  setupEventListeners() {
    document.getElementById('chatContacts').addEventListener('click', e => {
      const el = e.target.closest('.chat-contact');
      if (!el) return;
      const contact = this.contacts.find(c => c._id === el.dataset.id);
      if (contact) this.selectContact(contact);
    });
  }

  async selectContact(contact) {
    this.activeContact = contact;
    this.renderContacts();
    this.renderChatWindow();
    await this.loadMessages();

    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.pollingInterval = setInterval(() => this.loadMessages(true), 5000);

    this.markAllAsRead();
  }

  renderChatWindow() {
    document.getElementById('chatMain').innerHTML = `
      <div class="chat-header">
        <div>
          <h3>${this.activeContact.fullName}</h3>
          <div class="chat-header-info">
            ${this.userRole === 'doctor' ? 'مريض' : 'طبيب'}
          </div>
        </div>
      </div>

      <div class="chat-messages" id="chatMessages">
        <div class="chat-loading">يتم تحميل الرسائل...</div>
      </div>

      <div class="chat-input-container">
        <div id="attachmentPreview"></div>
        <div class="chat-input-wrapper">
          <button class="chat-attach-btn" id="attachBtn" title="إضافة ملف مرفق">
            <i class="fas fa-paperclip"></i>
          </button>
          <input type="file" id="fileInput" hidden accept="image/*,application/pdf">
          <textarea id="chatInput" class="chat-input" placeholder="اكتب رسالتك..." rows="1"></textarea>
          <button class="chat-send-btn" id="sendBtn">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    `;

    const input = document.getElementById('chatInput');
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = input.scrollHeight + 'px';
    });

    document.getElementById('sendBtn').onclick = () => this.sendMessage();
    document.getElementById('attachBtn').onclick = () => document.getElementById('fileInput').click();
    document.getElementById('fileInput').onchange = e => this.handleFileSelect(e);
  }

  async loadMessages(silent = false) {
    try {
      const token = this.getToken();
      const res = await fetch(`${this.apiBase}/chat/history/${this.activeContact._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        let errorMsg = `تعذر تحميل الرسائل (HTTP ${res.status})`;
        try {
          const payload = await res.json();
          if (payload && payload.error) errorMsg += `: ${payload.error}`;
        } catch (e) {}
        if (!silent) {
          document.getElementById('chatMessages').innerHTML = `<div class="chat-error">${errorMsg}</div>`;
        }
        console.error('تنبيه خطأ', res.status, errorMsg);
        return;
      }
      const data = await res.json();
      if (silent && data.messages.length === this.messages.length) return;
      this.messages = data.messages || [];
      this.renderMessages();
      this.scrollToBottom();
    } catch (err) {
      if (!silent) {
        document.getElementById('chatMessages').innerHTML =
          `<div class="chat-error">تعذر تحميل الرسائل: ${err.message}</div>`;
      }
      console.error('تنبيه خطأ', err);
    }
  }

  renderMessages() {
    const el = document.getElementById('chatMessages');

    if (this.messages.length === 0) {
      el.innerHTML = `<div class="chat-empty">لا توجد رسائل بعد</div>`;
      return;
    }

    let currentDate = null;
    const userId = this.getUserId();

    el.innerHTML = this.messages.map(msg => {
      const msgDate = new Date(msg.createdAt).toDateString();
      let divider = '';

      if (msgDate !== currentDate) {
        currentDate = msgDate;
        divider = `<div class="message-date-divider"><span>${this.formatDate(msg.createdAt)}</span></div>`;
      }

      const isOwn = msg.sender._id === userId;
      const isDoctor = msg.sender.role === 'doctor';

      return `
        ${divider}
        <div class="chat-message ${isDoctor ? 'doctor' : 'patient'}">
          <div class="message-bubble">
            ${isOwn ? `<button class="message-delete-btn"
              onclick="(window.chatManager||chatManager).deleteMessage('${msg._id}')">×</button>` : ''}
            <div class="message-sender">${isDoctor ? '👨‍⚕️' : '👤'}</div>
            ${msg.text ? `<p class="message-text">${this.escapeHtml(msg.text)}</p>` : ''}
            ${msg.attachment ? this.renderAttachment(msg.attachment) : ''}
            ${msg.linkToMedicalResource ? `
              <div class="message-medical-link" onclick="window.location.href='${msg.linkToMedicalResource}'">
                <i class="fas fa-link"></i> عرض المورد الطبي
              </div>` : ''}
            <div class="message-meta">
              <span>${this.formatTime(msg.createdAt)}</span>
              ${isOwn && msg.read ? '<i class="fas fa-check-double"></i>' : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('يجب أن يكون حجم الملف أقل من 5 ميغابايت');
      return;
    }
    this.selectedFile = file;
    this.renderFilePreview();
  }

  async deleteMessage(id) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذه الرسالة؟')) return;
    try {
      const token = this.getToken();
      await fetch(`${this.apiBase}/chat/message/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      this.messages = this.messages.filter(m => m._id !== id);
      this.renderMessages();
    } catch {
      alert('تعذر حذف الرسالة');
    }
  }

  formatDate(d) {
    const date = new Date(d);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'اليوم';
    if (date.toDateString() === yesterday.toDateString()) return 'أمس';
    return date.toLocaleDateString('ar-EG');
  }

  truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  formatTime(d) {
    const date = new Date(d);
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  }
}

let chatManager;
