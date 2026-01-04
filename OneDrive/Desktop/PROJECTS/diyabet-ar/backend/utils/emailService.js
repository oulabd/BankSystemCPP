const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Check if email credentials are configured
const emailUser = process.env.SMTP_EMAIL || process.env.EMAIL_USER;
const emailPass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;

if (!emailUser || !emailPass || emailUser === 'your-gmail@gmail.com' || emailPass === 'your-app-password') {
  console.warn('⚠️  WARNING: Email credentials not configured properly in .env file');
  console.warn('⚠️  Password reset emails will fail until SMTP_EMAIL and SMTP_PASSWORD are set');
}

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: emailUser,
    pass: emailPass
  }
});


// Türkçe sabit e-posta şablonları
const emailTemplates = {
  verification: {
    subject: 'DIABETLIYIM Hesabınızı Doğrulayın',
    html: (name, verificationLink) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #20caa8; color: white; padding: 20px; text-align: center;">
          <h1>DIABETLIYIM</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2>Hoş geldiniz, ${name}!</h2>
          <p>DIABETLIYIM'e kaydolduğunuz için teşekkür ederiz. Hesabınızı etkinleştirmek için lütfen e-posta adresinizi doğrulayın.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background: #20caa8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              E-posta Adresini Doğrula
            </a>
          </div>
          <p style="color: #6b7280; font-size: 12px;">Bu bağlantı 10 dakika içinde geçersiz olacaktır.</p>
          <p style="color: #6b7280; font-size: 12px;">Bu hesabı siz oluşturmadıysanız, lütfen bu e-postayı göz ardı edin.</p>
        </div>
        <div style="background: #111827; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
          <p>&copy; 2024 DIABETLIYIM. Tüm hakları saklıdır.</p>
        </div>
      </div>
    `
  },
  passwordReset: {
    subject: 'DIABETLIYIM Şifrenizi Sıfırlayın',
    html: (name, resetLink) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #20caa8; color: white; padding: 20px; text-align: center;">
          <h1>DIABETLIYIM</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2>Şifre Sıfırlama Talebi</h2>
          <p>Merhaba ${name},</p>
          <p>Şifrenizi sıfırlamak için talepte bulundunuz. Yeni bir şifre oluşturmak için aşağıdaki düğmeye tıklayın.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #20caa8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Şifreyi Sıfırla
            </a>
          </div>
          <p style="color: #6b7280; font-size: 12px;">Bu bağlantı 10 dakika içinde geçersiz olacaktır.</p>
          <p style="color: #6b7280; font-size: 12px;">Bu talebi siz yapmadıysanız, lütfen bu e-postayı göz ardı edin; şifreniz değişmeden kalacaktır.</p>
        </div>
        <div style="background: #111827; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
          <p>&copy; 2024 DIABETLIYIM. Tüm hakları saklıdır.</p>
        </div>
      </div>
    `
  }
};

/**
 * Generate secure random token
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash token for storage
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Send verification email
 */
async function sendVerificationEmail(user) {
  const token = generateToken();
  const hashedToken = hashToken(token);

  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email.html?token=${token}`;

  const template = emailTemplates.verification;

  const mailOptions = {
    from: `"DIABETLIYIM" <${emailUser}>`,
    to: user.email,
    subject: template.subject,
    html: template.html(user.fullName || user.name, verificationLink)
  };

  await transporter.sendMail(mailOptions);

  return { token: hashedToken, expires: new Date(Date.now() + 10 * 60 * 1000) }; // 10 dakika
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(user) {
  const token = generateToken();
  const hashedToken = hashToken(token);

  const resetLink = `${process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password.html?token=${token}`;

  const template = emailTemplates.passwordReset;

  const mailOptions = {
    from: `"DIABETLIYIM" <${emailUser}>`,
    to: user.email,
    subject: template.subject,
    html: template.html(user.fullName || user.name, resetLink)
  };

  await transporter.sendMail(mailOptions);

  return { token: hashedToken, expires: new Date(Date.now() + 10 * 60 * 1000) }; // 10 dakika
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  hashToken,
  generateToken
};
