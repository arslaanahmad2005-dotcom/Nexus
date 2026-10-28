import React, { useState } from 'react';
import { ShieldCheck, Info, Sparkles, ChevronDown, ChevronUp, Cpu, Lock, CheckCircle2 } from 'lucide-react';

interface AITransparencyBannerProps {
  className?: string;
  compact?: boolean;
}

export const AITransparencyBanner: React.FC<AITransparencyBannerProps> = ({
  className = '',
  compact = false
}) => {
  const [expanded, setExpanded] = useState(!compact);

  return (
    <div
      className={`rounded-2xl border border-brand-200 dark:border-brand-900/60 bg-gradient-to-br from-brand-50/70 via-white to-slate-50 dark:from-brand-950/40 dark:via-[#0F172A] dark:to-[#0B0F17] p-5 shadow-sm transition-all ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-brand-600 text-white shadow-sm flex-shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-900 dark:bg-brand-900/60 dark:text-brand-300 border border-brand-300 dark:border-brand-700/60 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                Google Gemma 4 Open-Weight AI
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Hosted via Gemini API
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                Deterministic Calculation Guard
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
              AI Transparency & Responsible Architecture
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl mt-0.5">
              NEXUS combines reproducible mathematical ledger calculations with Google Gemma 4 open-weight model intelligence for clear, personalized financial guidance.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-semibold text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-200 flex items-center gap-1 p-1"
          aria-expanded={expanded}
        >
          <span>{expanded ? 'Less Details' : 'View Architecture'}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-brand-200/70 dark:border-slate-800/80 space-y-4 text-xs">
          {/* Architecture Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                1. Deterministic Engine
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                All numbers (totals, savings rate, DTI ratio, and Trust Score) are calculated mathematically by audited code. The AI model is strictly prohibited from inventing or modifying numbers.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                2. Gemma 4 Open-Weight AI
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Google Gemma 4 (<code>gemma-4-26b-a4b-it</code>) interprets the calculated metrics to provide personalized explanations, plain-language translations, and actionable 30-day improvement plans.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                3. Privacy & Minimization
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Only aggregated totals and occupation categories are processed. Names, phone numbers, emails, passwords, and banking login tokens are never shared with the AI.
              </p>
            </div>
          </div>

          {/* Regulatory & Advisory Disclaimer Notice */}
          <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Educational Notice:</strong> NEXUS provides educational financial insights. Its AI-generated recommendations are not professional financial advice, official statutory credit scores, or loan approval decisions.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
