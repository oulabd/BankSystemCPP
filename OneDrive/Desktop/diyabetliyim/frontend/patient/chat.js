// patient/chat.js
(function(){
  const AUTH_TOKEN_KEY = 'authToken';
  const ROLE_KEY = 'userRole';

  function authGuard(){
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('auth_token');
    const role = localStorage.getItem(ROLE_KEY);
    if(!token || role !== 'patient'){
      window.location.href = '../login.html';
      return false;
    }
    return true;
  }

  if(!authGuard()) return;

  let doctorId = null;
  let doctorName = null;

  async function loadDoctorInfo(){
    // Get doctor's info from user profile or stored data
    try {
      const response = await fetch('/api/patient/profile', {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem(AUTH_TOKEN_KEY) }
      });
      if(response.ok){
        const data = await response.json();
        // Assuming user object has assignedDoctor populated
        if(data.user.assignedDoctor){
          doctorId = data.user.assignedDoctor._id || data.user.assignedDoctor;
          doctorName = data.user.assignedDoctor.fullName || 'Your Doctor';
          document.getElementById('doctorName').textContent = doctorName;
          loadMessages();
        }
      }
    } catch(err){
      console.error('Failed to load doctor info', err);
    }
  }

  async function loadMessages(){
    if(!doctorId) return;
    try{
      const response = await fetch(`/api/patient/chat/${doctorId}`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem(AUTH_TOKEN_KEY) }
      });
      if(response.ok){
        const data = await response.json();
        renderMessages(data.messages);
      }
    } catch(err){
      console.error('Failed to load messages', err);
    }
  }

  function renderMessages(messages){
    const container = document.getElementById('chatMessages');
    container.innerHTML = '';
    messages.forEach(msg => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `chat-message ${msg.senderId._id === localStorage.getItem('userId') ? 'sent' : 'received'}`;
      
      let content = '';
      if(msg.messageText){
        content = `<div class="message-text">${msg.messageText}</div>`;
      }
      if(msg.imageUrl){
        content += `<img src="${msg.imageUrl}" class="message-image" onclick="window.open(this.src)" />`;
      }
      
      msgDiv.innerHTML = `
        ${content}
        <div class="message-time">${new Date(msg.createdAt).toLocaleTimeString()}</div>
      `;
      container.appendChild(msgDiv);
    });
    container.scrollTop = container.scrollHeight;
  }

  async function sendMessage(){
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if(!text || !doctorId) return;

    try{
      const response = await fetch('/api/patient/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem(AUTH_TOKEN_KEY)
        },
        body: JSON.stringify({
          receiverId: doctorId,
          messageText: text
        })
      });
      if(response.ok){
        input.value = '';
        loadMessages();
      }
    } catch(err){
      console.error('Failed to send message', err);
    }
  }

  async function sendImage(){
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    if(!file || !doctorId) return;

    // Convert to base64 for simplicity (in production, upload to server)
    const reader = new FileReader();
    reader.onload = async function(e){
      try{
        const response = await fetch('/api/patient/chat/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem(AUTH_TOKEN_KEY)
          },
          body: JSON.stringify({
            receiverId: doctorId,
            imageUrl: e.target.result
          })
        });
        if(response.ok){
          fileInput.value = '';
          loadMessages();
        }
      } catch(err){
        console.error('Failed to send image', err);
      }
    };
    reader.readAsDataURL(file);
  }

  // Event listeners
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('messageInput').addEventListener('keypress', function(e){
    if(e.key === 'Enter') sendMessage();
  });
  document.getElementById('imageInput').addEventListener('change', sendImage);

  // Load on page load
  loadDoctorInfo();

  // Poll for new messages every 10 seconds
  setInterval(loadMessages, 10000);
})();