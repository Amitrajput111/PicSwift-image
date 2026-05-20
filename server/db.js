import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'users.db.json');

// 1. Portable Local File-Based DB Engine (for zero-config local dev)
class FileDatabase {
  constructor() {
    this.users = [];
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.users = JSON.parse(raw);
      } else {
        this.users = [];
        this.save();
      }
    } catch (err) {
      console.warn('Failed to load local DB file. Initializing empty database.', err);
      this.users = [];
    }
  }

  save() {
    try {
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(this.users, null, 2), 'utf8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Local DB write error:', err);
    }
  }
}

const fileDb = new FileDatabase();

// 2. Mongoose / MongoDB Database Engine (for production-grade scaling)
const MONGODB_URI = process.env.MONGODB_URI || null;
let isMongoConnected = false;
let MongoUser = null;

if (MONGODB_URI) {
  try {
    mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }).then(() => {
      console.log('🚀 Successfully connected to live production MongoDB database!');
      isMongoConnected = true;
    }).catch(err => {
      console.error('❌ MongoDB connection failed. Falling back to local file database:', err.message);
    });

    const userSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true, lowercase: true },
      password: { type: String, required: true },
      usages: { type: Number, default: 0 },
      createdAt: { type: Date, default: Date.now }
    });

    MongoUser = mongoose.model('User', userSchema);
  } catch (err) {
    console.error('MongoDB Initialization error:', err);
  }
} else {
  console.log('ℹ️ MONGODB_URI environment variable not defined. Running in secure portable local database mode.');
}

// 3. Database Agnostic Repository Pattern
export const UserRepo = {
  // Query: Find one user matching filter criteria
  async findOne(filter) {
    if (isMongoConnected && MongoUser) {
      try {
        const user = await MongoUser.findOne(filter);
        return user ? user.toObject() : null;
      } catch (err) {
        console.error('MongoDB query error, switching to fallback database:', err);
      }
    }
    
    // File fallback
    fileDb.load();
    return fileDb.users.find(user => {
      for (const key in filter) {
        if (user[key] !== filter[key]) return false;
      }
      return true;
    }) || null;
  },

  // Query: Find user by ID
  async findById(id) {
    if (isMongoConnected && MongoUser) {
      try {
        const user = await MongoUser.findById(id);
        return user ? user.toObject() : null;
      } catch (err) {
        console.error('MongoDB query error, switching to fallback database:', err);
      }
    }

    // File fallback
    fileDb.load();
    return fileDb.users.find(user => user.id === id) || null;
  },

  // Mutation: Create a new user account
  async create(userData) {
    if (!userData.email || !userData.password || !userData.name) {
      throw new Error('Schema validation failed: Missing required fields (email, password, name).');
    }

    const emailLower = userData.email.toLowerCase();

    if (isMongoConnected && MongoUser) {
      try {
        const newUser = new MongoUser({
          name: userData.name,
          email: emailLower,
          password: userData.password,
          usages: userData.usages || 0
        });
        const saved = await newUser.save();
        return saved.toObject();
      } catch (err) {
        console.error('MongoDB write failed, writing to fallback database:', err);
      }
    }

    // File fallback
    fileDb.load();
    const exists = fileDb.users.some(u => u.email === emailLower);
    if (exists) {
      throw new Error('Unique constraint failed: Email already registered.');
    }

    const newUser = {
      id: Date.now().toString(),
      name: userData.name,
      email: emailLower,
      password: userData.password,
      usages: userData.usages || 0,
      createdAt: new Date().toISOString()
    };

    fileDb.users.push(newUser);
    fileDb.save();
    return newUser;
  },

  // Mutation: Update user attributes
  async update(id, updates) {
    if (isMongoConnected && MongoUser) {
      try {
        const updated = await MongoUser.findByIdAndUpdate(id, updates, { new: true });
        return updated ? updated.toObject() : null;
      } catch (err) {
        console.error('MongoDB update failed, updating in fallback database:', err);
      }
    }

    // File fallback
    fileDb.load();
    const index = fileDb.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('User not found.');
    }

    fileDb.users[index] = {
      ...fileDb.users[index],
      ...updates,
      id // Prevent ID modifications
    };

    fileDb.save();
    return fileDb.users[index];
  }
};
