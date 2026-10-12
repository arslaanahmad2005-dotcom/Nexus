import { GoogleGenAI } from '@google/genai';
import { FinancialMetrics, FinancialRecord, AIAnalysisResult, OccupationType } from '../../src/types';
import { formatINR } from '../../src/lib/calculations';

interface AnalyzeOptions {
  records: FinancialRecord[];
  metrics: FinancialMetrics;
  profile: {
    fullName: string;
    occupation: OccupationType;
    monthlyIncomeRange?: string;
  };
}

export async function generateFinancialAnalysis(options: AnalyzeOptions): Promise<AIAnalysisResult> {
  const { metrics, profile } = options;
  const apiKey = process.env.GEMINI_API_KEY;

  // If Gemini API key is configured, use Gemini
  if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are the AI Financial Clarity Advisor for NEXUS — a Financial Identity & Trust Network.
Your task is to analyze the user's financial records and explain their money habits in simple, short, encouraging English that anyone without financial knowledge can understand.

USER PROFILE:
- Occupation: ${profile.occupation}
- Monthly Income Range: ${profile.monthlyIncomeRange || 'Not specified'}

FINANCIAL SUMMARY (Calculated from user records):
- Total Recorded Income: ${formatINR(metrics.totalIncome)}
- Total Recorded Expenses: ${formatINR(metrics.totalExpenses)}
- Net Remaining Money: ${formatINR(metrics.netRemaining)}
- Months of Records: ${metrics.monthsTracked} months (${metrics.totalRecordsCount} records)
- Income Consistency Score: ${metrics.incomeConsistencyScore}/100 (${metrics.incomeConsistencyRating})
- Savings Rate: ${metrics.savingsRate}%
- Top Expense Categories: ${metrics.topExpenseCategories.slice(0, 3).map(c => `${c.category} (${formatINR(c.total)}, ${c.percentage}%)`).join(', ') || 'None recorded'}
- On-time Repayments Tracked: ${metrics.repaymentsCount} records (${formatINR(metrics.repaymentsTotal)})
- Data Gaps: ${metrics.dataSufficiency.missingAreas.join('; ') || 'Good baseline records'}

CRITICAL RULES:
1. Use short, simple English. Avoid complex jargon (instead of "liquidity cushion" say "money left over for emergencies", instead of "debt servicing" say "regular bill/loan payments").
2. NEVER invent numbers or make up fake credit scores or guarantee loan approvals.
3. Be realistic, balanced, and constructive.
4. Output strict JSON with NO markdown code fences or backticks, matching this exact schema:
{
  "summary": "2-3 short sentences describing their money coming in and going out.",
  "positiveIndicators": ["2-3 specific things they are managing well"],
  "areasForAttention": ["1-2 things that may need attention or caution"],
  "actionableSuggestions": ["2-3 practical, simple next steps to strengthen their financial profile"],
  "missingInformation": ["1-2 specific missing records that would make their passport more convincing to lenders"]
}`;

      // Call Gemini model
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      let responseText = response.text || '';
      // Clean up markdown code blocks if returned
      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

      const parsed = JSON.parse(responseText);

      return {
        summary: parsed.summary,
        positiveIndicators: Array.isArray(parsed.positiveIndicators) ? parsed.positiveIndicators : [],
        areasForAttention: Array.isArray(parsed.areasForAttention) ? parsed.areasForAttention : [],
        actionableSuggestions: Array.isArray(parsed.actionableSuggestions) ? parsed.actionableSuggestions : [],
        missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : metrics.dataSufficiency.missingAreas,
        metrics,
        modelUsed: 'gemini-2.5-flash',
        generatedAt: new Date().toISOString(),
        source: 'gemini_api'
      };
    } catch (err: any) {
      console.warn('Gemini API call encountered an issue, falling back to deterministic explanation engine:', err.message);
      // Fallback to deterministic engine
      return generateDeterministicAnalysis(options);
    }
  }

  // Deterministic engine when API key is not configured
  return generateDeterministicAnalysis(options);
}

/**
 * Deterministic Financial Clarity Engine
 * Generates human-written, mathematically accurate explanations based on exact user data.
 */
export function generateDeterministicAnalysis(options: AnalyzeOptions): AIAnalysisResult {
  const { metrics, profile } = options;

  const topCategory = metrics.topExpenseCategories[0];
  const netPositive = metrics.netRemaining > 0;
  const isFreelancerOrGig = profile.occupation === 'Freelancer' || profile.occupation === 'Gig Worker';

  // 1. Construct simple summary
  let summary = '';
  if (netPositive) {
    summary = `Your recorded income is ${formatINR(metrics.netRemaining)} higher than your expenses across ${metrics.monthsTracked} month${metrics.monthsTracked > 1 ? 's' : ''}. That is a strong sign that you live within your earnings and have cash left over.`;
    if (topCategory) {
      summary += ` ${topCategory.category} takes up ${topCategory.percentage}% of what you spend, which is your single biggest category.`;
    }
  } else if (metrics.totalIncome > 0 && metrics.netRemaining === 0) {
    summary = `Your recorded income equals your expenses. You are breaking even, but there is little breathing room for unexpected expenses.`;
  } else if (metrics.totalIncome > 0 && metrics.netRemaining < 0) {
    summary = `Your expenses are currently ${formatINR(Math.abs(metrics.netRemaining))} higher than your recorded income. Reviewing non-essential expenses will help bring your cashflow into balance.`;
  } else {
    summary = `You have recorded some financial activity, but more income entries are needed to show an accurate picture of how money flows in and out.`;
  }

  // 2. Positive indicators
  const positiveIndicators: string[] = [];
  if (netPositive) {
    positiveIndicators.push(`Positive cash cushion: You keep approximately ${metrics.savingsRate}% of the money you make.`);
  }
  if (metrics.incomeConsistencyScore >= 75) {
    positiveIndicators.push(`Steady incoming money: Your income demonstrates reliable month-to-month regularity (${metrics.incomeConsistencyRating}).`);
  } else if (metrics.totalIncome > 0) {
    positiveIndicators.push(`Active earning record: Multiple income entries confirm active economic work as a ${profile.occupation}.`);
  }
  if (metrics.repaymentsCount > 0) {
    positiveIndicators.push(`Disciplined repayment: You have ${metrics.repaymentsCount} recorded on-time payments totaling ${formatINR(metrics.repaymentsTotal)}.`);
  } else {
    positiveIndicators.push(`Zero overdue defaults reported in your submitted records.`);
  }

  // 3. Areas for attention
  const areasForAttention: string[] = [];
  if (topCategory && topCategory.percentage >= 40) {
    areasForAttention.push(`High concentration in ${topCategory.category}: ${topCategory.percentage}% of your spending goes here. A small reduction here will boost your monthly savings.`);
  }
  if (metrics.expenseToIncomeRatio > 85) {
    areasForAttention.push(`Tight expense margin: You are spending ${metrics.expenseToIncomeRatio}% of what you make, leaving limited room for unexpected costs.`);
  }
  if (metrics.monthsTracked < 3) {
    areasForAttention.push(`Short tracking history: Lenders prefer seeing at least 3 to 6 months of steady money flow.`);
  }

  // 4. Actionable suggestions
  const actionableSuggestions: string[] = [];
  if (isFreelancerOrGig) {
    actionableSuggestions.push(`Keep adding every project invoice and client payment to show income reliability over a longer timeline.`);
  } else {
    actionableSuggestions.push(`Aim to set aside a fixed ₹1,000 to ₹3,000 right when money comes in to build a visible emergency buffer.`);
  }
  if (topCategory) {
    actionableSuggestions.push(`Track small everyday transactions under ${topCategory.category} for two weeks to see where ₹500 to ₹1,500 can be conserved.`);
  }
  actionableSuggestions.push(`Keep recording all utility and mobile recharge receipts as proof of reliable recurring payments.`);

  // 5. Missing information
  const missingInformation: string[] = [...metrics.dataSufficiency.missingAreas];
  if (missingInformation.length === 0) {
    missingInformation.push('Add an electricity bill or rent receipt as additional supporting proof.');
  }

  return {
    summary,
    positiveIndicators,
    areasForAttention: areasForAttention.slice(0, 2),
    actionableSuggestions: actionableSuggestions.slice(0, 3),
    missingInformation: missingInformation.slice(0, 2),
    metrics,
    modelUsed: 'nexus-financial-engine-v1 (Deterministic)',
    generatedAt: new Date().toISOString(),
    source: 'deterministic_engine'
  };
}
