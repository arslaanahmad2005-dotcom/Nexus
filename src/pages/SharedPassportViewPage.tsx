import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Clock,
  Printer,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SharedPassportView } from '../types';
import { formatINR } from '../lib/calculations';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const SharedPassportViewPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [passportView, setPassportView] = useState<SharedPassportView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<{
    code: 'REVOKED' | 'EXPIRED' | 'NOT_FOUND' | 'SERVER_ERROR';
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchSharedPassport = async () => {
      if (!token) {
        setErrorState({ code: 'NOT_FOUND', message: 'No share token provided.' });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/passport/shared/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setErrorState({
            code: data.error || 'SERVER_ERROR',
            message: data.message || 'Unable to display shared passport.'
          });
        } else {
          setPassportView(data.passport);
        }
      } catch (err: any) {
        setErrorState({
          code: 'SERVER_ERROR',
          message: 'Unable to connect to the verification server.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedPassport();
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-500 font-medium">Verifying cryptographic share token...</p>
      </div>
    );
  }

  // Error States (Revoked / Expired / Not Found)
  if (errorState) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-card">
          <div
            className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
              errorState.code === 'REVOKED'
                ? 'bg-rose-50 text-rose-600'
                : errorState.code === 'EXPIRED'
                ? 'bg-amber-50 text-amber-600'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {errorState.code === 'REVOKED' ? (
              <Lock className="w-7 h-7" />
            ) : errorState.code === 'EXPIRED' ? (
              <Clock className="w-7 h-7" />
            ) : (
              <AlertTriangle className="w-7 h-7" />
            )}
          </div>

          <h2 className="text-xl font-bold text-navy-900 font-heading">
            {errorState.code === 'REVOKED' && 'Access Revoked by Owner'}
            {errorState.code === 'EXPIRED' && 'Share Link Has Expired'}
            {errorState.code === 'NOT_FOUND' && 'Passport Link Not Found'}
            {errorState.code === 'SERVER_ERROR' && 'Unable to Load Passport'}
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed">{errorState.message}</p>

          <div className="pt-4 border-t border-slate-100">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-slate-800 transition-colors"
            >
              <span>Go to NEXUS Home</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!passportView) return null;

  const { includedFields, passportData } = passportView;
  const metrics = passportData.metrics;
  const insights = passportData.insights;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner (No-print) */}
      <div className="no-print bg-slate-100 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Badge variant="success" size="sm">
            Verified Active Link
          </Badge>
          <span className="text-slate-600">
            Shared with: <strong className="text-navy-900">{passportView.recipientLabel}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-[11px] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Expires {new Date(passportView.expiresAt).toLocaleDateString()}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-3.5 h-3.5" />}>
            Print / Save
          </Button>
        </div>
      </div>

      {/* THE VERIFIED PASSPORT ARTIFACT */}
      <div className="passport-container bg-white rounded-2xl border border-slate-300 shadow-card overflow-hidden">
        {/* Header */}
        <div className="bg-navy-900 text-white p-6 sm:p-8 border-b-4 border-brand-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold font-heading">NEXUS</span>
                  <span className="text-xs uppercase tracking-widest text-brand-300 font-semibold px-2 py-0.5 rounded bg-brand-900/60 border border-brand-500/30">
                    VERIFIED PASSPORT VIEW
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  User-authorized presentation of financial habits
                </p>
              </div>
            </div>

            <div className="sm:text-right text-xs text-slate-400">
              <div>Verification Share Token</div>
              <div className="font-mono text-brand-300 font-semibold text-[11px]">{token?.slice(0, 16)}...</div>
            </div>
          </div>
        </div>

        {/* Profile Attributes */}
        <div className="bg-slate-50 p-6 border-b border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold block">
                Passport Holder
              </span>
              <strong className="text-navy-900 text-sm font-bold block mt-0.5">
                {passportView.ownerName}
              </strong>
              <span className="text-slate-500 text-[11px]">{passportView.ownerOccupation}</span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold block">
                Income Stability
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {passportView.incomeStabilityLabel}
              </span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold block">
                Repayment Discipline
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-brand-800 bg-brand-50 px-2 py-0.5 rounded-full mt-1 border border-brand-200">
                <CheckCircle2 className="w-3 h-3 text-brand-600" />
                {passportView.repaymentDisciplineLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Content Section based on permitted included fields */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* 1. Cashflow totals (if permitted) */}
          {includedFields.includes('summary') && metrics.totalIncome !== undefined && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                1. Authorized Cashflow Totals
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Inflow</span>
                  <div className="text-lg font-bold text-navy-900 mt-0.5">
                    {formatINR(metrics.totalIncome || 0)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Outflow</span>
                  <div className="text-lg font-bold text-navy-900 mt-0.5">
                    {formatINR(metrics.totalExpenses || 0)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Net Cash Cushion</span>
                  <div className="text-lg font-bold text-brand-900 mt-0.5">
                    {formatINR(metrics.netRemaining || 0)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. On-Time Repayment Records (if permitted) */}
          {includedFields.includes('repayments') && metrics.repaymentsCount !== undefined && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                2. Repayment History & Discipline
              </h3>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <strong className="text-navy-900 block font-bold text-sm">
                    {metrics.repaymentsCount} Scheduled Payments Completed
                  </strong>
                  <span className="text-slate-500">
                    Totaling {formatINR(metrics.repaymentsTotal || 0)} in on-time EMIs/rent with 0 defaults.
                  </span>
                </div>
                <Badge variant="success" size="md">
                  100% Track Record
                </Badge>
              </div>
            </div>
          )}

          {/* 3. AI Behavioral Observations */}
          {insights.summary && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                3. Financial Habit Observations
              </h3>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                <p className="text-slate-800 leading-relaxed font-medium">"{insights.summary}"</p>
                {insights.positiveIndicators && insights.positiveIndicators.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {insights.positiveIndicators.map((pos, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{pos}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Actionable Suggestions (if included) */}
          {includedFields.includes('actionable_suggestions') &&
            insights.actionableSuggestions &&
            insights.actionableSuggestions.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  4. Recommended Next Steps
                </h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  {insights.actionableSuggestions.map((sug, idx) => (
                    <div key={idx} className="text-slate-700">
                      • {sug}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Verification Disclaimer */}
          <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 space-y-1 leading-relaxed">
            <div className="font-semibold text-slate-600 uppercase tracking-wider">
              VERIFICATION NOTICE & TERMS
            </div>
            <p>{passportView.disclaimer}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
