import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { supabase } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export const getHealthStatus = async (req, res) => {
  const pythonStatus = await checkPythonAvailability();
  
  // Resolve weights path
  const weightsPath = path.join(__dirname, '..', 'model', 'bottleneck_fc_model.h5');
  const weightsLoaded = fs.existsSync(weightsPath);
  
  res.json({
    status: "UP",
    uptime: `${Math.round(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform
    },
    database: {
      mode: supabase ? "Supabase Live" : "Offline/Mock local storage",
      connected: supabase !== null
    },
    machineLearning: {
      pythonInstalled: pythonStatus.available,
      pythonCommand: pythonStatus.command,
      weightsFileFound: weightsLoaded,
      status: (pythonStatus.available && weightsLoaded) ? "READY" : "SIMULATED_FALLBACK"
    }
  });
};
