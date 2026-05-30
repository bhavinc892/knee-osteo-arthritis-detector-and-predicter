'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import BackgroundBlobs from '../../components/BackgroundBlobs';
import { 
  Stethoscope, 
  ClipboardList, 
  User, 
  Info, 
  Users, 
  Laptop,
  LogOut,
  X,
  Activity
} from 'lucide-react';

interface PredictionRecord {
  id: string;
  user_id: string;
  image_url: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  bmi: number;
  swollen_muscles: boolean;
  heart_bypass: boolean;
  womac_score: number;
  symptom_years: number;
  kl_grade: number;
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('User');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const name = localStorage.getItem('user_name');
    if (name) {
      setUserName(name);
    }

    const fetchHistory = async () => {
      try {
        const userId = localStorage.getItem('user_id') || 'guest';
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/history?user_id=${userId}`, {
          headers: {
            'user-id': userId
          }
        });
        if (!res.ok) throw new Error('Failed to fetch history');
        const data = await res.json();
        if (Array.isArray(data)) {
          // Sort descending to show latest first
          const sorted = data.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setHistory(sorted);
        }
      } catch (err: any) {
        console.warn('Backend history API offline, falling back to simulated history:', err);
        // Fallback simulated data if offline
        const mockFallback: PredictionRecord[] = [
          {
            id: 'fallback-1',
            user_id: 'guest',
            image_url: '',
            age: 54,
            gender: 'Male',
            height: 175,
            weight: 80,
            bmi: 26.1,
            swollen_muscles: true,
            heart_bypass: false,
            womac_score: 120,
            symptom_years: 5,
            kl_grade: 2,
            created_at: '2026-05-20T10:00:00Z'
          },
          {
            id: 'fallback-2',
            user_id: 'guest',
            image_url: '',
            age: 53,
            gender: 'Male',
            height: 175,
            weight: 80,
            bmi: 26.1,
            swollen_muscles: false,
            heart_bypass: false,
            womac_score: 110,
            symptom_years: 4,
            kl_grade: 1,
            created_at: '2025-05-15T10:00:00Z'
          }
        ];
        setHistory(mockFallback);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, []);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.clear();
    sessionStorage.clear();
    router.push('/login');
  };

  const viewRecordDetails = (record: PredictionRecord) => {
    sessionStorage.setItem('current_prediction', JSON.stringify({ record }));
    router.push('/results');
  };

  const closeModel = () => setActiveModal(null);

  return (
    <div className="relative min-h-screen flex flex-col p-6 md:p-8 justify-between">
      <BackgroundBlobs />

      {/* Header Row */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between mb-8 z-10">
        <div className="flex items-center space-x-2 text-blue-600 font-bold text-lg tracking-wider uppercase">
          <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
          <span>KOA Predictor</span>
        </div>
        <button
          onClick={handleLogout}
          className="bg-[#4ba3f4] hover:bg-blue-600 text-white text-xs font-bold py-2.5 px-5 rounded-md flex items-center space-x-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>👋 LOGOUT</span>
        </button>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-5xl mx-auto space-y-12 py-6 z-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-wide">
            What do you want to Do?
          </h1>
          <p className="text-gray-450 text-sm">Welcome back, {userName}!</p>
        </div>

        {/* Dashboard Grid (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Card 1: Start a new test */}
          <Link
            href="/details"
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl border border-gray-100/50 p-8 flex flex-col items-center justify-center text-center transform hover:scale-[1.03] transition-all duration-300 min-h-[180px] group"
          >
            <Stethoscope className="w-14 h-14 text-blue-500 mb-4 group-hover:scale-110 transition-transform duration-300" />
            <h3 className="font-semibold text-gray-800 text-sm group-hover:text-blue-500 transition-colors">
              Start a new test
            </h3>
          </Link>

          {/* Card 2: View past Analysis */}
          <Link
            href="/results"
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl border border-gray-100/50 p-8 flex flex-col items-center justify-center text-center transform hover:scale-[1.03] transition-all duration-300 min-h-[180px] group"
          >
            <ClipboardList className="w-14 h-14 text-amber-500 mb-4 group-hover:scale-110 transition-transform duration-300" />
            <h3 className="font-semibold text-gray-800 text-sm group-hover:text-amber-500 transition-colors">
              View past Analysis
            </h3>
          </Link>

          {/* Card 3: View/Edit profile */}
          <div
            onClick={() => setActiveModal('profile')}
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl border border-gray-100/50 p-8 flex flex-col items-center justify-center text-center transform hover:scale-[1.03] transition-all duration-300 min-h-[180px] cursor-pointer group"
          >
            <User className="w-14 h-14 text-green-500 mb-4 group-hover:scale-110 transition-transform duration-300" />
            <h3 className="font-semibold text-gray-800 text-sm group-hover:text-green-500 transition-colors">
              View/Edit profile
            </h3>
          </div>

          {/* Card 4: Know more about KoA */}
          <div
            onClick={() => setActiveModal('koa')}
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl border border-gray-100/50 p-8 flex flex-col items-center justify-center text-center transform hover:scale-[1.03] transition-all duration-300 min-h-[180px] cursor-pointer group"
          >
            <Info className="w-14 h-14 text-cyan-500 mb-4 group-hover:scale-110 transition-transform duration-300" />
            <h3 className="font-semibold text-gray-800 text-sm group-hover:text-cyan-500 transition-colors">
              Know more about KoA
            </h3>
          </div>

          {/* Card 5: Get to know more about us */}
          <div
            onClick={() => setActiveModal('about')}
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl border border-gray-100/50 p-8 flex flex-col items-center justify-center text-center transform hover:scale-[1.03] transition-all duration-300 min-h-[180px] cursor-pointer group"
          >
            <Users className="w-14 h-14 text-rose-500 mb-4 group-hover:scale-110 transition-transform duration-300" />
            <h3 className="font-semibold text-gray-800 text-sm group-hover:text-rose-500 transition-colors">
              Get to know more about us
            </h3>
          </div>

          {/* Card 6: Resources for this project */}
          <div
            onClick={() => setActiveModal('resources')}
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl border border-gray-100/50 p-8 flex flex-col items-center justify-center text-center transform hover:scale-[1.03] transition-all duration-300 min-h-[180px] cursor-pointer group"
          >
            <Laptop className="w-14 h-14 text-indigo-500 mb-4 group-hover:scale-110 transition-transform duration-300" />
            <h3 className="font-semibold text-gray-800 text-sm group-hover:text-indigo-500 transition-colors">
              Resources for this project
            </h3>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full max-w-4xl mx-auto border-t border-gray-200/50 my-6"></div>

        {/* Patient Portal & Diagnostic Records Section */}
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
            <div>
              <h2 className="text-xl font-bold text-gray-855 tracking-wide uppercase">
                Patient Portal & Clinical Records
              </h2>
              <p className="text-xs text-gray-400">
                View your personalized physiological summary and history of knee joint analyses.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="self-start md:self-auto bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold py-2 px-4 rounded-md flex items-center space-x-1.5 transition-colors border border-rose-100 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout Session</span>
            </button>
          </div>

          {loadingHistory ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100/50 p-12 text-center">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Retrieving patient data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Patient Profile Summary */}
              <div className="lg:col-span-1 bg-white rounded-xl shadow-lg border border-gray-100/50 p-6 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg uppercase shadow-inner">
                      {userName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm tracking-wide">{userName}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-600 border border-green-100 uppercase tracking-wider">
                        Active Account
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-105 pt-4">
                    <h4 className="text-[10px] font-extrabold text-gray-405 tracking-widest uppercase mb-3">
                      Latest Physiological Indicators
                    </h4>
                    {history.length > 0 ? (
                      (() => {
                        const latest = history[0];
                        return (
                          <div className="space-y-2.5 text-xs text-gray-600">
                            <div className="flex justify-between py-1 border-b border-gray-50">
                              <span className="text-gray-400">Gender / Age:</span>
                              <span className="font-semibold text-gray-800">{latest.gender} / {latest.age} yrs</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-50">
                              <span className="text-gray-400">Height / Weight:</span>
                              <span className="font-semibold text-gray-800">{latest.height} cm / {latest.weight} kg</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-50">
                              <span className="text-gray-400">Calculated BMI:</span>
                              <span className="font-semibold text-blue-600">{Number(latest.bmi).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-50">
                              <span className="text-gray-400">WOMAC Score:</span>
                              <span className="font-semibold text-amber-600">{latest.womac_score} / 96</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-50">
                              <span className="text-gray-400">Swollen Muscles:</span>
                              <span className={`font-semibold ${latest.swollen_muscles ? 'text-rose-500' : 'text-green-600'}`}>
                                {latest.swollen_muscles ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-gray-400">Cardiac Bypass:</span>
                              <span className={`font-semibold ${latest.heart_bypass ? 'text-rose-500' : 'text-green-600'}`}>
                                {latest.heart_bypass ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <p className="text-[11px] text-gray-400 leading-relaxed px-4">
                          No medical details recorded yet. Use <strong>Start a new test</strong> to begin.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full bg-[#ef4444] hover:bg-red-600 text-white text-xs font-semibold py-2.5 rounded-md flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 uppercase tracking-wider cursor-pointer mt-4"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of Account</span>
                </button>
              </div>

              {/* Right Column: Historical List Timeline */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100/50 p-6 flex flex-col justify-between space-y-4">
                <h3 className="text-[10px] font-extrabold text-gray-400 tracking-widest uppercase mb-2">
                  Diagnostic Scan Timeline
                </h3>
                
                {history.length > 0 ? (
                  <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin">
                    {history.map((record, index) => {
                      const scanDate = new Date(record.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      // Determine KL Grade Badge color
                      let klBadgeColor = 'bg-green-50 text-green-700 border-green-100';
                      if (record.kl_grade === 2) klBadgeColor = 'bg-yellow-50 text-yellow-700 border-yellow-100';
                      else if (record.kl_grade === 3) klBadgeColor = 'bg-orange-50 text-orange-700 border-orange-100';
                      else if (record.kl_grade === 4) klBadgeColor = 'bg-red-50 text-red-700 border-red-100';

                      return (
                        <div
                          key={record.id}
                          onClick={() => viewRecordDetails(record)}
                          className="group flex items-center justify-between p-3.5 bg-gray-50 hover:bg-blue-50/30 rounded-lg border border-gray-100 hover:border-blue-100 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md"
                        >
                          <div className="flex items-center space-x-3.5">
                            {/* Circle Index Indicator */}
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                              #{history.length - index}
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-xs text-gray-800">KL Grade {record.kl_grade}</span>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${klBadgeColor}`}>
                                  {record.kl_grade >= 3 ? 'Severe' : record.kl_grade >= 2 ? 'Mild/Mod' : 'Healthy'}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400">{scanDate}</p>
                            </div>
                          </div>

                          {/* Spark info details */}
                          <div className="flex items-center space-x-6">
                            <div className="hidden sm:flex flex-col items-end text-[10px] space-y-0.5 text-gray-500">
                              <span>BMI: <strong className="text-gray-700 font-semibold">{Number(record.bmi).toFixed(1)}</strong></span>
                              <span>WOMAC: <strong className="text-gray-700 font-semibold">{record.womac_score}</strong></span>
                            </div>
                            
                            <div className="text-gray-400 group-hover:text-blue-500 transition-colors transform group-hover:translate-x-1 duration-200">
                              <span className="text-[11px] font-bold tracking-wide flex items-center space-x-0.5">
                                <span>VIEW</span>
                                <span>→</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-200/80 my-auto">
                    <ClipboardList className="w-12 h-12 text-gray-300 mb-2.5" />
                    <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-1">No Past Diagnostic Records</h4>
                    <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed">
                      You have not uploaded any knee radiograph scans yet. Your historical diagnosis tracking will populate here automatically.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-gray-400 py-4 max-w-5xl mx-auto border-t border-gray-200/40 z-10">
        © {new Date().getFullYear()} KOA Predictor System. All rights reserved.
      </footer>

      {/* Profile Modal */}
      {activeModal === 'profile' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button onClick={closeModel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-gray-800 text-base uppercase">User Profile</h3>
            <div className="text-xs text-gray-600 space-y-2">
              <p><strong>Name:</strong> {userName}</p>
              <p><strong>Status:</strong> Authenticated Client</p>
              <p><strong>Roles:</strong> Medical Evaluator</p>
            </div>
            <button onClick={closeModel} className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-2.5 rounded-md uppercase tracking-wider">
              Close
            </button>
          </div>
        </div>
      )}

      {/* KOA Info Modal */}
      {activeModal === 'koa' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <button onClick={closeModel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-gray-800 text-base uppercase">Knee Osteoarthritis (KOA)</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              Knee Osteoarthritis (KOA) is a degenerative joint disease characterized by the breakdown of joint cartilage and underlying bone. It is the most common form of arthritis in the knee, leading to symptoms like chronic pain, stiffness, swelling, and decreased joint mobility.
            </p>
            <button onClick={closeModel} className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-2.5 rounded-md uppercase tracking-wider">
              Close
            </button>
          </div>
        </div>
      )}

      {/* About Modal */}
      {activeModal === 'about' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <button onClick={closeModel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-gray-800 text-base uppercase">About Our Project</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              This project is built to assist medical practitioners and clinical evaluators in diagnosing Knee Osteoarthritis (KOA) severity. By employing Deep Learning Transfer Learning (VGG16), we can extract fine radiological joint space parameters from X-rays and combine them with standard patient physiological indicators.
            </p>
            <button onClick={closeModel} className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-2.5 rounded-md uppercase tracking-wider">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Resources Modal */}
      {activeModal === 'resources' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <button onClick={closeModel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-gray-800 text-base uppercase">Project Resources</h3>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs text-gray-600 space-y-2">
              <p>This web application utilizes:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Next.js 14/15 App Router</strong> (TypeScript)</li>
                <li><strong>Tailwind CSS & Lucide Icons</strong></li>
                <li><strong>Express Server + Python Subprocess</strong></li>
                <li><strong>Supabase Client</strong> (PostgreSQL, Storage, Auth)</li>
              </ul>
            </div>
            <button onClick={closeModel} className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-2.5 rounded-md uppercase tracking-wider">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
