const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const authController = require('./controllers/authController');
const documentController = require('./controllers/documentController');
const Document = require('./models/Document');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3001;
const JWT_SECRET = 'your_jwt_secret_key';

// Middleware
app.use(bodyParser.json());

// Socket.IO Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    socket.user = User.findById(decoded.id);
    next();
  } catch (error) {
    return next(new Error('Authentication error'));
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);
  
  // Join a document room
  socket.on('joinDocument', ({ documentId }) => {
    const document = Document.findById(documentId);
    
    if (!document || !document.hasPermission(socket.userId, 'read')) {
      socket.emit('error', { message: 'Access denied or document not found' });
      return;
    }
    
    socket.join(`document:${documentId}`);
    console.log(`User ${socket.userId} joined document: ${documentId}`);
    
    // Send current document state to the newly connected user
    socket.emit('documentData', {
      id: document.id,
      title: document.title,
      content: document.decryptContent(),
      currentBranch: document.currentBranch
    });
    
    // Notify others that a new user has joined
    socket.to(`document:${documentId}`).emit('userJoined', {
      userId: socket.userId,
      username: socket.user.username
    });
  });
  
  // Handle text changes
  socket.on('textChange', ({ documentId, delta, version }) => {
    const document = Document.findById(documentId);
    
    if (!document || !document.hasPermission(socket.userId, 'write')) {
      socket.emit('error', { message: 'Access denied or document not found' });
      return;
    }
    
    // In a production app, implement operational transformation or CRDT
    // for conflict resolution between concurrent edits
    
    // Broadcast the change to all other users in the document room
    socket.to(`document:${documentId}`).emit('textChange', {
      delta,
      version,
      userId: socket.userId,
      username: socket.user.username
    });
  });
  
  // Handle cursor position updates
  socket.on('cursorMove', ({ documentId, position }) => {
    socket.to(`document:${documentId}`).emit('cursorMove', {
      userId: socket.userId,
      username: socket.user.username,
      position
    });
  });
  
  // Handle saving document versions
  socket.on('saveVersion', ({ documentId, content, message }) => {
    const document = Document.findById(documentId);
    
    if (!document || !document.hasPermission(socket.userId, 'write')) {
      socket.emit('error', { message: 'Access denied or document not found' });
      return;
    }
    
    const version = document.addVersion(content, socket.userId, message);
    
    // Notify all users in the document room about the new version
    io.to(`document:${documentId}`).emit('versionSaved', {
      version: {
        id: version.id,
        timestamp: version.timestamp,
        author: version.author,
        message: version.message
      }
    });
  });
  
  // Leave document room when disconnecting
  socket.on('leaveDocument', ({ documentId }) => {
    socket.leave(`document:${documentId}`);
    console.log(`User ${socket.userId} left document: ${documentId}`);
    
    // Notify others that the user has left
    socket.to(`document:${documentId}`).emit('userLeft', {
      userId: socket.userId,
      username: socket.user.username
    });
  });
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
    // If you're tracking active documents for each user, clean up here
  });
});

// Routes (rest of the routes remain the same)
app.get('/', (req, res) => {
  res.send('Secure Document Editor Server');
});

// Auth routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

// Protected user routes
app.get('/api/user/profile', authController.authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email
    }
  });
});

// Document routes
app.post('/api/documents', authController.authenticate, documentController.createDocument);
app.get('/api/documents/:id', authController.authenticate, documentController.getDocument);
app.put('/api/documents/:id', authController.authenticate, documentController.updateDocument);
app.get('/api/user/documents', authController.authenticate, documentController.getUserDocuments);
app.post('/api/documents/:id/branches', authController.authenticate, documentController.createBranch);
app.post('/api/documents/:id/switch-branch', authController.authenticate, documentController.switchBranch);
app.post('/api/documents/:id/merge', authController.authenticate, documentController.mergeBranch);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
