import mongoose from 'mongoose';

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (!cached.promise) {
    const isAtlas = uri.startsWith('mongodb+srv://');
    const opts = {
      bufferCommands: false,
      // 8-second timeout prevents long request hangs when offline or if Atlas IP isn't whitelisted
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      // Safe masked URI for secure logging
      const safeUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
      console.log(`[DB] Connected successfully to ${isAtlas ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB (Compass)'} -> ${safeUri}`);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null; // Clear cached promise on failure so subsequent requests can retry
    const isAtlas = uri.startsWith('mongodb+srv://');

    if (isAtlas) {
      console.error('[DB Error] Failed to connect to MongoDB Atlas. Common causes:');
      console.error('1. Current IP address is not whitelisted in Atlas (Network Access -> Add IP Address / Allow 0.0.0.0/0).');
      console.error('2. Incorrect database username or password.');
      console.error('3. Network firewall blocking outbound port 27017.');
    } else {
      console.error('[DB Error] Failed to connect to Local MongoDB. Common causes:');
      console.error('1. MongoDB local service is not running. Start the service via Services or MongoDB Compass.');
      console.error('2. Ensure URI uses 127.0.0.1 instead of localhost if IPv6 resolution fails: mongodb://127.0.0.1:27017/grade_db');
    }

    console.error('Original Error:', err.message);
    throw err;
  }
}

export default dbConnect;
