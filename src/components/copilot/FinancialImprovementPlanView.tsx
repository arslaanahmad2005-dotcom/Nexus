import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Target,
  Award,
  AlertCircle,
  Cpu,
  Clock,
  Layers,
  CheckSquare
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { FinancialImprovementPlan, ImprovementPlanWeek } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export const FinancialImprovementPlanView: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { records, metrics, trustScore, consents } = useFinancial();
  const { user, profile, isDemoMode, currentDemoPersona } = useAuth();

  const storageKey = isDemoMode && currentDemoPersona
    ? `nexus_plan_${currentDemoPersona.id}`
    : `nexus_plan_${user?.id || 'local'}`;

  const [plan, setPlan] = useState<FinancialImprovementPlan | null>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number>(1);

  // Synchronize state when storage key changes
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setPlan(JSON.parse(saved));
      } catch {
        // ignore
      }
    } else {
      setPlan(null);
    }
  }, [storageKey]);

  const handleGeneratePlan = async () => {
    if (!consents.financialAnalysis) {
      setError('Please enable Financial Analysis consent in Privacy Settings.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/copilot/improvement-plan', {
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
        throw new Error(`Plan service responded with status ${response.status}`);
      }

      const data = await response.json();
      if (data && data.plan) {
        setPlan(data.plan);
        if (consents.dataStorage) {
          localStorage.setItem(storageKey, JSON.stringify(data.plan));
        }
      }
    } catch (err: any) {
      console.warn('[Plan Generation Error]:', err);
      setError('Could not reach Gemma 4 service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskCompletion = (weekIndex: number, taskId: string) => {
    if (!plan) return;

    const updatedWeeks = plan.weeks.map((week, wIdx) => {
      if (wIdx !== weekIndex) return week;
      return {
        ...week,
        tasks: week.tasks.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )
      };
    });

    const updatedPlan: FinancialImprovementPlan = {
      ...plan,
      weeks: updatedWeeks
    };

    setPlan(updatedPlan);
    if (consents.dataStorage) {
      localStorage.setItem(storageKey, JSON.stringify(updatedPlan));
    }
  };

  // Compute progress
  let totalTasks = 0;
  let completedTasks = 0;
  if (plan) {
    plan.weeks.forEach((w) => {
      w.tasks.forEach((t) => {
        totalTasks++;
        if (t.completed) completedTasks++;
      });
    });
  }

  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card className={`overflow-hidden border border-brand-200/80 dark:border-brand-900/60 shadow-sm ${className}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-brand-950 text-white p-5 sm:p-6 -m-5 sm:-m-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-300" />
                GEMMA 4 ACTION ROADMAP
              </span>
              <span className="text-[10px] text-slate-300">4-Week Structured Track</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-heading">
              30-Day Financial Improvement Plan
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Turn insights into habits. A step-by-step weekly roadmap tailored to your actual income and expenses, designed to strengthen your financial resilience.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGeneratePlan}
            disabled={isLoading || records.length === 0}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{plan ? 'Regenerate Plan' : 'Generate 30-Day Plan'}</span>
          </button>
        </div>

        {/* Progress Bar when plan exists */}
        {plan && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-brand-400" />
                Roadmap Completion Status:
              </span>
              <strong className="text-brand-300 font-bold">
                {completedTasks} of {totalTasks} Tasks Done ({progressPercentage}%)
              </strong>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 text-center space-y-3 bg-slate-50/60 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 my-4">
          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-950/70 text-brand-600 flex items-center justify-center mx-auto">
            <Cpu className="w-5 h-5 animate-spin" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Gemma 4 is synthesizing your 4-week improvement roadmap...
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Personalizing realistic weekly milestones based on your monthly cashflow cushion.
          </p>
        </div>
      )}

      {/* Empty State before Plan Generation */}
      {!isLoading && !plan && (
        <div className="p-8 text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/60 my-2">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 flex items-center justify-center mx-auto shadow-xs">
            <Calendar className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            No Improvement Plan Generated Yet
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click <strong>"Generate 30-Day Plan"</strong> to build a personalized 4-week roadmap with task checkboxes and progress tracking.
          </p>
        </div>
      )}

      {/* Plan Render */}
      {!isLoading && plan && (
        <div className="space-y-4 animate-fade-in">
          {/* Goal Header */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center flex-shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Overall 30-Day Goal
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {plan.overallGoal}
              </div>
            </div>
          </div>

          {/* 4 Weekly Roadmap Cards */}
          <div className="space-y-3">
            {plan.weeks.map((week, wIdx) => {
              const isCurrentExpanded = expandedWeek === week.weekNumber;
              const weekCompletedCount = week.tasks.filter((t) => t.completed).length;
              const isWeekComplete = weekCompletedCount === week.tasks.length && week.tasks.length > 0;

              return (
                <div
                  key={week.weekNumber}
                  className={`rounded-xl border transition-all ${
                    isWeekComplete
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80'
                  }`}
                >
                  {/* Week Card Accordion Header */}
                  <button
                    type="button"
                    onClick={() => setExpandedWeek(isCurrentExpanded ? 0 : week.weekNumber)}
                    className="w-full p-4 flex items-center justify-between text-left gap-3 focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isWeekComplete
                            ? 'bg-emerald-600 text-white'
                            : 'bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300'
                        }`}
                      >
                        W{week.weekNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Week {week.weekNumber}: {week.theme}
                          </h4>
                          {isWeekComplete && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {week.objective}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 hidden sm:inline">
                        {weekCompletedCount}/{week.tasks.length} Done
                      </span>
                      {isCurrentExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Tasks & Recommendations (Expanded) */}
                  {isCurrentExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
                      {/* Tasks List */}
                      <div className="space-y-2">
                        {week.tasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => toggleTaskCompletion(wIdx, task.id)}
                            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                              task.completed
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-slate-500'
                                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700/60 hover:border-brand-300 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <button
                              type="button"
                              className="mt-0.5 text-brand-600 dark:text-brand-400 focus:outline-none"
                              aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
                            >
                              {task.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-400" />
                              )}
                            </button>

                            <div className="flex-1 text-xs">
                              <div className={`font-semibold ${task.completed ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                                {task.title}
                              </div>
                              <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                                {task.description}
                              </div>
                            </div>

                            {task.estimatedMinutes && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                                <Clock className="w-3 h-3" />
                                {task.estimatedMinutes}m
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Expandable Recommendations */}
                      {week.recommendations && week.recommendations.length > 0 && (
                        <div className="p-3 rounded-lg bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/60 text-xs">
                          <span className="font-semibold text-brand-900 dark:text-brand-300">
                            Copilot Tip for Week {week.weekNumber}:{' '}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {week.recommendations.join(' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Model Info & Disclaimer */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-200 dark:border-slate-800">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-brand-500" />
              Gemma 4 Plan Engine • Persistence: {consents.dataStorage ? 'Enabled' : 'Session Only'}
            </span>
            <span>{plan.disclaimer}</span>
          </div>
        </div>
      )}
    </Card>
  );
};
