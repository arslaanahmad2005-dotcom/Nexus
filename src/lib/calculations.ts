import {
  FinancialRecord,
  FinancialMetrics,
  CategorySummary,
  MonthlyBreakdown,
  FinancialTrustScore,
  TrustScoreBreakdown,
  TrustTip,
  AnalysisPeriod,
  PeriodComparison,
  AIAnalysisResult
} from '../types';

export function calculateFinancialMetrics(records: FinancialRecord[]): FinancialMetrics {
  const trustScore = calculateFinancialTrustScore(records);

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
      trustScore,
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
        categoryMap[rec.category].count += 1;
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
    trustScore,
    dataSufficiency: {
      hasMinimumRecords: records.length >= 5,
      hasMultipleMonths: monthsTracked >= 2,
      missingAreas
    }
  };
}

/**
 * Deterministic Financial Trust Score Engine (0 - 100)
 * Evaluates alternative creditworthiness without traditional bureau dependencies:
 * - Income consistency: 30 points
 * - Savings habits: 25 points
 * - Repayment history: 25 points
 * - Expense management: 20 points
 * Total: 100 points
 */
export function calculateFinancialTrustScore(
  records: FinancialRecord[],
  profile?: { occupation?: string }
): FinancialTrustScore {
  const lastCalculatedAt = new Date().toISOString();
  const disclaimer =
    'The NEXUS Financial Trust Score is an alternative financial clarity metric calculated strictly from your verified records. It is not an official credit bureau score (e.g. CIBIL/Experian) and does not guarantee loan or credit approval.';

  // 1. Check Data Sufficiency
  if (!records || records.length === 0) {
    return {
      score: 0,
      status: 'insufficient_data',
      label: 'Data Awaiting',
      breakdown: {
        incomeConsistency: {
          score: 0,
          max: 30,
          rating: 'No records',
          description: 'No income entries found. Add your monthly earnings to begin evaluation.',
          status: 'incomplete',
          monthsEvaluated: 0
        },
        savingsHabits: {
          score: 0,
          max: 25,
          rating: 'No records',
          description: 'No savings or cashflow history available.',
          status: 'incomplete',
          savingsRatePercent: 0,
          hasExplicitSavings: false
        },
        repaymentHistory: {
          score: 0,
          max: 25,
          rating: 'No records',
          description: 'No bills, rent, or EMI repayment records submitted.',
          status: 'incomplete',
          onTimeCount: 0,
          lateCount: 0,
          hasRepayments: false
        },
        expenseManagement: {
          score: 0,
          max: 20,
          rating: 'No records',
          description: 'No expense records found.',
          status: 'incomplete',
          expenseToIncomeRatio: 0,
          essentialRatioPercent: 0
        }
      },
      keyFactors: [
        {
          type: 'neutral',
          text: 'Add at least 3 financial records to generate your provisional Trust Score.'
        }
      ],
      methodologyVersion: 'v1.0',
      lastCalculatedAt,
      disclaimer
    };
  }

  // Aggregate records
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalExplicitSavings = 0;
  let explicitSavingsCount = 0;
  let onTimeRepaymentsCount = 0;
  let lateRepaymentsCount = 0;
  let essentialExpenses = 0;

  const monthlyIncomeMap: Record<string, number> = {};
  const monthlyExpenseMap: Record<string, number> = {};

  const essentialCategories = new Set([
    'Food & Groceries',
    'Rent & Housing',
    'Utilities & Bills',
    'Education & Learning',
    'Health & Medical',
    'Work Supplies / Tools'
  ]);

  records.forEach((rec) => {
    const amt = Math.max(0, Number(rec.amount) || 0);
    const monthKey = rec.recordDate ? rec.recordDate.slice(0, 7) : 'unknown';

    if (rec.recordType === 'Income') {
      totalIncome += amt;
      monthlyIncomeMap[monthKey] = (monthlyIncomeMap[monthKey] || 0) + amt;
    } else if (rec.recordType === 'Expense') {
      totalExpenses += amt;
      monthlyExpenseMap[monthKey] = (monthlyExpenseMap[monthKey] || 0) + amt;
      if (essentialCategories.has(rec.category)) {
        essentialExpenses += amt;
      }
    } else if (rec.recordType === 'Savings') {
      totalExplicitSavings += amt;
      explicitSavingsCount += 1;
    } else if (rec.recordType === 'Repayment') {
      totalExpenses += amt;
      monthlyExpenseMap[monthKey] = (monthlyExpenseMap[monthKey] || 0) + amt;
      essentialExpenses += amt;

      const descLower = (rec.description || '').toLowerCase();
      if (descLower.includes('late') || descLower.includes('delay') || descLower.includes('overdue') || descLower.includes('missed')) {
        lateRepaymentsCount += 1;
      } else {
        onTimeRepaymentsCount += 1;
      }
    }
  });

  const netRemaining = totalIncome - totalExpenses;
  const incomeMonths = Object.keys(monthlyIncomeMap).filter((k) => monthlyIncomeMap[k] > 0);
  const totalMonthsTracked = Math.max(incomeMonths.length, Object.keys(monthlyExpenseMap).length);

  // Insufficient threshold: Less than 3 records or 0 recorded income
  if (records.length < 3 || totalIncome === 0) {
    return {
      score: 0,
      status: 'insufficient_data',
      label: 'Add more information to calculate your score',
      breakdown: {
        incomeConsistency: {
          score: 0,
          max: 30,
          rating: 'Awaiting Income Records',
          description: totalIncome === 0 ? 'No earnings recorded yet. Add your client payouts, salary, or gig income.' : 'Requires at least 3 verified entries.',
          status: 'incomplete',
          monthsEvaluated: incomeMonths.length
        },
        savingsHabits: {
          score: 0,
          max: 25,
          rating: 'Incomplete Data',
          description: 'Savings habits cannot be evaluated without income records.',
          status: 'incomplete',
          savingsRatePercent: 0,
          hasExplicitSavings: explicitSavingsCount > 0
        },
        repaymentHistory: {
          score: 0,
          max: 25,
          rating: 'Incomplete Data',
          description: 'Repayment history requires active profile records.',
          status: 'incomplete',
          onTimeCount: onTimeRepaymentsCount,
          lateCount: lateRepaymentsCount,
          hasRepayments: onTimeRepaymentsCount + lateRepaymentsCount > 0
        },
        expenseManagement: {
          score: 0,
          max: 20,
          rating: 'Incomplete Data',
          description: 'Expense management requires baseline entries.',
          status: 'incomplete',
          expenseToIncomeRatio: 0,
          essentialRatioPercent: 0
        }
      },
      keyFactors: [
        {
          type: 'neutral',
          text: 'Add your monthly income and living expense records to calculate your score.'
        }
      ],
      methodologyVersion: 'v1.0',
      lastCalculatedAt,
      disclaimer
    };
  }

  // Determine if Provisional or Full Score
  // Full score requires at least 5 records AND at least 2 distinct months of data
  const isProvisional = records.length < 5 || incomeMonths.length < 2;

  // ---------------------------------------------------------------------------
  // Component A: Income Consistency (Max 30 points)
  // Transparent rules:
  // - Does not penalize low income amounts.
  // - Accounts for irregular freelance milestones.
  // - 1 month of income = provisional 19 points baseline (shows active economic participation).
  // - 2+ months = evaluated via coefficient of variation (CV).
  // ---------------------------------------------------------------------------
  let incomeScore = 19;
  let incomeRating = 'Active Earnings Tracked';
  let incomeDesc = 'Recorded active income. Tracking across 2+ months will verify stability.';
  let cvRatio: number | undefined = undefined;

  if (incomeMonths.length >= 2) {
    const monthlyValues = incomeMonths.map((k) => monthlyIncomeMap[k]);
    const avg = monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length;
    if (avg > 0) {
      const variance = monthlyValues.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / monthlyValues.length;
      const stdDev = Math.sqrt(variance);
      cvRatio = stdDev / avg;

      // Accommodate freelancers/gig workers: CV up to 0.35 is common and healthy
      if (cvRatio <= 0.20) {
        incomeScore = 30;
        incomeRating = 'Very Consistent Flow';
        incomeDesc = `Strong regularity across ${incomeMonths.length} recorded months (CV: ${(cvRatio * 100).toFixed(0)}%).`;
      } else if (cvRatio <= 0.38) {
        incomeScore = 26;
        incomeRating = 'Dependable Inflow';
        incomeDesc = `Stable income flow with healthy freelance variance across ${incomeMonths.length} months.`;
      } else if (cvRatio <= 0.58) {
        incomeScore = 22;
        incomeRating = 'Moderate Variable Flow';
        incomeDesc = `Expected freelance fluctuation across client milestones. Active earning pattern demonstrated.`;
      } else {
        incomeScore = 18;
        incomeRating = 'Developing Regularity';
        incomeDesc = `Income varies noticeably across recorded months. Consistent monthly tracking will strengthen this factor.`;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Component B: Savings Habits (Max 25 points)
  // Transparent rules:
  // - Uses explicit savings entries AND net cashflow buffer percentage.
  // - Incomplete savings records are documented clearly without guessing.
  // ---------------------------------------------------------------------------
  let savingsScore = 0;
  let savingsRating = 'Developing Cushion';
  let savingsDesc = '';
  const netMarginPercent = totalIncome > 0 ? (netRemaining / totalIncome) * 100 : 0;

  // Points from explicit savings deposits (up to 15)
  let explicitSavingsPts = 0;
  if (explicitSavingsCount >= 2) {
    explicitSavingsPts = 15;
  } else if (explicitSavingsCount === 1) {
    explicitSavingsPts = 10;
  }

  // Points from net surplus margin (up to 10)
  let marginPts = 0;
  if (netMarginPercent >= 25) {
    marginPts = 10;
  } else if (netMarginPercent >= 10) {
    marginPts = 7;
  } else if (netMarginPercent > 0) {
    marginPts = 4;
  } else {
    marginPts = 0;
  }

  if (explicitSavingsCount > 0) {
    savingsScore = Math.min(25, explicitSavingsPts + marginPts);
    savingsRating = savingsScore >= 20 ? 'Strong Savings Habit' : 'Active Savings Habit';
    savingsDesc = `${explicitSavingsCount} savings deposits logged and retaining ${Math.max(0, Math.round(netMarginPercent))}% of earnings.`;
  } else if (netMarginPercent >= 15) {
    // Has good cash surplus even if explicit savings deposits were not logged
    savingsScore = Math.min(20, Math.round(10 + (netMarginPercent / 100) * 10));
    savingsRating = 'Positive Cash Cushion';
    savingsDesc = `Retaining ~${Math.round(netMarginPercent)}% cash buffer after expenses. Recording dedicated savings entries will unlock full points.`;
  } else if (netMarginPercent > 0) {
    savingsScore = 12;
    savingsRating = 'Modest Buffer';
    savingsDesc = `Positive monthly cashflow (+₹${formatINR(netRemaining).replace('₹', '')}), with no explicit emergency deposits logged yet.`;
  } else {
    savingsScore = 6;
    savingsRating = 'Limited Buffer';
    savingsDesc = `Expenses currently match or exceed recorded income. No explicit savings records added yet.`;
  }

  // ---------------------------------------------------------------------------
  // Component C: Repayment History (Max 25 points)
  // Transparent rules:
  // - Uses recorded repayment entries (rent, utility bills, EMIs).
  // - Never assumes unrecorded payments were missed.
  // - Does not invent repayment history.
  // ---------------------------------------------------------------------------
  let repaymentScore = 0;
  let repaymentRating = '';
  let repaymentDesc = '';
  const totalRepayments = onTimeRepaymentsCount + lateRepaymentsCount;

  if (totalRepayments === 0) {
    // Neutral baseline for users with no recorded debt or rent history
    repaymentScore = 14;
    repaymentRating = 'No Records Submitted';
    repaymentDesc = 'No bill, rent, or EMI payments logged yet. Recording scheduled payments will unlock up to 25 points.';
  } else if (lateRepaymentsCount === 0) {
    if (onTimeRepaymentsCount >= 3) {
      repaymentScore = 25;
      repaymentRating = 'Exemplary On-Time Record';
      repaymentDesc = `All ${onTimeRepaymentsCount} recorded bill/EMI payments fulfilled on schedule without delay.`;
    } else if (onTimeRepaymentsCount >= 1) {
      repaymentScore = 21;
      repaymentRating = 'Verified On-Time Payments';
      repaymentDesc = `${onTimeRepaymentsCount} payment${onTimeRepaymentsCount > 1 ? 's' : ''} recorded on time. Adding 3+ payments verifies full regularity.`;
    }
  } else {
    const penalty = lateRepaymentsCount * 4;
    repaymentScore = Math.max(8, 25 - penalty);
    repaymentRating = 'Contains Delayed Records';
    repaymentDesc = `${onTimeRepaymentsCount} on-time payment${onTimeRepaymentsCount === 1 ? '' : 's'}, with ${lateRepaymentsCount} delay noted in ledger.`;
  }

  // ---------------------------------------------------------------------------
  // Component D: Expense Management (Max 20 points)
  // Transparent rules:
  // - Compares living expenses to income.
  // - Does not penalize necessary expenses (Rent, Education, Medical, Groceries).
  // ---------------------------------------------------------------------------
  let expenseScore = 0;
  let expenseRating = '';
  let expenseDesc = '';
  const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) : 1;
  const essentialRatio = totalExpenses > 0 ? (essentialExpenses / totalExpenses) * 100 : 0;

  if (expenseRatio <= 0.65) {
    expenseScore = 20;
    expenseRating = 'Disciplined Margin';
    expenseDesc = `Total expenses are well-managed at ${(expenseRatio * 100).toFixed(0)}% of recorded income, maintaining strong financial flexibility.`;
  } else if (expenseRatio <= 0.85) {
    expenseScore = 17;
    expenseRating = 'Healthy Living Ratio';
    expenseDesc = `Living expenses are balanced at ${(expenseRatio * 100).toFixed(0)}% of income, comfortably within sustainable limits.`;
  } else if (expenseRatio <= 1.00) {
    expenseScore = 14;
    expenseRating = 'Break-Even Cashflow';
    expenseDesc = `Living expenses absorb ${(expenseRatio * 100).toFixed(0)}% of income. Expenses match incoming earnings.`;
  } else {
    // Expenses exceed income. Check if they were essential living costs:
    if (essentialRatio >= 60) {
      expenseScore = 12;
      expenseRating = 'Essential Expenses Recognized';
      expenseDesc = `Expenses exceed income, but ${Math.round(essentialRatio)}% represent essential obligations (rent, food, healthcare, tools).`;
    } else {
      expenseScore = 9;
      expenseRating = 'High Expense Margin';
      expenseDesc = `Expenses exceed recorded income (${(expenseRatio * 100).toFixed(0)}%). Reviewing discretionary spending is advised.`;
    }
  }

  // ---------------------------------------------------------------------------
  // Total Score Summation (0 - 100)
  // ---------------------------------------------------------------------------
  const totalScore = Math.min(100, Math.max(0, incomeScore + savingsScore + repaymentScore + expenseScore));

  let label = 'Developing Financial Trust';
  if (isProvisional) {
    label = 'Provisional Financial Trust Score';
  } else if (totalScore >= 80) {
    label = 'Strong Financial Trust';
  } else if (totalScore >= 65) {
    label = 'Solid Financial Trust';
  } else if (totalScore >= 50) {
    label = 'Building Financial Trust';
  }

  // Key factors summary
  const keyFactors: { type: 'positive' | 'neutral' | 'attention'; text: string }[] = [];

  if (incomeScore >= 24) {
    keyFactors.push({
      type: 'positive',
      text: `Income regularity: ${incomeRating} (${incomeScore}/30 pts).`
    });
  } else if (incomeMonths.length === 1) {
    keyFactors.push({
      type: 'neutral',
      text: `Provisional income: 1 month recorded (+${incomeScore} pts). Add 2+ months to unlock full stability score.`
    });
  }

  if (repaymentScore >= 21) {
    keyFactors.push({
      type: 'positive',
      text: `Repayment discipline: ${onTimeRepaymentsCount} on-time payments verified (+${repaymentScore} pts).`
    });
  } else if (totalRepayments === 0) {
    keyFactors.push({
      type: 'neutral',
      text: 'No debt or rent repayments logged yet (+14 baseline pts). Logging bills will increase this factor.'
    });
  }

  if (savingsScore >= 18) {
    keyFactors.push({
      type: 'positive',
      text: `Positive savings margin: retaining ~${Math.max(0, Math.round(netMarginPercent))}% of earnings (+${savingsScore} pts).`
    });
  } else if (netMarginPercent <= 0) {
    keyFactors.push({
      type: 'attention',
      text: `Tight cashflow margin: expenses currently absorb 100% of recorded income.`
    });
  }

  const breakdown: TrustScoreBreakdown = {
    incomeConsistency: {
      score: incomeScore,
      max: 30,
      rating: incomeRating,
      description: incomeDesc,
      status: incomeMonths.length >= 2 ? 'sufficient' : 'provisional',
      cvRatio,
      monthsEvaluated: incomeMonths.length
    },
    savingsHabits: {
      score: savingsScore,
      max: 25,
      rating: savingsRating,
      description: savingsDesc,
      status: explicitSavingsCount > 0 ? 'sufficient' : 'provisional',
      savingsRatePercent: Math.max(0, Math.round(netMarginPercent)),
      hasExplicitSavings: explicitSavingsCount > 0
    },
    repaymentHistory: {
      score: repaymentScore,
      max: 25,
      rating: repaymentRating,
      description: repaymentDesc,
      status: totalRepayments >= 2 ? 'sufficient' : totalRepayments === 1 ? 'provisional' : 'incomplete',
      onTimeCount: onTimeRepaymentsCount,
      lateCount: lateRepaymentsCount,
      hasRepayments: totalRepayments > 0
    },
    expenseManagement: {
      score: expenseScore,
      max: 20,
      rating: expenseRating,
      description: expenseDesc,
      status: totalIncome > 0 ? 'sufficient' : 'incomplete',
      expenseToIncomeRatio: Math.round(expenseRatio * 100),
      essentialRatioPercent: Math.round(essentialRatio)
    }
  };

  return {
    score: totalScore,
    status: isProvisional ? 'provisional' : 'calculated',
    label,
    breakdown,
    keyFactors: keyFactors.slice(0, 3),
    methodologyVersion: 'v1.0',
    lastCalculatedAt,
    disclaimer
  };
}

/**
 * Generates personalized, realistic tips based on actual financial records & score gaps.
 * Rules:
 * - Shows 3 prioritized tips at a time.
 * - Does not tell users to save a fixed arbitrary amount without considering circumstances.
 * - Never suggests taking loans/borrowing to boost scores.
 * - Never guarantees a score increase by a fixed number.
 */
export function generateFinancialTips(records: FinancialRecord[], score: FinancialTrustScore): TrustTip[] {
  const tips: TrustTip[] = [];

  const repaymentsCount = score.breakdown.repaymentHistory.onTimeCount + score.breakdown.repaymentHistory.lateCount;
  const monthsEvaluated = score.breakdown.incomeConsistency.monthsEvaluated;
  const hasExplicitSavings = score.breakdown.savingsHabits.hasExplicitSavings;
  const expenseRatio = score.breakdown.expenseManagement.expenseToIncomeRatio;

  // 1. Missing repayment tip
  if (repaymentsCount === 0) {
    tips.push({
      id: 'tip-add-repayments',
      title: 'Record rent or utility bill payments',
      description:
        'Logging on-time rent, electricity, or mobile recharge payments demonstrates repayment discipline to landlords and lenders.',
      iconName: 'repayment',
      category: 'Repayment',
      actionLabel: 'Add Bill Payment',
      actionLink: '/my-money',
      rationale:
        'You have zero repayment entries logged. Recording scheduled payments activates the Repayment History scoring component.'
    });
  }

  // 2. Multi-month tracking tip
  if (monthsEvaluated < 3) {
    tips.push({
      id: 'tip-track-multiple-months',
      title: 'Build 3 months of continuous income records',
      description:
        'Logging your earnings across 3 distinct calendar months helps verify income stability, which is especially important for freelancers and gig workers.',
      iconName: 'calendar',
      category: 'Income',
      actionLabel: 'Log Monthly Earnings',
      actionLink: '/my-money',
      rationale:
        `Your profile currently covers ${monthsEvaluated} recorded month${monthsEvaluated === 1 ? '' : 's'}. 3 months are required for full stability verification.`
    });
  }

  // 3. Savings record tip
  if (!hasExplicitSavings) {
    tips.push({
      id: 'tip-record-savings',
      title: 'Add emergency savings or deposit entries',
      description:
        'Record any money set aside in a bank deposit, digital piggy bank, or safety fund to document your conscious savings habit.',
      iconName: 'savings',
      category: 'Savings',
      actionLabel: 'Add Savings Entry',
      actionLink: '/my-money',
      rationale:
        'Your savings score is currently inferred only from monthly surplus. Adding dedicated savings entries makes your profile more complete.'
    });
  }

  // 4. Expense review tip
  if (expenseRatio > 85) {
    tips.push({
      id: 'tip-review-expenses',
      title: 'Review non-essential monthly expenses',
      description:
        'Take a closer look at everyday recurring expenses to see where small amounts can be conserved to expand your monthly breathing room.',
      iconName: 'expense',
      category: 'Expense',
      actionLabel: 'View Expense Breakdown',
      actionLink: '/my-money',
      rationale:
        `Recorded expenses currently represent ${expenseRatio}% of your income. Creating a wider buffer improves your financial resilience.`
    });
  }

  // 5. Passport refresh tip
  tips.push({
    id: 'tip-refresh-passport',
    title: 'Keep your Financial Passport up to date',
    description:
      'Refresh your Financial Trust Passport before sharing it with verification partners so it displays your latest on-time payments.',
    iconName: 'passport',
    category: 'Documentation',
    actionLabel: 'Check Passport',
    actionLink: '/passport',
    rationale:
      'Lenders and landlords look for recent timestamps to ensure financial documentation is current.'
  });

  // Always return top 3 tips
  return tips.slice(0, 3);
}

/**
 * Filter records by selected analysis period
 */
export function filterRecordsByPeriod(records: FinancialRecord[], period: AnalysisPeriod): FinancialRecord[] {
  if (!records || records.length === 0 || period === 'all_time') {
    return records || [];
  }

  // Determine reference date: use latest record date if available, or current ISO date
  const sortedDates = records
    .map((r) => r.recordDate)
    .filter(Boolean)
    .sort()
    .reverse();

  const referenceDateStr = sortedDates[0] || '2026-10-15';
  const refDate = new Date(referenceDateStr);
  const refYear = refDate.getFullYear();
  const refMonth = refDate.getMonth(); // 0-indexed

  if (period === 'this_month') {
    const targetMonthPrefix = `${refYear}-${String(refMonth + 1).padStart(2, '0')}`;
    return records.filter((r) => r.recordDate && r.recordDate.startsWith(targetMonthPrefix));
  }

  if (period === 'last_month') {
    const prevDate = new Date(refYear, refMonth - 1, 1);
    const targetMonthPrefix = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    return records.filter((r) => r.recordDate && r.recordDate.startsWith(targetMonthPrefix));
  }

  if (period === 'last_3_months') {
    const targetMonths = new Set<string>();
    for (let i = 0; i < 3; i++) {
      const d = new Date(refYear, refMonth - i, 1);
      targetMonths.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return records.filter((r) => r.recordDate && targetMonths.has(r.recordDate.slice(0, 7)));
  }

  return records;
}

/**
 * Calculate month-over-month comparison between selected period and previous period
 */
export function calculatePeriodComparison(records: FinancialRecord[], period: AnalysisPeriod): PeriodComparison {
  const currentRecords = filterRecordsByPeriod(records, period);

  let currentIncome = 0;
  let currentExpenses = 0;
  currentRecords.forEach((r) => {
    const amt = Number(r.amount) || 0;
    if (r.recordType === 'Income') currentIncome += amt;
    else if (r.recordType === 'Expense' || r.recordType === 'Repayment') currentExpenses += amt;
  });

  const periodLabels: Record<AnalysisPeriod, string> = {
    this_month: 'This Month',
    last_month: 'Last Month',
    last_3_months: 'Last 3 Months',
    all_time: 'All Tracked Records'
  };

  // Compare this month with last month
  if (period === 'this_month') {
    const prevRecords = filterRecordsByPeriod(records, 'last_month');
    let prevIncome = 0;
    let prevExpenses = 0;
    prevRecords.forEach((r) => {
      const amt = Number(r.amount) || 0;
      if (r.recordType === 'Income') prevIncome += amt;
      else if (r.recordType === 'Expense' || r.recordType === 'Repayment') prevExpenses += amt;
    });

    const hasPrev = prevRecords.length > 0;
    const incomeChange = hasPrev && prevIncome > 0 ? Math.round(((currentIncome - prevIncome) / prevIncome) * 100) : undefined;
    const expenseChange = hasPrev && prevExpenses > 0 ? Math.round(((currentExpenses - prevExpenses) / prevExpenses) * 100) : undefined;

    return {
      period,
      periodLabel: periodLabels[period],
      totalIncome: currentIncome,
      totalExpenses: currentExpenses,
      netRemaining: currentIncome - currentExpenses,
      previousIncome: hasPrev ? prevIncome : undefined,
      previousExpenses: hasPrev ? prevExpenses : undefined,
      incomeChangePercentage: incomeChange,
      expenseChangePercentage: expenseChange,
      hasPreviousPeriodData: hasPrev,
      notes: hasPrev
        ? `Comparison against previous month's ${prevRecords.length} records.`
        : 'Previous month has no records; month-over-month delta cannot be determined without data.'
    };
  }

  return {
    period,
    periodLabel: periodLabels[period],
    totalIncome: currentIncome,
    totalExpenses: currentExpenses,
    netRemaining: currentIncome - currentExpenses,
    hasPreviousPeriodData: false,
    notes: 'Period aggregated directly from ledger entries.'
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

export interface DeterministicAnalysisOptions {
  records?: FinancialRecord[];
  metrics: FinancialMetrics;
  profile: {
    occupation: string;
    monthlyIncomeRange?: string;
  };
  trustScore?: FinancialTrustScore;
  period?: AnalysisPeriod;
  periodComparison?: PeriodComparison;
}

export function generateDeterministicAnalysis(options: DeterministicAnalysisOptions): AIAnalysisResult {
  const { metrics, profile, trustScore, period, periodComparison } = options;

  const topCategory = metrics.topExpenseCategories[0];
  const secondCategory = metrics.topExpenseCategories[1];
  const netPositive = metrics.netRemaining > 0;
  const isFreelancerOrGig = profile.occupation === 'Freelancer' || profile.occupation === 'Gig Worker';

  // 1. Construct simple summary ("Your Money at a Glance")
  let summary = '';
  if (netPositive) {
    summary = `Your recorded income is ${formatINR(metrics.netRemaining)} higher than your expenses across ${metrics.monthsTracked} month${metrics.monthsTracked > 1 ? 's' : ''}. That demonstrates you are living comfortably within your means with cash remaining.`;
    if (topCategory) {
      summary += ` ${topCategory.category} is your largest expense, accounting for ${topCategory.percentage}% of what you spend.`;
    }
  } else if (metrics.totalIncome > 0 && metrics.netRemaining === 0) {
    summary = `Your recorded income matches your expenses exactly. You are breaking even, but there is limited breathing room for unexpected emergencies.`;
  } else if (metrics.totalIncome > 0 && metrics.netRemaining < 0) {
    summary = `Your expenses are currently ${formatINR(Math.abs(metrics.netRemaining))} higher than your recorded income. Reviewing discretionary spending will help restore cashflow balance.`;
  } else {
    summary = `You have added initial financial records, but additional income entries are needed to provide a full cashflow analysis.`;
  }

  // 2. Positive indicators ("What You Are Doing Well")
  const positiveIndicators: string[] = [];
  if (netPositive) {
    positiveIndicators.push(`Positive cash cushion: You retain approximately ${metrics.savingsRate}% of the money you make.`);
  }
  if (metrics.incomeConsistencyScore >= 75) {
    positiveIndicators.push(`Reliable earnings pattern: Your income demonstrates dependable month-to-month regularity (${metrics.incomeConsistencyRating}).`);
  } else if (metrics.totalIncome > 0) {
    positiveIndicators.push(`Active earning record: Multiple entries confirm active economic participation as a ${profile.occupation}.`);
  }
  if (metrics.repaymentsCount > 0) {
    positiveIndicators.push(`Disciplined repayment: You have ${metrics.repaymentsCount} recorded on-time payments totaling ${formatINR(metrics.repaymentsTotal)}.`);
  } else {
    positiveIndicators.push(`Zero recorded default notices or missed payment flags.`);
  }

  // 3. Where Your Money Goes
  let expenseBreakdownInsight = '';
  if (topCategory) {
    expenseBreakdownInsight = `Your spending is concentrated primarily in ${topCategory.category} (${formatINR(topCategory.total)}, ${topCategory.percentage}%)`;
    if (secondCategory) {
      expenseBreakdownInsight += ` followed by ${secondCategory.category} (${formatINR(secondCategory.total)}, ${secondCategory.percentage}%).`;
    } else {
      expenseBreakdownInsight += `.`;
    }
    if (periodComparison?.hasPreviousPeriodData && periodComparison.expenseChangePercentage !== undefined) {
      const dir = periodComparison.expenseChangePercentage >= 0 ? 'increased' : 'decreased';
      expenseBreakdownInsight += ` Overall monthly expenses have ${dir} by ${Math.abs(periodComparison.expenseChangePercentage)}% compared to last month.`;
    }
  } else {
    expenseBreakdownInsight = 'No specific expense categories recorded yet. Adding daily expenses will unlock spending breakdown analysis.';
  }

  // 4. Areas for attention ("What Needs Attention")
  const areasForAttention: string[] = [];
  if (topCategory && topCategory.percentage >= 40) {
    areasForAttention.push(`High concentration in ${topCategory.category}: ${topCategory.percentage}% of your expenses go here. A small reduction can strengthen your cash cushion.`);
  }
  if (metrics.expenseToIncomeRatio > 85) {
    areasForAttention.push(`Tight expense margin: You spend ${metrics.expenseToIncomeRatio}% of what you make, leaving limited room for unplanned emergencies.`);
  }
  if (metrics.monthsTracked < 3) {
    areasForAttention.push(`Short tracking history: Verification partners prefer seeing at least 3 months of consistent records.`);
  }
  if (metrics.repaymentsCount === 0) {
    areasForAttention.push(`No repayment records: Logging bills or rent will verify repayment reliability.`);
  }

  // 5. Practical suggestions ("Your Next Three Steps")
  const actionableSuggestions: string[] = [];
  if (isFreelancerOrGig) {
    actionableSuggestions.push(`Log each freelance milestone and client retainer to document continuous income stability.`);
  } else {
    actionableSuggestions.push(`Aim to set aside a modest reserve as soon as income arrives to formalize your emergency fund.`);
  }
  if (topCategory) {
    actionableSuggestions.push(`Review everyday spending in ${topCategory.category} for two weeks to find opportunities to conserve ₹500 to ₹1,500.`);
  }
  actionableSuggestions.push(`Record all regular rent, utility, and mobile recharge receipts as proof of scheduled payment discipline.`);

  // 6. Financial Trust Score explanation
  let trustScoreExplanation = '';
  if (trustScore && trustScore.status !== 'insufficient_data') {
    trustScoreExplanation = `Your Financial Trust Score is currently ${trustScore.score}/100 (${trustScore.label}). This reflects ${trustScore.breakdown.incomeConsistency.score}/30 for income consistency, ${trustScore.breakdown.savingsHabits.score}/25 for savings habits, ${trustScore.breakdown.repaymentHistory.score}/25 for repayment history, and ${trustScore.breakdown.expenseManagement.score}/20 for expense management.`;
  } else {
    trustScoreExplanation = 'Your Financial Trust Score is awaiting additional entries. Adding income and expense records across 3+ entries will generate your provisional score.';
  }

  // 7. Missing information ("What Information Is Missing")
  const missingInformation: string[] = [...metrics.dataSufficiency.missingAreas];
  if (missingInformation.length === 0) {
    missingInformation.push('Add a utility bill or rent payment record as additional supporting proof.');
  }

  return {
    summary,
    positiveIndicators: positiveIndicators.slice(0, 3),
    expenseBreakdownInsight,
    areasForAttention: areasForAttention.slice(0, 2),
    actionableSuggestions: actionableSuggestions.slice(0, 3),
    trustScoreExplanation,
    missingInformation: missingInformation.slice(0, 2),
    period,
    periodComparison,
    metrics,
    trustScore,
    modelUsed: 'Deterministic Financial Clarity Engine',
    generatedAt: new Date().toISOString(),
    source: 'deterministic_engine'
  };
}

