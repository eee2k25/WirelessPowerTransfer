const http = require('http');
const { WebSocketServer } = require('ws');

const port = Number(process.env.PORT || 8787);
const rooms = new Map();

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function send(socket, message) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
}

function broadcast(room, message, except) {
  room.forEach((client) => {
    if (client !== except) send(client, message);
  });
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ service: 'v2v-powershare-room-relay', rooms: rooms.size }));
});
const wss = new WebSocketServer({ server });

wss.on('connection', (socket) => {
  socket.on('message', (raw) => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      return send(socket, { type: 'error', detail: 'Invalid JSON' });
    }

    if (message.type === 'join') {
      const code = String(message.code || makeCode()).toUpperCase();
      if (!/^[A-Z2-9]{6}$/.test(code)) return send(socket, { type: 'error', detail: 'Room codes are six characters' });
      let room = rooms.get(code);
      if (!room) {
        room = new Set();
        rooms.set(code, room);
      }
      if (room.size >= 2) return send(socket, { type: 'error', detail: 'That room already has two vehicles' });
      socket.roomCode = code;
      socket.profile = message.profile;
      room.add(socket);
      send(socket, { type: 'joined', code, peers: [...room].filter((peer) => peer !== socket).map((peer) => peer.profile) });
      broadcast(room, { type: 'peer-joined', payload: socket.profile }, socket);
      return;
    }

    const room = rooms.get(socket.roomCode);
    if (!room) return send(socket, { type: 'error', detail: 'Join a room first' });
    broadcast(room, { type: message.type, payload: message.payload, from: socket.profile }, socket);
  });

  socket.on('close', () => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;
    room.delete(socket);
    broadcast(room, { type: 'peer-left', payload: socket.profile });
    if (room.size === 0) rooms.delete(socket.roomCode);
  });
});

server.listen(port, '0.0.0.0', () => console.log(`V2V room relay listening on ws://0.0.0.0:${port}`));