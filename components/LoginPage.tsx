// src/components/LoginPage.tsx
import React, { useState, FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import { HomeIcon } from '../constants'; // your logo/icon

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      setMessage('Login successful! Redirecting…');
      // onAuthStateChange in App.tsx will handle the redirect
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
    // Supabase will redirect the user to Google and back automatically
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-light-gray p-4">
      <div className="bg-surface p-8 md:p-12 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <HomeIcon className="w-16 h-16 text-primary mb-3" />
          <h1 className="text-3xl font-bold text-primary">Coffee Export Manager</h1>
          <p className="text-gray-600 mt-1">Sign in to access your dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error bg-opacity-10 text-error border border-error rounded-md text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 bg-success bg-opacity-10 text-success border border-success rounded-md text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="••••••••"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 0C4.477 0 0 4.477 0 10c0 4.419 2.865 8.166 6.839 9.49.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.602-3.369-1.34-3.369-1.34-.455-1.156-1.11-1.465-1.11-1.465-.909-.62.069-.608.069-.608 1.004.074 1.532 1.03 1.532 1.03.891 1.526 2.335 1.085 2.904.83.092-.645.348-1.085.635-1.334-2.22-.251-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.032-2.682-.104-.252-.448-1.27.098-2.642 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0110 4.817c.852 0 1.707.114 2.504.337 1.909-1.295 2.748-1.026 2.748-1.026.548 1.372.204 2.39.1 2.642.64.698 1.03 1.591 1.03 2.682 0 3.842-2.337 4.687-4.565 4.935.358.307.678.917.678 1.85 0 1.334-.012 2.41-.012 2.736 0 .269.18.579.688.48A10.001 10.001 0 0020 10c0-5.523-4.477-10-10-10z"
                  clipRule="evenodd"
                />
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          For demo purposes, you can try with:
          <br />
          Email:{' '}
          <code className="bg-gray-200 px-1 rounded">user@example.com</code> <br />
          Password:{' '}
          <code className="bg-gray-200 px-1 rounded">password</code>
          <br /> (Note: Replace with your actual Supabase user credentials)
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
