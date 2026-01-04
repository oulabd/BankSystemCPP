const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { encryptFile } = require('../utils/encryption');

const uploadDir = path.join(__dirname, '../uploads/labs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// تخزين الملف في الذاكرة أولاً لأجل التشفير
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
    cb(new Error('نوع الملف غير صالح. يُسمح فقط بملفات PDF وJPEG وPNG.'), false);
  }
};

const uploadLab = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // الحد الأقصى 20MB
  }
});

/**
 * وسيط لتشفير الملف المرفوع
 */
async function encryptUploadedFile(req, res, next) {
  if (!req.file) {
    return next();
  }
  
  try {
    // تشفير محتوى الملف
    const encryptedBuffer = encryptFile(req.file.buffer);
    
    // إنشاء اسم ملف مشفَّر فريد
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const encryptedFilename = `lab-${uniqueSuffix}.enc`;
    const encryptedPath = path.join(uploadDir, encryptedFilename);
    
    // كتابة المحتوى المشفَّر إلى القرص
    fs.writeFileSync(encryptedPath, encryptedBuffer);
    
    // تحديث req.file بمعلومات الملف المشفَّر
    req.file.encryptedPath = encryptedPath;
    req.file.encryptedFilename = encryptedFilename;
    req.file.originalMimeType = req.file.mimetype;
    
    next();
  } catch (err) {
    console.error('خطأ في تشفير الملف:', err);
    res.status(500).json({ error: 'فشل تشفير الملف' });
  }
}

module.exports = { uploadLab, encryptUploadedFile };
