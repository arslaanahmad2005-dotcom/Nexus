import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Cpu,
  Info,
  ShieldCheck,
  Percent,
  Calendar,
  Wallet
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../lib/calculations';
import { GemmaStructuredAnalysis } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export const ExplainProfileSection: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { records, metrics, trustScore, consents } = useFinancial();
  const { profile, isDemoMode, currentDemoPersona } = useAuth();

  const [explanation, setExplanation] = useState<GemmaStructuredAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate DTI
  const dti = metrics.repaymentsTotal > 0 && metrics.totalIncome > 0
    ? Math.round((metrics.repaymentsTotal / metrics.totalIncome) * 100)
    : null;

  const handleExplainProfile = async () => {
    if (!consents.financialAnalysis) {
      setError('Please enable Financial Analysis consent in Privacy Settings.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/copilot/explain-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records,
          profile: {
            occupation: profile?.occupation || (isDemoMode ? currentDemoPersona?.profile.occupation : 'Freelancer'),
            monthlyIncomeRange: profile?.monthlyIncomeRange
          },
          consents
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (data && data.explanation) {
        setExplanation(data.explanation);
      }
    } catch (err: any) {
      console.warn('[Explain Profile Error]:', err);
      setError('Could not connect to Gemma 4 service. Displaying deterministic profile breakdown.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`overflow-hidden border border-brand-200/80 dark:border-brand-900/60 shadow-sm ${className}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-navy-900 to-slate-900 dark:from-[#0C1524] dark:via-[#111827] dark:to-[#0B0F17] text-white p-5 sm:p-6 -m-5 sm:-m-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-300" />
                POWERED BY GOOGLE GEMMA 4
              </span>
              <span className="text-[10px] text-slate-300">Open-Weight AI</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-heading">
              Explain My Financial Profile
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Get an objective, plain-English breakdown of your verified financial indicators, key strengths, potential risk flags, and tailored improvement steps.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExplainProfile}
            disabled={isLoading || records.length === 0}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{explanation ? 'Regenerate Explanation' : 'Explain My Profile'}</span>
          </button>
        </div>
      </div>

      {/* Deterministic Indicator Overview Card */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            Deterministic Indicators Grounding (Audited Code)
          </h4>
          <span className="text-[11px] text-slate-400">Never hallucinated by AI</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Total Inflow</div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{formatINR(metrics.totalIncome)}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400">{metrics.monthsTracked} month(s) tracked</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Total Outflow</div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{formatINR(metrics.totalExpenses)}</div>
            <div className="text-[10px] text-slate-500">Living & work costs</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Savings Rate</div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{metrics.savingsRate}%</div>
            <div className="text-[10px] text-brand-600 dark:text-brand-400">Surplus: {formatINR(metrics.netRemaining)}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Debt-to-Income (DTI)</div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{dti !== null ? `${dti}%` : '0% (No Debt)'}</div>
            <div className="text-[10px] text-slate-500">{metrics.repaymentsCount} repayments</div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 text-center space-y-3 bg-slate-50/60 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-950/70 text-brand-600 flex items-center justify-center mx-auto">
            <Cpu className="w-5 h-5 animate-spin" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Gemma 4 is synthesizing your financial profile...
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Gemma 4 open-weight model is analyzing your cashflow stability, expense concentration, and repayment regularity.
          </p>
        </div>
      )}

      {/* AI Explanation Content */}
      {!isLoading && explanation && (
        <div className="space-y-5 animate-fade-in">
          {/* Executive Summary Card */}
          <div className="p-4 rounded-xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/60">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              <h4 className="text-xs font-bold text-brand-900 dark:text-brand-200 uppercase tracking-wider">
                Overall Financial Narrative
              </h4>
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {explanation.summary}
            </p>
          </div>

          {/* Strengths & Risks Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                  Verified Financial Strengths
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {explanation.financial_strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risks & Areas Needing Attention */}
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Potential Risks & Margin Flags
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {explanation.financial_risks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Practical Recommendations & Next Actions */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Practical Recommendations for Improvement
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-2">
                <div className="font-semibold text-slate-700 dark:text-slate-300">Strategic Guidance:</div>
                {explanation.improvement_recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                    <span className="text-brand-500 font-bold">✓</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-slate-700 dark:text-slate-300">Immediate Action Steps:</div>
                {explanation.suggested_actions.map((act, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                    <span className="text-emerald-500 font-bold">→</span>
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Attribution & Disclaimers */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-200 dark:border-slate-800">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-brand-500" />
              Model: {explanation.model_information.model_name} ({explanation.model_information.model_version})
            </span>
            <span>{explanation.confidence_limitations[0] || 'Educational analysis only.'}</span>
          </div>
        </div>
      )}

      {/* Empty State before Clicking Button */}
      {!isLoading && !explanation && (
        <div className="p-6 text-center space-y-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Click <strong>"Explain My Profile"</strong> above to generate a full plain-English analysis of your financial health, risk factors, and personalized recommendations powered by Google Gemma 4.
          </p>
        </div>
      )}
    </Card>
  );
};
