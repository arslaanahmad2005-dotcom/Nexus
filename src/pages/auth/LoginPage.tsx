import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Eye, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const LoginPage: React.FC = () => {
  const { signIn, enterDemoMode, isSupabaseConnected } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error);
    } else {
      navigate('/dashboard');
    }
  };

  const handleDemo = (persona: 'priya' | 'aarav') => {
    enterDemoMode(persona);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-xl bg-navy-900 dark:bg-brand-950 text-brand-400 mb-2 shadow-sm border border-transparent dark:border-brand-800/40">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-navy-900 dark:text-white font-heading">Sign in to NEXUS</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Access your Financial Trust Passport and money records</p>
        </div>

        <Card>
          {!isSupabaseConnected && (
            <div className="mb-5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <strong className="font-semibold block text-amber-900 dark:text-amber-100">Supabase Not Connected</strong>
                <span>
                  Supabase keys are not set in <code className="bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded text-amber-900 dark:text-amber-200">.env</code>. You can test all features immediately using Judge Demo Mode.
                </span>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemo('priya')}
                    className="font-semibold text-amber-900 dark:text-amber-300 underline hover:text-amber-950 dark:hover:text-amber-200"
                  >
                    Open Priya Demo (Freelancer)
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleDemo('aarav')}
                    className="font-semibold text-amber-900 dark:text-amber-300 underline hover:text-amber-950 dark:hover:text-amber-200"
                  >
                    Open Aarav Demo (Student)
                  </button>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-xs text-slate-400 dark:text-slate-500">At least 6 characters</span>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-2.5 mt-2"
            >
              Sign In
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-medium">Or explore instantly</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleDemo('priya')}
            className="w-full py-2 px-4 rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-900 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Judge Demo Mode (Instant Freelancer Profile)</span>
          </button>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/signup" className="font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300">
              Create an account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
