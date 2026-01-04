const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyAccessToken } = require('../utils/tokenService');

function verifyJWT(req,res,next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({error:'Missing auth token'});
  const parts = auth.split(' ');
  if(parts.length!==2) return res.status(401).json({error:'Invalid Authorization header'});
  const token = parts[1];
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_me_secure');
    req.user = payload;
    // Ensure req.user.id is always present (backward compatibility)
    if (!req.user.id && req.user._id) req.user.id = req.user._id;
    next();
  }catch(e){ return res.status(401).json({error:'Invalid auth token'}); }
}

function checkRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Access denied. Required role: ${role}.` });
    }
    next();
  };
}

// ضمان أن الطبيب يصل فقط لمرضاه
async function preventAccessToOtherDoctorsPatients(req,res,next){
  // نفترض أن معامل :id هو معرف المريض في المسارات التي تحتاج حماية
  const patientId = req.params.id || req.body.patientId;
  if(!patientId) return next();
  const patient = await User.findById(patientId);
  if(!patient) return res.status(404).json({error:'Patient not found'});
  // يجب أن يساوي patient.assignedDoctor قيمة req.user.id للطبيب
  if(String(patient.assignedDoctor) !== String(req.user.id)) return res.status(403).json({error:'Access denied for this patient'});
  next();
}

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    console.log('authMiddleware: received Authorization header:', authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('authMiddleware: Bearer token not found');
      return res.status(401).json({ error: 'Access token required' });
    }
    const token = authHeader.substring(7);
    console.log('authMiddleware: extracted token:', token);
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      console.warn('authMiddleware: token verification failed');
      return res.status(401).json({ error: 'Invalid or expired access token' });
    }
    req.user = { id: decoded.id, _id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    console.error('authMiddleware error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      
      if (decoded) {
        req.user = { id: decoded.id, _id: decoded.id, role: decoded.role };
      }
    }
    
    next();
  } catch (err) {
    next();
  }
}

function permit(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      console.error('permit: missing user or role', { user: req.user });
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    console.log('permit: role check', { 
      userRole: req.user.role,
      allowedRoles,
      userId: req.user.id 
    });
    
    if (!allowedRoles.includes(req.user.role)) {
      console.error('permit: role not allowed', {
        userRole: req.user.role,
        allowedRoles
      });
      return res.status(403).json({ 
        error: `Access denied. Allowed roles: ${allowedRoles.join(', ')}`,
        yourRole: req.user.role
      });
    }
    
    next();
  };
}

module.exports = { verifyJWT, checkRole, preventAccessToOtherDoctorsPatients, authMiddleware, optionalAuth, permit };
