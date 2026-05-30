'use client';

import React from 'react';
import Link from 'next/link';
import BackgroundBlobs from '../components/BackgroundBlobs';
import { Activity, Shield, BarChart3, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between p-6">
      <BackgroundBlobs />

      {/* Top Header navbar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-4">
        <div className="flex items-center space-x-2 text-blue-600 font-bold text-lg tracking-wider uppercase">
          <Activity className="w-6 h-6 text-blue-500 animate-pulse" />
          <span>KOA Predictor</span>
        </div>
        <div>
          <Link
            href="/login"
            className="text-sm font-semibold text-gray-600 hover:text-blue-500 transition-colors py-2 px-4 rounded-md"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="bg-blue-500 text-white text-xs font-semibold py-2 px-4 rounded-md hover:bg-blue-600 transition-colors uppercase"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Main hero section */}
      <main className="w-full max-w-4xl mx-auto flex flex-col items-center text-center my-auto space-y-8 py-12">
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-medium uppercase tracking-wide">
            <span>Powered by VGG16 Transfer Learning</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 leading-tight max-w-2xl">
            Knee Osteoarthritis Detection & Prediction
          </h1>
          <p className="text-gray-500 text-sm md:text-base max-w-lg mx-auto">
            Upload your knee X-ray radiograph images, provide patient details, and get automated Kellgren-Lawrence grade detection and progression analysis.
          </p>
        </div>

        {/* Action Button */}
        <div>
          <Link
            href="/register"
            className="group inline-flex items-center space-x-2 bg-blue-500 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:bg-blue-600 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <span>Get Started</span>
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl pt-8">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-100/50 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col items-center text-center">
            <Activity className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="font-semibold text-gray-800 text-sm">Image Analysis</h3>
            <p className="text-xs text-gray-400 mt-2">
              Precise cropping tool to isolate and evaluate joint space narrowing.
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-100/50 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col items-center text-center">
            <Shield className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="font-semibold text-gray-800 text-sm">Clinical Heuristics</h3>
            <p className="text-xs text-gray-400 mt-2">
              Combines patient age, weight, symptoms, and WOMAC scores.
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-100/50 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col items-center text-center">
            <BarChart3 className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="font-semibold text-gray-800 text-sm">Progression Tracking</h3>
            <p className="text-xs text-gray-400 mt-2">
              View and plot your historical prediction timeline over 5 years.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-gray-400 py-4 max-w-6xl mx-auto border-t border-gray-200/40">
        © {new Date().getFullYear()} KOA Predictor System. All rights reserved.
      </footer>
    </div>
  );
}
