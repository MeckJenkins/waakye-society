import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError('Invalid email or password.');
        return;
      }

      const { data: isAdmin, error: authorizationError } = await supabase.rpc('is_admin');
      if (authorizationError) {
        console.error('Failed to verify admin authorization:', authorizationError);
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          console.error('Failed to clear unauthorized Auth session:', signOutError);
        }
        setError('Could not verify administrator access. Please contact support.');
        return;
      }
      if (isAdmin !== true) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          console.error('Failed to clear unauthorized Auth session:', signOutError);
        }
        setError('This account does not have administrator access.');
        return;
      }

      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-waakye-dark mb-2">
            Admin Login
          </h1>
          <p className="text-gray-600">Waakye Society Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-pepper/10 p-4 text-center text-sm text-pepper" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pepper focus:border-transparent"
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-2 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pepper focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-pepper hover:bg-pepper-light disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-md transition-colors"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-500 transition-colors hover:text-pepper">
            ← Back to Website
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;