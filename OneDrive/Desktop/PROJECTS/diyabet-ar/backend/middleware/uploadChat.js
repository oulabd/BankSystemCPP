const multer = require('multer');
const path = require('path');
const fs = require('fs');

// التأكد من وجود مجلد الرفع
const uploadDir = path.join(__dirname, '../uploads/chat');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// إعداد التخزين
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `chat-${uniqueSuffix}${ext}`);
  }
});

// مرشح الملفات - يسمح فقط بالصور وملفات PDF
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير صالح. يُسمح فقط بالصور وملفات PDF.'), false);
  }
};

// إعداد multer
const uploadChat = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // الحد الأقصى 5MB
  }
});

module.exports = uploadChat;
