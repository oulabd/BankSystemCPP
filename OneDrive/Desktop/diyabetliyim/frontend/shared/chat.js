class ChatManager {
  constructor(containerId, userRole) {
    this.container = document.getElementById(containerId);
    this.userRole = userRole;
    this.contacts = [];
    this.messages = [];
    this.activeContact = null;
    this.selectedFile = null;
    this.pollingInterval = null;
    this.init();
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
            <h2 data-i18n="chat.title">Medical Chat</h2>
          </div>
          <div class="chat-contacts" id="chatContacts">
            <div class="chat-loading">Loading contacts...</div>
          </div>
        </div>
        
        <div class="chat-main" id="chatMain">
          <div class="chat-empty">
            <i class="fas fa-comments"></i>
            <span data-i18n="chat.select_contact">Select a contact to start chatting</span>
          </div>
        </div>
      </div>
    `;
  }

  async loadContacts() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/chat/contacts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      this.contacts = data.contacts || [];
      this.renderContacts();
    } catch (err) {
      console.error('loadContacts error:', err);
      document.getElementById('chatContacts').innerHTML = '<div class="chat-error">Failed to load contacts</div>';
    }
  }

  renderContacts() {
    const contactsEl = document.getElementById('chatContacts');
    
    if (this.contacts.length === 0) {
      contactsEl.innerHTML = `<div class="chat-empty" data-i18n="chat.no_contacts">No contacts available</div>`;
      return;
    }
    
    contactsEl.innerHTML = this.contacts.map(contact => `
      <div class="chat-contact ${this.activeContact && this.activeContact._id === contact._id ? 'active' : ''}" data-id="${contact._id}">
        <div class="contact-info">
          <div>
            <div class="contact-name">${contact.fullName}</div>
            ${contact.lastMessage ? `
              <div class="contact-last-message">
                ${contact.lastMessage.isOwn ? 'You: ' : ''}${this.truncateText(contact.lastMessage.text, 30)}
              </div>
            ` : ''}
          </div>
          <div style="text-align: right;">
            ${contact.lastMessage ? `<div class="contact-time">${this.formatTime(contact.lastMessage.createdAt)}</div>` : ''}
            ${contact.unreadCount > 0 ? `<div class="contact-unread-badge">${contact.unreadCount}</div>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  setupEventListeners() {
    document.getElementById('chatContacts').addEventListener('click', (e) => {
      const contactEl = e.target.closest('.chat-contact');
      if (contactEl) {
        const contactId = contactEl.dataset.id;
        const contact = this.contacts.find(c => c._id === contactId);
        if (contact) this.selectContact(contact);
      }
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
    const mainEl = document.getElementById('chatMain');
    mainEl.innerHTML = `
      <div class="chat-header">
        <div>
          <h3>${this.activeContact.fullName}</h3>
          <div class="chat-header-info">${this.userRole === 'doctor' ? 'Patient' : 'Doctor'}</div>
        </div>
      </div>
      
      <div class="chat-messages" id="chatMessages">
        <div class="chat-loading">Loading messages...</div>
      </div>
      
      <div class="chat-input-container">
        <div id="attachmentPreview"></div>
        <div class="chat-input-wrapper">
          <button class="chat-attach-btn" id="attachBtn" title="Attach file">
            <i class="fas fa-paperclip"></i>
          </button>
          <input type="file" id="fileInput" style="display: none;" accept="image/*,application/pdf">
          <textarea 
            id="chatInput" 
            class="chat-input" 
            placeholder="${this.getTranslation('chat.type_message')}" 
            rows="1"
          ></textarea>
          <button class="chat-send-btn" id="sendBtn">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    `;
    
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const attachBtn = document.getElementById('attachBtn');
    const fileInput = document.getElementById('fileInput');
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = input.scrollHeight + 'px';
    });
    
    sendBtn.addEventListener('click', () => this.sendMessage());
    attachBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
  }

  async loadMessages(silent = false) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/chat/history/${this.activeContact._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const newMessages = data.messages || [];
      
      if (silent && newMessages.length === this.messages.length) return;
      
      this.messages = newMessages;
      this.renderMessages();
      this.scrollToBottom();
    } catch (err) {
      console.error('loadMessages error:', err);
      if (!silent) {
        document.getElementById('chatMessages').innerHTML = '<div class="chat-error">Failed to load messages</div>';
      }
    }
  }

  renderMessages() {
    const messagesEl = document.getElementById('chatMessages');
    
    if (this.messages.length === 0) {
      messagesEl.innerHTML = `<div class="chat-empty" data-i18n="chat.no_messages">No messages yet</div>`;
      return;
    }
    
    let currentDate = null;
    const html = this.messages.map(msg => {
      const msgDate = new Date(msg.createdAt).toDateString();
      let dateDivider = '';
      
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        dateDivider = `<div class="message-date-divider"><span>${this.formatDate(msg.createdAt)}</span></div>`;
      }
      
      const isOwn = msg.sender._id === this.getUserId();
      const isDoctorMessage = msg.sender.role === 'doctor';
      
      return `
        ${dateDivider}
        <div class="chat-message ${isOwn ? 'own' : ''} ${isDoctorMessage ? 'doctor' : 'patient'}">
          <div class="message-bubble">
            ${msg.text ? `<p class="message-text">${this.escapeHtml(msg.text)}</p>` : ''}
            
            ${msg.attachment ? this.renderAttachment(msg.attachment) : ''}
            
            ${msg.linkToMedicalResource ? `
              <div class="message-medical-link" onclick="window.location.href='${msg.linkToMedicalResource}'">
                <i class="fas fa-link"></i> Medical Resource
              </div>
            ` : ''}
            
            <div class="message-meta">
              <span>${this.formatTime(msg.createdAt)}</span>
              ${isOwn && msg.read ? '<i class="fas fa-check-double message-read-indicator"></i>' : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    messagesEl.innerHTML = html;
  }

  renderAttachment(attachment) {
    if (attachment.type === 'image') {
      return `<div class="message-attachment">
        <img src="${attachment.url}" alt="${attachment.filename}" onclick="window.open('${attachment.url}', '_blank')">
      </div>`;
    } else if (attachment.type === 'pdf') {
      return `<div class="message-attachment-pdf" onclick="window.open('${attachment.url}', '_blank')">
        <i class="fas fa-file-pdf"></i>
        <div>
          <div>${attachment.filename}</div>
          <small>${this.formatFileSize(attachment.size)}</small>
        </div>
      </div>`;
    }
    return '';
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert(this.getTranslation('chat.file_size_error'));
      return;
    }
    
    this.selectedFile = file;
    this.renderFilePreview();
  }

  renderFilePreview() {
    const previewEl = document.getElementById('attachmentPreview');
    if (!this.selectedFile) {
      previewEl.innerHTML = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (this.selectedFile.type.startsWith('image/')) {
        previewEl.innerHTML = `
          <div class="chat-attachment-preview">
            <img src="${e.target.result}" alt="Preview">
            <span>${this.selectedFile.name}</span>
            <button class="chat-attachment-remove" onclick="chatManager.removeFile()">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `;
      } else {
        previewEl.innerHTML = `
          <div class="chat-attachment-preview">
            <i class="fas fa-file-pdf" style="font-size: 24px;"></i>
            <span>${this.selectedFile.name}</span>
            <button class="chat-attachment-remove" onclick="chatManager.removeFile()">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `;
      }
    };
    reader.readAsDataURL(this.selectedFile);
  }

  removeFile() {
    this.selectedFile = null;
    document.getElementById('attachmentPreview').innerHTML = '';
    document.getElementById('fileInput').value = '';
  }

  async sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (!text && !this.selectedFile) return;
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('receiverId', this.activeContact._id);
      if (text) formData.append('text', text);
      if (this.selectedFile) formData.append('attachment', this.selectedFile);
      
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!res.ok) throw new Error('Failed to send message');
      
      input.value = '';
      input.style.height = 'auto';
      this.removeFile();
      
      await this.loadMessages();
      this.scrollToBottom();
      await this.loadContacts();
    } catch (err) {
      console.error('sendMessage error:', err);
      alert('Failed to send message');
    }
  }

  async markAllAsRead() {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/chat/read-all/${this.activeContact._id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const contact = this.contacts.find(c => c._id === this.activeContact._id);
      if (contact) contact.unreadCount = 0;
      this.renderContacts();
    } catch (err) {
      console.error('markAllAsRead error:', err);
    }
  }

  scrollToBottom() {
    const messagesEl = document.getElementById('chatMessages');
    if (messagesEl) {
      setTimeout(() => {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }, 100);
    }
  }

  formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(date) {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getUserId() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch {
      return null;
    }
  }

  getTranslation(key) {
    const translations = {
      'chat.type_message': 'Type your message...',
      'chat.select_contact': 'Select a contact to start chatting',
      'chat.no_messages': 'No messages yet',
      'chat.no_contacts': 'No contacts available',
      'chat.file_size_error': 'File size must be less than 5MB'
    };
    return translations[key] || key;
  }

  destroy() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }
}

let chatManager;
