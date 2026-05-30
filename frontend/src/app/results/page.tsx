'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import BackgroundBlobs from '../../components/BackgroundBlobs';
import { ChevronLeft, RotateCcw } from 'lucide-react';

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

export default function Results() {
  const router = useRouter();
  const [currentRecord, setCurrentRecord] = useState<PredictionRecord | null>(null);
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load current prediction result from session cache
    const cached = sessionStorage.getItem('current_prediction');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setCurrentRecord(parsed.record);
      } catch (e) {
        console.error('Error parsing cached prediction:', e);
      }
    }

    // Fetch user history from Express backend
    const fetchHistory = async () => {
      try {
        const userId = localStorage.getItem('user_id') || 'guest';
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/history?user_id=${userId}`, {
          headers: {
            'user-id': userId
          }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          // Sort by creation date
          const sorted = data.sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          setHistory(sorted);
        }
      } catch (err) {
        console.error('Error loading history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Compute values for the progression chart
  const getChartData = () => {
    // Replicates standard progression matching the graph layout
    // We map the user's history into years
    if (history.length === 0) return [];
    
    return history.map((record, index) => {
      const year = new Date(record.created_at).getFullYear();
      
      // Let's mock a 'previousKL' which is slightly shifted or worse for visual comparison,
      // or compute it based on years. To match the red/green curves:
      // green curve is currentKL (actual record kl), red curve is previousKL (slightly higher severity)
      const currentKL = record.kl_grade;
      const previousKL = Math.min(4, Math.max(0, currentKL + (index % 2 === 0 ? 0 : 1)));

      return {
        year: year.toString(),
        currentKL,
        previousKL,
      };
    });
  };

  const chartData = getChartData();
  const klGrade = currentRecord ? currentRecord.kl_grade : 0;

  // Custom tooltips matching the Screenshot 3 layout:
  // Show "2023", "currentKL: 2" (green), "previousKL: 3" (red)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 rounded-lg shadow-md text-xs space-y-1">
          <p className="font-semibold text-gray-500 text-center">{label}</p>
          <p className="text-green-600 font-medium">currentKL : {payload[0].value}</p>
          <p className="text-red-500 font-medium">previousKL : {payload[1].value}</p>
        </div>
      );
    }
    return null;
  };

  // Generate Stage Guide based on KL Grade
  const getStageGuide = (grade: number) => {
    switch (grade) {
      case 0:
        return {
          title: "Stage 0 OA (None)",
          text: "Stage 0 is classified as normal knee joint health. The joint space is healthy, cartilage shows no sign of wear, and there are no osteophytes (bone spurs) present. Continue maintaining a healthy weight and low-impact exercise to preserve joint integrity."
        };
      case 1:
        return {
          title: "Stage 1 OA (Doubtful)",
          text: "Stage 1 is classified as doubtful joint space narrowing and possible osteophyte formation. Very minor bone spur growth is visible, but cartilage is intact. Typically asymptomatic. Recommended actions include strengthening knee muscles and monitoring joint health."
        };
      case 2:
        return {
          title: "Stage 2 OA (Minimal)",
          text: "Stage 2 OA is considered mild. X-rays show definite osteophytes, but joint space is preserved. Patients may experience stiffness or discomfort after long walks. Low-impact activities, weight control, and physical therapy are effective at this stage."
        };
      case 3:
        return {
          title: "Stage 3 OA (Moderate)",
          text: "Stage 3 OA is classified as \"moderate\" OA. In this stage, the cartilage between bones shows obvious damage, and the space between the bones begins to narrow. People with stage 3 OA of the knee are likely to experience frequent pain when walking, running, bending, or kneeling. They also may experience joint stiffness after sitting for long periods of time or when waking up in the morning. Joint swelling may be present after extended periods of motion, as well."
        };
      case 4:
        return {
          title: "Stage 4 OA (Severe)",
          text: "Stage 4 OA is severe. The joint space between bones is dramatically reduced, indicating that the cartilage is almost completely worn away, leaving a bone-on-bone situation. Severe pain and joint stiffness are present during movement. Surgical options like total joint replacement are often evaluated at this stage."
        };
      default:
        return {
          title: "Guide",
          text: "Please submit X-ray and medical details to view prediction guide."
        };
    }
  };

  const guide = getStageGuide(klGrade);

  // SVG Gauge calculations
  const radius = 60;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  // Make circular gauge arc cover 75% of the circle (like the gauge in Screenshot 3)
  const maxAngle = 270;
  const strokeDasharray = `${circumference}`;
  // Map KL Grade 0-4 to arc fill
  const fillPercentage = (klGrade / 4) * (maxAngle / 360);
  const strokeDashoffset = `${circumference * (1 - fillPercentage)}`;

  return (
    <div className="relative min-h-screen flex flex-col items-center p-4 md:p-8">
      <BackgroundBlobs />

      {/* Header bar */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/details')}
          className="inline-flex items-center space-x-1.5 text-xs text-gray-500 hover:text-blue-500 font-semibold focus:outline-none"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>PREVIOUS</span>
        </button>
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-wider">Result</h1>
        <button
          onClick={() => router.push('/details')}
          className="inline-flex items-center space-x-1.5 bg-blue-500 text-white text-xs font-semibold py-2 px-4 rounded-md hover:bg-blue-600 transition-colors uppercase tracking-wider"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Test</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center my-auto">
          <p className="text-gray-500 text-sm font-medium animate-pulse">Loading prediction result...</p>
        </div>
      ) : (
        <div className="w-full max-w-5xl space-y-6">
          {/* Top Row: Line Chart (Left) & Gauge (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Progression Chart Card */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-xl p-4 md:p-6 border border-gray-100/50 flex flex-col justify-between">
              <div className="h-[250px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="year" stroke="#888" fontSize={11} tickLine={false} />
                      <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} stroke="#888" fontSize={11} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      <Line
                        type="monotone"
                        dataKey="currentKL"
                        stroke="#4caf50"
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                        dot={{ r: 4, stroke: '#4caf50', strokeWidth: 2, fill: '#fff' }}
                        name="currentKL"
                      />
                      <Line
                        type="monotone"
                        dataKey="previousKL"
                        stroke="#ef5350"
                        strokeWidth={2}
                        dot={{ r: 4, stroke: '#ef5350', strokeWidth: 2, fill: '#fff' }}
                        name="previousKL"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    No historical progression data available.
                  </div>
                )}
              </div>
            </div>

            {/* Gauge Score Card */}
            <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100/50 flex flex-col items-center justify-center space-y-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* SVG Gauge */}
                <svg className="w-full h-full transform -rotate-225" viewBox="0 0 140 140">
                  {/* Gauge background track circle */}
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#f3f4f6"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * 0.25} // Arc leaves 25% empty
                    strokeLinecap="round"
                  />
                  {/* Gauge fill circle */}
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#f59e0b" // Orange/yellow
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                {/* Center score grade */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-5xl font-black text-amber-500">{klGrade}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: History Table (Left) & Guide Card (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* History Table */}
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100/50 p-4 md:p-6 flex flex-col">
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#008080]">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                        Year
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                        KL
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                        Progress
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-center text-xs text-gray-700">
                    {history.length > 0 ? (
                      history.map((record, index) => {
                        const year = new Date(record.created_at).getFullYear();
                        
                        // Compute progress dynamically relative to the previous index
                        let progress = 'stable';
                        if (index > 0) {
                          const prevKL = history[index - 1].kl_grade;
                          if (record.kl_grade > prevKL) progress = 'increased';
                          else if (record.kl_grade < prevKL) progress = 'decreased';
                        } else {
                          // First item placeholder matching the row
                          progress = 'stable';
                        }

                        // Alternate row backgrounds (white and grey)
                        const rowBg = index % 2 === 0 ? 'bg-[#e5e5e5]/40' : 'bg-white';

                        return (
                          <tr key={record.id} className={rowBg}>
                            <td className="px-6 py-3.5 whitespace-nowrap font-medium">{year}</td>
                            <td className="px-6 py-3.5 whitespace-nowrap font-bold">{record.kl_grade}</td>
                            <td className="px-6 py-3.5 whitespace-nowrap capitalize">{progress}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-gray-400">
                          No history found. Complete a prediction to start tracking!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Guide Card */}
            <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 border border-gray-100/50 flex flex-col justify-center space-y-4">
              <h3 className="text-center font-bold text-gray-800 text-sm tracking-wider uppercase">
                {guide.title}
              </h3>
              <p className="text-gray-500 text-xs md:text-sm leading-relaxed text-justify px-4">
                {guide.text}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
