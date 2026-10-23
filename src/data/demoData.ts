import { FinancialRecord, UserProfile, FinancialPassport } from '../types';
import { calculateFinancialMetrics, calculateFinancialTrustScore } from '../lib/calculations';

export interface DemoPersona {
  id: string;
  name: string;
  tagline: string;
  profile: UserProfile;
  records: FinancialRecord[];
  passport: FinancialPassport;
}

// -----------------------------------------------------------------------------
// Persona 1: Priya Sharma — Freelance UX Designer
// -----------------------------------------------------------------------------
const priyaProfile: UserProfile = {
  id: 'demo-priya-sharma',
  fullName: 'Priya Sharma',
  occupation: 'Freelancer',
  monthlyIncomeRange: '₹50,000 - ₹80,000',
  location: 'Pune, Maharashtra',
  onboardingCompleted: true,
  createdAt: '2026-06-01T10:00:00Z',
  updatedAt: '2026-10-12T15:00:00Z'
};

const priyaRecords: FinancialRecord[] = [
  // October 2026
  {
    id: 'rec-p1-1',
    userId: 'demo-priya-sharma',
    recordType: 'Income',
    amount: 38000,
    recordDate: '2026-10-05',
    category: 'Freelance Work',
    description: 'E-commerce Redesign Milestone 2 - Zepto Vendor',
    isRecurring: false,
    createdAt: '2026-10-05T10:00:00Z',
    updatedAt: '2026-10-05T10:00:00Z'
  },
  {
    id: 'rec-p1-2',
    userId: 'demo-priya-sharma',
    recordType: 'Income',
    amount: 24000,
    recordDate: '2026-10-02',
    category: 'Freelance Work',
    description: 'Monthly UX Consultation Retainer - FinTech Startup',
    isRecurring: true,
    createdAt: '2026-10-02T10:00:00Z',
    updatedAt: '2026-10-02T10:00:00Z'
  },
  {
    id: 'rec-p1-3',
    userId: 'demo-priya-sharma',
    recordType: 'Expense',
    amount: 6500,
    recordDate: '2026-10-04',
    category: 'Work Supplies / Tools',
    description: 'WeWork Hot Desk Monthly Membership',
    isRecurring: true,
    createdAt: '2026-10-04T12:00:00Z',
    updatedAt: '2026-10-04T12:00:00Z'
  },
  {
    id: 'rec-p1-4',
    userId: 'demo-priya-sharma',
    recordType: 'Expense',
    amount: 3200,
    recordDate: '2026-10-06',
    category: 'Work Supplies / Tools',
    description: 'Figma Organization & Adobe Suite Subscriptions',
    isRecurring: true,
    createdAt: '2026-10-06T14:00:00Z',
    updatedAt: '2026-10-06T14:00:00Z'
  },
  {
    id: 'rec-p1-5',
    userId: 'demo-priya-sharma',
    recordType: 'Repayment',
    amount: 4500,
    recordDate: '2026-10-08',
    category: 'Loan & EMI Repayment',
    description: 'MacBook Pro EMI - Bajaj Finserv (On-time debit)',
    isRecurring: true,
    createdAt: '2026-10-08T09:00:00Z',
    updatedAt: '2026-10-08T09:00:00Z'
  },
  {
    id: 'rec-p1-6',
    userId: 'demo-priya-sharma',
    recordType: 'Expense',
    amount: 11200,
    recordDate: '2026-10-10',
    category: 'Food & Groceries',
    description: 'Nature Basket monthly pantry and kitchen supplies',
    isRecurring: false,
    createdAt: '2026-10-10T16:00:00Z',
    updatedAt: '2026-10-10T16:00:00Z'
  },
  {
    id: 'rec-p1-7',
    userId: 'demo-priya-sharma',
    recordType: 'Savings',
    amount: 9000,
    recordDate: '2026-10-11',
    category: 'Savings',
    description: 'Monthly Recurring Deposit - ICICI iWish Goal',
    isRecurring: true,
    createdAt: '2026-10-11T11:00:00Z',
    updatedAt: '2026-10-11T11:00:00Z'
  },

  // September 2026
  {
    id: 'rec-p1-8',
    userId: 'demo-priya-sharma',
    recordType: 'Income',
    amount: 35000,
    recordDate: '2026-09-08',
    category: 'Freelance Work',
    description: 'Brand Identity Design - Organic Farms India',
    isRecurring: false,
    createdAt: '2026-09-08T10:00:00Z',
    updatedAt: '2026-09-08T10:00:00Z'
  },
  {
    id: 'rec-p1-9',
    userId: 'demo-priya-sharma',
    recordType: 'Income',
    amount: 24000,
    recordDate: '2026-09-02',
    category: 'Freelance Work',
    description: 'Monthly UX Consultation Retainer - FinTech Startup',
    isRecurring: true,
    createdAt: '2026-09-02T10:00:00Z',
    updatedAt: '2026-09-02T10:00:00Z'
  },
  {
    id: 'rec-p1-10',
    userId: 'demo-priya-sharma',
    recordType: 'Expense',
    amount: 14500,
    recordDate: '2026-09-12',
    category: 'Rent & Housing',
    description: 'Apartment rent contribution (Co-living space, Pune)',
    isRecurring: true,
    createdAt: '2026-09-12T15:00:00Z',
    updatedAt: '2026-09-12T15:00:00Z'
  },
  {
    id: 'rec-p1-11',
    userId: 'demo-priya-sharma',
    recordType: 'Repayment',
    amount: 4500,
    recordDate: '2026-09-08',
    category: 'Loan & EMI Repayment',
    description: 'MacBook Pro EMI - Bajaj Finserv (On-time debit)',
    isRecurring: true,
    createdAt: '2026-09-08T09:00:00Z',
    updatedAt: '2026-09-08T09:00:00Z'
  },
  {
    id: 'rec-p1-12',
    userId: 'demo-priya-sharma',
    recordType: 'Expense',
    amount: 2400,
    recordDate: '2026-09-15',
    category: 'Utilities & Bills',
    description: 'Airtel Broadband Fiber + Electricity bill',
    isRecurring: true,
    createdAt: '2026-09-15T18:00:00Z',
    updatedAt: '2026-09-15T18:00:00Z'
  },
  {
    id: 'rec-p1-13',
    userId: 'demo-priya-sharma',
    recordType: 'Savings',
    amount: 8500,
    recordDate: '2026-09-20',
    category: 'Savings',
    description: 'Monthly Recurring Deposit transfer',
    isRecurring: true,
    createdAt: '2026-09-20T11:00:00Z',
    updatedAt: '2026-09-20T11:00:00Z'
  },

  // August 2026
  {
    id: 'rec-p1-14',
    userId: 'demo-priya-sharma',
    recordType: 'Income',
    amount: 42000,
    recordDate: '2026-08-14',
    category: 'Freelance Work',
    description: 'Mobile App Wireframes & Interactive Prototype',
    isRecurring: false,
    createdAt: '2026-08-14T10:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'rec-p1-15',
    userId: 'demo-priya-sharma',
    recordType: 'Income',
    amount: 24000,
    recordDate: '2026-08-02',
    category: 'Freelance Work',
    description: 'Monthly UX Consultation Retainer - FinTech Startup',
    isRecurring: true,
    createdAt: '2026-08-02T10:00:00Z',
    updatedAt: '2026-08-02T10:00:00Z'
  },
  {
    id: 'rec-p1-16',
    userId: 'demo-priya-sharma',
    recordType: 'Repayment',
    amount: 4500,
    recordDate: '2026-08-08',
    category: 'Loan & EMI Repayment',
    description: 'MacBook Pro EMI - Bajaj Finserv (On-time debit)',
    isRecurring: true,
    createdAt: '2026-08-08T09:00:00Z',
    updatedAt: '2026-08-08T09:00:00Z'
  },
  {
    id: 'rec-p1-17',
    userId: 'demo-priya-sharma',
    recordType: 'Expense',
    amount: 14500,
    recordDate: '2026-08-10',
    category: 'Rent & Housing',
    description: 'Apartment rent contribution (Co-living space, Pune)',
    isRecurring: true,
    createdAt: '2026-08-10T15:00:00Z',
    updatedAt: '2026-08-10T15:00:00Z'
  },
  {
    id: 'rec-p1-18',
    userId: 'demo-priya-sharma',
    recordType: 'Expense',
    amount: 3900,
    recordDate: '2026-08-18',
    category: 'Travel & Fuel',
    description: 'Metro pass and weekend Pune-Mumbai cab',
    isRecurring: false,
    createdAt: '2026-08-18T19:00:00Z',
    updatedAt: '2026-08-18T19:00:00Z'
  }
];

const priyaMetrics = calculateFinancialMetrics(priyaRecords);

const priyaPassport: FinancialPassport = {
  id: 'passport-priya-sharma-2026',
  userId: 'demo-priya-sharma',
  userName: 'Priya Sharma',
  occupation: 'Freelancer',
  version: 1,
  status: 'Active',
  passportHeadline: 'Consistent Independent Freelancer with Verified Cushion & On-Time Equipment EMI',
  incomeStabilityLabel: 'Consistent & Active',
  repaymentDisciplineLabel: '100% On-Time Record (3 consecutive months)',
  savingsHabitLabel: 'Regular Saver (~31% retained)',
  profileCompleteness: 92,
  lastAnalysisDate: '2026-10-12T15:30:00Z',
  metrics: priyaMetrics,
  trustScore: calculateFinancialTrustScore(priyaRecords, priyaProfile),
  aiInsights: {
    summary:
      'Priya earns an average of ₹62,000 monthly with positive net cash remaining every single month. She demonstrates disciplined debt handling with 3 consecutive on-time device EMI repayments and maintains regular recurring deposits.',
    positiveIndicators: [
      'Healthy cashflow cushion: Maintains an average surplus of ₹24,000+ each month after all bills.',
      'Disciplined repayment track record: 3 out of 3 tracked equipment installments debited on-time.',
      'Active recurring retainer: Guaranteed baseline income of ₹24,000 every month alongside variable project milestones.'
    ],
    areasForAttention: [
      'Workspace and software subscriptions represent ₹9,700/month (18% of expenses) — monitor these to ensure full client billability.',
      'Rent and housing makes up the single largest periodic outflow at ₹14,500.'
    ],
    actionableSuggestions: [
      'Maintain client contracts and digital invoices in one folder as supporting income documentation.',
      'Consider parking 1 month of living expenses (₹35,000) in a high-yield liquid emergency fund to reinforce your trust profile.',
      'Request written milestone sign-offs for upcoming Q4 projects to substantiate future income pipeline.'
    ],
    missingInformation: [
      'Client GST invoices or bank statement PDF uploads would elevate this passport to fully verified status.'
    ],
    modelUsed: 'gemini-2.5-flash'
  },
  supportingDocsSummary: {
    totalUploaded: 2,
    types: ['Freelance Retainer Contract', 'Laptop EMI Debit Confirmation']
  },
  disclaimer:
    'NEXUS is an alternative financial clarity and demonstration platform. It is not a licensed credit bureau and does not guarantee loan approval.',
  createdAt: '2026-10-12T15:30:00Z',
  updatedAt: '2026-10-12T15:30:00Z'
};

// -----------------------------------------------------------------------------
// Persona 2: Aarav Patel — Final Year CS Student & Python Tutor
// -----------------------------------------------------------------------------
const aaravProfile: UserProfile = {
  id: 'demo-aarav-patel',
  fullName: 'Aarav Patel',
  occupation: 'Student',
  monthlyIncomeRange: '₹15,000 - ₹25,000',
  location: 'Bengaluru, Karnataka',
  onboardingCompleted: true,
  createdAt: '2026-07-01T10:00:00Z',
  updatedAt: '2026-10-12T14:00:00Z'
};

const aaravRecords: FinancialRecord[] = [
  // October 2026
  {
    id: 'rec-a1-1',
    userId: 'demo-aarav-patel',
    recordType: 'Income',
    amount: 14000,
    recordDate: '2026-10-03',
    category: 'Freelance Work',
    description: 'Python & Data Structures Weekend Tutoring (4 Batches)',
    isRecurring: true,
    createdAt: '2026-10-03T10:00:00Z',
    updatedAt: '2026-10-03T10:00:00Z'
  },
  {
    id: 'rec-a1-2',
    userId: 'demo-aarav-patel',
    recordType: 'Income',
    amount: 6000,
    recordDate: '2026-10-07',
    category: 'Stipend / Allowance',
    description: 'College AI Research Lab Fellowship Stipend',
    isRecurring: true,
    createdAt: '2026-10-07T10:00:00Z',
    updatedAt: '2026-10-07T10:00:00Z'
  },
  {
    id: 'rec-a1-3',
    userId: 'demo-aarav-patel',
    recordType: 'Expense',
    amount: 4800,
    recordDate: '2026-10-05',
    category: 'Food & Groceries',
    description: 'Campus Hostel Monthly Mess Card Fee',
    isRecurring: true,
    createdAt: '2026-10-05T12:00:00Z',
    updatedAt: '2026-10-05T12:00:00Z'
  },
  {
    id: 'rec-a1-4',
    userId: 'demo-aarav-patel',
    recordType: 'Repayment',
    amount: 1650,
    recordDate: '2026-10-09',
    category: 'Loan & EMI Repayment',
    description: 'Refurbished Study Laptop EMI - Simpl Pay Later (On-time)',
    isRecurring: true,
    createdAt: '2026-10-09T09:00:00Z',
    updatedAt: '2026-10-09T09:00:00Z'
  },
  {
    id: 'rec-a1-5',
    userId: 'demo-aarav-patel',
    recordType: 'Expense',
    amount: 1800,
    recordDate: '2026-10-10',
    category: 'Education & Learning',
    description: 'Cloud Certification Exam Voucher (AWS Academy)',
    isRecurring: false,
    createdAt: '2026-10-10T14:00:00Z',
    updatedAt: '2026-10-10T14:00:00Z'
  },
  {
    id: 'rec-a1-6',
    userId: 'demo-aarav-patel',
    recordType: 'Savings',
    amount: 3500,
    recordDate: '2026-10-11',
    category: 'Savings',
    description: 'Digital Gold & High-yield Savings Account stash',
    isRecurring: true,
    createdAt: '2026-10-11T16:00:00Z',
    updatedAt: '2026-10-11T16:00:00Z'
  },

  // September 2026
  {
    id: 'rec-a1-7',
    userId: 'demo-aarav-patel',
    recordType: 'Income',
    amount: 12000,
    recordDate: '2026-09-04',
    category: 'Freelance Work',
    description: 'Python Weekend Tutoring Fees',
    isRecurring: true,
    createdAt: '2026-09-04T10:00:00Z',
    updatedAt: '2026-09-04T10:00:00Z'
  },
  {
    id: 'rec-a1-8',
    userId: 'demo-aarav-patel',
    recordType: 'Income',
    amount: 6000,
    recordDate: '2026-09-07',
    category: 'Stipend / Allowance',
    description: 'College AI Research Lab Fellowship Stipend',
    isRecurring: true,
    createdAt: '2026-09-07T10:00:00Z',
    updatedAt: '2026-09-07T10:00:00Z'
  },
  {
    id: 'rec-a1-9',
    userId: 'demo-aarav-patel',
    recordType: 'Repayment',
    amount: 1650,
    recordDate: '2026-09-09',
    category: 'Loan & EMI Repayment',
    description: 'Refurbished Study Laptop EMI - Simpl Pay Later (On-time)',
    isRecurring: true,
    createdAt: '2026-09-09T09:00:00Z',
    updatedAt: '2026-09-09T09:00:00Z'
  },
  {
    id: 'rec-a1-10',
    userId: 'demo-aarav-patel',
    recordType: 'Expense',
    amount: 4800,
    recordDate: '2026-09-06',
    category: 'Food & Groceries',
    description: 'Campus Hostel Monthly Mess Card Fee',
    isRecurring: true,
    createdAt: '2026-09-06T12:00:00Z',
    updatedAt: '2026-09-06T12:00:00Z'
  }
];

const aaravMetrics = calculateFinancialMetrics(aaravRecords);

const aaravPassport: FinancialPassport = {
  id: 'passport-aarav-patel-2026',
  userId: 'demo-aarav-patel',
  userName: 'Aarav Patel',
  occupation: 'Student',
  version: 1,
  status: 'Active',
  passportHeadline: 'Disciplined University Scholar with Consistent Tutoring Earnings & Micro-EMI Track Record',
  incomeStabilityLabel: 'Developing & Reliable',
  repaymentDisciplineLabel: '100% On-Time Record (2 micro-EMIs)',
  savingsHabitLabel: 'Budding Saver (~25% retained)',
  profileCompleteness: 85,
  lastAnalysisDate: '2026-10-12T14:30:00Z',
  metrics: aaravMetrics,
  trustScore: calculateFinancialTrustScore(aaravRecords, aaravProfile),
  aiInsights: {
    summary:
      'Aarav manages a disciplined student budget, earning ₹18,000–₹20,000 monthly through teaching and research. He comfortably services his educational laptop micro-installment while keeping 25% for emergency savings.',
    positiveIndicators: [
      'Low expense pressure: Fixed hostel food and utility costs are well within his personal tutoring earnings.',
      'Zero payment delays: Both scheduled laptop installments paid on schedule.',
      'Active dual income channels: Combines university research grant with independent private tutoring.'
    ],
    areasForAttention: [
      'Modest absolute balance: Emergency cushion is small in absolute rupee terms (under ₹10,000), making him sensitive to sudden expenses.',
      'Short financial history: 2 months of tracked records.'
    ],
    actionableSuggestions: [
      'Continue logging monthly tutoring receipts to demonstrate steady earning power before graduation.',
      'Avoid high-cost Buy-Now-Pay-Later offers for discretionary consumer gadgets.',
      'Maintain an active savings balance of ₹15,000 prior to applying for post-graduate education credit.'
    ],
    missingInformation: [
      'University student ID card verification and semester grade card would substantiate student status.'
    ],
    modelUsed: 'gemini-2.5-flash'
  },
  supportingDocsSummary: {
    totalUploaded: 1,
    types: ['Student Fellowship Sanction Letter']
  },
  disclaimer:
    'NEXUS is an alternative financial clarity and demonstration platform. It is not a licensed credit bureau and does not guarantee loan approval.',
  createdAt: '2026-10-12T14:30:00Z',
  updatedAt: '2026-10-12T14:30:00Z'
};

// -----------------------------------------------------------------------------
// Persona 3: Vikram Malhotra — Artisanal Roastery & Café Owner (Small Business)
// -----------------------------------------------------------------------------
const vikramProfile: UserProfile = {
  id: 'demo-vikram-malhotra',
  fullName: 'Vikram Malhotra',
  occupation: 'Small Business Owner',
  monthlyIncomeRange: '₹1,20,000 - ₹2,00,000',
  location: 'Jaipur, Rajasthan',
  onboardingCompleted: true,
  createdAt: '2026-05-15T09:00:00Z',
  updatedAt: '2026-10-15T18:00:00Z'
};

const vikramRecords: FinancialRecord[] = [
  // October 2026
  {
    id: 'rec-v1-1',
    userId: 'demo-vikram-malhotra',
    recordType: 'Income',
    amount: 98000,
    recordDate: '2026-10-06',
    category: 'Business Income',
    description: 'UPI QR Counter Sales & Café Daily Footfall (Batch 1)',
    isRecurring: true,
    createdAt: '2026-10-06T20:00:00Z',
    updatedAt: '2026-10-06T20:00:00Z'
  },
  {
    id: 'rec-v1-2',
    userId: 'demo-vikram-malhotra',
    recordType: 'Income',
    amount: 54000,
    recordDate: '2026-10-10',
    category: 'Business Income',
    description: 'Corporate Diwali Hamper & Roasted Bean Gift Box Order',
    isRecurring: false,
    createdAt: '2026-10-10T14:00:00Z',
    updatedAt: '2026-10-10T14:00:00Z'
  },
  {
    id: 'rec-v1-3',
    userId: 'demo-vikram-malhotra',
    recordType: 'Expense',
    amount: 32000,
    recordDate: '2026-10-03',
    category: 'Rent & Housing',
    description: 'Café Commercial High-Street Lease & Maintenance',
    isRecurring: true,
    createdAt: '2026-10-03T11:00:00Z',
    updatedAt: '2026-10-03T11:00:00Z'
  },
  {
    id: 'rec-v1-4',
    userId: 'demo-vikram-malhotra',
    recordType: 'Expense',
    amount: 28500,
    recordDate: '2026-10-05',
    category: 'Work Supplies / Tools',
    description: 'Estate Arabica Green Bean Wholesale Consignment & Dairy',
    isRecurring: false,
    createdAt: '2026-10-05T13:00:00Z',
    updatedAt: '2026-10-05T13:00:00Z'
  },
  {
    id: 'rec-v1-5',
    userId: 'demo-vikram-malhotra',
    recordType: 'Repayment',
    amount: 8500,
    recordDate: '2026-10-08',
    category: 'Loan & EMI Repayment',
    description: 'La Marzocco Espresso Machine MSME Equipment Loan (Auto-debit)',
    isRecurring: true,
    createdAt: '2026-10-08T10:00:00Z',
    updatedAt: '2026-10-08T10:00:00Z'
  },
  {
    id: 'rec-v1-6',
    userId: 'demo-vikram-malhotra',
    recordType: 'Expense',
    amount: 22000,
    recordDate: '2026-10-09',
    category: 'Utilities & Bills',
    description: 'Roasting Unit 3-Phase Commercial Power & Water Supply',
    isRecurring: true,
    createdAt: '2026-10-09T15:00:00Z',
    updatedAt: '2026-10-09T15:00:00Z'
  },
  {
    id: 'rec-v1-7',
    userId: 'demo-vikram-malhotra',
    recordType: 'Savings',
    amount: 15000,
    recordDate: '2026-10-11',
    category: 'Savings',
    description: 'HDFC Business Liquidity Reserve Sweep',
    isRecurring: true,
    createdAt: '2026-10-11T12:00:00Z',
    updatedAt: '2026-10-11T12:00:00Z'
  },

  // September 2026
  {
    id: 'rec-v1-8',
    userId: 'demo-vikram-malhotra',
    recordType: 'Income',
    amount: 142000,
    recordDate: '2026-09-28',
    category: 'Business Income',
    description: 'Monthly In-Store Dining & Delivery Aggregator Payouts',
    isRecurring: true,
    createdAt: '2026-09-28T21:00:00Z',
    updatedAt: '2026-09-28T21:00:00Z'
  },
  {
    id: 'rec-v1-9',
    userId: 'demo-vikram-malhotra',
    recordType: 'Expense',
    amount: 32000,
    recordDate: '2026-09-03',
    category: 'Rent & Housing',
    description: 'Café Commercial High-Street Lease',
    isRecurring: true,
    createdAt: '2026-09-03T11:00:00Z',
    updatedAt: '2026-09-03T11:00:00Z'
  },
  {
    id: 'rec-v1-10',
    userId: 'demo-vikram-malhotra',
    recordType: 'Expense',
    amount: 36000,
    recordDate: '2026-09-12',
    category: 'Work Supplies / Tools',
    description: 'Bakery Ingredients, Biodegradable Cups & Coffee Packaging',
    isRecurring: false,
    createdAt: '2026-09-12T16:00:00Z',
    updatedAt: '2026-09-12T16:00:00Z'
  },
  {
    id: 'rec-v1-11',
    userId: 'demo-vikram-malhotra',
    recordType: 'Repayment',
    amount: 8500,
    recordDate: '2026-09-08',
    category: 'Loan & EMI Repayment',
    description: 'La Marzocco Espresso Machine MSME Equipment Loan (Auto-debit)',
    isRecurring: true,
    createdAt: '2026-09-08T10:00:00Z',
    updatedAt: '2026-09-08T10:00:00Z'
  },
  {
    id: 'rec-v1-12',
    userId: 'demo-vikram-malhotra',
    recordType: 'Savings',
    amount: 18000,
    recordDate: '2026-09-30',
    category: 'Savings',
    description: 'Business Tax & Capex Contingency Reserve',
    isRecurring: true,
    createdAt: '2026-09-30T17:00:00Z',
    updatedAt: '2026-09-30T17:00:00Z'
  },

  // August 2026
  {
    id: 'rec-v1-13',
    userId: 'demo-vikram-malhotra',
    recordType: 'Income',
    amount: 125000,
    recordDate: '2026-08-30',
    category: 'Business Income',
    description: 'Monthly Café Operations & Direct Roaster Bean Dispatches',
    isRecurring: true,
    createdAt: '2026-08-30T20:00:00Z',
    updatedAt: '2026-08-30T20:00:00Z'
  },
  {
    id: 'rec-v1-14',
    userId: 'demo-vikram-malhotra',
    recordType: 'Expense',
    amount: 32000,
    recordDate: '2026-08-03',
    category: 'Rent & Housing',
    description: 'Café Commercial High-Street Lease',
    isRecurring: true,
    createdAt: '2026-08-03T11:00:00Z',
    updatedAt: '2026-08-03T11:00:00Z'
  },
  {
    id: 'rec-v1-15',
    userId: 'demo-vikram-malhotra',
    recordType: 'Expense',
    amount: 29000,
    recordDate: '2026-08-14',
    category: 'Work Supplies / Tools',
    description: 'Roasted Coffee Packaging & Monsoon Storage Silos',
    isRecurring: false,
    createdAt: '2026-08-14T14:00:00Z',
    updatedAt: '2026-08-14T14:00:00Z'
  },
  {
    id: 'rec-v1-16',
    userId: 'demo-vikram-malhotra',
    recordType: 'Repayment',
    amount: 8500,
    recordDate: '2026-08-08',
    category: 'Loan & EMI Repayment',
    description: 'La Marzocco Espresso Machine MSME Equipment Loan (Auto-debit)',
    isRecurring: true,
    createdAt: '2026-08-08T10:00:00Z',
    updatedAt: '2026-08-08T10:00:00Z'
  }
];

const vikramMetrics = calculateFinancialMetrics(vikramRecords);

const vikramPassport: FinancialPassport = {
  id: 'passport-vikram-malhotra-2026',
  userId: 'demo-vikram-malhotra',
  userName: 'Vikram Malhotra',
  occupation: 'Small Business Owner',
  version: 1,
  status: 'Active',
  passportHeadline: 'Established Food & Beverage Business Owner with Verified Equipment EMI & Healthy Working Capital Buffer',
  incomeStabilityLabel: 'High Turnover & Active Ledger',
  repaymentDisciplineLabel: '100% On-Time MSME Equipment Record (3 cycles)',
  savingsHabitLabel: 'Consistent Working Capital Reserves (~28% retained)',
  profileCompleteness: 94,
  lastAnalysisDate: '2026-10-15T18:30:00Z',
  metrics: vikramMetrics,
  trustScore: calculateFinancialTrustScore(vikramRecords, vikramProfile),
  aiInsights: {
    summary:
      'Vikram operates an artisanal café generating ₹1.4L–₹1.5L in monthly turnover. He maintains healthy operating margins with ₹35,000+ monthly net surplus after servicing commercial lease, wholesale inventory, and an active equipment EMI.',
    positiveIndicators: [
      'Strong commercial cash surplus: Consistently retains 25-30% of revenue as operating liquidity.',
      'Flawless MSME loan discipline: 3 out of 3 tracked commercial espresso machine EMIs debited on schedule without delay.',
      'Diversified retail and bulk orders: Combines daily in-store footfall with high-margin festive bulk orders.'
    ],
    areasForAttention: [
      'Commercial lease at ₹32,000/month represents the largest fixed overhead; keep 2 months lease in reserve.',
      'Inventory procurement fluctuates with harvest pricing — explore vendor quarterly price contracts.'
    ],
    actionableSuggestions: [
      'Upload quarterly GST return receipts (GSTR-3B) to formalize business revenue verification.',
      'Maintain ₹65,000 in liquid business sweeps to cushion against seasonal footfall variations.',
      'Structure bulk seasonal supplier orders with 30-day vendor trade credit terms.'
    ],
    missingInformation: [
      'GSTIN registration certificate and commercial utility billing records would complete MSME tier verification.'
    ],
    modelUsed: 'gemma-4-26b-a4b-it'
  },
  supportingDocsSummary: {
    totalUploaded: 3,
    types: ['FSSAI Food License', 'MSME Equipment Loan Sanction Letter', 'Commercial Lease Deed']
  },
  disclaimer:
    'NEXUS is an alternative financial clarity and demonstration platform. It is not a licensed credit bureau and does not guarantee loan approval.',
  createdAt: '2026-10-15T18:30:00Z',
  updatedAt: '2026-10-15T18:30:00Z'
};

export const DEMO_PERSONAS: Record<string, DemoPersona> = {
  // Primary semantic keys
  student: {
    id: 'aarav',
    name: 'Aarav Patel',
    tagline: 'Student & Tutor — Limited Income, Developing Credit (Bengaluru)',
    profile: aaravProfile,
    records: aaravRecords,
    passport: aaravPassport
  },
  freelancer: {
    id: 'priya',
    name: 'Priya Sharma',
    tagline: 'Freelance UX Designer — Irregular Income, Active Retainer (Pune)',
    profile: priyaProfile,
    records: priyaRecords,
    passport: priyaPassport
  },
  business: {
    id: 'vikram',
    name: 'Vikram Malhotra',
    tagline: 'Small Business Owner — Operating Expenses, Roastery & Café (Jaipur)',
    profile: vikramProfile,
    records: vikramRecords,
    passport: vikramPassport
  },
  // Backward compatibility keys
  priya: {
    id: 'priya',
    name: 'Priya Sharma',
    tagline: 'Freelance UX Designer & Consultant (Pune)',
    profile: priyaProfile,
    records: priyaRecords,
    passport: priyaPassport
  },
  aarav: {
    id: 'aarav',
    name: 'Aarav Patel',
    tagline: 'CS Student & Part-time Python Tutor (Bengaluru)',
    profile: aaravProfile,
    records: aaravRecords,
    passport: aaravPassport
  },
  vikram: {
    id: 'vikram',
    name: 'Vikram Malhotra',
    tagline: 'Small Business Owner — Roastery & Café (Jaipur)',
    profile: vikramProfile,
    records: vikramRecords,
    passport: vikramPassport
  }
};

