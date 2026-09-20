require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ashaktashram_secret_key_2026';

// Allow CORS for Vercel, localhost, or any frontend domain
app.use(cors({
  origin: true,
  credentials: true
}));

// Paths
const frontendDir = process.env.FRONTEND_DIR || path.resolve(__dirname, '..', 'frontend');
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ============================================================
// SQLite Database Setup
// ============================================================
const dbPath = path.resolve(__dirname, 'ashaktashram.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log(`📦 SQLite database initialized at: ${dbPath}`);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'servant',
    phone TEXT DEFAULT '',
    profilePhoto TEXT DEFAULT '',
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    applicationNumber INTEGER,
    data TEXT NOT NULL,
    submittedBy TEXT,
    submittedAt TEXT DEFAULT (datetime('now')),
    office_admission_date TEXT DEFAULT '',
    office_monthly_charge TEXT DEFAULT '',
    office_director_signature TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS donations (
    id TEXT PRIMARY KEY,
    receiptNumber INTEGER,
    data TEXT NOT NULL,
    submittedBy TEXT,
    submittedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS counters (
    name TEXT PRIMARY KEY,
    value INTEGER NOT NULL DEFAULT 0
  );
`);

// Initialize counters if they don't exist
const initCounter = db.prepare('INSERT OR IGNORE INTO counters (name, value) VALUES (?, ?)');
initCounter.run('applications', 0);
initCounter.run('donations', 13940);

console.log('✅ Database tables ready.');

// ============================================================
// Seed Default Users
// ============================================================
function seedUsers() {
  const getUser = db.prepare('SELECT username FROM users WHERE username = ?');
  const insertUser = db.prepare('INSERT INTO users (username, password, role, phone, profilePhoto, createdAt) VALUES (?, ?, ?, ?, ?, ?)');

  if (!getUser.get('admin')) {
    const adminHash = bcrypt.hashSync('admin123', 10);
    insertUser.run('admin', adminHash, 'admin', '', '', new Date().toISOString());
    console.log('👤 Seeded admin account (admin / admin123)');
  }
  if (!getUser.get('servant')) {
    const servantHash = bcrypt.hashSync('servant123', 10);
    insertUser.run('servant', servantHash, 'servant', '', '', new Date().toISOString());
    console.log('👤 Seeded servant account (servant / servant123)');
  }
}
seedUsers();

// ============================================================
// Middleware
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Multer config for profile photo
const profileStorageConfig = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile_${req.user.username}_${Date.now()}${ext}`);
  }
});
const uploadProfile = multer({ storage: profileStorageConfig, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files allowed'), false);
}});

// Multer config for director signature
const signatureStorageConfig = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `signature_${req.user.username}_${Date.now()}${ext}`);
  }
});
const uploadSignature = multer({ storage: signatureStorageConfig, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
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
// AUTH ROUTES
// ============================================================
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password required.' });
    
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.toLowerCase());
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    
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
app.get('/api/profile', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(req.user.username);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user: { username: user.username, role: user.role, phone: user.phone || '', profilePhoto: user.profilePhoto || '' } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.put('/api/profile', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(req.user.username);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (req.body.phone !== undefined) {
      db.prepare('UPDATE users SET phone = ? WHERE username = ?').run(req.body.phone, req.user.username);
    }
    const updated = db.prepare('SELECT * FROM users WHERE username = ?').get(req.user.username);
    return res.json({ success: true, message: 'Profile updated.', user: { username: updated.username, role: updated.role, phone: updated.phone, profilePhoto: updated.profilePhoto } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.post('/api/profile/photo', authenticateToken, (req, res, next) => {
  uploadProfile.single('photo')(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    try {
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(req.user.username);
      // Delete old photo if exists
      if (user.profilePhoto) {
        const oldFile = path.basename(user.profilePhoto);
        const oldPath = path.join(uploadsDir, oldFile);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      const newPhoto = `/uploads/${req.file.filename}`;
      db.prepare('UPDATE users SET profilePhoto = ? WHERE username = ?').run(newPhoto, req.user.username);
      return res.json({ success: true, profilePhoto: newPhoto });
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
    
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(req.user.username);
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Old password is incorrect.' });
    
    const newHash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE username = ?').run(newHash, req.user.username);
    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ============================================================
// ADMISSION FORM ROUTES
// ============================================================
app.post('/api/submit', authenticateToken, requireRole('servant', 'admin'), (req, res) => {
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
    const counter = db.prepare('SELECT value FROM counters WHERE name = ?').get('applications');
    const count = (counter ? counter.value : 0) + 1;
    db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(count, 'applications');

    const submissionId = `application:${Date.now()}:${count}`;
    const submittedAt = new Date().toISOString();
    const submissionData = {
      ...formData,
      id: submissionId,
      applicationNumber: count,
      submittedBy: req.user.username,
      submittedAt: submittedAt
    };

    db.prepare('INSERT INTO submissions (id, applicationNumber, data, submittedBy, submittedAt, office_admission_date, office_monthly_charge, office_director_signature) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      submissionId, count, JSON.stringify(submissionData), req.user.username, submittedAt,
      formData.office_admission_date || '',
      formData.office_monthly_charge || '',
      formData.office_director_signature || ''
    );

    return res.json({ success: true, message: 'Admission form submitted successfully! / પ્રવેશ અરજી સફળતાપૂર્વક સબમિટ થઈ!', id: submissionId, applicationNumber: count });
  } catch (error) {
    console.error('Submission error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
});

app.get('/api/submissions', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM submissions ORDER BY submittedAt DESC').all();
    const submissions = rows.map(row => {
      const data = JSON.parse(row.data);
      // Merge office-use fields from the database columns
      data.office_admission_date = row.office_admission_date || data.office_admission_date || '';
      data.office_monthly_charge = row.office_monthly_charge || data.office_monthly_charge || '';
      data.office_director_signature = row.office_director_signature || data.office_director_signature || '';
      return data;
    });
    return res.json(submissions);
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ============================================================
// OFFICE USE UPDATE (Servant & Admin)
// ============================================================
app.put('/api/submissions/:id/office', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { office_admission_date, office_monthly_charge, office_director_signature } = req.body;

    const row = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ success: false, message: 'Submission not found.' });

    // Update office-use columns
    db.prepare('UPDATE submissions SET office_admission_date = ?, office_monthly_charge = ?, office_director_signature = ? WHERE id = ?').run(
      office_admission_date || '', office_monthly_charge || '', office_director_signature || '', id
    );

    // Also update the JSON data blob for consistency
    const data = JSON.parse(row.data);
    data.office_admission_date = office_admission_date || '';
    data.office_monthly_charge = office_monthly_charge || '';
    data.office_director_signature = office_director_signature || '';
    db.prepare('UPDATE submissions SET data = ? WHERE id = ?').run(JSON.stringify(data), id);

    return res.json({ success: true, message: 'Office use fields updated successfully.' });
  } catch (error) {
    console.error('Office update error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
});

// ============================================================
// SIGNATURE UPLOAD (Any authenticated user)
// ============================================================
app.post('/api/upload-signature', authenticateToken, (req, res, next) => {
  uploadSignature.single('signature')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    try {
      const signaturePath = `/uploads/${req.file.filename}`;
      return res.json({ success: true, signaturePath: signaturePath });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  });
});

// ============================================================
// DONATION RECEIPT ROUTES
// ============================================================
app.post('/api/donation', authenticateToken, requireRole('servant', 'admin'), (req, res) => {
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
    const counter = db.prepare('SELECT value FROM counters WHERE name = ?').get('donations');
    const count = (counter ? counter.value : 13940) + 1;
    db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(count, 'donations');

    const receiptId = `donation:${Date.now()}:${count}`;
    const submittedAt = new Date().toISOString();
    const receiptData = {
      ...data,
      id: receiptId,
      receiptNumber: count,
      submittedBy: req.user.username,
      submittedAt: submittedAt
    };

    db.prepare('INSERT INTO donations (id, receiptNumber, data, submittedBy, submittedAt) VALUES (?, ?, ?, ?, ?)').run(
      receiptId, count, JSON.stringify(receiptData), req.user.username, submittedAt
    );

    return res.json({ success: true, message: 'Donation receipt created successfully! / દાન રસીદ સફળતાપૂર્વક બની!', id: receiptId, receiptNumber: count });
  } catch (error) {
    console.error('Donation error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
});

app.get('/api/donations', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM donations ORDER BY submittedAt DESC').all();
    const donations = rows.map(row => JSON.parse(row.data));
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
