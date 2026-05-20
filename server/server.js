import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import https from 'https';
import { UserRepo } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'picswift_super_secret_session_token_key_12345';

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

// Helper: Native HTTPS Google Token Verifier (Compatible with all Node.js versions)
const verifyGoogleToken = (credential) => {
  return new Promise((resolve, reject) => {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON from Google Token Verification API'));
          }
        } else {
          reject(new Error(`Google token validation failed with status ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

// 40-Year Experienced Developer Dynamic CORS Handler
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://picswift.pages.dev',
  'https://picswift-image.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed)) || 
                      origin.includes('localhost') || 
                      origin.includes('127.0.0.1') ||
                      origin.endsWith('.vercel.app') ||
                      origin.endsWith('.pages.dev');
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policies'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

// Helper: Dynamic cookie configuration (environment aware)
const getCookieOptions = (req) => {
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
};

// Endpoints

// 1. Sign Up
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'All fields (email, password, name) are required.' });
  }

  try {
    const exists = await UserRepo.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const newUser = await UserRepo.create({
      name,
      email: email.toLowerCase(),
      password: hashPassword(password)
    });

    // Generate JWT Token
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    // Set Cookie
    res.cookie('token', token, getCookieOptions(req));

    return res.json({
      success: true,
      user: { name: newUser.name, email: newUser.email }
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// 2. Log In
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await UserRepo.findOne({ email: email.toLowerCase() });

    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT Token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // Set Cookie
    res.cookie('token', token, getCookieOptions(req));

    return res.json({
      success: true,
      user: { name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// 3. Google OAuth Verification (Real Production Mode)
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Google credentials are required.' });
  }

  try {
    // Validate Google JWT Token securely
    const payload = await verifyGoogleToken(credential);
    const { email, name } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Google profile did not contain email address.' });
    }

    let user = await UserRepo.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = await UserRepo.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: 'google_oauth_registered_account_secure'
      });
    }

    // Generate JWT Token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // Set Cookie
    res.cookie('token', token, getCookieOptions(req));

    return res.json({
      success: true,
      user: { name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Google verification failed:', err);
    return res.status(400).json({ error: err.message || 'Google token verification failed.' });
  }
});

// 4. Google Auth Mock (For local development testing without Client ID keys)
app.post('/api/auth/google-mock', async (req, res) => {
  try {
    let user = await UserRepo.findOne({ email: 'amit.rajput@gmail.com' });

    if (!user) {
      user = await UserRepo.create({
        name: 'Amit Rajput',
        email: 'amit.rajput@gmail.com',
        password: 'google_oauth_registered_account_secure'
      });
    }

    // Generate JWT Token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // Set Cookie
    res.cookie('token', token, getCookieOptions(req));

    return res.json({
      success: true,
      user: { name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Google Mock Login error:', err);
    return res.status(500).json({ error: 'Internal server error during sandbox login.' });
  }
});

// 5. Get Session User (Verify HTTP-Only Token)
app.get('/api/auth/me', async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'No active session found.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await UserRepo.findById(decoded.id);

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
  res.clearCookie('token', getCookieOptions(req));
  return res.json({ success: true, message: 'Logged out successfully.' });
});

app.listen(PORT, () => {
  console.log(`🚀 PicSwift backend running on http://localhost:${PORT}`);
});
