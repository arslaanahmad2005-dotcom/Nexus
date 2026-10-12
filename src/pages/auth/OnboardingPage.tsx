import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Lock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinancial } from '../../context/FinancialContext';
import { OccupationType } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const OnboardingPage: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const { grantConsent } = useFinancial();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 state
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [occupation, setOccupation] = useState<OccupationType>(profile?.occupation || 'Freelancer');
  const [monthlyIncomeRange, setMonthlyIncomeRange] = useState(profile?.monthlyIncomeRange || '₹25,000 - ₹50,000');
  const [location, setLocation] = useState(profile?.location || 'Pune, India');

  // Step 2 state (selected record sources)
  const [recordSources, setRecordSources] = useState({
    manualIncomeExpense: true,
    savingsInfo: true,
    repaymentRecords: true,
    documentUpload: false
  });

  // Step 3 state (consents)
  const [consentsState, setConsentsState] = useState({
    storeRecords: true,
    aiAnalysisConsent: true,
    sharingControlAcknowledged: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = async () => {
    setIsSubmitting(true);
    await updateProfile({
      fullName,
      occupation,
      monthlyIncomeRange,
      location,
      onboardingCompleted: true
    });

    grantConsent('financialAnalysis');
    grantConsent('passportSharing');
    grantConsent('dataStorage');

    setIsSubmitting(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      {/* Stepper Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
          <span>STEP {step} OF 3</span>
          <span>
            {step === 1 && 'About You'}
            {step === 2 && 'Your Information Sources'}
            {step === 3 && 'Privacy & Consent'}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <Card>
        {/* Step 1: Tell us about yourself */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <div className="inline-flex p-2 rounded-lg bg-brand-50 text-brand-700 mb-2">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-navy-900 font-heading">Tell us about yourself</h2>
              <p className="text-xs text-slate-500 mt-1">
                This helps us frame your financial habits in the proper context (e.g. freelance earnings vs. student living).
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Occupation
                </label>
                <select
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value as OccupationType)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="Freelancer">Freelancer / Independent Creator</option>
                  <option value="Student">Student / College Learner</option>
                  <option value="Gig Worker">Gig Worker (Delivery / Rideshare)</option>
                  <option value="Small Business Owner">Small Business Owner / Merchant</option>
                  <option value="Salaried">Salaried (First-time borrower)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Typical Monthly Income Range
                </label>
                <select
                  value={monthlyIncomeRange}
                  onChange={(e) => setMonthlyIncomeRange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="Under ₹15,000">Under ₹15,000 / month</option>
                  <option value="₹15,000 - ₹30,000">₹15,000 - ₹30,000 / month</option>
                  <option value="₹30,000 - ₹60,000">₹30,000 - ₹60,000 / month</option>
                  <option value="₹60,000 - ₹1,00,000">₹60,000 - ₹1,00,000 / month</option>
                  <option value="Above ₹1,00,000">Above ₹1,00,000 / month</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  City / Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Pune, Maharashtra"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Skip for now
              </button>
              <Button
                type="button"
                variant="primary"
                onClick={() => setStep(2)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Choose financial information sources */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <div className="inline-flex p-2 rounded-lg bg-brand-50 text-brand-700 mb-2">
                <Wallet className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-navy-900 font-heading">
                Choose your financial information sources
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                You can add records manually or upload supporting receipts. Select what you would like to start with.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:border-brand-400 bg-slate-50/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={recordSources.manualIncomeExpense}
                  onChange={(e) =>
                    setRecordSources({ ...recordSources, manualIncomeExpense: e.target.checked })
                  }
                  className="mt-1 h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                />
                <div>
                  <div className="text-sm font-semibold text-navy-900">
                    Income and expense records (Manual)
                  </div>
                  <p className="text-xs text-slate-500">
                    Record your earnings, client invoices, grocery spending, and daily costs.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:border-brand-400 bg-slate-50/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={recordSources.repaymentRecords}
                  onChange={(e) =>
                    setRecordSources({ ...recordSources, repaymentRecords: e.target.checked })
                  }
                  className="mt-1 h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                />
                <div>
                  <div className="text-sm font-semibold text-navy-900">
                    Repayment records (Rent, bills, EMIs)
                  </div>
                  <p className="text-xs text-slate-500">
                    Proves you honor commitments consistently on time without default.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:border-brand-400 bg-slate-50/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={recordSources.savingsInfo}
                  onChange={(e) =>
                    setRecordSources({ ...recordSources, savingsInfo: e.target.checked })
                  }
                  className="mt-1 h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                />
                <div>
                  <div className="text-sm font-semibold text-navy-900">
                    Emergency savings & recurring deposits
                  </div>
                  <p className="text-xs text-slate-500">
                    Demonstrates an emergency cushion for unexpected costs.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:border-brand-400 bg-slate-50/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={recordSources.documentUpload}
                  onChange={(e) =>
                    setRecordSources({ ...recordSources, documentUpload: e.target.checked })
                  }
                  className="mt-1 h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                />
                <div>
                  <div className="text-sm font-semibold text-navy-900">
                    Supporting documents (Optional)
                  </div>
                  <p className="text-xs text-slate-500">
                    Upload freelance contracts, invoices, or utility bill receipts later.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => setStep(3)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Privacy and Consent */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <div className="inline-flex p-2 rounded-lg bg-brand-50 text-brand-700 mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-navy-900 font-heading">
                Privacy, transparency & consent
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                We believe financial trust must be built on total user consent. Please review how NEXUS protects your information.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-navy-900 block font-semibold">What is stored:</strong>
                  Only the income, expense, and repayment entries you explicitly enter. We never ask for bank net-banking passwords or OTPs.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-navy-900 block font-semibold">AI analysis clarity:</strong>
                  Our server-side AI analyzes only minimum necessary summaries. It never invents transactions or generates fake credit ratings.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-navy-900 block font-semibold">You control sharing:</strong>
                  Your Financial Trust Passport is private by default. You decide whether to create an expiring share link, and you can revoke it at any second.
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentsState.aiAnalysisConsent}
                  onChange={(e) =>
                    setConsentsState({ ...consentsState, aiAnalysisConsent: e.target.checked })
                  }
                  className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                />
                <span className="text-xs text-slate-700 font-medium">
                  I give permission for NEXUS to analyze my entered financial records to generate my Financial Trust Passport.
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentsState.sharingControlAcknowledged}
                  onChange={(e) =>
                    setConsentsState({
                      ...consentsState,
                      sharingControlAcknowledged: e.target.checked
                    })
                  }
                  className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                />
                <span className="text-xs text-slate-700 font-medium">
                  I understand that NEXUS is an assessment platform, not an official credit bureau, and does not guarantee loan approval.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                isLoading={isSubmitting}
                onClick={handleFinish}
                rightIcon={<Sparkles className="w-4 h-4" />}
              >
                Complete Onboarding
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
