import React, { useState, useMemo } from 'react';
import {
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  IndianRupee,
  Repeat,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { FinancialRecord, RecordType, IncomeCategory, ExpenseCategory } from '../types';
import { formatINR } from '../lib/calculations';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

const INCOME_CATEGORIES: IncomeCategory[] = [
  'Salary',
  'Freelance Work',
  'Gig Work',
  'Business Income',
  'Stipend / Allowance',
  'Investment / Interest',
  'Other Income'
];

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food & Groceries',
  'Rent & Housing',
  'Utilities & Bills',
  'Travel & Fuel',
  'Education & Learning',
  'Health & Medical',
  'Shopping & Personal',
  'Entertainment',
  'Work Supplies / Tools',
  'Loan & EMI Repayment',
  'Other Expense'
];

export const MyMoneyPage: React.FC = () => {
  const { records, addRecord, updateRecord, deleteRecord } = useFinancial();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<FinancialRecord | null>(null);

  // Form states
  const [formRecordType, setFormRecordType] = useState<RecordType>('Income');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formCategory, setFormCategory] = useState<string>('Freelance Work');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formIsRecurring, setFormIsRecurring] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Available unique months from existing records
  const uniqueMonths = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.recordDate) set.add(r.recordDate.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Type match
      if (selectedType !== 'ALL' && r.recordType !== selectedType) return false;
      // Month match
      if (selectedMonth !== 'ALL' && !r.recordDate.startsWith(selectedMonth)) return false;
      // Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesCategory = r.category.toLowerCase().includes(query);
        const matchesDesc = (r.description || '').toLowerCase().includes(query);
        return matchesCategory || matchesDesc;
      }
      return true;
    });
  }, [records, selectedType, selectedMonth, searchQuery]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openAddModal = () => {
    setFormRecordType('Income');
    setFormAmount('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormCategory('Freelance Work');
    setFormDescription('');
    setFormIsRecurring(false);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (rec: FinancialRecord) => {
    setEditingRecord(rec);
    setFormRecordType(rec.recordType);
    setFormAmount(rec.amount.toString());
    setFormDate(rec.recordDate);
    setFormCategory(rec.category);
    setFormDescription(rec.description || '');
    setFormIsRecurring(rec.isRecurring);
    setFormError(null);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numericAmount = parseFloat(formAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFormError('Please enter a valid amount greater than ₹0.');
      return;
    }

    if (!formDate) {
      setFormError('Please select a valid date.');
      return;
    }

    if (!formCategory) {
      setFormError('Please select a category.');
      return;
    }

    setIsSubmitting(true);

    if (editingRecord) {
      const ok = await updateRecord(editingRecord.id, {
        recordType: formRecordType,
        amount: numericAmount,
        recordDate: formDate,
        category: formCategory,
        description: formDescription.trim(),
        isRecurring: formIsRecurring
      });
      setIsSubmitting(false);
      if (ok) {
        setEditingRecord(null);
        showToast('Record updated successfully.');
      }
    } else {
      const ok = await addRecord({
        recordType: formRecordType,
        amount: numericAmount,
        recordDate: formDate,
        category: formCategory,
        description: formDescription.trim(),
        isRecurring: formIsRecurring
      });
      setIsSubmitting(false);
      if (ok) {
        setIsAddModalOpen(false);
        showToast('New financial record added successfully.');
      }
    }
  };

  const handleDelete = async () => {
    if (!deletingRecord) return;
    setIsSubmitting(true);
    const ok = await deleteRecord(deletingRecord.id);
    setIsSubmitting(false);
    if (ok) {
      setDeletingRecord(null);
      showToast('Record removed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-brand-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-heading">My Money</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track income, living expenses, and on-time repayments. Dashboard totals update automatically.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={openAddModal}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Add Financial Record
        </Button>
      </div>

      {/* Search & Filters Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Search text */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search category or description..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Type filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="ALL">All Types (Income & Expenses)</option>
              <option value="Income">Money In (Income)</option>
              <option value="Expense">Money Out (Expense)</option>
              <option value="Repayment">On-time Repayments</option>
              <option value="Savings">Savings Deposits</option>
            </select>
          </div>

          {/* Month filter */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="ALL">All Recorded Months</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Records Count & Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            Showing <strong className="text-navy-900">{filteredRecords.length}</strong> of{' '}
            <strong className="text-navy-900">{records.length}</strong> records
          </span>
          {records.length > 0 && (
            <span className="text-[11px] text-slate-400">Amounts shown in Indian Rupees (₹)</span>
          )}
        </div>

        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r) => {
                  const isPositive = r.recordType === 'Income';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
                        {r.recordDate}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
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
                          {r.recordType === 'Income' && <ArrowUpRight className="w-3 h-3 text-emerald-600" />}
                          {r.recordType === 'Expense' && <ArrowDownRight className="w-3 h-3 text-slate-500" />}
                          {r.recordType === 'Repayment' && <CheckCircle2 className="w-3 h-3 text-brand-600" />}
                          {r.recordType === 'Savings' && <PiggyBank className="w-3 h-3 text-sky-600" />}
                          <span>{r.recordType}</span>
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold text-navy-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{r.category}</span>
                          {r.isRecurring && (
                            <span
                              title="Recurring monthly transaction"
                              className="inline-flex text-brand-700 bg-brand-50 px-1 py-0.2 rounded text-[10px]"
                            >
                              <Repeat className="w-2.5 h-2.5 inline mr-0.5" />
                              Auto
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {r.description || <span className="text-slate-400 italic">No notes</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-bold whitespace-nowrap text-navy-900">
                        <span className={isPositive ? 'text-emerald-700' : 'text-slate-800'}>
                          {isPositive ? '+' : '-'}
                          {formatINR(r.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(r)}
                            className="p-1.5 text-slate-400 hover:text-navy-900 hover:bg-slate-100 rounded-md transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingRecord(r)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <IndianRupee className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-navy-900">No records found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedType !== 'ALL' || selectedMonth !== 'ALL'
                ? 'No transactions match your current search filters. Try clearing filters.'
                : 'You have not added any money entries yet. Click below to add your first record.'}
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={openAddModal}
              leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
            >
              Add First Record
            </Button>
          </div>
        )}
      </div>

      {/* Add / Edit Record Modal */}
      <Modal
        isOpen={isAddModalOpen || editingRecord !== null}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRecord(null);
        }}
        title={editingRecord ? 'Edit Financial Record' : 'Add Financial Record'}
        subtitle="Ensure amounts are in positive INR and reflect your actual cash flow."
      >
        <form onSubmit={handleSaveRecord} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Record Type Picker */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Record Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Income', 'Expense', 'Repayment', 'Savings'] as RecordType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setFormRecordType(t);
                    if (t === 'Income') setFormCategory('Freelance Work');
                    else if (t === 'Repayment') setFormCategory('Loan & EMI Repayment');
                    else if (t === 'Savings') setFormCategory('Savings');
                    else setFormCategory('Food & Groceries');
                  }}
                  className={`py-2 px-2 text-center rounded-lg font-medium border transition-colors ${
                    formRecordType === t
                      ? 'bg-brand-50 border-brand-500 text-brand-900 font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Amount & Date in 2 Cols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Amount (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {formRecordType === 'Income' ? (
                INCOME_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))
              ) : formRecordType === 'Savings' ? (
                <>
                  <option value="Savings">Emergency Savings Account</option>
                  <option value="Recurring Deposit">Monthly Recurring Deposit</option>
                  <option value="Liquid Mutual Fund">Liquid Fund Reserve</option>
                </>
              ) : formRecordType === 'Repayment' ? (
                <>
                  <option value="Loan & EMI Repayment">Device / Laptop EMI</option>
                  <option value="Education Loan">Education / Tuition EMI</option>
                  <option value="Rent Payment">House / Room Rent</option>
                  <option value="Utility Bill">Electricity / Wi-Fi Bill</option>
                </>
              ) : (
                EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="e.g. Client payout for website design project"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Recurring checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsRecurring}
                onChange={(e) => setFormIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <span className="text-slate-700 font-medium">
                Recurring monthly transaction (e.g. monthly rent, retainer, or EMI)
              </span>
            </label>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingRecord(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingRecord ? 'Save Changes' : 'Add Record'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingRecord !== null}
        onClose={() => setDeletingRecord(null)}
        title="Delete Financial Record?"
        subtitle="This action will recalculate your dashboard totals."
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Are you sure you want to delete the record for{' '}
            <strong className="text-navy-900">
              {deletingRecord?.category} ({formatINR(deletingRecord?.amount || 0)})
            </strong>{' '}
            dated {deletingRecord?.recordDate}?
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setDeletingRecord(null)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" isLoading={isSubmitting} onClick={handleDelete}>
              Delete Record
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
