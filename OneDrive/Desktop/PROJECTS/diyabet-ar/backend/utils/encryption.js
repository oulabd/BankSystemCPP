const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// ===============================
// Normalize encryption key
// ===============================
const RAW_KEY = process.env.ENCRYPTION_KEY;
if (!RAW_KEY) {
  throw new Error('ENCRYPTION_KEY is missing in environment variables');
}

// Always derive a 32-byte key (AES-256 safe)
const KEY = crypto.createHash('sha256').update(RAW_KEY).digest(); // 32 bytes
console.log('🔐 Encryption KEY length:', KEY.length);

// ===============================
// Encrypt text
// ===============================
function encryptText(text) {
  if (!text) return null;

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  } catch (err) {
    console.error('Encryption error:', err);
    throw new Error('Encryption failed');
  }
}

// ===============================
// Decrypt text
// ===============================
function decryptText(encryptedData) {
  if (!encryptedData) return null;

  if (typeof encryptedData !== 'string' || !encryptedData.includes(':')) {
    return encryptedData; // legacy/plain
  }

  try {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    if (iv.length !== IV_LENGTH) {
      return '[Decryption error: Invalid IV length]';
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err.message);
    return '[Decryption error]';
  }
}

// ===============================
// Encrypt file
// ===============================
function encryptFile(buffer) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    const encrypted = Buffer.concat([
      cipher.update(buffer),
      cipher.final()
    ]);

    return Buffer.concat([iv, encrypted]);
  } catch (err) {
    console.error('File encryption error:', err);
    throw new Error('File encryption failed');
  }
}

// ===============================
// Decrypt file
// ===============================
function decryptFile(encryptedBuffer) {
  try {
    const iv = encryptedBuffer.slice(0, IV_LENGTH);
    const encrypted = encryptedBuffer.slice(IV_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
  } catch (err) {
    console.error('File decryption error:', err);
    throw new Error('File decryption failed');
  }
}

// ===============================
// Generate key (optional utility)
// ===============================
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  encryptText,
  decryptText,
  encryptFile,
  decryptFile,
  generateEncryptionKey
};
