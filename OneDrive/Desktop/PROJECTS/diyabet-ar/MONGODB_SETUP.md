# MongoDB Database Setup Guide

## Creating Separate Databases

This project uses two separate MongoDB databases:
- **diyabet-tr**: Turkish version (port 3000)
- **diyabet-ar**: Arabic version (port 3001)

## Method 1: Using the Setup Script

Run the provided script:

```powershell
# If using mongosh (MongoDB Shell 5.x+)
mongosh < setup-databases.mongodb

# OR if using legacy mongo shell
mongo < setup-databases.mongodb
```

## Method 2: Manual Creation via MongoDB Shell

```javascript
// Connect to MongoDB
mongosh

// Or for legacy mongo shell
mongo

// Create Turkish database
use diyabet-tr
db.createCollection('users')

// Create Arabic database
use diyabet-ar
db.createCollection('users')

// Verify databases exist
show dbs
```

## Method 3: Automatic Creation on First Use

MongoDB databases are created automatically when the application first connects and writes data. Simply:

1. Start the Turkish version (port 3000):
   ```powershell
   cd backend
   cp .env.tr .env
   node server.js
   ```

2. Start the Arabic version (port 3001):
   ```powershell
   cd backend
   cp .env.ar .env
   node server.js
   ```

The databases will be created automatically when the first user registers or data is written.

## Verification

Check that both databases exist:

```javascript
// In MongoDB shell
show dbs
```

You should see both:
- `diyabet-tr`
- `diyabet-ar`

## Configuration Files

- **Turkish**: `backend/.env.tr` → `mongodb://127.0.0.1:27017/diyabet-tr`
- **Arabic**: `backend/.env.ar` → `mongodb://127.0.0.1:27017/diyabet-ar`

## Notes

- Each database maintains separate collections for users, patients, and medical records
- No data sharing between versions
- Both can run on the same MongoDB instance (different databases)
- Make sure MongoDB service is running: `net start MongoDB` or check MongoDB Compass
