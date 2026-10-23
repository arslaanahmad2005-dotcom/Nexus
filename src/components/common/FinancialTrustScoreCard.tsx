import React, { useState } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  Info,
  Calendar,
  Wallet,
  PiggyBank
} from 'lucide-react';
import { FinancialTrustScore } from '../../types';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { Modal } from './Modal';

interface FinancialTrustScoreCardProps {
  trustScore: FinancialTrustScore;
  onHowToImproveClick?: () => void;
  className?: string;
  compact?: boolean;
}

export const FinancialTrustScoreCard: React.FC<FinancialTrustScoreCardProps> = ({
  trustScore,
  onHowToImproveClick,
  className = '',
  compact = false
}) => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { score, status, label, breakdown, keyFactors, lastCalculatedAt, methodologyVersion } = trustScore;

  // Percentage for circular / linear progress
  const clampedScore = Math.max(0, Math.min(100, score));

  // Circular progress SVG constants
  const circleRadius = 38;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const isInsufficient = status === 'insufficient_data';
  const isProvisional = status === 'provisional';

  // Score color scheme
  const getScoreColor = () => {
    if (isInsufficient) return 'text-slate-400 dark:text-slate-500 stroke-slate-300 dark:stroke-slate-700';
    if (clampedScore >= 80) return 'text-brand-600 dark:text-brand-400 stroke-brand-600 dark:stroke-brand-400';
    if (clampedScore >= 65) return 'text-teal-600 dark:text-teal-400 stroke-teal-600 dark:stroke-teal-400';
    if (clampedScore >= 50) return 'text-amber-600 dark:text-amber-400 stroke-amber-500 dark:stroke-amber-400';
    return 'text-slate-700 dark:text-slate-300 stroke-slate-600 dark:stroke-slate-400';
  };

  const formattedDate = lastCalculatedAt
    ? new Date(lastCalculatedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'Just now';

  return (
    <>
      <Card className={`border-slate-200 dark:border-slate-800 relative overflow-hidden ${className}`}>
        {/* Subtle accent bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-600 via-teal-500 to-brand-400" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                Financial Trust Score
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <Clock className="w-3 h-3" />
                <span>Updated {formattedDate}</span>
                <span>•</span>
                <span className="font-mono">v{methodologyVersion || '1.0'}</span>
              </div>
            </div>
          </div>

          <div>
            {isInsufficient ? (
              <Badge variant="neutral" size="sm">
                Awaiting Data
              </Badge>
            ) : isProvisional ? (
              <Badge variant="warning" size="sm">
                Provisional Score
              </Badge>
            ) : (
              <Badge variant="success" size="sm">
                Verified Model
              </Badge>
            )}
          </div>
        </div>

        {/* Insufficient Data State */}
        {isInsufficient ? (
          <div className="py-6 px-2 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Add more information to calculate your score
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Log at least 3 financial records (including your monthly earnings) so our deterministic model can evaluate your income consistency, savings habits, and repayment history.
              </p>
            </div>
            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailsModalOpen(true)}
                leftIcon={<HelpCircle className="w-3.5 h-3.5" />}
              >
                How is my score calculated?
              </Button>
            </div>
          </div>
        ) : (
          /* Active / Provisional Score View */
          <div className="pt-4 space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-5 justify-between">
              {/* Circular Gauge & Score Value */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
                    {/* Background Track */}
                    <circle
                      cx="48"
                      cy="48"
                      r={circleRadius}
                      className="stroke-slate-100 dark:stroke-slate-800"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    {/* Progress Arc */}
                    <circle
                      cx="48"
                      cy="48"
                      r={circleRadius}
                      className={`${getScoreColor()} transition-all duration-1000 ease-out`}
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {score}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium -mt-0.5">
                      / 100
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {label}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                    {isProvisional
                      ? 'Provisional score based on early ledger entries. Logging continuous records will verify full consistency.'
                      : 'Calculated using deterministic mathematical rules across 4 financial pillars without traditional bureau reliance.'}
                  </p>
                </div>
              </div>

              {/* Quick Component Mini-bars */}
              <div className="w-full md:w-64 space-y-2 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                {/* Income */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                    <span>Income Consistency</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{breakdown.incomeConsistency.score}/30</strong>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full"
                      style={{ width: `${(breakdown.incomeConsistency.score / 30) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Savings */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                    <span>Savings Habits</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{breakdown.savingsHabits.score}/25</strong>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${(breakdown.savingsHabits.score / 25) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Repayment */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                    <span>Repayment History</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{breakdown.repaymentHistory.score}/25</strong>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(breakdown.repaymentHistory.score / 25) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Expense */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                    <span>Expense Management</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{breakdown.expenseManagement.score}/20</strong>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-600 dark:bg-slate-400 rounded-full"
                      style={{ width: `${(breakdown.expenseManagement.score / 20) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Key Factors Influencing Result */}
            {keyFactors && keyFactors.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Key Factors Influencing Score:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {keyFactors.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300"
                    >
                      {f.type === 'positive' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : f.type === 'attention' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
                      )}
                      <span className="leading-tight">{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(true)}
                className="text-xs font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-300 flex items-center gap-1 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>View score details & calculation rules</span>
              </button>

              {onHowToImproveClick && (
                <button
                  type="button"
                  onClick={onHowToImproveClick}
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>How to improve my score</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Methodology & Calculation Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="How Your Financial Trust Score is Calculated"
        maxWidth="lg"
      >
        <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
          <div className="p-3.5 rounded-xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-brand-700 dark:text-brand-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-slate-900 dark:text-white font-semibold">
                NEXUS Trust Methodology (Version {methodologyVersion || 'v1.0'})
              </strong>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                The score is computed deterministically in application code using your verified records. Gemini AI never invents or alters this number. It enables students, gig workers, and freelancers to prove financial reliability without traditional CIBIL/Experian credit history.
              </p>
            </div>
          </div>

          {/* 4 Pillars Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Score Component Weights (100 Points Total)
            </h4>

            {/* 1. Income Consistency */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <strong className="text-slate-900 dark:text-white text-xs">
                    1. Income Consistency (30 Points)
                  </strong>
                </div>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {breakdown.incomeConsistency.score} / 30 pts
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {breakdown.incomeConsistency.description}
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg text-[11px] space-y-1 text-slate-500 dark:text-slate-400">
                <div>• Evaluates stability across recorded monthly earnings.</div>
                <div>• Does not penalize users for earning a low income amount.</div>
                <div>• Accounts for healthy freelance and gig milestone variance.</div>
                <div>• Missing entries are never assumed to be zero income.</div>
              </div>
            </div>

            {/* 2. Savings Habits */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                    <PiggyBank className="w-3.5 h-3.5" />
                  </div>
                  <strong className="text-slate-900 dark:text-white text-xs">
                    2. Savings Habits (25 Points)
                  </strong>
                </div>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {breakdown.savingsHabits.score} / 25 pts
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {breakdown.savingsHabits.description}
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg text-[11px] space-y-1 text-slate-500 dark:text-slate-400">
                <div>• Rewards conscious emergency deposits and positive monthly cashflow buffer.</div>
                <div>• Avoids assuming every user has positive balances; incomplete data is stated clearly.</div>
              </div>
            </div>

            {/* 3. Repayment History */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <strong className="text-slate-900 dark:text-white text-xs">
                    3. Repayment History (25 Points)
                  </strong>
                </div>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {breakdown.repaymentHistory.score} / 25 pts
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {breakdown.repaymentHistory.description}
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg text-[11px] space-y-1 text-slate-500 dark:text-slate-400">
                <div>• Tracks on-time recorded payments of rent, utility bills, and loan EMIs.</div>
                <div>• Never assumes an unrecorded payment was missed. Zero debt is never treated as bad credit.</div>
              </div>
            </div>

            {/* 4. Expense Management */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <strong className="text-slate-900 dark:text-white text-xs">
                    4. Expense Management (20 Points)
                  </strong>
                </div>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {breakdown.expenseManagement.score} / 20 pts
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {breakdown.expenseManagement.description}
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg text-[11px] space-y-1 text-slate-500 dark:text-slate-400">
                <div>• Analyzes living costs relative to earnings.</div>
                <div>• Does not penalize necessary expenses (Rent, Education, Medical, Groceries) as irresponsible.</div>
              </div>
            </div>
          </div>

          {/* Important Regulatory Disclaimer */}
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/90 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <strong className="text-slate-900 dark:text-white font-semibold">Important Disclaimer:</strong>
            <p>{trustScore.disclaimer}</p>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="sm" onClick={() => setIsDetailsModalOpen(false)}>
              Understood
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
