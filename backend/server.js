import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import ws from 'ws';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Ensure model directory exists
const modelDir = path.join(__dirname, 'model');
if (!fs.existsSync(modelDir)) {
  fs.mkdirSync(modelDir, { recursive: true });
}

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      realtime: {
        transport: ws
      }
    });
    console.log('[SUPABASE] Connected successfully.');
  } catch (err) {
    console.error('[SUPABASE] Connection error:', err.message);
  }
} else {
  console.log('[SUPABASE] Credentials missing. Running in local/mock database mode.');
}

// Local mock database for offline fallback
const localHistory = {};

// Helper function to check if Python is available
const checkPythonAvailability = () => {
  return new Promise((resolve) => {
    exec('python --version', (err) => {
      if (err) {
        exec('python3 --version', (err3) => {
          if (err3) {
            resolve({ available: false, command: null });
          } else {
            resolve({ available: true, command: 'python3' });
          }
        });
      } else {
        resolve({ available: true, command: 'python' });
      }
    });
  });
};

// Heuristic prediction engine (clinical rules-based simulation)
const simulatePrediction = (metadata) => {
  const age = parseInt(metadata.age) || 50;
  const bmi = parseFloat(metadata.bmi) || 24.0;
  const swollen = metadata.swollen_muscles === 'yes';
  const bypass = metadata.heart_bypass === 'yes';
  const womac = parseInt(metadata.womac_score) || 50;
  const years = parseInt(metadata.symptom_years) || 1;

  // Calculate score based on clinical factors
  let score = 0;
  
  if (age > 60) score += 1.5;
  else if (age > 45) score += 0.8;
  
  if (bmi > 30) score += 1.5;
  else if (bmi > 25) score += 0.8;
  
  if (womac > 150) score += 1.8;
  else if (womac > 80) score += 1.0;
  
  if (years > 5) score += 1.2;
  else if (years > 2) score += 0.6;
  
  if (swollen) score += 1.0;
  if (bypass) score += 0.5;

  // Determine KL grade (0 to 4)
  let kl_grade = 0;
  if (score >= 5.0) kl_grade = 4;
  else if (score >= 3.5) kl_grade = 3;
  else if (score >= 2.0) kl_grade = 2;
  else if (score >= 1.0) kl_grade = 1;
  else kl_grade = 0;

  // Generate realistic confidence probabilities
  const probabilities = [0.05, 0.05, 0.05, 0.05, 0.05];
  probabilities[kl_grade] = 0.8;
  
  // Normalize probabilities to sum to 1.0
  const sum = probabilities.reduce((a, b) => a + b, 0);
  const normalizedProbabilities = probabilities.map(p => parseFloat((p / sum).toFixed(4)));
  const confidence = normalizedProbabilities[kl_grade];

  return {
    kl_grade,
    confidence,
    probabilities: normalizedProbabilities,
    is_simulated: true,
    message: 'TensorFlow backend offline/unconfigured. Simulated using clinical heuristics.'
  };
};

// Predict endpoint
app.post('/api/predict', upload.single('xray'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No X-ray image file provided.' });
    }

    const {
      user_id,
      age,
      gender,
      height,
      weight,
      bmi,
      swollen_muscles,
      heart_bypass,
      womac_score,
      symptom_years
    } = req.body;

    const imagePath = req.file.path;
    const filename = req.file.filename;

    console.log(`[PREDICT] Processing request for user ${user_id || 'anonymous'}, image: ${filename}`);

    let predictionResult = null;
    const pythonStatus = await checkPythonAvailability();
    const weightsPath = path.join(modelDir, 'bottleneck_fc_model.h5');

    if (pythonStatus.available && fs.existsSync(weightsPath)) {
      console.log(`[ML] Running Python prediction script using command: ${pythonStatus.command}`);
      const scriptPath = path.join(__dirname, 'predict.py');
      
      predictionResult = await new Promise((resolve) => {
        exec(`${pythonStatus.command} "${scriptPath}" "${imagePath}"`, (err, stdout, stderr) => {
          if (err || stderr) {
            console.error('[ML] Subprocess execution error:', err || stderr);
            resolve(null);
          } else {
            try {
              const parsed = JSON.parse(stdout.trim());
              if (parsed.error) {
                console.warn('[ML] Script returned error:', parsed.error);
                resolve(null);
              } else {
                resolve({
                  kl_grade: parsed.kl_grade,
                  confidence: parsed.confidence,
                  probabilities: parsed.probabilities,
                  is_simulated: false,
                  message: 'Successfully ran VGG16 Transfer Learning model prediction.'
                });
              }
            } catch (jsonErr) {
              console.error('[ML] JSON parsing failed:', jsonErr, stdout);
              resolve(null);
            }
          }
        });
      });
    }

    // Fallback if python is missing, packages are missing, or model weights are missing
    if (!predictionResult) {
      console.log('[ML] Falling back to simulation heuristic...');
      predictionResult = simulatePrediction(req.body);
    }

    // Save prediction in database
    let savedRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      user_id: user_id || 'guest',
      image_url: `/uploads/${filename}`,
      age: parseInt(age) || 50,
      gender: gender || 'Male',
      height: parseFloat(height) || 170.0,
      weight: parseFloat(weight) || 70.0,
      bmi: parseFloat(bmi) || 24.2,
      swollen_muscles: swollen_muscles === 'yes',
      heart_bypass: heart_bypass === 'yes',
      womac_score: parseInt(womac_score) || 50,
      symptom_years: parseInt(symptom_years) || 1,
      kl_grade: predictionResult.kl_grade,
      created_at: new Date().toISOString()
    };

    if (supabase && user_id && user_id !== 'guest') {
      const { data, error } = await supabase
        .from('predictions')
        .insert([savedRecord])
        .select();

      if (error) {
        console.error('[DATABASE] Error saving record to Supabase:', error.message);
      } else {
        console.log('[DATABASE] Record saved to Supabase successfully.');
        if (data && data[0]) {
          savedRecord = data[0];
        }
      }
    } else {
      // Save locally for guest testing
      const uId = user_id || 'guest';
      if (!localHistory[uId]) localHistory[uId] = [];
      localHistory[uId].push(savedRecord);
      console.log('[DATABASE] Record saved to local mock history.');
    }

    res.json({
      prediction: predictionResult,
      record: savedRecord
    });

  } catch (err) {
    console.error('[SERVER] Critical error in /api/predict:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// History endpoint
app.get('/api/history', async (req, res) => {
  const userId = req.headers['user-id'] || req.query.user_id || 'guest';
  console.log(`[HISTORY] Fetching records for user: ${userId}`);

  if (supabase && userId !== 'guest') {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[DATABASE] Error loading history from Supabase:', error.message);
      return res.status(500).json({ error: error.message });
    }
    
    return res.json(data);
  } else {
    // Return local mock history
    const history = localHistory[userId] || [];
    
    // If guest and history is empty, populate with simulated progression data
    if (history.length === 0 && userId === 'guest') {
      const mockHistory = [
        { year: 2019, kl: 1, progress: 'stable', age: 50, womac_score: 45, created_at: '2019-05-15T10:00:00Z' },
        { year: 2020, kl: 1, progress: 'stable', age: 51, womac_score: 52, created_at: '2020-05-15T10:00:00Z' },
        { year: 2021, kl: 1, progress: 'stable', age: 52, womac_score: 78, created_at: '2021-05-15T10:00:00Z' },
        { year: 2022, kl: 2, progress: 'increased', age: 53, womac_score: 110, created_at: '2022-05-15T10:00:00Z' },
        { year: 2023, kl: 2, progress: 'stable', age: 54, womac_score: 120, created_at: '2023-05-15T10:00:00Z' },
      ].map((item, idx) => ({
        id: `mock-${idx}`,
        user_id: 'guest',
        image_url: `/placeholder-xray.jpg`,
        age: item.age,
        gender: 'Male',
        height: 175,
        weight: 80,
        bmi: 26.1,
        swollen_muscles: idx > 2,
        heart_bypass: false,
        womac_score: item.womac_score,
        symptom_years: idx + 1,
        kl_grade: item.kl,
        created_at: item.created_at
      }));
      return res.json(mockHistory);
    }
    
    return res.json(history);
  }
});

// Static files for uploaded images
app.use('/uploads', express.static(uploadDir));

app.listen(PORT, () => {
  console.log(`[SERVER] Express running on http://localhost:${PORT}`);
});
