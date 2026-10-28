import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Lock,
  FileCheck2,
  Users,
  Briefcase,
  GraduationCap,
  Sparkles,
  HelpCircle,
  Eye,
  FileSpreadsheet,
  Store
} from 'lucide-react';
import { useAuth, DemoPersonaKey } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const LandingPage: React.FC = () => {
  const { enterDemoMode, user, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const handleExploreDemo = (persona: DemoPersonaKey = 'freelancer') => {
    enterDemoMode(persona);
    navigate('/dashboard');
  };

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#0B0F17] min-h-screen text-slate-900 dark:text-slate-100 transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B0F17]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <Badge variant="brand" size="md" className="mx-auto">
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              AI-Powered Financial Identity for New India
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15] font-heading">
              Your financial story <br className="hidden sm:inline" />
              <span className="text-brand-600 dark:text-brand-400">deserves to be seen.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Millions of students, freelancers, gig workers, and first-time borrowers manage money responsibly every single month — but traditional credit scores ignore them.
              <br className="hidden sm:inline" />
              <strong className="text-slate-900 dark:text-slate-100 font-medium"> NEXUS turns your daily financial discipline into an easy-to-understand Financial Trust Passport.</strong>
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {user || isDemoMode ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>Build My Financial Passport</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleExploreDemo('priya')}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-brand-50 dark:bg-brand-950/70 text-brand-800 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/60 font-semibold text-sm border border-brand-200 dark:border-brand-800/70 shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span>Explore Demo (Instant Access)</span>
                  </button>
                </>
              )}
            </div>

            {/* Micro-trust indicators */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Zero bank passwords needed
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                No Aadhaar or OTP collection
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                You control who sees what
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Persona Demo Switcher Box */}
      <section className="py-8 bg-slate-50 dark:bg-[#0B0F17] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Judges & Reviewers: Test with Pre-Loaded Profiles</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Experience full end-to-end features in under 3 minutes without typing demo transactions manually.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleExploreDemo('aarav')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                <span>Profile A: Student (₹20k/mo)</span>
              </button>
              <button
                type="button"
                onClick={() => handleExploreDemo('priya')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Briefcase className="w-3.5 h-3.5 text-brand-300" />
                <span>Profile B: Freelancer (₹62k/mo)</span>
              </button>
              <button
                type="button"
                onClick={() => handleExploreDemo('business')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Store className="w-3.5 h-3.5 text-emerald-500" />
                <span>Profile C: Small Business (₹1.4L/mo)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* The 3-Step Simple Process */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-heading">
              Three simple steps to prove financial reliability
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              No confusing banking formulas. Plain English, clear numbers, and total user privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <Card className="relative hover:shadow-card transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300 font-bold flex items-center justify-center text-sm mb-4">
                01
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                Add your financial information
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Record your earnings (freelance, stipend, gig work), everyday living expenses, and on-time bill or rent payments.
              </p>
              <div className="text-xs text-brand-800 dark:text-brand-300 bg-brand-50/80 dark:bg-brand-950/60 p-2.5 rounded-lg border border-brand-200 dark:border-brand-800/60 font-medium">
                Simple terms: “Money coming in” & “Money going out”.
              </div>
            </Card>

            {/* Step 2 */}
            <Card className="relative hover:shadow-card transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300 font-bold flex items-center justify-center text-sm mb-4">
                02
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                Understand your money habits
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Our Gemini AI engine explains what your records prove: how consistently money arrives, what cushion you keep, and practical tips.
              </p>
              <div className="text-xs text-brand-800 dark:text-brand-300 bg-brand-50/80 dark:bg-brand-950/60 p-2.5 rounded-lg border border-brand-100 dark:border-brand-800/60 font-medium">
                No opaque 3-digit score. Transparent, human explanations.
              </div>
            </Card>

            {/* Step 3 */}
            <Card className="relative hover:shadow-card transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300 font-bold flex items-center justify-center text-sm mb-4">
                03
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                Create & securely share your Passport
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Generate a verifiable digital Financial Trust Passport. Share it with landlords, lenders, or employers using an expiring, revocable link.
              </p>
              <div className="text-xs text-brand-800 dark:text-brand-300 bg-brand-50/80 dark:bg-brand-950/60 p-2.5 rounded-lg border border-brand-100 dark:border-brand-800/60 font-medium">
                Full consent control: Revoke access anytime with one click.
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Simple Language Comparison Section */}
      <section className="py-16 bg-white dark:bg-[#0B0F17] border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="neutral" size="sm" className="mb-2">
              Accessibility First
            </Badge>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-heading">
              Finance without the confusing jargon
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              We translate standard banking terminology into simple English so anyone can make smart financial decisions.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-subtle">
            <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <div>Traditional Banking Jargon</div>
              <div>Plain English in NEXUS</div>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <div className="grid grid-cols-2 p-3.5 sm:p-4 items-center">
                <div className="text-slate-500 dark:text-slate-400 font-mono text-xs">“Cash-flow assessment”</div>
                <div className="text-slate-900 dark:text-white font-medium">“Money coming in and going out”</div>
              </div>
              <div className="grid grid-cols-2 p-3.5 sm:p-4 items-center bg-white dark:bg-[#0E1524]">
                <div className="text-slate-500 dark:text-slate-400 font-mono text-xs">“Debt service coverage ratio”</div>
                <div className="text-slate-900 dark:text-white font-medium">“How comfortably you may repay”</div>
              </div>
              <div className="grid grid-cols-2 p-3.5 sm:p-4 items-center">
                <div className="text-slate-500 dark:text-slate-400 font-mono text-xs">“Alternative creditworthiness”</div>
                <div className="text-slate-900 dark:text-white font-medium">“A clearer picture of how you manage money”</div>
              </div>
              <div className="grid grid-cols-2 p-3.5 sm:p-4 items-center bg-white dark:bg-[#0E1524]">
                <div className="text-slate-500 dark:text-slate-400 font-mono text-xs">“Credit risk classification”</div>
                <div className="text-slate-900 dark:text-white font-medium">“Things that may need attention”</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy and Security Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 via-navy-950 to-slate-900 text-white rounded-2xl p-8 sm:p-12 shadow-elevated border border-slate-800">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-brand-300 text-xs font-semibold border border-slate-700">
                <Lock className="w-3.5 h-3.5" />
                Security & Privacy Architecture
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-white">
                You own your records. You control who sees them.
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                NEXUS never sells personal data or requests bank login passwords. Every Financial Trust Passport link is secured by cryptographic hashes, features an automatic expiration period, and can be revoked by you at any second.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                  <div className="font-semibold text-white text-sm mb-1">Cryptographic Links</div>
                  <p className="text-xs text-slate-300">Tokens are hashed on the server using SHA-256 to prevent link guessing.</p>
                </div>
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                  <div className="font-semibold text-white text-sm mb-1">Row Level Security</div>
                  <p className="text-xs text-slate-300">Database policies ensure only you can access or modify your records.</p>
                </div>
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                  <div className="font-semibold text-white text-sm mb-1">Instant Revocation</div>
                  <p className="text-xs text-slate-300">Click Revoke at any time to immediately lock public access to shared passports.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
