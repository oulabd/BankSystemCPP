const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { encryptFile } = require('../utils/encryption');

const uploadDir = path.join(__dirname, '../uploads/labs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Store in memory first for encryption
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed.'), false);
  }
};

const uploadLab = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

/**
 * Middleware to encrypt uploaded file
 */
async function encryptUploadedFile(req, res, next) {
  if (!req.file) {
    return next();
  }
  
  try {
    // Encrypt file buffer
    const encryptedBuffer = encryptFile(req.file.buffer);
    
    // Generate unique encrypted filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const encryptedFilename = `lab-${uniqueSuffix}.enc`;
    const encryptedPath = path.join(uploadDir, encryptedFilename);
    
    // Write encrypted buffer to disk
    fs.writeFileSync(encryptedPath, encryptedBuffer);
    
    // Update req.file with encrypted file info
    req.file.encryptedPath = encryptedPath;
    req.file.encryptedFilename = encryptedFilename;
    req.file.originalMimeType = req.file.mimetype;
    
    next();
  } catch (err) {
    console.error('File encryption error:', err);
    res.status(500).json({ error: 'File encryption failed' });
  }
}

module.exports = { uploadLab, encryptUploadedFile };
