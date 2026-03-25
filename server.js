const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

const players = new Map();
let winner = null;

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  socket.emit('state:update', {
    players: [...players.values()],
    winner,
  });

  socket.on('player:join', ({ name }) => {
    const cleanName = String(name || '').trim().slice(0, 40);
    if (!cleanName) {
      socket.emit('player:error', { message: 'اكتب اسمك الأول.' });
      return;
    }

    players.set(socket.id, {
      id: socket.id,
      name: cleanName,
    });

    io.emit('state:update', {
      players: [...players.values()],
      winner,
    });
  });

  socket.on('bell:ring', () => {
    const player = players.get(socket.id);
    if (!player) {
      socket.emit('player:error', { message: 'سجّل اسمك الأول.' });
      return;
    }

    if (!winner) {
      winner = {
        id: player.id,
        name: player.name,
        at: new Date().toISOString(),
      };

      io.emit('state:update', {
        players: [...players.values()],
        winner,
      });
    }
  });

  socket.on('round:reset', () => {
    winner = null;
    io.emit('state:update', {
      players: [...players.values()],
      winner,
    });
  });

  socket.on('disconnect', () => {
    players.delete(socket.id);

    io.emit('state:update', {
      players: [...players.values()],
      winner,
    });
  });
});

server.listen(PORT, () => {
  console.log(`Bell race is running on http://localhost:${PORT}`);
});
