import { describe, it, expect } from 'vitest';
import { calculateFinancialMetrics, formatINR } from '../src/lib/calculations';
import { FinancialRecord } from '../src/types';

describe('Financial Calculations Engine', () => {
  it('handles empty financial records gracefully', () => {
    const metrics = calculateFinancialMetrics([]);
    expect(metrics.totalIncome).toBe(0);
    expect(metrics.totalExpenses).toBe(0);
    expect(metrics.netRemaining).toBe(0);
    expect(metrics.savingsRate).toBe(0);
    expect(metrics.dataSufficiency.hasMinimumRecords).toBe(false);
    expect(metrics.dataSufficiency.missingAreas.length).toBeGreaterThan(0);
  });

  it('correctly calculates totals and net remaining for mixed records', () => {
    const records: FinancialRecord[] = [
      {
        id: '1',
        userId: 'u1',
        recordType: 'Income',
        amount: 50000,
        recordDate: '2026-09-01',
        category: 'Salary',
        description: 'September Salary',
        isRecurring: true,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '2',
        userId: 'u1',
        recordType: 'Expense',
        amount: 20000,
        recordDate: '2026-09-05',
        category: 'Rent & Housing',
        description: 'Monthly flat rent',
        isRecurring: true,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '3',
        userId: 'u1',
        recordType: 'Expense',
        amount: 5000,
        recordDate: '2026-09-10',
        category: 'Food & Groceries',
        description: 'Groceries',
        isRecurring: false,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '4',
        userId: 'u1',
        recordType: 'Repayment',
        amount: 3000,
        recordDate: '2026-09-15',
        category: 'Loan & EMI Repayment',
        description: 'Laptop EMI',
        isRecurring: true,
        createdAt: '',
        updatedAt: ''
      }
    ];

    const metrics = calculateFinancialMetrics(records);

    expect(metrics.totalIncome).toBe(50000);
    // Expenses = 20000 + 5000 + 3000 (repayment) = 28000
    expect(metrics.totalExpenses).toBe(28000);
    expect(metrics.netRemaining).toBe(22000);
    expect(metrics.repaymentsCount).toBe(1);
    expect(metrics.repaymentsTotal).toBe(3000);
  });

  it('calculates expense categories and sort order correctly', () => {
    const records: FinancialRecord[] = [
      {
        id: '1',
        userId: 'u1',
        recordType: 'Expense',
        amount: 10000,
        recordDate: '2026-08-01',
        category: 'Rent & Housing',
        description: '',
        isRecurring: false,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '2',
        userId: 'u1',
        recordType: 'Expense',
        amount: 2000,
        recordDate: '2026-08-02',
        category: 'Food & Groceries',
        description: '',
        isRecurring: false,
        createdAt: '',
        updatedAt: ''
      }
    ];

    const metrics = calculateFinancialMetrics(records);
    expect(metrics.topExpenseCategories.length).toBe(2);
    expect(metrics.topExpenseCategories[0].category).toBe('Rent & Housing');
    expect(metrics.topExpenseCategories[0].percentage).toBe(83); // 10000 / 12000 ~ 83.3%
  });

  it('formats Indian Rupee amounts correctly with symbol', () => {
    expect(formatINR(50000)).toBe('₹50,000');
    expect(formatINR(1250000)).toBe('₹12,50,000');
    expect(formatINR(-5000)).toBe('-₹5,000');
    expect(formatINR(0)).toBe('₹0');
  });
});
