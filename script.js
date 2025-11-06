// script.js - front-end behavior (corrigido)
(() => {
    const socket = io();
  
    // DOM
    const entryOverlay = document.getElementById('entryOverlay');
    const entryForm = document.getElementById('entryForm');
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const avatarPlaceholder = document.getElementById('avatarPlaceholder');
    const nameInput = document.getElementById('nameInput');
    const enterBtn = document.getElementById('enterBtn');
  
    const headerAvatar = document.getElementById('headerAvatar');
    const headerName = document.getElementById('headerName');
    const headerStatus = document.getElementById('headerStatus');
    const changeProfile = document.getElementById('changeProfile');
  
    const messagesEl = document.getElementById('messages');
    const composer = document.getElementById('composer');
    const messageInput = document.getElementById('messageInput');
  
    const STORAGE_KEY = 'chat_user_v1';
  
    // Convert file to Base64
    function dataURLFromFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsDataURL(file);
      });
    }
  
    function setHeader(user) {
      headerName.textContent = user.name;
      headerAvatar.style.backgroundImage = `url(${user.avatar})`;
      headerAvatar.style.backgroundSize = 'cover';
      headerAvatar.textContent = '';
    }
  
    function saveUserToStorage(user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  
    function loadUserFromStorage() {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    }
  
    function showEntry() {
      entryOverlay.style.display = 'flex';
      nameInput.focus();
    }
  
    function hideEntry() {
      entryOverlay.style.display = 'none';
    }
  
    // Enable/disable Enter button
    function validateEntry() {
      const hasAvatar = !!avatarPreview.dataset.value;
      const hasName = !!nameInput.value.trim();
      enterBtn.disabled = !(hasAvatar && hasName);
    }
  
    // Avatar selection
    avatarInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
  
      if (!file.type.startsWith('image/')) {
        alert('Escolha uma imagem válida.');
        avatarInput.value = '';
        return;
      }
  
      try {
        const dataUrl = await dataURLFromFile(file);
        avatarPreview.src = dataUrl;
        avatarPreview.style.display = 'block';
        avatarPlaceholder.style.display = 'none';
  
        // Store image in dataset so validation recognizes it
        avatarPreview.dataset.value = dataUrl;
  
        validateEntry();
      } catch (err) {
        console.error(err);
        alert('Erro ao ler a imagem.');
      }
    });
  
    // Validate name
    nameInput.addEventListener('input', validateEntry);
  
    // Submit entry form
    entryForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
  
      const name = nameInput.value.trim();
      const avatar = avatarPreview.dataset.value;
  
      if (!name || !avatar) {
        alert('Nome e foto são obrigatórios.');
        return;
      }
  
      const user = { name, avatar };
      saveUserToStorage(user);
      setHeader(user);
      hideEntry();
      socket.emit('user joined', user);
    });
  
    // Edit profile
    changeProfile.addEventListener('click', () => {
      const user = loadUserFromStorage();
  
      if (user) {
        nameInput.value = user.name;
        avatarPreview.src = user.avatar;
        avatarPreview.dataset.value = user.avatar;
  
        avatarPreview.style.display = 'block';
        avatarPlaceholder.style.display = 'none';
      } else {
        avatarPreview.dataset.value = "";
        avatarPreview.style.display = 'none';
        avatarPlaceholder.style.display = 'block';
      }
  
      validateEntry();
      entryOverlay.style.display = 'flex';
    });
  
    // Initialize
    (function init() {
      const user = loadUserFromStorage();
      if (user && user.name && user.avatar) {
        setHeader(user);
        hideEntry();
      } else {
        showEntry();
      }
    })();
  
    // ====== CHAT ======
  
    function formatTime(ts) {
      const d = new Date(ts);
      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
  
    function addMessage(msg) {
      const me = loadUserFromStorage();
      const isMe = me && msg.name === me.name && msg.avatar === me.avatar;
  
      const li = document.createElement('li');
      li.className = 'msg ' + (isMe ? 'msg-me' : 'msg-other');
  
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'msg-avatar';
  
      if (msg.avatar) {
        avatarDiv.style.backgroundImage = `url(${msg.avatar})`;
        avatarDiv.style.backgroundSize = 'cover';
        avatarDiv.textContent = '';
      } else {
        avatarDiv.textContent = msg.name ? msg.name[0].toUpperCase() : '?';
      }
  
      const bubble = document.createElement('div');
      bubble.className = 'msg-bubble';
  
      if (!isMe) {
        const nameEl = document.createElement('div');
        nameEl.className = 'msg-name';
        nameEl.textContent = msg.name || 'Anônimo';
        bubble.appendChild(nameEl);
      }
  
      const txt = document.createElement('div');
      txt.className = 'msg-text';
      txt.textContent = msg.text;
      bubble.appendChild(txt);
  
      const tm = document.createElement('div');
      tm.className = 'msg-time';
      tm.textContent = formatTime(msg.ts);
      bubble.appendChild(tm);
  
      if (isMe) {
        li.appendChild(bubble);
        li.appendChild(avatarDiv);
      } else {
        li.appendChild(avatarDiv);
        li.appendChild(bubble);
      }
  
      messagesEl.appendChild(li);
      messagesEl.parentElement.scrollTop = messagesEl.parentElement.scrollHeight;
    }
  
    composer.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const text = messageInput.value.trim();
      if (!text) return;
  
      const user = loadUserFromStorage();
      if (!user) {
        alert('Você precisa entrar para enviar mensagens.');
        showEntry();
        return;
      }
  
      const payload = {
        name: user.name,
        avatar: user.avatar,
        text,
        ts: Date.now()
      };
  
      socket.emit('chat message', payload);
      messageInput.value = '';
      messageInput.focus();
    });
  
    socket.on('chat message', addMessage);
  
    socket.on('connect', () => headerStatus.textContent = 'Conectado');
    socket.on('disconnect', () => headerStatus.textContent = 'Desconectado');
  
  })();
  