// server/index.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import crypto from "crypto";

// server/services/analyzer.ts
import { GoogleGenAI } from "@google/genai";

// src/lib/calculations.ts
function calculateFinancialMetrics(records) {
  const trustScore = calculateFinancialTrustScore(records);
  if (!records || records.length === 0) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netRemaining: 0,
      savingsRate: 0,
      incomeConsistencyScore: 0,
      incomeConsistencyRating: "Variable / Developing",
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
          "Add your income records to start",
          "Add day-to-day expense records",
          "Add rent, bill, or loan repayment records"
        ]
      }
    };
  }
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalSavings = 0;
  let repaymentsCount = 0;
  let repaymentsTotal = 0;
  const monthlyMap = {};
  const categoryMap = {};
  records.forEach((rec) => {
    const rawAmount = Number(rec.amount);
    if (!isFinite(rawAmount) || rawAmount <= 0) {
      return;
    }
    const amount = Math.min(rawAmount, 1e9);
    const monthKey = rec.recordDate && typeof rec.recordDate === "string" && rec.recordDate.length >= 7 ? rec.recordDate.slice(0, 7) : "2026-10";
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { income: 0, expenses: 0, repayments: 0, savings: 0 };
    }
    switch (rec.recordType) {
      case "Income":
        totalIncome += amount;
        monthlyMap[monthKey].income += amount;
        break;
      case "Expense":
        totalExpenses += amount;
        monthlyMap[monthKey].expenses += amount;
        if (!categoryMap[rec.category]) {
          categoryMap[rec.category] = { total: 0, count: 0 };
        }
        categoryMap[rec.category].total += amount;
        categoryMap[rec.category].count += 1;
        break;
      case "Savings":
        totalSavings += amount;
        monthlyMap[monthKey].savings += amount;
        break;
      case "Repayment":
        repaymentsCount += 1;
        repaymentsTotal += amount;
        totalExpenses += amount;
        monthlyMap[monthKey].repayments += amount;
        monthlyMap[monthKey].expenses += amount;
        const repCat = rec.category || "Loan & EMI Repayment";
        if (!categoryMap[repCat]) {
          categoryMap[repCat] = { total: 0, count: 0 };
        }
        categoryMap[repCat].total += amount;
        categoryMap[repCat].count += 1;
        break;
    }
  });
  const netRemaining = totalIncome - totalExpenses;
  const sortedMonths = Object.keys(monthlyMap).sort();
  const monthlyBreakdown = sortedMonths.map((mKey) => {
    const d = monthlyMap[mKey];
    const [year, month] = mKey.split("-");
    const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const monthName = dateObj.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
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
  const effectiveSavings = totalSavings + (netRemaining > 0 ? netRemaining * 0.4 : 0);
  const rawSavingsRate = totalIncome > 0 ? effectiveSavings / totalIncome * 100 : 0;
  const savingsRate = Math.min(100, Math.max(0, Math.round(rawSavingsRate)));
  const expenseToIncomeRatio = totalIncome > 0 ? Math.round(totalExpenses / totalIncome * 100) : 100;
  let incomeConsistencyScore = 65;
  let incomeConsistencyRating = "Variable / Developing";
  if (monthsTracked >= 2) {
    const monthlyIncomes = monthlyBreakdown.map((m) => m.income);
    const avgIncome = monthlyIncomes.reduce((a, b) => a + b, 0) / monthlyIncomes.length;
    if (avgIncome > 0) {
      const variance = monthlyIncomes.reduce((acc, val) => acc + Math.pow(val - avgIncome, 2), 0) / monthlyIncomes.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / avgIncome;
      if (cv <= 0.18) {
        incomeConsistencyScore = Math.min(96, Math.max(88, Math.round(98 - cv * 50)));
        incomeConsistencyRating = "Very Consistent";
      } else if (cv <= 0.42) {
        incomeConsistencyScore = Math.min(87, Math.max(72, Math.round(90 - cv * 40)));
        incomeConsistencyRating = "Moderately Consistent";
      } else {
        incomeConsistencyScore = Math.min(71, Math.max(50, Math.round(75 - cv * 30)));
        incomeConsistencyRating = "Variable / Developing";
      }
    }
  } else if (monthsTracked === 1 && totalIncome > 0) {
    incomeConsistencyScore = 70;
    incomeConsistencyRating = "Variable / Developing";
  }
  let repaymentRegularityScore = 0;
  if (repaymentsCount >= 3) {
    repaymentRegularityScore = 92;
  } else if (repaymentsCount >= 1) {
    repaymentRegularityScore = 78;
  } else {
    repaymentRegularityScore = 50;
  }
  const topExpenseCategories = Object.entries(categoryMap).map(([category, stats]) => ({
    category,
    total: Math.round(stats.total),
    percentage: totalExpenses > 0 ? Math.round(stats.total / totalExpenses * 100) : 0,
    count: stats.count
  })).sort((a, b) => b.total - a.total);
  const missingAreas = [];
  if (records.length < 5) {
    missingAreas.push("Add at least 5 financial records for a clearer evaluation");
  }
  if (monthsTracked < 3) {
    missingAreas.push(`Add records across 3 different months (currently ${monthsTracked} month${monthsTracked === 1 ? "" : "s"})`);
  }
  if (repaymentsCount === 0) {
    missingAreas.push("Add regular bill, rent, or EMI payments to show disciplined repayment");
  }
  if (totalSavings === 0 && netRemaining <= 0) {
    missingAreas.push("Record any emergency savings or deposits to show safety cushion");
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
function calculateFinancialTrustScore(records, profile) {
  const lastCalculatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const disclaimer = "The NEXUS Financial Trust Score is an alternative financial clarity metric calculated strictly from your verified records. It is not an official credit bureau score (e.g. CIBIL/Experian) and does not guarantee loan or credit approval.";
  if (!records || records.length === 0) {
    return {
      score: 0,
      status: "insufficient_data",
      label: "Data Awaiting",
      breakdown: {
        incomeConsistency: {
          score: 0,
          max: 30,
          rating: "No records",
          description: "No income entries found. Add your monthly earnings to begin evaluation.",
          status: "incomplete",
          monthsEvaluated: 0
        },
        savingsHabits: {
          score: 0,
          max: 25,
          rating: "No records",
          description: "No savings or cashflow history available.",
          status: "incomplete",
          savingsRatePercent: 0,
          hasExplicitSavings: false
        },
        repaymentHistory: {
          score: 0,
          max: 25,
          rating: "No records",
          description: "No bills, rent, or EMI repayment records submitted.",
          status: "incomplete",
          onTimeCount: 0,
          lateCount: 0,
          hasRepayments: false
        },
        expenseManagement: {
          score: 0,
          max: 20,
          rating: "No records",
          description: "No expense records found.",
          status: "incomplete",
          expenseToIncomeRatio: 0,
          essentialRatioPercent: 0
        }
      },
      keyFactors: [
        {
          type: "neutral",
          text: "Add at least 3 financial records to generate your provisional Trust Score."
        }
      ],
      methodologyVersion: "v1.0",
      lastCalculatedAt,
      disclaimer
    };
  }
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalExplicitSavings = 0;
  let explicitSavingsCount = 0;
  let onTimeRepaymentsCount = 0;
  let lateRepaymentsCount = 0;
  let essentialExpenses = 0;
  const monthlyIncomeMap = {};
  const monthlyExpenseMap = {};
  const essentialCategories = /* @__PURE__ */ new Set([
    "Food & Groceries",
    "Rent & Housing",
    "Utilities & Bills",
    "Education & Learning",
    "Health & Medical",
    "Work Supplies / Tools"
  ]);
  records.forEach((rec) => {
    const rawAmt = Number(rec.amount);
    if (!isFinite(rawAmt) || rawAmt <= 0) return;
    const amt = Math.min(rawAmt, 1e9);
    const monthKey = rec.recordDate && typeof rec.recordDate === "string" && rec.recordDate.length >= 7 ? rec.recordDate.slice(0, 7) : "unknown";
    if (rec.recordType === "Income") {
      totalIncome += amt;
      monthlyIncomeMap[monthKey] = (monthlyIncomeMap[monthKey] || 0) + amt;
    } else if (rec.recordType === "Expense") {
      totalExpenses += amt;
      monthlyExpenseMap[monthKey] = (monthlyExpenseMap[monthKey] || 0) + amt;
      if (essentialCategories.has(rec.category)) {
        essentialExpenses += amt;
      }
    } else if (rec.recordType === "Savings") {
      totalExplicitSavings += amt;
      explicitSavingsCount += 1;
    } else if (rec.recordType === "Repayment") {
      totalExpenses += amt;
      monthlyExpenseMap[monthKey] = (monthlyExpenseMap[monthKey] || 0) + amt;
      essentialExpenses += amt;
      const descLower = (rec.description || "").toLowerCase();
      if (descLower.includes("late") || descLower.includes("delay") || descLower.includes("overdue") || descLower.includes("missed")) {
        lateRepaymentsCount += 1;
      } else {
        onTimeRepaymentsCount += 1;
      }
    }
  });
  const netRemaining = totalIncome - totalExpenses;
  const incomeMonths = Object.keys(monthlyIncomeMap).filter((k) => monthlyIncomeMap[k] > 0);
  const totalMonthsTracked = Math.max(incomeMonths.length, Object.keys(monthlyExpenseMap).length);
  if (records.length < 3 || totalIncome === 0) {
    return {
      score: 0,
      status: "insufficient_data",
      label: "Add more information to calculate your score",
      breakdown: {
        incomeConsistency: {
          score: 0,
          max: 30,
          rating: "Awaiting Income Records",
          description: totalIncome === 0 ? "No earnings recorded yet. Add your client payouts, salary, or gig income." : "Requires at least 3 verified entries.",
          status: "incomplete",
          monthsEvaluated: incomeMonths.length
        },
        savingsHabits: {
          score: 0,
          max: 25,
          rating: "Incomplete Data",
          description: "Savings habits cannot be evaluated without income records.",
          status: "incomplete",
          savingsRatePercent: 0,
          hasExplicitSavings: explicitSavingsCount > 0
        },
        repaymentHistory: {
          score: 0,
          max: 25,
          rating: "Incomplete Data",
          description: "Repayment history requires active profile records.",
          status: "incomplete",
          onTimeCount: onTimeRepaymentsCount,
          lateCount: lateRepaymentsCount,
          hasRepayments: onTimeRepaymentsCount + lateRepaymentsCount > 0
        },
        expenseManagement: {
          score: 0,
          max: 20,
          rating: "Incomplete Data",
          description: "Expense management requires baseline entries.",
          status: "incomplete",
          expenseToIncomeRatio: 0,
          essentialRatioPercent: 0
        }
      },
      keyFactors: [
        {
          type: "neutral",
          text: "Add your monthly income and living expense records to calculate your score."
        }
      ],
      methodologyVersion: "v1.0",
      lastCalculatedAt,
      disclaimer
    };
  }
  const isProvisional = records.length < 5 || incomeMonths.length < 2;
  let incomeScore = 19;
  let incomeRating = "Active Earnings Tracked";
  let incomeDesc = "Recorded active income. Tracking across 2+ months will verify stability.";
  let cvRatio = void 0;
  if (incomeMonths.length >= 2) {
    const monthlyValues = incomeMonths.map((k) => monthlyIncomeMap[k]);
    const avg = monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length;
    if (avg > 0) {
      const variance = monthlyValues.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / monthlyValues.length;
      const stdDev = Math.sqrt(variance);
      cvRatio = stdDev / avg;
      if (cvRatio <= 0.2) {
        incomeScore = 30;
        incomeRating = "Very Consistent Flow";
        incomeDesc = `Strong regularity across ${incomeMonths.length} recorded months (CV: ${(cvRatio * 100).toFixed(0)}%).`;
      } else if (cvRatio <= 0.38) {
        incomeScore = 26;
        incomeRating = "Dependable Inflow";
        incomeDesc = `Stable income flow with healthy freelance variance across ${incomeMonths.length} months.`;
      } else if (cvRatio <= 0.58) {
        incomeScore = 22;
        incomeRating = "Moderate Variable Flow";
        incomeDesc = `Expected freelance fluctuation across client milestones. Active earning pattern demonstrated.`;
      } else {
        incomeScore = 18;
        incomeRating = "Developing Regularity";
        incomeDesc = `Income varies noticeably across recorded months. Consistent monthly tracking will strengthen this factor.`;
      }
    }
  }
  let savingsScore = 0;
  let savingsRating = "Developing Cushion";
  let savingsDesc = "";
  const netMarginPercent = totalIncome > 0 ? netRemaining / totalIncome * 100 : 0;
  let explicitSavingsPts = 0;
  if (explicitSavingsCount >= 2) {
    explicitSavingsPts = 15;
  } else if (explicitSavingsCount === 1) {
    explicitSavingsPts = 10;
  }
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
    savingsRating = savingsScore >= 20 ? "Strong Savings Habit" : "Active Savings Habit";
    savingsDesc = `${explicitSavingsCount} savings deposits logged and retaining ${Math.max(0, Math.round(netMarginPercent))}% of earnings.`;
  } else if (netMarginPercent >= 15) {
    savingsScore = Math.min(20, Math.round(10 + netMarginPercent / 100 * 10));
    savingsRating = "Positive Cash Cushion";
    savingsDesc = `Retaining ~${Math.round(netMarginPercent)}% cash buffer after expenses. Recording dedicated savings entries will unlock full points.`;
  } else if (netMarginPercent > 0) {
    savingsScore = 12;
    savingsRating = "Modest Buffer";
    savingsDesc = `Positive monthly cashflow (+\u20B9${formatINR(netRemaining).replace("\u20B9", "")}), with no explicit emergency deposits logged yet.`;
  } else {
    savingsScore = 6;
    savingsRating = "Limited Buffer";
    savingsDesc = `Expenses currently match or exceed recorded income. No explicit savings records added yet.`;
  }
  let repaymentScore = 0;
  let repaymentRating = "";
  let repaymentDesc = "";
  const totalRepayments = onTimeRepaymentsCount + lateRepaymentsCount;
  if (totalRepayments === 0) {
    repaymentScore = 14;
    repaymentRating = "No Records Submitted";
    repaymentDesc = "No bill, rent, or EMI payments logged yet. Recording scheduled payments will unlock up to 25 points.";
  } else if (lateRepaymentsCount === 0) {
    if (onTimeRepaymentsCount >= 3) {
      repaymentScore = 25;
      repaymentRating = "Exemplary On-Time Record";
      repaymentDesc = `All ${onTimeRepaymentsCount} recorded bill/EMI payments fulfilled on schedule without delay.`;
    } else if (onTimeRepaymentsCount >= 1) {
      repaymentScore = 21;
      repaymentRating = "Verified On-Time Payments";
      repaymentDesc = `${onTimeRepaymentsCount} payment${onTimeRepaymentsCount > 1 ? "s" : ""} recorded on time. Adding 3+ payments verifies full regularity.`;
    }
  } else {
    const penalty = lateRepaymentsCount * 4;
    repaymentScore = Math.max(8, 25 - penalty);
    repaymentRating = "Contains Delayed Records";
    repaymentDesc = `${onTimeRepaymentsCount} on-time payment${onTimeRepaymentsCount === 1 ? "" : "s"}, with ${lateRepaymentsCount} delay noted in ledger.`;
  }
  let expenseScore = 0;
  let expenseRating = "";
  let expenseDesc = "";
  const expenseRatio = totalIncome > 0 ? totalExpenses / totalIncome : 1;
  const essentialRatio = totalExpenses > 0 ? essentialExpenses / totalExpenses * 100 : 0;
  if (expenseRatio <= 0.65) {
    expenseScore = 20;
    expenseRating = "Disciplined Margin";
    expenseDesc = `Total expenses are well-managed at ${(expenseRatio * 100).toFixed(0)}% of recorded income, maintaining strong financial flexibility.`;
  } else if (expenseRatio <= 0.85) {
    expenseScore = 17;
    expenseRating = "Healthy Living Ratio";
    expenseDesc = `Living expenses are balanced at ${(expenseRatio * 100).toFixed(0)}% of income, comfortably within sustainable limits.`;
  } else if (expenseRatio <= 1) {
    expenseScore = 14;
    expenseRating = "Break-Even Cashflow";
    expenseDesc = `Living expenses absorb ${(expenseRatio * 100).toFixed(0)}% of income. Expenses match incoming earnings.`;
  } else {
    if (essentialRatio >= 60) {
      expenseScore = 12;
      expenseRating = "Essential Expenses Recognized";
      expenseDesc = `Expenses exceed income, but ${Math.round(essentialRatio)}% represent essential obligations (rent, food, healthcare, tools).`;
    } else {
      expenseScore = 9;
      expenseRating = "High Expense Margin";
      expenseDesc = `Expenses exceed recorded income (${(expenseRatio * 100).toFixed(0)}%). Reviewing discretionary spending is advised.`;
    }
  }
  const totalScore = Math.min(100, Math.max(0, incomeScore + savingsScore + repaymentScore + expenseScore));
  let label = "Developing Financial Trust";
  if (isProvisional) {
    label = "Provisional Financial Trust Score";
  } else if (totalScore >= 80) {
    label = "Strong Financial Trust";
  } else if (totalScore >= 65) {
    label = "Solid Financial Trust";
  } else if (totalScore >= 50) {
    label = "Building Financial Trust";
  }
  const keyFactors = [];
  if (incomeScore >= 24) {
    keyFactors.push({
      type: "positive",
      text: `Income regularity: ${incomeRating} (${incomeScore}/30 pts).`
    });
  } else if (incomeMonths.length === 1) {
    keyFactors.push({
      type: "neutral",
      text: `Provisional income: 1 month recorded (+${incomeScore} pts). Add 2+ months to unlock full stability score.`
    });
  }
  if (repaymentScore >= 21) {
    keyFactors.push({
      type: "positive",
      text: `Repayment discipline: ${onTimeRepaymentsCount} on-time payments verified (+${repaymentScore} pts).`
    });
  } else if (totalRepayments === 0) {
    keyFactors.push({
      type: "neutral",
      text: "No debt or rent repayments logged yet (+14 baseline pts). Logging bills will increase this factor."
    });
  }
  if (savingsScore >= 18) {
    keyFactors.push({
      type: "positive",
      text: `Positive savings margin: retaining ~${Math.max(0, Math.round(netMarginPercent))}% of earnings (+${savingsScore} pts).`
    });
  } else if (netMarginPercent <= 0) {
    keyFactors.push({
      type: "attention",
      text: `Tight cashflow margin: expenses currently absorb 100% of recorded income.`
    });
  }
  const breakdown = {
    incomeConsistency: {
      score: incomeScore,
      max: 30,
      rating: incomeRating,
      description: incomeDesc,
      status: incomeMonths.length >= 2 ? "sufficient" : "provisional",
      cvRatio,
      monthsEvaluated: incomeMonths.length
    },
    savingsHabits: {
      score: savingsScore,
      max: 25,
      rating: savingsRating,
      description: savingsDesc,
      status: explicitSavingsCount > 0 ? "sufficient" : "provisional",
      savingsRatePercent: Math.max(0, Math.round(netMarginPercent)),
      hasExplicitSavings: explicitSavingsCount > 0
    },
    repaymentHistory: {
      score: repaymentScore,
      max: 25,
      rating: repaymentRating,
      description: repaymentDesc,
      status: totalRepayments >= 2 ? "sufficient" : totalRepayments === 1 ? "provisional" : "incomplete",
      onTimeCount: onTimeRepaymentsCount,
      lateCount: lateRepaymentsCount,
      hasRepayments: totalRepayments > 0
    },
    expenseManagement: {
      score: expenseScore,
      max: 20,
      rating: expenseRating,
      description: expenseDesc,
      status: totalIncome > 0 ? "sufficient" : "incomplete",
      expenseToIncomeRatio: Math.round(expenseRatio * 100),
      essentialRatioPercent: Math.round(essentialRatio)
    }
  };
  return {
    score: totalScore,
    status: isProvisional ? "provisional" : "calculated",
    label,
    breakdown,
    keyFactors: keyFactors.slice(0, 3),
    methodologyVersion: "v1.0",
    lastCalculatedAt,
    disclaimer
  };
}
function filterRecordsByPeriod(records, period) {
  if (!records || records.length === 0 || period === "all_time") {
    return records || [];
  }
  const sortedDates = records.map((r) => r.recordDate).filter(Boolean).sort().reverse();
  const referenceDateStr = sortedDates[0] || "2026-10-15";
  const refDate = new Date(referenceDateStr);
  const refYear = refDate.getFullYear();
  const refMonth = refDate.getMonth();
  if (period === "this_month") {
    const targetMonthPrefix = `${refYear}-${String(refMonth + 1).padStart(2, "0")}`;
    return records.filter((r) => r.recordDate && r.recordDate.startsWith(targetMonthPrefix));
  }
  if (period === "last_month") {
    const prevDate = new Date(refYear, refMonth - 1, 1);
    const targetMonthPrefix = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    return records.filter((r) => r.recordDate && r.recordDate.startsWith(targetMonthPrefix));
  }
  if (period === "last_3_months") {
    const targetMonths = /* @__PURE__ */ new Set();
    for (let i = 0; i < 3; i++) {
      const d = new Date(refYear, refMonth - i, 1);
      targetMonths.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return records.filter((r) => r.recordDate && targetMonths.has(r.recordDate.slice(0, 7)));
  }
  return records;
}
function calculatePeriodComparison(records, period) {
  const currentRecords = filterRecordsByPeriod(records, period);
  let currentIncome = 0;
  let currentExpenses = 0;
  currentRecords.forEach((r) => {
    const amt = Number(r.amount) || 0;
    if (r.recordType === "Income") currentIncome += amt;
    else if (r.recordType === "Expense" || r.recordType === "Repayment") currentExpenses += amt;
  });
  const periodLabels = {
    this_month: "This Month",
    last_month: "Last Month",
    last_3_months: "Last 3 Months",
    all_time: "All Tracked Records"
  };
  if (period === "this_month") {
    const prevRecords = filterRecordsByPeriod(records, "last_month");
    let prevIncome = 0;
    let prevExpenses = 0;
    prevRecords.forEach((r) => {
      const amt = Number(r.amount) || 0;
      if (r.recordType === "Income") prevIncome += amt;
      else if (r.recordType === "Expense" || r.recordType === "Repayment") prevExpenses += amt;
    });
    const hasPrev = prevRecords.length > 0;
    const incomeChange = hasPrev && prevIncome > 0 ? Math.round((currentIncome - prevIncome) / prevIncome * 100) : void 0;
    const expenseChange = hasPrev && prevExpenses > 0 ? Math.round((currentExpenses - prevExpenses) / prevExpenses * 100) : void 0;
    return {
      period,
      periodLabel: periodLabels[period],
      totalIncome: currentIncome,
      totalExpenses: currentExpenses,
      netRemaining: currentIncome - currentExpenses,
      previousIncome: hasPrev ? prevIncome : void 0,
      previousExpenses: hasPrev ? prevExpenses : void 0,
      incomeChangePercentage: incomeChange,
      expenseChangePercentage: expenseChange,
      hasPreviousPeriodData: hasPrev,
      notes: hasPrev ? `Comparison against previous month's ${prevRecords.length} records.` : "Previous month has no records; month-over-month delta cannot be determined without data."
    };
  }
  return {
    period,
    periodLabel: periodLabels[period],
    totalIncome: currentIncome,
    totalExpenses: currentExpenses,
    netRemaining: currentIncome - currentExpenses,
    hasPreviousPeriodData: false,
    notes: "Period aggregated directly from ledger entries."
  };
}
function formatINR(amount) {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0
  }).format(absVal);
  return `${isNegative ? "-\u20B9" : "\u20B9"}${formatted}`;
}

// server/services/analyzer.ts
function isValidApiKey(key) {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.length > 10 && !trimmed.startsWith("your_") && !trimmed.includes("placeholder");
}
async function generateFinancialAnalysis(options) {
  const { metrics, profile, trustScore, period, periodComparison } = options;
  const apiKey = process.env.GEMINI_API_KEY;
  if (isValidApiKey(apiKey)) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const scoreValue = trustScore ? `${trustScore.score}/100 (${trustScore.label})` : "Awaiting data";
      const scoreFactors = trustScore?.keyFactors?.map((k) => k.text).join("; ") || "Standard metrics";
      const prompt = `You are the AI Financial Clarity Advisor for NEXUS \u2014 a Financial Identity & Trust Network.
Your task is to analyze the user's financial records and explain their money habits in simple, short, encouraging English that anyone without financial knowledge can understand.

USER PROFILE (ANONYMIZED):
- Occupation: ${profile.occupation}
- Monthly Income Range: ${profile.monthlyIncomeRange || "Not specified"}

FINANCIAL SUMMARY (Aggregated from verified user records):
- Analysis Period: ${periodComparison?.periodLabel || period || "Current Period"}
- Total Recorded Income: ${formatINR(metrics.totalIncome)}
- Total Recorded Expenses: ${formatINR(metrics.totalExpenses)}
- Net Remaining Money: ${formatINR(metrics.netRemaining)}
- Months of Records: ${metrics.monthsTracked} months (${metrics.totalRecordsCount} records)
- Income Consistency Score: ${metrics.incomeConsistencyScore}/100 (${metrics.incomeConsistencyRating})
- Savings Rate: ${metrics.savingsRate}%
- Top Expense Categories: ${metrics.topExpenseCategories.slice(0, 3).map((c) => `${c.category} (${formatINR(c.total)}, ${c.percentage}%)`).join(", ") || "None recorded"}
- On-time Repayments Tracked: ${metrics.repaymentsCount} records (${formatINR(metrics.repaymentsTotal)})
- Financial Trust Score: ${scoreValue}
- Score Calculation Factors: ${scoreFactors}
- Month-over-Month Notes: ${periodComparison?.notes || "Direct period summary"}
${periodComparison?.hasPreviousPeriodData ? `- Income Change: ${periodComparison.incomeChangePercentage ?? 0}% vs previous month; Expense Change: ${periodComparison.expenseChangePercentage ?? 0}% vs previous month` : ""}

CRITICAL RULES:
1. Explain in simple, friendly English. Avoid financial jargon.
2. NEVER invent numbers, never fake credit scores, and never guarantee loan approval or score increases.
3. The numerical Financial Trust Score is already calculated deterministically by application code. You may explain what influenced this score, but you must NEVER invent or override the score.
4. If there is only 1 month of records or data is incomplete, state honestly that comparison over time requires more records.
5. Output strict JSON with NO markdown code fences or backticks, matching this exact schema:
{
  "summary": "2-3 short sentences for 'Your Money at a Glance'.",
  "positiveIndicators": ["2-3 specific things they are managing well"],
  "expenseBreakdownInsight": "1-2 sentences on 'Where Your Money Goes' explaining the largest expense categories and changes.",
  "areasForAttention": ["1-2 specific observations needing attention like irregular income or tight margin"],
  "actionableSuggestions": ["Up to 3 specific, realistic next steps"],
  "trustScoreExplanation": "2 sentences explaining the calculated score (${trustScore?.score || 0}/100) and the factors that contributed to it.",
  "missingInformation": ["1-2 specific missing records that would make their profile more complete"]
}`;
      let responseText = "";
      const preferredModel = process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it";
      let usedModel = preferredModel;
      const candidateModels = [preferredModel, "gemma-4-26b-a4b-it", "gemini-2.5-flash"];
      let lastErr = null;
      for (const m of candidateModels) {
        try {
          const resp = await ai.models.generateContent({
            model: m,
            contents: prompt
          });
          if (resp && resp.text) {
            responseText = resp.text;
            usedModel = m;
            break;
          }
        } catch (err) {
          lastErr = err;
        }
      }
      if (!responseText) {
        throw lastErr || new Error("No content returned from Gemini models");
      }
      responseText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(responseText);
      return {
        summary: parsed.summary,
        positiveIndicators: Array.isArray(parsed.positiveIndicators) ? parsed.positiveIndicators : [],
        expenseBreakdownInsight: parsed.expenseBreakdownInsight || "",
        areasForAttention: Array.isArray(parsed.areasForAttention) ? parsed.areasForAttention : [],
        actionableSuggestions: Array.isArray(parsed.actionableSuggestions) ? parsed.actionableSuggestions : [],
        trustScoreExplanation: parsed.trustScoreExplanation || "",
        missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : metrics.dataSufficiency.missingAreas,
        period,
        periodComparison,
        metrics,
        trustScore,
        modelUsed: usedModel,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        source: "gemini_api"
      };
    } catch (err) {
      const sanitizedMsg = (err?.message || "AI request error").replace(/key=[^&\s]+/gi, "key=[REDACTED]");
      console.warn("[NEXUS AI] Gemini API issue, falling back to deterministic engine:", sanitizedMsg);
      return generateDeterministicAnalysis(options);
    }
  }
  return generateDeterministicAnalysis(options);
}
function generateDeterministicAnalysis(options) {
  const { metrics, profile, trustScore, period, periodComparison } = options;
  const topCategory = metrics.topExpenseCategories[0];
  const secondCategory = metrics.topExpenseCategories[1];
  const netPositive = metrics.netRemaining > 0;
  const isFreelancerOrGig = profile.occupation === "Freelancer" || profile.occupation === "Gig Worker";
  let summary = "";
  if (netPositive) {
    summary = `Your recorded income is ${formatINR(metrics.netRemaining)} higher than your expenses across ${metrics.monthsTracked} month${metrics.monthsTracked > 1 ? "s" : ""}. That demonstrates you are living comfortably within your means with cash remaining.`;
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
  const positiveIndicators = [];
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
  let expenseBreakdownInsight = "";
  if (topCategory) {
    expenseBreakdownInsight = `Your spending is concentrated primarily in ${topCategory.category} (${formatINR(topCategory.total)}, ${topCategory.percentage}%)`;
    if (secondCategory) {
      expenseBreakdownInsight += ` followed by ${secondCategory.category} (${formatINR(secondCategory.total)}, ${secondCategory.percentage}%).`;
    } else {
      expenseBreakdownInsight += `.`;
    }
    if (periodComparison?.hasPreviousPeriodData && periodComparison.expenseChangePercentage !== void 0) {
      const dir = periodComparison.expenseChangePercentage >= 0 ? "increased" : "decreased";
      expenseBreakdownInsight += ` Overall monthly expenses have ${dir} by ${Math.abs(periodComparison.expenseChangePercentage)}% compared to last month.`;
    }
  } else {
    expenseBreakdownInsight = "No specific expense categories recorded yet. Adding daily expenses will unlock spending breakdown analysis.";
  }
  const areasForAttention = [];
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
  const actionableSuggestions = [];
  if (isFreelancerOrGig) {
    actionableSuggestions.push(`Log each freelance milestone and client retainer to document continuous income stability.`);
  } else {
    actionableSuggestions.push(`Aim to set aside a modest reserve as soon as income arrives to formalize your emergency fund.`);
  }
  if (topCategory) {
    actionableSuggestions.push(`Review everyday spending in ${topCategory.category} for two weeks to find opportunities to conserve \u20B9500 to \u20B91,500.`);
  }
  actionableSuggestions.push(`Record all regular rent, utility, and mobile recharge receipts as proof of scheduled payment discipline.`);
  let trustScoreExplanation = "";
  if (trustScore && trustScore.status !== "insufficient_data") {
    trustScoreExplanation = `Your Financial Trust Score is currently ${trustScore.score}/100 (${trustScore.label}). This reflects ${trustScore.breakdown.incomeConsistency.score}/30 for income consistency, ${trustScore.breakdown.savingsHabits.score}/25 for savings habits, ${trustScore.breakdown.repaymentHistory.score}/25 for repayment history, and ${trustScore.breakdown.expenseManagement.score}/20 for expense management.`;
  } else {
    trustScoreExplanation = "Your Financial Trust Score is awaiting additional entries. Adding income and expense records across 3+ entries will generate your provisional score.";
  }
  const missingInformation = [...metrics.dataSufficiency.missingAreas];
  if (missingInformation.length === 0) {
    missingInformation.push("Add a utility bill or rent payment record as additional supporting proof.");
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
    modelUsed: "nexus-financial-engine-v1 (Deterministic)",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: "deterministic_engine"
  };
}
async function answerFollowUpQuestion(options) {
  const { question, metrics, trustScore, profile, periodComparison } = options;
  const apiKey = process.env.GEMINI_API_KEY;
  if (isValidApiKey(apiKey)) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are the AI Financial Clarity Advisor for NEXUS. Answer the user's specific question concisely (2 to 4 sentences in plain, friendly English) using ONLY their verified financial data.
DO NOT use financial jargon, DO NOT make up fake credit bureau numbers, and DO NOT guarantee loan approvals.

USER QUESTION: "${question}"

AUTHORIZED FINANCIAL FACTS:
- Occupation: ${profile.occupation}
- Total Income: ${formatINR(metrics.totalIncome)}
- Total Expenses: ${formatINR(metrics.totalExpenses)}
- Net Remaining: ${formatINR(metrics.netRemaining)}
- Savings Rate: ${metrics.savingsRate}%
- Months Tracked: ${metrics.monthsTracked} months
- Top Expense Categories: ${metrics.topExpenseCategories.map((c) => `${c.category}: ${formatINR(c.total)} (${c.percentage}%)`).join(", ") || "None"}
- Repayments Count: ${metrics.repaymentsCount} records (${formatINR(metrics.repaymentsTotal)})
- Calculated Trust Score: ${trustScore ? `${trustScore.score}/100` : "Awaiting data"}
- Score Breakdown: Income: ${trustScore?.breakdown.incomeConsistency.score}/30, Savings: ${trustScore?.breakdown.savingsHabits.score}/25, Repayments: ${trustScore?.breakdown.repaymentHistory.score}/25, Expenses: ${trustScore?.breakdown.expenseManagement.score}/20.`;
      const preferredModel = process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it";
      const resp = await ai.models.generateContent({
        model: preferredModel,
        contents: prompt
      });
      if (resp && resp.text) {
        return resp.text.trim();
      }
    } catch (err) {
      console.warn("[NEXUS AI] Followup Gemini request failed, using deterministic answers.");
    }
  }
  const q = question.toLowerCase();
  if (q.includes("where am i spending") || q.includes("spending the most")) {
    const top = metrics.topExpenseCategories[0];
    if (top) {
      return `You are spending the most on ${top.category}, totaling ${formatINR(top.total)} (${top.percentage}% of your total recorded expenses). ${metrics.topExpenseCategories[1] ? `Your second highest area is ${metrics.topExpenseCategories[1].category} at ${formatINR(metrics.topExpenseCategories[1].total)} (${metrics.topExpenseCategories[1].percentage}%).` : ""}`;
    }
    return "You have not categorized enough expenses yet. Once you log your daily purchases, this section will pinpoint your highest cost categories.";
  }
  if (q.includes("manage my expenses") || q.includes("better")) {
    const ratio = metrics.expenseToIncomeRatio;
    return `Your recorded expenses currently absorb ${ratio}% of your income, leaving ${formatINR(metrics.netRemaining)} as cushion. To optimize spending, focus on reducing recurring non-essential charges in your top category, and allocate 10-15% of every new client payment into an emergency fund before spending.`;
  }
  if (q.includes("missing") || q.includes("financial profile")) {
    const gaps = metrics.dataSufficiency.missingAreas;
    if (gaps.length > 0) {
      return `To make your financial story fully convincing, focus on these entries: ${gaps.join("; ")}. Adding these completes your cashflow baseline.`;
    }
    return "Your profile has a solid baseline of records. You can further strengthen it by uploading utility bills or rent receipts to your document vault.";
  }
  if (q.includes("passport") || q.includes("financial trust passport")) {
    return "You can build a more complete Passport by recording at least 3 months of steady income, logging regular on-time rent or utility bills, and maintaining a positive monthly cash buffer. This proves consistent financial discipline to landlords and lenders.";
  }
  if (q.includes("score change") || q.includes("trust score")) {
    if (trustScore) {
      return `Your score is ${trustScore.score}/100. It updates deterministically whenever you add or edit records based on 4 pillars: Income Consistency (${trustScore.breakdown.incomeConsistency.score}/30), Savings Habits (${trustScore.breakdown.savingsHabits.score}/25), Repayment History (${trustScore.breakdown.repaymentHistory.score}/25), and Expense Management (${trustScore.breakdown.expenseManagement.score}/20). Adding on-time bill payments and maintaining positive cashflow will increase it.`;
    }
    return "Your score updates automatically whenever you add new income, expense, or bill repayment records into your ledger.";
  }
  return `Based on your records, you have tracked ${formatINR(metrics.totalIncome)} in income and ${formatINR(metrics.totalExpenses)} in expenses across ${metrics.monthsTracked} month(s). Keeping records updated every week ensures your analysis and Passport remain accurate.`;
}

// server/services/gemmaService.ts
import { GoogleGenAI as GoogleGenAI2 } from "@google/genai";
function getGemmaConfig() {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || "";
  const configuredModel = process.env.GEMMA_MODEL?.trim() || "gemma-4-26b-a4b-it";
  const provider = process.env.AI_PROVIDER?.trim() || "gemma";
  const timeoutMs = parseInt(process.env.AI_REQUEST_TIMEOUT_MS || "30000", 10);
  const isConfigured = apiKey.length > 10 && !apiKey.startsWith("your_") && !apiKey.includes("placeholder");
  return {
    apiKey,
    configuredModel,
    provider,
    timeoutMs: isNaN(timeoutMs) || timeoutMs <= 0 ? 3e4 : timeoutMs,
    isConfigured
  };
}
function getModelInfo(modelName) {
  const config = getGemmaConfig();
  const name = modelName || config.configuredModel;
  return {
    model_name: name,
    model_version: "Gemma 4 Open-Weight",
    provider: "Google Gemini API (Gemma Host)",
    is_open_weight: true,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function sanitizeUserPrompt(text, maxLength = 500) {
  if (typeof text !== "string") return "";
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").replace(/(system prompt|ignore previous instructions|disregard all prior|ignore all instructions|forget previous instructions)/gi, "[FILTERED]").replace(/(<\|im_start\|>|<\|im_end\|>|<start_of_turn>|<end_of_turn>|\[INST\]|\[\/INST\]|### Instruction:|### System:|### Response:)/gi, "[FILTERED]").replace(/^(system:|assistant:|human:|user:)\s*/gim, "[FILTERED] ").trim().slice(0, maxLength);
}
function calculateDti(metrics) {
  if (metrics.repaymentsTotal > 0 && metrics.totalIncome > 0) {
    return Math.round(metrics.repaymentsTotal / metrics.totalIncome * 100);
  }
  return null;
}
async function explainFinancialProfileWithGemma(request) {
  const config = getGemmaConfig();
  const { metrics, trustScore, profile, periodComparison, period, correlationId } = request;
  const dti = calculateDti(metrics);
  if (config.isConfigured) {
    try {
      const ai = new GoogleGenAI2({ apiKey: config.apiKey });
      const prompt = `You are the NEXUS AI Financial Health Copilot powered by Google Gemma 4.
Your role is to explain the user's financial profile based STRICTLY on their verified, deterministic indicators.
DO NOT invent financial transactions, fake credit scores, or promise guaranteed loan approvals.
Use clear, encouraging, accessible English.

ANONYMIZED CONTEXT:
- Occupation: ${profile.occupation}
- Monthly Income Range: ${profile.monthlyIncomeRange || "Unspecified"}
- Analysis Period: ${periodComparison?.periodLabel || period || "Current records"}

DETERMINISTIC FINANCIAL INDICATORS (CALCULATED BY NEXUS ENGINE):
- Total Recorded Income: ${formatINR(metrics.totalIncome)}
- Total Recorded Expenses: ${formatINR(metrics.totalExpenses)}
- Net Remaining Buffer: ${formatINR(metrics.netRemaining)}
- Savings Rate: ${metrics.savingsRate}%
- Income Consistency Score: ${metrics.incomeConsistencyScore}/100 (${metrics.incomeConsistencyRating})
- Debt-to-Income (DTI) Ratio: ${dti !== null ? `${dti}%` : "No debt/EMI records tracked"}
- Repayments Tracked: ${metrics.repaymentsCount} on-time payments totaling ${formatINR(metrics.repaymentsTotal)} (Regularity: ${metrics.repaymentRegularityScore}/100)
- Financial Trust Score: ${trustScore ? `${trustScore.score}/100 (${trustScore.label})` : "Awaiting records"}
- Key Factors Influencing Trust Score: ${trustScore?.keyFactors?.map((f) => f.text).join("; ") || "Standard indicators"}
- Top Expense Categories: ${metrics.topExpenseCategories.slice(0, 3).map((c) => `${c.category} (${c.percentage}%)`).join(", ") || "None"}

REQUIREMENT:
Return a JSON object conforming EXACTLY to the following schema with NO markdown code fences or conversational prefix:
{
  "summary": "2-3 clear sentences summarizing their overall money flow and stability.",
  "financial_strengths": ["2-3 specific verified strengths from their data"],
  "financial_risks": ["1-2 realistic risk areas or areas needing improvement"],
  "improvement_recommendations": ["2-3 practical, realistic recommendations tailored to a ${profile.occupation}"],
  "suggested_actions": ["3 concrete next steps they can take this month"],
  "confidence_limitations": ["1 statement acknowledging data limitations and that AI does not issue credit decisions"]
}`;
      const callPromise = ai.models.generateContent({
        model: config.configuredModel,
        contents: prompt
      });
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("AI_REQUEST_TIMEOUT")), config.timeoutMs)
      );
      const resp = await Promise.race([callPromise, timeoutPromise]);
      let rawText = resp?.text || "";
      rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(rawText);
      return validateAndNormalizeStructuredResponse(parsed, config.configuredModel);
    } catch (err) {
      console.warn(`[NEXUS Gemma 4][${correlationId || "SYS"}] Gemma explanation failed:`, err?.message || "Error");
      return generateDeterministicStructuredExplanation(request);
    }
  }
  return generateDeterministicStructuredExplanation(request);
}
async function chatWithFinancialCopilot(request) {
  const config = getGemmaConfig();
  const { message, history = [], metrics, trustScore, profile, preferredLanguage = "en", correlationId } = request;
  const sanitizedMsg = sanitizeUserPrompt(message);
  const dti = calculateDti(metrics);
  const modelInfo = getModelInfo(config.configuredModel);
  const isHindiOrHinglish = preferredLanguage === "hi" || preferredLanguage === "hinglish" || /[क-ह]/.test(sanitizedMsg) || /\b(kaise|kya|mera|meri|paisa|bachat|kharcha|batao|karo|hai|hoga)\b/i.test(sanitizedMsg);
  if (config.isConfigured && sanitizedMsg.length > 0) {
    try {
      const ai = new GoogleGenAI2({ apiKey: config.apiKey });
      const languageInstruction = isHindiOrHinglish ? 'User preferred language is Hindi / Hinglish. Respond in friendly, respectful, natural conversational Hinglish (Roman script Hindi mixed with English terms, e.g. "Aapka monthly savings rate...") or simple Hindi, making financial terms crystal clear.' : "Respond in simple, friendly, accessible English without complex banking jargon.";
      const recentHistory = history.slice(-4).map((h) => `${h.role === "user" ? "User" : "Copilot"}: ${sanitizeUserPrompt(h.content, 200)}`).join("\n");
      const prompt = `You are the NEXUS AI Financial Health Copilot, powered by Google Gemma 4 (an open-weight model).
You provide personalized financial guidance and educational explanations based ONLY on verified ledger indicators.
${languageInstruction}

CRITICAL RULES:
1. Ground every answer in the user's actual numbers provided below.
2. NEVER invent transactions, never fake CIBIL/bureau scores, and never promise that taking any action guarantees a loan or credit approval.
3. Keep your response concise (3 to 5 sentences maximum).
4. At the end of your answer, provide 3 suggested follow-up questions formatted as:
SUGGESTIONS:
- [Follow-up question 1]
- [Follow-up question 2]
- [Follow-up question 3]

USER PROFILE & VERIFIED FINANCIAL INDICATORS:
- Occupation: ${profile.occupation}
- Monthly Income: ${formatINR(metrics.totalIncome)}
- Monthly Expenses: ${formatINR(metrics.totalExpenses)}
- Net Monthly Remaining: ${formatINR(metrics.netRemaining)}
- Savings Rate: ${metrics.savingsRate}%
- Income Stability: ${metrics.incomeConsistencyScore}/100 (${metrics.incomeConsistencyRating})
- Debt-to-Income (DTI): ${dti !== null ? `${dti}%` : "No debt tracked"}
- Repayments Tracked: ${metrics.repaymentsCount} records (${formatINR(metrics.repaymentsTotal)})
- Calculated Financial Trust Score: ${trustScore ? `${trustScore.score}/100 (${trustScore.label})` : "Awaiting more data"}
- Top Expense Categories: ${metrics.topExpenseCategories.slice(0, 3).map((c) => `${c.category}: ${formatINR(c.total)} (${c.percentage}%)`).join(", ") || "None"}

CONVERSATION CONTEXT:
${recentHistory ? recentHistory + "\n" : ""}User: ${sanitizedMsg}
Copilot:`;
      const callPromise = ai.models.generateContent({
        model: config.configuredModel,
        contents: prompt
      });
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("AI_REQUEST_TIMEOUT")), config.timeoutMs)
      );
      const resp = await Promise.race([callPromise, timeoutPromise]);
      const fullText = (resp?.text || "").trim();
      return parseChatResponse(fullText, modelInfo, isHindiOrHinglish);
    } catch (err) {
      console.warn(`[NEXUS Gemma 4][${correlationId || "SYS"}] Chat generation failed:`, err?.message || "Error");
      return generateDeterministicChatReply(sanitizedMsg, metrics, trustScore, profile, isHindiOrHinglish);
    }
  }
  return generateDeterministicChatReply(sanitizedMsg, metrics, trustScore, profile, isHindiOrHinglish);
}
async function generate30DayPlanWithGemma(request) {
  const config = getGemmaConfig();
  const { metrics, trustScore, profile, correlationId } = request;
  const modelInfo = getModelInfo(config.configuredModel);
  const dti = calculateDti(metrics);
  if (config.isConfigured) {
    try {
      const ai = new GoogleGenAI2({ apiKey: config.apiKey });
      const prompt = `You are the NEXUS AI Financial Health Copilot powered by Google Gemma 4.
Generate a realistic, personalized 4-Week Financial Improvement Roadmap for a ${profile.occupation}.
All targets must be grounded in the user's actual income of ${formatINR(metrics.totalIncome)}, expenses of ${formatINR(metrics.totalExpenses)}, and savings rate of ${metrics.savingsRate}%.

IMPORTANT:
- Avoid unrealistic savings targets.
- Do NOT promise guaranteed credit score or loan approval outcomes.
- Emphasize building verifiable cashflow proof and sound money habits.

ROADMAP STRUCTURE:
- Week 1: Financial Awareness (Track expenses, categorize daily spends, identify unnecessary outflows)
- Week 2: Expense Management (Manageable reductions in top category, realistic savings target)
- Week 3: Financial Stability (On-time bill/rent logging, buffer planning for ${profile.occupation})
- Week 4: Financial Improvement Review (Compare indicators, evaluate progress, set next month milestones)

Output strict JSON matching this exact structure:
{
  "title": "30-Day Financial Health Roadmap for ${profile.occupation}",
  "overallGoal": "1 concise sentence stating the realistic 30-day objective",
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "Financial Awareness",
      "objective": "Clear week 1 objective",
      "tasks": [
        { "id": "w1-t1", "title": "Task title", "description": "Specific action", "completed": false, "estimatedMinutes": 15 },
        { "id": "w1-t2", "title": "Task title", "description": "Specific action", "completed": false, "estimatedMinutes": 20 }
      ],
      "recommendations": ["1-2 tips"]
    },
    {
      "weekNumber": 2,
      "theme": "Expense Management",
      "objective": "Clear week 2 objective",
      "tasks": [
        { "id": "w2-t1", "title": "Task title", "description": "Specific action", "completed": false, "estimatedMinutes": 20 },
        { "id": "w2-t2", "title": "Task title", "description": "Specific action", "completed": false, "estimatedMinutes": 15 }
      ],
      "recommendations": ["1-2 tips"]
    },
    {
      "weekNumber": 3,
      "theme": "Financial Stability",
      "objective": "Clear week 3 objective",
      "tasks": [
        { "id": "w3-t1", "title": "Task title", "description": "Specific action", "completed": false, "estimatedMinutes": 15 },
        { "id": "w3-t2", "title": "Task title", "description": "Specific action", "completed": false, "estimatedMinutes": 25 }
      ],
      "recommendations": ["1-2 tips"]
    },
    {
      "weekNumber": 4,
      "theme": "Financial Improvement Review",
      "objective": "Clear week 4 objective",
      "tasks": [
        { "id": "w4-t1", "title": "Task title", "description": "Specific action", "completed": false, "estimatedMinutes": 30 },
        { "id": "w4-t2", "title": "Task title", "description": "Specific action", "completed": false, "estimatedMinutes": 15 }
      ],
      "recommendations": ["1-2 tips"]
    }
  ]
}`;
      const callPromise = ai.models.generateContent({
        model: config.configuredModel,
        contents: prompt
      });
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("AI_REQUEST_TIMEOUT")), config.timeoutMs)
      );
      const resp = await Promise.race([callPromise, timeoutPromise]);
      let rawText = resp?.text || "";
      rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(rawText);
      return {
        id: `plan-${Date.now()}`,
        title: parsed.title || `30-Day Financial Health Roadmap for ${profile.occupation}`,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        overallGoal: parsed.overallGoal || "Build disciplined expense management and verifiable financial habits.",
        weeks: Array.isArray(parsed.weeks) && parsed.weeks.length === 4 ? parsed.weeks : getDeterministicWeeks(metrics, profile),
        modelInformation: modelInfo,
        disclaimer: "NEXUS provides educational financial improvement roadmaps. These recommendations are not statutory credit repair or loan approval guarantees."
      };
    } catch (err) {
      console.warn(`[NEXUS Gemma 4][${correlationId || "SYS"}] Plan generation failed:`, err?.message || "Error");
      return generateDeterministicImprovementPlan(request);
    }
  }
  return generateDeterministicImprovementPlan(request);
}
function validateAndNormalizeStructuredResponse(raw, modelName) {
  return {
    summary: typeof raw.summary === "string" && raw.summary.trim() ? raw.summary.trim() : "Your financial ledger indicates active earning and spending patterns.",
    financial_strengths: Array.isArray(raw.financial_strengths) && raw.financial_strengths.length > 0 ? raw.financial_strengths : ["Regular record keeping provides a baseline for alternative credit evaluation."],
    financial_risks: Array.isArray(raw.financial_risks) && raw.financial_risks.length > 0 ? raw.financial_risks : ["High concentration of expenses in primary spending categories."],
    improvement_recommendations: Array.isArray(raw.improvement_recommendations) && raw.improvement_recommendations.length > 0 ? raw.improvement_recommendations : ["Maintain records over consecutive months to prove income stability."],
    suggested_actions: Array.isArray(raw.suggested_actions) && raw.suggested_actions.length > 0 ? raw.suggested_actions : ["Log daily expenses", "Upload rent/utility proof", "Review subscriptions"],
    confidence_limitations: Array.isArray(raw.confidence_limitations) && raw.confidence_limitations.length > 0 ? raw.confidence_limitations : ["Insights are educational and derived solely from user-provided entries; does not guarantee loan approval."],
    model_information: getModelInfo(modelName)
  };
}
function parseChatResponse(text, modelInfo, isHindi) {
  let reply = text;
  const suggestedQuestions = [];
  const suggestionIdx = text.search(/SUGGESTIONS:|FOLLOW-UP QUESTIONS:/i);
  if (suggestionIdx !== -1) {
    reply = text.slice(0, suggestionIdx).trim();
    const suggestionsPart = text.slice(suggestionIdx);
    const matches = suggestionsPart.match(/[-*•\d.]\s*(.*)/g);
    if (matches) {
      matches.slice(0, 3).forEach((m) => {
        const cleaned = m.replace(/^[-*•\d.]\s*/, "").replace(/[[\]"]/g, "").trim();
        if (cleaned.length > 5 && !cleaned.toLowerCase().includes("suggestions:")) {
          suggestedQuestions.push(cleaned);
        }
      });
    }
  }
  if (suggestedQuestions.length === 0) {
    if (isHindi) {
      suggestedQuestions.push(
        "Main apna savings rate kaise badhaun?",
        "Konsa kharcha kam karna sabse aasan hai?",
        "Financial Trust Score kaise improve karein?"
      );
    } else {
      suggestedQuestions.push(
        "How can I improve my savings rate?",
        "What is affecting my financial stability?",
        "How can I prepare financially before applying for a loan?"
      );
    }
  }
  return {
    reply,
    suggestedQuestions: suggestedQuestions.slice(0, 3),
    modelInformation: modelInfo
  };
}
function generateDeterministicStructuredExplanation(request) {
  const { metrics, trustScore, profile } = request;
  const top = metrics.topExpenseCategories[0];
  const dti = calculateDti(metrics);
  const netPositive = metrics.netRemaining > 0;
  const strengths = [];
  if (netPositive) {
    strengths.push(`Retains ${metrics.savingsRate}% of recorded income (${formatINR(metrics.netRemaining)} monthly surplus).`);
  }
  if (metrics.incomeConsistencyScore >= 75) {
    strengths.push(`Consistent earnings flow as a ${profile.occupation} (${metrics.incomeConsistencyRating}).`);
  } else {
    strengths.push(`Active earning record with ${metrics.totalRecordsCount} entries across ${metrics.monthsTracked} month(s).`);
  }
  if (metrics.repaymentsCount > 0) {
    strengths.push(`${metrics.repaymentsCount} verified on-time repayments totaling ${formatINR(metrics.repaymentsTotal)}.`);
  }
  const risks = [];
  if (top && top.percentage >= 35) {
    risks.push(`Heavy expense concentration in ${top.category} (${top.percentage}% of all expenses).`);
  }
  if (metrics.expenseToIncomeRatio > 80) {
    risks.push(`Narrow emergency breathing room (spending absorbs ${metrics.expenseToIncomeRatio}% of revenue).`);
  }
  if (dti !== null && dti > 35) {
    risks.push(`Debt-to-Income ratio of ${dti}% requires careful cashflow monitoring.`);
  }
  const recommendations = [
    `Formalize an emergency reserve equivalent to 1-2 months of living expenses (${formatINR(metrics.totalExpenses * 1.5)}).`,
    `Track all freelance invoices and utility bills to prove payment regularity.`,
    `Review recurring commitments in ${top?.category || "discretionary categories"} to build monthly cushion.`
  ];
  const actions = [
    `Set aside 10% from every incoming invoice before spending.`,
    `Upload your most recent rent receipt or utility bill as verification proof.`,
    `Record all weekly expenses consistently to maintain score accuracy.`
  ];
  return {
    summary: `Your recorded income of ${formatINR(metrics.totalIncome)} balances against ${formatINR(metrics.totalExpenses)} in expenses across ${metrics.monthsTracked} month(s). ${netPositive ? `You maintain a positive cash surplus of ${formatINR(metrics.netRemaining)}.` : "Expenses are currently tight against income."}`,
    financial_strengths: strengths,
    financial_risks: risks,
    improvement_recommendations: recommendations,
    suggested_actions: actions,
    confidence_limitations: [
      "Calculations are deterministic based on user entries. NEXUS insights are educational and do not constitute an official credit bureau score or loan guarantee."
    ],
    model_information: {
      model_name: "nexus-deterministic-engine-v1",
      model_version: "Deterministic Fallback",
      provider: "NEXUS Local Calculation Engine",
      is_open_weight: false,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}
function generateDeterministicChatReply(question, metrics, trustScore, profile, isHindi = false) {
  const q = question.toLowerCase();
  const dti = calculateDti(metrics);
  const top = metrics.topExpenseCategories[0];
  const occ = profile?.occupation || "Freelancer";
  let reply = "";
  const suggestedQuestions = isHindi ? [
    "Bachat kaise improve karein?",
    "Mera sabse bada kharcha kya hai?",
    "Financial stability score kaise badhega?"
  ] : [
    "How can I improve my savings rate?",
    "What are my biggest financial risks?",
    "How can I prepare financially before applying for a loan?"
  ];
  if (q.includes("score") || q.includes("trust")) {
    reply = isHindi ? `Aapka Financial Trust Score ${trustScore ? `${trustScore.score}/100` : "awaiting records"} hai. Yeh score income consistency (${trustScore?.breakdown?.incomeConsistency?.score || 0}/30), bachat (${trustScore?.breakdown?.savingsHabits?.score || 0}/25), aur on-time repayments par depend karta hai. Regular bills add karne se yeh improve hoga.` : `Your Financial Trust Score is currently ${trustScore ? `${trustScore.score}/100 (${trustScore.label})` : "calculated from your ledger"}. It is influenced by income regularity (${trustScore?.breakdown?.incomeConsistency?.score || 0}/30), savings habits (${trustScore?.breakdown?.savingsHabits?.score || 0}/25), and on-time payments. Logging consistent bill receipts increases your score.`;
  } else if (q.includes("saving") || q.includes("bachat")) {
    reply = isHindi ? `Aapka current savings rate ${metrics.savingsRate}% hai, jisse lagbhag ${formatINR(metrics.netRemaining)} monthly surplus bachta hai. Income aate hi 10% seedhe emergency fund mein transfer karne se stability tezi se badhegi.` : `Your current savings rate is ${metrics.savingsRate}%, leaving a monthly surplus of ${formatINR(metrics.netRemaining)}. We recommend allocating 10% to 15% directly into a separate reserve as soon as client payments or earnings arrive.`;
  } else if (q.includes("risk") || q.includes("khatra")) {
    reply = isHindi ? `Aapka sabse bada risk area ${top ? `${top.category} (${top.percentage}% of expenses)` : "spending margin"} hai. Emergency fund chhota hone par achanak aane wale kharche cashflow par asar daal sakte hain.` : `Your primary risk is expense concentration: ${top ? `${top.category} accounts for ${top.percentage}% of your expenses` : "high expense-to-income ratio"}. Keeping a 30-day emergency buffer prevents cashflow strain during lean periods.`;
  } else if (q.includes("loan") || q.includes("borrow")) {
    reply = isHindi ? `Loan ya EMI lene se pehle Debt-to-Income (DTI) ratio 35% ke andar hona chahiye (current: ${dti !== null ? `${dti}%` : "0%"}). Saath hi 3 mahine ke steady income records aur on-time bill proofs upload karne se verification aasan ho jaata hai.` : `Before applying for credit, aim for a Debt-to-Income (DTI) ratio below 35% (currently ${dti !== null ? `${dti}%` : "unencumbered"}) and maintain at least 3 consecutive months of recorded income and on-time rent/bill payments to prove repayment discipline.`;
  } else {
    reply = isHindi ? `Aapke records ke mutabiq, aapne ${formatINR(metrics.totalIncome)} income aur ${formatINR(metrics.totalExpenses)} expenses track kiye hain. Aapka savings buffer ${metrics.savingsRate}% hai. Weekly records update karne se Copilot hamesha accurate insights dega.` : `According to your verified ledger as a ${occ}, you have tracked ${formatINR(metrics.totalIncome)} in earnings and ${formatINR(metrics.totalExpenses)} in expenses across ${metrics.monthsTracked} month(s), retaining ${metrics.savingsRate}% as cushion. Keep adding regular receipts to build your alternative financial passport.`;
  }
  return {
    reply,
    suggestedQuestions,
    modelInformation: {
      model_name: "nexus-deterministic-engine-v1",
      provider: "NEXUS Local Calculation Engine",
      is_open_weight: false,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}
function generateDeterministicImprovementPlan(request) {
  const { metrics, profile } = request;
  return {
    id: `plan-det-${Date.now()}`,
    title: `30-Day Financial Health Roadmap for ${profile.occupation}`,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    overallGoal: `Enhance financial breathing room and document consistent repayment discipline as a ${profile.occupation}.`,
    weeks: getDeterministicWeeks(metrics, profile),
    modelInformation: {
      model_name: "nexus-deterministic-engine-v1",
      provider: "NEXUS Local Calculation Engine",
      is_open_weight: false,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    },
    disclaimer: "NEXUS provides educational financial roadmaps. These recommendations are not statutory credit repair or loan approval guarantees."
  };
}
function getDeterministicWeeks(metrics, profile) {
  const top = metrics.topExpenseCategories[0]?.category || "Daily Purchases";
  return [
    {
      weekNumber: 1,
      theme: "Financial Awareness",
      objective: "Track all cash inflows and identify unnecessary expenses in your primary categories.",
      tasks: [
        {
          id: "w1-t1",
          title: "Daily Expense Logging",
          description: "Record every purchase for 7 days to eliminate untracked cash leakages.",
          completed: false,
          estimatedMinutes: 10
        },
        {
          id: "w1-t2",
          title: "Audit Top Category Spending",
          description: `Review spending in ${top} and identify 2 non-essential items to pause.`,
          completed: false,
          estimatedMinutes: 20
        }
      ],
      recommendations: ["Small recurring daily expenses often add up to over 15% of monthly outflow."]
    },
    {
      weekNumber: 2,
      theme: "Expense Management",
      objective: "Implement manageable reductions and establish a dedicated emergency reserve goal.",
      tasks: [
        {
          id: "w2-t1",
          title: "Set Monthly Category Cap",
          description: `Establish a 10% lower ceiling for ${top} spending for the remainder of the month.`,
          completed: false,
          estimatedMinutes: 15
        },
        {
          id: "w2-t2",
          title: "Automate First-Day Savings",
          description: "Set an automatic transfer of 10% from incoming payments into your savings reserve.",
          completed: false,
          estimatedMinutes: 25
        }
      ],
      recommendations: ["Always save immediately when revenue arrives rather than saving whatever happens to remain at month end."]
    },
    {
      weekNumber: 3,
      theme: "Financial Stability",
      objective: "Strengthen on-time bill payment habits and prepare for irregular income periods.",
      tasks: [
        {
          id: "w3-t1",
          title: "Schedule Bill Payments",
          description: "Ensure utility, mobile recharge, or rent payments are made 48 hours before due date.",
          completed: false,
          estimatedMinutes: 15
        },
        {
          id: "w3-t2",
          title: "Upload Proof Documents",
          description: "Add rent receipts or invoices to your NEXUS Document Vault for third-party verification.",
          completed: false,
          estimatedMinutes: 20
        }
      ],
      recommendations: ["Consistent utility and rent payments are key alternative trust indicators for lenders."]
    },
    {
      weekNumber: 4,
      theme: "Financial Improvement Review",
      objective: "Compare monthly metrics, assess cash cushion growth, and refresh your Financial Passport.",
      tasks: [
        {
          id: "w4-t1",
          title: "Review Cash Surplus",
          description: `Compare actual savings against your initial baseline (${metrics.savingsRate}%).`,
          completed: false,
          estimatedMinutes: 20
        },
        {
          id: "w4-t2",
          title: "Regenerate Financial Trust Passport",
          description: "Update your Financial Passport with newly validated metrics to share with partners.",
          completed: false,
          estimatedMinutes: 15
        }
      ],
      recommendations: ["A 3-month sustained improvement trend is the most powerful signal of financial reliability."]
    }
  ];
}

// server/index.ts
dotenv.config();
function validateEnvironment() {
  const isProd = process.env.NODE_ENV === "production";
  const missingCritical = [];
  if (isProd) {
    if (!process.env.GEMINI_API_KEY && !process.env.DATABASE_URL && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("[NEXUS Security Notice] No production cloud backend or Gemini key specified; operating in hardened local/deterministic mode.");
    }
  }
  if (missingCritical.length > 0) {
    console.error(`[CRITICAL] Server startup refused. Missing required environment variables: ${missingCritical.join(", ")}`);
    process.exit(1);
  }
}
validateEnvironment();
var app = express();
var PORT = process.env.PORT || 3001;
app.use((req, res, next) => {
  const correlationId = req.headers["x-correlation-id"] || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader("X-Correlation-ID", correlationId);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  next();
});
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "http://localhost:*", "https://*.supabase.co", "https://generativelanguage.googleapis.com"]
      }
    },
    hsts: {
      maxAge: 31536e3,
      includeSubDomains: true,
      preload: true
    },
    frameguard: {
      action: "deny"
    },
    noSniff: true
  })
);
var generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 150,
  // max 150 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests. Please try again after 15 minutes."
  }
});
var authLimiter = rateLimit({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 5,
  // 5 attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "RATE_LIMIT_EXCEEDED",
    message: "Too many security-sensitive attempts. Please wait 1 minute before trying again."
  }
});
var analysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "RATE_LIMIT_EXCEEDED",
    message: "Analysis limit reached. Please wait a few minutes before submitting new records."
  }
});
var copilotLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "RATE_LIMIT_EXCEEDED",
    message: "Copilot question limit reached. Please wait a few minutes before asking more questions."
  }
});
var shareLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "RATE_LIMIT_EXCEEDED",
    message: "Share link creation quota exceeded. Please wait a few minutes."
  }
});
app.use(generalLimiter);
var isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  if (/^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/.test(origin)) return true;
  if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return true;
  return false;
};
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS access blocked by NEXUS security policy."));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Correlation-ID"]
  })
);
app.use(express.json({ limit: "1mb" }));
var shareStore = /* @__PURE__ */ new Map();
var MAX_SHARE_STORE_ENTRIES = 2e3;
function cleanupShareStore() {
  const now = /* @__PURE__ */ new Date();
  for (const [key, link] of shareStore.entries()) {
    if (link.isRevoked || new Date(link.expiresAt) < now) {
      shareStore.delete(key);
    }
  }
}
var cleanupTimer = setInterval(cleanupShareStore, 10 * 60 * 1e3);
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
function sanitizeInput(input, maxLength = 80) {
  if (typeof input !== "string") return "";
  return input.replace(/[<>'"]/g, "").trim().slice(0, maxLength);
}
function validateIncomingRecords(records) {
  if (!Array.isArray(records)) {
    return { valid: false, error: "Financial records array is required." };
  }
  if (records.length > 500) {
    return { valid: false, error: "Records batch exceeds maximum limit of 500 entries per request." };
  }
  const validTypes = /* @__PURE__ */ new Set(["income", "expense", "savings", "repayment"]);
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (!r || typeof r !== "object") {
      return { valid: false, error: `Record at index ${i} is not a valid object.` };
    }
    const amt = Number(r.amount);
    if (!Number.isFinite(amt) || amt < 0 || amt > 1e9) {
      return { valid: false, error: `Record at index ${i} contains an invalid amount.` };
    }
    const typeStr = typeof r.recordType === "string" ? r.recordType.trim().toLowerCase() : "";
    if (typeStr && !validTypes.has(typeStr)) {
      return { valid: false, error: `Record at index ${i} has invalid recordType "${r.recordType}". Must be Income, Expense, Savings, or Repayment.` };
    }
  }
  return { valid: true };
}
var api = express.Router();
api.get("/health", (_req, res) => {
  const gemmaConfig = getGemmaConfig();
  res.json({
    status: "healthy",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    aiEngine: gemmaConfig.isConfigured ? "Google Gemma 4 (Gemini API Host)" : "Deterministic Financial Engine (Default)",
    geminiConfigured: gemmaConfig.isConfigured,
    model: gemmaConfig.configuredModel,
    provider: gemmaConfig.provider,
    isOpenWeight: true,
    environment: process.env.NODE_ENV || "development"
  });
});
api.post("/analyze-finances", analysisLimiter, async (req, res) => {
  const correlationId = req.correlationId;
  try {
    const { records, profile, consents, period = "all_time" } = req.body;
    if (!consents || !consents.financialAnalysis) {
      res.status(400).json({
        error: "CONSENT_REQUIRED",
        message: "Explicit user consent is required before performing financial analysis.",
        correlationId
      });
      return;
    }
    if (!records || !Array.isArray(records)) {
      res.status(400).json({
        error: "INVALID_RECORDS",
        message: "Financial records array is required.",
        correlationId
      });
      return;
    }
    if (records.length > 0) {
      const recordValidation = validateIncomingRecords(records);
      if (!recordValidation.valid) {
        res.status(400).json({
          error: "INVALID_RECORDS",
          message: recordValidation.error,
          correlationId
        });
        return;
      }
    }
    const validPeriod = ["this_month", "last_month", "last_3_months", "all_time"].includes(period) ? period : "all_time";
    const activeRecords = filterRecordsByPeriod(records, validPeriod);
    const metrics = calculateFinancialMetrics(activeRecords);
    const trustScore = calculateFinancialTrustScore(records);
    const periodComparison = calculatePeriodComparison(records, validPeriod);
    const sanitizedOccupation = sanitizeInput(profile?.occupation || "Freelancer", 40);
    const sanitizedRange = profile?.monthlyIncomeRange ? sanitizeInput(profile.monthlyIncomeRange, 40) : void 0;
    const analysis = await generateFinancialAnalysis({
      records: activeRecords,
      metrics,
      trustScore,
      period: validPeriod,
      periodComparison,
      profile: {
        occupation: sanitizedOccupation,
        monthlyIncomeRange: sanitizedRange
      }
    });
    res.json({
      success: true,
      analysis,
      trustScore,
      periodComparison,
      correlationId
    });
  } catch (error) {
    console.error(`[NEXUS Server Error][${correlationId}]: Analysis calculation failed`);
    res.status(500).json({
      error: "ANALYSIS_FAILED",
      message: "An unexpected error occurred while analyzing financial records. Please try again.",
      correlationId
    });
  }
});
api.post("/ask-followup", analysisLimiter, async (req, res) => {
  const correlationId = req.correlationId;
  try {
    const { question, records, profile, period = "all_time" } = req.body;
    if (!question || typeof question !== "string") {
      res.status(400).json({
        error: "INVALID_QUESTION",
        message: "A valid question is required.",
        correlationId
      });
      return;
    }
    if (!records || !Array.isArray(records)) {
      res.status(400).json({
        error: "INVALID_RECORDS",
        message: "Financial records array is required.",
        correlationId
      });
      return;
    }
    if (records.length > 0) {
      const recordValidation = validateIncomingRecords(records);
      if (!recordValidation.valid) {
        res.status(400).json({
          error: "INVALID_RECORDS",
          message: recordValidation.error,
          correlationId
        });
        return;
      }
    }
    const sanitizedQuestion = sanitizeInput(question, 200);
    const validPeriod = ["this_month", "last_month", "last_3_months", "all_time"].includes(period) ? period : "all_time";
    const activeRecords = filterRecordsByPeriod(records, validPeriod);
    const metrics = calculateFinancialMetrics(activeRecords);
    const trustScore = calculateFinancialTrustScore(records);
    const periodComparison = calculatePeriodComparison(records, validPeriod);
    const sanitizedOccupation = sanitizeInput(profile?.occupation || "Freelancer", 40);
    const sanitizedRange = profile?.monthlyIncomeRange ? sanitizeInput(profile.monthlyIncomeRange, 40) : void 0;
    const answer = await answerFollowUpQuestion({
      question: sanitizedQuestion,
      metrics,
      trustScore,
      profile: {
        occupation: sanitizedOccupation,
        monthlyIncomeRange: sanitizedRange
      },
      periodComparison
    });
    res.json({
      success: true,
      answer,
      correlationId
    });
  } catch (error) {
    console.error(`[NEXUS Server Error][${correlationId}]: Follow-up answering failed`);
    res.status(500).json({
      error: "FOLLOWUP_FAILED",
      message: "Unable to process follow-up question right now.",
      correlationId
    });
  }
});
api.post("/copilot/chat", copilotLimiter, async (req, res) => {
  const correlationId = req.correlationId;
  try {
    const { message, history, records = [], profile, preferredLanguage, period = "all_time" } = req.body;
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      res.status(400).json({
        error: "INVALID_MESSAGE",
        message: "A valid text message is required.",
        correlationId
      });
      return;
    }
    if (message.length > 1e3) {
      res.status(400).json({
        error: "MESSAGE_TOO_LONG",
        message: "Message exceeds maximum length of 1,000 characters.",
        correlationId
      });
      return;
    }
    if (history && (!Array.isArray(history) || history.length > 20)) {
      res.status(400).json({
        error: "INVALID_HISTORY",
        message: "Chat history must be an array of at most 20 messages.",
        correlationId
      });
      return;
    }
    if (records && Array.isArray(records) && records.length > 0) {
      const recordValidation = validateIncomingRecords(records);
      if (!recordValidation.valid) {
        res.status(400).json({
          error: "INVALID_RECORDS",
          message: recordValidation.error,
          correlationId
        });
        return;
      }
    }
    const validPeriod = ["this_month", "last_month", "last_3_months", "all_time"].includes(period) ? period : "all_time";
    const activeRecords = Array.isArray(records) ? filterRecordsByPeriod(records, validPeriod) : [];
    const metrics = calculateFinancialMetrics(activeRecords);
    const trustScore = calculateFinancialTrustScore(records);
    const sanitizedOccupation = sanitizeInput(profile?.occupation || "Freelancer", 40);
    const sanitizedRange = profile?.monthlyIncomeRange ? sanitizeInput(profile.monthlyIncomeRange, 40) : void 0;
    const result = await chatWithFinancialCopilot({
      message,
      history,
      metrics,
      trustScore,
      profile: {
        occupation: sanitizedOccupation,
        monthlyIncomeRange: sanitizedRange
      },
      preferredLanguage,
      correlationId
    });
    res.json({
      success: true,
      ...result,
      correlationId
    });
  } catch (error) {
    console.error(`[NEXUS Server Error][${correlationId}]: Copilot chat failed`);
    res.status(500).json({
      error: "COPILOT_CHAT_FAILED",
      message: "Unable to communicate with the Financial Health Copilot at this moment.",
      correlationId
    });
  }
});
api.post("/copilot/explain-profile", analysisLimiter, async (req, res) => {
  const correlationId = req.correlationId;
  try {
    const { records, profile, consents, period = "all_time" } = req.body;
    if (!consents || !consents.financialAnalysis) {
      res.status(400).json({
        error: "CONSENT_REQUIRED",
        message: "Explicit user consent is required before analyzing your financial profile.",
        correlationId
      });
      return;
    }
    if (!records || !Array.isArray(records)) {
      res.status(400).json({
        error: "INVALID_RECORDS",
        message: "Financial records array is required.",
        correlationId
      });
      return;
    }
    if (records.length > 0) {
      const recordValidation = validateIncomingRecords(records);
      if (!recordValidation.valid) {
        res.status(400).json({
          error: "INVALID_RECORDS",
          message: recordValidation.error,
          correlationId
        });
        return;
      }
    }
    const validPeriod = ["this_month", "last_month", "last_3_months", "all_time"].includes(period) ? period : "all_time";
    const activeRecords = filterRecordsByPeriod(records, validPeriod);
    const metrics = calculateFinancialMetrics(activeRecords);
    const trustScore = calculateFinancialTrustScore(records);
    const periodComparison = calculatePeriodComparison(records, validPeriod);
    const sanitizedOccupation = sanitizeInput(profile?.occupation || "Freelancer", 40);
    const sanitizedRange = profile?.monthlyIncomeRange ? sanitizeInput(profile.monthlyIncomeRange, 40) : void 0;
    const explanation = await explainFinancialProfileWithGemma({
      records: activeRecords,
      metrics,
      trustScore,
      period: validPeriod,
      periodComparison,
      profile: {
        occupation: sanitizedOccupation,
        monthlyIncomeRange: sanitizedRange
      },
      correlationId
    });
    res.json({
      success: true,
      explanation,
      metrics,
      trustScore,
      correlationId
    });
  } catch (error) {
    console.error(`[NEXUS Server Error][${correlationId}]: Profile explanation failed`);
    res.status(500).json({
      error: "EXPLANATION_FAILED",
      message: "Failed to generate financial profile explanation.",
      correlationId
    });
  }
});
api.post("/copilot/improvement-plan", analysisLimiter, async (req, res) => {
  const correlationId = req.correlationId;
  try {
    const { records = [], profile, consents } = req.body;
    if (!consents || !consents.financialAnalysis) {
      res.status(400).json({
        error: "CONSENT_REQUIRED",
        message: "User consent is required to generate a personalized improvement plan.",
        correlationId
      });
      return;
    }
    if (records && Array.isArray(records) && records.length > 0) {
      const recordValidation = validateIncomingRecords(records);
      if (!recordValidation.valid) {
        res.status(400).json({
          error: "INVALID_RECORDS",
          message: recordValidation.error,
          correlationId
        });
        return;
      }
    }
    const metrics = calculateFinancialMetrics(Array.isArray(records) ? records : []);
    const trustScore = calculateFinancialTrustScore(Array.isArray(records) ? records : []);
    const sanitizedOccupation = sanitizeInput(profile?.occupation || "Freelancer", 40);
    const sanitizedRange = profile?.monthlyIncomeRange ? sanitizeInput(profile.monthlyIncomeRange, 40) : void 0;
    const plan = await generate30DayPlanWithGemma({
      metrics,
      trustScore,
      profile: {
        occupation: sanitizedOccupation,
        monthlyIncomeRange: sanitizedRange
      },
      correlationId
    });
    res.json({
      success: true,
      plan,
      correlationId
    });
  } catch (error) {
    console.error(`[NEXUS Server Error][${correlationId}]: Improvement plan generation failed`);
    res.status(500).json({
      error: "PLAN_GENERATION_FAILED",
      message: "Unable to generate 30-day improvement plan.",
      correlationId
    });
  }
});
api.post("/passport/share", shareLimiter, (req, res) => {
  const correlationId = req.correlationId;
  try {
    const { passport, recipientLabel, includedFields, expiresInHours = 72, userId } = req.body;
    if (!passport || !passport.id) {
      res.status(400).json({
        error: "INVALID_PASSPORT",
        message: "A valid Financial Trust Passport is required to generate a share link.",
        correlationId
      });
      return;
    }
    if (shareStore.size >= MAX_SHARE_STORE_ENTRIES) {
      cleanupShareStore();
      if (shareStore.size >= MAX_SHARE_STORE_ENTRIES) {
        const oldestKey = shareStore.keys().next().value;
        if (oldestKey) shareStore.delete(oldestKey);
      }
    }
    const rawToken = crypto.randomBytes(24).toString("hex");
    const tokenHash = hashToken(rawToken);
    const safeHours = Math.max(1, Math.min(Number(expiresInHours) || 72, 720));
    const now = /* @__PURE__ */ new Date();
    const expiresAt = new Date(now.getTime() + safeHours * 60 * 60 * 1e3).toISOString();
    const shareId = crypto.randomUUID();
    const sanitizedRecipient = sanitizeInput(recipientLabel || "Public Verification", 80);
    const safeIncludedFields = Array.isArray(includedFields) ? includedFields.filter((f) => ["summary", "income_consistency", "expense_breakdown", "repayments", "actionable_suggestions", "trust_score"].includes(f)) : ["summary", "income_consistency", "repayments", "actionable_suggestions", "trust_score"];
    const storedRecord = {
      id: shareId,
      shareTokenHash: tokenHash,
      passportId: String(passport.id).slice(0, 80),
      userId: sanitizeInput(userId || passport.userId || "anonymous-owner", 60),
      recipientLabel: sanitizedRecipient,
      includedFields: safeIncludedFields,
      expiresAt,
      isRevoked: false,
      accessCount: 0,
      createdAt: now.toISOString(),
      passportData: passport
    };
    shareStore.set(tokenHash, storedRecord);
    const shareUrl = `/passport/shared/${rawToken}`;
    res.json({
      success: true,
      shareId,
      shareToken: rawToken,
      shareUrl,
      expiresAt,
      recipientLabel: storedRecord.recipientLabel,
      includedFields: storedRecord.includedFields,
      correlationId
    });
  } catch (error) {
    console.error(`[NEXUS Server Error][${correlationId}]: Share link generation failed`);
    res.status(500).json({
      error: "SHARE_FAILED",
      message: "Failed to generate secure share link.",
      correlationId
    });
  }
});
api.get("/passport/shared/:token", (req, res) => {
  const correlationId = req.correlationId;
  try {
    const { token } = req.params;
    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "MISSING_TOKEN", message: "Share token is required.", correlationId });
      return;
    }
    const tokenHash = hashToken(token);
    const link = shareStore.get(tokenHash);
    if (!link) {
      res.status(404).json({
        error: "NOT_FOUND",
        message: "This Financial Trust Passport link was not found or has expired.",
        correlationId
      });
      return;
    }
    if (link.isRevoked) {
      res.status(410).json({
        error: "REVOKED",
        message: "Access to this Financial Trust Passport has been revoked by the owner.",
        correlationId
      });
      return;
    }
    if (new Date(link.expiresAt) < /* @__PURE__ */ new Date()) {
      res.status(410).json({
        error: "EXPIRED",
        message: "This share link has expired. Please ask the passport owner for a new link.",
        correlationId
      });
      return;
    }
    link.accessCount += 1;
    link.lastAccessedAt = (/* @__PURE__ */ new Date()).toISOString();
    const passport = link.passportData;
    const included = link.includedFields;
    const view = {
      shareId: crypto.createHash("sha256").update(link.id).digest("hex").slice(0, 16),
      recipientLabel: link.recipientLabel,
      expiresAt: link.expiresAt,
      ownerName: passport.userName,
      ownerOccupation: passport.occupation,
      passportHeadline: passport.passportHeadline,
      incomeStabilityLabel: passport.incomeStabilityLabel,
      repaymentDisciplineLabel: passport.repaymentDisciplineLabel,
      savingsHabitLabel: passport.savingsHabitLabel,
      createdAt: passport.createdAt,
      includedFields: link.includedFields,
      trustScore: included.includes("trust_score") ? passport.trustScore : void 0,
      passportData: {
        metrics: {
          totalIncome: included.includes("summary") ? passport.metrics?.totalIncome : void 0,
          totalExpenses: included.includes("summary") ? passport.metrics?.totalExpenses : void 0,
          netRemaining: included.includes("summary") ? passport.metrics?.netRemaining : void 0,
          savingsRate: included.includes("summary") ? passport.metrics?.savingsRate : void 0,
          incomeConsistencyScore: included.includes("income_consistency") ? passport.metrics?.incomeConsistencyScore : void 0,
          incomeConsistencyRating: included.includes("income_consistency") ? passport.metrics?.incomeConsistencyRating : void 0,
          monthlyBreakdown: included.includes("income_consistency") ? passport.metrics?.monthlyBreakdown : [],
          topExpenseCategories: included.includes("expense_breakdown") ? passport.metrics?.topExpenseCategories : [],
          repaymentsCount: included.includes("repayments") ? passport.metrics?.repaymentsCount : void 0,
          repaymentsTotal: included.includes("repayments") ? passport.metrics?.repaymentsTotal : void 0,
          repaymentRegularityScore: included.includes("repayments") ? passport.metrics?.repaymentRegularityScore : void 0
        },
        trustScore: included.includes("trust_score") ? passport.trustScore : void 0,
        insights: {
          summary: passport.aiInsights?.summary,
          positiveIndicators: passport.aiInsights?.positiveIndicators,
          areasForAttention: passport.aiInsights?.areasForAttention,
          actionableSuggestions: included.includes("actionable_suggestions") ? passport.aiInsights?.actionableSuggestions : void 0,
          trustScoreExplanation: passport.aiInsights?.trustScoreExplanation
        }
      },
      disclaimer: "This Financial Trust Passport is generated from user-provided records for demonstration and assessment purposes. It does not constitute a statutory credit report or loan guarantee."
    };
    res.json({
      success: true,
      passport: view,
      correlationId
    });
  } catch (error) {
    console.error(`[NEXUS Server Error][${correlationId}]: Shared passport fetch failed`);
    res.status(500).json({
      error: "SERVER_ERROR",
      message: "Failed to retrieve shared passport.",
      correlationId
    });
  }
});
api.post("/passport/revoke", authLimiter, (req, res) => {
  const correlationId = req.correlationId;
  try {
    const { shareToken, shareId, userId } = req.body;
    let targetLink;
    if (shareToken && typeof shareToken === "string") {
      const tokenHash = hashToken(shareToken);
      targetLink = shareStore.get(tokenHash);
    } else if (shareId && userId && typeof shareId === "string" && typeof userId === "string") {
      const sanitizedUid = sanitizeInput(userId, 80);
      for (const link of shareStore.values()) {
        if (link.id === shareId && (link.userId === sanitizedUid || link.passportData?.userId === sanitizedUid)) {
          targetLink = link;
          break;
        }
      }
    } else {
      res.status(400).json({
        error: "REVOCATION_UNAUTHORIZED",
        message: "Valid private shareToken or verified user ownership is required to revoke a share link.",
        correlationId
      });
      return;
    }
    if (!targetLink) {
      res.status(404).json({ error: "NOT_FOUND", message: "Share link not found or access denied.", correlationId });
      return;
    }
    targetLink.isRevoked = true;
    targetLink.revokedAt = (/* @__PURE__ */ new Date()).toISOString();
    res.json({
      success: true,
      message: "Share link has been revoked successfully. Any public viewers will no longer be able to view this passport.",
      revokedAt: targetLink.revokedAt,
      correlationId
    });
  } catch (error) {
    console.error(`[NEXUS Server Error][${correlationId}]: Revoke error`);
    res.status(500).json({ error: "REVOKE_FAILED", message: "Failed to revoke link.", correlationId });
  }
});
api.post("/user/delete-account", authLimiter, (req, res) => {
  const correlationId = req.correlationId;
  try {
    const { userId } = req.body;
    const authHeader = req.headers.authorization;
    if (!userId || typeof userId !== "string") {
      res.status(400).json({ error: "USER_ID_REQUIRED", message: "User ID is required for deletion.", correlationId });
      return;
    }
    if (process.env.NODE_ENV === "production" && !authHeader) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Authentication token is required to delete account data.",
        correlationId
      });
      return;
    }
    const sanitizedUserId = sanitizeInput(userId, 80);
    let purgedCount = 0;
    for (const [key, link] of shareStore.entries()) {
      if (link.userId === sanitizedUserId || link.passportData?.userId === sanitizedUserId) {
        shareStore.delete(key);
        purgedCount++;
      }
    }
    res.json({
      success: true,
      purgedLinks: purgedCount,
      message: "All associated server sessions and active share links have been purged.",
      correlationId
    });
  } catch (error) {
    console.error(`[NEXUS Server Error][${correlationId}]: Account deletion purge error`);
    res.status(500).json({ error: "PURGE_FAILED", message: "Failed to purge account data.", correlationId });
  }
});
app.use("/api", api);
app.use("/", api);
app.use((err, req, res, _next) => {
  const correlationId = req.correlationId || crypto.randomUUID();
  console.error(`[NEXUS Server Error][${correlationId}]:`, err?.name || "Exception");
  res.status(err?.status || 500).json({
    error: err?.code || "INTERNAL_SERVER_ERROR",
    message: "An unexpected internal error occurred. Please try again.",
    correlationId
  });
});
if (!process.env.VERCEL) {
  const gemmaConfig = getGemmaConfig();
  app.listen(PORT, () => {
    console.log(`[NEXUS Server] Secure API running on port ${PORT}`);
    console.log(`[NEXUS Server] AI Model: ${gemmaConfig.configuredModel} (${gemmaConfig.isConfigured ? "Active via Gemini API" : "Deterministic Mode"})`);
    console.log(`[NEXUS Server] Provider: ${gemmaConfig.provider} | Open-Weight: true`);
  });
}
var index_default = app;
export {
  index_default as default
};
