import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Lock,
  Clock,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { SupportingDocument } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

export const DocumentsPage: React.FC = () => {
  const { documents, uploadDocument, deleteDocument } = useFinancial();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<SupportingDocument['documentType']>('Freelance Invoice');
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];
  const MAX_DOCUMENTS_LIMIT = 20;

  const validateFile = (file: File): string | null => {
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be under 10MB.';
    }
    const lastDot = file.name.lastIndexOf('.');
    if (lastDot === -1 || file.name.startsWith('.')) {
      return 'Invalid file name or missing extension.';
    }
    const ext = file.name.slice(lastDot).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `File type "${ext}" is not permitted. Only PDF, JPG, and PNG files are allowed.`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setErrorMsg(validationError);
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a file to upload.');
      return;
    }

    if (documents.length >= MAX_DOCUMENTS_LIMIT) {
      setErrorMsg(`Document storage quota reached (maximum ${MAX_DOCUMENTS_LIMIT} documents). Please remove an existing document to upload a new one.`);
      return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    const ok = await uploadDocument(selectedFile, docType, notes);
    setIsUploading(false);

    if (ok) {
      setSelectedFile(null);
      setNotes('');
      showToast('Document uploaded securely to private storage.');
    } else {
      setErrorMsg('Failed to upload document. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteDocument(id);
    if (ok) {
      setDeletingDocId(null);
      showToast('Document removed.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-brand-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white font-heading">
          Supporting Documents
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Optional proof of income, client agreements, or EMI debits stored in encrypted private storage.
        </p>
      </div>

      {/* Security notice */}
      <div className="bg-brand-50/70 dark:bg-brand-950/50 border border-brand-200/80 dark:border-brand-800/60 p-4 rounded-xl flex items-start gap-3 text-xs text-brand-950 dark:text-brand-200">
        <Lock className="w-4 h-4 text-brand-700 dark:text-brand-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block font-semibold">Private & Unshared by Default</strong>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Supporting documents are stored in a private storage bucket. They are <strong>never</strong> exposed through public passport share links without your explicit instruction.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form (1 Col) */}
        <Card title="Upload New Document" subtitle="Max 10MB • PDF, JPG, PNG">
          <form onSubmit={handleUpload} className="space-y-4 text-xs pt-1">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Document Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Freelance Invoice">Freelance Invoice / Client Agreement</option>
                <option value="Bank Statement">Bank Account Statement (PDF)</option>
                <option value="Salary Slip">Salary Slip / Stipend Voucher</option>
                <option value="Rent Agreement">Rent Receipt / Lease Agreement</option>
                <option value="Utility Bill">Electricity / Wi-Fi Bill Receipt</option>
                <option value="Other">Other Supporting Proof</option>
              </select>
            </div>

            {/* File input */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Select File
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 dark:file:bg-brand-950/70 file:text-brand-800 dark:file:text-brand-300 hover:file:bg-brand-100 dark:hover:file:bg-brand-900 cursor-pointer"
              />
              {selectedFile && (
                <div className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Description / Memo (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Q3 freelance retainer signed agreement"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isUploading}
              disabled={!selectedFile}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
            >
              Upload Document
            </Button>
          </form>
        </Card>

        {/* Uploaded Documents List (2 Cols) */}
        <div className="lg:col-span-2">
          <Card
            title="Your Uploaded Records"
            subtitle={`${documents.length} document${documents.length === 1 ? '' : 's'} on record`}
          >
            {documents.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {documents.map((doc) => (
                  <div key={doc.id} className="py-3.5 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-navy-900 dark:text-white truncate">
                          {doc.fileName}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{doc.documentType}</span>
                          <span>•</span>
                          <span>{formatFileSize(doc.fileSizeBytes)}</span>
                          <span>•</span>
                          <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        </div>
                        {doc.notes && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic">
                            "{doc.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="neutral" size="sm">
                        {doc.status}
                      </Badge>

                      <button
                        type="button"
                        onClick={() => setDeletingDocId(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <FileSpreadsheet className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <p>No supporting documents uploaded yet.</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Uploading client invoices or payment receipts strengthens your profile completeness.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingDocId !== null}
        onClose={() => setDeletingDocId(null)}
        title="Delete Document?"
        subtitle="This will permanently delete the file from your storage."
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Are you sure you want to remove this document? This cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setDeletingDocId(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => deletingDocId && handleDelete(deletingDocId)}
            >
              Delete File
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
