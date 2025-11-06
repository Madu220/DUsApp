const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Servir arquivos estáticos (CSS, JS, etc.)
app.use(express.static(__dirname));

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.IO - mensagens
io.on('connection', (socket) => {
  console.log(' Usuário conectado');

  socket.on('chat message', (data) => {
    io.emit('chat message', data);
  });

  socket.on('disconnect', () => {
    console.log(' Usuário desconectado');
  });
});

// Iniciar servidor
const PORT = 3000;
http.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
