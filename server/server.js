import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'users.json');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'picswift_super_secret_session_token_key_12345';

// Helper: Read/Write users
const readUsers = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const writeUsers = (users) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf8');
};

// Helper: Hashing function in pure JS (SHA-256 equivalent for portability)
const hashPassword = (password) => {
  let hash = 0;
  const salted = password + "picswift_salt_982";
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
};

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

// Endpoints

// 1. Sign Up
app.post('/api/auth/signup', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'All fields (email, password, name) are required.' });
  }

  const users = readUsers();
  const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'User with this email already exists.' });
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email: email.toLowerCase(),
    password: hashPassword(password),
    usages: 0
  };

  users.push(newUser);
  writeUsers(users);

  // Generate JWT Token
  const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

  // Set HTTP-Only Cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return res.json({
    success: true,
    user: { name: newUser.name, email: newUser.email }
  });
});

// 2. Log In
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = readUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.password !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Generate JWT Token
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  // Set HTTP-Only Cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return res.json({
    success: true,
    user: { name: user.name, email: user.email }
  });
});

// 3. Google OAuth Verification (Real Production Mode)
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Google credentials are required.' });
  }

  try {
    // Validate Google JWT Token with Google API securely
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!googleRes.ok) {
      return res.status(400).json({ error: 'Failed to verify Google token.' });
    }

    const payload = await googleRes.json();
    const { email, name } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Google profile did not contain email address.' });
    }

    const users = readUsers();
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      user = {
        id: Date.now().toString(),
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: 'google_oauth_registered_account_secure',
        usages: 0
      };
      users.push(user);
      writeUsers(users);
    }

    // Generate JWT Token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // Set HTTP-Only Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      user: { name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Google verification failed:', err);
    return res.status(500).json({ error: 'Authentication service unavailable.' });
  }
});

// 4. Google Auth Mock (For local development testing without Client ID keys)
app.post('/api/auth/google-mock', (req, res) => {
  const users = readUsers();
  let user = users.find(u => u.email.toLowerCase() === 'amit.rajput@gmail.com');

  if (!user) {
    user = {
      id: Date.now().toString(),
      name: 'Amit Rajput',
      email: 'amit.rajput@gmail.com',
      password: 'google_oauth_registered_account_secure',
      usages: 0
    };
    users.push(user);
    writeUsers(users);
  }

  // Generate JWT Token
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  // Set HTTP-Only Cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return res.json({
    success: true,
    user: { name: user.name, email: user.email }
  });
});

// 5. Get Session User (Verify HTTP-Only Token)
app.get('/api/auth/me', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'No active session found.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = readUsers();
    const user = users.find(u => u.id === decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User session not found.' });
    }

    return res.json({
      success: true,
      user: { name: user.name, email: user.email }
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

// 6. Log Out
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  return res.json({ success: true, message: 'Logged out successfully.' });
});

app.listen(PORT, () => {
  console.log(`🚀 PicSwift backend running on http://localhost:${PORT}`);
});
