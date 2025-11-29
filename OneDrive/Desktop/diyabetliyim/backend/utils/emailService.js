const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Email templates in multiple languages
const emailTemplates = {
  verification: {
    en: {
      subject: 'Verify Your DIABETLIYIM Account',
      html: (name, verificationLink) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #20caa8; color: white; padding: 20px; text-align: center;">
            <h1>DIABETLIYIM</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2>Welcome, ${name}!</h2>
            <p>Thank you for registering with DIABETLIYIM. Please verify your email address to activate your account.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background: #20caa8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #6b7280; font-size: 12px;">This link will expire in 10 minutes.</p>
            <p style="color: #6b7280; font-size: 12px;">If you didn't create this account, please ignore this email.</p>
          </div>
          <div style="background: #111827; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
            <p>&copy; 2024 DIABETLIYIM. All rights reserved.</p>
          </div>
        </div>
      `
    },
    tr: {
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
    ar: {
      subject: 'تحقق من حساب DIABETLIYIM الخاص بك',
      html: (name, verificationLink) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl;">
          <div style="background: #20caa8; color: white; padding: 20px; text-align: center;">
            <h1>DIABETLIYIM</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2>مرحبا، ${name}!</h2>
            <p>شكرا لتسجيلك في DIABETLIYIM. يرجى التحقق من عنوان بريدك الإلكتروني لتفعيل حسابك.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background: #20caa8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                تحقق من عنوان البريد الإلكتروني
              </a>
            </div>
            <p style="color: #6b7280; font-size: 12px;">سينتهي صلاحية هذا الرابط خلال 10 دقائق.</p>
            <p style="color: #6b7280; font-size: 12px;">إذا لم تنشئ هذا الحساب، فيرجى تجاهل هذا البريد الإلكتروني.</p>
          </div>
          <div style="background: #111827; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
            <p>&copy; 2024 DIABETLIYIM. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      `
    }
  },
  passwordReset: {
    en: {
      subject: 'Reset Your DIABETLIYIM Password',
      html: (name, resetLink) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #20caa8; color: white; padding: 20px; text-align: center;">
            <h1>DIABETLIYIM</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2>Password Reset Request</h2>
            <p>Hello ${name},</p>
            <p>You requested to reset your password. Click the button below to create a new password.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #20caa8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #6b7280; font-size: 12px;">This link will expire in 10 minutes.</p>
            <p style="color: #6b7280; font-size: 12px;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div style="background: #111827; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
            <p>&copy; 2024 DIABETLIYIM. All rights reserved.</p>
          </div>
        </div>
      `
    },
    tr: {
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
    },
    ar: {
      subject: 'إعادة تعيين كلمة مرور DIABETLIYIM',
      html: (name, resetLink) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl;">
          <div style="background: #20caa8; color: white; padding: 20px; text-align: center;">
            <h1>DIABETLIYIM</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2>طلب إعادة تعيين كلمة المرور</h2>
            <p>مرحبا ${name}،</p>
            <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك. انقر فوق الزر أدناه لإنشاء كلمة مرور جديدة.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #20caa8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                إعادة تعيين كلمة المرور
              </a>
            </div>
            <p style="color: #6b7280; font-size: 12px;">سينتهي صلاحية هذا الرابط خلال 10 دقائق.</p>
            <p style="color: #6b7280; font-size: 12px;">إذا لم تطلب ذلك، فيرجى تجاهل هذا البريد الإلكتروني وستبقى كلمة المرور الخاصة بك دون تغيير.</p>
          </div>
          <div style="background: #111827; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
            <p>&copy; 2024 DIABETLIYIM. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      `
    }
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
async function sendVerificationEmail(user, language = 'en') {
  const token = generateToken();
  const hashedToken = hashToken(token);
  
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email.html?token=${token}`;
  
  const template = emailTemplates.verification[language] || emailTemplates.verification.en;
  
  const mailOptions = {
    from: `"DIABETLIYIM" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: template.subject,
    html: template.html(user.fullName || user.name, verificationLink)
  };
  
  await transporter.sendMail(mailOptions);
  
  return { token: hashedToken, expires: new Date(Date.now() + 10 * 60 * 1000) }; // 10 minutes
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(user, language = 'en') {
  const token = generateToken();
  const hashedToken = hashToken(token);
  
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password.html?token=${token}`;
  
  const template = emailTemplates.passwordReset[language] || emailTemplates.passwordReset.en;
  
  const mailOptions = {
    from: `"DIABETLIYIM" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: template.subject,
    html: template.html(user.fullName || user.name, resetLink)
  };
  
  await transporter.sendMail(mailOptions);
  
  return { token: hashedToken, expires: new Date(Date.now() + 10 * 60 * 1000) }; // 10 minutes
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  hashToken,
  generateToken
};
