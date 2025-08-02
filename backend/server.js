require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message');
const ChatRoom = require('./models/ChatRoom');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust as needed for production
    methods: ['GET', 'POST']
  }
});

// Hardcoded configuration (no env files)
const PORT = 5000;
const MONGODB_URI = 'mongodb://localhost:27017/laundry-app';
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRE = '7d';
const NODE_ENV = 'development';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const serviceRoutes = require('./routes/services');
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
const analyticsRoutes = require('./routes/analytics');
const chatRoutes = require('./routes/chats');
const trackingRoutes = require('./routes/tracking');

// Import middleware
const { globalErrorHandler, notFoundHandler, logger } = require('./middleware/errorHandler');
const { cacheMiddleware } = require('./middleware/cache');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/services', cacheMiddleware(300), serviceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/analytics', cacheMiddleware(600), analyticsRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/tracking', trackingRoutes);

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join a chat room
  socket.on('joinRoom', ({ chatRoomId }) => {
    socket.join(chatRoomId);
    console.log(`Socket ${socket.id} joined room ${chatRoomId}`);
  });

  // Handle sending a message
  socket.on('sendMessage', async (data) => {
    const { chatRoomId, senderType, senderId, content } = data;
    try {
      const message = new Message({
        chatRoomId,
        senderType,
        senderId,
        content
      });
      await message.save();
      io.to(chatRoomId).emit('newMessage', message);
    } catch (err) {
      console.error('Error saving message:', err);
      socket.emit('error', { message: 'Failed to send message.' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Laundry App Backend is running' });
});

// Make io available to routes
app.set('io', io);

// 404 handler
app.use(notFoundHandler);

// Global error handling middleware
app.use(globalErrorHandler);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`MongoDB URI: ${MONGODB_URI}`);
});

module.exports = app; 