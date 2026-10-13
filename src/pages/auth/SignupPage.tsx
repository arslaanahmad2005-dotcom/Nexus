import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertCircle, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OccupationType } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const SignupPage: React.FC = () => {
  const { signUp, enterDemoMode, isSupabaseConnected } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [occupation, setOccupation] = useState<OccupationType>('Freelancer');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await signUp(email, password, fullName, occupation);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error);
    } else {
      navigate('/onboarding');
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
          <h2 className="text-2xl font-bold text-navy-900 dark:text-white font-heading">Create your NEXUS account</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Start building your Financial Trust Passport today
          </p>
        </div>

        <Card>
          {!isSupabaseConnected && (
            <div className="mb-5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <strong className="font-semibold block text-amber-900 dark:text-amber-100">Supabase Not Connected</strong>
                <span>
                  To create new permanent accounts in PostgreSQL, configure your Supabase URL & Key in <code className="bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded text-amber-900 dark:text-amber-200">.env</code>. You can also explore right away in Judge Demo Mode.
                </span>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemo('priya')}
                    className="font-semibold text-amber-900 dark:text-amber-300 underline hover:text-amber-950 dark:hover:text-amber-200"
                  >
                    Explore as Priya
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleDemo('aarav')}
                    className="font-semibold text-amber-900 dark:text-amber-300 underline hover:text-amber-950 dark:hover:text-amber-200"
                  >
                    Explore as Aarav
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
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Primary Occupation
              </label>
              <select
                value={occupation}
                onChange={(e) => setOccupation(e.target.value as OccupationType)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              >
                <option value="Freelancer">Freelancer / Independent Contractor</option>
                <option value="Student">Student / College Learner</option>
                <option value="Gig Worker">Gig Worker (Delivery, Rideshare, Services)</option>
                <option value="Small Business Owner">Small Business Owner / Shopkeeper</option>
                <option value="Salaried">Salaried (First-time Borrower)</option>
                <option value="Other">Other</option>
              </select>
            </div>

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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-2.5 mt-2"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
