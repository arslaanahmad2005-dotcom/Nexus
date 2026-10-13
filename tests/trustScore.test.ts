import { describe, it, expect } from 'vitest';
import {
  calculateFinancialTrustScore,
  generateFinancialTips,
  filterRecordsByPeriod,
  calculatePeriodComparison
} from '../src/lib/calculations';
import { FinancialRecord } from '../src/types';

describe('Financial Trust Score Engine', () => {
  it('returns insufficient_data status when records are empty or income is zero', () => {
    const emptyScore = calculateFinancialTrustScore([]);
    expect(emptyScore.status).toBe('insufficient_data');
    expect(emptyScore.score).toBe(0);
    expect(emptyScore.label).toContain('Awaiting');

    const expensesOnly: FinancialRecord[] = [
      {
        id: '1',
        userId: 'u1',
        recordType: 'Expense',
        amount: 2000,
        recordDate: '2026-10-01',
        category: 'Food & Groceries',
        description: 'Groceries',
        isRecurring: false,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '2',
        userId: 'u1',
        recordType: 'Expense',
        amount: 3000,
        recordDate: '2026-10-05',
        category: 'Rent & Housing',
        description: 'Rent',
        isRecurring: false,
        createdAt: '',
        updatedAt: ''
      }
    ];

    const noIncomeScore = calculateFinancialTrustScore(expensesOnly);
    expect(noIncomeScore.status).toBe('insufficient_data');
    expect(noIncomeScore.score).toBe(0);
  });

  it('awards provisional score for early entries (1 month of records)', () => {
    const singleMonthRecords: FinancialRecord[] = [
      {
        id: '1',
        userId: 'u1',
        recordType: 'Income',
        amount: 30000,
        recordDate: '2026-10-01',
        category: 'Freelance Work',
        description: 'Design milestone',
        isRecurring: false,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '2',
        userId: 'u1',
        recordType: 'Expense',
        amount: 10000,
        recordDate: '2026-10-05',
        category: 'Food & Groceries',
        description: 'Food',
        isRecurring: false,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '3',
        userId: 'u1',
        recordType: 'Expense',
        amount: 5000,
        recordDate: '2026-10-10',
        category: 'Utilities & Bills',
        description: 'WiFi & electricity',
        isRecurring: false,
        createdAt: '',
        updatedAt: ''
      }
    ];

    const score = calculateFinancialTrustScore(singleMonthRecords);
    expect(score.status).toBe('provisional');
    expect(score.score).toBeGreaterThan(50);
    expect(score.label).toContain('Provisional');
    expect(score.breakdown.incomeConsistency.status).toBe('provisional');
  });

  it('does not penalize low income users if income is consistent', () => {
    // Low income student earning ₹6,000 steadily across 3 months
    const studentRecords: FinancialRecord[] = [
      {
        id: '1',
        userId: 'u1',
        recordType: 'Income',
        amount: 6000,
        recordDate: '2026-08-01',
        category: 'Stipend / Allowance',
        description: 'Tutoring',
        isRecurring: true,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '2',
        userId: 'u1',
        recordType: 'Income',
        amount: 6000,
        recordDate: '2026-09-01',
        category: 'Stipend / Allowance',
        description: 'Tutoring',
        isRecurring: true,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '3',
        userId: 'u1',
        recordType: 'Income',
        amount: 6000,
        recordDate: '2026-10-01',
        category: 'Stipend / Allowance',
        description: 'Tutoring',
        isRecurring: true,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '4',
        userId: 'u1',
        recordType: 'Expense',
        amount: 2500,
        recordDate: '2026-08-10',
        category: 'Food & Groceries',
        description: 'Hostel mess',
        isRecurring: true,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '5',
        userId: 'u1',
        recordType: 'Expense',
        amount: 2500,
        recordDate: '2026-09-10',
        category: 'Food & Groceries',
        description: 'Hostel mess',
        isRecurring: true,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '6',
        userId: 'u1',
        recordType: 'Expense',
        amount: 2500,
        recordDate: '2026-10-10',
        category: 'Food & Groceries',
        description: 'Hostel mess',
        isRecurring: true,
        createdAt: '',
        updatedAt: ''
      }
    ];

    const score = calculateFinancialTrustScore(studentRecords);
    expect(score.status).toBe('calculated');
    // Top marks for consistency despite small magnitude:
    expect(score.breakdown.incomeConsistency.score).toBe(30);
    expect(score.breakdown.incomeConsistency.rating).toBe('Very Consistent Flow');
  });

  it('accommodates irregular freelance income without zero-failure crashes', () => {
    const freelanceRecords: FinancialRecord[] = [
      {
        id: '1',
        userId: 'f1',
        recordType: 'Income',
        amount: 55000,
        recordDate: '2026-08-15',
        category: 'Freelance Work',
        description: 'Project 1',
        isRecurring: false,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '2',
        userId: 'f1',
        recordType: 'Income',
        amount: 35000,
        recordDate: '2026-09-12',
        category: 'Freelance Work',
        description: 'Project 2',
        isRecurring: false,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '3',
        userId: 'f1',
        recordType: 'Income',
        amount: 65000,
        recordDate: '2026-10-05',
        category: 'Freelance Work',
        description: 'Project 3',
        isRecurring: false,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '4',
        userId: 'f1',
        recordType: 'Expense',
        amount: 18000,
        recordDate: '2026-08-10',
        category: 'Rent & Housing',
        description: 'Rent',
        isRecurring: true,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '5',
        userId: 'f1',
        recordType: 'Repayment',
        amount: 4500,
        recordDate: '2026-09-08',
        category: 'Loan & EMI Repayment',
        description: 'Laptop EMI',
        isRecurring: true,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '6',
        userId: 'f1',
        recordType: 'Savings',
        amount: 10000,
        recordDate: '2026-10-10',
        category: 'Savings',
        description: 'Recurring Deposit',
        isRecurring: true,
        createdAt: '',
        updatedAt: ''
      }
    ];

    const score = calculateFinancialTrustScore(freelanceRecords);
    expect(score.status).toBe('calculated');
    expect(score.score).toBeGreaterThanOrEqual(75);
    expect(score.breakdown.incomeConsistency.score).toBeGreaterThanOrEqual(22);
    expect(score.breakdown.savingsHabits.score).toBeGreaterThanOrEqual(18);
  });

  it('generates 3 relevant, actionable financial tips based on gaps', () => {
    // Records without repayments and savings
    const basicRecords: FinancialRecord[] = [
      {
        id: '1',
        userId: 'u1',
        recordType: 'Income',
        amount: 40000,
        recordDate: '2026-10-01',
        category: 'Salary',
        description: 'Monthly Salary',
        isRecurring: true,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '2',
        userId: 'u1',
        recordType: 'Expense',
        amount: 25000,
        recordDate: '2026-10-05',
        category: 'Food & Groceries',
        description: 'Food',
        isRecurring: false,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '3',
        userId: 'u1',
        recordType: 'Expense',
        amount: 5000,
        recordDate: '2026-10-08',
        category: 'Shopping & Personal',
        description: 'Clothes',
        isRecurring: false,
        createdAt: '',
        updatedAt: ''
      }
    ];

    const score = calculateFinancialTrustScore(basicRecords);
    const tips = generateFinancialTips(basicRecords, score);

    expect(tips).toHaveLength(3);
    // Tip 1 should suggest recording bill/rent repayments
    expect(tips.some((t) => t.category === 'Repayment')).toBe(true);
    // Tip 2 should suggest building 3 months history
    expect(tips.some((t) => t.category === 'Income')).toBe(true);
    // Each tip has a clear rationale ("Why am I seeing this tip?")
    tips.forEach((t) => {
      expect(t.rationale.length).toBeGreaterThan(10);
      expect(t.title.length).toBeGreaterThan(5);
    });
  });

  it('filters records by period accurately and compares month-over-month', () => {
    const multiMonthRecords: FinancialRecord[] = [
      {
        id: '1',
        userId: 'u1',
        recordType: 'Income',
        amount: 30000,
        recordDate: '2026-09-02',
        category: 'Freelance Work',
        description: 'Sept work',
        isRecurring: false,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '2',
        userId: 'u1',
        recordType: 'Income',
        amount: 35000,
        recordDate: '2026-10-02',
        category: 'Freelance Work',
        description: 'Oct work',
        isRecurring: false,
        createdAt: '',
        updatedAt: ''
      }
    ];

    const octRecords = filterRecordsByPeriod(multiMonthRecords, 'this_month');
    expect(octRecords).toHaveLength(1);
    expect(octRecords[0].amount).toBe(35000);

    const comp = calculatePeriodComparison(multiMonthRecords, 'this_month');
    expect(comp.hasPreviousPeriodData).toBe(true);
    expect(comp.previousIncome).toBe(30000);
    expect(comp.totalIncome).toBe(35000);
    // 35k vs 30k = +17%
    expect(comp.incomeChangePercentage).toBe(17);
  });
});
