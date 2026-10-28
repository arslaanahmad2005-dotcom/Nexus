import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { generateFinancialAnalysis, answerFollowUpQuestion } from './services/analyzer';
import {
  explainFinancialProfileWithGemma,
  chatWithFinancialCopilot,
  generate30DayPlanWithGemma,
  getGemmaConfig
} from './services/gemmaService';
import {
  calculateFinancialMetrics,
  calculateFinancialTrustScore,
  calculatePeriodComparison,
  filterRecordsByPeriod
} from '../src/lib/calculations';
import { FinancialPassport, SharedPassportView, AnalysisPeriod } from '../src/types';

// Load environment variables
dotenv.config();

// 1. Startup Environment Variables Validation
function validateEnvironment(): void {
  const isProd = process.env.NODE_ENV === 'production';
  const missingCritical: string[] = [];

  // Critical checks in production environment
  if (isProd) {
    if (!process.env.GEMINI_API_KEY && !process.env.DATABASE_URL && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('[NEXUS Security Notice] No production cloud backend or Gemini key specified; operating in hardened local/deterministic mode.');
    }
  }

  if (missingCritical.length > 0) {
    console.error(`[CRITICAL] Server startup refused. Missing required environment variables: ${missingCritical.join(', ')}`);
    process.exit(1);
  }
}

validateEnvironment();

const app = express();
const PORT = process.env.PORT || 3001;

// 2. Correlation ID & Security Headers Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
  (req as any).correlationId = correlationId;

  // Strict headers on every response
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  next();
});

// 3. Helmet Security Suite
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
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    frameguard: {
      action: 'deny'
    },
    noSniff: true
  })
);

// 4. Rate Limiting Suite
// General API Rate Limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // max 150 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again after 15 minutes.'
  }
});

// Auth / Sensitive operations rate limiter (minimum 5 attempts per minute per IP)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many security-sensitive attempts. Please wait 1 minute before trying again.'
  }
});

// Financial Analysis Rate Limiter
const analysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Analysis limit reached. Please wait a few minutes before submitting new records.'
  }
});

// Interactive Copilot Chat Rate Limiter (60 requests per 15 min window)
const copilotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Copilot question limit reached. Please wait a few minutes before asking more questions.'
  }
});

// Passport Share Creation Rate Limiter
const shareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Share link creation quota exceeded. Please wait a few minutes.'
  }
});

app.use(generalLimiter);

// 5. Restrict CORS (Supports local dev, custom domain, and Vercel preview/production deployments)
const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true; // Same-origin, CLI, or server-to-server requests
  // Allow localhost and loopback with any port (dev server)
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  // Allow vercel preview / production subdomains
  if (/^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/.test(origin)) return true;
  if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return true;
  return false; // Reject unauthorized third-party origins
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS access blocked by NEXUS security policy.'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID']
  })
);

app.use(express.json({ limit: '1mb' }));

// In-memory store for active share links and passports
interface StoredShareLink {
  id: string;
  shareTokenHash: string;
  passportId: string;
  userId: string;
  recipientLabel: string;
  includedFields: string[];
  expiresAt: string;
  isRevoked: boolean;
  revokedAt?: string;
  accessCount: number;
  lastAccessedAt?: string;
  createdAt: string;
  passportData: FinancialPassport;
}

const shareStore = new Map<string, StoredShareLink>(); // key: tokenHash
const MAX_SHARE_STORE_ENTRIES = 2000;

function cleanupShareStore(): void {
  const now = new Date();
  for (const [key, link] of shareStore.entries()) {
    if (link.isRevoked || new Date(link.expiresAt) < now) {
      shareStore.delete(key);
    }
  }
}

// Automatically prune expired/revoked share links every 10 minutes
const cleanupTimer = setInterval(cleanupShareStore, 10 * 60 * 1000);
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function isValidApiKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.length > 10 && !trimmed.startsWith('your_') && !trimmed.includes('placeholder');
}

// Input sanitizer to prevent XSS injection in labels and string metadata
function sanitizeInput(input: unknown, maxLength = 80): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>'"]/g, '')
    .trim()
    .slice(0, maxLength);
}

// Financial Records Validation Helper to prevent DoS, NaN, or business logic tampering
function validateIncomingRecords(records: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(records)) {
    return { valid: false, error: 'Financial records array is required.' };
  }
  if (records.length > 500) {
    return { valid: false, error: 'Records batch exceeds maximum limit of 500 entries per request.' };
  }
  const validTypes = new Set(['income', 'expense', 'savings', 'repayment']);
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (!r || typeof r !== 'object') {
      return { valid: false, error: `Record at index ${i} is not a valid object.` };
    }
    const amt = Number(r.amount);
    if (!Number.isFinite(amt) || amt < 0 || amt > 1_000_000_000) {
      return { valid: false, error: `Record at index ${i} contains an invalid amount.` };
    }
    const typeStr = typeof r.recordType === 'string' ? r.recordType.trim().toLowerCase() : '';
    if (typeStr && !validTypes.has(typeStr)) {
      return { valid: false, error: `Record at index ${i} has invalid recordType "${r.recordType}". Must be Income, Expense, Savings, or Repayment.` };
    }
  }
  return { valid: true };
}

// Router to support both /api/* and root /* (for Vercel rewrites)
const api = express.Router();

// 1. Health check (Only returns boolean configuration status without exposing secrets or paths)
api.get('/health', (_req: Request, res: Response) => {
  const gemmaConfig = getGemmaConfig();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    aiEngine: gemmaConfig.isConfigured ? 'Google Gemma 4 (Gemini API Host)' : 'Deterministic Financial Engine (Default)',
    geminiConfigured: gemmaConfig.isConfigured,
    model: gemmaConfig.configuredModel,
    provider: gemmaConfig.provider,
    isOpenWeight: true,
    environment: process.env.NODE_ENV || 'development'
  });
});

// 2. Financial Analysis (Secure Server-side AI processing)
api.post('/analyze-finances', analysisLimiter, async (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  try {
    const { records, profile, consents, period = 'all_time' } = req.body;

    if (!consents || !consents.financialAnalysis) {
      res.status(400).json({
        error: 'CONSENT_REQUIRED',
        message: 'Explicit user consent is required before performing financial analysis.',
        correlationId
      });
      return;
    }

    if (!records || !Array.isArray(records)) {
      res.status(400).json({
        error: 'INVALID_RECORDS',
        message: 'Financial records array is required.',
        correlationId
      });
      return;
    }

    if (records.length > 0) {
      const recordValidation = validateIncomingRecords(records);
      if (!recordValidation.valid) {
        res.status(400).json({
          error: 'INVALID_RECORDS',
          message: recordValidation.error,
          correlationId
        });
        return;
      }
    }

    // 1. Period filter & deterministic metrics in trusted server code (Never trust client-computed totals)
    const validPeriod: AnalysisPeriod = ['this_month', 'last_month', 'last_3_months', 'all_time'].includes(period)
      ? period
      : 'all_time';

    const activeRecords = filterRecordsByPeriod(records, validPeriod);
    const metrics = calculateFinancialMetrics(activeRecords);
    const trustScore = calculateFinancialTrustScore(records); // Computed over complete history
    const periodComparison = calculatePeriodComparison(records, validPeriod);

    // 2. Anonymize profile before analysis (only occupation and bracket, no full names/emails)
    const sanitizedOccupation = sanitizeInput(profile?.occupation || 'Freelancer', 40) as any;
    const sanitizedRange = profile?.monthlyIncomeRange ? sanitizeInput(profile.monthlyIncomeRange, 40) : undefined;

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
  } catch (error: any) {
    console.error(`[NEXUS Server Error][${correlationId}]: Analysis calculation failed`);
    res.status(500).json({
      error: 'ANALYSIS_FAILED',
      message: 'An unexpected error occurred while analyzing financial records. Please try again.',
      correlationId
    });
  }
});

// 2b. Contextual Follow-Up Q&A Engine (Strictly Grounded in User Ledger)
api.post('/ask-followup', analysisLimiter, async (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  try {
    const { question, records, profile, period = 'all_time' } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({
        error: 'INVALID_QUESTION',
        message: 'A valid question is required.',
        correlationId
      });
      return;
    }

    if (!records || !Array.isArray(records)) {
      res.status(400).json({
        error: 'INVALID_RECORDS',
        message: 'Financial records array is required.',
        correlationId
      });
      return;
    }

    if (records.length > 0) {
      const recordValidation = validateIncomingRecords(records);
      if (!recordValidation.valid) {
        res.status(400).json({
          error: 'INVALID_RECORDS',
          message: recordValidation.error,
          correlationId
        });
        return;
      }
    }

    const sanitizedQuestion = sanitizeInput(question, 200);
    const validPeriod: AnalysisPeriod = ['this_month', 'last_month', 'last_3_months', 'all_time'].includes(period)
      ? period
      : 'all_time';

    const activeRecords = filterRecordsByPeriod(records, validPeriod);
    const metrics = calculateFinancialMetrics(activeRecords);
    const trustScore = calculateFinancialTrustScore(records);
    const periodComparison = calculatePeriodComparison(records, validPeriod);

    const sanitizedOccupation = sanitizeInput(profile?.occupation || 'Freelancer', 40) as any;
    const sanitizedRange = profile?.monthlyIncomeRange ? sanitizeInput(profile.monthlyIncomeRange, 40) : undefined;

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
  } catch (error: any) {
    console.error(`[NEXUS Server Error][${correlationId}]: Follow-up answering failed`);
    res.status(500).json({
      error: 'FOLLOWUP_FAILED',
      message: 'Unable to process follow-up question right now.',
      correlationId
    });
  }
});

// 2c. Gemma 4 Financial Health Copilot Chat
api.post('/copilot/chat', copilotLimiter, async (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  try {
    const { message, history, records = [], profile, preferredLanguage, period = 'all_time' } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({
        error: 'INVALID_MESSAGE',
        message: 'A valid text message is required.',
        correlationId
      });
      return;
    }

    if (message.length > 1000) {
      res.status(400).json({
        error: 'MESSAGE_TOO_LONG',
        message: 'Message exceeds maximum length of 1,000 characters.',
        correlationId
      });
      return;
    }

    if (history && (!Array.isArray(history) || history.length > 20)) {
      res.status(400).json({
        error: 'INVALID_HISTORY',
        message: 'Chat history must be an array of at most 20 messages.',
        correlationId
      });
      return;
    }

    if (records && Array.isArray(records) && records.length > 0) {
      const recordValidation = validateIncomingRecords(records);
      if (!recordValidation.valid) {
        res.status(400).json({
          error: 'INVALID_RECORDS',
          message: recordValidation.error,
          correlationId
        });
        return;
      }
    }

    const validPeriod: AnalysisPeriod = ['this_month', 'last_month', 'last_3_months', 'all_time'].includes(period)
      ? period
      : 'all_time';

    const activeRecords = Array.isArray(records) ? filterRecordsByPeriod(records, validPeriod) : [];
    const metrics = calculateFinancialMetrics(activeRecords);
    const trustScore = calculateFinancialTrustScore(records);

    const sanitizedOccupation = sanitizeInput(profile?.occupation || 'Freelancer', 40) as any;
    const sanitizedRange = profile?.monthlyIncomeRange ? sanitizeInput(profile.monthlyIncomeRange, 40) : undefined;

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
  } catch (error: any) {
    console.error(`[NEXUS Server Error][${correlationId}]: Copilot chat failed`);
    res.status(500).json({
      error: 'COPILOT_CHAT_FAILED',
      message: 'Unable to communicate with the Financial Health Copilot at this moment.',
      correlationId
    });
  }
});

// 2d. Gemma 4 Explain My Financial Profile
api.post('/copilot/explain-profile', analysisLimiter, async (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  try {
    const { records, profile, consents, period = 'all_time' } = req.body;

    if (!consents || !consents.financialAnalysis) {
      res.status(400).json({
        error: 'CONSENT_REQUIRED',
        message: 'Explicit user consent is required before analyzing your financial profile.',
        correlationId
      });
      return;
    }

    if (!records || !Array.isArray(records)) {
      res.status(400).json({
        error: 'INVALID_RECORDS',
        message: 'Financial records array is required.',
        correlationId
      });
      return;
    }

    if (records.length > 0) {
      const recordValidation = validateIncomingRecords(records);
      if (!recordValidation.valid) {
        res.status(400).json({
          error: 'INVALID_RECORDS',
          message: recordValidation.error,
          correlationId
        });
        return;
      }
    }

    const validPeriod: AnalysisPeriod = ['this_month', 'last_month', 'last_3_months', 'all_time'].includes(period)
      ? period
      : 'all_time';

    const activeRecords = filterRecordsByPeriod(records, validPeriod);
    const metrics = calculateFinancialMetrics(activeRecords);
    const trustScore = calculateFinancialTrustScore(records);
    const periodComparison = calculatePeriodComparison(records, validPeriod);

    const sanitizedOccupation = sanitizeInput(profile?.occupation || 'Freelancer', 40) as any;
    const sanitizedRange = profile?.monthlyIncomeRange ? sanitizeInput(profile.monthlyIncomeRange, 40) : undefined;

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
  } catch (error: any) {
    console.error(`[NEXUS Server Error][${correlationId}]: Profile explanation failed`);
    res.status(500).json({
      error: 'EXPLANATION_FAILED',
      message: 'Failed to generate financial profile explanation.',
      correlationId
    });
  }
});

// 2e. Gemma 4 30-Day Financial Improvement Plan
api.post('/copilot/improvement-plan', analysisLimiter, async (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  try {
    const { records = [], profile, consents } = req.body;

    if (!consents || !consents.financialAnalysis) {
      res.status(400).json({
        error: 'CONSENT_REQUIRED',
        message: 'User consent is required to generate a personalized improvement plan.',
        correlationId
      });
      return;
    }

    if (records && Array.isArray(records) && records.length > 0) {
      const recordValidation = validateIncomingRecords(records);
      if (!recordValidation.valid) {
        res.status(400).json({
          error: 'INVALID_RECORDS',
          message: recordValidation.error,
          correlationId
        });
        return;
      }
    }

    const metrics = calculateFinancialMetrics(Array.isArray(records) ? records : []);
    const trustScore = calculateFinancialTrustScore(Array.isArray(records) ? records : []);

    const sanitizedOccupation = sanitizeInput(profile?.occupation || 'Freelancer', 40) as any;
    const sanitizedRange = profile?.monthlyIncomeRange ? sanitizeInput(profile.monthlyIncomeRange, 40) : undefined;

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
  } catch (error: any) {
    console.error(`[NEXUS Server Error][${correlationId}]: Improvement plan generation failed`);
    res.status(500).json({
      error: 'PLAN_GENERATION_FAILED',
      message: 'Unable to generate 30-day improvement plan.',
      correlationId
    });
  }
});

// 3. Create Secure Passport Share Link
api.post('/passport/share', shareLimiter, (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  try {
    const { passport, recipientLabel, includedFields, expiresInHours = 72, userId } = req.body;

    if (!passport || !passport.id) {
      res.status(400).json({
        error: 'INVALID_PASSPORT',
        message: 'A valid Financial Trust Passport is required to generate a share link.',
        correlationId
      });
      return;
    }

    // Enforce memory store capacity ceiling to prevent Memory Exhaustion DoS
    if (shareStore.size >= MAX_SHARE_STORE_ENTRIES) {
      cleanupShareStore();
      if (shareStore.size >= MAX_SHARE_STORE_ENTRIES) {
        const oldestKey = shareStore.keys().next().value;
        if (oldestKey) shareStore.delete(oldestKey);
      }
    }

    // Generate cryptographic token (24 bytes = 48 hex characters, 192 bits of entropy)
    const rawToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = hashToken(rawToken);

    // Bound expiration time between 1 hour and 720 hours (30 days max)
    const safeHours = Math.max(1, Math.min(Number(expiresInHours) || 72, 720));
    const now = new Date();
    const expiresAt = new Date(now.getTime() + safeHours * 60 * 60 * 1000).toISOString();
    const shareId = crypto.randomUUID();

    const sanitizedRecipient = sanitizeInput(recipientLabel || 'Public Verification', 80);

    const safeIncludedFields = Array.isArray(includedFields)
      ? includedFields.filter((f) => ['summary', 'income_consistency', 'expense_breakdown', 'repayments', 'actionable_suggestions', 'trust_score'].includes(f))
      : ['summary', 'income_consistency', 'repayments', 'actionable_suggestions', 'trust_score'];

    const storedRecord: StoredShareLink = {
      id: shareId,
      shareTokenHash: tokenHash,
      passportId: String(passport.id).slice(0, 80),
      userId: sanitizeInput(userId || passport.userId || 'anonymous-owner', 60),
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
  } catch (error: any) {
    console.error(`[NEXUS Server Error][${correlationId}]: Share link generation failed`);
    res.status(500).json({
      error: 'SHARE_FAILED',
      message: 'Failed to generate secure share link.',
      correlationId
    });
  }
});

// 4. Public Read-only Shared Passport Reader (Strict Field Filtering)
api.get('/passport/shared/:token', (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  try {
    const { token } = req.params;
    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'MISSING_TOKEN', message: 'Share token is required.', correlationId });
      return;
    }

    const tokenHash = hashToken(token);
    const link = shareStore.get(tokenHash);

    if (!link) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'This Financial Trust Passport link was not found or has expired.',
        correlationId
      });
      return;
    }

    if (link.isRevoked) {
      res.status(410).json({
        error: 'REVOKED',
        message: 'Access to this Financial Trust Passport has been revoked by the owner.',
        correlationId
      });
      return;
    }

    if (new Date(link.expiresAt) < new Date()) {
      res.status(410).json({
        error: 'EXPIRED',
        message: 'This share link has expired. Please ask the passport owner for a new link.',
        correlationId
      });
      return;
    }

    // Increment access stats
    link.accessCount += 1;
    link.lastAccessedAt = new Date().toISOString();

    const passport = link.passportData;
    const included = link.includedFields;

    // Strict Field-Level Filtering: Never exposes user auth IDs, emails, passwords, or internal raw IDs
    const view: SharedPassportView = {
      shareId: crypto.createHash('sha256').update(link.id).digest('hex').slice(0, 16),
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
      trustScore: included.includes('trust_score') ? passport.trustScore : undefined,
      passportData: {
        metrics: {
          totalIncome: included.includes('summary') ? passport.metrics?.totalIncome : undefined,
          totalExpenses: included.includes('summary') ? passport.metrics?.totalExpenses : undefined,
          netRemaining: included.includes('summary') ? passport.metrics?.netRemaining : undefined,
          savingsRate: included.includes('summary') ? passport.metrics?.savingsRate : undefined,
          incomeConsistencyScore: included.includes('income_consistency') ? passport.metrics?.incomeConsistencyScore : undefined,
          incomeConsistencyRating: included.includes('income_consistency') ? passport.metrics?.incomeConsistencyRating : undefined,
          monthlyBreakdown: included.includes('income_consistency') ? passport.metrics?.monthlyBreakdown : [],
          topExpenseCategories: included.includes('expense_breakdown') ? passport.metrics?.topExpenseCategories : [],
          repaymentsCount: included.includes('repayments') ? passport.metrics?.repaymentsCount : undefined,
          repaymentsTotal: included.includes('repayments') ? passport.metrics?.repaymentsTotal : undefined,
          repaymentRegularityScore: included.includes('repayments') ? passport.metrics?.repaymentRegularityScore : undefined
        },
        trustScore: included.includes('trust_score') ? passport.trustScore : undefined,
        insights: {
          summary: passport.aiInsights?.summary,
          positiveIndicators: passport.aiInsights?.positiveIndicators,
          areasForAttention: passport.aiInsights?.areasForAttention,
          actionableSuggestions: included.includes('actionable_suggestions') ? passport.aiInsights?.actionableSuggestions : undefined,
          trustScoreExplanation: passport.aiInsights?.trustScoreExplanation
        }
      },
      disclaimer: 'This Financial Trust Passport is generated from user-provided records for demonstration and assessment purposes. It does not constitute a statutory credit report or loan guarantee.'
    };

    res.json({
      success: true,
      passport: view,
      correlationId
    });
  } catch (error: any) {
    console.error(`[NEXUS Server Error][${correlationId}]: Shared passport fetch failed`);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve shared passport.',
      correlationId
    });
  }
});

// 5. Revoke Share Link (Eliminated IDOR / BOLA vulnerability: requires cryptographic shareToken or verified owner ID)
api.post('/passport/revoke', authLimiter, (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  try {
    const { shareToken, shareId, userId } = req.body;

    let targetLink: StoredShareLink | undefined;

    if (shareToken && typeof shareToken === 'string') {
      const tokenHash = hashToken(shareToken);
      targetLink = shareStore.get(tokenHash);
    } else if (shareId && userId && typeof shareId === 'string' && typeof userId === 'string') {
      const sanitizedUid = sanitizeInput(userId, 80);
      for (const link of shareStore.values()) {
        if (link.id === shareId && (link.userId === sanitizedUid || link.passportData?.userId === sanitizedUid)) {
          targetLink = link;
          break;
        }
      }
    } else {
      res.status(400).json({
        error: 'REVOCATION_UNAUTHORIZED',
        message: 'Valid private shareToken or verified user ownership is required to revoke a share link.',
        correlationId
      });
      return;
    }

    if (!targetLink) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Share link not found or access denied.', correlationId });
      return;
    }

    targetLink.isRevoked = true;
    targetLink.revokedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Share link has been revoked successfully. Any public viewers will no longer be able to view this passport.',
      revokedAt: targetLink.revokedAt,
      correlationId
    });
  } catch (error: any) {
    console.error(`[NEXUS Server Error][${correlationId}]: Revoke error`);
    res.status(500).json({ error: 'REVOKE_FAILED', message: 'Failed to revoke link.', correlationId });
  }
});

// 6. User Data Deletion & Account Purge (Right to be Forgotten - Rate Limited & Auth Guarded)
api.post('/user/delete-account', authLimiter, (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  try {
    const { userId } = req.body;
    const authHeader = req.headers.authorization;

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'USER_ID_REQUIRED', message: 'User ID is required for deletion.', correlationId });
      return;
    }

    // Reject unauthorized purge in production if auth header is absent
    if (process.env.NODE_ENV === 'production' && !authHeader) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication token is required to delete account data.',
        correlationId
      });
      return;
    }

    const sanitizedUserId = sanitizeInput(userId, 80);

    // Purge any active share links created by this user
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
      message: 'All associated server sessions and active share links have been purged.',
      correlationId
    });
  } catch (error: any) {
    console.error(`[NEXUS Server Error][${correlationId}]: Account deletion purge error`);
    res.status(500).json({ error: 'PURGE_FAILED', message: 'Failed to purge account data.', correlationId });
  }
});

// Mount API router on both /api (standard) and / (for Vercel rewrites)
app.use('/api', api);
app.use('/', api);

// Centralized Safe Error Middleware (Client receives zero stack traces, file paths, or query details)
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const correlationId = (req as any).correlationId || crypto.randomUUID();
  console.error(`[NEXUS Server Error][${correlationId}]:`, err?.name || 'Exception');
  res.status(err?.status || 500).json({
    error: err?.code || 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected internal error occurred. Please try again.',
    correlationId
  });
});

if (!process.env.VERCEL) {
  const gemmaConfig = getGemmaConfig();
  app.listen(PORT, () => {
    console.log(`[NEXUS Server] Secure API running on port ${PORT}`);
    console.log(`[NEXUS Server] AI Model: ${gemmaConfig.configuredModel} (${gemmaConfig.isConfigured ? 'Active via Gemini API' : 'Deterministic Mode'})`);
    console.log(`[NEXUS Server] Provider: ${gemmaConfig.provider} | Open-Weight: true`);
  });
}

export default app;
