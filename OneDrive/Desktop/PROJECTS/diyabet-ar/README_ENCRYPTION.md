# DIABETLIYIM - Encryption & Security

## 🔐 Encryption Overview

This system uses **AES-256-CBC** encryption to protect sensitive patient data and medical files.

### Encrypted Data

#### Text Data (Database)
- Patient Identity Numbers
- Phone Numbers
- Addresses
- Daily Record Notes
- Lab Result Text

#### Files (Storage)
- Lab Reports (PDF/JPG/PNG)
- Medical Images
- All files in `/uploads/labs` are encrypted

## 🔑 Setup Encryption Key

### Generate Key
```bash
npm run generate-key
```

### Add to .env
```env
ENCRYPTION_KEY=your-generated-64-character-hex-key
```

⚠️ **CRITICAL**: Never commit your `.env` file or share the encryption key!

## 🛡️ Security Features

### Access Control
- Only assigned doctors can access patient data
- Patients can only access their own data
- File downloads require authentication and authorization
- All access attempts are logged

### Audit Logging
Every sensitive operation is logged:
- File uploads
- File downloads
- Data decryption
- Access denials
- Failed authentication attempts

### Encryption Flow

#### Upload:
1. File received in memory
2. Encrypted with AES-256-CBC
3. Saved as `.enc` file
4. Original file discarded

#### Download:
1. Verify user authorization
2. Read encrypted file
3. Decrypt in memory
4. Send to authorized user
5. Log access event

## 📊 Audit Logs

Query audit logs:
```javascript
// Get all access logs for a patient
db.auditlogs.find({ targetUserId: patientId })

// Get all failed access attempts
db.auditlogs.find({ status: 'failure' })

// Get file download history
db.auditlogs.find({ action: 'download', resourceType: 'lab_report' })
```

## 🔒 Data Protection

### Encryption Algorithm
- **Algorithm**: AES-256-CBC
- **Key Size**: 256 bits (32 bytes)
- **IV**: Random 16 bytes per encryption
- **Mode**: Cipher Block Chaining (CBC)

### Key Management
- Key stored in environment variable
- Never logged or exposed in responses
- Different IV for each encryption operation
- IV prepended to encrypted data

## 🚨 Security Best Practices

1. **Rotate Keys**: Change encryption key periodically
2. **Backup Keys**: Store backup securely offline
3. **Monitor Logs**: Review audit logs regularly
4. **Access Control**: Keep role permissions strict
5. **HTTPS Only**: Always use HTTPS in production

## 📋 Compliance

This encryption implementation helps meet:
- HIPAA Security Rule requirements
- GDPR data protection requirements
- Medical data privacy standards
- Turkish Personal Data Protection Law (KVKK)
