const express = require('express');
const Redis = require('ioredis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Initialize Redis connection
const redis = new Redis(REDIS_URL);

redis.on('connect', () => {
  console.log('Connected to Redis database.');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint to submit form
app.post('/api/submit', async (req, res) => {
  try {
    const formData = req.body;

    // Server-side validation of critical fields
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
      if (!formData[field.key] || formData[field.key].toString().trim() === '') {
        missingFields.push(field.name);
      }
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields / કૃપા કરીને બધા ફરજિયાત ક્ષેત્રો ભરો.',
        missing: missingFields
      });
    }

    // Basic format checks (e.g. age must be a positive number)
    const ageNum = parseInt(formData.age, 10);
    if (isNaN(ageNum) || ageNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Age must be a valid number / ઉંમર માન્ય સંખ્યા હોવી જોઈએ.'
      });
    }

    // Generate Unique Application ID
    const submissionId = `application:${Date.now()}:${Math.floor(1000 + Math.random() * 9000)}`;

    // Add submission metadata
    const submissionData = {
      ...formData,
      id: submissionId,
      submittedAt: new Date().toISOString()
    };

    // Store in Redis (we store it as a JSON string under the submissionId key, and add the key to a submissions list)
    await redis.set(submissionId, JSON.stringify(submissionData));
    await redis.lpush('submissions_list', submissionId);

    return res.status(200).json({
      success: true,
      message: 'Admission form submitted successfully! / પ્રવેશ અરજી સફળતાપૂર્વક સબમિટ કરવામાં આવી છે!',
      id: submissionId
    });
  } catch (error) {
    console.error('Submission error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error / સર્વર ભૂલ.'
    });
  }
});

// API Endpoint to fetch submissions
app.get('/api/submissions', async (req, res) => {
  try {
    const keys = await redis.lrange('submissions_list', 0, -1);
    if (keys.length === 0) {
      return res.status(200).json([]);
    }

    const pipeline = redis.pipeline();
    keys.forEach(key => pipeline.get(key));
    const results = await pipeline.exec();

    const submissions = results
      .map(([err, val]) => (val ? JSON.parse(val) : null))
      .filter(item => item !== null);

    return res.status(200).json(submissions);
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
