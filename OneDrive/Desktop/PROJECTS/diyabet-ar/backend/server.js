const User = require('./models/User');
const bcrypt = require('bcryptjs');


// Load environment variables as early as possible
require('dotenv').config();


// server.js - minimal express app for doctor backend
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');



const app = express();

try {
  const appointmentRoutes = require('./routes/appointmentRoutes');
  app.use('/api/appointments', appointmentRoutes);
} catch (e) {
  console.error('appointmentRoutes not found or failed to mount', e);
}

process.on('uncaughtException', err => console.error("🔥 UNCAUGHT:", err));
process.on('unhandledRejection', err => console.error("💥 REJECTION:", err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  'https://diyabetliyim-ar.vercel.app',
  'http://localhost:3001',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
];

app.use(cors({
  origin: function (origin, callback) {
    // In development, relax origin checks to avoid blocking local assets
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Set Content Security Policy header to allow API requests
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "connect-src 'self' http://localhost:3000 http://127.0.0.1:3000 http://localhost:5000 http://127.0.0.1:5000 http://localhost:3001 http://127.0.0.1:3001"
  );
  next();
});


// Serve frontend files with proper MIME types
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

app.use(express.static(path.join(__dirname, '..', 'frontend'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    } else if (filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    }
  }
}));


// Routes
try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
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
} catch (e) {
  console.error('chatRoutes not found or failed to mount', e);
}
try {
  const patientRoutes = require('./routes/patientRoutes');
  app.use('/api/patient', patientRoutes);
  // Add prescription QR route
  const prescriptionQRRoutes = require('./routes/prescriptionQR');
  app.use('/api/patient', prescriptionQRRoutes);
} catch (e) {
  console.error('patientRoutes or prescriptionQRRoutes not found or failed to mount', e);
}
try {
  const patientRecordRoutes = require('./routes/patientRecordRoutes');
  app.use('/api/patient', patientRecordRoutes);
} catch (e) {
  console.error('patientRecordRoutes not found or failed to mount', e);
}
try {
  const patientTimelineRoutes = require('./routes/patientTimeline');
  app.use('/api/patient', patientTimelineRoutes);
} catch (e) {
  console.error('patientTimelineRoutes not found or failed to mount', e);
}
try {
  const adminRoutes = require('./routes/admin');
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

// Static files
app.use('/uploads/chat', express.static(path.join(__dirname, 'uploads/chat')));
app.use('/uploads/labs', express.static(path.join(__dirname, 'uploads/labs')));

app.get('/', (req, res) => res.send('API Running 😀'));

// Error handling middleware for static files
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Path:', req.path);
  res.status(500).json({ error: err.message });
});

// Connect to MongoDB and start server
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/diyabetliyim';
let mongoConnected = false;



 mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    console.log('✅ MongoDB connected');
  
  })
  .catch(err => {
    console.error('⚠️  MongoDB connection error:', err.message);
  });


const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://127.0.0.1:${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ MongoDB: ${mongoConnected ? 'Connected' : 'Connecting...'}`);
  console.log('\n📋 Available endpoints:');
  console.log('   POST   /auth/login');
  console.log('   POST   /auth/register');
  console.log('   POST   /api/doctor/note');
  console.log('   POST   /api/doctor/prescription');
  console.log('   POST   /api/doctor/lab-request');
});

// Prevent Node from exiting
server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => process.exit(0));
});

console.log('Loaded ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY);
