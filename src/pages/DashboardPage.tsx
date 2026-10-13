import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Sparkles,
  FileCheck2,
  ArrowRight,
  Clock,
  Calendar,
  Layers,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useFinancial } from '../context/FinancialContext';
import { useTheme } from '../context/ThemeContext';
import { formatINR, generateFinancialTips } from '../lib/calculations';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { SimpleExplainer } from '../components/common/SimpleExplainer';
import { FinancialTrustScoreCard } from '../components/common/FinancialTrustScoreCard';
import { FinancialTipsCard } from '../components/common/FinancialTipsCard';

export const DashboardPage: React.FC = () => {
  const { profile, isDemoMode, currentDemoPersona } = useAuth();
  const { records, metrics, passport, trustScore } = useFinancial();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const userName = profile?.fullName || (isDemoMode ? currentDemoPersona?.name : 'Friend');
  const occupation = profile?.occupation || (isDemoMode ? currentDemoPersona?.profile.occupation : 'Member');

  // Compute 3 personalized financial tips
  const financialTips = useMemo(() => {
    return generateFinancialTips(records, trustScore);
  }, [records, trustScore]);

  const handleScrollToTips = () => {
    const el = document.getElementById('financial-tips-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Profile completion calculation
  const profileProgress = Math.min(
    100,
    (profile?.onboardingCompleted ? 25 : 10) +
      (records.length >= 5 ? 35 : records.length * 7) +
      (passport ? 25 : 0) +
      (metrics.repaymentsCount > 0 ? 15 : 0)
  );

  const hasRecords = records.length > 0;
  const recentRecords = records.slice(0, 5);

  // Recharts monthly data
  const chartData = metrics.monthlyBreakdown.map((m) => ({
    name: m.monthName,
    Income: m.income,
    Expenses: m.expenses,
    Remaining: m.net > 0 ? m.net : 0
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Passport Status Header */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-800 border border-brand-200 dark:bg-brand-950/70 dark:text-brand-300 dark:border-brand-800/70">
              {occupation}
            </span>
            {isDemoMode && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Demo Profile
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-heading">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Here is your current money overview based on your recorded income, living expenses, and repayments.
          </p>

          {/* Profile Completion Bar */}
          <div className="pt-2 max-w-md">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
              <span>Profile Readiness</span>
              <strong className="text-slate-900 dark:text-white">{profileProgress}% Complete</strong>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 rounded-full transition-all duration-500"
                style={{ width: `${profileProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Passport Quick Card */}
        <div className="w-full md:w-auto flex-shrink-0 bg-slate-50 dark:bg-slate-800/90 rounded-xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row md:flex-col gap-3 min-w-[280px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Trust Passport
            </span>
            {passport ? (
              <Badge variant="success" size="sm">
                Active & Ready
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                Not Generated
              </Badge>
            )}
          </div>

          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {passport ? passport.incomeStabilityLabel : 'Add records to build'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>{passport ? `Last updated ${new Date(passport.updatedAt).toLocaleDateString()}` : 'Takes ~30 seconds'}</span>
              {trustScore && trustScore.status !== 'insufficient_data' && (
                <span className="font-semibold text-brand-700 dark:text-brand-400">• Trust Score: {trustScore.score}/100</span>
              )}
            </div>
          </div>

          <Link
            to={passport ? '/passport' : '/insights'}
            className="w-full py-2 px-3 text-center rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>{passport ? 'View My Passport' : 'Generate Passport'}</span>
          </Link>
        </div>
      </div>

      {/* Financial Trust Score & Personalized Tips Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FinancialTrustScoreCard
            trustScore={trustScore}
            onHowToImproveClick={handleScrollToTips}
          />
        </div>
        <div id="financial-tips-section" className="lg:col-span-1">
          <FinancialTipsCard tips={financialTips} />
        </div>
      </div>

      {/* Primary Key Figures Grid (INR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Income */}
        <Card className="hover:border-brand-200 dark:hover:border-brand-700 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              <SimpleExplainer
                term="Money Coming In"
                explanation="All earnings, freelance payments, stipends, and salary recorded in your account."
                example="Zepto gig payout, monthly web design retainer"
              />
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {formatINR(metrics.totalIncome)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span>Across {metrics.monthsTracked} month{metrics.monthsTracked === 1 ? '' : 's'}</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">({metrics.incomeConsistencyRating})</span>
          </div>
        </Card>

        {/* Total Expenses */}
        <Card className="hover:border-brand-200 dark:hover:border-brand-700 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              <SimpleExplainer
                term="Money Going Out"
                explanation="All living expenses, bills, rent, groceries, and debt payments you recorded."
                example="Hostel fee, coworking desk, mobile recharge"
              />
            </span>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {formatINR(metrics.totalExpenses)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>{metrics.expenseToIncomeRatio}% of recorded income</span>
          </div>
        </Card>

        {/* Amount Remaining */}
        <Card className="hover:border-brand-200 dark:hover:border-brand-700 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              <SimpleExplainer
                term="Money Left Over"
                explanation="The cash surplus remaining after paying all your expenses. Proves you do not overspend."
                example="Income minus living costs"
              />
            </span>
            <div className={`p-2 rounded-lg ${metrics.netRemaining >= 0 ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${metrics.netRemaining >= 0 ? 'text-brand-700 dark:text-brand-300' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatINR(metrics.netRemaining)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {metrics.netRemaining > 0 ? (
              <span className="text-brand-700 dark:text-brand-400 font-medium">Positive monthly cash cushion</span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 font-medium">Expenses currently exceed income</span>
            )}
          </div>
        </Card>

        {/* Repayment Regularity */}
        <Card className="hover:border-brand-200 dark:hover:border-brand-700 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              <SimpleExplainer
                term="On-Time Repayments"
                explanation="Tracks how consistently you pay rent, device EMIs, or loan obligations without missing dates."
                example="Laptop EMI, room rent paid before due date"
              />
            </span>
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {metrics.repaymentsCount} Recorded
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {metrics.repaymentsCount > 0 ? (
              <span className="text-teal-700 dark:text-teal-400 font-medium">{formatINR(metrics.repaymentsTotal)} paid on schedule</span>
            ) : (
              <span className="text-slate-400">Add bill/rent payments</span>
            )}
          </div>
        </Card>
      </div>

      {/* Main Charts & Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cashflow Chart (2 Cols) */}
        <div className="lg:col-span-2">
          <Card
            title="Money In vs. Money Out by Month"
            subtitle="Clear month-by-month cashflow history"
            action={
              <Link
                to="/my-money"
                className="text-xs font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-300 flex items-center gap-1"
              >
                <span>Manage Records</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {chartData.length > 0 ? (
              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1E293B' : '#E2E8F0'} />
                    <XAxis dataKey="name" stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} fontSize={12} tickLine={false} />
                    <YAxis stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} fontSize={12} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <Tooltip
                      formatter={(value: any) => [formatINR(Number(value) || 0), '']}
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#111827' : '#0F172A',
                        borderColor: theme === 'dark' ? '#334155' : 'transparent',
                        borderRadius: '8px',
                        color: '#FFF',
                        fontSize: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="Income" fill="#0D9488" radius={[4, 4, 0, 0]} name="Money In (Income)" />
                    <Bar dataKey="Expenses" fill={theme === 'dark' ? '#94A3B8' : '#64748B'} radius={[4, 4, 0, 0]} name="Money Out (Expenses)" />
                    <Bar dataKey="Remaining" fill="#14B8A6" radius={[4, 4, 0, 0]} name="Left Over (Savings)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">No monthly records yet</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Add your first income and expense entries in "My Money" to visualize your cashflow history.
                </p>
                <Link
                  to="/my-money"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add First Record</span>
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Action Panel & Advice Box */}
        <div className="space-y-6">
          <Card title="Quick Next Steps" subtitle="Actions that strengthen your passport">
            <div className="space-y-3">
              <Link
                to="/my-money"
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all group"
              >
                <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/60">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">Add New Record</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Log today's income, rent, or grocery payment in ₹ INR.
                  </p>
                </div>
              </Link>

              <Link
                to="/insights"
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all group"
              >
                <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/60">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">Run AI Clarity Analysis</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Get clear, plain-language feedback on your spending and cushion.
                  </p>
                </div>
              </Link>

              <Link
                to="/passport"
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all group"
              >
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">Share Financial Passport</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Generate an expiring, verifiable link to share with lenders or landlords.
                  </p>
                </div>
              </Link>
            </div>
          </Card>

          {/* Top Spending Categories Mini Card */}
          {metrics.topExpenseCategories.length > 0 && (
            <Card title="Where Money Goes" subtitle="Your top spending areas">
              <div className="space-y-3 pt-1">
                {metrics.topExpenseCategories.slice(0, 3).map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{cat.category}</span>
                      <strong className="text-slate-900 dark:text-white">{formatINR(cat.total)} ({cat.percentage}%)</strong>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-700 dark:bg-slate-300 rounded-full"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Financial Activity Section */}
      <Card
        title="Recent Financial Records"
        subtitle="Last 5 records entered into your account"
        action={
          <Link
            to="/my-money"
            className="text-xs font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-300 flex items-center gap-1"
          >
            <span>View All ({records.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {hasRecords ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="py-2.5 px-3 font-semibold">Date</th>
                  <th className="py-2.5 px-3 font-semibold">Type</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold">Description</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono">{r.recordDate}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <Badge
                        variant={
                          r.recordType === 'Income'
                            ? 'success'
                            : r.recordType === 'Savings'
                            ? 'info'
                            : r.recordType === 'Repayment'
                            ? 'brand'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {r.recordType}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">{r.category}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{r.description || '—'}</td>
                    <td className="py-3 px-3 text-right font-bold whitespace-nowrap text-slate-900 dark:text-white">
                      {r.recordType === 'Income' ? '+' : '-'}
                      {formatINR(r.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 px-4 space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No transactions entered yet. Start adding your income and expenses to unlock your Financial Trust Score and Passport.
            </p>
            <Link
              to="/my-money"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add First Financial Record</span>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};
