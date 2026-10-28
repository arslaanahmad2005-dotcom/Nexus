import { GoogleGenAI } from '@google/genai';
import {
  FinancialMetrics,
  FinancialRecord,
  FinancialTrustScore,
  AnalysisPeriod,
  PeriodComparison,
  OccupationType,
  GemmaStructuredAnalysis,
  FinancialImprovementPlan,
  GemmaModelInfo
} from '../../src/types';
import { formatINR } from '../../src/lib/calculations';

export interface AnonymizedContextProfile {
  occupation: OccupationType;
  monthlyIncomeRange?: string;
}

export interface GemmaAnalysisRequest {
  records: FinancialRecord[];
  metrics: FinancialMetrics;
  trustScore?: FinancialTrustScore;
  period?: AnalysisPeriod;
  periodComparison?: PeriodComparison;
  profile: AnonymizedContextProfile;
  correlationId?: string;
}

export interface GemmaChatRequest {
  message: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  metrics: FinancialMetrics;
  trustScore?: FinancialTrustScore;
  profile: AnonymizedContextProfile;
  preferredLanguage?: 'en' | 'hi' | 'hinglish';
  correlationId?: string;
}

export interface GemmaImprovementPlanRequest {
  metrics: FinancialMetrics;
  trustScore?: FinancialTrustScore;
  profile: AnonymizedContextProfile;
  correlationId?: string;
}

// -----------------------------------------------------------------------------
// Environment Configuration Reader
// -----------------------------------------------------------------------------
export function getGemmaConfig() {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || '';
  const configuredModel = process.env.GEMMA_MODEL?.trim() || 'gemma-4-26b-a4b-it';
  const provider = process.env.AI_PROVIDER?.trim() || 'gemma';
  const timeoutMs = parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '30000', 10);

  const isConfigured =
    apiKey.length > 10 && !apiKey.startsWith('your_') && !apiKey.includes('placeholder');

  return {
    apiKey,
    configuredModel,
    provider,
    timeoutMs: isNaN(timeoutMs) || timeoutMs <= 0 ? 30000 : timeoutMs,
    isConfigured
  };
}

export function getModelInfo(modelName?: string): GemmaModelInfo {
  const config = getGemmaConfig();
  const name = modelName || config.configuredModel;
  return {
    model_name: name,
    model_version: 'Gemma 4 Open-Weight',
    provider: 'Google Gemini API (Gemma Host)',
    is_open_weight: true,
    timestamp: new Date().toISOString()
  };
}

// -----------------------------------------------------------------------------
// Safe Request Sanitization & Prompt Injection Protection
// -----------------------------------------------------------------------------
export function sanitizeUserPrompt(text: string, maxLength = 500): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
    .replace(/(system prompt|ignore previous instructions|disregard all prior|ignore all instructions|forget previous instructions)/gi, '[FILTERED]')
    .replace(/(<\|im_start\|>|<\|im_end\|>|<start_of_turn>|<end_of_turn>|\[INST\]|\[\/INST\]|### Instruction:|### System:|### Response:)/gi, '[FILTERED]')
    .replace(/^(system:|assistant:|human:|user:)\s*/gim, '[FILTERED] ')
    .trim()
    .slice(0, maxLength);
}

// Calculate Debt-to-Income Ratio safely from deterministic metrics
export function calculateDti(metrics: FinancialMetrics): number | null {
  if (metrics.repaymentsTotal > 0 && metrics.totalIncome > 0) {
    return Math.round((metrics.repaymentsTotal / metrics.totalIncome) * 100);
  }
  return null;
}

// -----------------------------------------------------------------------------
// Feature: Explain My Financial Profile (Gemma 4 Structured Analysis)
// -----------------------------------------------------------------------------
export async function explainFinancialProfileWithGemma(
  request: GemmaAnalysisRequest
): Promise<GemmaStructuredAnalysis> {
  const config = getGemmaConfig();
  const { metrics, trustScore, profile, periodComparison, period, correlationId } = request;
  const dti = calculateDti(metrics);

  if (config.isConfigured) {
    try {
      const ai = new GoogleGenAI({ apiKey: config.apiKey });
      const prompt = `You are the NEXUS AI Financial Health Copilot powered by Google Gemma 4.
Your role is to explain the user's financial profile based STRICTLY on their verified, deterministic indicators.
DO NOT invent financial transactions, fake credit scores, or promise guaranteed loan approvals.
Use clear, encouraging, accessible English.

ANONYMIZED CONTEXT:
- Occupation: ${profile.occupation}
- Monthly Income Range: ${profile.monthlyIncomeRange || 'Unspecified'}
- Analysis Period: ${periodComparison?.periodLabel || period || 'Current records'}

DETERMINISTIC FINANCIAL INDICATORS (CALCULATED BY NEXUS ENGINE):
- Total Recorded Income: ${formatINR(metrics.totalIncome)}
- Total Recorded Expenses: ${formatINR(metrics.totalExpenses)}
- Net Remaining Buffer: ${formatINR(metrics.netRemaining)}
- Savings Rate: ${metrics.savingsRate}%
- Income Consistency Score: ${metrics.incomeConsistencyScore}/100 (${metrics.incomeConsistencyRating})
- Debt-to-Income (DTI) Ratio: ${dti !== null ? `${dti}%` : 'No debt/EMI records tracked'}
- Repayments Tracked: ${metrics.repaymentsCount} on-time payments totaling ${formatINR(metrics.repaymentsTotal)} (Regularity: ${metrics.repaymentRegularityScore}/100)
- Financial Trust Score: ${trustScore ? `${trustScore.score}/100 (${trustScore.label})` : 'Awaiting records'}
- Key Factors Influencing Trust Score: ${trustScore?.keyFactors?.map((f) => f.text).join('; ') || 'Standard indicators'}
- Top Expense Categories: ${metrics.topExpenseCategories.slice(0, 3).map((c) => `${c.category} (${c.percentage}%)`).join(', ') || 'None'}

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

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_REQUEST_TIMEOUT')), config.timeoutMs)
      );

      const resp = await Promise.race([callPromise, timeoutPromise]);
      let rawText = resp?.text || '';

      rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(rawText);

      return validateAndNormalizeStructuredResponse(parsed, config.configuredModel);
    } catch (err: any) {
      console.warn(`[NEXUS Gemma 4][${correlationId || 'SYS'}] Gemma explanation failed:`, err?.message || 'Error');
      return generateDeterministicStructuredExplanation(request);
    }
  }

  return generateDeterministicStructuredExplanation(request);
}

// -----------------------------------------------------------------------------
// Feature: AI Financial Chat Assistant (Contextual Multi-turn / Multilingual)
// -----------------------------------------------------------------------------
export async function chatWithFinancialCopilot(request: GemmaChatRequest): Promise<{
  reply: string;
  suggestedQuestions: string[];
  modelInformation: GemmaModelInfo;
}> {
  const config = getGemmaConfig();
  const { message, history = [], metrics, trustScore, profile, preferredLanguage = 'en', correlationId } = request;
  const sanitizedMsg = sanitizeUserPrompt(message);
  const dti = calculateDti(metrics);

  const modelInfo = getModelInfo(config.configuredModel);

  // Check language intent (Hindi / Hinglish support)
  const isHindiOrHinglish =
    preferredLanguage === 'hi' ||
    preferredLanguage === 'hinglish' ||
    /[क-ह]/.test(sanitizedMsg) ||
    /\b(kaise|kya|mera|meri|paisa|bachat|kharcha|batao|karo|hai|hoga)\b/i.test(sanitizedMsg);

  if (config.isConfigured && sanitizedMsg.length > 0) {
    try {
      const ai = new GoogleGenAI({ apiKey: config.apiKey });

      const languageInstruction = isHindiOrHinglish
        ? 'User preferred language is Hindi / Hinglish. Respond in friendly, respectful, natural conversational Hinglish (Roman script Hindi mixed with English terms, e.g. "Aapka monthly savings rate...") or simple Hindi, making financial terms crystal clear.'
        : 'Respond in simple, friendly, accessible English without complex banking jargon.';

      // Format previous 3 turns for context
      const recentHistory = history
        .slice(-4)
        .map((h) => `${h.role === 'user' ? 'User' : 'Copilot'}: ${sanitizeUserPrompt(h.content, 200)}`)
        .join('\n');

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
- Debt-to-Income (DTI): ${dti !== null ? `${dti}%` : 'No debt tracked'}
- Repayments Tracked: ${metrics.repaymentsCount} records (${formatINR(metrics.repaymentsTotal)})
- Calculated Financial Trust Score: ${trustScore ? `${trustScore.score}/100 (${trustScore.label})` : 'Awaiting more data'}
- Top Expense Categories: ${metrics.topExpenseCategories.slice(0, 3).map((c) => `${c.category}: ${formatINR(c.total)} (${c.percentage}%)`).join(', ') || 'None'}

CONVERSATION CONTEXT:
${recentHistory ? recentHistory + '\n' : ''}User: ${sanitizedMsg}
Copilot:`;

      const callPromise = ai.models.generateContent({
        model: config.configuredModel,
        contents: prompt
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_REQUEST_TIMEOUT')), config.timeoutMs)
      );

      const resp = await Promise.race([callPromise, timeoutPromise]);
      const fullText = (resp?.text || '').trim();

      return parseChatResponse(fullText, modelInfo, isHindiOrHinglish);
    } catch (err: any) {
      console.warn(`[NEXUS Gemma 4][${correlationId || 'SYS'}] Chat generation failed:`, err?.message || 'Error');
      return generateDeterministicChatReply(sanitizedMsg, metrics, trustScore, profile, isHindiOrHinglish);
    }
  }

  return generateDeterministicChatReply(sanitizedMsg, metrics, trustScore, profile, isHindiOrHinglish);
}

// -----------------------------------------------------------------------------
// Feature: 30-Day Financial Improvement Plan (Gemma 4 Personalized Roadmap)
// -----------------------------------------------------------------------------
export async function generate30DayPlanWithGemma(
  request: GemmaImprovementPlanRequest
): Promise<FinancialImprovementPlan> {
  const config = getGemmaConfig();
  const { metrics, trustScore, profile, correlationId } = request;
  const modelInfo = getModelInfo(config.configuredModel);
  const dti = calculateDti(metrics);

  if (config.isConfigured) {
    try {
      const ai = new GoogleGenAI({ apiKey: config.apiKey });
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

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_REQUEST_TIMEOUT')), config.timeoutMs)
      );

      const resp = await Promise.race([callPromise, timeoutPromise]);
      let rawText = resp?.text || '';
      rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

      const parsed = JSON.parse(rawText);
      return {
        id: `plan-${Date.now()}`,
        title: parsed.title || `30-Day Financial Health Roadmap for ${profile.occupation}`,
        generatedAt: new Date().toISOString(),
        overallGoal: parsed.overallGoal || 'Build disciplined expense management and verifiable financial habits.',
        weeks: Array.isArray(parsed.weeks) && parsed.weeks.length === 4 ? parsed.weeks : getDeterministicWeeks(metrics, profile),
        modelInformation: modelInfo,
        disclaimer: 'NEXUS provides educational financial improvement roadmaps. These recommendations are not statutory credit repair or loan approval guarantees.'
      };
    } catch (err: any) {
      console.warn(`[NEXUS Gemma 4][${correlationId || 'SYS'}] Plan generation failed:`, err?.message || 'Error');
      return generateDeterministicImprovementPlan(request);
    }
  }

  return generateDeterministicImprovementPlan(request);
}

// -----------------------------------------------------------------------------
// Parsers, Normalizers & Fallbacks
// -----------------------------------------------------------------------------
function validateAndNormalizeStructuredResponse(
  raw: any,
  modelName: string
): GemmaStructuredAnalysis {
  return {
    summary:
      typeof raw.summary === 'string' && raw.summary.trim()
        ? raw.summary.trim()
        : 'Your financial ledger indicates active earning and spending patterns.',
    financial_strengths: Array.isArray(raw.financial_strengths) && raw.financial_strengths.length > 0
      ? raw.financial_strengths
      : ['Regular record keeping provides a baseline for alternative credit evaluation.'],
    financial_risks: Array.isArray(raw.financial_risks) && raw.financial_risks.length > 0
      ? raw.financial_risks
      : ['High concentration of expenses in primary spending categories.'],
    improvement_recommendations: Array.isArray(raw.improvement_recommendations) && raw.improvement_recommendations.length > 0
      ? raw.improvement_recommendations
      : ['Maintain records over consecutive months to prove income stability.'],
    suggested_actions: Array.isArray(raw.suggested_actions) && raw.suggested_actions.length > 0
      ? raw.suggested_actions
      : ['Log daily expenses', 'Upload rent/utility proof', 'Review subscriptions'],
    confidence_limitations: Array.isArray(raw.confidence_limitations) && raw.confidence_limitations.length > 0
      ? raw.confidence_limitations
      : ['Insights are educational and derived solely from user-provided entries; does not guarantee loan approval.'],
    model_information: getModelInfo(modelName)
  };
}

function parseChatResponse(
  text: string,
  modelInfo: GemmaModelInfo,
  isHindi: boolean
): { reply: string; suggestedQuestions: string[]; modelInformation: GemmaModelInfo } {
  let reply = text;
  const suggestedQuestions: string[] = [];

  const suggestionIdx = text.search(/SUGGESTIONS:|FOLLOW-UP QUESTIONS:/i);
  if (suggestionIdx !== -1) {
    reply = text.slice(0, suggestionIdx).trim();
    const suggestionsPart = text.slice(suggestionIdx);
    const matches = suggestionsPart.match(/[-*•\d.]\s*(.*)/g);
    if (matches) {
      matches.slice(0, 3).forEach((m) => {
        const cleaned = m.replace(/^[-*•\d.]\s*/, '').replace(/[[\]"]/g, '').trim();
        if (cleaned.length > 5 && !cleaned.toLowerCase().includes('suggestions:')) {
          suggestedQuestions.push(cleaned);
        }
      });
    }
  }

  if (suggestedQuestions.length === 0) {
    if (isHindi) {
      suggestedQuestions.push(
        'Main apna savings rate kaise badhaun?',
        'Konsa kharcha kam karna sabse aasan hai?',
        'Financial Trust Score kaise improve karein?'
      );
    } else {
      suggestedQuestions.push(
        'How can I improve my savings rate?',
        'What is affecting my financial stability?',
        'How can I prepare financially before applying for a loan?'
      );
    }
  }

  return {
    reply,
    suggestedQuestions: suggestedQuestions.slice(0, 3),
    modelInformation: modelInfo
  };
}

// -----------------------------------------------------------------------------
// Pure Deterministic Engines (Zero Cloud Dependency Fallback)
// -----------------------------------------------------------------------------
export function generateDeterministicStructuredExplanation(
  request: GemmaAnalysisRequest
): GemmaStructuredAnalysis {
  const { metrics, trustScore, profile } = request;
  const top = metrics.topExpenseCategories[0];
  const dti = calculateDti(metrics);
  const netPositive = metrics.netRemaining > 0;

  const strengths: string[] = [];
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

  const risks: string[] = [];
  if (top && top.percentage >= 35) {
    risks.push(`Heavy expense concentration in ${top.category} (${top.percentage}% of all expenses).`);
  }
  if (metrics.expenseToIncomeRatio > 80) {
    risks.push(`Narrow emergency breathing room (spending absorbs ${metrics.expenseToIncomeRatio}% of revenue).`);
  }
  if (dti !== null && dti > 35) {
    risks.push(`Debt-to-Income ratio of ${dti}% requires careful cashflow monitoring.`);
  }

  const recommendations: string[] = [
    `Formalize an emergency reserve equivalent to 1-2 months of living expenses (${formatINR(metrics.totalExpenses * 1.5)}).`,
    `Track all freelance invoices and utility bills to prove payment regularity.`,
    `Review recurring commitments in ${top?.category || 'discretionary categories'} to build monthly cushion.`
  ];

  const actions: string[] = [
    `Set aside 10% from every incoming invoice before spending.`,
    `Upload your most recent rent receipt or utility bill as verification proof.`,
    `Record all weekly expenses consistently to maintain score accuracy.`
  ];

  return {
    summary: `Your recorded income of ${formatINR(metrics.totalIncome)} balances against ${formatINR(metrics.totalExpenses)} in expenses across ${metrics.monthsTracked} month(s). ${netPositive ? `You maintain a positive cash surplus of ${formatINR(metrics.netRemaining)}.` : 'Expenses are currently tight against income.'}`,
    financial_strengths: strengths,
    financial_risks: risks,
    improvement_recommendations: recommendations,
    suggested_actions: actions,
    confidence_limitations: [
      'Calculations are deterministic based on user entries. NEXUS insights are educational and do not constitute an official credit bureau score or loan guarantee.'
    ],
    model_information: {
      model_name: 'nexus-deterministic-engine-v1',
      model_version: 'Deterministic Fallback',
      provider: 'NEXUS Local Calculation Engine',
      is_open_weight: false,
      timestamp: new Date().toISOString()
    }
  };
}

export function generateDeterministicChatReply(
  question: string,
  metrics: FinancialMetrics,
  trustScore?: FinancialTrustScore,
  profile?: AnonymizedContextProfile,
  isHindi = false
): { reply: string; suggestedQuestions: string[]; modelInformation: GemmaModelInfo } {
  const q = question.toLowerCase();
  const dti = calculateDti(metrics);
  const top = metrics.topExpenseCategories[0];
  const occ = profile?.occupation || 'Freelancer';

  let reply = '';
  const suggestedQuestions: string[] = isHindi
    ? [
        'Bachat kaise improve karein?',
        'Mera sabse bada kharcha kya hai?',
        'Financial stability score kaise badhega?'
      ]
    : [
        'How can I improve my savings rate?',
        'What are my biggest financial risks?',
        'How can I prepare financially before applying for a loan?'
      ];

  if (q.includes('score') || q.includes('trust')) {
    reply = isHindi
      ? `Aapka Financial Trust Score ${trustScore ? `${trustScore.score}/100` : 'awaiting records'} hai. Yeh score income consistency (${trustScore?.breakdown?.incomeConsistency?.score || 0}/30), bachat (${trustScore?.breakdown?.savingsHabits?.score || 0}/25), aur on-time repayments par depend karta hai. Regular bills add karne se yeh improve hoga.`
      : `Your Financial Trust Score is currently ${trustScore ? `${trustScore.score}/100 (${trustScore.label})` : 'calculated from your ledger'}. It is influenced by income regularity (${trustScore?.breakdown?.incomeConsistency?.score || 0}/30), savings habits (${trustScore?.breakdown?.savingsHabits?.score || 0}/25), and on-time payments. Logging consistent bill receipts increases your score.`;
  } else if (q.includes('saving') || q.includes('bachat')) {
    reply = isHindi
      ? `Aapka current savings rate ${metrics.savingsRate}% hai, jisse lagbhag ${formatINR(metrics.netRemaining)} monthly surplus bachta hai. Income aate hi 10% seedhe emergency fund mein transfer karne se stability tezi se badhegi.`
      : `Your current savings rate is ${metrics.savingsRate}%, leaving a monthly surplus of ${formatINR(metrics.netRemaining)}. We recommend allocating 10% to 15% directly into a separate reserve as soon as client payments or earnings arrive.`;
  } else if (q.includes('risk') || q.includes('khatra')) {
    reply = isHindi
      ? `Aapka sabse bada risk area ${top ? `${top.category} (${top.percentage}% of expenses)` : 'spending margin'} hai. Emergency fund chhota hone par achanak aane wale kharche cashflow par asar daal sakte hain.`
      : `Your primary risk is expense concentration: ${top ? `${top.category} accounts for ${top.percentage}% of your expenses` : 'high expense-to-income ratio'}. Keeping a 30-day emergency buffer prevents cashflow strain during lean periods.`;
  } else if (q.includes('loan') || q.includes('borrow')) {
    reply = isHindi
      ? `Loan ya EMI lene se pehle Debt-to-Income (DTI) ratio 35% ke andar hona chahiye (current: ${dti !== null ? `${dti}%` : '0%'}). Saath hi 3 mahine ke steady income records aur on-time bill proofs upload karne se verification aasan ho jaata hai.`
      : `Before applying for credit, aim for a Debt-to-Income (DTI) ratio below 35% (currently ${dti !== null ? `${dti}%` : 'unencumbered'}) and maintain at least 3 consecutive months of recorded income and on-time rent/bill payments to prove repayment discipline.`;
  } else {
    reply = isHindi
      ? `Aapke records ke mutabiq, aapne ${formatINR(metrics.totalIncome)} income aur ${formatINR(metrics.totalExpenses)} expenses track kiye hain. Aapka savings buffer ${metrics.savingsRate}% hai. Weekly records update karne se Copilot hamesha accurate insights dega.`
      : `According to your verified ledger as a ${occ}, you have tracked ${formatINR(metrics.totalIncome)} in earnings and ${formatINR(metrics.totalExpenses)} in expenses across ${metrics.monthsTracked} month(s), retaining ${metrics.savingsRate}% as cushion. Keep adding regular receipts to build your alternative financial passport.`;
  }

  return {
    reply,
    suggestedQuestions,
    modelInformation: {
      model_name: 'nexus-deterministic-engine-v1',
      provider: 'NEXUS Local Calculation Engine',
      is_open_weight: false,
      timestamp: new Date().toISOString()
    }
  };
}

export function generateDeterministicImprovementPlan(
  request: GemmaImprovementPlanRequest
): FinancialImprovementPlan {
  const { metrics, profile } = request;
  return {
    id: `plan-det-${Date.now()}`,
    title: `30-Day Financial Health Roadmap for ${profile.occupation}`,
    generatedAt: new Date().toISOString(),
    overallGoal: `Enhance financial breathing room and document consistent repayment discipline as a ${profile.occupation}.`,
    weeks: getDeterministicWeeks(metrics, profile),
    modelInformation: {
      model_name: 'nexus-deterministic-engine-v1',
      provider: 'NEXUS Local Calculation Engine',
      is_open_weight: false,
      timestamp: new Date().toISOString()
    },
    disclaimer:
      'NEXUS provides educational financial roadmaps. These recommendations are not statutory credit repair or loan approval guarantees.'
  };
}

function getDeterministicWeeks(metrics: FinancialMetrics, profile: AnonymizedContextProfile) {
  const top = metrics.topExpenseCategories[0]?.category || 'Daily Purchases';
  return [
    {
      weekNumber: 1,
      theme: 'Financial Awareness',
      objective: 'Track all cash inflows and identify unnecessary expenses in your primary categories.',
      tasks: [
        {
          id: 'w1-t1',
          title: 'Daily Expense Logging',
          description: 'Record every purchase for 7 days to eliminate untracked cash leakages.',
          completed: false,
          estimatedMinutes: 10
        },
        {
          id: 'w1-t2',
          title: 'Audit Top Category Spending',
          description: `Review spending in ${top} and identify 2 non-essential items to pause.`,
          completed: false,
          estimatedMinutes: 20
        }
      ],
      recommendations: ['Small recurring daily expenses often add up to over 15% of monthly outflow.']
    },
    {
      weekNumber: 2,
      theme: 'Expense Management',
      objective: 'Implement manageable reductions and establish a dedicated emergency reserve goal.',
      tasks: [
        {
          id: 'w2-t1',
          title: 'Set Monthly Category Cap',
          description: `Establish a 10% lower ceiling for ${top} spending for the remainder of the month.`,
          completed: false,
          estimatedMinutes: 15
        },
        {
          id: 'w2-t2',
          title: 'Automate First-Day Savings',
          description: 'Set an automatic transfer of 10% from incoming payments into your savings reserve.',
          completed: false,
          estimatedMinutes: 25
        }
      ],
      recommendations: ['Always save immediately when revenue arrives rather than saving whatever happens to remain at month end.']
    },
    {
      weekNumber: 3,
      theme: 'Financial Stability',
      objective: 'Strengthen on-time bill payment habits and prepare for irregular income periods.',
      tasks: [
        {
          id: 'w3-t1',
          title: 'Schedule Bill Payments',
          description: 'Ensure utility, mobile recharge, or rent payments are made 48 hours before due date.',
          completed: false,
          estimatedMinutes: 15
        },
        {
          id: 'w3-t2',
          title: 'Upload Proof Documents',
          description: 'Add rent receipts or invoices to your NEXUS Document Vault for third-party verification.',
          completed: false,
          estimatedMinutes: 20
        }
      ],
      recommendations: ['Consistent utility and rent payments are key alternative trust indicators for lenders.']
    },
    {
      weekNumber: 4,
      theme: 'Financial Improvement Review',
      objective: 'Compare monthly metrics, assess cash cushion growth, and refresh your Financial Passport.',
      tasks: [
        {
          id: 'w4-t1',
          title: 'Review Cash Surplus',
          description: `Compare actual savings against your initial baseline (${metrics.savingsRate}%).`,
          completed: false,
          estimatedMinutes: 20
        },
        {
          id: 'w4-t2',
          title: 'Regenerate Financial Trust Passport',
          description: 'Update your Financial Passport with newly validated metrics to share with partners.',
          completed: false,
          estimatedMinutes: 15
        }
      ],
      recommendations: ['A 3-month sustained improvement trend is the most powerful signal of financial reliability.']
    }
  ];
}
