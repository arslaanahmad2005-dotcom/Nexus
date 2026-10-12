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
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const LandingPage: React.FC = () => {
  const { enterDemoMode, user, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const handleExploreDemo = (persona: 'priya' | 'aarav' = 'priya') => {
    enterDemoMode(persona);
    navigate('/dashboard');
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <Badge variant="brand" size="md" className="mx-auto">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              AI-Powered Financial Identity for New India
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-navy-900 tracking-tight leading-[1.15] font-heading">
              Your financial story <br className="hidden sm:inline" />
              <span className="text-brand-700">deserves to be seen.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Millions of students, freelancers, gig workers, and first-time borrowers manage money responsibly every single month — but traditional credit scores ignore them.
              <br className="hidden sm:inline" />
              <strong className="text-slate-800 font-medium"> NEXUS turns your daily financial discipline into an easy-to-understand Financial Trust Passport.</strong>
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {user || isDemoMode ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-navy-900 text-white font-semibold text-sm shadow-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-navy-900 text-white font-semibold text-sm shadow-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Build My Financial Passport</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleExploreDemo('priya')}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-brand-50 text-brand-800 hover:bg-brand-100 font-semibold text-sm border border-brand-200 shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4 text-brand-600" />
                    <span>Explore Demo (Instant Access)</span>
                  </button>
                </>
              )}
            </div>

            {/* Micro-trust indicators */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Zero bank passwords needed
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                No Aadhaar or OTP collection
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                You control who sees what
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Persona Demo Switcher Box */}
      <section className="py-8 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-lg bg-brand-50 text-brand-700">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-navy-900">Judges & Reviewers: Test with Pre-Loaded Profiles</h4>
                <p className="text-xs text-slate-500">
                  Experience full end-to-end features in under 3 minutes without typing demo transactions manually.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleExploreDemo('priya')}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Priya (Freelancer, ₹62k/mo)</span>
              </button>
              <button
                type="button"
                onClick={() => handleExploreDemo('aarav')}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Aarav (Student, ₹20k/mo)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* The 3-Step Simple Process */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 font-heading">
              Three simple steps to prove financial reliability
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              No confusing banking formulas. Plain English, clear numbers, and total user privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <Card className="relative hover:shadow-card transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-sm mb-4">
                01
              </div>
              <h3 className="text-base font-semibold text-navy-900 mb-2">
                Add your financial information
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Record your earnings (freelance, stipend, gig work), everyday living expenses, and on-time bill or rent payments.
              </p>
              <div className="text-xs text-brand-800 bg-brand-50/80 p-2.5 rounded-lg border border-brand-100 font-medium">
                Simple terms: “Money coming in” & “Money going out”.
              </div>
            </Card>

            {/* Step 2 */}
            <Card className="relative hover:shadow-card transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-sm mb-4">
                02
              </div>
              <h3 className="text-base font-semibold text-navy-900 mb-2">
                Understand your money habits
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Our Gemini AI engine explains what your records prove: how consistently money arrives, what cushion you keep, and practical tips.
              </p>
              <div className="text-xs text-brand-800 bg-brand-50/80 p-2.5 rounded-lg border border-brand-100 font-medium">
                No opaque 3-digit score. Transparent, human explanations.
              </div>
            </Card>

            {/* Step 3 */}
            <Card className="relative hover:shadow-card transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-sm mb-4">
                03
              </div>
              <h3 className="text-base font-semibold text-navy-900 mb-2">
                Create & securely share your Passport
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Generate a verifiable digital Financial Trust Passport. Share it with landlords, lenders, or employers using an expiring, revocable link.
              </p>
              <div className="text-xs text-brand-800 bg-brand-50/80 p-2.5 rounded-lg border border-brand-100 font-medium">
                Full consent control: Revoke access anytime with one click.
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Simple Language Comparison Section */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="neutral" size="sm" className="mb-2">
              Accessibility First
            </Badge>
            <h2 className="text-2xl font-bold text-navy-900 font-heading">
              Finance without the confusing jargon
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              We translate standard banking terminology into simple English so anyone can make smart financial decisions.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
            <div className="grid grid-cols-2 bg-slate-100/80 border-b border-slate-200 p-3 sm:p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <div>Traditional Banking Jargon</div>
              <div>Plain English in NEXUS</div>
            </div>

            <div className="divide-y divide-slate-200 text-sm">
              <div className="grid grid-cols-2 p-3.5 sm:p-4 items-center">
                <div className="text-slate-500 font-mono text-xs">“Cash-flow assessment”</div>
                <div className="text-navy-900 font-medium">“Money coming in and going out”</div>
              </div>
              <div className="grid grid-cols-2 p-3.5 sm:p-4 items-center bg-white">
                <div className="text-slate-500 font-mono text-xs">“Debt service coverage ratio”</div>
                <div className="text-navy-900 font-medium">“How comfortably you may repay”</div>
              </div>
              <div className="grid grid-cols-2 p-3.5 sm:p-4 items-center">
                <div className="text-slate-500 font-mono text-xs">“Alternative creditworthiness”</div>
                <div className="text-navy-900 font-medium">“A clearer picture of how you manage money”</div>
              </div>
              <div className="grid grid-cols-2 p-3.5 sm:p-4 items-center bg-white">
                <div className="text-slate-500 font-mono text-xs">“Credit risk classification”</div>
                <div className="text-navy-900 font-medium">“Things that may need attention”</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy and Security Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-navy-900 text-white rounded-2xl p-8 sm:p-12 shadow-elevated">
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
                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/60">
                  <div className="font-semibold text-white text-sm mb-1">Cryptographic Links</div>
                  <p className="text-xs text-slate-400">Tokens are hashed on the server using SHA-256 to prevent link guessing.</p>
                </div>
                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/60">
                  <div className="font-semibold text-white text-sm mb-1">Row Level Security</div>
                  <p className="text-xs text-slate-400">Database policies ensure only you can access or modify your records.</p>
                </div>
                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/60">
                  <div className="font-semibold text-white text-sm mb-1">Instant Revocation</div>
                  <p className="text-xs text-slate-400">Click Revoke at any time to immediately lock public access to shared passports.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
