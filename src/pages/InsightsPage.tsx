import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileQuestion,
  ShieldCheck,
  RefreshCw,
  PieChart as PieIcon,
  HelpCircle,
  ArrowRight,
  Info,
  Calendar,
  Wallet,
  PiggyBank,
  MessageSquare,
  Send,
  PlusCircle,
  ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useFinancial } from '../context/FinancialContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  formatINR,
  filterRecordsByPeriod,
  calculateFinancialMetrics,
  calculatePeriodComparison
} from '../lib/calculations';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { SimpleExplainer } from '../components/common/SimpleExplainer';
import { AnalysisPeriod } from '../types';
import { FinancialHealthCopilot } from '../components/copilot/FinancialHealthCopilot';
import { AITransparencyBanner } from '../components/common/AITransparencyBanner';

const PIE_COLORS = ['#0D9488', '#0284C7', '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#64748B'];

const SUGGESTED_QUESTIONS = [
  'Where am I spending the most?',
  'How can I manage my expenses better?',
  'What information is missing from my financial profile?',
  'How can I build a more complete Financial Trust Passport?',
  'Why did my Financial Trust Score change?'
];

export const InsightsPage: React.FC = () => {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const {
    records,
    metrics: allMetrics,
    trustScore,
    analysis,
    isAnalyzing,
    runAIAnalysis,
    askFollowUpQuestion,
    error,
    clearError
  } = useFinancial();

  // Period Selector State
  const [selectedPeriod, setSelectedPeriod] = useState<AnalysisPeriod>('this_month');

  // Follow-up Q&A State
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [activeAnswer, setActiveAnswer] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');

  // Calculate metrics specifically for the selected period
  const periodRecords = useMemo(() => {
    return filterRecordsByPeriod(records, selectedPeriod);
  }, [records, selectedPeriod]);

  const periodMetrics = useMemo(() => {
    return calculateFinancialMetrics(periodRecords);
  }, [periodRecords]);

  const periodComparison = useMemo(() => {
    return calculatePeriodComparison(records, selectedPeriod);
  }, [records, selectedPeriod]);

  const handleRunAnalysis = async () => {
    clearError();
    await runAIAnalysis(selectedPeriod);
  };

  const handleAskQuestion = async (q: string) => {
    if (!q.trim() || isAnswering) return;
    setActiveQuestion(q);
    setIsAnswering(true);
    setActiveAnswer(null);

    try {
      const answer = await askFollowUpQuestion(q, selectedPeriod);
      setActiveAnswer(answer || 'Unable to retrieve answer. Please try again.');
    } catch {
      setActiveAnswer('Unable to process question. Please try again.');
    } finally {
      setIsAnswering(false);
    }
  };

  const handleCustomQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customQuestion.trim()) {
      handleAskQuestion(customQuestion.trim());
      setCustomQuestion('');
    }
  };

  const hasRecords = records.length > 0;
  const hasPeriodRecords = periodRecords.length > 0;

  // Pie chart data for current period
  const pieData = periodMetrics.topExpenseCategories.map((c) => ({
    name: c.category,
    value: c.total
  }));

  const periodLabels: Record<AnalysisPeriod, string> = {
    this_month: 'This Month',
    last_month: 'Last Month',
    last_3_months: 'Last 3 Months',
    all_time: 'All Time'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Period Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-800 border border-brand-200 dark:bg-brand-950/70 dark:text-brand-300 dark:border-brand-800/70">
              AI Clarity & Guidance
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {analysis ? `Last generated ${new Date(analysis.generatedAt).toLocaleTimeString()}` : 'Awaiting analysis'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-heading">
            Understand My Money
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mt-1">
            Plain-language explanations of your money habits, income regularity, and living costs powered by Google Gemma 4 open-weight AI and deterministic calculations.
          </p>
        </div>

        {/* Period Selector Tabs & Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Period Selector Buttons */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            {(['this_month', 'last_month', 'last_3_months', 'all_time'] as AnalysisPeriod[]).map((p) => {
              const isSelected = selectedPeriod === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                    isSelected
                      ? 'bg-white dark:bg-brand-600 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {periodLabels[p]}
                </button>
              );
            })}
          </div>

          {hasRecords && (
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={isAnalyzing}
              onClick={handleRunAnalysis}
              leftIcon={<Sparkles className="w-4 h-4 text-brand-300" />}
            >
              {analysis ? 'Refresh AI Analysis' : 'Analyze My Money'}
            </Button>
          )}
        </div>
      </div>

      {/* AI Transparency & Architecture Banner */}
      <AITransparencyBanner />

      {/* Error alert if any */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Notice regarding AI analysis:</strong>
              <span>{error}</span>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleRunAnalysis}>
            Retry
          </Button>
        </div>
      )}

      {/* SECTION A: Clear Financial Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-heading">
            Financial Overview ({periodLabels[selectedPeriod]})
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {periodRecords.length} record{periodRecords.length === 1 ? '' : 's'} in selected period
          </span>
        </div>

        {hasPeriodRecords ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Recorded Income */}
            <Card>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  <SimpleExplainer
                    term="Total Recorded Income"
                    explanation="All client retainer payments, gig payouts, salary, and earnings logged in this period."
                  />
                </span>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatINR(periodMetrics.totalIncome)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                {periodComparison.hasPreviousPeriodData && periodComparison.incomeChangePercentage !== undefined ? (
                  <span
                    className={`font-semibold ${
                      periodComparison.incomeChangePercentage >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {periodComparison.incomeChangePercentage >= 0 ? '+' : ''}
                    {periodComparison.incomeChangePercentage}% vs last month
                  </span>
                ) : (
                  <span>Period inflow</span>
                )}
              </div>
            </Card>

            {/* Total Recorded Expenses */}
            <Card>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  <SimpleExplainer
                    term="Total Recorded Expenses"
                    explanation="All day-to-day purchases, living costs, bills, and debt repayments recorded in this period."
                  />
                </span>
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatINR(periodMetrics.totalExpenses)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                {periodComparison.hasPreviousPeriodData && periodComparison.expenseChangePercentage !== undefined ? (
                  <span
                    className={`font-semibold ${
                      periodComparison.expenseChangePercentage <= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {periodComparison.expenseChangePercentage >= 0 ? '+' : ''}
                    {periodComparison.expenseChangePercentage}% vs last month
                  </span>
                ) : (
                  <span>{periodMetrics.expenseToIncomeRatio}% of period income</span>
                )}
              </div>
            </Card>

            {/* Remaining Amount */}
            <Card>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  <SimpleExplainer
                    term="Remaining Cash Amount"
                    explanation="Money left over after subtracting all recorded expenses from recorded income in this timeframe."
                  />
                </span>
                <div
                  className={`p-2 rounded-lg ${
                    periodMetrics.netRemaining >= 0
                      ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300'
                      : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`text-2xl font-bold ${
                  periodMetrics.netRemaining >= 0
                    ? 'text-brand-700 dark:text-brand-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatINR(periodMetrics.netRemaining)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {periodMetrics.netRemaining >= 0 ? 'Surplus cash buffer' : 'Living costs exceeded income'}
              </div>
            </Card>

            {/* Savings & On-Time Repayments */}
            <Card>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  <SimpleExplainer
                    term="Savings & Repayment"
                    explanation="Savings cushion retained and verified on-time bills or rent completed."
                  />
                </span>
                <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300">
                  <PiggyBank className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {periodMetrics.savingsRate}% Retained
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {periodMetrics.repaymentsCount > 0
                  ? `${periodMetrics.repaymentsCount} on-time payment(s)`
                  : 'No bill/repayments in period'}
              </div>
            </Card>
          </div>
        ) : (
          <Card className="text-center py-8 space-y-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              No financial records found for {periodLabels[selectedPeriod]}.
            </p>
            <Link
              to="/my-money"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-brand-600 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Record for {periodLabels[selectedPeriod]}</span>
            </Link>
          </Card>
        )}

        {/* Essential Transparency Disclaimer */}
        <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Ledger Calculation Note:</strong> Remaining amounts are calculated deterministically from the financial entries you entered in NEXUS. They may not match your physical bank balance if some transactions were unrecorded. We never assume missing data is zero.
          </span>
        </div>
      </div>

      {/* SECTION B: 7 Structured Gemini AI Guidance Sections */}
      {analysis ? (
        <div className="space-y-6">
          {/* Section 1: Your Money at a Glance */}
          <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] dark:from-brand-950 dark:via-slate-900 dark:to-[#0B0F17] text-white rounded-2xl p-6 sm:p-8 shadow-elevated border border-slate-700/50 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-400/20 text-brand-300 flex items-center justify-center border border-brand-400/30">
                  <Sparkles className="w-5 h-5 text-brand-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    1. Your Money at a Glance
                  </h3>
                  <span className="text-[11px] text-brand-200">
                    Engine: {analysis.source === 'gemini_api' ? 'Google Gemini 2.5 Flash' : 'Nexus Deterministic Engine'} • Period: {periodLabels[analysis.period || selectedPeriod]}
                  </span>
                </div>
              </div>

              <Badge variant="brand" size="sm" className="bg-brand-500/20 text-brand-200 border-brand-400/30">
                Grounding: {records.length} Verified Entries
              </Badge>
            </div>

            <p className="text-base sm:text-lg text-slate-100 leading-relaxed font-sans font-medium">
              "{analysis.summary}"
            </p>
          </div>

          {/* 6 Remaining Diagnostic Cards in Structured Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 2: What You Are Doing Well */}
            <Card
              title="2. What You Are Doing Well"
              subtitle="Positive financial patterns backed by your records"
            >
              <div className="space-y-2.5 pt-1">
                {analysis.positiveIndicators && analysis.positiveIndicators.length > 0 ? (
                  analysis.positiveIndicators.map((pos, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 text-xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-800 dark:text-slate-200 leading-relaxed">{pos}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                    Add records across 2+ months to identify established positive habits.
                  </p>
                )}
              </div>
            </Card>

            {/* Section 3: Where Your Money Goes */}
            <Card
              title="3. Where Your Money Goes"
              subtitle="Top expense categories and changes over time"
            >
              <div className="space-y-3 pt-1">
                {analysis.expenseBreakdownInsight ? (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                    {analysis.expenseBreakdownInsight}
                  </div>
                ) : null}

                {/* Top categories breakdown */}
                {periodMetrics.topExpenseCategories.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {periodMetrics.topExpenseCategories.slice(0, 3).map((c, i) => (
                      <div key={c.category} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{c.category}</span>
                          <strong className="text-slate-900 dark:text-white font-mono">
                            {formatINR(c.total)} ({c.percentage}%)
                          </strong>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-600 rounded-full"
                            style={{ width: `${c.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No expense records categorized in this period yet.
                  </p>
                )}
              </div>
            </Card>

            {/* Section 4: What Needs Attention */}
            <Card
              title="4. What Needs Attention"
              subtitle="Points of caution to protect your cashflow"
            >
              <div className="space-y-2.5 pt-1">
                {analysis.areasForAttention && analysis.areasForAttention.length > 0 ? (
                  analysis.areasForAttention.map((area, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 text-xs"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-800 dark:text-slate-200 leading-relaxed">{area}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                    No urgent risk factors detected from available records.
                  </p>
                )}
              </div>
            </Card>

            {/* Section 5: Your Next Three Steps */}
            <Card
              title="5. Your Next Three Steps"
              subtitle="Practical, realistic actions tailored to your situation"
            >
              <div className="space-y-2.5 pt-1">
                {analysis.actionableSuggestions && analysis.actionableSuggestions.length > 0 ? (
                  analysis.actionableSuggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <Lightbulb className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-800 dark:text-slate-200 leading-relaxed">{sug}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                    Keep adding weekly records to generate action recommendations.
                  </p>
                )}
              </div>
            </Card>

            {/* Section 6: Your Financial Trust Score Explanation */}
            <Card
              title="6. Your Financial Trust Score"
              subtitle="Plain-English explanation of your calculated score"
            >
              <div className="space-y-3 pt-1 text-xs">
                {trustScore && trustScore.status !== 'insufficient_data' ? (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/50">
                      <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 flex flex-col items-center justify-center font-bold text-slate-900 dark:text-white flex-shrink-0 font-mono shadow-xs">
                        <span className="text-base font-extrabold">{trustScore.score}</span>
                        <span className="text-[9px] text-slate-400 -mt-1">/100</span>
                      </div>
                      <div>
                        <strong className="block text-slate-900 dark:text-white font-semibold">
                          {trustScore.label}
                        </strong>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400">
                          {trustScore.status === 'provisional'
                            ? 'Provisional score based on early ledger entries.'
                            : 'Deterministic score calculated by application logic.'}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {analysis.trustScoreExplanation ||
                        `Your score reflects ${trustScore.breakdown.incomeConsistency.score}/30 for income consistency, ${trustScore.breakdown.savingsHabits.score}/25 for savings habits, ${trustScore.breakdown.repaymentHistory.score}/25 for repayments, and ${trustScore.breakdown.expenseManagement.score}/20 for expense management.`}
                    </p>

                    <div className="pt-1">
                      <Link
                        to="/passport"
                        className="text-brand-700 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-300 font-semibold flex items-center gap-1"
                      >
                        <span>View complete score methodology in Passport</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 py-2">
                    Add at least 3 financial records (including monthly earnings) to calculate your provisional Financial Trust Score.
                  </p>
                )}
              </div>
            </Card>

            {/* Section 7: What Information Is Missing */}
            <Card
              title="7. What Information Is Missing"
              subtitle="Records that would make your profile more convincing"
            >
              <div className="space-y-2.5 pt-1">
                {analysis.missingInformation && analysis.missingInformation.length > 0 ? (
                  analysis.missingInformation.map((miss, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-sky-50/60 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 text-xs"
                    >
                      <FileQuestion className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-800 dark:text-slate-200 leading-relaxed">{miss}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                    No major information gaps. Your ledger records are consistent.
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    to="/my-money"
                    className="text-xs font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-300 flex items-center gap-1"
                  >
                    <span>Add records in My Money</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* Empty / Initial State */
        <Card className="text-center py-12 px-4 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 mx-auto flex items-center justify-center">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
              Ready to generate your AI clarity analysis
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              We will evaluate your {periodRecords.length} record{periodRecords.length === 1 ? '' : 's'} for {periodLabels[selectedPeriod]} and explain your habits across 7 clear sections without jargon.
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              isLoading={isAnalyzing}
              onClick={handleRunAnalysis}
              leftIcon={<Sparkles className="w-4 h-4 text-brand-300" />}
            >
              Run AI Analysis Now
            </Button>
          </div>
        </Card>
      )}

      {/* SECTION D: Contextual Follow-Up Questions (Interactive) */}
      <Card
        title="Ask a Quick Follow-up Question"
        subtitle="Click a question below or ask in plain English — answered strictly from your records"
      >
        <div className="space-y-4 pt-1">
          {/* 5 Clickable Suggested Questions */}
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => {
              const isSelected = activeQuestion === q;
              return (
                <button
                  key={q}
                  type="button"
                  disabled={isAnswering}
                  onClick={() => handleAskQuestion(q)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{q}</span>
                </button>
              );
            })}
          </div>

          {/* Active Question & Answer Box */}
          {activeQuestion && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Question: "{activeQuestion}"</span>
                </span>
                {isAnswering && <span className="animate-pulse">Consulting verified records...</span>}
              </div>

              {isAnswering ? (
                <div className="flex items-center gap-2 py-3 text-xs text-slate-500 dark:text-slate-400">
                  <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing ledger metrics and scoring methodology...</span>
                </div>
              ) : activeAnswer ? (
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans font-medium">
                  {activeAnswer}
                </p>
              ) : null}
            </div>
          )}

          {/* Custom Question Input */}
          <form onSubmit={handleCustomQuestionSubmit} className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="Or type a question (e.g. Can I afford ₹5,000 extra living costs this month?)"
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={!customQuestion.trim() || isAnswering}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Ask
            </Button>
          </form>
        </div>
      </Card>

      {/* Interactive AI Financial Health Copilot (Gemma 4 Chat) */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
          NEXUS AI Financial Health Copilot (Interactive Assistant)
        </h3>
        <FinancialHealthCopilot />
      </div>

      {/* Visual Spending Breakdown Chart */}
      {pieData.length > 0 && (
        <Card
          title={`Where You Spend Your Money (${periodLabels[selectedPeriod]})`}
          subtitle="Expense distribution by recorded category"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatINR(Number(val) || 0), 'Amount']}
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
                      borderColor: theme === 'dark' ? '#1F2937' : '#E2E8F0',
                      color: theme === 'dark' ? '#F9FAFB' : '#0F172A',
                      fontSize: '12px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    itemStyle={{
                      color: theme === 'dark' ? '#F9FAFB' : '#0F172A'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs">
              {periodMetrics.topExpenseCategories.map((c, i) => (
                <div
                  key={c.category}
                  className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{c.category}</span>
                  </div>
                  <strong className="text-slate-900 dark:text-white font-mono">
                    {formatINR(c.total)} ({c.percentage}%)
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
