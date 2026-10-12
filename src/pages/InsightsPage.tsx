import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileQuestion,
  ShieldCheck,
  RefreshCw,
  PieChart as PieIcon,
  HelpCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useFinancial } from '../context/FinancialContext';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../lib/calculations';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { SimpleExplainer } from '../components/common/SimpleExplainer';

const COLORS = ['#0D9488', '#0284C7', '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#64748B'];

export const InsightsPage: React.FC = () => {
  const { profile } = useAuth();
  const { records, metrics, analysis, isAnalyzing, runAIAnalysis, error, clearError } =
    useFinancial();

  const [hasConsentChecked, setHasConsentChecked] = useState(true);

  const handleRunAnalysis = async () => {
    clearError();
    await runAIAnalysis();
  };

  const hasRecords = records.length > 0;

  // Chart data for expenses
  const pieData = metrics.topExpenseCategories.map((c) => ({
    name: c.category,
    value: c.total
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-800 border border-brand-200">
              AI Clarity Engine
            </span>
            <span className="text-xs text-slate-500">
              {analysis ? `Last generated ${new Date(analysis.generatedAt).toLocaleTimeString()}` : 'Awaiting analysis'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-heading">
            Understand My Money
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            See what your financial entries demonstrate about your money habits in plain, encouraging English.
          </p>
        </div>

        {hasRecords && (
          <Button
            type="button"
            variant="primary"
            isLoading={isAnalyzing}
            onClick={handleRunAnalysis}
            leftIcon={<Sparkles className="w-4 h-4 text-brand-300" />}
          >
            {analysis ? 'Refresh AI Analysis' : 'Analyze My Money'}
          </Button>
        )}
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
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

      {/* Numerical Metrics Summary Section (Deterministic) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income Regularity */}
        <Card>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              <SimpleExplainer
                term="Income Regularity"
                explanation="Measures how predictable your incoming money is month-to-month, especially important for freelancers."
              />
            </span>
            <div className="p-1.5 rounded-md bg-brand-50 text-brand-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-900">
            {metrics.incomeConsistencyScore}/100
          </div>
          <div className="text-xs text-brand-700 font-medium mt-1">
            {metrics.incomeConsistencyRating}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-2">
            Calculated over {metrics.monthsTracked} month{metrics.monthsTracked === 1 ? '' : 's'} of activity.
          </p>
        </Card>

        {/* Savings & Cushion Rate */}
        <Card>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              <SimpleExplainer
                term="Savings Cushion"
                explanation="The percentage of your recorded earnings that you keep after all living expenses are covered."
              />
            </span>
            <div className="p-1.5 rounded-md bg-teal-50 text-teal-700">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-900">
            {metrics.savingsRate}%
          </div>
          <div className="text-xs text-teal-700 font-medium mt-1">
            {metrics.savingsRate >= 20 ? 'Solid Buffer' : 'Developing Buffer'}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-2">
            {formatINR(metrics.netRemaining)} net remaining across tracked records.
          </p>
        </Card>

        {/* Repayment Discipline */}
        <Card>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              <SimpleExplainer
                term="Repayment Discipline"
                explanation="Shows whether you make scheduled rent, device EMI, and bill payments on time."
              />
            </span>
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-900">
            {metrics.repaymentsCount > 0 ? `${metrics.repaymentsCount} On-Time` : 'No Records'}
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1">
            {metrics.repaymentsCount > 0 ? 'Zero Overdue Misses' : 'Add rent or EMI payments'}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-2">
            {formatINR(metrics.repaymentsTotal)} total verified payments recorded.
          </p>
        </Card>
      </div>

      {/* Main AI Insights Content */}
      {analysis ? (
        <div className="space-y-6">
          {/* Main AI Summary Box */}
          <div className="bg-gradient-to-br from-brand-900 via-navy-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-400/20 text-brand-300 flex items-center justify-center border border-brand-400/30">
                  <Sparkles className="w-4 h-4 text-brand-300" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">What Your Records Demonstrate</h3>
                  <span className="text-[10px] text-brand-200">
                    Engine: {analysis.source === 'gemini_api' ? 'Google Gemini 2.5 Flash' : 'Nexus Deterministic Engine'}
                  </span>
                </div>
              </div>

              <Badge variant="brand" size="sm" className="bg-brand-500/20 text-brand-200 border-brand-400/30">
                Verified from {metrics.totalRecordsCount} Records
              </Badge>
            </div>

            <p className="text-base sm:text-lg text-slate-100 leading-relaxed font-sans font-medium">
              "{analysis.summary}"
            </p>

            <div className="mt-4 pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <span>Analysis based strictly on user-provided financial ledger.</span>
              <Link to="/passport" className="text-brand-300 hover:text-white font-medium flex items-center gap-1">
                <span>View Full Trust Passport</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 4 Diagnostic Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. What You Are Managing Well */}
            <Card title="What You Are Managing Well" subtitle="Demonstrated strengths in your habits">
              <div className="space-y-3 pt-1">
                {analysis.positiveIndicators.map((pos, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-800 leading-relaxed">{pos}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 2. Things That Need Attention */}
            <Card title="Things That Need Attention" subtitle="Points of caution to protect your cash cushion">
              <div className="space-y-3 pt-1">
                {analysis.areasForAttention.map((area, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/60 border border-amber-100 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-800 leading-relaxed">{area}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 3. Practical Suggestions */}
            <Card title="Practical Suggestions" subtitle="Simple actions to strengthen your financial story">
              <div className="space-y-3 pt-1">
                {analysis.actionableSuggestions.map((sug, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <Lightbulb className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-800 leading-relaxed">{sug}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 4. Missing Information */}
            <Card title="Missing Information" subtitle="Entries that would make your profile more convincing">
              <div className="space-y-3 pt-1">
                {analysis.missingInformation.map((miss, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-sky-50/60 border border-sky-100 text-xs">
                    <FileQuestion className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-800 leading-relaxed">{miss}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="text-center py-12 px-4 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 mx-auto flex items-center justify-center">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-navy-900 font-heading">
              Ready to generate your AI clarity report
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We will evaluate your {records.length} financial records and summarize your habits without technical jargon.
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

      {/* Expense Concentration Chart */}
      {pieData.length > 0 && (
        <Card title="Where You Spend Your Money" subtitle="Breakdown by expense category">
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatINR(Number(val) || 0), 'Amount']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      color: '#FFF',
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: 'none'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs">
              {metrics.topExpenseCategories.map((c, i) => (
                <div key={c.category} className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="font-medium text-slate-800">{c.category}</span>
                  </div>
                  <strong className="text-navy-900">
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
