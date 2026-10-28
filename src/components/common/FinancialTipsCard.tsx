import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Lightbulb,
  ArrowRight,
  TrendingUp,
  PiggyBank,
  CheckCircle2,
  Calendar,
  HelpCircle,
  FileCheck2,
  Wallet,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { TrustTip } from '../../types';
import { Card } from './Card';
import { Badge } from './Badge';

interface FinancialTipsCardProps {
  tips: TrustTip[];
  className?: string;
}

export const FinancialTipsCard: React.FC<FinancialTipsCardProps> = ({ tips, className = '' }) => {
  const [expandedRationaleId, setExpandedRationaleId] = useState<string | null>(null);

  const toggleRationale = (id: string) => {
    setExpandedRationaleId(expandedRationaleId === id ? null : id);
  };

  const getTipIcon = (iconName: TrustTip['iconName']) => {
    switch (iconName) {
      case 'income':
        return <TrendingUp className="w-4 h-4 text-brand-600 dark:text-brand-400" />;
      case 'savings':
        return <PiggyBank className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'repayment':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'calendar':
        return <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'passport':
        return <FileCheck2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'expense':
      default:
        return <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
  };

  const getCategoryBadgeVariant = (cat: TrustTip['category']): 'brand' | 'success' | 'warning' | 'info' | 'neutral' => {
    switch (cat) {
      case 'Income':
        return 'brand';
      case 'Repayment':
        return 'success';
      case 'Savings':
        return 'info';
      case 'Expense':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  if (!tips || tips.length === 0) {
    return null;
  }

  return (
    <Card
      title="Tips to Build Financial Trust"
      subtitle="Data-driven suggestions tailored to your recorded financial pattern"
      className={`border-slate-200 dark:border-slate-800 ${className}`}
      action={
        <Badge variant="neutral" size="sm">
          {tips.length} Actionable Tips
        </Badge>
      }
    >
      <div className="space-y-3 pt-1">
        {tips.map((tip) => {
          const isRationaleOpen = expandedRationaleId === tip.id;

          return (
            <div
              key={tip.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xs flex-shrink-0 mt-0.5">
                    {getTipIcon(tip.iconName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {tip.title}
                      </h4>
                      <Badge variant={getCategoryBadgeVariant(tip.category)} size="sm">
                        {tip.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                </div>

                {tip.actionLink && (
                  <div className="sm:self-center flex-shrink-0 pt-1 sm:pt-0 pl-10 sm:pl-0">
                    <Link
                      to={tip.actionLink}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
                    >
                      <span>{tip.actionLabel || 'Try this'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>

              {/* "Why am I seeing this tip?" Expandable explanation */}
              <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                <button
                  type="button"
                  onClick={() => toggleRationale(tip.id)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors font-medium"
                >
                  <Info className="w-3 h-3" />
                  <span>Why am I seeing this tip?</span>
                  {isRationaleOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {isRationaleOpen && (
                  <div className="mt-1.5 p-2 rounded-lg bg-brand-50/50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/40 text-brand-900 dark:text-brand-200 leading-relaxed text-[11px] animate-fadeIn">
                    {tip.rationale}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
