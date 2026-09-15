require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ashaktashram_secret_key_2026';

// Paths
const frontendDir = process.env.FRONTEND_DIR || path.resolve(__dirname, '..', 'frontend');
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ============================================================
// In-Memory Store (fallback when Redis is unavailable)
// ============================================================
let useRedis = false;
let redis = null;
const memStore = {
  data: {},
  lists: {},
  get(key) { return this.data[key] || null; },
  set(key, value) { this.data[key] = value; },
  del(key) { delete this.data[key]; },
  lpush(key, value) {
    if (!this.lists[key]) this.lists[key] = [];
    this.lists[key].unshift(value);
  },
  lrange(key, start, stop) {
    if (!this.lists[key]) return [];
    if (stop === -1) return this.lists[key].slice(start);
    return this.lists[key].slice(start, stop + 1);
  },
  keys(pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Object.keys(this.data).filter(k => regex.test(k));
  }
};

// Try to connect to Redis, fall back to in-memory
try {
  const Redis = require('ioredis');
  const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 3, retryStrategy(times) { if (times > 3) return null; return Math.min(times * 200, 1000); } });
  redis.on('connect', () => { useRedis = true; console.log('✅ Connected to Redis database.'); });
  redis.on('error', (err) => {
    if (useRedis) console.error('Redis error:', err.message);
    else { console.log('⚠️  Redis unavailable, using in-memory store.'); redis.disconnect(); redis = null; }
  });
} catch (e) {
  console.log('⚠️  Redis module not critical, using in-memory store.');
}

// Unified store interface
const store = {
  async get(key) { if (useRedis) return redis.get(key); return memStore.get(key); },
  async set(key, value) { if (useRedis) return redis.set(key, value); return memStore.set(key, value); },
  async del(key) { if (useRedis) return redis.del(key); return memStore.del(key); },
  async lpush(key, value) { if (useRedis) return redis.lpush(key, value); return memStore.lpush(key, value); },
  async lrange(key, start, stop) { if (useRedis) return redis.lrange(key, start, stop); return memStore.lrange(key, start, stop); },
  async keys(pattern) { if (useRedis) return redis.keys(pattern); return memStore.keys(pattern); }
};

// ============================================================
// Middleware
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Multer config for profile photo
const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile_${req.user.username}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage: storageConfig, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files allowed'), false);
}});

// Serve static frontend assets
app.use(express.static(frontendDir));
app.use('/uploads', express.static(uploadsDir));

// Fallback to frontend uploads if exists
const frontendUploads = path.join(frontendDir, 'uploads');
if (fs.existsSync(frontendUploads)) {
  app.use('/uploads', express.static(frontendUploads));
}

// ============================================================
// Auth Middleware
// ============================================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Access denied. Please login.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}

// ============================================================
// Seed Default Users
// ============================================================
async function seedUsers() {
  const adminExists = await store.get('user:admin');
  if (!adminExists) {
    const adminHash = await bcrypt.hash('admin123', 10);
    await store.set('user:admin', JSON.stringify({ username: 'admin', password: adminHash, role: 'admin', phone: '', profilePhoto: '', createdAt: new Date().toISOString() }));
    console.log('👤 Seeded admin account (admin / admin123)');
  }
  const servantExists = await store.get('user:servant');
  if (!servantExists) {
    const servantHash = await bcrypt.hash('servant123', 10);
    await store.set('user:servant', JSON.stringify({ username: 'servant', password: servantHash, role: 'servant', phone: '', profilePhoto: '', createdAt: new Date().toISOString() }));
    console.log('👤 Seeded servant account (servant / servant123)');
  }
}

// Seed after a small delay to allow Redis connection
setTimeout(seedUsers, 1500);

// ============================================================
// AUTH ROUTES
// ============================================================
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password required.' });
    
    const userData = await store.get(`user:${username.toLowerCase()}`);
    if (!userData) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    
    const user = JSON.parse(userData);
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    
    const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ success: true, token, user: { username: user.username, role: user.role, phone: user.phone, profilePhoto: user.profilePhoto } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ============================================================
// PROFILE / SETTINGS ROUTES
// ============================================================
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userData = await store.get(`user:${req.user.username}`);
    if (!userData) return res.status(404).json({ success: false, message: 'User not found.' });
    const user = JSON.parse(userData);
    return res.json({ success: true, user: { username: user.username, role: user.role, phone: user.phone || '', profilePhoto: user.profilePhoto || '' } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userData = await store.get(`user:${req.user.username}`);
    if (!userData) return res.status(404).json({ success: false, message: 'User not found.' });
    const user = JSON.parse(userData);
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    await store.set(`user:${req.user.username}`, JSON.stringify(user));
    return res.json({ success: true, message: 'Profile updated.', user: { username: user.username, role: user.role, phone: user.phone, profilePhoto: user.profilePhoto } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.post('/api/profile/photo', authenticateToken, (req, res, next) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    try {
      const userData = await store.get(`user:${req.user.username}`);
      const user = JSON.parse(userData);
      // Delete old photo if exists
      if (user.profilePhoto) {
        const oldFile = path.basename(user.profilePhoto);
        const oldPath = path.join(uploadsDir, oldFile);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      user.profilePhoto = `/uploads/${req.file.filename}`;
      await store.set(`user:${req.user.username}`, JSON.stringify(user));
      return res.json({ success: true, profilePhoto: user.profilePhoto });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  });
});

app.put('/api/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ success: false, message: 'Both old and new passwords required.' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    
    const userData = await store.get(`user:${req.user.username}`);
    const user = JSON.parse(userData);
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Old password is incorrect.' });
    
    user.password = await bcrypt.hash(newPassword, 10);
    await store.set(`user:${req.user.username}`, JSON.stringify(user));
    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ============================================================
// ADMISSION FORM ROUTES
// ============================================================
app.post('/api/submit', authenticateToken, requireRole('servant'), async (req, res) => {
  try {
    const formData = req.body;
    const requiredFields = [
      { key: 'full_name', name: 'Full Name / નામ' },
      { key: 'address', name: 'Address / સરનામું' },
      { key: 'phone_home', name: 'Home Phone / ફોન' },
      { key: 'age', name: 'Age / ઉંમર' },
      { key: 'date_of_birth', name: 'Date of Birth / જન્મ તારીખ' },
      { key: 'nominee_name', name: 'Nominee Name / નોમીનીનું નામ' },
      { key: 'nominee_relation', name: 'Nominee Relation / સગાઈ સંબંધ' },
      { key: 'nominee_phone', name: 'Nominee Phone / ટેલીફોન નંબર' },
      { key: 'responsible_person_name', name: 'Responsible Person / જવાબદાર વ્યક્તિ' },
      { key: 'rules_read_acknowledgement', name: 'Rules Acknowledgement / નિયમો સ્વીકૃતિ' }
    ];
    const missingFields = [];
    requiredFields.forEach(field => {
      if (!formData[field.key] || formData[field.key].toString().trim() === '') missingFields.push(field.name);
    });
    if (missingFields.length > 0) return res.status(400).json({ success: false, message: 'Please fill all required fields.', missing: missingFields });

    const ageNum = parseInt(formData.age, 10);
    if (isNaN(ageNum) || ageNum <= 0) return res.status(400).json({ success: false, message: 'Age must be a valid number.' });

    // Auto-generate application number
    const countStr = await store.get('counter:applications') || '0';
    const count = parseInt(countStr, 10) + 1;
    await store.set('counter:applications', count.toString());

    const submissionId = `application:${Date.now()}:${count}`;
    const submissionData = {
      ...formData,
      id: submissionId,
      applicationNumber: count,
      submittedBy: req.user.username,
      submittedAt: new Date().toISOString()
    };
    await store.set(submissionId, JSON.stringify(submissionData));
    await store.lpush('submissions_list', submissionId);

    return res.json({ success: true, message: 'Admission form submitted successfully! / પ્રવેશ અરજી સફળતાપૂર્વક સબમિટ થઈ!', id: submissionId, applicationNumber: count });
  } catch (error) {
    console.error('Submission error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
});

app.get('/api/submissions', authenticateToken, async (req, res) => {
  try {
    const keys = await store.lrange('submissions_list', 0, -1);
    if (keys.length === 0) return res.json([]);
    const submissions = [];
    for (const key of keys) {
      const val = await store.get(key);
      if (val) submissions.push(JSON.parse(val));
    }
    // Sort by submittedAt descending
    submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    return res.json(submissions);
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ============================================================
// DONATION RECEIPT ROUTES
// ============================================================
app.post('/api/donation', authenticateToken, requireRole('servant'), async (req, res) => {
  try {
    const data = req.body;
    const requiredFields = [
      { key: 'donor_name', name: 'Donor Name / દાતાનું નામ' },
      { key: 'amount', name: 'Amount / રકમ' },
      { key: 'receipt_date', name: 'Date / તારીખ' }
    ];
    const missing = [];
    requiredFields.forEach(f => { if (!data[f.key] || data[f.key].toString().trim() === '') missing.push(f.name); });
    if (missing.length > 0) return res.status(400).json({ success: false, message: 'Please fill all required fields.', missing });

    // Auto-increment receipt number
    const countStr = await store.get('counter:donations') || '13940';
    const count = parseInt(countStr, 10) + 1;
    await store.set('counter:donations', count.toString());

    const receiptId = `donation:${Date.now()}:${count}`;
    const receiptData = {
      ...data,
      id: receiptId,
      receiptNumber: count,
      submittedBy: req.user.username,
      submittedAt: new Date().toISOString()
    };
    await store.set(receiptId, JSON.stringify(receiptData));
    await store.lpush('donations_list', receiptId);

    return res.json({ success: true, message: 'Donation receipt created successfully! / દાન રસીદ સફળતાપૂર્વક બની!', id: receiptId, receiptNumber: count });
  } catch (error) {
    console.error('Donation error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
});

app.get('/api/donations', authenticateToken, async (req, res) => {
  try {
    const keys = await store.lrange('donations_list', 0, -1);
    if (keys.length === 0) return res.json([]);
    const donations = [];
    for (const key of keys) {
      const val = await store.get(key);
      if (val) donations.push(JSON.parse(val));
    }
    donations.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    return res.json(donations);
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ============================================================
// SERVE FRONTEND
// ============================================================
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(frontendDir, 'dashboard.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
