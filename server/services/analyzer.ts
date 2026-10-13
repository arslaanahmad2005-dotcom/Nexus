import { GoogleGenAI } from '@google/genai';
import {
  FinancialMetrics,
  FinancialRecord,
  AIAnalysisResult,
  OccupationType,
  FinancialTrustScore,
  AnalysisPeriod,
  PeriodComparison
} from '../../src/types';
import { formatINR } from '../../src/lib/calculations';

interface AnonymousFinancialProfile {
  occupation: OccupationType;
  monthlyIncomeRange?: string;
}

interface AnalyzeOptions {
  records: FinancialRecord[];
  metrics: FinancialMetrics;
  trustScore?: FinancialTrustScore;
  period?: AnalysisPeriod;
  periodComparison?: PeriodComparison;
  profile: AnonymousFinancialProfile;
}

function isValidApiKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.length > 10 && !trimmed.startsWith('your_') && !trimmed.includes('placeholder');
}

export async function generateFinancialAnalysis(options: AnalyzeOptions): Promise<AIAnalysisResult> {
  const { metrics, profile, trustScore, period, periodComparison } = options;
  const apiKey = process.env.GEMINI_API_KEY;

  // Strict Privacy: Only aggregated metrics and occupation are sent to Gemini.
  // User name, email, phone, individual transaction notes, and account IDs are NEVER included.
  if (isValidApiKey(apiKey)) {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey! });

      const scoreValue = trustScore ? `${trustScore.score}/100 (${trustScore.label})` : 'Awaiting data';
      const scoreFactors = trustScore?.keyFactors?.map((k) => k.text).join('; ') || 'Standard metrics';

      const prompt = `You are the AI Financial Clarity Advisor for NEXUS — a Financial Identity & Trust Network.
Your task is to analyze the user's financial records and explain their money habits in simple, short, encouraging English that anyone without financial knowledge can understand.

USER PROFILE (ANONYMIZED):
- Occupation: ${profile.occupation}
- Monthly Income Range: ${profile.monthlyIncomeRange || 'Not specified'}

FINANCIAL SUMMARY (Aggregated from verified user records):
- Analysis Period: ${periodComparison?.periodLabel || period || 'Current Period'}
- Total Recorded Income: ${formatINR(metrics.totalIncome)}
- Total Recorded Expenses: ${formatINR(metrics.totalExpenses)}
- Net Remaining Money: ${formatINR(metrics.netRemaining)}
- Months of Records: ${metrics.monthsTracked} months (${metrics.totalRecordsCount} records)
- Income Consistency Score: ${metrics.incomeConsistencyScore}/100 (${metrics.incomeConsistencyRating})
- Savings Rate: ${metrics.savingsRate}%
- Top Expense Categories: ${metrics.topExpenseCategories.slice(0, 3).map((c) => `${c.category} (${formatINR(c.total)}, ${c.percentage}%)`).join(', ') || 'None recorded'}
- On-time Repayments Tracked: ${metrics.repaymentsCount} records (${formatINR(metrics.repaymentsTotal)})
- Financial Trust Score: ${scoreValue}
- Score Calculation Factors: ${scoreFactors}
- Month-over-Month Notes: ${periodComparison?.notes || 'Direct period summary'}
${periodComparison?.hasPreviousPeriodData ? `- Income Change: ${periodComparison.incomeChangePercentage ?? 0}% vs previous month; Expense Change: ${periodComparison.expenseChangePercentage ?? 0}% vs previous month` : ''}

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

      let responseText = '';
      let usedModel = 'gemini-2.5-flash';
      const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      let lastErr: any = null;

      for (const m of candidateModels) {
        try {
          const resp = await ai.models.generateContent({
            model: m,
            contents: prompt,
          });
          if (resp && resp.text) {
            responseText = resp.text;
            usedModel = m;
            break;
          }
        } catch (err: any) {
          lastErr = err;
        }
      }

      if (!responseText) {
        throw lastErr || new Error('No content returned from Gemini models');
      }

      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(responseText);

      return {
        summary: parsed.summary,
        positiveIndicators: Array.isArray(parsed.positiveIndicators) ? parsed.positiveIndicators : [],
        expenseBreakdownInsight: parsed.expenseBreakdownInsight || '',
        areasForAttention: Array.isArray(parsed.areasForAttention) ? parsed.areasForAttention : [],
        actionableSuggestions: Array.isArray(parsed.actionableSuggestions) ? parsed.actionableSuggestions : [],
        trustScoreExplanation: parsed.trustScoreExplanation || '',
        missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : metrics.dataSufficiency.missingAreas,
        period,
        periodComparison,
        metrics,
        trustScore,
        modelUsed: usedModel,
        generatedAt: new Date().toISOString(),
        source: 'gemini_api'
      };
    } catch (err: any) {
      const sanitizedMsg = (err?.message || 'AI request error').replace(/key=[^&\s]+/gi, 'key=[REDACTED]');
      console.warn('[NEXUS AI] Gemini API issue, falling back to deterministic engine:', sanitizedMsg);
      return generateDeterministicAnalysis(options);
    }
  }

  // Deterministic engine when API key is not configured or in local demo mode
  return generateDeterministicAnalysis(options);
}

/**
 * Deterministic Financial Clarity Engine
 * Generates human-written, mathematically accurate explanations based on exact user data.
 */
export function generateDeterministicAnalysis(options: AnalyzeOptions): AIAnalysisResult {
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
    modelUsed: 'nexus-financial-engine-v1 (Deterministic)',
    generatedAt: new Date().toISOString(),
    source: 'deterministic_engine'
  };
}

/**
 * Answers contextual follow-up questions using authorized records & scoring methodology
 */
export async function answerFollowUpQuestion(options: {
  question: string;
  metrics: FinancialMetrics;
  trustScore?: FinancialTrustScore;
  profile: AnonymousFinancialProfile;
  periodComparison?: PeriodComparison;
}): Promise<string> {
  const { question, metrics, trustScore, profile, periodComparison } = options;
  const apiKey = process.env.GEMINI_API_KEY;

  if (isValidApiKey(apiKey)) {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey! });
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
- Top Expense Categories: ${metrics.topExpenseCategories.map((c) => `${c.category}: ${formatINR(c.total)} (${c.percentage}%)`).join(', ') || 'None'}
- Repayments Count: ${metrics.repaymentsCount} records (${formatINR(metrics.repaymentsTotal)})
- Calculated Trust Score: ${trustScore ? `${trustScore.score}/100` : 'Awaiting data'}
- Score Breakdown: Income: ${trustScore?.breakdown.incomeConsistency.score}/30, Savings: ${trustScore?.breakdown.savingsHabits.score}/25, Repayments: ${trustScore?.breakdown.repaymentHistory.score}/25, Expenses: ${trustScore?.breakdown.expenseManagement.score}/20.`;

      const resp = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      if (resp && resp.text) {
        return resp.text.trim();
      }
    } catch (err) {
      console.warn('[NEXUS AI] Followup Gemini request failed, using deterministic answers.');
    }
  }

  // Deterministic grounded response generator
  const q = question.toLowerCase();
  if (q.includes('where am i spending') || q.includes('spending the most')) {
    const top = metrics.topExpenseCategories[0];
    if (top) {
      return `You are spending the most on ${top.category}, totaling ${formatINR(top.total)} (${top.percentage}% of your total recorded expenses). ${metrics.topExpenseCategories[1] ? `Your second highest area is ${metrics.topExpenseCategories[1].category} at ${formatINR(metrics.topExpenseCategories[1].total)} (${metrics.topExpenseCategories[1].percentage}%).` : ''}`;
    }
    return 'You have not categorized enough expenses yet. Once you log your daily purchases, this section will pinpoint your highest cost categories.';
  }

  if (q.includes('manage my expenses') || q.includes('better')) {
    const ratio = metrics.expenseToIncomeRatio;
    return `Your recorded expenses currently absorb ${ratio}% of your income, leaving ${formatINR(metrics.netRemaining)} as cushion. To optimize spending, focus on reducing recurring non-essential charges in your top category, and allocate 10-15% of every new client payment into an emergency fund before spending.`;
  }

  if (q.includes('missing') || q.includes('financial profile')) {
    const gaps = metrics.dataSufficiency.missingAreas;
    if (gaps.length > 0) {
      return `To make your financial story fully convincing, focus on these entries: ${gaps.join('; ')}. Adding these completes your cashflow baseline.`;
    }
    return 'Your profile has a solid baseline of records. You can further strengthen it by uploading utility bills or rent receipts to your document vault.';
  }

  if (q.includes('passport') || q.includes('financial trust passport')) {
    return 'You can build a more complete Passport by recording at least 3 months of steady income, logging regular on-time rent or utility bills, and maintaining a positive monthly cash buffer. This proves consistent financial discipline to landlords and lenders.';
  }

  if (q.includes('score change') || q.includes('trust score')) {
    if (trustScore) {
      return `Your score is ${trustScore.score}/100. It updates deterministically whenever you add or edit records based on 4 pillars: Income Consistency (${trustScore.breakdown.incomeConsistency.score}/30), Savings Habits (${trustScore.breakdown.savingsHabits.score}/25), Repayment History (${trustScore.breakdown.repaymentHistory.score}/25), and Expense Management (${trustScore.breakdown.expenseManagement.score}/20). Adding on-time bill payments and maintaining positive cashflow will increase it.`;
    }
    return 'Your score updates automatically whenever you add new income, expense, or bill repayment records into your ledger.';
  }

  return `Based on your records, you have tracked ${formatINR(metrics.totalIncome)} in income and ${formatINR(metrics.totalExpenses)} in expenses across ${metrics.monthsTracked} month(s). Keeping records updated every week ensures your analysis and Passport remain accurate.`;
}
