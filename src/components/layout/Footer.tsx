import React from 'react';
import { ShieldCheck, Lock, Heart, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="no-print bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
                <ShieldCheck className="w-5 h-5 text-brand-400" />
              </div>
              <span className="text-xl font-bold font-heading tracking-tight">NEXUS</span>
            </div>
            <p className="text-slate-300 max-w-md text-sm leading-relaxed">
              AI-Powered Financial Identity & Trust Network. Empowering students, freelancers, gig workers, and first-time borrowers to showcase responsible money habits without traditional credit history.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700/60 text-slate-300">
                <Lock className="w-3.5 h-3.5 text-brand-400" />
                Consent-Based Sharing
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700/60 text-slate-300">
                <Award className="w-3.5 h-3.5 text-brand-400" />
                Presentation Prototype
              </span>
            </div>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Money Dashboard
                </Link>
              </li>
              <li>
                <Link to="/my-money" className="hover:text-white transition-colors">
                  My Money (Records)
                </Link>
              </li>
              <li>
                <Link to="/insights" className="hover:text-white transition-colors">
                  Understand My Money (AI)
                </Link>
              </li>
              <li>
                <Link to="/passport" className="hover:text-white transition-colors">
                  Financial Trust Passport
                </Link>
              </li>
              <li>
                <Link to="/documents" className="hover:text-white transition-colors">
                  Supporting Documents
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy & Trust */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Trust & Consent
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="text-slate-400">Deterministic Calculations</li>
              <li className="text-slate-400">Zero Bank Passwords Needed</li>
              <li className="text-slate-400">Owner-Controlled Revocation</li>
              <li className="text-slate-400">Privacy by Design</li>
            </ul>
          </div>
        </div>

        {/* Regulatory & Platform Disclaimer */}
        <div className="pt-6 border-t border-slate-800/80 text-xs text-slate-400 space-y-2">
          <p className="leading-relaxed">
            <strong className="text-slate-300">Regulatory & Purpose Disclaimer:</strong> NEXUS is an alternative financial clarity and demonstration platform built for hackathon evaluation. NEXUS does not claim to be an officially recognized credit rating agency or credit information bureau, perform statutory KYC without an accredited partner, guarantee loan approval, or represent demo analysis as an official statutory credit score.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-3 gap-2 text-slate-400">
            <div>© {new Date().getFullYear()} NEXUS Financial Identity & Trust Network. All rights reserved.</div>
            <div className="flex items-center gap-1 text-[11px]">
              Built with care for financial inclusion <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline ml-0.5" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
