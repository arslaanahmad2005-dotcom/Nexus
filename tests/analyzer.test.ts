import { describe, it, expect } from 'vitest';
import { generateDeterministicAnalysis } from '../server/services/analyzer';
import { calculateFinancialMetrics } from '../src/lib/calculations';
import { FinancialRecord } from '../src/types';

describe('Financial AI Clarity Engine (Deterministic Mode)', () => {
  it('generates encouraging simple language summary for positive cashflow', () => {
    const records: FinancialRecord[] = [
      {
        id: '1',
        userId: 'u1',
        recordType: 'Income',
        amount: 40000,
        recordDate: '2026-09-01',
        category: 'Freelance Work',
        description: 'Web Design Project',
        isRecurring: false,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '2',
        userId: 'u1',
        recordType: 'Expense',
        amount: 15000,
        recordDate: '2026-09-05',
        category: 'Food & Groceries',
        description: 'Monthly food',
        isRecurring: false,
        createdAt: '',
        updatedAt: ''
      }
    ];

    const metrics = calculateFinancialMetrics(records);
    const result = generateDeterministicAnalysis({
      records,
      metrics,
      profile: {
        occupation: 'Freelancer',
        monthlyIncomeRange: '₹30,000 - ₹60,000'
      }
    });

    expect(result.summary).toContain('higher than your expenses');
    expect(result.positiveIndicators.length).toBeGreaterThan(0);
    expect(result.actionableSuggestions.length).toBeGreaterThan(0);
    expect(result.modelUsed).toContain('Deterministic');
  });

  it('identifies areas for attention when expenses exceed income', () => {
    const records: FinancialRecord[] = [
      {
        id: '1',
        userId: 'u1',
        recordType: 'Income',
        amount: 20000,
        recordDate: '2026-09-01',
        category: 'Salary',
        description: '',
        isRecurring: false,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '2',
        userId: 'u1',
        recordType: 'Expense',
        amount: 35000,
        recordDate: '2026-09-05',
        category: 'Shopping & Personal',
        description: '',
        isRecurring: false,
        createdAt: '',
        updatedAt: ''
      }
    ];

    const metrics = calculateFinancialMetrics(records);
    const result = generateDeterministicAnalysis({
      records,
      metrics,
      profile: {
        occupation: 'Student'
      }
    });

    expect(result.summary).toContain('expenses are currently');
    expect(result.summary).toContain('higher than your recorded income');
  });
});
