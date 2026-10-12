import { FinancialRecord, FinancialMetrics, CategorySummary, MonthlyBreakdown } from '../types';

export function calculateFinancialMetrics(records: FinancialRecord[]): FinancialMetrics {
  if (!records || records.length === 0) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netRemaining: 0,
      savingsRate: 0,
      incomeConsistencyScore: 0,
      incomeConsistencyRating: 'Variable / Developing',
      expenseToIncomeRatio: 0,
      repaymentsCount: 0,
      repaymentsTotal: 0,
      repaymentRegularityScore: 0,
      monthsTracked: 0,
      totalRecordsCount: 0,
      topExpenseCategories: [],
      monthlyBreakdown: [],
      dataSufficiency: {
        hasMinimumRecords: false,
        hasMultipleMonths: false,
        missingAreas: [
          'Add your income records to start',
          'Add day-to-day expense records',
          'Add rent, bill, or loan repayment records'
        ]
      }
    };
  }

  let totalIncome = 0;
  let totalExpenses = 0;
  let totalSavings = 0;
  let repaymentsCount = 0;
  let repaymentsTotal = 0;

  // Monthly grouping
  const monthlyMap: Record<string, { income: number; expenses: number; repayments: number; savings: number }> = {};
  // Expense category grouping
  const categoryMap: Record<string, { total: number; count: number }> = {};

  records.forEach((rec) => {
    const amount = Number(rec.amount) || 0;
    const monthKey = rec.recordDate ? rec.recordDate.slice(0, 7) : '2026-10';

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { income: 0, expenses: 0, repayments: 0, savings: 0 };
    }

    switch (rec.recordType) {
      case 'Income':
        totalIncome += amount;
        monthlyMap[monthKey].income += amount;
        break;
      case 'Expense':
        totalExpenses += amount;
        monthlyMap[monthKey].expenses += amount;

        if (!categoryMap[rec.category]) {
          categoryMap[rec.category] = { total: 0, count: 0 };
        }
        categoryMap[rec.category].total += amount;
        categoryMap[rec.category].count += 1;
        break;
      case 'Savings':
        totalSavings += amount;
        monthlyMap[monthKey].savings += amount;
        break;
      case 'Repayment':
        repaymentsCount += 1;
        repaymentsTotal += amount;
        // In cashflow, repayments are expenses
        totalExpenses += amount;
        monthlyMap[monthKey].repayments += amount;
        monthlyMap[monthKey].expenses += amount;

        const repCat = rec.category || 'Loan & EMI Repayment';
        if (!categoryMap[repCat]) {
          categoryMap[repCat] = { total: 0, count: 0 };
        }
        categoryMap[repCat].total += amount;
        categoryMap[repCat].count += 1;
        break;
    }
  });

  const netRemaining = totalIncome - totalExpenses;

  // Monthly breakdown sorted chronologically
  const sortedMonths = Object.keys(monthlyMap).sort();
  const monthlyBreakdown: MonthlyBreakdown[] = sortedMonths.map((mKey) => {
    const d = monthlyMap[mKey];
    const [year, month] = mKey.split('-');
    const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const monthName = dateObj.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

    return {
      month: mKey,
      monthName,
      income: Math.round(d.income),
      expenses: Math.round(d.expenses),
      net: Math.round(d.income - d.expenses),
      repayments: Math.round(d.repayments),
      savings: Math.round(d.savings)
    };
  });

  const monthsTracked = sortedMonths.length;

  // Savings rate calculation
  const effectiveSavings = totalSavings + (netRemaining > 0 ? netRemaining * 0.4 : 0);
  const rawSavingsRate = totalIncome > 0 ? (effectiveSavings / totalIncome) * 100 : 0;
  const savingsRate = Math.min(100, Math.max(0, Math.round(rawSavingsRate)));

  // Expense to income ratio
  const expenseToIncomeRatio = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 100;

  // Income consistency calculation
  let incomeConsistencyScore = 65;
  let incomeConsistencyRating: 'Very Consistent' | 'Moderately Consistent' | 'Variable / Developing' = 'Variable / Developing';

  if (monthsTracked >= 2) {
    const monthlyIncomes = monthlyBreakdown.map((m) => m.income);
    const avgIncome = monthlyIncomes.reduce((a, b) => a + b, 0) / monthlyIncomes.length;

    if (avgIncome > 0) {
      const variance = monthlyIncomes.reduce((acc, val) => acc + Math.pow(val - avgIncome, 2), 0) / monthlyIncomes.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / avgIncome; // Coefficient of variation

      if (cv <= 0.18) {
        incomeConsistencyScore = Math.min(96, Math.max(88, Math.round(98 - cv * 50)));
        incomeConsistencyRating = 'Very Consistent';
      } else if (cv <= 0.42) {
        incomeConsistencyScore = Math.min(87, Math.max(72, Math.round(90 - cv * 40)));
        incomeConsistencyRating = 'Moderately Consistent';
      } else {
        incomeConsistencyScore = Math.min(71, Math.max(50, Math.round(75 - cv * 30)));
        incomeConsistencyRating = 'Variable / Developing';
      }
    }
  } else if (monthsTracked === 1 && totalIncome > 0) {
    incomeConsistencyScore = 70;
    incomeConsistencyRating = 'Variable / Developing';
  }

  // Repayment regularity score
  let repaymentRegularityScore = 0;
  if (repaymentsCount >= 3) {
    repaymentRegularityScore = 92;
  } else if (repaymentsCount >= 1) {
    repaymentRegularityScore = 78;
  } else {
    repaymentRegularityScore = 50;
  }

  // Top expense categories sorted
  const topExpenseCategories: CategorySummary[] = Object.entries(categoryMap)
    .map(([category, stats]) => ({
      category,
      total: Math.round(stats.total),
      percentage: totalExpenses > 0 ? Math.round((stats.total / totalExpenses) * 100) : 0,
      count: stats.count
    }))
    .sort((a, b) => b.total - a.total);

  // Missing areas & data sufficiency
  const missingAreas: string[] = [];
  if (records.length < 5) {
    missingAreas.push('Add at least 5 financial records for a clearer evaluation');
  }
  if (monthsTracked < 3) {
    missingAreas.push(`Add records across 3 different months (currently ${monthsTracked} month${monthsTracked === 1 ? '' : 's'})`);
  }
  if (repaymentsCount === 0) {
    missingAreas.push('Add regular bill, rent, or EMI payments to show disciplined repayment');
  }
  if (totalSavings === 0 && netRemaining <= 0) {
    missingAreas.push('Record any emergency savings or deposits to show safety cushion');
  }

  return {
    totalIncome: Math.round(totalIncome),
    totalExpenses: Math.round(totalExpenses),
    netRemaining: Math.round(netRemaining),
    savingsRate,
    incomeConsistencyScore,
    incomeConsistencyRating,
    expenseToIncomeRatio,
    repaymentsCount,
    repaymentsTotal: Math.round(repaymentsTotal),
    repaymentRegularityScore,
    monthsTracked,
    totalRecordsCount: records.length,
    topExpenseCategories,
    monthlyBreakdown,
    dataSufficiency: {
      hasMinimumRecords: records.length >= 5,
      hasMultipleMonths: monthsTracked >= 2,
      missingAreas
    }
  };
}

export function formatINR(amount: number): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(absVal);

  return `${isNegative ? '-₹' : '₹'}${formatted}`;
}
