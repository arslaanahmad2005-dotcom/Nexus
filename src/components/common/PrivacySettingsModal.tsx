import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinancial } from '../../context/FinancialContext';
import { Modal } from './Modal';
import { Button } from './Button';

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, isDemoMode, deleteAccount } = useAuth();
  const { records, passport, documents } = useFinancial();
  const navigate = useNavigate();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleExportData = () => {
    const exportPayload = {
      exportDate: new Date().toISOString(),
      platform: 'NEXUS — Financial Identity & Trust Network',
      profile: {
        fullName: profile?.fullName || 'User',
        occupation: profile?.occupation || 'Freelancer',
        monthlyIncomeRange: profile?.monthlyIncomeRange || '',
        location: profile?.location || ''
      },
      financialLedger: records,
      passportSummary: passport ? {
        id: passport.id,
        headline: passport.passportHeadline,
        stability: passport.incomeStabilityLabel,
        metrics: passport.metrics
      } : null,
      documentsCount: documents.length
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-financial-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    const result = await deleteAccount();
    setIsDeleting(false);

    if (result.success) {
      onClose();
      navigate('/');
    } else {
      setDeleteError(result.error || 'Failed to delete account. Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Privacy & Account Settings"
      subtitle="Manage your personal data, export records, or permanently delete your account."
      maxWidth="lg"
    >
      <div className="space-y-6 text-xs text-slate-600 dark:text-slate-300">
        {/* User Data Summary */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center gap-2 text-navy-900 dark:text-white font-semibold">
            <UserCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Active Financial Identity</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <div>
              <span>Member: </span>
              <strong className="text-slate-800 dark:text-slate-200">{profile?.fullName || 'Nexus Member'}</strong>
            </div>
            <div>
              <span>Occupation: </span>
              <strong className="text-slate-800 dark:text-slate-200">{profile?.occupation || 'Freelancer'}</strong>
            </div>
            <div>
              <span>Recorded Ledger Entries: </span>
              <strong className="text-slate-800 dark:text-slate-200">{records.length} transactions</strong>
            </div>
            <div>
              <span>Stored Proofs: </span>
              <strong className="text-slate-800 dark:text-slate-200">{documents.length} files</strong>
            </div>
          </div>
        </div>

        {/* Data Portability (Export) */}
        <div className="space-y-2">
          <h4 className="font-semibold text-navy-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Data Portability (GDPR / Privacy Standard)</span>
          </h4>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            Download a complete, machine-readable JSON copy of all financial records, monthly totals, and passport data associated with your account.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportData}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export My Data (JSON)
          </Button>
        </div>

        {/* Security Guarantees */}
        <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
          <h4 className="font-semibold text-navy-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Privacy & Storage Safeguards</span>
          </h4>
          <ul className="space-y-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Passwords are hashed with cryptographic salts in Supabase auth; plaintext is never stored or logged.</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Row Level Security (RLS) restricts database queries strictly to your authenticated user token.</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>AI analysis sends only anonymized aggregate metrics; names, emails, and transaction notes are stripped.</span>
            </li>
          </ul>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div className="border-t border-rose-100 dark:border-rose-900/60 pt-4 bg-rose-50/50 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-200 dark:border-rose-900/60">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold mb-1">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Danger Zone: Permanent Account Deletion</span>
          </div>
          <p className="text-rose-700 dark:text-rose-300 text-[11px] leading-relaxed mb-3">
            Permanently delete your profile, financial ledger, analyses, passports, active share links, and uploaded documents from the database. This action is irreversible.
          </p>

          {deleteError && (
            <div className="mb-3 p-2 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-[11px] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          {!confirmDelete ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete My Account & All Records
            </Button>
          ) : (
            <div className="space-y-2 bg-white dark:bg-slate-900 p-3 rounded-lg border border-rose-300 dark:border-rose-800">
              <span className="block font-semibold text-rose-900 dark:text-rose-300 text-xs">
                Are you completely sure? This will permanently erase all your data immediately.
              </span>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  isLoading={isDeleting}
                  onClick={handleDeleteAccount}
                >
                  Confirm & Permanently Erase
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
