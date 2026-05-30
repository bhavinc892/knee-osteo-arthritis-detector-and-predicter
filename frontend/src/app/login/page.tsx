'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import BackgroundBlobs from '../../components/BackgroundBlobs';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (supabase) {
      setLoading(true);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setLoading(false);

      if (signInError) {
        setError(signInError.message);
      } else if (data.user) {
        console.log('[AUTH] Login successful:', data.user);
        localStorage.setItem('user_id', data.user.id);
        localStorage.setItem('user_name', data.user.user_metadata?.full_name || email.split('@')[0]);
        router.push('/details');
      }
    } else {
      // Mock local login
      console.log('[AUTH] Simulating local login for:', email);
      localStorage.setItem('user_id', 'usr_guest_mock');
      localStorage.setItem('user_name', email.split('@')[0]);

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
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-md border border-red-100">
              {error}
            </div>
          )}

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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4ba3f4] hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-md tracking-wider text-xs transition-colors duration-200 uppercase focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="text-center text-xs text-gray-500 mt-4">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#3b82f6] hover:underline font-medium">
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
