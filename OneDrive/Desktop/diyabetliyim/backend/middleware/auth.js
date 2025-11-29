const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyAccessToken } = require('../utils/tokenService');

function verifyJWT(req,res,next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({error:'No token'});
  const parts = auth.split(' ');
  if(parts.length!==2) return res.status(401).json({error:'Invalid auth header'});
  const token = parts[1];
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_me_secure');
    req.user = payload; // minimal payload contains id and role
    next();
  }catch(e){ return res.status(401).json({error:'Invalid token'}); }
}

function checkRole(role){
  return function(req,res,next){
    if(!req.user) return res.status(401).json({error:'Not authenticated'});
    if(req.user.role !== role) return res.status(403).json({error:'Forbidden'});
    next();
  }
}

// ensure doctor only accesses their own patients
async function preventAccessToOtherDoctorsPatients(req,res,next){
  // assume :id param is patient id in routes that need protection
  const patientId = req.params.id || req.body.patientId;
  if(!patientId) return next();
  const patient = await User.findById(patientId);
  if(!patient) return res.status(404).json({error:'Patient not found'});
  // patient.assignedDoctor should equal req.user.id for doctor
  if(String(patient.assignedDoctor) !== String(req.user.id)) return res.status(403).json({error:'Access denied to this patient'});
  next();
}

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired access token' });
    }
    
    req.user = { id: decoded.id, _id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    console.error('authMiddleware error:', err);
    res.status(401).json({ error: 'Authentication failed' });
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

module.exports = { verifyJWT, checkRole, preventAccessToOtherDoctorsPatients, authMiddleware, optionalAuth };
