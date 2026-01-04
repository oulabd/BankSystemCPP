const nodemailer = require('nodemailer');

// إنشاء ناقل SMTP مع Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

// إرسال بريد إلكتروني لإعادة تعيين كلمة المرور
async function sendPasswordResetEmail(email, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;
  
  const mailOptions = {
    from: `"دعم DİYABETLİYİM" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: 'طلب إعادة تعيين كلمة المرور - DİYABETLİYİM',
    html: `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #20caa8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #20caa8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DİYABETLİYİM</h1>
          </div>
          <div class="content">
            <h2>طلب إعادة تعيين كلمة المرور</h2>
            <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لإعادة تعيينها:</p>
            <a href="${resetUrl}" class="button">إعادة تعيين كلمة المرور</a>
            <p>أو انسخ والصق هذا الرابط في متصفحك:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p><strong>سينتهي هذا الرابط خلال 15 دقيقة.</strong></p>
            <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 DİYABETLİYİM. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('فشل إرسال البريد الإلكتروني:', error);
    throw new Error('فشل إرسال بريد إعادة التعيين');
  }
}

module.exports = {
  sendPasswordResetEmail
};
