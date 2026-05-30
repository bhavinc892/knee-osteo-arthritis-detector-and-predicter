'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { supabase } from '../../lib/supabase';
import BackgroundBlobs from '../../components/BackgroundBlobs';
import { ChevronLeft, Info, UploadCloud } from 'lucide-react';

export default function DetailsWizard() {
  const router = useRouter();
  
  // Wizard Step (1: Upload & Crop, 2: Personal, 3: Medical)
  const [step, setStep] = useState(1);
  
  // Step 1: Upload & Crop States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Step 2: Personal Details
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState('');

  // Step 3: Medical Details
  const [swollenMuscles, setSwollenMuscles] = useState('no');
  const [heartBypass, setHeartBypass] = useState('no');
  const [womacScore, setWomacScore] = useState('');
  const [symptomYears, setSymptomYears] = useState('');
  
  // UI states
  const [showWomacModal, setShowWomacModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('guest');

  // Load user session
  useEffect(() => {
    const savedUserId = localStorage.getItem('user_id');
    if (savedUserId) {
      setUserId(savedUserId);
    }
  }, []);

  // Recalculate BMI whenever height or weight changes
  useEffect(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      const hM = h / 100;
      const computedBmi = w / (hM * hM);
      setBmi(computedBmi.toString());
    } else {
      setBmi('');
    }
  }, [height, weight]);

  // Set default crop aspect or center it when image is loaded
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    imgRef.current = e.currentTarget;
    
    // Create a default square crop centered in the image
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
        },
        1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(file);
    }
  };

  // Helper to generate cropped image from canvas
  const getCroppedImgBlob = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const image = imgRef.current;
      const cropArea = completedCrop;

      if (!image || !cropArea) {
        reject(new Error('Image or crop area not loaded.'));
        return;
      }

      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      canvas.width = cropArea.width * scaleX;
      canvas.height = cropArea.height * scaleY;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to create canvas 2D context.'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        image,
        cropArea.x * scaleX,
        cropArea.y * scaleY,
        cropArea.width * scaleX,
        cropArea.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty.'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  // Submit wizard results
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let xrayBlob: Blob;
      
      if (selectedFile) {
        // Use cropped version
        xrayBlob = await getCroppedImgBlob();
      } else {
        throw new Error('Please select an X-ray image to upload in Step 1.');
      }

      // Build form data
      const formData = new FormData();
      formData.append('xray', xrayBlob, 'xray-cropped.jpg');
      formData.append('user_id', userId);
      formData.append('age', age);
      formData.append('gender', gender);
      formData.append('height', height);
      formData.append('weight', weight);
      formData.append('bmi', bmi);
      formData.append('swollen_muscles', swollenMuscles);
      formData.append('heart_bypass', heartBypass);
      formData.append('womac_score', womacScore);
      formData.append('symptom_years', symptomYears);

      // Post to Express backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/predict`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setLoading(false);

      if (data.error) {
        setError(data.error);
      } else {
        console.log('[WIZARD] Prediction results saved:', data);
        // Cache result in sessionStorage and redirect to results dashboard
        sessionStorage.setItem('current_prediction', JSON.stringify(data));
        router.push('/results');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Submission failed. Make sure the backend server is running.');
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 md:p-6">
      <BackgroundBlobs />

      {/* Step Circle Indicator (1, 2, 3) */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 shadow-md transition-colors ${
            step >= 1 ? 'bg-[#4ca050] border-[#4ca050] text-white' : 'bg-gray-800 border-gray-800 text-white'
          }`}
        >
          1
        </div>
        <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-[#4ca050]' : 'bg-gray-300'}`} />
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 shadow-md transition-colors ${
            step >= 2 ? 'bg-[#4ca050] border-[#4ca050] text-white' : 'bg-gray-800 border-gray-800 text-white'
          }`}
        >
          2
        </div>
        <div className={`w-8 h-0.5 ${step >= 3 ? 'bg-[#4ca050]' : 'bg-gray-300'}`} />
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 shadow-md transition-colors ${
            step >= 3 ? 'bg-[#4ca050] border-[#4ca050] text-white' : 'bg-gray-800 border-gray-800 text-white'
          }`}
        >
          3
        </div>
      </div>

      {/* Main Wizard Form Card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 md:p-8 border border-gray-100/50 flex flex-col justify-between">
        
        {/* STEP 1: UPLOAD & CROP */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-800 tracking-wide uppercase">Add radiograph Images</h2>
            </div>

            {!imgSrc ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg py-12 px-4 bg-[#f8f9fa] hover:bg-gray-50 cursor-pointer transition-colors duration-200 group">
                <UploadCloud className="w-12 h-12 text-gray-400 group-hover:text-blue-400 transition-colors duration-200" />
                <span className="mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Choose File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Selected: {selectedFile?.name}</span>
                  <button
                    onClick={() => { setImgSrc(''); setSelectedFile(null); }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div className="text-center text-xs text-gray-400 font-medium">
                  Try to get center part of the X-ray
                </div>

                {/* React Image Crop Widget */}
                <div className="max-h-[300px] overflow-auto flex justify-center bg-gray-50 rounded-lg p-2 border border-gray-100">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                    className="max-w-full"
                  >
                    <img
                      src={imgSrc}
                      alt="Knee X-ray radiograph"
                      onLoad={onImageLoad}
                      className="max-h-[280px] object-contain"
                    />
                  </ReactCrop>
                </div>
              </div>
            )}

            <button
              onClick={() => { if (imgSrc) setStep(2); else setError('Please upload an image first.'); }}
              disabled={!imgSrc}
              className="w-full bg-[#7c7c7c] hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-md tracking-wider text-xs uppercase transition-colors duration-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* STEP 2: PERSONAL DETAILS */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-800 tracking-wide uppercase">Personal Details</h2>
              <p className="text-xs text-gray-400 mt-1">This information will only be used for prediction</p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="number"
                  placeholder="Age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-[#f2f2f2] text-gray-700 placeholder-gray-400 border-0 rounded-md py-3 px-4 focus:bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none text-sm transition-all"
                />
              </div>

              <div>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-[#f2f2f2] text-gray-700 border-0 rounded-md py-3.5 px-4 focus:bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none text-sm transition-all appearance-none cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <input
                  type="number"
                  placeholder="Height (cm)"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-[#f2f2f2] text-gray-700 placeholder-gray-400 border-0 rounded-md py-3 px-4 focus:bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none text-sm transition-all"
                />
              </div>

              <div>
                <input
                  type="number"
                  placeholder="Weight (kg)"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-[#f2f2f2] text-gray-700 placeholder-gray-400 border-0 rounded-md py-3 px-4 focus:bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none text-sm transition-all"
                />
              </div>

              {bmi && (
                <div className="w-full bg-[#f2f2f2] text-gray-500 rounded-md py-3.5 px-4 text-sm font-medium">
                  BMI: {bmi}
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={() => setStep(1)}
                className="w-full bg-[#4ca050] hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-md tracking-wider text-xs uppercase transition-colors duration-200"
              >
                Previous
              </button>
              <button
                onClick={() => { if (age && height && weight) setStep(3); else setError('Please fill in age, height, and weight.'); }}
                className="w-full bg-[#7c7c7c] hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-md tracking-wider text-xs uppercase transition-colors duration-200"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: MEDICAL DETAILS */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-800 tracking-wide uppercase">Medical Details</h2>
              <p className="text-xs text-gray-400 mt-1">This information is securely handled</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-md border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <select
                  value={swollenMuscles}
                  onChange={(e) => setSwollenMuscles(e.target.value)}
                  className="w-full bg-[#f2f2f2] text-gray-700 border-0 rounded-md py-3.5 px-4 focus:bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none text-sm transition-all cursor-pointer"
                >
                  <option value="no">No swollen muscles</option>
                  <option value="yes">Yes, swollen muscles</option>
                </select>
              </div>

              <div>
                <select
                  value={heartBypass}
                  onChange={(e) => setHeartBypass(e.target.value)}
                  className="w-full bg-[#f2f2f2] text-gray-700 border-0 rounded-md py-3.5 px-4 focus:bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none text-sm transition-all cursor-pointer"
                >
                  <option value="no">No heart bypass surgery</option>
                  <option value="yes">Yes, heart bypass surgery</option>
                </select>
              </div>

              <div>
                <input
                  type="number"
                  placeholder="WOMAC Score"
                  value={womacScore}
                  onChange={(e) => setWomacScore(e.target.value)}
                  className="w-full bg-[#f2f2f2] text-gray-700 placeholder-gray-400 border-0 rounded-md py-3.5 px-4 focus:bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none text-sm transition-all"
                />
              </div>

              {/* What's WOMAC? Know More */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowWomacModal(true)}
                  className="inline-flex items-center space-x-1 text-xs text-[#3b82f6] hover:underline font-medium focus:outline-none"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>What's WOMAC? Know more</span>
                </button>
              </div>

              <div>
                <input
                  type="number"
                  placeholder="Symptom severity / duration (Years)"
                  value={symptomYears}
                  onChange={(e) => setSymptomYears(e.target.value)}
                  className="w-full bg-[#f2f2f2] text-gray-700 placeholder-gray-400 border-0 rounded-md py-3.5 px-4 focus:bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-[#4ca050] hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-md tracking-wider text-xs uppercase transition-colors duration-200"
              >
                Previous
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !womacScore || !symptomYears}
                className="w-full bg-[#7c7c7c] hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-md tracking-wider text-xs uppercase transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* WOMAC Information Modal Popup */}
      {showWomacModal && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-800 text-base uppercase tracking-wide">WOMAC Index Guide</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              The Western Ontario and McMaster Universities Osteoarthritis Index (WOMAC) is a widely used clinical questionnaire used to evaluate the condition of patients with osteoarthritis of the knee and hip.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs text-gray-600 space-y-2">
              <p>It measures three primary dimensions on a score of 0-96:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Pain (0 - 20) during walking, stairs, sleeping, sitting, standing.</li>
                <li>Stiffness (0 - 8) in the morning and later in the day.</li>
                <li>Physical Function (0 - 68) in daily activities (e.g. rising, stairs, shopping).</li>
              </ul>
              <p className="font-medium mt-2">A higher score indicates greater pain, stiffness, and functional limitation.</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowWomacModal(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-2 px-5 rounded-md uppercase tracking-wider transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
