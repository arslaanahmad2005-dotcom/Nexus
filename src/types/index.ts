// Type definitions for NEXUS — Financial Identity & Trust Network

export type OccupationType =
  | 'Student'
  | 'Freelancer'
  | 'Salaried'
  | 'Gig Worker'
  | 'Small Business Owner'
  | 'Other';

export type RecordType = 'Income' | 'Expense' | 'Savings' | 'Repayment';

export type IncomeCategory =
  | 'Salary'
  | 'Freelance Work'
  | 'Gig Work'
  | 'Business Income'
  | 'Stipend / Allowance'
  | 'Investment / Interest'
  | 'Other Income';

export type ExpenseCategory =
  | 'Food & Groceries'
  | 'Rent & Housing'
  | 'Utilities & Bills'
  | 'Travel & Fuel'
  | 'Education & Learning'
  | 'Health & Medical'
  | 'Shopping & Personal'
  | 'Entertainment'
  | 'Work Supplies / Tools'
  | 'Loan & EMI Repayment'
  | 'Other Expense';

export interface UserProfile {
  id: string;
  fullName: string;
  occupation: OccupationType;
  monthlyIncomeRange: string;
  location?: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialRecord {
  id: string;
  userId: string;
  recordType: RecordType;
  amount: number;
  recordDate: string; // YYYY-MM-DD
  category: string;
  description: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySummary {
  category: string;
  total: number;
  percentage: number;
  count: number;
}

export interface MonthlyBreakdown {
  month: string; // YYYY-MM
  monthName: string; // e.g. "Aug 2026"
  income: number;
  expenses: number;
  net: number;
  repayments: number;
  savings: number;
}

export type TrustScoreStatus = 'insufficient_data' | 'provisional' | 'calculated';

export interface TrustScoreComponent {
  score: number;
  max: number;
  rating: string;
  description: string;
  status: 'sufficient' | 'provisional' | 'incomplete';
}

export interface TrustScoreBreakdown {
  incomeConsistency: TrustScoreComponent & {
    cvRatio?: number;
    monthsEvaluated: number;
  };
  savingsHabits: TrustScoreComponent & {
    savingsRatePercent: number;
    hasExplicitSavings: boolean;
  };
  repaymentHistory: TrustScoreComponent & {
    onTimeCount: number;
    lateCount: number;
    hasRepayments: boolean;
  };
  expenseManagement: TrustScoreComponent & {
    expenseToIncomeRatio: number;
    essentialRatioPercent: number;
  };
}

export interface FinancialTrustScore {
  score: number; // 0 - 100
  status: TrustScoreStatus;
  label: string; // e.g. "Excellent Trust", "Solid Trust", "Provisional Trust", "Data Awaiting"
  breakdown: TrustScoreBreakdown;
  keyFactors: {
    type: 'positive' | 'neutral' | 'attention';
    text: string;
  }[];
  methodologyVersion: string; // "v1.0"
  lastCalculatedAt: string;
  disclaimer: string;
}

export interface TrustTip {
  id: string;
  title: string;
  description: string;
  iconName: 'income' | 'repayment' | 'expense' | 'savings' | 'passport' | 'calendar';
  category: 'Income' | 'Repayment' | 'Expense' | 'Savings' | 'Documentation';
  actionLabel?: string;
  actionLink?: string;
  rationale: string; // "Why am I seeing this tip?"
}

export type AnalysisPeriod = 'this_month' | 'last_month' | 'last_3_months' | 'all_time';

export interface PeriodComparison {
  period: AnalysisPeriod;
  periodLabel: string;
  totalIncome: number;
  totalExpenses: number;
  netRemaining: number;
  previousIncome?: number;
  previousExpenses?: number;
  incomeChangePercentage?: number;
  expenseChangePercentage?: number;
  hasPreviousPeriodData: boolean;
  notes: string;
}

export interface FinancialMetrics {
  totalIncome: number;
  totalExpenses: number;
  netRemaining: number;
  savingsRate: number; // percentage (0-100)
  incomeConsistencyScore: number; // 0-100
  incomeConsistencyRating: 'Very Consistent' | 'Moderately Consistent' | 'Variable / Developing';
  expenseToIncomeRatio: number; // percentage
  repaymentsCount: number;
  repaymentsTotal: number;
  repaymentRegularityScore: number; // 0-100
  monthsTracked: number;
  totalRecordsCount: number;
  topExpenseCategories: CategorySummary[];
  monthlyBreakdown: MonthlyBreakdown[];
  trustScore?: FinancialTrustScore;
  dataSufficiency: {
    hasMinimumRecords: boolean;
    hasMultipleMonths: boolean;
    missingAreas: string[];
  };
}

export interface AIAnalysisResult {
  id?: string;
  summary: string; // Your Money at a Glance
  positiveIndicators: string[]; // What You Are Doing Well
  expenseBreakdownInsight?: string; // Where Your Money Goes
  areasForAttention: string[]; // What Needs Attention
  actionableSuggestions: string[]; // Your Next Three Steps
  trustScoreExplanation?: string; // Your Financial Trust Score
  missingInformation: string[]; // What Information Is Missing
  period?: AnalysisPeriod;
  periodComparison?: PeriodComparison;
  metrics: FinancialMetrics;
  trustScore?: FinancialTrustScore;
  modelUsed: string;
  generatedAt: string;
  source: 'gemini_api' | 'deterministic_engine';
}

export interface FinancialPassport {
  id: string;
  userId: string;
  userName: string;
  occupation: OccupationType;
  version: number;
  status: 'Active' | 'Draft' | 'Archived';
  passportHeadline: string;
  incomeStabilityLabel: string;
  repaymentDisciplineLabel: string;
  savingsHabitLabel: string;
  profileCompleteness: number; // 0-100
  lastAnalysisDate: string;
  metrics: FinancialMetrics;
  trustScore?: FinancialTrustScore;
  aiInsights: {
    summary: string;
    positiveIndicators: string[];
    expenseBreakdownInsight?: string;
    areasForAttention: string[];
    actionableSuggestions: string[];
    trustScoreExplanation?: string;
    missingInformation: string[];
    modelUsed: string;
  };
  supportingDocsSummary: {
    totalUploaded: number;
    types: string[];
  };
  disclaimer: string;
  createdAt: string;
  updatedAt: string;
}

export interface PassportShareLink {
  id: string;
  passportId: string;
  shareToken: string;
  recipientLabel: string;
  includedFields: ('summary' | 'income_consistency' | 'expense_breakdown' | 'repayments' | 'actionable_suggestions' | 'trust_score')[];
  expiresAt: string;
  isRevoked: boolean;
  revokedAt?: string;
  accessCount: number;
  lastAccessedAt?: string;
  createdAt: string;
}

export interface SharedPassportView {
  shareId: string;
  recipientLabel: string;
  expiresAt: string;
  ownerName: string;
  ownerOccupation: OccupationType;
  passportHeadline: string;
  incomeStabilityLabel: string;
  repaymentDisciplineLabel: string;
  savingsHabitLabel: string;
  createdAt: string;
  includedFields: string[];
  trustScore?: FinancialTrustScore;
  passportData: {
    metrics: Partial<FinancialMetrics>;
    trustScore?: FinancialTrustScore;
    insights: {
      summary?: string;
      positiveIndicators?: string[];
      expenseBreakdownInsight?: string;
      areasForAttention?: string[];
      actionableSuggestions?: string[];
      trustScoreExplanation?: string;
    };
  };
  disclaimer: string;
}

export interface SupportingDocument {
  id: string;
  userId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  documentType: 'Bank Statement' | 'Freelance Invoice' | 'Utility Bill' | 'Rent Agreement' | 'Salary Slip' | 'Other';
  status: 'Uploaded' | 'Processing' | 'Reviewed';
  notes?: string;
  uploadedAt: string;
  storagePath?: string;
}
