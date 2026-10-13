import React, { useState } from 'react';
import {
  ShieldCheck,
  FileCheck2,
  Share2,
  Printer,
  RefreshCw,
  Copy,
  CheckCircle2,
  Lock,
  ExternalLink,
  Trash2,
  Calendar,
  AlertTriangle,
  Lightbulb,
  FileQuestion,
  Info,
  Clock,
  Eye,
  Sparkles
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../lib/calculations';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

export const PassportPage: React.FC = () => {
  const { profile } = useAuth();
  const {
    passport,
    generatePassport,
    isGeneratingPassport,
    shareLinks,
    createShareLink,
    revokeShareLink,
    isSharingPassport,
    trustScore
  } = useFinancial();

  // Sharing Modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [recipientLabel, setRecipientLabel] = useState('');
  const [expiresInHours, setExpiresInHours] = useState(72);
  const [includedFields, setIncludedFields] = useState<
    ('summary' | 'income_consistency' | 'expense_breakdown' | 'repayments' | 'actionable_suggestions' | 'trust_score')[]
  >(['summary', 'income_consistency', 'repayments', 'actionable_suggestions', 'trust_score']);

  // Newly generated link modal / copy state
  const [latestShareUrl, setLatestShareUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateOrRefresh = async () => {
    const res = await generatePassport();
    if (res) {
      showToast('Financial Trust Passport updated successfully.');
    }
  };

  const handleCreateShareLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createShareLink({
      recipientLabel: recipientLabel.trim() || 'General Verification',
      includedFields,
      expiresInHours
    });

    if (result) {
      setLatestShareUrl(result.shareUrl);
      setIsShareModalOpen(false);
      showToast('Share link generated.');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRevoke = async (id: string, token: string) => {
    setRevokingId(id);
    const ok = await revokeShareLink(id, token);
    setRevokingId(null);
    if (ok) {
      showToast('Share link revoked immediately.');
    }
  };

  const toggleField = (field: any) => {
    if (includedFields.includes(field)) {
      setIncludedFields(includedFields.filter((f) => f !== field));
    } else {
      setIncludedFields([...includedFields, field]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-brand-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Action Bar (hidden in print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-heading">
            Financial Trust Passport
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            A comprehensive, verifiable financial identity document ready to present or share.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print / Save PDF
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={isGeneratingPassport}
            onClick={handleGenerateOrRefresh}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Passport
          </Button>

          {passport && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsShareModalOpen(true)}
              leftIcon={<Share2 className="w-3.5 h-3.5" />}
            >
              Share My Passport
            </Button>
          )}
        </div>
      </div>

      {/* Latest Share Link Alert if created just now */}
      {latestShareUrl && (
        <div className="no-print p-4 rounded-xl bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 text-brand-900 dark:text-brand-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-brand-950 dark:text-brand-100">
              <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Secure Share Link Generated</span>
            </div>
            <div className="text-slate-600 dark:text-slate-300 break-all font-mono text-[11px]">
              {latestShareUrl}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => handleCopy(latestShareUrl)}
              className="px-3 py-1.5 rounded-lg bg-navy-900 dark:bg-brand-600 text-white font-semibold hover:bg-slate-800 dark:hover:bg-brand-500 transition-colors flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <a
              href={latestShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open View</span>
            </a>
          </div>
        </div>
      )}

      {/* THE FINANCIAL TRUST PASSPORT CARD (Printed Document Container) */}
      {passport ? (
        <div className="passport-container bg-white dark:bg-[#111827] rounded-2xl border border-slate-300 dark:border-slate-800 shadow-card overflow-hidden">
          {/* Official Passport Header Banner */}
          <div className="bg-navy-900 text-white p-6 sm:p-8 border-b-4 border-brand-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-heading tracking-wide">NEXUS</span>
                    <span className="text-xs uppercase tracking-widest text-brand-300 font-semibold px-2 py-0.5 rounded bg-brand-900/60 border border-brand-500/30">
                      FINANCIAL TRUST PASSPORT
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Alternative Financial Identity & Cashflow Verification Record
                  </p>
                </div>
              </div>

              <div className="sm:text-right">
                <div className="text-xs text-slate-400">Passport Document ID</div>
                <div className="text-xs font-mono text-brand-300 font-semibold">{passport.id}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Issued: {new Date(passport.createdAt).toLocaleDateString()} • v{passport.version}.0
                </div>
              </div>
            </div>
          </div>

          {/* Member Profile & Trust Indicators Bar */}
          {(() => {
            const displayScore = passport.trustScore || trustScore;
            return (
              <div className="bg-slate-50 dark:bg-slate-800/80 p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold block">
                      Passport Holder
                    </span>
                    <strong className="text-navy-900 dark:text-white text-sm font-bold block mt-0.5">
                      {passport.userName}
                    </strong>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">{passport.occupation}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold block">
                      Trust Score
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-brand-800 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/70 px-2 py-0.5 rounded-full mt-1 border border-brand-200 dark:border-brand-800/70">
                      <ShieldCheck className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                      {displayScore && displayScore.status !== 'insufficient_data' ? `${displayScore.score}/100` : 'Awaiting Data'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold block">
                      Income Stability
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full mt-1 border border-emerald-200 dark:border-emerald-800/70">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      {passport.incomeStabilityLabel}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold block">
                      Repayment Record
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-brand-800 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/70 px-2 py-0.5 rounded-full mt-1 border border-brand-200 dark:border-brand-800/70">
                      <CheckCircle2 className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                      {passport.repaymentDisciplineLabel}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold block">
                      Profile Completeness
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <strong className="text-navy-900 dark:text-white text-sm">{passport.profileCompleteness}%</strong>
                      <div className="h-2 w-20 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-600 rounded-full"
                          style={{ width: `${passport.profileCompleteness}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Cashflow & Metrics Ledger Grid */}
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                1. Certified Cashflow Summary (Rupees INR)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Recorded Inflow</span>
                  <div className="text-lg font-bold text-navy-900 dark:text-white mt-0.5">
                    {formatINR(passport.metrics.totalIncome)}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{passport.metrics.monthsTracked} months history</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Living Outflow</span>
                  <div className="text-lg font-bold text-navy-900 dark:text-white mt-0.5">
                    {formatINR(passport.metrics.totalExpenses)}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{passport.metrics.expenseToIncomeRatio}% outflow ratio</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Net Cash Cushion</span>
                  <div className="text-lg font-bold text-brand-900 dark:text-brand-300 mt-0.5">
                    {formatINR(passport.metrics.netRemaining)}
                  </div>
                  <span className="text-[10px] text-brand-700 dark:text-brand-400 font-medium">Positive monthly buffer</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Verified Repayments</span>
                  <div className="text-lg font-bold text-emerald-800 dark:text-emerald-400 mt-0.5">
                    {passport.metrics.repaymentsCount} Records
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">Zero default events</span>
                </div>
              </div>
            </div>

            {/* 2. Financial Trust Score Assessment */}
            {(() => {
              const displayScore = passport.trustScore || trustScore;
              if (!displayScore || displayScore.status === 'insufficient_data') return null;
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      2. Certified Financial Trust Score (0–100 Scale)
                    </h3>
                    <Badge variant={displayScore.status === 'provisional' ? 'warning' : 'success'} size="sm">
                      {displayScore.status === 'provisional' ? 'Provisional Model' : 'Verified Model (v1.0)'}
                    </Badge>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shadow-xs flex-shrink-0">
                          <span className="text-xl font-black text-slate-900 dark:text-white">{displayScore.score}</span>
                          <span className="text-[9px] text-slate-400 -mt-0.5 font-medium">/ 100</span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{displayScore.label}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed max-w-lg">
                            Alternative creditworthiness calculated across income regularity, savings discipline, scheduled bill repayments, and living expense ratios.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 4 Pillars Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">
                          Income Consistency
                        </span>
                        <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                          {displayScore.breakdown.incomeConsistency.score} / 30
                        </div>
                        <span className="text-[10px] text-brand-700 dark:text-brand-400 font-medium block truncate">
                          {displayScore.breakdown.incomeConsistency.rating}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">
                          Savings Habits
                        </span>
                        <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                          {displayScore.breakdown.savingsHabits.score} / 25
                        </div>
                        <span className="text-[10px] text-teal-700 dark:text-teal-400 font-medium block truncate">
                          {displayScore.breakdown.savingsHabits.rating}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">
                          Repayment History
                        </span>
                        <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                          {displayScore.breakdown.repaymentHistory.score} / 25
                        </div>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium block truncate">
                          {displayScore.breakdown.repaymentHistory.rating}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">
                          Expense Ratio
                        </span>
                        <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                          {displayScore.breakdown.expenseManagement.score} / 20
                        </div>
                        <span className="text-[10px] text-slate-700 dark:text-slate-300 font-medium block truncate">
                          {displayScore.breakdown.expenseManagement.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* AI Clarity & Behavioral Explanations */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                3. AI Behavioral Analysis & Habit Observations
              </h3>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  "{passport.aiInsights.summary}"
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Demonstrated Disciplines
                    </h4>
                    <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                      {passport.aiInsights.positiveIndicators.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Points to Monitor
                    </h4>
                    <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                      {passport.aiInsights.areasForAttention.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Categories & Supporting Records Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  3. Expense Distribution
                </h3>
                <div className="space-y-2 text-xs">
                  {passport.metrics.topExpenseCategories.slice(0, 3).map((cat) => (
                    <div
                      key={cat.category}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
                    >
                      <span className="text-slate-700 dark:text-slate-300">{cat.category}</span>
                      <strong className="text-navy-900 dark:text-white">
                        {formatINR(cat.total)} ({cat.percentage}%)
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  4. Supporting Records Status
                </h3>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Uploaded Supporting Proofs:</span>
                    <strong className="text-navy-900 dark:text-white">
                      {passport.supportingDocsSummary.totalUploaded} File{passport.supportingDocsSummary.totalUploaded === 1 ? '' : 's'}
                    </strong>
                  </div>
                  {passport.supportingDocsSummary.types.length > 0 && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Included Types: {passport.supportingDocsSummary.types.join(', ')}
                    </div>
                  )}
                  <div className="text-[11px] text-brand-700 dark:text-brand-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                    Status: User-submitted financial records with deterministic calculation audit.
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Watermark & Legal Disclaimer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 dark:text-slate-500 space-y-1 leading-relaxed">
              <div className="flex items-center justify-between font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <span>NEXUS ASSESSMENT SEAL</span>
                <span>AUTHENTICATED DIGITAL ARTIFACT</span>
              </div>
              <p>
                <strong>Statutory Notice:</strong> This Financial Trust Passport is compiled strictly from user-provided ledger entries for financial evaluation and demonstration purposes. It does not constitute a statutory CIBIL/Experian credit bureau score or a guaranteed loan sanction. Financial institutions should verify supporting documents in accordance with standard lending policies.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <Card className="text-center py-16 px-4 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 mx-auto flex items-center justify-center">
            <FileCheck2 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
              No Passport Generated Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Click below to compile your recorded income, expenses, and AI behavioral analysis into your Financial Trust Passport.
            </p>
          </div>
          <div>
            <Button
              type="button"
              variant="primary"
              isLoading={isGeneratingPassport}
              onClick={handleGenerateOrRefresh}
              leftIcon={<Sparkles className="w-4 h-4 text-brand-300" />}
            >
              Generate Financial Passport
            </Button>
          </div>
        </Card>
      )}

      {/* ACTIVE SHARE LINKS MANAGER SECTION (No-print) */}
      <div className="no-print space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
              Active Passport Share Links
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Anyone with an active link can only view the fields you chose. You can revoke access at any second.
            </p>
          </div>
          {passport && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsShareModalOpen(true)}
              leftIcon={<Share2 className="w-3.5 h-3.5" />}
            >
              Create New Link
            </Button>
          )}
        </div>

        {shareLinks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shareLinks.map((link) => {
              const isExpired = new Date(link.expiresAt) < new Date();
              const fullUrl = `${window.location.origin}/passport/shared/${link.shareToken}`;

              return (
                <Card key={link.id} className="text-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-navy-900 dark:text-white text-sm">
                        {link.recipientLabel || 'Public Share Link'}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        Created {new Date(link.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {link.isRevoked ? (
                      <Badge variant="danger" size="sm">
                        Revoked
                      </Badge>
                    ) : isExpired ? (
                      <Badge variant="warning" size="sm">
                        Expired
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm">
                        Active & Accessible
                      </Badge>
                    )}
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                    <span className="truncate">{fullUrl}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(fullUrl)}
                      className="p-1 hover:text-navy-900 dark:hover:text-white flex-shrink-0"
                      title="Copy link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Expires: {new Date(link.expiresAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-700 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-300 font-semibold flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                      </a>

                      {!link.isRevoked && !isExpired && (
                        <button
                          type="button"
                          disabled={revokingId === link.id}
                          onClick={() => handleRevoke(link.id, link.shareToken)}
                          className="text-rose-600 dark:text-rose-400 hover:text-rose-800 font-semibold flex items-center gap-1 ml-2"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{revokingId === link.id ? 'Revoking...' : 'Revoke'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
            You have not shared your passport with anyone yet.
          </Card>
        )}
      </div>

      {/* SHARE MY PASSPORT MODAL (Section 11 Consent-Based Sharing) */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Share My Financial Passport"
        subtitle="Configure exactly what information the recipient can view and set an expiration."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateShareLink} className="space-y-4 text-xs">
          {/* Recipient Label */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Who are you sharing this with? (Recipient Label)
            </label>
            <input
              type="text"
              required
              value={recipientLabel}
              onChange={(e) => setRecipientLabel(e.target.value)}
              placeholder="e.g. HDFC Loan Officer, Co-living Landlord, Client Proposal"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Expiration Period */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Link Expiration Period
            </label>
            <select
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value={24}>24 Hours (1 Day)</option>
              <option value={72}>72 Hours (3 Days — Recommended)</option>
              <option value={168}>7 Days (1 Week)</option>
              <option value={720}>30 Days (1 Month)</option>
            </select>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Once expired, the public link immediately returns an access denied screen.
            </p>
          </div>

          {/* Information to Include Checkboxes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Select Information to Include
            </label>
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includedFields.includes('summary')}
                  onChange={() => toggleField('summary')}
                  className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  Financial Inflow & Outflow Totals (Income vs. Expenses)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includedFields.includes('income_consistency')}
                  onChange={() => toggleField('income_consistency')}
                  className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  Income Consistency Score & Monthly Cashflow History
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includedFields.includes('repayments')}
                  onChange={() => toggleField('repayments')}
                  className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  On-Time Repayment Records (EMIs, Rent & Bill Payments)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includedFields.includes('expense_breakdown')}
                  onChange={() => toggleField('expense_breakdown')}
                  className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  Detailed Expense Categories Breakdown
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includedFields.includes('trust_score')}
                  onChange={() => toggleField('trust_score')}
                  className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  Financial Trust Score & 4-Pillar Breakdown (Income, Savings, Repayment, Expense)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includedFields.includes('actionable_suggestions')}
                  onChange={() => toggleField('actionable_suggestions')}
                  className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  AI Practical Financial Suggestions
                </span>
              </label>
            </div>
          </div>

          {/* Consent note */}
          <div className="p-3 bg-brand-50/70 dark:bg-brand-950/50 border border-brand-200/80 dark:border-brand-800/60 rounded-lg text-[11px] text-brand-900 dark:text-brand-200 leading-relaxed">
            <Lock className="w-3.5 h-3.5 inline text-brand-700 dark:text-brand-400 mr-1" />
            <strong>Cryptographic Token Security:</strong> A random 256-bit crypto token is created and stored as a hash. Raw uploaded documents and private user database IDs are never revealed to viewers.
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsShareModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSharingPassport}
              leftIcon={<Share2 className="w-3.5 h-3.5" />}
            >
              Generate Share Link
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
