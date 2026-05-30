'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import BackgroundBlobs from '../../components/BackgroundBlobs';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Sign up via Supabase Auth or mock registration fallback
    if (supabase) {
      setLoading(true);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      setLoading(false);

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.user) {
        console.log('[AUTH] Registration successful:', data.user);
        localStorage.setItem('user_id', data.user.id);
        localStorage.setItem('user_name', name);
        router.push('/details');
      }
    } else {
      // Mock local registration
      console.log('[AUTH] Simulating local registration for:', name);
      const mockUserId = 'usr_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('user_id', mockUserId);
      localStorage.setItem('user_name', name);
      
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        router.push('/details');
      }, 500);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <BackgroundBlobs />
      
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-8 border border-gray-100/50">
        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-md border border-red-100">
              {error}
            </div>
          )}

          <div>
            <input
              type="text"
              placeholder="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#f2f2f2] text-gray-700 placeholder-gray-400 border-0 rounded-md py-3 px-4 focus:bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none text-sm transition-all"
            />
          </div>

          <div>
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#f2f2f2] text-gray-700 placeholder-gray-400 border-0 rounded-md py-3 px-4 focus:bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none text-sm transition-all"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#f2f2f2] text-gray-700 placeholder-gray-400 border-0 rounded-md py-3 px-4 focus:bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none text-sm transition-all"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#f2f2f2] text-gray-700 placeholder-gray-400 border-0 rounded-md py-3 px-4 focus:bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none text-sm transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4ba3f4] hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-md tracking-wider text-xs transition-colors duration-200 uppercase focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>

          <div className="text-center text-xs text-gray-500 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-[#3b82f6] hover:underline font-medium">
              Login here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
