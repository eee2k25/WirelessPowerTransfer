const http = require('http');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 8081);
const distDir = path.join(__dirname, 'dist');
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

// MIME types for static files
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

function serveStatic(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  // Remove query string
  filePath = filePath.split('?')[0];
  const fullPath = path.join(distDir, filePath);
  
  // Security: prevent directory traversal
  if (!fullPath.startsWith(distDir)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // For SPA, serve index.html for non-file routes
        if (!path.extname(filePath)) {
          fs.readFile(path.join(distDir, 'index.html'), (err2, content2) => {
            if (err2) {
              res.writeHead(404);
              return res.end('Not found');
            }
            res.writeHead(200, { 'content-type': 'text/html' });
            res.end(content2);
          });
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
      return;
    }
    
    const ext = path.extname(fullPath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'content-type': contentType });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  // Handle WebSocket upgrade separately
  // Serve static files for all other requests
  serveStatic(req, res);
});

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (socket) => {
  console.log('WebSocket client connected');
  
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
    console.log('WebSocket client disconnected');
  });
  
  socket.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`V2V PowerShare server listening on http://0.0.0.0:${port}`);
  console.log(`WebSocket available at ws://0.0.0.0:${port}/ws`);
  console.log(`Serving static files from: ${distDir}`);
});