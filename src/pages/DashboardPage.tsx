import React from 'react';
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
import { formatINR } from '../lib/calculations';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { SimpleExplainer } from '../components/common/SimpleExplainer';

export const DashboardPage: React.FC = () => {
  const { profile, isDemoMode, currentDemoPersona } = useAuth();
  const { records, metrics, passport } = useFinancial();
  const navigate = useNavigate();

  const userName = profile?.fullName || (isDemoMode ? currentDemoPersona?.name : 'Friend');
  const occupation = profile?.occupation || (isDemoMode ? currentDemoPersona?.profile.occupation : 'Member');

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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-800 border border-brand-200">
              {occupation}
            </span>
            {isDemoMode && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                Demo Profile
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-heading">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-slate-500 max-w-xl">
            Here is your current money overview based on your recorded income, living expenses, and repayments.
          </p>

          {/* Profile Completion Bar */}
          <div className="pt-2 max-w-md">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
              <span>Profile Readiness</span>
              <strong className="text-navy-900">{profileProgress}% Complete</strong>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 rounded-full transition-all duration-500"
                style={{ width: `${profileProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Passport Quick Card */}
        <div className="w-full md:w-auto flex-shrink-0 bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row md:flex-col gap-3 min-w-[280px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
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
            <div className="text-sm font-bold text-navy-900">
              {passport ? passport.incomeStabilityLabel : 'Add records to build'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {passport ? `Last updated ${new Date(passport.updatedAt).toLocaleDateString()}` : 'Takes ~30 seconds'}
            </div>
          </div>

          <Link
            to={passport ? '/passport' : '/insights'}
            className="w-full py-2 px-3 text-center rounded-lg bg-navy-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>{passport ? 'View My Passport' : 'Generate Passport'}</span>
          </Link>
        </div>
      </div>

      {/* Primary Key Figures Grid (INR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Income */}
        <Card className="hover:border-brand-200 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              <SimpleExplainer
                term="Money Coming In"
                explanation="All earnings, freelance payments, stipends, and salary recorded in your account."
                example="Zepto gig payout, monthly web design retainer"
              />
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-900 tracking-tight">
            {formatINR(metrics.totalIncome)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>Across {metrics.monthsTracked} month{metrics.monthsTracked === 1 ? '' : 's'}</span>
            <span className="text-emerald-700 font-medium">({metrics.incomeConsistencyRating})</span>
          </div>
        </Card>

        {/* Total Expenses */}
        <Card className="hover:border-brand-200 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              <SimpleExplainer
                term="Money Going Out"
                explanation="All living expenses, bills, rent, groceries, and debt payments you recorded."
                example="Hostel fee, coworking desk, mobile recharge"
              />
            </span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-900 tracking-tight">
            {formatINR(metrics.totalExpenses)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span>{metrics.expenseToIncomeRatio}% of recorded income</span>
          </div>
        </Card>

        {/* Amount Remaining */}
        <Card className="hover:border-brand-200 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              <SimpleExplainer
                term="Money Left Over"
                explanation="The cash surplus remaining after paying all your expenses. Proves you do not overspend."
                example="Income minus living costs"
              />
            </span>
            <div className={`p-2 rounded-lg ${metrics.netRemaining >= 0 ? 'bg-brand-50 text-brand-700' : 'bg-rose-50 text-rose-700'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${metrics.netRemaining >= 0 ? 'text-brand-900' : 'text-rose-600'}`}>
            {formatINR(metrics.netRemaining)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics.netRemaining > 0 ? (
              <span className="text-brand-700 font-medium">Positive monthly cash cushion</span>
            ) : (
              <span className="text-rose-600 font-medium">Expenses currently exceed income</span>
            )}
          </div>
        </Card>

        {/* Repayment Regularity */}
        <Card className="hover:border-brand-200 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              <SimpleExplainer
                term="On-Time Repayments"
                explanation="Tracks how consistently you pay rent, device EMIs, or loan obligations without missing dates."
                example="Laptop EMI, room rent paid before due date"
              />
            </span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-900 tracking-tight">
            {metrics.repaymentsCount} Recorded
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics.repaymentsCount > 0 ? (
              <span className="text-teal-700 font-medium">{formatINR(metrics.repaymentsTotal)} paid on schedule</span>
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
                className="text-xs font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1"
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={12} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <Tooltip
                      formatter={(value: any) => [formatINR(Number(value) || 0), '']}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '8px',
                        color: '#FFF',
                        fontSize: '12px',
                        border: 'none'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="Income" fill="#0D9488" radius={[4, 4, 0, 0]} name="Money In (Income)" />
                    <Bar dataKey="Expenses" fill="#64748B" radius={[4, 4, 0, 0]} name="Money Out (Expenses)" />
                    <Bar dataKey="Remaining" fill="#14B8A6" radius={[4, 4, 0, 0]} name="Left Over (Savings)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-navy-900">No monthly records yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Add your first income and expense entries in "My Money" to visualize your cashflow history.
                </p>
                <Link
                  to="/my-money"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy-900 text-white text-xs font-semibold"
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
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-brand-400 hover:bg-slate-50 transition-all group"
              >
                <div className="p-2 rounded-lg bg-brand-50 text-brand-700 group-hover:bg-brand-100">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-navy-900">Add New Record</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Log today's income, rent, or grocery payment in ₹ INR.
                  </p>
                </div>
              </Link>

              <Link
                to="/insights"
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-brand-400 hover:bg-slate-50 transition-all group"
              >
                <div className="p-2 rounded-lg bg-teal-50 text-teal-700 group-hover:bg-teal-100">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-navy-900">Run AI Clarity Analysis</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Get clear, plain-language feedback on your spending and cushion.
                  </p>
                </div>
              </Link>

              <Link
                to="/passport"
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-brand-400 hover:bg-slate-50 transition-all group"
              >
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-200">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-navy-900">Share Financial Passport</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
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
                      <span className="font-medium text-slate-700">{cat.category}</span>
                      <strong className="text-navy-900">{formatINR(cat.total)} ({cat.percentage}%)</strong>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-700 rounded-full"
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
            className="text-xs font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1"
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
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Description</th>
                  <th className="pb-3 font-semibold text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 text-slate-500 whitespace-nowrap">{r.recordDate}</td>
                    <td className="py-3 whitespace-nowrap">
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
                    <td className="py-3 font-medium text-navy-900 whitespace-nowrap">{r.category}</td>
                    <td className="py-3 text-slate-600 max-w-xs truncate">{r.description || '—'}</td>
                    <td className="py-3 text-right font-bold whitespace-nowrap text-navy-900">
                      {r.recordType === 'Income' ? '+' : '-'}
                      {formatINR(r.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500">
            No transactions entered yet. Click "Add First Record" above.
          </div>
        )}
      </Card>
    </div>
  );
};
