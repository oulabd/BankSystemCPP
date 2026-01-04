# Email Configuration Guide - DİYABETLİYİM

## Problem
You're getting a **500 Internal Server Error** when trying to request a password reset link. This happens because the email credentials are not properly configured.

## Root Cause
The `.env` file in the `backend/` folder has placeholder values for email configuration:
```env
SMTP_EMAIL=your-gmail@gmail.com
SMTP_PASSWORD=your-app-password
```

When you try to send a password reset email, the nodemailer library fails because it can't authenticate with Gmail using these placeholder credentials.

## Solution

### Option 1: Use Gmail (Recommended for Development)

1. **Open** `backend/.env` file

2. **Update** the email credentials:
   ```env
   SMTP_EMAIL=your-actual-gmail@gmail.com
   SMTP_PASSWORD=your-16-character-app-password
   ```

3. **Get a Gmail App Password:**
   - Go to your Google Account: https://myaccount.google.com/
   - Navigate to **Security** → **2-Step Verification** (enable if not already)
   - Scroll down to **App passwords**
   - Select **Mail** and **Windows Computer** (or Other)
   - Click **Generate**
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
   - Paste it in `.env` as: `SMTP_PASSWORD=abcdefghijklmnop` (remove spaces)

4. **Restart the backend server:**
   ```powershell
   cd backend
   node server.js
   ```

### Option 2: Use Other Email Providers

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
SMTP_EMAIL=your-email@outlook.com
SMTP_PASSWORD=your-outlook-password
```

#### Custom SMTP Server
```env
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
SMTP_EMAIL=your-email@domain.com
SMTP_PASSWORD=your-password
```

### Option 3: Disable Email Features (Development Only)

If you don't need email functionality right now, you can modify the code to skip sending emails:

**Edit `backend/controllers/authController.js`:**

```javascript
// Around line 254
async function forgotPassword(req, res) {
  try {
    const { email, language = 'en' } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'If the email exists, a password reset link has been sent.' });
    }
    
    // ⚠️ DEVELOPMENT ONLY - Skip email sending
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    user.resetToken = hashedToken;
    user.resetTokenExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    
    console.log('🔗 Password Reset Link (DEV MODE):');
    console.log(`http://localhost:5500/reset-password.html?token=${token}`);
    
    res.json({ message: 'Password reset link logged to console (dev mode).' });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
```

This will print the reset link in the server console instead of sending an email.

## Testing the Fix

1. **Restart the backend server** after updating `.env`

2. **Open the browser console** (F12)

3. **Go to** `forgot-password.html`

4. **Enter a valid email** address (one that exists in your database)

5. **Click** "Send Reset Link"

6. **Check:**
   - ✅ No 500 error in console
   - ✅ Success message appears
   - ✅ Email arrives in inbox (check spam folder)

## Verification Checklist

- [ ] `.env` file has real email credentials (not placeholders)
- [ ] Gmail 2-Step Verification is enabled (if using Gmail)
- [ ] App Password generated and copied correctly (no spaces)
- [ ] Backend server restarted after changing `.env`
- [ ] No warnings in server console about email credentials
- [ ] Test email sent successfully

## Common Errors

### "Invalid login: 535-5.7.8 Username and Password not accepted"
- **Cause:** Wrong email/password or App Password not set up
- **Fix:** Generate a new App Password from Google Account settings

### "Connection timeout"
- **Cause:** Firewall blocking port 587 or wrong SMTP host
- **Fix:** Check firewall settings, verify `EMAIL_HOST` is correct

### "Self-signed certificate"
- **Cause:** TLS/SSL issues with some providers
- **Fix:** Add `tls: { rejectUnauthorized: false }` to transporter config (development only)

## Current Status

✅ **Fixed:** Environment variable names now support both `SMTP_EMAIL` and `EMAIL_USER`
✅ **Fixed:** Server now shows clear warnings if email is not configured
✅ **Fixed:** Better error handling in email service

⚠️ **Action Required:** You must configure real email credentials in `backend/.env`

## Need Help?

If you continue to have issues:
1. Check the backend server console for detailed error messages
2. Verify the email address exists in the database
3. Try sending a test email using a simple nodemailer script
4. Check your email provider's SMTP documentation
