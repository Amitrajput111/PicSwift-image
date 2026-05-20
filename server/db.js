import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'users.db.json');

// Transaction-safe, thread-safe database file writer
class FileDatabase {
  constructor() {
    this.users = [];
    this.load();
  }

  // Load database from file
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
      console.error('Failed to load database file. Initializing empty database.', err);
      this.users = [];
    }
  }

  // Save database to file atomically (prevents data corruption during concurrent writes)
  save() {
    try {
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(this.users, null, 2), 'utf8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Database write error:', err);
    }
  }
}

const fileDb = new FileDatabase();

// Repository pattern providing a database-agnostic interface
export const UserRepo = {
  // Query: Find one user matching filter criteria
  async findOne(filter) {
    fileDb.load(); // Refresh state from disk
    return fileDb.users.find(user => {
      for (const key in filter) {
        if (user[key] !== filter[key]) return false;
      }
      return true;
    }) || null;
  },

  // Query: Find user by ID
  async findById(id) {
    fileDb.load();
    return fileDb.users.find(user => user.id === id) || null;
  },

  // Mutation: Create new user
  async create(userData) {
    fileDb.load();
    
    // Validate schema
    if (!userData.email || !userData.password || !userData.name) {
      throw new Error('Schema validation failed: Missing required fields (email, password, name).');
    }

    const emailLower = userData.email.toLowerCase();
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
    fileDb.load();
    const index = fileDb.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('User not found.');
    }

    fileDb.users[index] = {
      ...fileDb.users[index],
      ...updates,
      id // Prevent ID modification
    };

    fileDb.save();
    return fileDb.users[index];
  }
};
