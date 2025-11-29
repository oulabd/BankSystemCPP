// Quick script to list users from the local MongoDB using the project's model
// Usage: from the project root run `node scripts/listUsers.js`

const path = require('path');

// Prefer the backend's mongoose (if present) so models loaded from backend use the same instance
let mongoose;
try {
  const backendMongoosePath = path.join(__dirname, '..', 'backend', 'node_modules', 'mongoose');
  mongoose = require(backendMongoosePath);
} catch (e) {
  // fallback to project mongoose
  mongoose = require('mongoose');
}

async function main() {
  try {
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/diyabet';
    // Mongoose v7+ no longer requires useNewUrlParser/useUnifiedTopology options
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB at', MONGO_URI);

    // Require the User model from the backend
    const User = require(path.join(__dirname, '..', 'backend', 'models', 'User'));

    const users = await User.find().limit(50).lean();
    console.log('Users:', users.length);
    users.forEach(u => {
      console.log(JSON.stringify(u, null, 2));
    });

    const count = await User.countDocuments();
    console.log('Total user count:', count);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error listing users:', err);
    process.exitCode = 1;
  }
}

main();
