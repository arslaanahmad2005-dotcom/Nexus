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
  dataSufficiency: {
    hasMinimumRecords: boolean;
    hasMultipleMonths: boolean;
    missingAreas: string[];
  };
}

export interface AIAnalysisResult {
  id?: string;
  summary: string;
  positiveIndicators: string[];
  areasForAttention: string[];
  actionableSuggestions: string[];
  missingInformation: string[];
  metrics: FinancialMetrics;
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
  aiInsights: {
    summary: string;
    positiveIndicators: string[];
    areasForAttention: string[];
    actionableSuggestions: string[];
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
  includedFields: ('summary' | 'income_consistency' | 'expense_breakdown' | 'repayments' | 'actionable_suggestions')[];
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
  passportData: {
    metrics: Partial<FinancialMetrics>;
    insights: {
      summary?: string;
      positiveIndicators?: string[];
      areasForAttention?: string[];
      actionableSuggestions?: string[];
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
