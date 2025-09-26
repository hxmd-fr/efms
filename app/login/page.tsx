"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed.');
      }
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-100 to-white p-4">
      <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-2xl border border-gray-100 text-center">
        <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="EFMS Logo" width={80} height={80} className="w-20 h-auto"/>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
        <p className="text-gray-500 mb-8">Sign in to your Enterprise Finance Management System</p>
        
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
              placeholder="name@efms.com"
              // THIS IS THE FIX: Tell React to ignore browser extension modifications
              suppressHydrationWarning={true}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
              placeholder="••••••••"
              // THIS IS THE FIX: Tell React to ignore browser extension modifications
              suppressHydrationWarning={true}
            />
          </div>
          {error && <p className="text-sm text-center text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 p-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors text-lg"
            // THIS IS THE FIX: Also apply to the button if extensions modify it
            suppressHydrationWarning={true}
          >
            {loading ? <Loader2 className="animate-spin" /> : <LogIn className="w-5 h-5" />}
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-8">Need help? Contact your system administrator</p>
      </div>
    </main>
  );
}

