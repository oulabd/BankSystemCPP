// server.js - minimal express app for doctor backend
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

process.on('uncaughtException', err => console.error("🔥 UNCAUGHT:", err));
process.on('unhandledRejection', err => console.error("💥 REJECTION:", err));

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
// app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // TEMPORARILY DISABLED

// Connect to MongoDB
// const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/diyabetliyim';
// mongoose.connect(MONGO_URI)
//   .then(() => console.log('MongoDB connected'))
//   .catch(err => console.error('MongoDB connection error', err));

// Routes
try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/auth', authRoutes);
} catch (e) {
  console.error('authRoutes not found or failed to mount', e);
}
try {
  const doctorRoutes = require('./routes/doctorRoutes');
  app.use('/api/doctor', doctorRoutes);
} catch (e) {
  console.error('doctorRoutes not found or failed to mount', e);
}
try {
  const chatRoutes = require('./routes/chat');
  app.use('/api/chat', chatRoutes);
  app.use('/uploads/chat', express.static(path.join(__dirname, 'uploads/chat')));
} catch (e) {
  console.error('chatRoutes not found or failed to mount', e);
}
try {
  const notificationRoutes = require('./routes/notifications');
  app.use('/api/notifications', notificationRoutes);
} catch (e) {
  console.error('notificationRoutes not found or failed to mount', e);
}
try {
  const patientRoutes = require('./routes/patientRoutes');
  app.use('/api/patient', patientRoutes);
} catch (e) {
  console.error('patientRoutes not found or failed to mount', e);
}
try {
  const adminRoutes = require('./routes/adminRoutes');
  app.use('/api/admin', adminRoutes);
} catch (e) {
  console.error('adminRoutes not found or failed to mount', e);
}
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
} catch (e) {
  console.error('Auth routes not found or failed to mount', e);
}
try {
  const labRoutes = require('./routes/labs');
  app.use('/api/labs', labRoutes);
  app.use('/uploads/labs', express.static(path.join(__dirname, 'uploads/labs')));
} catch (e) {
  console.error('labRoutes not found or failed to mount', e);
}
try {
  const medicationRoutes = require('./routes/medication');
  app.use('/api/medication', medicationRoutes);
} catch (e) {
  console.error('medicationRoutes not found or failed to mount', e);
}
try {
  const analyticsRoutes = require('./routes/analytics');
  app.use('/api/analytics', analyticsRoutes);
} catch (e) {
  console.error('analyticsRoutes not found or failed to mount', e);
}

app.get('/', (req, res) => res.send('API Running 😀'));

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/diyabetliyim';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});

// Keep the event loop alive
setInterval(() => {}, 1000);
